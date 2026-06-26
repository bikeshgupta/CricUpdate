import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { inningsState, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';
import { BackButton, Button, Screen, SectionHeader, StickyHeader, Tabs } from '../components/ui';
import Scoreboard from '../components/Scorecard';
import ScoringPad from '../components/ScoringPad';
import InningsTable from '../components/InningsTable';
import Commentary from '../components/Commentary';
import Squads from '../components/Squads';
import TossFlow from '../components/TossFlow';
import PlayerPicker from '../components/PlayerPicker';
import PlayerManager from '../components/PlayerManager';
import ShareBar from '../components/ShareBar';

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
type TabId = 'live' | 'scorecard' | 'squads';

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
            {!isComplete && <span className="mr-1 flex items-center gap-1.5 text-caption font-medium text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Live</span>}
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
          ]}
          active={tab}
          onChange={setTab}
        />
      </StickyHeader>

      <div className="flex-1 animate-fade-in">
        {tab === 'live' && <LiveTab match={match} isOwner={isOwner} />}
        {tab === 'scorecard' && <ScorecardTab match={match} />}
        {tab === 'squads' && <Squads match={match} />}
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
      <SectionHeader>Striker · {battingNext.name}</SectionHeader>
      <div className="px-4"><PlayerPicker players={battingNext.players} selectedId={strikerId} excludeIds={nonStrikerId ? [nonStrikerId] : []} onSelect={setStrikerId} /></div>
      <SectionHeader>Non-striker</SectionHeader>
      <div className="px-4"><PlayerPicker players={battingNext.players} selectedId={nonStrikerId} excludeIds={strikerId ? [strikerId] : []} onSelect={setNonStrikerId} /></div>
      <SectionHeader>Opening bowler · {bowlingNext.name}</SectionHeader>
      <div className="px-4"><PlayerPicker players={bowlingNext.players} selectedId={bowlerId} onSelect={setBowlerId} /></div>
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

function lastBowler(match: Match): string | null {
  const innings = match.status === 'innings2' ? match.innings2 : match.innings1;
  return innings?.balls.at(-1)?.bowler ?? null;
}
