import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { inningsState } from '../scoring/match';
import type { Match } from '../scoring/types';
import { Button, Screen, SectionHeader, Sheet, StickyHeader, TeamBadge } from '../components/ui';
import { Wordmark } from '../components/Logo';

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function Stat({ value, label, onClick }: { value: number | string; label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center justify-center py-3 transition duration-150 active:bg-surface">
      <span className="nums text-[18px] font-semibold leading-none text-fg">{value}</span>
      <span className="mt-1 text-caption font-medium text-fg-muted">{label}</span>
    </button>
  );
}

function TeamsSheet({ open, onClose, teams }: { open: boolean; onClose: () => void; teams: { name: string; players: string[] }[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);
  return (
    <Sheet open={open} onClose={onClose} title="Teams">
      {teams.length === 0 ? (
        <p className="text-caption text-fg-faint">No teams yet.</p>
      ) : (
        <div className="divide-line overflow-hidden rounded-lg border border-line-strong">
          {teams.map((t) => (
            <div key={t.name}>
              <button
                onClick={() => setExpanded(expanded === t.name ? null : t.name)}
                className="row w-full justify-between bg-surface hover:bg-surface2"
              >
                <span className="flex items-center gap-2.5 text-body text-fg">
                  <TeamBadge name={t.name} size="sm" />
                  {t.name}
                </span>
                <span className="text-caption text-fg-muted">{t.players.length} players {expanded === t.name ? '⌃' : '›'}</span>
              </button>
              {expanded === t.name && (
                <div className="divide-line border-t border-line bg-bg px-4 py-2">
                  {t.players.map((p) => (
                    <div key={p} className="py-1.5 text-body text-fg-muted">{p}</div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Sheet>
  );
}

function PlayersSheet({ open, onClose, players }: { open: boolean; onClose: () => void; players: { name: string; teams: string[] }[] }) {
  return (
    <Sheet open={open} onClose={onClose} title="Players">
      {players.length === 0 ? (
        <p className="text-caption text-fg-faint">No players yet.</p>
      ) : (
        <div className="divide-line overflow-hidden rounded-lg border border-line-strong">
          {players.map((p) => (
            <div key={p.name} className="row justify-between bg-surface">
              <span className="text-body text-fg">{p.name}</span>
              <span className="truncate text-caption text-fg-muted">{p.teams.join(', ')}</span>
            </div>
          ))}
        </div>
      )}
    </Sheet>
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
  const [showTeams, setShowTeams] = useState(false);
  const [showPlayers, setShowPlayers] = useState(false);
  const recentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dataService.listMyMatches(user.uid).then((m) => {
      setMatches(m);
      setLoading(false);
    });
  }, [user.uid]);

  const stats = useMemo(() => {
    const teamMap = new Map<string, Set<string>>();
    const playerMap = new Map<string, Set<string>>();
    for (const m of matches) {
      for (const t of [m.teamA, m.teamB]) {
        if (!teamMap.has(t.name)) teamMap.set(t.name, new Set());
        for (const p of t.players) {
          teamMap.get(t.name)!.add(p.name);
          if (!playerMap.has(p.name)) playerMap.set(p.name, new Set());
          playerMap.get(p.name)!.add(t.name);
        }
      }
    }
    return {
      matches: matches.length,
      teams: [...teamMap.entries()].map(([name, players]) => ({ name, players: [...players] })),
      players: [...playerMap.entries()].map(([name, teams]) => ({ name, teams: [...teams] })),
    };
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
        <Stat value={stats.matches} label="Matches" onClick={() => recentRef.current?.scrollIntoView({ behavior: 'smooth' })} />
        <Stat value={stats.teams.length} label="Teams" onClick={() => setShowTeams(true)} />
        <Stat value={stats.players.length} label="Players" onClick={() => setShowPlayers(true)} />
      </div>

      <div ref={recentRef}>
        <SectionHeader>Recent matches</SectionHeader>
      </div>

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

      <TeamsSheet open={showTeams} onClose={() => setShowTeams(false)} teams={stats.teams} />
      <PlayersSheet open={showPlayers} onClose={() => setShowPlayers(false)} players={stats.players} />
    </Screen>
  );
}
