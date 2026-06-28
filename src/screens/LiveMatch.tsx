import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { useSavedPlayers } from '../hooks/useSavedRoster';
import { dataService } from '../services/dataService';
import { inningsState, teamById } from '../scoring/match';
import type { InningsState, Match, Rsvp, Team } from '../scoring/types';
import { AutocompleteInput, BackButton, Button, Screen, SectionHeader, Sheet, StatusText, StickyHeader, Tabs, TextInput } from '../components/ui';
import Scoreboard from '../components/Scorecard';
import ScoringPad from '../components/ScoringPad';
import InningsTable from '../components/InningsTable';
import Commentary from '../components/Commentary';
import Squads from '../components/Squads';
import TossFlow from '../components/TossFlow';
import PlayerPicker from '../components/PlayerPicker';
import PlayerSlot from '../components/PlayerSlot';
import { BallIcon, BatIcon, LiveDotIcon, TrashIcon } from '../components/icons';
import PlayerManager from '../components/PlayerManager';
import ShareBar from '../components/ShareBar';
import MatchSummary from '../components/MatchSummary';
import RosterEditor from '../components/RosterEditor';
import TeamSplitter, { autoBalanceTeams } from '../components/TeamSplitter';

export default function LiveMatch() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);
  const subscribe = useMatch((s) => s.subscribe);
  const unsubscribe = useMatch((s) => s.unsubscribe);
  const match = useMatch((s) => s.match);
  const loading = useMatch((s) => s.loading);

  useEffect(() => {
    if (id) subscribe(id);
    return () => unsubscribe();
  }, [id, subscribe, unsubscribe]);

  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-caption text-fg-muted">Loading match…</div>;
  }

  if (!match) {
    return (
      <Screen>
        <StickyHeader left={<BackButton onClick={() => navigate('/')} />} title="Match" />
        <div className="px-4 py-6 text-caption text-fg-muted">
          This match isn’t available on this device. In the demo build, matches live in your browser.
        </div>
      </Screen>
    );
  }

  const isOwner = !!user && user.uid === match.ownerUid;

  if (match.status === 'planning') {
    return isOwner
      ? <PlanningOwnerView match={match} onBack={() => navigate('/')} />
      : <PlanningViewerView match={match} onBack={() => navigate('/')} />;
  }

  if (match.status === 'scheduled') {
    return isOwner
      ? <ScheduledMatchOwnerView match={match} onBack={() => navigate('/')} />
      : <ScheduledMatchViewerView match={match} onBack={() => navigate('/')} />;
  }

  if (match.status === 'toss') {
    return (
      <Screen>
        <StickyHeader title="Toss" left={<BackButton onClick={() => navigate('/')} />} right={<ShareBar matchId={match.id} compact />} />
        {isOwner ? <TossFlow match={match} /> : <div className="px-4 py-6 text-caption text-fg-muted">The toss is underway…</div>}
      </Screen>
    );
  }

  return <MatchView match={match} isOwner={isOwner} onBack={() => navigate('/')} />;
}

// ---------------------------------------------------------------------------
type TabId = 'live' | 'scorecard' | 'squads' | 'info';

function MatchView({ match, isOwner, onBack }: { match: Match; isOwner: boolean; onBack: () => void }) {
  const [tab, setTab] = useState<TabId>('live');
  const isComplete = match.status === 'complete';
  const board = inningsState(match, 2) ?? inningsState(match, 1);

  return (
    <Screen>
      <StickyHeader
        title={`${match.teamA.name} v ${match.teamB.name}`}
        left={<BackButton onClick={onBack} />}
        right={
          <>
            {!isComplete && <span className="mr-1 flex items-center gap-1.5 text-caption font-medium text-fg"><LiveDotIcon />Live</span>}
            <ShareBar matchId={match.id} compact />
          </>
        }
        border={false}
      >
        {board && <Scoreboard match={match} state={board} />}
        <Tabs
          tabs={[
            { id: 'live', label: 'Live' },
            { id: 'scorecard', label: 'Scorecard' },
            { id: 'squads', label: 'Squads' },
            { id: 'info', label: 'Info' },
          ]}
          active={tab}
          onChange={setTab}
        />
      </StickyHeader>

      <div className="flex-1 animate-fade-in">
        {tab === 'live' && <LiveTab match={match} isOwner={isOwner} />}
        {tab === 'scorecard' && <ScorecardTab match={match} />}
        {tab === 'squads' && <Squads match={match} />}
        {tab === 'info' && <InfoTab match={match} />}
      </div>
    </Screen>
  );
}

