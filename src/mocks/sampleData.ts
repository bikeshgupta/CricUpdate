// ---------------------------------------------------------------------------
// Disposable mock fixtures: a dummy signed-in user and a couple of finished
// matches so Home/History/Summary look real. Delete this file when Firebase is
// wired in.
// ---------------------------------------------------------------------------

import { computeInnings } from '../scoring/engine';
import { computeResult } from '../scoring/match';
import {
  DEFAULT_SETTINGS,
  type BallEvent,
  type Innings,
  type Match,
  type Player,
  type Team,
} from '../scoring/types';
import type { AppUser } from '../services/dataService';

export const DUMMY_USER: AppUser = {
  uid: 'dummy-user',
  name: 'Bikesh',
  email: 'bikesh@example.com',
  isAnonymous: false,
};

let seq = 0;
const nextId = () => `seed${seq++}`;

function team(id: string, name: string, names: string[]): Team {
  return {
    id,
    name,
    players: names.map<Player>((n, i) => ({
      id: `${id}-p${i}`,
      name: n,
      // alternate a couple of "ladies" to exercise the gender rule visually
      category: i === 3 || i === 6 ? 'ladies' : 'gents',
    })),
  };
}

/**
 * Tiny deterministic innings simulator: given a run-per-ball pattern it tracks
 * strike rotation and bowler changes so the resulting ball log is believable.
 */
function buildInnings(
  battingTeamId: string,
  bowlingTeamId: string,
  batters: Player[],
  bowlers: Player[],
  pattern: number[],
  wicketBalls: Set<number>,
): Innings {
  const balls: BallEvent[] = [];
  let strikerIdx = 0;
  let nonStrikerIdx = 1;
  let nextBatter = 2;
  let legal = 0;

  for (let i = 0; i < pattern.length; i++) {
    const bowler = bowlers[Math.floor(legal / 6) % bowlers.length];
    const isWicket = wicketBalls.has(i);
    const runs = isWicket ? 0 : pattern[i];
    balls.push({
      id: nextId(),
      striker: batters[strikerIdx].id,
      nonStriker: batters[nonStrikerIdx].id,
      bowler: bowler.id,
      batterRuns: runs,
      extra: 'none',
      extraRuns: 0,
      isWicket,
      wicketType: isWicket ? 'bowled' : undefined,
    });

    legal += 1;
    if (isWicket) {
      strikerIdx = nextBatter < batters.length ? nextBatter++ : strikerIdx;
    } else if (runs % 2 === 1) {
      [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
    }
    if (legal % 6 === 0) {
      [strikerIdx, nonStrikerIdx] = [nonStrikerIdx, strikerIdx];
    }
  }

  return {
    battingTeamId,
    bowlingTeamId,
    openingStrikerId: batters[0].id,
    openingNonStrikerId: batters[1].id,
    openingBowlerId: bowlers[0].id,
    balls,
  };
}

function buildMatch(
  id: string,
  createdAt: number,
  teamA: Team,
  teamB: Team,
  pat1: number[],
  wkt1: Set<number>,
  pat2: number[],
  wkt2: Set<number>,
): Match {
  const settings = { ...DEFAULT_SETTINGS, oversPerInnings: Math.ceil(pat1.length / 6) };
  const innings1 = buildInnings(teamA.id, teamB.id, teamA.players, teamB.players, pat1, wkt1);
  const s1 = computeInnings(innings1, settings, teamA);
  const innings2 = {
    ...buildInnings(teamB.id, teamA.id, teamB.players, teamA.players, pat2, wkt2),
    target: s1.totalRuns + 1,
  };

  const match: Match = {
    id,
    ownerUid: DUMMY_USER.uid,
    createdAt,
    status: 'complete',
    settings,
    teamA,
    teamB,
    toss: {
      callingTeamId: teamA.id,
      call: 'heads',
      outcome: 'heads',
      winnerTeamId: teamA.id,
      decision: 'bat',
    },
    innings1,
    innings2,
    result: null,
  };
  match.result = computeResult(match);
  return match;
}

const titans = team('titans', 'Office Titans', [
  'Arjun',
  'Rohan',
  'Sameer',
  'Priya',
  'Vikram',
  'Karthik',
  'Neha',
  'Imran',
]);
const strikers = team('strikers', 'Block C Strikers', [
  'Dev',
  'Manish',
  'Aakash',
  'Riya',
  'Sundar',
  'Joseph',
  'Anita',
  'Farhan',
]);

const dayMs = 86_400_000;

export const sampleMatches: Match[] = [
  buildMatch(
    'demo-titans-strikers',
    Date.now() - dayMs * 2,
    titans,
    strikers,
    // 12 balls (2 overs): Office Titans
    [1, 4, 0, 2, 6, 1, 0, 4, 1, 2, 0, 6],
    new Set([6]),
    // Block C Strikers chase
    [4, 1, 0, 6, 2, 1, 4, 0, 1, 2, 0, 1],
    new Set([10]),
  ),
  buildMatch(
    'demo-friday-night',
    Date.now() - dayMs * 9,
    strikers,
    titans,
    [2, 1, 4, 0, 1, 6, 2, 0, 1, 4, 0, 0, 1, 2, 4, 0, 1, 6],
    new Set([3, 11]),
    [1, 0, 4, 2, 1, 0, 6, 1, 0, 4, 2, 1, 0, 0, 1, 4, 0, 2],
    new Set([5, 13, 16]),
  ),
];
