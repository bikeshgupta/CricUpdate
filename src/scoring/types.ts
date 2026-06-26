// ---------------------------------------------------------------------------
// CricUpdate — domain types shared by the scoring engine, store, and UI.
// ---------------------------------------------------------------------------

export type PlayerCategory = 'gents' | 'ladies';

export interface Player {
  id: string;
  name: string;
  /** Used by the gender-based wide rule (no running on a wide for "ladies"). */
  category: PlayerCategory;
  /** Late arrivals / availability — purely informational for the engine. */
  active?: boolean;
}

export interface Team {
  id: string;
  name: string;
  players: Player[];
}

export type ExtraType = 'none' | 'wide' | 'noball' | 'bye' | 'legbye';

export type WicketType =
  | 'bowled'
  | 'caught'
  | 'lbw'
  | 'runout'
  | 'stumped'
  | 'hitwicket'
  | 'retired';

/**
 * One delivery. This is the append-only authoritative record — the entire
 * scorecard is *derived* by replaying a list of these. Each ball stores the
 * striker / non-striker / bowler that were on the field when it was bowled, so
 * replay never has to guess strike rotation or batting order.
 */
export interface BallEvent {
  id: string;
  striker: string;
  nonStriker: string;
  bowler: string;
  /** Runs scored off the bat (0–6). */
  batterRuns: number;
  extra: ExtraType;
  /** Additional runs physically run / byes taken on top of any extra penalty. */
  extraRuns: number;
  isWicket: boolean;
  wicketType?: WicketType;
  /** Defaults to the striker if omitted. */
  dismissedPlayerId?: string;
  fielderId?: string;
  /** Optional shot tag (id from SHOT_TYPES) used to enrich commentary. */
  shot?: string;
}

export interface MatchSettings {
  oversPerInnings: number;
  playersPerTeam: number;
  /** Penalty runs awarded for a wide / no-ball. */
  wideRuns: number;
  noBallRuns: number;
  /** When true the delivery is re-bowled (does not count as a legal ball). */
  reBowlWide: boolean;
  reBowlNoBall: boolean;
  /** Global toggle: may batters run (byes) off a wide. */
  runsAllowedOnWide: boolean;
  freeHitAfterNoBall: boolean;
  /** Gender rule: ladies cannot run off a wide even if runsAllowedOnWide. */
  noRunsOnWideForLadies: boolean;
}

export const DEFAULT_SETTINGS: MatchSettings = {
  oversPerInnings: 6,
  playersPerTeam: 11,
  wideRuns: 1,
  noBallRuns: 1,
  reBowlWide: true,
  reBowlNoBall: true,
  runsAllowedOnWide: true,
  freeHitAfterNoBall: false,
  noRunsOnWideForLadies: true,
};

// ---- Derived (read-only) state ---------------------------------------------

export interface BatterStats {
  playerId: string;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  out: boolean;
  wicketType?: WicketType;
  outBowlerId?: string;
  outFielderId?: string;
}

export interface BowlerStats {
  playerId: string;
  ballsBowled: number;
  runsConceded: number;
  wickets: number;
  maidens: number;
}

export interface ExtrasBreakdown {
  wides: number;
  noBalls: number;
  byes: number;
  legByes: number;
  total: number;
}

export interface InningsState {
  battingTeamId: string;
  bowlingTeamId: string;
  totalRuns: number;
  wickets: number;
  legalBalls: number;
  /** "14.2" style overs string. */
  oversText: string;
  extras: ExtrasBreakdown;
  runRate: number;
  batters: Record<string, BatterStats>;
  bowlers: Record<string, BowlerStats>;
  battingOrder: string[];
  /** Who is on strike for the *next* delivery (null = a new batter is needed). */
  strikerId: string | null;
  nonStrikerId: string | null;
  /** null = the over just finished and a new bowler must be chosen. */
  currentBowlerId: string | null;
  /** True when the next delivery is a free hit. */
  freeHit: boolean;
  isComplete: boolean;
  /** Display tokens for the over currently in progress, e.g. ["1","4","Wd","W"]. */
  thisOver: string[];
  /** Target for a chase (2nd innings); null otherwise. */
  target: number | null;
  /** Runs still required (2nd innings only). */
  runsRequired: number | null;
  ballsRemaining: number;
  requiredRunRate: number | null;
}

export interface Innings {
  battingTeamId: string;
  bowlingTeamId: string;
  openingStrikerId: string | null;
  openingNonStrikerId: string | null;
  openingBowlerId: string | null;
  balls: BallEvent[];
  /** Set on the 2nd innings = first-innings total + 1. */
  target?: number | null;
}

export type MatchStatus = 'setup' | 'toss' | 'innings1' | 'innings2' | 'complete';

export interface TossResult {
  callingTeamId: string;
  call: 'heads' | 'tails';
  outcome: 'heads' | 'tails';
  winnerTeamId: string;
  decision: 'bat' | 'bowl';
}

export interface Match {
  id: string;
  ownerUid: string;
  createdAt: number;
  status: MatchStatus;
  settings: MatchSettings;
  teamA: Team;
  teamB: Team;
  toss: TossResult | null;
  innings1: Innings | null;
  innings2: Innings | null;
  /** Final result line, set when status === 'complete'. */
  result: string | null;
}
