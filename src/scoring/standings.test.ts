import { describe, it, expect } from 'vitest';
import { computeInnings } from './engine';
import { computeStandings } from './standings';
import { DEFAULT_SETTINGS, type BallEvent, type Innings, type Match, type MatchSettings, type Team } from './types';

const team = (id: string, name: string, names: string[]): Team => ({
  id,
  name,
  players: names.map((n, i) => ({ id: `${id}${i + 1}`, name: n, category: 'gents' })),
});

let seq = 0;
function ball(partial: Partial<BallEvent> & { striker: string; nonStriker: string; bowler: string }): BallEvent {
  return { id: `b${seq++}`, batterRuns: 0, extra: 'none', extraRuns: 0, isWicket: false, ...partial };
}

const settings = (o?: Partial<MatchSettings>): MatchSettings => ({ ...DEFAULT_SETTINGS, ...o });

function makeMatch(opts: {
  id: string;
  teamA: Team;
  teamB: Team;
  balls1: BallEvent[];
  balls2: BallEvent[];
  status?: Match['status'];
  oversPerInnings?: number;
}): Match {
  const { id, teamA, teamB, balls1, balls2, status = 'complete', oversPerInnings = 2 } = opts;
  const s = settings({ oversPerInnings });
  const i1: Innings = {
    battingTeamId: teamA.id,
    bowlingTeamId: teamB.id,
    openingStrikerId: `${teamA.id}1`,
    openingNonStrikerId: `${teamA.id}2`,
    openingBowlerId: `${teamB.id}1`,
    balls: balls1,
  };
  const total1 = computeInnings(i1, s, teamA).totalRuns;
  const i2: Innings = {
    battingTeamId: teamB.id,
    bowlingTeamId: teamA.id,
    openingStrikerId: `${teamB.id}1`,
    openingNonStrikerId: `${teamB.id}2`,
    openingBowlerId: `${teamA.id}1`,
    balls: balls2,
    target: total1 + 1,
  };
  return {
    id,
    ownerUid: 'u1',
    createdAt: 0,
    status,
    settings: s,
    teamA,
    teamB,
    toss: null,
    innings1: i1,
    innings2: i2,
    result: null,
  };
}

const teamA = team('a', 'Strikers', ['A1', 'A2', 'A3', 'A4', 'A5']);
const teamB = team('b', 'Smashers', ['B1', 'B2', 'B3', 'B4', 'B5']);

const legalA = (runs: number) => ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', batterRuns: runs });
const legalB = (runs: number) => ball({ striker: 'b1', nonStriker: 'b2', bowler: 'a1', batterRuns: runs });

describe('computeStandings', () => {
  it('awards 2 points to the winner and 0 to the loser', () => {
    const a = [legalA(6), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0)];
    const b = Array.from({ length: 12 }, () => legalB(0)); // chases nothing, all dots — defending side wins
    const m = makeMatch({ id: 'm1', teamA, teamB, balls1: a, balls2: b });

    const rows = computeStandings([m]);
    const strikers = rows.find((r) => r.teamName === 'Strikers')!;
    const smashers = rows.find((r) => r.teamName === 'Smashers')!;

    expect(strikers.played).toBe(1);
    expect(strikers.won).toBe(1);
    expect(strikers.points).toBe(2);
    expect(smashers.played).toBe(1);
    expect(smashers.lost).toBe(1);
    expect(smashers.points).toBe(0);
  });

  it('awards 1 point each on a tie', () => {
    const a = [legalA(4), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0)];
    const b = [legalB(4), ...Array.from({ length: 11 }, () => legalB(0))];
    const m = makeMatch({ id: 'm1', teamA, teamB, balls1: a, balls2: b });

    const rows = computeStandings([m]);
    expect(rows.every((r) => r.tied === 1 && r.points === 1)).toBe(true);
  });

  it('sorts by points then wins', () => {
    const teamC = team('c', 'Chargers', ['C1', 'C2', 'C3', 'C4', 'C5']);
    const dots12 = Array.from({ length: 12 }, () => ball({ striker: 'a1', nonStriker: 'a2', bowler: 'b1', batterRuns: 0 }));

    // Strikers beat Smashers (6 vs 0)
    const m1 = makeMatch({
      id: 'm1',
      teamA,
      teamB,
      balls1: [legalA(6), ...dots12.slice(1)],
      balls2: Array.from({ length: 12 }, () => legalB(0)),
    });

    // Strikers beat Chargers too — 2 wins, 4 points
    const cBall = (runs: number) => ball({ striker: 'c1', nonStriker: 'c2', bowler: 'a1', batterRuns: runs });
    const m2 = makeMatch({
      id: 'm2',
      teamA,
      teamB: teamC,
      balls1: [legalA(6), ...dots12.slice(1)],
      balls2: Array.from({ length: 12 }, () => cBall(0)),
    });

    const rows = computeStandings([m1, m2]);
    expect(rows[0].teamName).toBe('Strikers');
    expect(rows[0].points).toBe(4);
    expect(rows[0].won).toBe(2);
  });

  it('excludes incomplete or live matches', () => {
    const a = [legalA(6), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0), legalA(0)];
    const liveB = [legalB(0)]; // 2nd innings not finished
    const live = makeMatch({ id: 'm-live', teamA, teamB, balls1: a, balls2: liveB, status: 'innings2' });

    expect(computeStandings([live])).toEqual([]);
  });
});
