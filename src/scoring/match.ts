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
