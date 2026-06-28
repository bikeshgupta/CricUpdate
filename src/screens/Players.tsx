import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../services/dataService';
import { computeAllPlayerStats, type PlayerStatTotals } from '../scoring/playerStats';
import { BackButton, Screen, StickyHeader, TextInput } from '../components/ui';

export default function Players() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<PlayerStatTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dataService.listAllMatches().then((matches) => {
      const byKey = computeAllPlayerStats(matches);
      setStats([...byKey.values()].sort((a, b) => b.runs - a.runs || b.matches - a.matches));
      setLoading(false);
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stats;
    return stats.filter((s) => s.displayName.toLowerCase().includes(q));
  }, [stats, query]);

  return (
    <Screen>
      <StickyHeader title="Player stats" left={<BackButton onClick={() => navigate(-1)} />} />

      <div className="px-4 py-3">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search players" />
      </div>

      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">No players yet.</div>
      ) : (
        <div className="divide-line border-t border-line">
          {filtered.map((s) => (
            <button
              key={s.nameKey}
              onClick={() => navigate(`/player/${encodeURIComponent(s.nameKey)}`)}
              className="row w-full justify-between text-left transition duration-150 hover:bg-surface"
            >
              <span className="min-w-0">
                <span className="block truncate text-body font-medium text-fg">{s.displayName}</span>
                <span className="block truncate text-caption text-fg-muted">
                  {s.matches} matches{s.teams.size > 0 ? ` · ${[...s.teams].join(', ')}` : ''}
                </span>
              </span>
              <span className="nums shrink-0 text-right">
                <span className="block text-body font-semibold text-fg">{s.runs}</span>
                <span className="block text-caption text-fg-muted">{s.wickets} wkts</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}
