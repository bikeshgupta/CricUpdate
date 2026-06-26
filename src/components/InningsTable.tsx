import { playerName, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';
import { GlassCard, MicroLabel } from './ui';

export function wicketLabel(state: InningsState, match: Match, batterId: string): string {
  const b = state.batters[batterId];
  if (!b?.out) return 'not out';
  switch (b.wicketType) {
    case 'runout':
      return 'run out';
    case 'bowled':
      return `b ${playerName(match, b.outBowlerId)}`;
    case 'lbw':
      return `lbw b ${playerName(match, b.outBowlerId)}`;
    case 'caught':
      return `c ${b.outFielderId ? playerName(match, b.outFielderId) : '?'} b ${playerName(match, b.outBowlerId)}`;
    case 'stumped':
      return `st b ${playerName(match, b.outBowlerId)}`;
    default:
      return b.wicketType ?? 'out';
  }
}

export default function InningsTable({ match, state }: { match: Match; state: InningsState }) {
  const battingTeam = teamById(match, state.battingTeamId);

  return (
    <GlassCard className="space-y-3">
      <div className="flex items-baseline justify-between">
        <span className="font-semibold text-ink">{battingTeam.name}</span>
        <span className="nums font-bold text-accent">
          {state.totalRuns}-{state.wickets}{' '}
          <span className="text-sm font-normal text-ink-muted">({state.oversText})</span>
        </span>
      </div>

      {/* column header */}
      <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-faint">
        <span>Batter</span>
        <span>R (B)</span>
      </div>

      {/* batting */}
      <div className="space-y-1.5">
        {state.battingOrder.map((id) => {
          const b = state.batters[id];
          const isStriker = id === state.strikerId;
          const isAtCrease = id === state.strikerId || id === state.nonStrikerId;
          return (
            <div key={id} className="flex items-center justify-between text-sm">
              <div className="min-w-0">
                <span className={isAtCrease ? 'font-semibold text-ink' : 'text-ink'}>
                  {playerName(match, id)}
                  {isStriker && <span className="text-accent"> *</span>}
                </span>
                <span className="ml-2 text-[11px] text-ink-faint">{wicketLabel(state, match, id)}</span>
              </div>
              <span className="nums shrink-0 text-ink-muted">
                <span className="font-semibold text-ink">{b.runs}</span> ({b.balls})
              </span>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-ink-faint">
        Extras {state.extras.total} (wd {state.extras.wides}, nb {state.extras.noBalls}, b{' '}
        {state.extras.byes}, lb {state.extras.legByes})
      </div>

      {/* bowling */}
      <div className="border-t border-glass-border pt-2.5">
        <MicroLabel className="mb-1.5">Bowling</MicroLabel>
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider text-ink-faint">
          <span>Bowler</span>
          <span>O–M–R–W</span>
        </div>
        <div className="mt-1 space-y-1">
          {Object.values(state.bowlers)
            .filter((b) => b.ballsBowled > 0)
            .map((b) => (
              <div key={b.playerId} className="flex items-center justify-between text-sm">
                <span className="text-ink">{playerName(match, b.playerId)}</span>
                <span className="nums text-ink-muted">
                  {Math.floor(b.ballsBowled / 6)}.{b.ballsBowled % 6}–{b.maidens}–{b.runsConceded}–
                  {b.wickets}
                </span>
              </div>
            ))}
        </div>
      </div>
    </GlassCard>
  );
}
