import { useCallback, useEffect, useState } from 'react';
import { dataService } from '../services/dataService';
import type { Squad } from '../scoring/types';

/** A user's saved, reusable player pools (e.g. "Friday Office Game"), most-recently-updated first. */
export function useSquads(uid: string): { squads: Squad[]; loading: boolean; reload: () => void } {
  const [squads, setSquads] = useState<Squad[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(() => {
    setLoading(true);
    dataService.listMySquads(uid).then((s) => {
      setSquads(s);
      setLoading(false);
    });
  }, [uid]);

  useEffect(() => reload(), [reload]);

  return { squads, loading, reload };
}
