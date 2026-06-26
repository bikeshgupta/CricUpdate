import { commentaryFeed, type CommentaryEntry } from '../scoring/commentary';
import { teamById } from '../scoring/match';
import type { Innings, Match } from '../scoring/types';
import { SectionHeader } from './ui';

function Badge({ entry }: { entry: CommentaryEntry }) {
  if (entry.tone === 'wicket') {
    return <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-error text-[11px] font-bold text-white">W</span>;
  }
  if (entry.tone === 'four' || entry.tone === 'six') {
    return (
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-boundary text-[11px] font-bold text-boundary">
        {entry.tone === 'four' ? '4' : '6'}
      </span>
    );
  }
  return <span className="w-6 shrink-0" />;
}

function Feed({ match, innings, title }: { match: Match; innings: Innings; title: string }) {
  const feed = commentaryFeed(innings, match.settings, match);
  return (
    <section>
      <SectionHeader>{title}</SectionHeader>
      {feed.length === 0 ? (
        <div className="px-4 py-3 text-caption text-fg-faint">No balls bowled yet.</div>
      ) : (
        <div className="divide-line border-y border-line">
          {feed.map((e) => (
            <div key={e.id} className="flex items-start gap-3 px-4 py-2.5">
              <span className="nums w-7 shrink-0 pt-px text-caption text-fg-faint">{e.over}</span>
              <Badge entry={e} />
              <span
                className={`text-body ${
                  e.tone === 'wicket' ? 'text-error' : e.tone === 'four' || e.tone === 'six' ? 'text-fg' : 'text-fg-muted'
                }`}
              >
                {e.text}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Commentary({ match }: { match: Match }) {
  const sections: { innings: Innings; title: string }[] = [];
  if (match.innings2) sections.push({ innings: match.innings2, title: `${teamById(match, match.innings2.battingTeamId).name} innings` });
  if (match.innings1) sections.push({ innings: match.innings1, title: `${teamById(match, match.innings1.battingTeamId).name} innings` });
  if (sections.length === 0) return null;

  return (
    <div className="divide-line">
      {sections.map((s, i) => (
        <Feed key={i} match={match} innings={s.innings} title={s.title} />
      ))}
    </div>
  );
}
