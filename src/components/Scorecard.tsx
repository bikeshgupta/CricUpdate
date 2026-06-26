import { playerName, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';

/** Compact scoreboard for the sticky match header. */
export default function Scoreboard({ match, state }: { match: Match; state: InningsState }) {
  const battingTeam = teamById(match, state.battingTeamId);
  const striker = state.strikerId ? state.batters[state.strikerId] : null;
  const nonStriker = state.nonStrikerId ? state.batters[state.nonStrikerId] : null;
  const bowler = state.currentBowlerId ? state.bowlers[state.currentBowlerId] : null;

  return (
    <div className="px-4 pb-3 pt-0.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="truncate text-team text-fg">{battingTeam.name}</span>
        <span className="nums shrink-0 text-fg">
          <span className="text-[26px] font-bold leading-none">{state.totalRuns}</span>
          <span className="text-body text-fg-muted">/{state.wickets}</span>
        </span>
      </div>

      <div className="mt-1 flex items-center justify-between text-caption text-fg-muted">
        <span className="nums">
          {state.oversText} ov · RR {state.runRate.toFixed(2)}
          {state.freeHit && <span className="ml-2 font-semibold text-accent">FREE HIT</span>}
        </span>
        {state.target != null && state.runsRequired != null && !state.isComplete && (
          <span className="nums text-fg">
            Need {state.runsRequired} off {state.ballsRemaining}
          </span>
        )}
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
