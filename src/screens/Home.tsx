import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { inningsState, teamById } from '../scoring/match';
import type { Match } from '../scoring/types';
import { Button, Screen, SectionHeader, StickyHeader } from '../components/ui';

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function MatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  const t1 = s1 ? teamById(match, s1.battingTeamId) : null;
  const t2 = s2 ? teamById(match, s2.battingTeamId) : null;
  const live = match.status === 'innings1' || match.status === 'innings2';

  return (
    <button onClick={onClick} className="block w-full px-4 py-3 text-left transition duration-150 hover:bg-surface">
      <div className="flex items-center justify-between gap-3">
        <span className="truncate text-body font-medium text-fg">
          {t1?.name ?? match.teamA.name} <span className="text-fg-faint">v</span> {t2?.name ?? match.teamB.name}
        </span>
        <span className="shrink-0 text-caption text-fg-faint">{live ? <span className="text-accent">● Live</span> : relativeDate(match.createdAt)}</span>
      </div>
      <div className="mt-1 flex items-center justify-between gap-3">
        <span className="nums truncate text-caption text-fg-muted">
          {s1 && <>{s1.totalRuns}/{s1.wickets} ({s1.oversText})</>}
          {s2 && <> · {s2.totalRuns}/{s2.wickets} ({s2.oversText})</>}
        </span>
        {match.result && <span className="shrink-0 truncate text-caption text-success">{match.result}</span>}
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

  return (
    <Screen>
      <StickyHeader
        title="CricUpdate"
        right={
          <button onClick={signOut} className="btn btn-ghost btn-sm">
            Sign out
          </button>
        }
      />

      <div className="border-b border-line px-4 py-3">
        <Button variant="primary" block onClick={() => navigate('/new')}>
          New match
        </Button>
      </div>

      <SectionHeader>Recent matches</SectionHeader>

      {loading ? (
        <div className="px-4 py-6 text-caption text-fg-faint">Loading…</div>
      ) : matches.length === 0 ? (
        <div className="px-4 py-6 text-caption text-fg-faint">No matches yet. Start one above.</div>
      ) : (
        <div className="divide-line border-t border-line">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </div>
      )}

      <div className="px-4 py-4 text-caption text-fg-faint">Signed in as {user.name} · data stays on this device.</div>
    </Screen>
  );
}
