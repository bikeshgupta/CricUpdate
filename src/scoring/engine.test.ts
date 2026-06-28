import { describe, it, expect } from 'vitest';
import { computeInnings, formatOvers, ballToken } from './engine';
import { computeResult } from './match';
import {
  DEFAULT_SETTINGS,
  type BallEvent,
  type Innings,
  type Match,
  type MatchSettings,
  type Team,
} from './types';

// ---- test fixtures ---------------------------------------------------------

const team = (id: string, names: Array<[string, 'gents' | 'ladies']>): Team => ({
  id,
  name: id.toUpperCase(),
  players: names.map(([name, category], i) => ({ id: `${id}${i + 1}`, name, category })),
});

const batting = team('a', [
  ['A1', 'gents'],
  ['A2', 'gents'],
  ['A3', 'ladies'],
  ['A4', 'gents'],
  ['A5', 'gents'],
]);

let seq = 0;
function ball(partial: Partial<BallEvent> & { striker: string; nonStriker: string; bowler: string }): BallEvent {
  return {
    id: `b${seq++}`,
    batterRuns: 0,
    extra: 'none',
    extraRuns: 0,
    isWicket: false,
    ...partial,
  };
}

function inn(balls: BallEvent[], extra?: Partial<Innings>): Innings {
  return {
    battingTeamId: 'a',
    bowlingTeamId: 'b',
    openingStrikerId: 'a1',
    openingNonStrikerId: 'a2',
    openingBowlerId: 'b1',
    balls,
    ...extra,
  };
}

const settings = (o?: Partial<MatchSettings>): MatchSettings => ({ ...DEFAULT_SETTINGS, ...o });

// helper: a legal ball striker a1 vs a2 off b1
const legal = (runs: number) => ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', batterRuns: runs });

// ---- tests -----------------------------------------------------------------

describe('formatOvers', () => {
  it('formats balls into overs.balls', () => {
    expect(formatOvers(0)).toBe('0.0');
    expect(formatOvers(5)).toBe('0.5');
    expect(formatOvers(6)).toBe('1.0');
    expect(formatOvers(86)).toBe('14.2');
  });
});

describe('basic run scoring', () => {
  it('adds batter runs to team and batter, counts boundaries', () => {
    const s = computeInnings(inn([legal(4), legal(6), legal(1)]), settings(), batting);
    expect(s.totalRuns).toBe(11);
    // a1 hit 4 and 6 (10), then 1 run rotated so the 1 was faced by a1 too on
    // the 3rd ball before rotation.
    expect(s.batters['a1'].runs).toBe(11);
    expect(s.batters['a1'].fours).toBe(1);
    expect(s.batters['a1'].sixes).toBe(1);
    expect(s.batters['a1'].balls).toBe(3);
    expect(s.legalBalls).toBe(3);
    expect(s.oversText).toBe('0.3');
  });
});

describe('strike rotation', () => {
  it('swaps striker on odd runs', () => {
    const s = computeInnings(inn([legal(1)]), settings(), batting);
    expect(s.strikerId).toBe('a2');
    expect(s.nonStrikerId).toBe('a1');
  });

  it('keeps strike on even runs', () => {
    const s = computeInnings(inn([legal(2)]), settings(), batting);
    expect(s.strikerId).toBe('a1');
    expect(s.nonStrikerId).toBe('a2');
  });

  it('swaps at the end of an over', () => {
    const s = computeInnings(inn([legal(0), legal(0), legal(0), legal(0), legal(0), legal(0)]), settings(), batting);
    expect(s.legalBalls).toBe(6);
    // over complete -> strike swaps, and a new bowler is required
    expect(s.strikerId).toBe('a2');
    expect(s.nonStrikerId).toBe('a1');
    expect(s.currentBowlerId).toBeNull();
  });

  it('odd run on last ball of over cancels back to same striker', () => {
    const s = computeInnings(
      inn([legal(0), legal(0), legal(0), legal(0), legal(0), legal(1)]),
      settings(),
      batting,
    );
    // 1 run swaps, end of over swaps back
    expect(s.strikerId).toBe('a1');
  });
});

