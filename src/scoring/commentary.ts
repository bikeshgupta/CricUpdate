// ---------------------------------------------------------------------------
// Ball-by-ball commentary. Pure functions: turn a BallEvent (+ optional shot
// tag) into a Cricbuzz-style line, and build a feed for an innings.
// ---------------------------------------------------------------------------

import { isLegalDelivery } from './engine';
import type { BallEvent, Innings, Match, MatchSettings } from './types';
import { playerName } from './match';

export interface ShotType {
  id: string;
  label: string;
  /** Commentary phrase, e.g. "drives through the covers". */
  phrase: string;
}

export const SHOT_TYPES: ShotType[] = [
  { id: 'coverdrive', label: 'Cover drive', phrase: 'drives through the covers' },
  { id: 'straightdrive', label: 'Straight drive', phrase: 'drives down the ground' },
  { id: 'offdrive', label: 'Off drive', phrase: 'drives through the off side' },
  { id: 'ondrive', label: 'On drive', phrase: 'drives through mid-on' },
  { id: 'pull', label: 'Pull', phrase: 'pulls it away' },
  { id: 'hook', label: 'Hook', phrase: 'hooks it fine' },
  { id: 'cut', label: 'Cut', phrase: 'cuts it square' },
  { id: 'squarecut', label: 'Square cut', phrase: 'cuts it hard square' },
  { id: 'flick', label: 'Flick', phrase: 'flicks it off the pads' },
  { id: 'glance', label: 'Glance', phrase: 'glances it fine' },
  { id: 'sweep', label: 'Sweep', phrase: 'sweeps it away' },
  { id: 'loft', label: 'Lofted', phrase: 'lofts it over the infield' },
  { id: 'slog', label: 'Slog', phrase: 'slogs it across the line' },
  { id: 'edge', label: 'Edge', phrase: 'edges it' },
];

export function shotById(id?: string): ShotType | undefined {
  return id ? SHOT_TYPES.find((s) => s.id === id) : undefined;
}

/** Build the human commentary line for a single ball. */
export function commentaryFor(ball: BallEvent, match: Match): string {
  const striker = playerName(match, ball.striker);
  const bowler = playerName(match, ball.bowler);
  const shot = shotById(ball.shot);
  const head = `${bowler} to ${striker}, `;

  if (ball.isWicket) {
    const out = playerName(match, ball.dismissedPlayerId ?? ball.striker);
    if (ball.wicketType === 'retired') {
      return `${out} retires — can return later in the innings.`;
    }
    const how = dismissalText(ball, match);
    return `${head}OUT! ${out} ${how}`;
  }

  switch (ball.extra) {
    case 'wide':
      return `${head}WIDE${ball.extraRuns ? ` + ${ball.extraRuns} run${ball.extraRuns > 1 ? 's' : ''}` : ''}`;
    case 'noball':
      return `${head}NO BALL${ball.batterRuns ? `, ${striker} scores ${ball.batterRuns}` : ''}`;
    case 'bye':
      return `${head}${ball.extraRuns} bye${ball.extraRuns > 1 ? 's' : ''}`;
    case 'legbye':
      return `${head}${ball.extraRuns} leg bye${ball.extraRuns > 1 ? 's' : ''}`;
    default: {
      const r = ball.batterRuns;
      if (r === 0) return `${head}no run${shot ? `, ${shotVerb(striker, shot)}` : ''}`;
      if (r === 4) return `${head}FOUR! ${shot ? `${striker} ${shot.phrase}` : `${striker} finds the boundary`}`;
      if (r === 6) return `${head}SIX! ${shot ? `${striker} ${shot.phrase} — all the way!` : `${striker} goes big`}`;
      return `${head}${r} run${r > 1 ? 's' : ''}${shot ? `, ${shotVerb(striker, shot)}` : ''}`;
    }
  }
}

function shotVerb(striker: string, shot: ShotType): string {
  return `${striker} ${shot.phrase}`;
}

function dismissalText(ball: BallEvent, match: Match): string {
  const bowler = playerName(match, ball.bowler);
  const fielder = ball.fielderId ? playerName(match, ball.fielderId) : null;
  switch (ball.wicketType) {
    case 'bowled':
      return `bowled ${bowler}!`;
    case 'lbw':
      return `lbw b ${bowler}!`;
    case 'caught':
      return `caught${fielder ? ` by ${fielder}` : ''} b ${bowler}!`;
    case 'stumped':
      return `stumped${fielder ? ` by ${fielder}` : ''}!`;
    case 'runout':
      return `run out${fielder ? ` (${fielder})` : ''}!`;
    case 'hitwicket':
      return `hit wicket b ${bowler}!`;
    default:
      return 'out!';
  }
}

export interface CommentaryEntry {
  id: string;
  /** Over label like "2.3". */
  over: string;
  text: string;
  /** Highlight styling hint. */
  tone: 'four' | 'six' | 'wicket' | 'extra' | 'normal';
}

function toneFor(ball: BallEvent): CommentaryEntry['tone'] {
  if (ball.isWicket) return 'wicket';
  if (ball.extra === 'none' && ball.batterRuns === 6) return 'six';
  if (ball.extra === 'none' && ball.batterRuns === 4) return 'four';
  if (ball.extra !== 'none') return 'extra';
  return 'normal';
}

/** Newest-first commentary feed for an innings. */
export function commentaryFeed(
  innings: Innings,
  settings: MatchSettings,
  match: Match,
): CommentaryEntry[] {
  const entries: CommentaryEntry[] = [];
  let legal = 0;
  for (const ball of innings.balls) {
    const legalThis = isLegalDelivery(ball, settings);
    // label = over.ballWithinOver for the delivery just bowled
    const overNo = Math.floor(legal / 6);
    const within = (legal % 6) + 1;
    const label = legalThis ? `${overNo}.${within}` : `${overNo}.${within}`;
    entries.push({
      id: ball.id,
      over: label,
      text: commentaryFor(ball, match),
      tone: toneFor(ball),
    });
    if (legalThis) legal += 1;
  }
  return entries.reverse();
}
