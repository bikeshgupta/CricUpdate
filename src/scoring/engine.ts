// ---------------------------------------------------------------------------
// CricUpdate scoring engine — a pure reducer.
//
// The authoritative data is an append-only `BallEvent[]`. The full scorecard is
// derived by replaying that log here. This keeps every cricket rule in one
// tested place and makes "edit last ball" / "undo" trivial: change the array
// and recompute.
// ---------------------------------------------------------------------------

import type {
  BallEvent,
  BatterStats,
  BowlerStats,
  Innings,
  InningsState,
  MatchSettings,
  Team,
} from './types';

function emptyBatter(playerId: string): BatterStats {
  return { playerId, runs: 0, balls: 0, fours: 0, sixes: 0, out: false };
}

function emptyBowler(playerId: string): BowlerStats {
  return { playerId, ballsBowled: 0, runsConceded: 0, wickets: 0, maidens: 0 };
}

export function isLegalDelivery(ball: BallEvent, settings: MatchSettings): boolean {
  // A retirement isn't a delivery at all — it doesn't consume a ball.
  if (ball.wicketType === 'retired') return false;
  if (ball.extra === 'wide') return !settings.reBowlWide;
  if (ball.extra === 'noball') return !settings.reBowlNoBall;
  return true;
}

export function formatOvers(legalBalls: number): string {
  return `${Math.floor(legalBalls / 6)}.${legalBalls % 6}`;
}

/** Per-ball token shown in the "this over" strip. */
export function ballToken(ball: BallEvent, settings: MatchSettings): string {
  const ran = effectiveExtraRuns(ball, settings);
  if (ball.isWicket) {
    if (ball.wicketType === 'retired') return 'Ret';
    // A wide/no-ball that also produced a wicket (run out) shows both.
    if (ball.extra === 'wide') return `${ran ? ran : ''}Wd+W`;
    if (ball.extra === 'noball') return `${ball.batterRuns || ''}Nb+W`;
    return ball.batterRuns ? `${ball.batterRuns}+W` : 'W';
  }
  switch (ball.extra) {
    case 'wide':
      return ran > 0 ? `${ran}Wd` : 'Wd';
    case 'noball':
      return `${ball.batterRuns + ran}Nb`;
    case 'bye':
      return `${ran}B`;
    case 'legbye':
      return `${ran}Lb`;
    default:
      return ball.batterRuns === 0 ? '•' : String(ball.batterRuns);
  }
}

/**
 * Runs that were actually run / taken beyond any penalty, after applying the
 * "runs allowed on wide" and gender rules. Used for both totals and rotation.
 */
function effectiveExtraRuns(ball: BallEvent, settings: MatchSettings): number {
  if (ball.extra === 'wide') {
    if (!settings.runsAllowedOnWide) return 0;
    return ball.extraRuns;
  }
  return ball.extraRuns;
}

interface ChargedRuns {
  /** Added to the team total. */
  team: number;
  /** Charged against the bowler's figures. */
  bowler: number;
  /** Credited to the striker. */
  batter: number;
  /** Extras buckets. */
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  /** Runs that drive strike rotation (i.e. were physically run). */
  rotation: number;
}

function chargeBall(
  ball: BallEvent,
  settings: MatchSettings,
  strikerIsLady: boolean,
): ChargedRuns {
  const c: ChargedRuns = {
    team: 0,
    bowler: 0,
    batter: 0,
    wides: 0,
    noBalls: 0,
    byes: 0,
    legByes: 0,
    rotation: 0,
  };

  switch (ball.extra) {
    case 'wide': {
      // Gender rule: ladies cannot run off a wide.
      const canRun =
        settings.runsAllowedOnWide && !(strikerIsLady && settings.noRunsOnWideForLadies);
      const ran = canRun ? ball.extraRuns : 0;
      const total = settings.wideRuns + ran;
      c.team = total;
      c.bowler = total;
      c.wides = total;
      c.rotation = ran;
      break;
    }
    case 'noball': {
      const total = settings.noBallRuns + ball.batterRuns + ball.extraRuns;
      c.team = total;
      c.bowler = total;
      c.batter = ball.batterRuns;
      c.noBalls = settings.noBallRuns + ball.extraRuns;
      c.rotation = ball.batterRuns + ball.extraRuns;
      break;
    }
    case 'bye': {
      c.team = ball.extraRuns;
      c.byes = ball.extraRuns;
      c.rotation = ball.extraRuns;
      break;
    }
    case 'legbye': {
      c.team = ball.extraRuns;
      c.legByes = ball.extraRuns;
      c.rotation = ball.extraRuns;
      break;
    }
    default: {
      c.team = ball.batterRuns;
      c.bowler = ball.batterRuns;
      c.batter = ball.batterRuns;
      c.rotation = ball.batterRuns;
    }
  }
  return c;
}

