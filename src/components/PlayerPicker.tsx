import type { Player } from '../scoring/types';
import { Tag } from './ui';

function Check() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-accent">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

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
    return <div className="px-4 py-3 text-caption text-fg-faint">{emptyHint ?? 'No players available'}</div>;
  }
  return (
    <div className="divide-line overflow-hidden rounded-lg border border-line-strong">
      {available.map((p) => {
        const isOut = outIds.includes(p.id);
        const selected = selectedId === p.id;
        return (
          <button
            key={p.id}
            disabled={isOut}
            onClick={() => onSelect(p.id)}
            className={`row w-full justify-between transition duration-150 ${
              selected ? 'bg-accent/10' : 'bg-surface hover:bg-surface2'
            } ${isOut ? 'opacity-40' : ''}`}
          >
            <span className="flex items-center gap-2 text-body text-fg">
              {p.name}
              {p.category === 'ladies' && <Tag>L</Tag>}
              {isOut && <span className="text-caption text-fg-faint">out</span>}
            </span>
            {selected && <Check />}
          </button>
        );
      })}
    </div>
  );
}
