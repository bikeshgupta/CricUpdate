import { computeAwards, type AwardWinner } from '../scoring/match';
import type { Match } from '../scoring/types';
import { SectionHeader } from './ui';
import { Trophy, type TrophyVariant } from './Trophy';

function AwardCard({ variant, label, winner, large }: { variant: TrophyVariant; label: string; winner: AwardWinner; large?: boolean }) {
  return (
    <div className={`flex flex-col items-center gap-1.5 rounded-[10px] border border-line-strong bg-surface px-3 py-4 text-center ${large ? 'col-span-2' : ''}`}>
      <Trophy variant={variant} size={large ? 68 : 48} />
      <div className="text-caption font-medium uppercase tracking-wide text-fg-faint">{label}</div>
      <div className="text-body font-semibold text-fg">{winner.name}</div>
      <div className="text-caption text-fg-muted">{winner.teamName}</div>
      <div className="nums text-caption font-medium text-accent">{winner.statLine}</div>
    </div>
  );
}

export default function MatchSummary({ match }: { match: Match }) {
  const awards = computeAwards(match);
  if (!awards) return null;

  return (
    <div className="border-b border-line pb-4">
      <SectionHeader>Match awards</SectionHeader>
      <div className="grid grid-cols-2 gap-3 px-4 pt-1">
        <AwardCard variant="mvp" label="Player of the Match" winner={awards.playerOfMatch} large />
        <AwardCard variant="batter" label="Best Batter" winner={awards.bestBatter} />
        <AwardCard variant="bowler" label="Best Bowler" winner={awards.bestBowler} />
        {awards.bestFielder && <AwardCard variant="fielder" label="Best Fielder" winner={awards.bestFielder} />}
      </div>
    </div>
  );
}
