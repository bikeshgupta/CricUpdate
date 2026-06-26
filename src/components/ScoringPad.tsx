import { useState } from 'react';
import { useMatch } from '../store/matchStore';
import { playerName, teamById } from '../scoring/match';
import { ballToken } from '../scoring/engine';
import { SHOT_TYPES } from '../scoring/commentary';
import type { InningsState, Match, WicketType } from '../scoring/types';
import { Button, Sheet } from './ui';
import PlayerPicker from './PlayerPicker';

const RUN_VALUES = [0, 1, 2, 3, 4, 6];

const WICKET_TYPES: { type: WicketType; label: string }[] = [
  { type: 'bowled', label: 'Bowled' },
  { type: 'caught', label: 'Caught' },
  { type: 'lbw', label: 'LBW' },
  { type: 'runout', label: 'Run out' },
  { type: 'stumped', label: 'Stumped' },
  { type: 'hitwicket', label: 'Hit wkt' },
];

type SheetId = 'wide' | 'noball' | 'bye' | 'legbye' | 'wicket' | 'edit';

const padBtn =
  'flex h-12 items-center justify-center rounded-lg border border-line-strong bg-surface text-body font-semibold text-fg transition duration-150 active:opacity-80';

function NumGrid({ values, onPick, cols = 'grid-cols-3' }: { values: number[]; onPick: (n: number) => void; cols?: string }) {
  return (
    <div className={`grid ${cols} gap-2`}>
      {values.map((n) => (
        <button key={n} onClick={() => onPick(n)} className={`${padBtn} text-lg`}>
          {n}
        </button>
      ))}
    </div>
  );
}