describe('maiden over', () => {
  it('counts a maiden when no runs charged to the bowler in the over', () => {
    const s = computeInnings(inn([legal(0), legal(0), legal(0), legal(0), legal(0), legal(0)]), settings(), batting);
    expect(s.bowlers['b1'].maidens).toBe(1);
    expect(s.bowlers['b1'].ballsBowled).toBe(6);
  });

  it('byes do not break a maiden but a run off the bat does', () => {
    const overWithBye = inn([
      legal(0),
      legal(0),
      legal(0),
      legal(0),
      legal(0),
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'bye', extraRuns: 2 }),
    ]);
    const s = computeInnings(overWithBye, settings(), batting);
    expect(s.bowlers['b1'].maidens).toBe(1);
    expect(s.extras.byes).toBe(2);
    expect(s.totalRuns).toBe(2);
  });
});

describe('wides', () => {
  it('adds the wide penalty, charges the bowler, and re-bowls (not a legal ball)', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'wide' })]),
      settings(),
      batting,
    );
    expect(s.totalRuns).toBe(1);
    expect(s.extras.wides).toBe(1);
    expect(s.legalBalls).toBe(0);
    expect(s.bowlers['b1'].runsConceded).toBe(1);
  });

  it('allows running byes off a wide for gents', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'wide', extraRuns: 2 })]),
      settings(),
      batting,
    );
    expect(s.totalRuns).toBe(3); // 1 penalty + 2 run
  });

  it('gender rule: ladies cannot run off a wide (only the penalty counts)', () => {
    // a3 is a lady; put her on strike
    const s = computeInnings(
      inn([ball({ striker: 'a3', nonStriker: 'a2', bowler: 'b1', extra: 'wide', extraRuns: 2 })], {
        openingStrikerId: 'a3',
      }),
      settings({ noRunsOnWideForLadies: true }),
      batting,
    );
    expect(s.totalRuns).toBe(1); // only the penalty
    expect(s.strikerId).toBe('a3'); // no rotation since no runs ran
  });

  it('global runsAllowedOnWide=false blocks running for everyone', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'wide', extraRuns: 3 })]),
      settings({ runsAllowedOnWide: false }),
      batting,
    );
    expect(s.totalRuns).toBe(1);
  });
});

describe('no-balls and free hit', () => {
  it('adds penalty plus runs off the bat, credits the batter, re-bowls', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'noball', batterRuns: 4 })]),
      settings(),
      batting,
    );
    expect(s.totalRuns).toBe(5); // 1 + 4
    expect(s.batters['a1'].runs).toBe(4);
    expect(s.batters['a1'].balls).toBe(0); // no-ball not a legal ball faced
    expect(s.extras.noBalls).toBe(1);
    expect(s.legalBalls).toBe(0);
  });

  it('protects the batter on a free hit for non-runout dismissals', () => {
    const balls = [
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'noball' }),
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'bowled' }),
    ];
    const s = computeInnings(inn(balls), settings({ freeHitAfterNoBall: true }), batting);
    expect(s.wickets).toBe(0); // bowled on a free hit -> not out
    expect(s.batters['a1'].out).toBe(false);
  });

  it('still allows a run-out on a free hit', () => {
    const balls = [
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'noball' }),
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'runout' }),
    ];
    const s = computeInnings(inn(balls), settings({ freeHitAfterNoBall: true }), batting);
    expect(s.wickets).toBe(1);
  });
});

