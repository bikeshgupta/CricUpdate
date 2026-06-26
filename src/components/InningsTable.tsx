import { playerName, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';

export function wicketLabel(state: InningsState, match: Match, batterId: string): string {
  const b = state.batters[batterId];
  if (!b?.out) return state.strikerId === batterId || state.nonStrikerId === batterId ? 'not out' : '';
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

const BAT_COLS = 'grid grid-cols-[1fr_2.25rem_1.75rem_1.75rem_1.75rem_2.75rem] items-center gap-1';
const BOWL_COLS = 'grid grid-cols-[1fr_2.5rem_1.75rem_2rem_1.75rem_3rem] items-center gap-1';

export default function InningsTable({ match, state }: { match: Match; state: InningsState }) {
  const battingTeam = teamById(match, state.battingTeamId);

  return (
    <section>
      {/* innings header */}
      <div className="flex items-baseline justify-between border-b border-line px-4 py-2.5">
        <span className="text-body font-semibold text-fg">{battingTeam.name}</span>
        <span className="nums text-body font-semibold text-fg">
          {state.totalRuns}/{state.wickets}
          <span className="ml-1.5 text-caption font-normal text-fg-muted">({state.oversText})</span>
        </span>
      </div>

      {/* batting header */}
      <div className={`${BAT_COLS} px-4 py-1.5 text-[11px] text-fg-faint`}>
        <span>BATTING</span>
        <span className="text-right">R</span>
        <span className="text-right">B</span>
        <span className="text-right">4s</span>
        <span className="text-right">6s</span>
        <span className="text-right">SR</span>
      </div>

      <div className="divide-line border-t border-line">
        {state.battingOrder.map((id) => {
          const b = state.batters[id];
          const atCrease = id === state.strikerId || id === state.nonStrikerId;
          const sr = b.balls > 0 ? ((b.runs / b.balls) * 100).toFixed(0) : '–';
          const label = wicketLabel(state, match, id);
          return (
            <div key={id} className={`${BAT_COLS} px-4 py-2`}>
              <div className="min-w-0">
                <div className="truncate text-body text-fg">
                  {playerName(match, id)}
                  {id === state.strikerId && <span className="text-accent"> *</span>}
                  {atCrease && !b.out && <span className="ml-1 text-caption text-fg-faint">not out</span>}
                </div>
                {b.out && label && <div className="truncate text-caption text-fg-faint">{label}</div>}
              </div>
              <span className="nums text-right text-body font-semibold text-fg">{b.runs}</span>
              <span className="nums text-right text-caption text-fg-muted">{b.balls}</span>
              <span className="nums text-right text-caption text-fg-muted">{b.fours}</span>
              <span className="nums text-right text-caption text-fg-muted">{b.sixes}</span>
              <span className="nums text-right text-caption text-fg-muted">{sr}</span>
            </div>
          );
        })}
      </div>

      {/* extras + total */}
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-caption">
        <span className="text-fg-muted">
          Extras <span className="nums text-fg">{state.extras.total}</span>{' '}
          <span className="text-fg-faint">
            (wd {state.extras.wides}, nb {state.extras.noBalls}, b {state.extras.byes}, lb {state.extras.legByes})
          </span>
        </span>
      </div>

      {/* bowling header */}
      <div className={`${BOWL_COLS} border-t border-line px-4 py-1.5 text-[11px] text-fg-faint`}>
        <span>BOWLING</span>
        <span className="text-right">O</span>
        <span className="text-right">M</span>
        <span className="text-right">R</span>
        <span className="text-right">W</span>
        <span className="text-right">ECON</span>
      </div>

      <div className="divide-line border-t border-line">
        {Object.values(state.bowlers)
          .filter((b) => b.ballsBowled > 0)
          .map((b) => {
            const overs = b.ballsBowled / 6;
            const econ = overs > 0 ? (b.runsConceded / overs).toFixed(1) : '–';
            return (
              <div key={b.playerId} className={`${BOWL_COLS} px-4 py-2`}>
                <span className="truncate text-body text-fg">{playerName(match, b.playerId)}</span>
                <span className="nums text-right text-caption text-fg-muted">
                  {Math.floor(b.ballsBowled / 6)}.{b.ballsBowled % 6}
                </span>
                <span className="nums text-right text-caption text-fg-muted">{b.maidens}</span>
                <span className="nums text-right text-caption text-fg-muted">{b.runsConceded}</span>
                <span className="nums text-right text-body font-semibold text-fg">{b.wickets}</span>
                <span className="nums text-right text-caption text-fg-muted">{econ}</span>
              </div>
            );
          })}
      </div>
    </section>
  );
}
