import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { inningsState, teamById } from '../scoring/match';
import type { Match } from '../scoring/types';
import { AccentButton, AppBar, GhostButton, GlassCard, MicroLabel, Screen } from '../components/ui';

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function MatchRow({ match, onClick }: { match: Match; onClick: () => void }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  const t1 = s1 ? teamById(match, s1.battingTeamId) : null;
  const t2 = s2 ? teamById(match, s2.battingTeamId) : null;

  return (
    <GlassCard onClick={onClick}>
      <div className="flex items-center justify-between">
        <MicroLabel>{match.status === 'complete' ? 'Result' : 'In progress'}</MicroLabel>
        <span className="text-[11px] text-ink-faint">{relativeDate(match.createdAt)}</span>
      </div>
      <div className="mt-2.5 space-y-1.5">
        {t1 && s1 && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink">{t1.name}</span>
            <span className="nums text-sm text-ink">
              {s1.totalRuns}-{s1.wickets}{' '}
              <span className="text-ink-faint">({s1.oversText})</span>
            </span>
          </div>
        )}
        {t2 && s2 && (
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink">{t2.name}</span>
            <span className="nums text-sm text-ink">
              {s2.totalRuns}-{s2.wickets}{' '}
              <span className="text-ink-faint">({s2.oversText})</span>
            </span>
          </div>
        )}
      </div>
      {match.result && (
        <div className="mt-3 border-t border-glass-border pt-2.5 text-sm font-semibold text-accent">
          {match.result}
        </div>
      )}
    </GlassCard>
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
      <AppBar
        title="CricUpdate"
        right={
          <button onClick={signOut} className="text-xs text-ink-muted">
            Sign out
          </button>
        }
      />

      <p className="mb-5 text-sm text-ink-muted">
        Hi {user.name.split(' ')[0]} — ready to score a match?
      </p>

      <AccentButton onClick={() => navigate('/new')} className="w-full">
        + New Match
      </AccentButton>

      <MicroLabel className="mb-3 mt-8">Match history</MicroLabel>
      {loading ? (
        <div className="text-sm text-ink-faint">Loading…</div>
      ) : matches.length === 0 ? (
        <GlassCard className="text-center text-sm text-ink-muted">
          No matches yet. Start one above and it’ll show up here.
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <MatchRow key={m.id} match={m} onClick={() => navigate(`/match/${m.id}`)} />
          ))}
        </div>
      )}

      <div className="mt-8 text-center">
        <GhostButton onClick={signOut} className="text-xs text-ink-muted">
          Using a mocked account · data stays on this device
        </GhostButton>
      </div>
    </Screen>
  );
}