function ResultBanner({ match }: { match: Match }) {
  if (!match.result) return null;
  return <div className="border-b border-line bg-surface px-4 py-2.5 text-body font-semibold text-accent">{match.result}</div>;
}

function Token({ t }: { t: string }) {
  const cls = t.includes('W') ? 'border-error/50 text-error' : t === '4' || t === '6' ? 'border-boundary/50 text-boundary' : t === '•' ? 'border-line text-fg-faint' : 'border-line-strong text-fg';
  return <span className={`nums flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-caption font-semibold ${cls}`}>{t}</span>;
}

function ThisOver({ state }: { state: InningsState }) {
  return (
    <div className="flex items-center gap-3 border-b border-line px-4 py-2.5">
      <span className="shrink-0 text-caption text-fg-faint">This over</span>
      <div className="flex flex-wrap gap-1.5">
        {state.thisOver.length === 0 ? <span className="text-caption text-fg-faint">—</span> : state.thisOver.map((t, i) => <Token key={i} t={t} />)}
      </div>
    </div>
  );
}

// ---- Live tab ----
function LiveTab({ match, isOwner }: { match: Match; isOwner: boolean }) {
  if (match.status === 'complete') {
    return (
      <div>
        <ResultBanner match={match} />
        <ShareBar matchId={match.id} />
        <MatchSummary match={match} />
        <Commentary match={match} />
      </div>
    );
  }
  return isOwner ? <OwnerLive match={match} /> : <ViewerLive match={match} />;
}

function ViewerLive({ match }: { match: Match }) {
  const state = inningsState(match, 2) ?? inningsState(match, 1);
  if (!state) return null;
  return (
    <div>
      <ThisOver state={state} />
      <Commentary match={match} />
    </div>
  );
}

function OwnerLive({ match }: { match: Match }) {
  const active = useMatch((s) => s.activeInnings)();
  const pendingStrikerId = useMatch((s) => s.pendingStrikerId);
  const pendingNonStrikerId = useMatch((s) => s.pendingNonStrikerId);
  const pendingBowlerId = useMatch((s) => s.pendingBowlerId);
  const [managerOpen, setManagerOpen] = useState(false);

  if (!active) return null;
  const { state, which } = active;

  if (which === 1 && state.isComplete && !match.innings2) {
    return <InningsBreak match={match} firstInnings={state} />;
  }

  const battingTeam = teamById(match, state.battingTeamId);
  const bowlingTeam = teamById(match, state.bowlingTeamId);
  const needBatter = (state.strikerId === null && !pendingStrikerId) || (state.nonStrikerId === null && !pendingNonStrikerId);
  const needBowler = state.currentBowlerId === null && !pendingBowlerId;

  if (needBatter) {
    return <NewBatterPrompt match={match} state={state} battingTeamId={battingTeam.id} pendingStrikerId={pendingStrikerId} pendingNonStrikerId={pendingNonStrikerId} />;
  }
  if (needBowler) {
    return <NewBowlerPrompt bowlingTeamPlayers={bowlingTeam.players} lastBowlerId={lastBowler(match)} />;
  }

  return (
    <div>
      <ThisOver state={state} />
      <ScoringPad match={match} state={state} />
      <div className="border-y border-line px-4 py-2.5">
        <Button variant="ghost" size="sm" onClick={() => setManagerOpen(true)}>
          + Add player
        </Button>
      </div>
      <Commentary match={match} />
      <PlayerManager open={managerOpen} onClose={() => setManagerOpen(false)} match={match} />
    </div>
  );
}

function NewBatterPrompt({
  match,
  state,
  battingTeamId,
  pendingStrikerId,
  pendingNonStrikerId,
}: {
  match: Match;
  state: InningsState;
  battingTeamId: string;
  pendingStrikerId: string | null;
  pendingNonStrikerId: string | null;
}) {
  const selectNewBatter = useMatch((s) => s.selectNewBatter);
  const battingTeam = teamById(match, battingTeamId);
  const outIds = Object.values(state.batters).filter((b) => b.out).map((b) => b.playerId);
  const atCrease = [state.strikerId, state.nonStrikerId, pendingStrikerId, pendingNonStrikerId].filter(Boolean) as string[];

  return (
    <div>
      <SectionHeader>Select next batter</SectionHeader>
      <div className="px-4">
        <PlayerPicker players={battingTeam.players} excludeIds={[...outIds, ...atCrease]} onSelect={selectNewBatter} emptyHint="No batters left." />
      </div>
    </div>
  );
}

