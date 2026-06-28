import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useSquads } from '../hooks/useSquads';
import { useSavedPlayers } from '../hooks/useSavedRoster';
import { dataService } from '../services/dataService';
import type { Player, Squad } from '../scoring/types';
import { BackButton, Button, Screen, SectionHeader, Sheet, StickyHeader, TextInput } from '../components/ui';
import { TrashIcon } from '../components/icons';
import RosterEditor from '../components/RosterEditor';

function newSquad(ownerUid: string): Squad {
  const now = Date.now();
  return { id: crypto.randomUUID(), ownerUid, name: '', players: [], createdAt: now, updatedAt: now };
}

export default function Squads() {
  const user = useAuth((s) => s.user)!;
  const navigate = useNavigate();
  const { squads, loading, reload } = useSquads(user.uid);
  const savedPlayers = useSavedPlayers(user.uid);

  const [editing, setEditing] = useState<Squad | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);

  const openNew = () => {
    setEditing(newSquad(user.uid));
    setIsNew(true);
  };
  const openEdit = (s: Squad) => {
    setEditing(s);
    setIsNew(false);
  };
  const close = () => setEditing(null);

  const save = async () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    setSaving(true);
    try {
      const squad: Squad = { ...editing, name, updatedAt: Date.now() };
      if (isNew) await dataService.createSquad(squad);
      else await dataService.updateSquad(squad);
      reload();
      close();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: Squad) => {
    if (!window.confirm(`Delete the squad "${s.name}"? This can't be undone.`)) return;
    await dataService.deleteSquad(s.id);
    reload();
  };

  return (
    <Screen>
      <StickyHeader title="Squads" left={<BackButton onClick={() => navigate(-1)} />} />

      <div className="px-4 pb-3 pt-3">
        <Button variant="primary" block onClick={openNew}>
          + New squad
        </Button>
      </div>

      <SectionHeader>Your squads</SectionHeader>
      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : squads.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">
          No squads yet. Save a reusable player pool (e.g. "Friday Office Game") to speed up picking teams on the spot.
        </div>
      ) : (
        <div className="divide-line border-t border-line">
          {squads.map((s) => (
            <div key={s.id} className="flex w-full items-center transition duration-150 hover:bg-surface">
              <button onClick={() => openEdit(s)} className="flex min-w-0 flex-1 items-center justify-between px-4 py-2.5 text-left">
                <span className="truncate text-body text-fg">{s.name}</span>
                <span className="shrink-0 text-caption text-fg-muted">{s.players.length} players</span>
              </button>
              <button
                onClick={() => remove(s)}
                aria-label="Delete squad"
                className="mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error"
              >
                <TrashIcon size={17} />
              </button>
            </div>
          ))}
        </div>
      )}

      <Sheet open={editing !== null} onClose={close} title={isNew ? 'New squad' : 'Edit squad'}>
        {editing && (
          <div>
            <TextInput
              value={editing.name}
              onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              placeholder="Squad name (e.g. Friday Office Game)"
              autoFocus
            />
            <div className="-mx-4 mt-3">
              <RosterEditor
                team={{ id: editing.id, name: editing.name, players: editing.players }}
                suggestions={savedPlayers}
                onRename={(name) => setEditing({ ...editing, name })}
                onAdd={(name) =>
                  setEditing({ ...editing, players: [...editing.players, { id: crypto.randomUUID(), name, category: 'gents' } as Player] })
                }
                onRemove={(pid) => setEditing({ ...editing, players: editing.players.filter((p) => p.id !== pid) })}
                onEditPlayer={(pid, name) =>
                  setEditing({ ...editing, players: editing.players.map((p) => (p.id === pid ? { ...p, name } : p)) })
                }
              />
            </div>
            <div className="mt-4">
              <Button variant="primary" block disabled={!editing.name.trim() || saving} onClick={save}>
                {saving ? 'Saving…' : 'Save squad'}
              </Button>
            </div>
          </div>
        )}
      </Sheet>
    </Screen>
  );
}