describe('wickets', () => {
  it('counts a wicket, credits the bowler, and vacates the striker slot', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'bowled' })]),
      settings(),
      batting,
    );
    expect(s.wickets).toBe(1);
    expect(s.bowlers['b1'].wickets).toBe(1);
    expect(s.batters['a1'].out).toBe(true);
    expect(s.strikerId).toBeNull(); // a new batter is required
    expect(s.nonStrikerId).toBe('a2');
  });

  it('does not credit the bowler for a run out', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'runout' })]),
      settings(),
      batting,
    );
    expect(s.wickets).toBe(1);
    expect(s.bowlers['b1'].wickets).toBe(0);
  });

  it('marks the innings complete when all out', () => {
    // 5 players -> all out at 4 wickets
    const outBall = (striker: string, non: string) =>
      ball({ striker, nonStriker: non, bowler: 'b1', isWicket: true, wicketType: 'bowled' });
    const s = computeInnings(
      inn([outBall('a1', 'a2'), outBall('a3', 'a2'), outBall('a4', 'a2'), outBall('a5', 'a2')]),
      settings(),
      batting,
    );
    expect(s.wickets).toBe(4);
    expect(s.isComplete).toBe(true);
  });
});

describe('retired batter', () => {
  it('does not count toward wickets, vacates the crease, and is not a legal ball', () => {
    const s = computeInnings(
      inn([ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'retired', dismissedPlayerId: 'a1' })]),
      settings(),
      batting,
    );
    expect(s.wickets).toBe(0);
    expect(s.legalBalls).toBe(0);
    expect(s.batters['a1'].out).toBe(false);
    expect(s.batters['a1'].retired).toBe(true);
    expect(s.strikerId).toBeNull(); // a new batter is required
    expect(s.nonStrikerId).toBe('a2');
  });

  it('does not credit the bowler and does not trigger all-out', () => {
    const outBall = (striker: string, non: string) =>
      ball({ striker, nonStriker: non, bowler: 'b1', isWicket: true, wicketType: 'bowled' });
    const s = computeInnings(
      inn([
        outBall('a1', 'a2'),
        outBall('a3', 'a2'),
        outBall('a4', 'a2'),
        ball({ striker: 'a2', nonStriker: 'a5', bowler: 'b1', isWicket: true, wicketType: 'retired', dismissedPlayerId: 'a2' }),
      ]),
      settings(),
      batting,
    );
    expect(s.wickets).toBe(3); // the retirement is not a 4th wicket
    expect(s.isComplete).toBe(false);
    expect(s.bowlers['b1'].wickets).toBe(3);
  });

  it('lets a retired batter return and keep accumulating their stats', () => {
    const balls = [
      legal(4), // a1 scores 4, even runs -> keeps strike
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'retired', dismissedPlayerId: 'a1' }),
    ];
    let s = computeInnings(inn(balls), settings(), batting);
    expect(s.strikerId).toBeNull(); // a1's slot is vacated
    expect(s.nonStrikerId).toBe('a2');
    expect(s.batters['a1'].retired).toBe(true);
    expect(s.batters['a1'].runs).toBe(4);

    // a3 comes in for the vacated slot, then a1 returns later when a3 is out.
    const withReturn = [
      ...balls,
      ball({ striker: 'a3', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'bowled' }),
      ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', batterRuns: 2 }),
    ];
    s = computeInnings(inn(withReturn), settings(), batting);
    expect(s.batters['a1'].out).toBe(false);
    expect(s.batters['a1'].retired).toBe(true);
    expect(s.batters['a1'].runs).toBe(6); // 4 before retiring + 2 after returning
    expect(s.strikerId).toBe('a1');
  });
});

describe('innings completion by overs', () => {
  it('completes when overs are bowled out', () => {
    const balls = Array.from({ length: 6 }, () => legal(1));
    const s = computeInnings(inn(balls), settings({ oversPerInnings: 1 }), batting);
    expect(s.isComplete).toBe(true);
    expect(s.ballsRemaining).toBe(0);
  });
});

describe('chase / target', () => {
  const innWithTarget = (balls: BallEvent[], target: number) =>
    inn(balls, { battingTeamId: 'a', target });

  it('reports runs required and required run rate', () => {
    const s = computeInnings(
      innWithTarget([legal(2)], 50),
      settings({ oversPerInnings: 10 }),
      batting,
    );
    expect(s.target).toBe(50);
    expect(s.runsRequired).toBe(48);
    expect(s.ballsRemaining).toBe(59);
    expect(s.requiredRunRate).toBeCloseTo((48 / 59) * 6, 5);
  });

  it('completes the chase when the target is reached', () => {
    const balls = [legal(6), legal(6)]; // 12 runs, target 11
    const s = computeInnings(innWithTarget(balls, 11), settings({ oversPerInnings: 10 }), batting);
    expect(s.isComplete).toBe(true);
    expect(s.runsRequired).toBe(0);
  });
});

