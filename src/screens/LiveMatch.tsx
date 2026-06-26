import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { inningsState, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';
import { AccentButton, AppBar, GhostButton, GlassCard, MicroLabel, Screen, Tabs } from '../components/ui';
import Scorecard from '../components/Scorecard';
import ScoringPad from '../components/ScoringPad';
import InningsTable from '../components/InningsTable';
import Commentary from '../components/Commentary';
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
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-ink-muted">
        <span className="animate-pulse">Loading match…</span>
      </div>
    );
  }

  if (!match) {
    return (
      <Screen>
        <AppBar left={<button onClick={() => navigate('/')} className="text-ink-muted">←</button>} />
        <GlassCard className="mt-10 space-y-2 text-center text-sm text-ink-muted">
          <p>This match isn’t available on this device.</p>
          <p className="text-xs text-ink-faint">
            In this demo build, matches live in your browser. Live sharing across
            devices arrives when the cloud backend is wired in.
          </p>
        </GlassCard>
      </Screen>
    );
  }

  const isOwner = !!user && user.uid === match.ownerUid;

  return (
    <Screen>
      <AppBar
        live={match.status === 'innings1' || match.status === 'innings2'}
        left={
          <button onClick={() => navigate('/')} className="text-ink-muted">
            ←
          </button>
        }
        right={<ShareBar matchId={match.id} compact />}
      />

      {match.status === 'toss' ? (
        isOwner ? (
          <TossFlow match={match} />
        ) : (
          <WaitingForToss />
        )
      ) : (
        <MatchTabs match={match} isOwner={isOwner} />
      )}
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Tabbed match view (Cricbuzz-style): Live · Scorecard · Commentary
// ---------------------------------------------------------------------------
type TabId = 'live' | 'scorecard' | 'commentary';

function MatchTabs({ match, isOwner }: { match: Match; isOwner: boolean }) {
  const [tab, setTab] = useState<TabId>('live');
  const isComplete = match.status === 'complete';

  return (
    <div>
      <Tabs
        tabs={[
          { id: 'live', label: isComplete ? 'Result' : 'Live' },
          { id: 'scorecard', label: 'Scorecard' },
          { id: 'commentary', label: 'Commentary' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === 'live' &&
        (isComplete ? (
          <ResultView match={match} />
        ) : isOwner ? (
          <ScoringView match={match} />
        ) : (
          <ViewerView match={match} />
        ))}

      {tab === 'scorecard' && <ScorecardTab match={match} />}
      {tab === 'commentary' && <Commentary match={match} />}
    </div>
  );
}

function ScorecardTab({ match }: { match: Match }) {
  const s1 = inningsState(match, 1);
  const s2 = inningsState(match, 2);
  if (!s1 && !s2) {
    return <GlassCard className="text-center text-sm text-ink-faint">No scorecard yet.</GlassCard>;
  }
  return (
    <div className="space-y-4">
      {s1 && <InningsTable match={match} state={s1} />}
      {s2 && <InningsTable match={match} state={s2} />}
    </div>
  );
}

function ResultView({ match }: { match: Match }) {
  return (
    <div className="space-y-4">
      {match.result && (
        <div className="glass p-5 text-center">
          <MicroLabel className="mb-1">Result</MicroLabel>
          <div className="text-xl font-extrabold text-accent">{match.result}</div>
        </div>
      )}
      <ShareBar matchId={match.id} />
    </div>
  );
}

function WaitingForToss() {
  return (
    <GlassCard className="mt-10 text-center text-sm text-ink-muted">
      The toss is underway… the match will appear here live.
    </GlassCard>
  );
}

// ---------------------------------------------------------------------------
// Viewer (read-only, live)
// ---------------------------------------------------------------------------
function ViewerView({ match }: { match: Match }) {
  const state = currentState(match);
  if (!state) return null;
  return (
    <div className="space-y-4">
      <Scorecard match={match} state={state} />
      <div className="text-center text-xs text-ink-faint">
        Following live · updates ball by ball
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Scorer (owner)
// ---------------------------------------------------------------------------
function ScoringView({ match }: { match: Match }) {
  const active = useMatch((s) => s.activeInnings)();
  const pendingStrikerId = useMatch((s) => s.pendingStrikerId);
  const pendingNonStrikerId = useMatch((s) => s.pendingNonStrikerId);
  const pendingBowlerId = useMatch((s) => s.pendingBowlerId);
  const [managerOpen, setManagerOpen] = useState(false);

  if (!active) return null;
  const { state, which } = active;

  // End of first innings → innings break.
  if (which === 1 && state.isComplete && !match.innings2) {
    return <InningsBreak match={match} firstInnings={state} />;
  }

  const battingTeam = teamById(match, state.battingTeamId);
  const bowlingTeam = teamById(match, state.bowlingTeamId);

  const needBatter =
    (state.strikerId === null && !pendingStrikerId) ||
    (state.nonStrikerId === null && !pendingNonStrikerId);
  const needBowler = state.currentBowlerId === null && !pendingBowlerId;

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <GhostButton onClick={() => setManagerOpen(true)} className="px-3 py-1.5 text-xs">
          + Player
        </GhostButton>
      </div>

      <Scorecard match={match} state={state} />

      {needBatter ? (
        <NewBatterPrompt match={match} state={state} battingTeamId={battingTeam.id} pendingStrikerId={pendingStrikerId} pendingNonStrikerId={pendingNonStrikerId} />
      ) : needBowler ? (
        <NewBowlerPrompt bowlingTeamPlayers={bowlingTeam.players} lastBowlerId={lastBowler(match)} />
      ) : (
        <ScoringPad match={match} state={state} />
      )}

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

  const outIds = Object.values(state.batters)
    .filter((b) => b.out)
    .map((b) => b.playerId);
  const atCrease = [
    state.strikerId,
    state.nonStrikerId,
    pendingStrikerId,
    pendingNonStrikerId,
  ].filter(Boolean) as string[];

  return (
    <GlassCard className="space-y-3">
      <MicroLabel>Select next batter</MicroLabel>
      <PlayerPicker
        players={battingTeam.players}
        excludeIds={[...outIds, ...atCrease]}
        onSelect={selectNewBatter}
        emptyHint="No batters left — innings should be over."
      />
    </GlassCard>
  );
}

function NewBowlerPrompt({
  bowlingTeamPlayers,
  lastBowlerId,
}: {
  bowlingTeamPlayers: Match['teamA']['players'];
  lastBowlerId: string | null;
}) {
  const selectNewBowler = useMatch((s) => s.selectNewBowler);
  return (
    <GlassCard className="space-y-3">
      <MicroLabel>Next over — select bowler</MicroLabel>
      <PlayerPicker
        players={bowlingTeamPlayers}
        excludeIds={lastBowlerId ? [lastBowlerId] : []}
        onSelect={selectNewBowler}
      />
    </GlassCard>
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
    <div className="space-y-4">
      <div className="glass p-5 text-center">
        <MicroLabel className="mb-1">Innings break</MicroLabel>
        <div className="text-sm text-ink-muted">
          {teamById(match, firstInnings.battingTeamId).name} scored
        </div>
        <div className="nums text-3xl font-extrabold text-accent">
          {firstInnings.totalRuns}-{firstInnings.wickets}
        </div>
        <div className="mt-2 text-sm text-ink">
          {battingNext.name} need <span className="font-bold text-accent">{target}</span> to win
        </div>
      </div>

      <GlassCard className="space-y-3">
        <MicroLabel>Striker · {battingNext.name}</MicroLabel>
        <PlayerPicker players={battingNext.players} selectedId={strikerId} excludeIds={nonStrikerId ? [nonStrikerId] : []} onSelect={setStrikerId} />
      </GlassCard>
      <GlassCard className="space-y-3">
        <MicroLabel>Non-striker</MicroLabel>
        <PlayerPicker players={battingNext.players} selectedId={nonStrikerId} excludeIds={strikerId ? [strikerId] : []} onSelect={setNonStrikerId} />
      </GlassCard>
      <GlassCard className="space-y-3">
        <MicroLabel>Opening bowler · {bowlingNext.name}</MicroLabel>
        <PlayerPicker players={bowlingNext.players} selectedId={bowlerId} onSelect={setBowlerId} />
      </GlassCard>

      <div className="sticky bottom-4">
        <AccentButton disabled={!ready} onClick={() => startInnings2(strikerId!, nonStrikerId!, bowlerId!)} className="w-full">
          Start 2nd innings →
        </AccentButton>
      </div>
    </div>
  );
}

// ---- helpers ---------------------------------------------------------------
function currentState(match: Match): InningsState | null {
  if (match.status === 'innings2') return inningsState(match, 2);
  if (match.status === 'innings1') return inningsState(match, 1);
  return null;
}

function lastBowler(match: Match): string | null {
  const innings = match.status === 'innings2' ? match.innings2 : match.innings1;
  return innings?.balls.at(-1)?.bowler ?? null;
}
