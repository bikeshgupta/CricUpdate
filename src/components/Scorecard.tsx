import { playerName, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';

/** Compact scoreboard for the sticky match header. */
export default function Scoreboard({ match, state }: { match: Match; state: InningsState }) {
  const battingTeam = teamById(match, state.battingTeamId);
  const striker = state.strikerId ? state.batters[state.strikerId] : null;
  const nonStriker = state.nonStrikerId ? state.batters[state.nonStrikerId] : null;
  const bowler = state.currentBowlerId ? state.bowlers[state.currentBowlerId] : null;

  return (
    <div className="px-4 pb-3 pt-1">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-caption font-medium uppercase tracking-wide text-fg-muted">{battingTeam.name}</div>
          <div className="nums mt-0.5 leading-none text-fg">
            <span className="text-score">{state.totalRuns}</span>
            <span className="text-[18px] font-semibold text-fg-muted">/{state.wickets}</span>
          </div>
        </div>
        <div className="shrink-0 text-right text-caption text-fg-muted">
          <div className="nums">{state.oversText} ov · RR {state.runRate.toFixed(2)}</div>
          {state.freeHit && <div className="font-semibold text-accent">FREE HIT</div>}
          {state.target != null && state.runsRequired != null && !state.isComplete && (
            <div className="nums text-fg">Need {state.runsRequired} off {state.ballsRemaining}</div>
          )}
        </div>
      </div>

      {!state.isComplete && (
      <div className="mt-2 flex items-center justify-between gap-3 text-caption">
        <div className="flex min-w-0 items-center gap-3">
          <BatterChip name={striker ? playerName(match, state.strikerId) : 'Batter'} stat={striker ? `${striker.runs}(${striker.balls})` : '—'} onStrike />
          <BatterChip name={nonStriker ? playerName(match, state.nonStrikerId) : 'Batter'} stat={nonStriker ? `${nonStriker.runs}(${nonStriker.balls})` : '—'} />
        </div>
        <div className="shrink-0 truncate text-fg-muted">
          {state.currentBowlerId ? playerName(match, state.currentBowlerId) : 'Bowler'}{' '}
          {bowler && (
            <span className="nums text-fg">
              {Math.floor(bowler.ballsBowled / 6)}.{bowler.ballsBowled % 6}–{bowler.runsConceded}
            </span>
          )}
        </div>
      </div>
      )}
    </div>
  );
}

function BatterChip({ name, stat, onStrike }: { name: string; stat: string; onStrike?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      {onStrike && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
      <span className={`truncate ${onStrike ? 'text-fg' : 'text-fg-muted'}`}>{name}</span>
      <span className="nums shrink-0 text-fg">{stat}</span>
    </span>
  );
}
