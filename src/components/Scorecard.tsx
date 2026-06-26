import { AnimatePresence, motion } from 'framer-motion';
import { playerName, teamById } from '../scoring/match';
import type { InningsState, Match } from '../scoring/types';
import { GlassCard, MicroLabel } from './ui';

function tokenClass(t: string): string {
  if (t.includes('W')) return 'bg-wicket/20 text-wicket border-wicket/40';
  if (t === '4' || t === '6') return 'bg-accent/20 text-accent border-accent/40';
  if (t === '•') return 'text-ink-faint border-glass-border';
  return 'text-ink border-glass-border';
}

export default function Scorecard({ match, state }: { match: Match; state: InningsState }) {
  const battingTeam = teamById(match, state.battingTeamId);

  const striker = state.strikerId ? state.batters[state.strikerId] : null;
  const nonStriker = state.nonStrikerId ? state.batters[state.nonStrikerId] : null;
  const bowler = state.currentBowlerId ? state.bowlers[state.currentBowlerId] : null;

  return (
    <div className="space-y-3">
      <div className="text-center">
        <MicroLabel className="mb-1">{battingTeam.name}</MicroLabel>
        <div className="flex items-end justify-center gap-2">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={state.totalRuns}
              initial={{ y: -14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 14, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="nums text-5xl font-extrabold leading-none text-accent"
            >
              {state.totalRuns}
            </motion.span>
          </AnimatePresence>
          <span className="nums pb-1 text-2xl font-bold text-ink-muted">-{state.wickets}</span>
        </div>
        <div className="nums mt-1.5 text-sm text-ink-muted">
          {state.oversText} ov · RR {state.runRate.toFixed(2)}
          {state.freeHit && <span className="ml-2 font-semibold text-accent">FREE HIT</span>}
        </div>
        {state.target != null && state.runsRequired != null && !state.isComplete && (
          <div className="nums mt-1 text-sm text-ink">
            Need <span className="font-bold text-accent">{state.runsRequired}</span> in{' '}
            {state.ballsRemaining} balls
            {state.requiredRunRate != null && (
              <span className="text-ink-muted"> · RRR {state.requiredRunRate.toFixed(2)}</span>
            )}
          </div>
        )}
      </div>

      <GlassCard className="space-y-2.5 py-3.5">
        {[striker, nonStriker].map((b, i) => {
          const onStrike = i === 0;
          const id = onStrike ? state.strikerId : state.nonStrikerId;
          return (
            <div key={i} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                {onStrike && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                <span className={onStrike ? 'font-semibold text-ink' : 'text-ink-muted'}>
                  {id ? playerName(match, id) : 'Select batter'}
                </span>
              </span>
              <span className="nums text-ink-muted">
                {b ? (
                  <>
                    <span className="font-semibold text-ink">{b.runs}</span> ({b.balls})
                  </>
                ) : (
                  '—'
                )}
              </span>
            </div>
          );
        })}
        <div className="h-px bg-glass-border" />
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-muted">
            {state.currentBowlerId ? playerName(match, state.currentBowlerId) : 'Select bowler'}
          </span>
          <span className="nums text-ink-muted">
            {bowler ? (
              <>
                {Math.floor(bowler.ballsBowled / 6)}.{bowler.ballsBowled % 6}–{bowler.runsConceded}–
                {bowler.wickets}
              </>
            ) : (
              '—'
            )}
          </span>
        </div>
      </GlassCard>

      <div className="flex items-center gap-2 px-1">
        <span className="micro-label shrink-0">This over</span>
        <div className="flex flex-1 flex-wrap gap-1.5">
          {state.thisOver.length === 0 ? (
            <span className="text-sm text-ink-faint">—</span>
          ) : (
            state.thisOver.map((t, i) => (
              <span
                key={i}
                className={`nums flex h-7 min-w-7 items-center justify-center rounded-md border px-1.5 text-xs font-semibold ${tokenClass(t)}`}
              >
                {t}
              </span>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
