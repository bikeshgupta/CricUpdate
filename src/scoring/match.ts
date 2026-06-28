// ---------------------------------------------------------------------------
// Match-level helpers: derive innings states from a Match, build the chase
// target, and compute the result line.
// ---------------------------------------------------------------------------

import { computeInnings } from './engine';
import type { InningsState, Match, Team } from './types';

export function teamById(match: Match, id: string): Team {
  return match.teamA.id === id ? match.teamA : match.teamB;
}

export function playerById(match: Match, id: string | null | undefined) {
  if (!id) return undefined;
  return [...match.teamA.players, ...match.teamB.players].find((p) => p.id === id);
}

export function playerName(match: Match, id: string | null | undefined): string {
  return playerById(match, id)?.name ?? '—';
}

export function inningsState(match: Match, which: 1 | 2): InningsState | null {
  const innings = which === 1 ? match.innings1 : match.innings2;
  if (!innings) return null;
  return computeInnings(innings, match.settings, teamById(match, innings.battingTeamId));
}

/**
 * Result line once the second innings is complete (or both innings done).
 * Returns null while the match is still live.
 */
export function computeResult(match: Match): string | null {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  if (!s1 || !s2 || !s2.isComplete) return null;

  const chasingTeam = teamById(match, s2.battingTeamId);
  const defendingTeam = teamById(match, s1.battingTeamId);
  const target = (s1.totalRuns ?? 0) + 1;

  if (s2.totalRuns >= target) {
    const wktsLeft = Math.max(0, chasingTeam.players.length - 1 - s2.wickets);
    return `${chasingTeam.name} won by ${wktsLeft} wicket${wktsLeft === 1 ? '' : 's'}`;
  }
  if (s2.totalRuns === s1.totalRuns) {
    return 'Match tied';
  }
  const margin = s1.totalRuns - s2.totalRuns;
  return `${defendingTeam.name} won by ${margin} run${margin === 1 ? '' : 's'}`;
}

/** Target for the chasing side = first-innings total + 1. */
export function targetFor(match: Match): number | null {
  const s1 = inningsState(match, 1);
  if (!s1) return null;
  return s1.totalRuns + 1;
}

export interface AwardWinner {
  playerId: string;
  name: string;
  teamName: string;
  statLine: string;
}

export interface MatchAwards {
  playerOfMatch: AwardWinner;
  bestBatter: AwardWinner;
  bestBowler: AwardWinner;
  bestFielder: AwardWinner | null;
}

/**
 * End-of-match awards, derived from the combined batting/bowling stats of
 * both innings plus a tally of fielder dismissals from the ball log.
 * Returns null while the match is still in progress.
 */
export function computeAwards(match: Match): MatchAwards | null {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  if (!s1 || !s2 || !s2.isComplete) return null;

  // Each player only bats/bowls in the innings their team batted/bowled, so
  // merging by spread never collides keys across the two innings.
  const batters = { ...s1.batters, ...s2.batters };
  const bowlers = { ...s1.bowlers, ...s2.bowlers };

  const fielderCounts = new Map<string, number>();
  for (const innings of [match.innings1, match.innings2]) {
    if (!innings) continue;
    for (const b of innings.balls) {
      if (b.isWicket && b.fielderId) fielderCounts.set(b.fielderId, (fielderCounts.get(b.fielderId) ?? 0) + 1);
    }
  }

  const teamOfPlayer = new Map<string, string>();
  for (const p of match.teamA.players) teamOfPlayer.set(p.id, match.teamA.name);
  for (const p of match.teamB.players) teamOfPlayer.set(p.id, match.teamB.name);

  const statLineFor = (id: string): string => {
    const bat = batters[id];
    const bowl = bowlers[id];
    const fielded = fielderCounts.get(id) ?? 0;
    const parts: string[] = [];
    if (bat) parts.push(`${bat.runs} (${bat.balls})`);
    if (bowl && bowl.ballsBowled > 0) parts.push(`${bowl.wickets}/${bowl.runsConceded}`);
    if (fielded > 0) parts.push(`${fielded} dismissal${fielded === 1 ? '' : 's'}`);
    return parts.join(' · ') || '—';
  };

  const winnerFor = (id: string | null): AwardWinner | null =>
    id ? { playerId: id, name: playerName(match, id), teamName: teamOfPlayer.get(id) ?? '', statLine: statLineFor(id) } : null;

  let bestBatterId: string | null = null;
  for (const [id, st] of Object.entries(batters)) {
    const cur = bestBatterId ? batters[bestBatterId] : null;
    if (!cur || st.runs > cur.runs || (st.runs === cur.runs && st.balls < cur.balls)) bestBatterId = id;
  }

  let bestBowlerId: string | null = null;
  for (const [id, st] of Object.entries(bowlers)) {
    const cur = bestBowlerId ? bowlers[bestBowlerId] : null;
    if (!cur || st.wickets > cur.wickets || (st.wickets === cur.wickets && st.runsConceded < cur.runsConceded)) bestBowlerId = id;
  }

  let bestFielderId: string | null = null;
  let bestFielderCount = 0;
  for (const [id, count] of fielderCounts) {
    if (count > bestFielderCount) {
      bestFielderId = id;
      bestFielderCount = count;
    }
  }

  const allPlayerIds = new Set<string>([...Object.keys(batters), ...Object.keys(bowlers), ...fielderCounts.keys()]);
  let mvpId: string | null = null;
  let mvpPoints = -Infinity;
  for (const id of allPlayerIds) {
    const bat = batters[id];
    const bowl = bowlers[id];
    const fielded = fielderCounts.get(id) ?? 0;
    const points = (bat?.runs ?? 0) + (bat?.fours ?? 0) + (bat?.sixes ?? 0) * 2 + (bowl?.wickets ?? 0) * 25 + fielded * 10;
    if (points > mvpPoints) {
      mvpPoints = points;
      mvpId = id;
    }
  }

  if (!mvpId || !bestBatterId || !bestBowlerId) return null;

  return {
    playerOfMatch: winnerFor(mvpId)!,
    bestBatter: winnerFor(bestBatterId)!,
    bestBowler: winnerFor(bestBowlerId)!,
    bestFielder: winnerFor(bestFielderId),
  };
}