function NewBowlerPrompt({ bowlingTeamPlayers, lastBowlerId }: { bowlingTeamPlayers: Match['teamA']['players']; lastBowlerId: string | null }) {
  const selectNewBowler = useMatch((s) => s.selectNewBowler);
  return (
    <div>
      <SectionHeader>Next over — select bowler</SectionHeader>
      <div className="px-4">
        <PlayerPicker players={bowlingTeamPlayers} excludeIds={lastBowlerId ? [lastBowlerId] : []} onSelect={selectNewBowler} />
      </div>
    </div>
  );
}

function InningsBreak({ match, firstInnings }: { match: Match; firstInnings: InningsState }) {
  const startInnings2 = useMatch((s) => s.startInnings2);
  const battingNext = teamById(match, firstInnings.bowlingTeamId);
  const bowlingNext = teamById(match, firstInnings.battingTeamId);
  const target = firstInnings.totalRuns + 1;

  const [strikerId, setStrikerId] = useState<string | null>(null);
  const [nonStrikerId, setNonStrikerId] = useState<string | null>(null);
  const [bowlerId, setBowlerId] = useState<string | null>(null);
  const ready = strikerId && nonStrikerId && bowlerId && strikerId !== nonStrikerId;

  return (
    <div className="animate-fade-in">
      <div className="border-b border-line px-4 py-3">
        <div className="text-caption text-fg-muted">Innings break</div>
        <div className="mt-0.5 text-body text-fg">
          {teamById(match, firstInnings.battingTeamId).name} <span className="nums font-semibold">{firstInnings.totalRuns}/{firstInnings.wickets}</span>
          <span className="text-fg-muted"> · {battingNext.name} need </span>
          <span className="nums font-semibold text-accent">{target}</span>
        </div>
      </div>
      <SectionHeader>Opening line-up</SectionHeader>
      <div className="divide-line border-y border-line">
        <PlayerSlot
          label={`Striker · ${battingNext.name}`}
          icon={<BatIcon size={18} />}
          players={battingNext.players}
          selectedId={strikerId}
          excludeIds={nonStrikerId ? [nonStrikerId] : []}
          onSelect={setStrikerId}
        />
        <PlayerSlot
          label="Non-striker"
          icon={<BatIcon size={18} />}
          players={battingNext.players}
          selectedId={nonStrikerId}
          excludeIds={strikerId ? [strikerId] : []}
          onSelect={setNonStrikerId}
        />
        <PlayerSlot
          label={`Opening bowler · ${bowlingNext.name}`}
          icon={<BallIcon size={18} />}
          players={bowlingNext.players}
          selectedId={bowlerId}
          onSelect={setBowlerId}
        />
      </div>
      <div className="sticky bottom-0 mt-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Button variant="primary" block disabled={!ready} onClick={() => startInnings2(strikerId!, nonStrikerId!, bowlerId!)}>
          Start 2nd innings
        </Button>
      </div>
    </div>
  );
}

function ScorecardTab({ match }: { match: Match }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  if (!s1 && !s2) return <div className="px-4 py-6 text-caption text-fg-faint">No scorecard yet.</div>;
  return (
    <div className="divide-y divide-line">
      {s2 && <InningsTable match={match} state={s2} defaultOpen />}
      {s1 && <InningsTable match={match} state={s1} defaultOpen={!s2} />}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-body">
      <span className="text-fg-muted">{label}</span>
      <span className="nums text-fg">{value}</span>
    </div>
  );
}

