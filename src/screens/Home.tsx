import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { inningsState } from '../scoring/match';
import type { Match } from '../scoring/types';
import { Button, Screen, SectionHeader, StickyHeader, TeamBadge } from '../components/ui';
import { Wordmark } from '../components/Logo';

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Stat({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-3">
      <span className="nums text-[18px] font-semibold leading-none text-fg">{value}</span>
      <span className="mt-1 text-caption font-medium text-fg-muted">{label}</span>
    </div>
  );
}

function MatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  const live = match.status === 'innings1' || match.status === 'innings2';

  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition duration-150 hover:bg-surface">
      <TeamBadge name={match.teamA.name} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-item font-medium text-fg">
            {match.teamA.name} <span className="text-fg-faint">v</span> {match.teamB.name}
          </span>
          <span className="shrink-0 text-caption font-medium text-fg-muted">
            {live ? <span className="text-accent">● Live</span> : relativeDate(match.createdAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span className="nums truncate text-caption text-fg-muted">
            {s1 && <>{s1.totalRuns}/{s1.wickets}</>}
            {s2 && <> · {s2.totalRuns}/{s2.wickets}</>}
          </span>
          {match.result && <span className="shrink-0 truncate text-caption text-success">{match.result}</span>}
        </div>
      </div>
    </button>
  );
}

export default function Home() {
  const user = useAuth((s) => s.user)!;
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dataService.listMyMatches(user.uid).then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, [user.uid]);

  const stats = useMemo(() => {
    const teams = new Set<string>();
    const players = new Set<string>();
    for (const m of matches) {
      teams.add(m.teamA.name);
      teams.add(m.teamB.name);
      for (const p of [...m.teamA.players, ...m.teamB.players]) players.add(p.name);
    }
    return { matches: matches.length, teams: teams.size, players: players.size };
  }, [matches]);

  return (
    <Screen>
      <StickyHeader
        title={<Wordmark size={18} />}
        right={
          <button onClick={signOut} className="btn btn-ghost btn-sm">
            Sign out
          </button>
        }
      />

      <div className="px-4 pb-3 pt-3">
        <Button variant="primary" block onClick={() => navigate('/new')}>
          New match
        </Button>
      </div>

      {/* quick stats */}
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
        <Stat value={stats.matches} label="Matches" />
        <Stat value={stats.teams} label="Teams" />
        <Stat value={stats.players} label="Players" />
      </div>

      <SectionHeader>Recent matches</SectionHeader>

      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : matches.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">No matches yet. Start one above.</div>
      ) : (
        <div className="divide-line border-t border-line">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </div>
      )}
    </Screen>
  );
}