export default function ScoringPad({ match, state }: { match: Match; state: InningsState }) {
  const recordBall = useMatch((s) => s.recordBall);
  const editLastBall = useMatch((s) => s.editLastBall);
  const undoLastBall = useMatch((s) => s.undoLastBall);
  const active = useMatch((s) => s.activeInnings)();

  const [sheet, setSheet] = useState<SheetId | null>(null);
  const [shotForRuns, setShotForRuns] = useState<number | null>(null);
  const close = () => setSheet(null);

  const onRun = (n: number) => {
    if (n === 4 || n === 6) setShotForRuns(n);
    else recordBall({ batterRuns: n });
  };

  const strikerName = state.strikerId ? playerName(match, state.strikerId) : 'Batter';
  const bowlingTeam = teamById(match, state.bowlingTeamId);
  const lastBall = active?.innings.balls.at(-1);

  return (
    <div className="space-y-2 px-4 pb-6 pt-3">
      {/* runs */}
      <div className="grid grid-cols-6 gap-2">
        {RUN_VALUES.map((n) => (
          <button key={n} onClick={() => onRun(n)} className={`${padBtn} text-lg ${n === 4 || n === 6 ? '!text-accent' : ''}`}>
            {n}
          </button>
        ))}
      </div>

      {/* extras */}
      <div className="grid grid-cols-4 gap-2">
        {(['wide', 'noball', 'bye', 'legbye'] as const).map((e) => (
          <button key={e} onClick={() => setSheet(e)} className={`${padBtn} text-body font-medium text-fg-muted`}>
            {{ wide: 'Wd', noball: 'Nb', bye: 'Bye', legbye: 'Lb' }[e]}
          </button>
        ))}
      </div>

      {/* wicket */}
      <Button variant="danger" block onClick={() => setSheet('wicket')}>
        Wicket
      </Button>

      {/* undo / edit */}
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={undoLastBall}>
          Undo
        </Button>
        <Button variant="secondary" onClick={() => setSheet('edit')}>
          Edit last
        </Button>
      </div>

      {/* ---- sheets ---- */}
      <Sheet open={shotForRuns !== null} onClose={() => setShotForRuns(null)} title={`${strikerName} — ${shotForRuns === 6 ? 'six' : 'four'}: where did it go?`}>
        <div className="grid grid-cols-3 gap-2">
          {SHOT_TYPES.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                recordBall({ batterRuns: shotForRuns!, shot: s.id });
                setShotForRuns(null);
              }}
              className="rounded-lg border border-line-strong bg-surface px-2 py-2.5 text-body text-fg transition duration-150 active:opacity-80"
            >
              {s.label}
            </button>
          ))}
        </div>
        <Button
          variant="ghost"
          block
          className="mt-2"
          onClick={() => {
            recordBall({ batterRuns: shotForRuns! });
            setShotForRuns(null);
          }}
        >
          Skip — just {shotForRuns}
        </Button>
      </Sheet>

      <Sheet open={sheet === 'wide'} onClose={close} title="Wide">
        <p className="mb-3 text-caption text-fg-muted">Runs run while the ball is wide</p>
        <NumGrid values={[0, 1, 2, 3, 4]} cols="grid-cols-5" onPick={(n) => { recordBall({ extra: 'wide', extraRuns: n }); close(); }} />
      </Sheet>

      <Sheet open={sheet === 'noball'} onClose={close} title="No ball">
        <p className="mb-3 text-caption text-fg-muted">Runs off the bat</p>
        <NumGrid values={[0, 1, 2, 3, 4, 6]} onPick={(n) => { recordBall({ extra: 'noball', batterRuns: n }); close(); }} />
      </Sheet>

      <Sheet open={sheet === 'bye'} onClose={close} title="Byes">
        <NumGrid values={[1, 2, 3, 4]} cols="grid-cols-4" onPick={(n) => { recordBall({ extra: 'bye', extraRuns: n }); close(); }} />
      </Sheet>

      <Sheet open={sheet === 'legbye'} onClose={close} title="Leg byes">
        <NumGrid values={[1, 2, 3, 4]} cols="grid-cols-4" onPick={(n) => { recordBall({ extra: 'legbye', extraRuns: n }); close(); }} />
      </Sheet>

      <WicketSheet
        open={sheet === 'wicket'}
        onClose={close}
        match={match}
        state={state}
        bowlingPlayers={bowlingTeam.players}
        onConfirm={(payload) => { recordBall({ isWicket: true, ...payload }); close(); }}
      />

      <Sheet open={sheet === 'edit'} onClose={close} title="Edit last ball">
        {lastBall ? (
          <div className="space-y-4">
            <div className="text-caption text-fg-muted">
              Last ball: <span className="nums font-semibold text-fg">{ballToken(lastBall, match.settings)}</span>
            </div>
            <div>
              <p className="mb-2 text-caption text-fg-faint">Change to runs</p>
              <NumGrid values={[0, 1, 2, 3, 4, 6]} onPick={(n) => { editLastBall({ batterRuns: n, extra: 'none', extraRuns: 0, isWicket: false }); close(); }} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button variant="secondary" size="sm" onClick={() => { editLastBall({ extra: 'wide', batterRuns: 0, extraRuns: 0, isWicket: false }); close(); }}>
                Make wide
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { editLastBall({ extra: 'noball', batterRuns: 0, extraRuns: 0, isWicket: false }); close(); }}>
                Make no-ball
              </Button>
              <Button variant="secondary" size="sm" onClick={() => { editLastBall({ isWicket: false }); close(); }}>
                Remove wkt
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-caption text-fg-faint">No ball to edit yet.</p>
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
  bowlingPlayers: Match['teamA']['players'];
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
              className={`rounded-lg border px-2 py-2.5 text-body transition duration-150 ${
                type === w.type ? 'border-error/50 bg-error/10 text-error' : 'border-line-strong text-fg'
              }`}
            >
              {w.label}
            </button>
          ))}
        </div>

        {isRunout && (
          <div>
            <p className="mb-2 text-caption text-fg-faint">Who is out?</p>
            <div className="grid grid-cols-2 gap-2">
              {[state.strikerId, state.nonStrikerId].filter(Boolean).map((id) => (
                <button
                  key={id}
                  onClick={() => setDismissed(id!)}
                  className={`rounded-lg border px-3 py-2.5 text-body ${dismissedId === id ? 'border-accent bg-accent/10 text-fg' : 'border-line-strong text-fg'}`}
                >
                  {playerName(match, id)}
                </button>
              ))}
            </div>
          </div>
        )}

        {needsFielder && (
          <div>
            <p className="mb-2 text-caption text-fg-faint">Fielder (optional)</p>
            <PlayerPicker players={bowlingPlayers} selectedId={fielder} onSelect={setFielder} />
          </div>
        )}

        <Button
          variant="primary"
          block
          onClick={() => onConfirm({ wicketType: type, dismissedPlayerId: dismissedId ?? undefined, fielderId: fielder ?? undefined })}
        >
          Confirm wicket
        </Button>
      </div>
    </Sheet>
  );
}