function InfoTab({ match }: { match: Match }) {
  const toss = match.toss;
  return (
    <div className="px-4 py-4">
      <SectionHeader>Toss</SectionHeader>
      {toss ? (
        <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3">
          <div className="text-body text-fg">
            <span className="font-semibold text-accent">{teamById(match, toss.winnerTeamId).name}</span> won the toss and opted to{' '}
            <span className="font-semibold">{toss.decision}</span>
          </div>
          <div className="mt-1 text-caption text-fg-muted">
            {teamById(match, toss.callingTeamId).name} called {toss.call} — it landed {toss.outcome}
          </div>
        </div>
      ) : (
        <div className="px-1 text-caption text-fg-faint">No toss recorded for this match.</div>
      )}

      <div className="mt-5">
        <SectionHeader>Match settings</SectionHeader>
        <div className="divide-line rounded-lg border border-line-strong bg-surface">
          <InfoRow label="Overs per innings" value={match.settings.oversPerInnings} />
          <InfoRow label="Wide penalty" value={`${match.settings.wideRuns} run${match.settings.wideRuns === 1 ? '' : 's'}`} />
          <InfoRow label="No-ball penalty" value={`${match.settings.noBallRuns} run${match.settings.noBallRuns === 1 ? '' : 's'}`} />
          <InfoRow label="Free hit after no-ball" value={match.settings.freeHitAfterNoBall ? 'Yes' : 'No'} />
        </div>
      </div>
    </div>
  );
}

function lastBowler(match: Match): string | null {
  const innings = match.status === 'innings2' ? match.innings2 : match.innings1;
  return innings?.balls.at(-1)?.bowler ?? null;
}

// ---- Scheduled match ----
function formatScheduledAt(ts?: number): string {
  if (!ts) return 'Not scheduled yet';
  return new Date(ts).toLocaleString(undefined, { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });
}

