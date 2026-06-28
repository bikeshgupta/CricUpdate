import { useState } from 'react';
import type { ReactNode } from 'react';
import type { Player } from '../scoring/types';
import { Sheet } from './ui';
import PlayerPicker from './PlayerPicker';
import { ChevronRightIcon, PlusIcon } from './icons';

/**
 * A single "who's batting/bowling" slot. Shows the current pick (or a
 * placeholder) and opens a picker sheet on tap — used in place of stacking
 * several always-visible player lists on the opener / innings-break screens.
 */
export default function PlayerSlot({
  label,
  icon,
  players,
  selectedId,
  onSelect,
  excludeIds = [],
  outIds = [],
  emptyHint,
  disabled,
}: {
  label: ReactNode;
  icon: ReactNode;
  players: Player[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  excludeIds?: string[];
  outIds?: string[];
  emptyHint?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = players.find((p) => p.id === selectedId) ?? null;

  return (
    <>
      <button
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
        className="row w-full justify-between text-left transition duration-150 hover:bg-surface disabled:opacity-40"
      >
        <span className="flex min-w-0 items-center gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${selected ? 'border-accent/40 bg-accent/10 text-accent' : 'border-line-strong bg-surface2 text-fg-muted'}`}>
            {icon}
          </span>
          <span className="min-w-0">
            <span className="block text-caption text-fg-faint">{label}</span>
            <span className={`block truncate text-body ${selected ? 'font-medium text-fg' : 'text-fg-faint'}`}>
              {selected ? selected.name : 'Select player'}
            </span>
          </span>
        </span>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            selected ? 'text-fg-faint' : 'border border-dashed border-accent/60 text-accent'
          }`}
        >
          {selected ? <ChevronRightIcon size={16} /> : <PlusIcon size={16} />}
        </span>
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={label}>
        <PlayerPicker
          players={players}
          selectedId={selectedId}
          excludeIds={excludeIds}
          outIds={outIds}
          emptyHint={emptyHint}
          onSelect={(id) => {
            onSelect(id);
            setOpen(false);
          }}
        />
      </Sheet>
    </>
  );
}
