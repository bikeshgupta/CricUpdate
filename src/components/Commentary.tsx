import { commentaryFeed, type CommentaryEntry } from '../scoring/commentary';
import { teamById } from '../scoring/match';
import type { Innings, Match } from '../scoring/types';
import { SectionHeader } from './ui';

function Badge({ entry }: { entry: CommentaryEntry }) {
  const map = {
    four: { text: '4', cls: 'text-accent' },
    six: { text: '6', cls: 'text-accent' },
    wicket: { text: 'W', cls: 'text-error' },
    extra: { text: '+', cls: 'text-fg-faint' },
    normal: { text: '', cls: 'text-fg-faint' },
  } as const;
  const { text, cls } = map[entry.tone];
  if (!text) return <span className="w-4 shrink-0" />;
  return <span className={`nums w-4 shrink-0 text-center text-caption font-bold ${cls}`}>{text}</span>;
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