/**
 * Replay an innings log into a full, read-only scorecard.
 */
export function computeInnings(
  innings: Innings,
  settings: MatchSettings,
  battingTeam: Team,
): InningsState {
  const isLady = (id: string | undefined) =>
    !!id && battingTeam.players.find((p) => p.id === id)?.category === 'ladies';

  const batters: Record<string, BatterStats> = {};
  const bowlers: Record<string, BowlerStats> = {};
  const battingOrder: string[] = [];
  const extras = { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 };

  const ensureBatter = (id: string) => {
    if (!batters[id]) {
      batters[id] = emptyBatter(id);
      battingOrder.push(id);
    }
    return batters[id];
  };
  const ensureBowler = (id: string) => (bowlers[id] ??= emptyBowler(id));

  if (innings.openingStrikerId) ensureBatter(innings.openingStrikerId);
  if (innings.openingNonStrikerId) ensureBatter(innings.openingNonStrikerId);

  let totalRuns = 0;
  let wickets = 0;
  let legalBalls = 0;

  // Per-over accumulator for maiden detection (one bowler per over).
  let overBowlerId: string | null = null;
  let overBowlerRuns = 0;
  let overLegalBalls = 0;

  const flushOver = () => {
    if (overBowlerId && overLegalBalls === 6 && overBowlerRuns === 0) {
      ensureBowler(overBowlerId).maidens += 1;
    }
    overBowlerId = null;
    overBowlerRuns = 0;
    overLegalBalls = 0;
  };

  let freeHit = false;

  for (const ball of innings.balls) {
    const legal = isLegalDelivery(ball, settings);
    const striker = ensureBatter(ball.striker);
    ensureBatter(ball.nonStriker);
    const bowler = ensureBowler(ball.bowler);

    if (overBowlerId !== ball.bowler) {
      // New over started.
      flushOver();
      overBowlerId = ball.bowler;
    }

    const charged = chargeBall(ball, settings, isLady(ball.striker));
    totalRuns += charged.team;
    bowler.runsConceded += charged.bowler;
    overBowlerRuns += charged.bowler;
    striker.runs += charged.batter;
    extras.wides += charged.wides;
    extras.noBalls += charged.noBalls;
    extras.byes += charged.byes;
    extras.legByes += charged.legByes;

    if (ball.extra === 'none' && charged.batter === 4) striker.fours += 1;
    if (ball.extra === 'none' && charged.batter === 6) striker.sixes += 1;

    if (legal) {
      legalBalls += 1;
      overLegalBalls += 1;
      bowler.ballsBowled += 1;
      // A no-ball is not a legal ball, so balls faced is only bumped on legal
      // deliveries that the batter actually faced (not byes off the bat? byes
      // still count as a ball faced).
      striker.balls += 1;
    }

    // Wicket handling (respecting free-hit protection).
    if (ball.isWicket) {
      const wt = ball.wicketType;
      if (wt === 'retired') {
        // Not a dismissal: doesn't count toward wickets/all-out, and the
        // player remains selectable again as a replacement batter later.
        const outId = ball.dismissedPlayerId ?? ball.striker;
        ensureBatter(outId).retired = true;
      } else {
        const protectedByFreeHit = freeHit && wt !== 'runout';
        if (!protectedByFreeHit) {
          wickets += 1;
          const outId = ball.dismissedPlayerId ?? ball.striker;
          const outBatter = ensureBatter(outId);
          outBatter.out = true;
          outBatter.wicketType = wt;
          if (wt !== 'runout') {
            outBatter.outBowlerId = ball.bowler;
            bowler.wickets += 1;
          }
          outBatter.outFielderId = ball.fielderId;
        }
      }
    }

    // Next free-hit state: set after a no-ball if enabled, cleared otherwise.
    if (ball.extra === 'noball' && settings.freeHitAfterNoBall) freeHit = true;
    else if (legal) freeHit = false;

    if (legal && overLegalBalls === 6) flushOver();
  }

  extras.total = extras.wides + extras.noBalls + extras.byes + extras.legByes;

  const { strikerId, nonStrikerId, currentBowlerId, overJustCompleted } =
    nextOnStrike(innings, settings, legalBalls);

  // All out when only one batter remains (wickets == players - 1).
  const allOut = wickets >= Math.max(1, battingTeam.players.length - 1);
  const oversComplete = legalBalls >= settings.oversPerInnings * 6;
  const target = innings.target ?? null;
  const targetReached = target != null && totalRuns >= target;
  const isComplete = allOut || oversComplete || targetReached;

  const ballsRemaining = Math.max(0, settings.oversPerInnings * 6 - legalBalls);
  const runsRequired = target != null ? Math.max(0, target - totalRuns) : null;
  const requiredRunRate =
    target != null && ballsRemaining > 0 && runsRequired != null
      ? (runsRequired / ballsRemaining) * 6
      : null;

  return {
    battingTeamId: innings.battingTeamId,
    bowlingTeamId: innings.bowlingTeamId,
    totalRuns,
    wickets,
    legalBalls,
    oversText: formatOvers(legalBalls),
    extras,
    runRate: legalBalls > 0 ? (totalRuns / legalBalls) * 6 : 0,
    batters,
    bowlers,
    battingOrder,
    strikerId: isComplete ? null : strikerId,
    nonStrikerId: isComplete ? null : nonStrikerId,
    currentBowlerId: isComplete ? null : overJustCompleted ? null : currentBowlerId,
    freeHit: isComplete ? false : freeHit,
    isComplete,
    thisOver: currentOverTokens(innings, settings),
    target,
    runsRequired,
    ballsRemaining,
    requiredRunRate,
  };
}

