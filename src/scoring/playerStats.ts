// ---------------------------------------------------------------------------
// Cross-match player stats. Players aren't standalone records (they're
// embedded per-match with fresh ids), so identity here is by normalized name
// — the same convention `useSavedRoster` already relies on.
// ---------------------------------------------------------------------------

import { computeInnings } from './engine';
import type { Match } from './types';

export interface PlayerStatTotals {
  nameKey: string;
  displayName: string;
  teams: Set<string>;
  matches: number;
  innings: number;
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  highScore: number;
  notOuts: number;
  wickets: number;
  ballsBowled: number;
  runsConceded: number;
  bestBowling: { wickets: number; runs: number } | null;
}

export const nameKeyOf = (name: string): string => name.trim().toLowerCase();

function freshTotals(nameKey: string, displayName: string): PlayerStatTotals {
  return {
    nameKey,
    displayName,
    teams: new Set(),
    matches: 0,
    innings: 0,
    runs: 0,
    balls: 0,
    fours: 0,
    sixes: 0,
    highScore: 0,
    notOuts: 0,
    wickets: 0,
    ballsBowled: 0,
    runsConceded: 0,
    bestBowling: null,
  };
}

/** Aggregate batting/bowling totals for every player (by normalized name) across all matches. */
export function computeAllPlayerStats(matches: Match[]): Map<string, PlayerStatTotals> {
  const out = new Map<string, PlayerStatTotals>();
  const ensure = (name: string) => {
    const key = nameKeyOf(name);
    if (!out.has(key)) out.set(key, freshTotals(key, name));
    return out.get(key)!;
  };

  for (const match of matches) {
    const playerName = new Map<string, string>();
    for (const p of [...match.teamA.players, ...match.teamB.players]) playerName.set(p.id, p.name);

    for (const p of match.teamA.players) ensure(p.name).teams.add(match.teamA.name);
    for (const p of match.teamB.players) ensure(p.name).teams.add(match.teamB.name);

    const playedInThisMatch = new Set<string>();
    for (const which of [1, 2] as const) {
      const innings = which === 1 ? match.innings1 : match.innings2;
      if (!innings) continue;
      const battingTeam = match.teamA.id === innings.battingTeamId ? match.teamA : match.teamB;
      const state = computeInnings(innings, match.settings, battingTeam);

      for (const [pid, bat] of Object.entries(state.batters)) {
        const name = playerName.get(pid);
        if (!name) continue;
        const stats = ensure(name);
        stats.innings += 1;
        stats.runs += bat.runs;
        stats.balls += bat.balls;
        stats.fours += bat.fours;
        stats.sixes += bat.sixes;
        if (!bat.out) stats.notOuts += 1;
        if (bat.runs > stats.highScore) stats.highScore = bat.runs;
        playedInThisMatch.add(nameKeyOf(name));
      }
      for (const [pid, bowl] of Object.entries(state.bowlers)) {
        if (bowl.ballsBowled === 0) continue;
        const name = playerName.get(pid);
        if (!name) continue;
        const stats = ensure(name);
        stats.wickets += bowl.wickets;
        stats.ballsBowled += bowl.ballsBowled;
        stats.runsConceded += bowl.runsConceded;
        if (
          !stats.bestBowling ||
          bowl.wickets > stats.bestBowling.wickets ||
          (bowl.wickets === stats.bestBowling.wickets && bowl.runsConceded < stats.bestBowling.runs)
        ) {
          stats.bestBowling = { wickets: bowl.wickets, runs: bowl.runsConceded };
        }
        playedInThisMatch.add(nameKeyOf(name));
      }
    }
    for (const key of playedInThisMatch) out.get(key)!.matches += 1;
  }

  return out;
}

export function battingAverage(s: PlayerStatTotals): number | null {
  const dismissals = s.innings - s.notOuts;
  return dismissals > 0 ? s.runs / dismissals : null;
}

export function strikeRate(s: PlayerStatTotals): number | null {
  return s.balls > 0 ? (s.runs / s.balls) * 100 : null;
}

export function economyOf(s: PlayerStatTotals): number | null {
  return s.ballsBowled > 0 ? (s.runsConceded / s.ballsBowled) * 6 : null;
}
