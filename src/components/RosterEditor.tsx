import { useState } from 'react';
import type { Player, Team } from '../scoring/types';
import { AutocompleteInput, Button, TextInput } from './ui';
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from './icons';

export default function RosterEditor({
  team,
  suggestions,
  onRename,
  onAdd,
  onRemove,
  onEditPlayer,
}: {
  team: Team;
  suggestions: string[];
  onRename: (name: string) => void;
  onAdd: (name: string) => void;
  onRemove: (id: string) => void;
  onEditPlayer: (id: string, name: string) => void;
}) {
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const add = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    setDraft('');
  };
  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };
  const saveEdit = () => {
    const t = editingName.trim();
    if (editingId && t) onEditPlayer(editingId, t);
    setEditingId(null);
  };

  return (
    <div>
      <div className="px-4 py-3">
        <TextInput value={team.name} onChange={(e) => onRename(e.target.value)} placeholder="Team name" />
      </div>
      {team.players.length > 0 && (
        <div className="divide-line border-t border-line">
          {team.players.map((p: Player, i: number) =>
            editingId === p.id ? (
              <div key={p.id} className="row gap-2 justify-between">
                <span className="shrink-0 text-caption text-fg-faint">{i + 1}</span>
                <TextInput
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && saveEdit()}
                  autoFocus
                  className="flex-1"
                />
                <button onClick={saveEdit} aria-label="Save" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-accent hover:bg-surface2">
                  <CheckIcon size={16} />
                </button>
                <button onClick={() => setEditingId(null)} aria-label="Cancel" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-fg">
                  <CloseIcon size={16} />
                </button>
              </div>
            ) : (
              <div key={p.id} className="row justify-between">
                <span className="flex items-center gap-3 text-body text-fg">
                  <span className="text-caption text-fg-faint">{i + 1}</span>
                  {p.name}
                </span>
                <span className="flex shrink-0 items-center gap-1.5">
                  <button onClick={() => startEdit(p.id, p.name)} aria-label="Edit player" className="flex h-8 w-8 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-fg">
                    <EditIcon size={16} />
                  </button>
                  <button onClick={() => onRemove(p.id)} aria-label="Remove player" className="flex h-8 w-8 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error">
                    <TrashIcon size={16} />
                  </button>
                </span>
              </div>
            ),
          )}
        </div>
      )}
      <div className="flex items-center gap-2 border-y border-line px-4 py-2.5">
        <div className="flex-1">
          <AutocompleteInput value={draft} onChange={setDraft} suggestions={suggestions} onSubmit={add} placeholder="Add player name" />
        </div>
        <Button variant="secondary" onClick={add} disabled={!draft.trim()} className="shrink-0 px-4">
          Add
        </Button>
      </div>
    </div>
  );
}
