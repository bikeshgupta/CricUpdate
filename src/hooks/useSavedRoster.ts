import { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { Team } from '../scoring/types';
import { isPlayerHidden, isTeamHidden } from './useHidden';

/** Distinct teams (by name) seen in the user's past matches, most-recent first. */
export function useSavedTeams(uid: string): Team[] {
  const [teams, setTeams] = useState<Team[]>([]);
  useEffect(() => {
    dataService.listMyMatches(uid).then((matches) => {
      const seen = new Map<string, Team>();
      for (const m of matches) {
        for (const t of [m.teamA, m.teamB]) {
          const key = t.name.trim().toLowerCase();
          if (t.name.trim() && !seen.has(key) && !isTeamHidden(uid, t.name)) seen.set(key, t);
        }
      }
      setTeams([...seen.values()]);
    });
  }, [uid]);
  return teams;
}

/** Distinct player names seen across the user's past matches, most-recently-seen first. */
export function useSavedPlayers(uid: string): string[] {
  const [names, setNames] = useState<string[]>([]);
  useEffect(() => {
    dataService.listMyMatches(uid).then((matches) => {
      const seen = new Map<string, string>();
      for (const m of matches) {
        for (const p of [...m.teamA.players, ...m.teamB.players]) {
          const key = p.name.trim().toLowerCase();
          if (p.name.trim() && !seen.has(key) && !isPlayerHidden(uid, p.name)) seen.set(key, p.name);
        }
      }
      setNames([...seen.values()]);
    });
  }, [uid]);
  return names;
}
