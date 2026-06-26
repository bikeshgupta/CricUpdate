import type { Player } from '../scoring/types';

export default function PlayerPicker({
  players,
  selectedId,
  onSelect,
  excludeIds = [],
  outIds = [],
  emptyHint,
}: {
  players: Player[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  excludeIds?: string[];
  outIds?: string[];
  emptyHint?: string;
}) {
  const available = players.filter((p) => !excludeIds.includes(p.id));
  if (available.length === 0) {
    return <div className="text-center text-sm text-ink-faint">{emptyHint ?? 'No players available'}</div>;
  }
  return (
    <div className="grid grid-cols-2 gap-2">
      {available.map((p) => {
        const isOut = outIds.includes(p.id);
        const selected = selectedId === p.id;
        return (
          <button
            key={p.id}
            disabled={isOut}
            onClick={() => onSelect(p.id)}
            className={`flex items-center justify-between rounded-xl border px-3.5 py-3 text-left text-sm transition active:scale-[0.98] ${
              selected
                ? 'border-accent bg-accent/15 text-accent'
                : isOut
                  ? 'border-glass-border bg-glass-fill text-ink-faint line-through'
                  : 'border-glass-border bg-glass-fill text-ink'
            }`}
          >
            <span className="truncate">{p.name}</span>
            {p.category === 'ladies' && <span className="ml-1 text-[10px] text-accent">L</span>}
          </button>
        );
      })}
    </div>
  );
}
