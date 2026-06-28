import { useCallback, useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { Tournament } from '../scoring/types';

/** A user's tournaments, newest first. */
export function useTournaments(uid: string): { tournaments: Tournament[]; loading: boolean; reload: () => void } {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    dataService.listMyTournaments(uid).then((t) => {
      setTournaments(t);
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => reload(), [reload]);

  return { tournaments, loading, reload };
}
