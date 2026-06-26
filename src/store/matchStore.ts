import { create } from 'zustand';
import { computeInnings } from '../scoring/engine';
import { computeResult, inningsState as deriveInnings, teamById } from '../scoring/match';
import type {
  BallEvent,
  Innings,
  InningsState,
  Match,
  PlayerCategory,
  TossResult,
} from '../scoring/types';
import { dataService } from '../services/dataService';

export interface ActiveInnings {
  innings: Innings;
  which: 1 | 2;
  state: InningsState;
}

function activeInningsOf(match: Match): { innings: Innings; which: 1 | 2 } | null {
  if (match.status === 'innings2' && match.innings2) {
    return { innings: match.innings2, which: 2 };
  }
  if (match.innings1) return { innings: match.innings1, which: 1 };
  return null;
}

/** Recompute status + result from the innings logs after any mutation. */
function reconcile(match: Match): Match {
  if (!match.innings1) return match; // still in setup / toss
  if (!match.innings2) {
    return { ...match, status: 'innings1', result: null };
  }
  const s2 = deriveInnings(match, 2);
  if (s2?.isComplete) {
    return { ...match, status: 'complete', result: computeResult(match) };
  }
  return { ...match, status: 'innings2', result: null };
}

function setInnings(match: Match, which: 1 | 2, innings: Innings): Match {
  return which === 1 ? { ...match, innings1: innings } : { ...match, innings2: innings };
}

interface MatchState {
  match: Match | null;
  loading: boolean;
  // transient selections (not persisted until a ball is bowled)
  pendingStrikerId: string | null;
  pendingNonStrikerId: string | null;
  pendingBowlerId: string | null;
  _unsub: (() => void) | null;

  subscribe: (id: string) => void;
  unsubscribe: () => void;
  createMatch: (match: Match) => Promise<void>;

  activeInnings: () => ActiveInnings | null;

  setToss: (toss: TossResult) => void;
  startInnings1: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;
  startInnings2: (strikerId: string, nonStrikerId: string, bowlerId: string) => void;

  recordBall: (input: Partial<BallEvent>) => void;
  editLastBall: (input: Partial<BallEvent>) => void;
  undoLastBall: () => void;

  selectNewBatter: (playerId: string) => void;
  selectNewBowler: (playerId: string) => void;
  addPlayer: (teamId: string, name: string, category: PlayerCategory) => void;
}

function persist(match: Match) {
  void dataService.updateMatch(match);
}

