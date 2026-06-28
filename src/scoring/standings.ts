// ---------------------------------------------------------------------------
// Tournament points table — pure derivation over a list of matches, reusing
// the same innings-replay logic the live scorecard uses. Net run rate is out
// of scope for this pass (would need per-team overs/runs aggregation that
// isn't tracked anywhere yet).
// ---------------------------------------------------------------------------

import { inningsState, teamById } from './match';
import type { Match } from './types';

export interface StandingsRow {
  teamName: string;
  played: number;
  won: number;
  lost: number;
  tied: number;
  points: number;
}

const nameKeyOf = (name: string): string => name.trim().toLowerCase();

/**
 * Win = 2 points, tie = 1 point each, loss = 0. Only matches with
 * status 'complete' and a finished 2nd innings count. Teams are keyed by
 * normalized name — two opponents in the same tournament sharing a generic
 * name (e.g. the ad-hoc auto-balance default "Team 1") will collide; copy
 * elsewhere nudges organizers to rename teams before joining a tournament.
 */
export function computeStandings(matches: Match[]): StandingsRow[] {
  const rows = new Map<string, StandingsRow>();

  const rowFor = (teamName: string): StandingsRow => {
    const key = nameKeyOf(teamName);
    let row = rows.get(key);
    if (!row) {
      row = { teamName, played: 0, won: 0, lost: 0, tied: 0, points: 0 };
      rows.set(key, row);
    }
    return row;
  };

  for (const match of matches) {
    if (match.status !== 'complete') continue;
    const s1 = inningsState(match, 1);
    const s2 = inningsState(match, 2);
    if (!s1 || !s2 || !s2.isComplete) continue;

    const firstBattingTeam = teamById(match, s1.battingTeamId);
    const secondBattingTeam = teamById(match, s2.battingTeamId);
    const rowFirst = rowFor(firstBattingTeam.name);
    const rowSecond = rowFor(secondBattingTeam.name);

    rowFirst.played += 1;
    rowSecond.played += 1;

    if (s2.totalRuns === s1.totalRuns) {
      rowFirst.tied += 1;
      rowSecond.tied += 1;
      rowFirst.points += 1;
      rowSecond.points += 1;
    } else if (s2.totalRuns > s1.totalRuns) {
      rowSecond.won += 1;
      rowSecond.points += 2;
      rowFirst.lost += 1;
    } else {
      rowFirst.won += 1;
      rowFirst.points += 2;
      rowSecond.lost += 1;
    }
  }

  return [...rows.values()].sort((a, b) => b.points - a.points || b.won - a.won);
}
