import type { Match, Player } from '../scoring/types';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface2 text-[11px] font-semibold text-fg-muted">
      {initials(name)}
    </span>
  );
}

function PlayerCell({ player, align }: { player?: Player; align: 'left' | 'right' }) {
  if (!player) return <div className="px-4 py-2.5" />;
  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 ${align === 'right' ? 'flex-row-reverse text-right' : ''}`}>
      <Avatar name={player.name} />
      <span className="min-w-0 truncate text-body text-fg">{player.name}</span>
    </div>
  );
}

export default function Squads({ match }: { match: Match }) {
  const a = match.teamA.players;
  const b = match.teamB.players;
  const rows = Math.max(a.length, b.length);

  return (
    <section>
      <div className="grid grid-cols-2 bg-surface">
        <div className="border-r border-line px-4 py-2.5 text-body font-semibold text-fg">{match.teamA.name}</div>
        <div className="px-4 py-2.5 text-right text-body font-semibold text-fg">{match.teamB.name}</div>
      </div>
      <div className="py-2 text-center text-caption text-fg-muted">Playing XI</div>
      <div className="divide-line border-t border-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="grid grid-cols-2">
            <div className="border-r border-line">
              <PlayerCell player={a[i]} align="left" />
            </div>
            <PlayerCell player={b[i]} align="right" />
          </div>
        ))}
      </div>
    </section>
  );
}