export const useMatch = create<MatchState>((set, get) => ({
  match: null,
  loading: true,
  pendingStrikerId: null,
  pendingNonStrikerId: null,
  pendingBowlerId: null,
  _unsub: null,

  subscribe: (id) => {
    get().unsubscribe();
    set({ loading: true });
    const unsub = dataService.subscribeMatch(id, (match) => {
      set({ match, loading: false });
    });
    set({ _unsub: unsub });
  },

  unsubscribe: () => {
    get()._unsub?.();
    set({ _unsub: null });
  },

  createMatch: async (match) => {
    await dataService.createMatch(match);
    set({ match });
  },

  activeInnings: () => {
    const { match } = get();
    if (!match) return null;
    const active = activeInningsOf(match);
    if (!active) return null;
    const battingTeam = teamById(match, active.innings.battingTeamId);
    const state = computeInnings(active.innings, match.settings, battingTeam);
    return { ...active, state };
  },

  setToss: (toss) => {
    const { match } = get();
    if (!match) return;
    const updated = { ...match, toss, status: 'toss' as const };
    set({ match: updated });
    persist(updated);
  },

  startInnings1: (strikerId, nonStrikerId, bowlerId) => {
    const { match } = get();
    if (!match || !match.toss) return;
    // Decide who bats first from the toss decision.
    const winner = match.toss.winnerTeamId;
    const loser = winner === match.teamA.id ? match.teamB.id : match.teamA.id;
    const battingFirst = match.toss.decision === 'bat' ? winner : loser;
    const bowlingFirst = battingFirst === match.teamA.id ? match.teamB.id : match.teamA.id;
    const innings1: Innings = {
      battingTeamId: battingFirst,
      bowlingTeamId: bowlingFirst,
      openingStrikerId: strikerId,
      openingNonStrikerId: nonStrikerId,
      openingBowlerId: bowlerId,
      balls: [],
    };
    const updated = reconcile({ ...match, innings1, status: 'innings1' });
    set({ match: updated, pendingStrikerId: null, pendingNonStrikerId: null, pendingBowlerId: null });
    persist(updated);
  },

  startInnings2: (strikerId, nonStrikerId, bowlerId) => {
    const { match } = get();
    if (!match || !match.innings1) return;
    const s1 = deriveInnings(match, 1);
    const innings2: Innings = {
      battingTeamId: match.innings1.bowlingTeamId,
      bowlingTeamId: match.innings1.battingTeamId,
      openingStrikerId: strikerId,
      openingNonStrikerId: nonStrikerId,
      openingBowlerId: bowlerId,
      balls: [],
      target: (s1?.totalRuns ?? 0) + 1,
    };
    const updated = reconcile({ ...match, innings2, status: 'innings2' });
    set({ match: updated, pendingStrikerId: null, pendingNonStrikerId: null, pendingBowlerId: null });
    persist(updated);
  },

  recordBall: (input) => {
    const { match, pendingStrikerId, pendingNonStrikerId, pendingBowlerId } = get();
    if (!match) return;
    const active = get().activeInnings();
    if (!active) return;
    const { state, innings, which } = active;
    if (state.isComplete) return;

    const striker = state.strikerId ?? pendingStrikerId;
    const nonStriker = state.nonStrikerId ?? pendingNonStrikerId;
    const bowler = state.currentBowlerId ?? pendingBowlerId;
    if (!striker || !nonStriker || !bowler) return;

    const ball: BallEvent = {
      id: crypto.randomUUID(),
      striker,
      nonStriker,
      bowler,
      batterRuns: input.batterRuns ?? 0,
      extra: input.extra ?? 'none',
      extraRuns: input.extraRuns ?? 0,
      isWicket: input.isWicket ?? false,
      wicketType: input.wicketType,
      dismissedPlayerId: input.dismissedPlayerId ?? (input.isWicket ? striker : undefined),
      fielderId: input.fielderId,
      shot: input.shot,
    };
    const newInnings: Innings = { ...innings, balls: [...innings.balls, ball] };
    const updated = reconcile(setInnings(match, which, newInnings));
    set({
      match: updated,
      pendingStrikerId: null,
      pendingNonStrikerId: null,
      pendingBowlerId: null,
    });
    persist(updated);
  },

  editLastBall: (input) => {
    const { match } = get();
    if (!match) return;
    const active = get().activeInnings();
    if (!active || active.innings.balls.length === 0) return;
    const { innings, which } = active;
    const balls = [...innings.balls];
    const last = balls[balls.length - 1];
    balls[balls.length - 1] = {
      ...last,
      batterRuns: input.batterRuns ?? last.batterRuns,
      extra: input.extra ?? last.extra,
      extraRuns: input.extraRuns ?? last.extraRuns,
      isWicket: input.isWicket ?? last.isWicket,
      wicketType: input.isWicket === false ? undefined : input.wicketType ?? last.wicketType,
      dismissedPlayerId: input.dismissedPlayerId ?? last.dismissedPlayerId,
      fielderId: input.fielderId ?? last.fielderId,
    };
    const updated = reconcile(setInnings(match, which, { ...innings, balls }));
    set({ match: updated });
    persist(updated);
  },

  undoLastBall: () => {
    const { match } = get();
    if (!match) return;
    const active = get().activeInnings();
    if (!active || active.innings.balls.length === 0) return;
    const { innings, which } = active;
    const balls = innings.balls.slice(0, -1);
    const updated = reconcile(setInnings(match, which, { ...innings, balls }));
    set({
      match: updated,
      pendingStrikerId: null,
      pendingNonStrikerId: null,
      pendingBowlerId: null,
    });
    persist(updated);
  },

  selectNewBatter: (playerId) => {
    const active = get().activeInnings();
    if (!active) return;
    if (active.state.strikerId === null) set({ pendingStrikerId: playerId });
    else if (active.state.nonStrikerId === null) set({ pendingNonStrikerId: playerId });
  },

  selectNewBowler: (playerId) => {
    set({ pendingBowlerId: playerId });
  },

  addPlayer: (teamId, name, category) => {
    const { match } = get();
    if (!match) return;
    const newPlayer = { id: crypto.randomUUID(), name, category };
    const patch = (t: Match['teamA']) =>
      t.id === teamId ? { ...t, players: [...t.players, newPlayer] } : t;
    const updated = { ...match, teamA: patch(match.teamA), teamB: patch(match.teamB) };
    set({ match: updated });
    persist(updated);
  },
}));