/**
 * Determine who faces the next delivery from the last recorded ball, applying
 * run rotation, end-of-over rotation, and vacating the dismissed batter's slot.
 */
function nextOnStrike(innings: Innings, settings: MatchSettings, legalBalls: number) {
  const balls = innings.balls;
  if (balls.length === 0) {
    return {
      strikerId: innings.openingStrikerId,
      nonStrikerId: innings.openingNonStrikerId,
      currentBowlerId: innings.openingBowlerId,
      overJustCompleted: false,
    };
  }

  const last = balls[balls.length - 1];
  let striker: string | null = last.striker;
  let nonStriker: string | null = last.nonStriker;

  const charged = chargeBall(last, settings, false);
  if (charged.rotation % 2 === 1) {
    [striker, nonStriker] = [nonStriker, striker];
  }

  const overJustCompleted = isLegalDelivery(last, settings) && legalBalls % 6 === 0;
  if (overJustCompleted) {
    [striker, nonStriker] = [nonStriker, striker];
  }

  // Vacate the dismissed batter's slot (it now holds null → UI picks a batter).
  if (last.isWicket) {
    const protectedByFreeHit = false; // free-hit protection already applied to counts
    if (!protectedByFreeHit) {
      const outId = last.dismissedPlayerId ?? last.striker;
      if (striker === outId) striker = null;
      else if (nonStriker === outId) nonStriker = null;
    }
  }

  return {
    strikerId: striker,
    nonStrikerId: nonStriker,
    currentBowlerId: last.bowler,
    overJustCompleted,
  };
}

/** Tokens for the over currently in progress (resets each completed over). */
function currentOverTokens(innings: Innings, settings: MatchSettings): string[] {
  const tokens: string[] = [];
  let legalInOver = 0;
  for (const ball of innings.balls) {
    if (legalInOver === 6) {
      tokens.length = 0;
      legalInOver = 0;
    }
    tokens.push(ballToken(ball, settings));
    if (isLegalDelivery(ball, settings)) legalInOver += 1;
  }
  if (legalInOver === 6) return [];
  return tokens;
}