describe('edit last ball / undo via recompute', () => {
  it('recomputes cleanly when the last ball is changed from 4 to 6', () => {
    const balls = [legal(1), legal(4)];
    const before = computeInnings(inn(balls), settings(), batting);
    expect(before.totalRuns).toBe(5);

    // edit: replace last ball's runs with 6
    const edited = [...balls];
    edited[1] = { ...edited[1], batterRuns: 6 };
    const after = computeInnings(inn(edited), settings(), batting);
    expect(after.totalRuns).toBe(7);
    expect(after.batters[edited[1].striker].sixes).toBe(1);
  });

  it('undo = drop the last ball and recompute', () => {
    const balls = [legal(4), legal(2)];
    const undone = computeInnings(inn(balls.slice(0, -1)), settings(), batting);
    expect(undone.totalRuns).toBe(4);
    expect(undone.legalBalls).toBe(1);
  });
});

describe('ballToken display', () => {
  it('renders dots, runs, and extras', () => {
    const st = settings();
    expect(ballToken(legal(0), st)).toBe('•');
    expect(ballToken(legal(4), st)).toBe('4');
    expect(ballToken(ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'wide' }), st)).toBe('Wd');
    expect(
      ballToken(ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', extra: 'noball', batterRuns: 4 }), st),
    ).toBe('4Nb');
    expect(
      ballToken(ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', isWicket: true, wicketType: 'bowled' }), st),
    ).toBe('W');
  });
});

describe('match result', () => {
  const mk = (balls1: BallEvent[], balls2: BallEvent[], oversPerInnings = 2): Match => {
    const teamB = team('b', [
      ['B1', 'gents'],
      ['B2', 'gents'],
      ['B3', 'gents'],
      ['B4', 'gents'],
      ['B5', 'gents'],
    ]);
    const s: MatchSettings = settings({ oversPerInnings });
    const i1: Innings = {
      battingTeamId: 'a',
      bowlingTeamId: 'b',
      openingStrikerId: 'a1',
      openingNonStrikerId: 'a2',
      openingBowlerId: 'b1',
      balls: balls1,
    };
    const total1 = computeInnings(i1, s, batting).totalRuns;
    const i2: Innings = {
      battingTeamId: 'b',
      bowlingTeamId: 'a',
      openingStrikerId: 'b1',
      openingNonStrikerId: 'b2',
      openingBowlerId: 'a1',
      balls: balls2,
      target: total1 + 1,
    };
    return {
      id: 'm1',
      ownerUid: 'u1',
      createdAt: 0,
      status: 'complete',
      settings: s,
      teamA: batting,
      teamB,
      toss: null,
      innings1: i1,
      innings2: i2,
      result: null,
    };
  };

  const bBall = (runs: number) => ball({ striker: 'b1', nonStriker: 'b2', bowler: 'a1', batterRuns: runs });

  it('declares the chasing side winner by wickets', () => {
    // team A scores 10 over 12 legal balls; team B chases past it
    const a = [legal(6), legal(0), legal(0), legal(0), legal(0), legal(4), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0)];
    const b = [bBall(6), bBall(6)]; // 12 > 11
    const m = mk(a, b);
    expect(computeResult(m)).toMatch(/B won by \d+ wickets?/);
  });

  it('declares the defending side winner by runs when overs run out', () => {
    const a = [legal(6), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0)];
    const b = Array.from({ length: 12 }, () => bBall(0)); // 0, all overs used
    const m = mk(a, b);
    expect(computeResult(m)).toMatch(/A won by 6 runs/);
  });

  it('declares a tie', () => {
    const a = [legal(4), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0), legal(0)];
    const b = [bBall(4), ...Array.from({ length: 11 }, () => bBall(0))];
    const m = mk(a, b);
    expect(computeResult(m)).toBe('Match tied');
  });
});
