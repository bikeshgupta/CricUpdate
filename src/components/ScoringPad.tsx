import { useState } from 'react';
import { useMatch } from '../store/matchStore';
import { playerById, teamById } from '../scoring/match';
import { ballToken } from '../scoring/engine';
import type { InningsState, Match, WicketType } from '../scoring/types';
import { AccentButton, GhostButton, Sheet } from './ui';
import PlayerPicker from './PlayerPicker';

const RUN_VALUES = [0, 1, 2, 3, 4, 6];

const WICKET_TYPES: { type: WicketType; label: string }[] = [
  { type: 'bowled', label: 'Bowled' },
  { type: 'caught', label: 'Caught' },
  { type: 'lbw', label: 'LBW' },
  { type: 'runout', label: 'Run out' },
  { type: 'stumped', label: 'Stumped' },
  { type: 'hitwicket', label: 'Hit wicket' },
];

export default function ScoringPad({ match, state }: { match: Match; state: InningsState }) {
  const recordBall = useMatch((s) => s.recordBall);
  const editLastBall = useMatch((s) => s.editLastBall);
  const undoLastBall = useMatch((s) => s.undoLastBall);
  const active = useMatch((s) => s.activeInnings)();

  const [sheet, setSheet] = useState<null | 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket' | 'edit'>(
    null,
  );
  const close = () => setSheet(null);

  const strikerIsLady =
    !!state.strikerId && playerById(match, state.strikerId)?.category === 'ladies';
  const ladyNoRun = strikerIsLady && match.settings.noRunsOnWideForLadies;

  const bowlingTeam = teamById(match, state.bowlingTeamId);
  const lastBall = active?.innings.balls.at(-1);

  const RunGrid = ({ onPick, values }: { onPick: (n: number) => void; values: number[] }) => (
    <div className="grid grid-cols-3 gap-2">
      {values.map((n) => (
        <button
          key={n}
          onClick={() => onPick(n)}
          className="pad-btn aspect-square text-xl"
        >
          {n}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-2.5">
      {/* runs off the bat */}
      <div className="grid grid-cols-3 gap-2">
        {RUN_VALUES.map((n) => (
          <button
            key={n}
            onClick={() => recordBall({ batterRuns: n })}
            className={`pad-btn h-14 text-2xl ${n === 4 || n === 6 ? 'text-accent' : ''}`}
          >
            {n}
          </button>
        ))}
      </div>

      {/* extras */}
      <div className="grid grid-cols-4 gap-2">
        <GhostButton onClick={() => setSheet('wide')} className="px-0 py-3 text-sm">
          Wd
        </GhostButton>
        <GhostButton onClick={() => setSheet('noball')} className="px-0 py-3 text-sm">
          Nb
        </GhostButton>
        <GhostButton onClick={() => setSheet('bye')} className="px-0 py-3 text-sm">
          Bye
        </GhostButton>
        <GhostButton onClick={() => setSheet('legbye')} className="px-0 py-3 text-sm">
          Lb
        </GhostButton>
      </div>

      {/* wicket */}
      <button
        onClick={() => setSheet('wicket')}
        className="w-full rounded-2xl border border-wicket/40 bg-wicket/15 py-3.5 text-center font-semibold text-wicket transition active:scale-[0.99]"
      >
        OUT
      </button>

      {/* undo / edit */}
      <div className="grid grid-cols-2 gap-2">
        <GhostButton onClick={undoLastBall} className="py-3 text-sm">
          ⟲ Undo
        </GhostButton>
        <GhostButton
          onClick={() => setSheet('edit')}
          className="py-3 text-sm"
        >
          ✎ Edit last
        </GhostButton>
      </div>

      {/* ---- sheets ---- */}
      <Sheet open={sheet === 'wide'} onClose={close} title="Wide">
        {ladyNoRun ? (
          <div className="space-y-3 text-center">
            <p className="text-sm text-ink-muted">
              Striker is a lady — no runs allowed on a wide. Only the {match.settings.wideRuns}-run
              penalty is added.
            </p>
            <AccentButton
              onClick={() => {
                recordBall({ extra: 'wide', extraRuns: 0 });
                close();
              }}
              className="w-full"
            >
              Add wide
            </AccentButton>
          </div>
        ) : (
          <>
            <p className="mb-3 text-center text-sm text-ink-muted">Runs run while the ball is wide</p>
            <RunGrid
              values={[0, 1, 2, 3, 4]}
              onPick={(n) => {
                recordBall({ extra: 'wide', extraRuns: n });
                close();
              }}
            />
          </>
        )}
      </Sheet>

      <Sheet open={sheet === 'noball'} onClose={close} title="No-ball">
        <p className="mb-3 text-center text-sm text-ink-muted">Runs scored off the bat</p>
        <RunGrid
          values={[0, 1, 2, 3, 4, 6]}
          onPick={(n) => {
            recordBall({ extra: 'noball', batterRuns: n });
            close();
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'bye'} onClose={close} title="Byes">
        <RunGrid
          values={[1, 2, 3, 4]}
          onPick={(n) => {
            recordBall({ extra: 'bye', extraRuns: n });
            close();
          }}
        />
      </Sheet>

      <Sheet open={sheet === 'legbye'} onClose={close} title="Leg byes">
        <RunGrid
          values={[1, 2, 3, 4]}
          onPick={(n) => {
            recordBall({ extra: 'legbye', extraRuns: n });
            close();
          }}
        />
      </Sheet>

      <WicketSheet
        open={sheet === 'wicket'}
        onClose={close}
        match={match}
        state={state}
        bowlingPlayers={bowlingTeam.players}
        onConfirm={(payload) => {
          recordBall({ isWicket: true, ...payload });
          close();
        }}
      />

      <Sheet open={sheet === 'edit'} onClose={close} title="Edit last ball">
        {lastBall ? (
          <div className="space-y-4">
            <div className="text-center text-sm text-ink-muted">
              Last ball:{' '}
              <span className="nums font-semibold text-ink">{ballToken(lastBall, match.settings)}</span>
            </div>
            <div>
              <p className="mb-2 text-center text-xs text-ink-faint">Change to runs</p>
              <RunGrid
                values={[0, 1, 2, 3, 4, 6]}
                onPick={(n) => {
                  editLastBall({ batterRuns: n, extra: 'none', extraRuns: 0, isWicket: false });
                  close();
                }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <GhostButton
                onClick={() => {
                  editLastBall({ extra: 'wide', batterRuns: 0, extraRuns: 0, isWicket: false });
                  close();
                }}
                className="py-2.5 text-sm"
              >
                Make wide
              </GhostButton>
              <GhostButton
                onClick={() => {
                  editLastBall({ extra: 'noball', batterRuns: 0, extraRuns: 0, isWicket: false });
                  close();
                }}
                className="py-2.5 text-sm"
              >
                Make no-ball
              </GhostButton>
              <GhostButton
                onClick={() => {
                  editLastBall({ isWicket: false });
                  close();
                }}
                className="py-2.5 text-sm"
              >
                Remove wicket
              </GhostButton>
            </div>
          </div>
        ) : (
          <p className="text-center text-sm text-ink-faint">No ball to edit yet.</p>
        )}
      </Sheet>
    </div>
  );
}

function WicketSheet({
  open,
  onClose,
  match,
  state,
  bowlingPlayers,
  onConfirm,
}: {
  open: boolean;
  onClose: () => void;
  match: Match;
  state: InningsState;
  bowlingPlayers: { id: string; name: string; category: 'gents' | 'ladies' }[];
  onConfirm: (payload: { wicketType: WicketType; dismissedPlayerId?: string; fielderId?: string }) => void;
}) {
  const [type, setType] = useState<WicketType>('bowled');
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [fielder, setFielder] = useState<string | null>(null);

  const needsFielder = type === 'caught' || type === 'runout' || type === 'stumped';
  const isRunout = type === 'runout';

  const dismissedId = isRunout ? dismissed ?? state.strikerId : state.strikerId;

  return (
    <Sheet open={open} onClose={onClose} title="Wicket">
      <div className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {WICKET_TYPES.map((w) => (
            <button
              key={w.type}
              onClick={() => setType(w.type)}
              className={`rounded-xl border px-2 py-2.5 text-sm transition active:scale-95 ${
                type === w.type
                  ? 'border-wicket bg-wicket/15 text-wicket'
                  : 'border-glass-border text-ink'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {isRunout && (
          <div>
            <p className="mb-2 text-xs text-ink-faint">Who is out?</p>
            <div className="grid grid-cols-2 gap-2">
              {[state.strikerId, state.nonStrikerId].filter(Boolean).map((id) => {
                const p = match.teamA.players.concat(match.teamB.players).find((x) => x.id === id)!;
                return (
                  <button
                    key={id}
                    onClick={() => setDismissed(id!)}
                    className={`rounded-xl border px-3 py-2.5 text-sm ${
                      dismissedId === id ? 'border-accent bg-accent/15 text-accent' : 'border-glass-border text-ink'
                    }`}
                  >
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {needsFielder && (
          <div>
            <p className="mb-2 text-xs text-ink-faint">Fielder (optional)</p>
            <PlayerPicker players={bowlingPlayers} selectedId={fielder} onSelect={setFielder} />
          </div>
        )}

        <AccentButton
          onClick={() =>
            onConfirm({
              wicketType: type,
              dismissedPlayerId: dismissedId ?? undefined,
              fielderId: fielder ?? undefined,
            })
          }
          className="w-full"
        >
          Confirm wicket
        </AccentButton>
      </div>
    </Sheet>
  );
}