function TeamRosterCard({ team }: { team: Team }) {
  return (
    <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3">
      <div className="flex items-center gap-2.5">
        <span className="text-body font-medium text-fg">{team.name}</span>
        <span className="text-caption text-fg-faint">{team.players.length} players</span>
      </div>
      {team.players.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {team.players.map((p) => (
            <span key={p.id} className="rounded-md border border-line px-2 py-0.5 text-caption text-fg-muted">
              {p.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ---- Planning match (invite sent, teams not yet formed) ----
function GroundInfo({ match }: { match: Match }) {
  if (!match.groundName) return null;
  return (
    <div className="mt-2 text-caption text-fg-muted">
      {match.groundName}
      {match.groundAddress ? ` · ${match.groundAddress}` : ''}
      {match.groundStatus && <span className="ml-1.5">· <StatusText tone={match.groundStatus === 'confirmed' ? 'success' : 'neutral'}>{match.groundStatus === 'confirmed' ? 'Confirmed' : 'Pending'}</StatusText></span>}
    </div>
  );
}

function PlanningViewerView({ match, onBack }: { match: Match; onBack: () => void }) {
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [name, setName] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => dataService.subscribeRsvps(match.id, setRsvps), [match.id]);

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await dataService.addRsvp({ id: crypto.randomUUID(), matchId: match.id, name: trimmed, respondedAt: Date.now() });
      setSubmitted(true);
    } finally {
      setBusy(false);
    }
  };

  const names = [...(match.pool ?? []).map((p) => p.name), ...rsvps.map((r) => r.name)];

  return (
    <Screen>
      <StickyHeader title="Match invite" left={<BackButton onClick={onBack} />} right={<ShareBar matchId={match.id} compact />} />
      <div className="px-4 py-4">
        <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-center">
          <div className="text-caption text-fg-muted">Tentative date</div>
          <div className="mt-0.5 text-body font-semibold text-fg">{formatScheduledAt(match.scheduledAt)}</div>
          <GroundInfo match={match} />
        </div>
      </div>

      <SectionHeader>Who's in</SectionHeader>
      <div className="px-4">
        {names.length === 0 ? (
          <div className="py-2 text-caption text-fg-faint">No one's responded yet — be the first.</div>
        ) : (
          <div className="flex flex-wrap gap-1.5 pb-2">
            {names.map((n, i) => (
              <span key={i} className="rounded-md border border-line px-2 py-0.5 text-caption text-fg-muted">{n}</span>
            ))}
          </div>
        )}
      </div>

      <div className="mt-2 space-y-2 px-4 pb-6">
        {submitted ? (
          <StatusText tone="success">You're in — see you there.</StatusText>
        ) : (
          <>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            <Button variant="primary" block disabled={!name.trim() || busy} onClick={submit}>
              I'm in
            </Button>
          </>
        )}
      </div>
    </Screen>
  );
}

function PlanningFormTeamsView({
  match,
  pool,
  onBack,
}: {
  match: Match;
  pool: Match['pool'];
  onBack: () => void;
}) {
  const players = pool ?? [];
  const [teamA, setTeamA] = useState<Team | null>(null);
  const [teamB, setTeamB] = useState<Team | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const [a, b] = autoBalanceTeams(players, 'Team 1', 'Team 2');
    setTeamA(a);
    setTeamB(b);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reshuffle = () => {
    if (!teamA || !teamB) return;
    const [a, b] = autoBalanceTeams(players, teamA.name, teamB.name);
    setTeamA(a);
    setTeamB(b);
  };

  const startMatch = async () => {
    if (!teamA || !teamB || busy) return;
    setBusy(true);
    try {
      await dataService.updateMatch({ ...match, teamA, teamB, status: 'toss' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <StickyHeader title="Form teams" left={<BackButton onClick={onBack} />} />
      <div className="px-4 pb-2 pt-4 text-caption text-fg-faint">
        Auto-balanced into two even sides — tap a player to move them across, rename either side, or re-shuffle.
      </div>
      {teamA && teamB && (
        <TeamSplitter teamA={teamA} teamB={teamB} onTeamAChange={setTeamA} onTeamBChange={setTeamB} onReshuffle={reshuffle} />
      )}
      <div className="sticky bottom-0 mt-5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Button variant="primary" block disabled={busy || !teamA?.players.length || !teamB?.players.length} onClick={startMatch}>
          Start match
        </Button>
      </div>
    </Screen>
  );
}

function PlanningOwnerView({ match, onBack }: { match: Match; onBack: () => void }) {
  const user = useAuth((s) => s.user)!;
  const savedPlayers = useSavedPlayers(user.uid);
  const [rsvps, setRsvps] = useState<Rsvp[]>([]);
  const [poolDraft, setPoolDraft] = useState('');
  const [editingInfo, setEditingInfo] = useState(false);
  const [dateAt, setDateAt] = useState('');
  const [groundName, setGroundName] = useState(match.groundName ?? '');
  const [groundAddress, setGroundAddress] = useState(match.groundAddress ?? '');
  const [forming, setForming] = useState(false);
  const [busy, setBusy] = useState(false);

  const pool = match.pool ?? [];

  useEffect(() => dataService.subscribeRsvps(match.id, setRsvps), [match.id]);

  if (forming) {
    return <PlanningFormTeamsView match={match} pool={pool} onBack={() => setForming(false)} />;
  }

  const addToPool = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    await dataService.updateMatch({ ...match, pool: [...pool, { id: crypto.randomUUID(), name: trimmed, category: 'gents' }] });
    setPoolDraft('');
  };
  const removeFromPool = async (pid: string) => {
    await dataService.updateMatch({ ...match, pool: pool.filter((p) => p.id !== pid) });
  };
  const addRsvpToPool = async (rsvpName: string) => {
    if (pool.some((p) => p.name.trim().toLowerCase() === rsvpName.trim().toLowerCase())) return;
    await dataService.updateMatch({ ...match, pool: [...pool, { id: crypto.randomUUID(), name: rsvpName, category: 'gents' }] });
  };

  const saveInfo = async () => {
    setBusy(true);
    try {
      await dataService.updateMatch({
        ...match,
        ...(dateAt ? { scheduledAt: new Date(dateAt).getTime() } : {}),
        ...(groundName.trim() ? { groundName: groundName.trim(), groundStatus: match.groundStatus ?? 'pending' } : {}),
        ...(groundAddress.trim() ? { groundAddress: groundAddress.trim() } : {}),
      });
      setEditingInfo(false);
    } finally {
      setBusy(false);
    }
  };

  const toggleGroundConfirmed = async () => {
    await dataService.updateMatch({ ...match, groundStatus: match.groundStatus === 'confirmed' ? 'pending' : 'confirmed' });
  };

  const newRsvps = rsvps.filter((r) => !pool.some((p) => p.name.trim().toLowerCase() === r.name.trim().toLowerCase()));

  return (
    <Screen>
      <StickyHeader title="Plan a match" left={<BackButton onClick={onBack} />} right={<ShareBar matchId={match.id} compact />} />

      <div className="px-4 py-4">
        <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-center">
          <div className="text-caption text-fg-muted">Tentative date</div>
          <div className="mt-0.5 text-body font-semibold text-fg">{formatScheduledAt(match.scheduledAt)}</div>
          <GroundInfo match={match} />
        </div>
      </div>

      {!editingInfo ? (
        <div className="px-4 pb-4">
          <button onClick={() => { setDateAt(''); setEditingInfo(true); }} className="text-caption font-medium text-accent">
            Edit date / ground
          </button>
          {match.groundName && (
            <button onClick={toggleGroundConfirmed} className="ml-4 text-caption font-medium text-accent">
              Mark ground {match.groundStatus === 'confirmed' ? 'pending' : 'confirmed'}
            </button>
          )}
        </div>
      ) : (
        <div className="mx-4 mb-4 space-y-2 rounded-[10px] border border-line-strong bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-fg-muted">New date/time</span>
            <input
              type="datetime-local"
              value={dateAt}
              onChange={(e) => setDateAt(e.target.value)}
              className="rounded-md border border-line-strong bg-surface2 px-2 py-1.5 text-body text-fg outline-none focus:border-accent"
            />
          </div>
          <TextInput value={groundName} onChange={(e) => setGroundName(e.target.value)} placeholder="Ground name" />
          <TextInput value={groundAddress} onChange={(e) => setGroundAddress(e.target.value)} placeholder="Address" />
          <Button variant="secondary" block disabled={busy} onClick={saveInfo}>
            Save details
          </Button>
        </div>
      )}

      <SectionHeader>Pool ({pool.length})</SectionHeader>
      <div className="flex items-center gap-2 px-4 pb-2">
        <div className="flex-1">
          <AutocompleteInput value={poolDraft} onChange={setPoolDraft} suggestions={savedPlayers} onSubmit={() => addToPool(poolDraft)} placeholder="Add player name" />
        </div>
        <Button variant="secondary" onClick={() => addToPool(poolDraft)} disabled={!poolDraft.trim()} className="shrink-0 px-4">
          Add
        </Button>
      </div>

      {pool.length > 0 && (
        <div className="divide-line border-t border-line">
          {pool.map((p, i) => (
            <div key={p.id} className="row justify-between">
              <span className="flex items-center gap-3 text-body text-fg">
                <span className="text-caption text-fg-faint">{i + 1}</span>
                {p.name}
              </span>
              <button onClick={() => removeFromPool(p.id)} aria-label="Remove player" className="flex h-8 w-8 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error">
                <TrashIcon size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {newRsvps.length > 0 && (
        <>
          <SectionHeader>New RSVPs</SectionHeader>
          <div className="divide-line border-t border-line">
            {newRsvps.map((r) => (
              <div key={r.id} className="row justify-between">
                <span className="text-body text-fg">{r.name}</span>
                <button onClick={() => addRsvpToPool(r.name)} className="text-caption font-medium text-accent">
                  Add to pool
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="space-y-2 px-4 py-6">
        <Button variant="primary" block disabled={pool.length < 4} onClick={() => setForming(true)}>
          {pool.length < 4 ? `Add at least 4 players (${pool.length}/4)` : 'Form teams & start'}
        </Button>
      </div>
    </Screen>
  );
}

function ScheduledMatchViewerView({ match, onBack }: { match: Match; onBack: () => void }) {
  return (
    <Screen>
      <StickyHeader title={`${match.teamA.name} v ${match.teamB.name}`} left={<BackButton onClick={onBack} />} right={<ShareBar matchId={match.id} compact />} />
      <div className="px-4 py-4">
        <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-center">
          <div className="text-caption text-fg-muted">Starts</div>
          <div className="mt-0.5 text-body font-semibold text-fg">{formatScheduledAt(match.scheduledAt)}</div>
        </div>
      </div>
      <div className="space-y-3 px-4 pb-6">
        <TeamRosterCard team={match.teamA} />
        <TeamRosterCard team={match.teamB} />
      </div>
    </Screen>
  );
}

function ScheduledMatchOwnerView({ match, onBack }: { match: Match; onBack: () => void }) {
  const user = useAuth((s) => s.user)!;
  const savedPlayers = useSavedPlayers(user.uid);
  const [rescheduling, setRescheduling] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState<'A' | 'B'>('A');
  const [draftTeamA, setDraftTeamA] = useState(match.teamA);
  const [draftTeamB, setDraftTeamB] = useState(match.teamB);
  const [busy, setBusy] = useState(false);

  const startNow = async () => {
    setBusy(true);
    try {
      await dataService.updateMatch({ ...match, status: 'toss' });
    } finally {
      setBusy(false);
    }
  };

  const saveReschedule = async () => {
    if (!newTime) return;
    setBusy(true);
    try {
      await dataService.updateMatch({ ...match, scheduledAt: new Date(newTime).getTime() });
      setRescheduling(false);
    } finally {
      setBusy(false);
    }
  };

  const openEditRoster = () => {
    setDraftTeamA(match.teamA);
    setDraftTeamB(match.teamB);
    setEditTab('A');
    setEditOpen(true);
  };

  const saveRoster = async () => {
    setBusy(true);
    try {
      await dataService.updateMatch({ ...match, teamA: draftTeamA, teamB: draftTeamB });
      setEditOpen(false);
    } finally {
      setBusy(false);
    }
  };

  const updateActiveTeam = (updater: (t: Team) => Team) => {
    if (editTab === 'A') setDraftTeamA(updater);
    else setDraftTeamB(updater);
  };
  const activeDraft = editTab === 'A' ? draftTeamA : draftTeamB;

  return (
    <Screen>
      <StickyHeader title={`${match.teamA.name} v ${match.teamB.name}`} left={<BackButton onClick={onBack} />} right={<ShareBar matchId={match.id} compact />} />

      <div className="px-4 py-4">
        <div className="rounded-lg border border-line-strong bg-surface px-3.5 py-3 text-center">
          <div className="text-caption text-fg-muted">Starts</div>
          <div className="mt-0.5 text-body font-semibold text-fg">{formatScheduledAt(match.scheduledAt)}</div>
        </div>
      </div>

      <div className="space-y-3 px-4 pb-4">
        <TeamRosterCard team={match.teamA} />
        <TeamRosterCard team={match.teamB} />
      </div>

      {rescheduling && (
        <div className="mx-4 mb-4 space-y-2 rounded-[10px] border border-line-strong bg-surface px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-caption text-fg-muted">New start time</span>
            <input
              type="datetime-local"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="rounded-md border border-line-strong bg-surface2 px-2 py-1.5 text-body text-fg outline-none focus:border-accent"
            />
          </div>
          <Button variant="secondary" block disabled={!newTime || busy} onClick={saveReschedule}>
            Save new time
          </Button>
        </div>
      )}

      <div className="space-y-2 px-4 pb-6">
        <Button variant="primary" block disabled={busy} onClick={startNow}>
          Start now
        </Button>
        <Button variant="secondary" block disabled={busy} onClick={() => setRescheduling((v) => !v)}>
          {rescheduling ? 'Cancel reschedule' : 'Reschedule'}
        </Button>
        <Button variant="secondary" block disabled={busy} onClick={openEditRoster}>
          Edit roster
        </Button>
      </div>

      <Sheet open={editOpen} onClose={() => setEditOpen(false)} title="Edit roster">
        <div>
          <div className="grid grid-cols-2 border-b border-line">
            {(['A', 'B'] as const).map((slot) => {
              const t = slot === 'A' ? draftTeamA : draftTeamB;
              const isActive = editTab === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setEditTab(slot)}
                  className={`relative truncate px-3 py-3 text-body font-medium transition duration-150 ${isActive ? 'text-fg' : 'text-fg-muted'}`}
                >
                  {t.name}
                  <span className="ml-1.5 text-caption text-fg-faint">{t.players.length}</span>
                  {isActive && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>
          <RosterEditor
            team={activeDraft}
            suggestions={savedPlayers}
            onRename={(name) => updateActiveTeam((t) => ({ ...t, name }))}
            onAdd={(name) => updateActiveTeam((t) => ({ ...t, players: [...t.players, { id: crypto.randomUUID(), name, category: 'gents' }] }))}
            onRemove={(pid) => updateActiveTeam((t) => ({ ...t, players: t.players.filter((p) => p.id !== pid) }))}
            onEditPlayer={(pid, name) => updateActiveTeam((t) => ({ ...t, players: t.players.map((p) => (p.id === pid ? { ...p, name } : p)) }))}
          />
          <div className="px-4 py-4">
            <Button variant="primary" block disabled={busy} onClick={saveRoster}>
              Save roster
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
