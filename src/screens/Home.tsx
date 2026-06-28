import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { inningsState } from '../scoring/match';
import type { Match } from '../scoring/types';
import { addFollowedId, getFollowedIds, removeFollowedId } from '../hooks/useFollowedMatches';
import { hidePlayer, hideTeam, isPlayerHidden, isTeamHidden } from '../hooks/useHidden';
import { Button, Drawer, DrawerItem, Screen, SectionHeader, StickyHeader, StatusText, TextInput } from '../components/ui';
import { Wordmark } from '../components/Logo';
import {
  CalendarIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ClipboardListIcon,
  JoinIcon,
  LiveDotIcon,
  LogoutIcon,
  TrashIcon,
  TrophyMiniIcon,
  UsersIcon,
} from '../components/icons';

type Tab = 'matches' | 'teams' | 'players';

function relativeDate(ts: number): string {
  const days = Math.floor((Date.now() - ts) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(ts).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

function isLive(m: Match): boolean {
  return m.status === 'innings1' || m.status === 'innings2';
}

function formatScheduledShort(ts: number | undefined, fallback = 'Scheduled'): string {
  if (!ts) return fallback;
  return new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function Stat({ value, label, active, onClick }: { value: number | string; label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center justify-center py-3 transition duration-150 active:bg-surface ${active ? 'bg-surface' : ''}`}>
      <span className={`nums text-[18px] font-semibold leading-none ${active ? 'text-accent' : 'text-fg'}`}>{value}</span>
      <span className={`mt-1 text-caption font-medium ${active ? 'text-fg' : 'text-fg-muted'}`}>{label}</span>
    </button>
  );
}

function MatchRow({ match, onClick, joined, onRemove }: { match: Match; onClick: () => void; joined?: boolean; onRemove?: () => void }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  const live = isLive(match);
  const isPlanning = match.status === 'planning';

  return (
    <div className="flex w-full items-center transition duration-150 hover:bg-surface">
      <button onClick={onClick} className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-item font-medium text-fg">
              {isPlanning ? 'Planning a match' : (
                <>{match.teamA.name} <span className="text-fg-faint">v</span> {match.teamB.name}</>
              )}
            </span>
            <span className="shrink-0 text-caption font-medium text-fg-muted">
              {live ? (
                <span className="inline-flex items-center gap-1.5 text-accent">
                  <LiveDotIcon /> Live
                </span>
              ) : match.status === 'scheduled' || isPlanning ? (
                formatScheduledShort(match.scheduledAt, isPlanning ? 'Planning' : 'Scheduled')
              ) : (
                relativeDate(match.createdAt)
              )}
            </span>
          </div>
          <div className="mt-0.5 flex items-center justify-between gap-2">
            <span className="nums truncate text-caption text-fg-muted">
              {s1 && <>{s1.totalRuns}/{s1.wickets}</>}
              {s2 && <> · {s2.totalRuns}/{s2.wickets}</>}
            </span>
            <span className="flex shrink-0 items-center gap-1.5">
              {joined && <StatusText tone="accent">Joined</StatusText>}
              {match.result && <span className="truncate text-caption text-success">{match.result}</span>}
            </span>
          </div>
        </div>
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          aria-label={joined ? 'Remove from your matches' : 'Delete match'}
          className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error"
        >
          <TrashIcon size={17} />
        </button>
      )}
    </div>
  );
}

function JoinByCode({ onJoined }: { onJoined: (match: Match) => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const join = async () => {
    const id = code.trim();
    if (!id || busy) return;
    setBusy(true);
    setError(null);
    try {
      const match = await dataService.getMatch(id);
      if (!match) {
        setError('No match found with that code.');
        return;
      }
      onJoined(match);
      setCode('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-2">
        <TextInput
          value={code}
          onChange={(e) => setCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && join()}
          placeholder="Enter match code to join"
          className="flex-1"
        />
        <Button variant="primary" onClick={join} disabled={!code.trim() || busy} className="shrink-0 px-3" aria-label="Join match">
          <JoinIcon size={18} />
        </Button>
      </div>
      {error && <p className="mt-1.5 text-caption text-error">{error}</p>}
    </div>
  );
}

export default function Home() {
  const user = useAuth((s) => s.user)!;
  const signOut = useAuth((s) => s.signOut);
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [followedMatches, setFollowedMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('matches');
  const [hiddenVersion, setHiddenVersion] = useState(0);
  const [expandedTeam, setExpandedTeam] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    dataService.listMyMatches(user.uid).then((m) => {
      setMatches(m);
      setLoading(false);
    });
    const ids = getFollowedIds(user.uid);
    if (ids.length > 0) {
      Promise.all(ids.map((id) => dataService.getMatch(id))).then((found) => {
        setFollowedMatches(found.filter((m): m is Match => m !== null));
      });
    }
  }, [user.uid]);

  const ownedIds = useMemo(() => new Set(matches.map((m) => m.id)), [matches]);
  const visibleFollowed = useMemo(() => followedMatches.filter((m) => !ownedIds.has(m.id)), [followedMatches, ownedIds]);
  const allMatches = useMemo(
    () => [...matches, ...visibleFollowed].sort((a, b) => b.createdAt - a.createdAt),
    [matches, visibleFollowed],
  );
  const liveMatches = useMemo(() => allMatches.filter(isLive), [allMatches]);
  const upcomingMatches = useMemo(
    () =>
      allMatches
        .filter((m) => m.status === 'scheduled' || m.status === 'planning')
        .sort((a, b) => (a.scheduledAt ?? 0) - (b.scheduledAt ?? 0)),
    [allMatches],
  );

  const stats = useMemo(() => {
    const teamMap = new Map<string, Set<string>>();
    const playerMap = new Map<string, Set<string>>();
    for (const m of matches) {
      for (const t of [m.teamA, m.teamB]) {
        if (isTeamHidden(user.uid, t.name)) continue;
        if (!teamMap.has(t.name)) teamMap.set(t.name, new Set());
        for (const p of t.players) {
          if (isPlayerHidden(user.uid, p.name)) continue;
          teamMap.get(t.name)!.add(p.name);
          if (!playerMap.has(p.name)) playerMap.set(p.name, new Set());
          playerMap.get(p.name)!.add(t.name);
        }
      }
    }
    return {
      matches: allMatches.length,
      teams: [...teamMap.entries()].map(([name, players]) => ({ name, players: [...players] })),
      players: [...playerMap.entries()].map(([name, teams]) => ({ name, teams: [...teams] })),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matches, allMatches, hiddenVersion]);

  const handleJoined = (match: Match) => {
    if (match.ownerUid !== user.uid) {
      addFollowedId(user.uid, match.id);
      setFollowedMatches((prev) => [match, ...prev.filter((m) => m.id !== match.id)]);
    }
    navigate(`/match/${match.id}`);
  };

  const handleDelete = async (match: Match) => {
    if (match.ownerUid === user.uid) {
      const label = match.status === 'planning' ? 'this planned match' : `${match.teamA.name} v ${match.teamB.name}`;
      if (!window.confirm(`Delete ${label}? This can't be undone.`)) return;
      await dataService.deleteMatch(match.id);
      setMatches((prev) => prev.filter((m) => m.id !== match.id));
    } else {
      removeFollowedId(user.uid, match.id);
      setFollowedMatches((prev) => prev.filter((m) => m.id !== match.id));
    }
  };

  return (
    <Screen>
      <StickyHeader
        title={
          <button onClick={() => setDrawerOpen(true)} aria-label="Open menu" className="-ml-1 flex items-center rounded-lg px-1 py-1 hover:bg-surface">
            <Wordmark size={18} />
          </button>
        }
      />

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <div className="border-b border-line px-4 py-4">
          <Wordmark size={20} />
        </div>
        <div className="flex-1 divide-line">
          <DrawerItem
            icon={<CalendarIcon size={18} />}
            label="Plan a match"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/plan');
            }}
          />
          <DrawerItem
            icon={<TrophyMiniIcon size={18} />}
            label="Tournaments"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/tournaments');
            }}
          />
          <DrawerItem
            icon={<ClipboardListIcon size={18} />}
            label="Squads"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/squads');
            }}
          />
          <DrawerItem
            icon={<UsersIcon size={18} />}
            label="Player stats"
            onClick={() => {
              setDrawerOpen(false);
              navigate('/players');
            }}
          />
        </div>
        <div className="border-t border-line">
          <DrawerItem icon={<LogoutIcon size={18} />} label="Sign out" onClick={signOut} />
        </div>
      </Drawer>

      <div className="px-4 pb-3 pt-3">
        <Button variant="primary" block onClick={() => navigate('/new')}>
          New match
        </Button>
      </div>

      {/* quick stats / tabs */}
      <div className="grid grid-cols-3 divide-x divide-line border-y border-line">
        <Stat value={stats.matches} label="Matches" active={tab === 'matches'} onClick={() => setTab('matches')} />
        <Stat value={stats.teams.length} label="Teams" active={tab === 'teams'} onClick={() => setTab('teams')} />
        <Stat value={stats.players.length} label="Players" active={tab === 'players'} onClick={() => setTab('players')} />
      </div>

      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : tab === 'matches' ? (
        <div>
          <SectionHeader>Join a match</SectionHeader>
          <JoinByCode onJoined={handleJoined} />

          {upcomingMatches.length > 0 && (
            <>
              <SectionHeader>Upcoming</SectionHeader>
              <div className="divide-line border-t border-line">
                {upcomingMatches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    onClick={() => navigate(`/match/${m.id}`)}
                    joined={m.ownerUid !== user.uid}
                    onRemove={() => handleDelete(m)}
                  />
                ))}
              </div>
            </>
          )}

          {liveMatches.length > 0 && (
            <>
              <SectionHeader>
                <span className="inline-flex items-center gap-1.5">
                  <LiveDotIcon /> Live now
                </span>
              </SectionHeader>
              <div className="divide-line border-t border-line">
                {liveMatches.map((m) => (
                  <MatchRow
                    key={m.id}
                    match={m}
                    onClick={() => navigate(`/match/${m.id}`)}
                    joined={m.ownerUid !== user.uid}
                    onRemove={() => handleDelete(m)}
                  />
                ))}
              </div>
            </>
          )}

          <SectionHeader>All matches</SectionHeader>
          {allMatches.length === 0 ? (
            <div className="px-4 py-5 text-caption text-fg-faint">No matches yet. Start one above.</div>
          ) : (
            <div className="divide-line border-t border-line">
              {allMatches.map((m) => (
                <MatchRow
                  key={m.id}
                  match={m}
                  onClick={() => navigate(`/match/${m.id}`)}
                  joined={m.ownerUid !== user.uid}
                  onRemove={() => handleDelete(m)}
                />
              ))}
            </div>
          )}
        </div>
      ) : tab === 'teams' ? (
        <div>
          <SectionHeader>Teams</SectionHeader>
          {stats.teams.length === 0 ? (
            <div className="px-4 py-5 text-caption text-fg-faint">No teams yet.</div>
          ) : (
            <div className="divide-line border-t border-line">
              {stats.teams.map((t) => {
                const expanded = expandedTeam === t.name;
                return (
                  <div key={t.name}>
                    <div className="flex w-full items-center transition duration-150 hover:bg-surface">
                      <button onClick={() => setExpandedTeam(expanded ? null : t.name)} className="flex min-w-0 flex-1 items-center gap-2.5 px-4 py-2.5 text-left">
                        <span className="min-w-0 flex-1 truncate text-body font-medium text-fg">{t.name}</span>
                        <span className="shrink-0 text-caption text-fg-muted">{t.players.length} players</span>
                        {expanded ? <ChevronDownIcon size={16} className="shrink-0 text-fg-faint" /> : <ChevronRightIcon size={16} className="shrink-0 text-fg-faint" />}
                      </button>
                      <button
                        onClick={() => {
                          hideTeam(user.uid, t.name);
                          setHiddenVersion((v) => v + 1);
                        }}
                        aria-label="Remove team"
                        className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error"
                      >
                        <TrashIcon size={17} />
                      </button>
                    </div>
                    {expanded && (
                      <div className="divide-line border-t border-line bg-bg px-4 py-2">
                        {t.players.map((p) => (
                          <div key={p} className="py-1.5 text-body text-fg-muted">
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div>
          <SectionHeader>Players</SectionHeader>
          {stats.players.length === 0 ? (
            <div className="px-4 py-5 text-caption text-fg-faint">No players yet.</div>
          ) : (
            <div className="divide-line border-t border-line">
              {stats.players.map((p) => (
                <div key={p.name} className="row justify-between">
                  <div className="min-w-0">
                    <div className="truncate text-body text-fg">{p.name}</div>
                    <div className="truncate text-caption text-fg-muted">{p.teams.join(', ')}</div>
                  </div>
                  <button
                    onClick={() => {
                      hidePlayer(user.uid, p.name);
                      setHiddenVersion((v) => v + 1);
                    }}
                    aria-label="Remove player"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error"
                  >
                    <TrashIcon size={17} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Screen>
  );
}
