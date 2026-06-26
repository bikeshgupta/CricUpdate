import { commentaryFeed, type CommentaryEntry } from '../scoring/commentary';
import { teamById } from '../scoring/match';
import type { Innings, Match } from '../scoring/types';
import { GlassCard, MicroLabel } from './ui';

function toneBadge(tone: CommentaryEntry['tone']): string {
  switch (tone) {
    case 'four':
      return 'bg-accent/20 text-accent border-accent/40';
    case 'six':
      return 'bg-accent text-base border-accent';
    case 'wicket':
      return 'bg-wicket/20 text-wicket border-wicket/40';
    case 'extra':
      return 'bg-surface-raised text-ink-muted border-glass-border';
    default:
      return 'bg-surface-raised text-ink-muted border-glass-border';
  }
}

function badgeText(entry: CommentaryEntry): string {
  if (entry.tone === 'four') return '4';
  if (entry.tone === 'six') return '6';
  if (entry.tone === 'wicket') return 'W';
  return entry.over.split('.')[1] ?? '•';
}

function Feed({ match, innings, title }: { match: Match; innings: Innings; title: string }) {
  const feed = commentaryFeed(innings, match.settings, match);
  if (feed.length === 0) {
    return (
      <GlassCard className="text-center text-sm text-ink-faint">
        No balls bowled yet — commentary will appear here ball by ball.
      </GlassCard>
    );
  }
  return (
    <div className="space-y-2">
      <MicroLabel>{title}</MicroLabel>
      {feed.map((e) => (
        <div key={e.id} className="flex items-start gap-3 rounded-xl border border-glass-border bg-surface px-3 py-2.5">
          <span
            className={`nums mt-0.5 flex h-7 min-w-9 shrink-0 items-center justify-center rounded-md border px-1 text-xs font-bold ${toneBadge(e.tone)}`}
          >
            {badgeText(e)}
          </span>
          <div className="min-w-0">
            <span className="nums mr-2 text-xs text-ink-faint">{e.over}</span>
            <span
              className={`text-sm ${
                e.tone === 'four' || e.tone === 'six'
                  ? 'font-semibold text-ink'
                  : e.tone === 'wicket'
                    ? 'font-semibold text-wicket'
                    : 'text-ink'
              }`}
            >
              {e.text}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Commentary({ match }: { match: Match }) {
  // Most recent innings first.
  const sections: { innings: Innings; title: string }[] = [];
  if (match.innings2) {
    sections.push({ innings: match.innings2, title: `${teamById(match, match.innings2.battingTeamId).name} innings` });
  }
  if (match.innings1) {
    sections.push({ innings: match.innings1, title: `${teamById(match, match.innings1.battingTeamId).name} innings` });
  }

  if (sections.length === 0) return null;

  return (
    <div className="space-y-5">
      {sections.map((s, i) => (
        <Feed key={i} match={match} innings={s.innings} title={s.title} />
      ))}
    </div>
  );
}
