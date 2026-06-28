import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useTournaments } from '../hooks/useTournaments';
import { dataService } from '../services/dataService';
import type { Tournament } from '../scoring/types';
import { BackButton, Button, Screen, SectionHeader, Sheet, StickyHeader, Tag, TextInput } from '../components/ui';
import { TrophyMiniIcon } from '../components/icons';

export default function Tournaments() {
  const user = useAuth((s) => s.user)!;
  const navigate = useNavigate();
  const { tournaments, loading } = useTournaments(user.uid);

  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const create = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const t: Tournament = { id: crypto.randomUUID(), ownerUid: user.uid, name: trimmed, createdAt: Date.now(), status: 'active' };
      await dataService.createTournament(t);
      navigate(`/tournament/${t.id}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <StickyHeader title="Tournaments" left={<BackButton onClick={() => navigate(-1)} />} />

      <div className="px-4 pb-3 pt-3">
        <Button variant="primary" block onClick={() => setOpen(true)}>
          + New tournament
        </Button>
      </div>

      <SectionHeader>Your tournaments</SectionHeader>
      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : tournaments.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">
          No tournaments yet. Group a set of matches together to get a live points table.
        </div>
      ) : (
        <div className="divide-line border-t border-line">
          {tournaments.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(`/tournament/${t.id}`)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition duration-150 hover:bg-surface"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface2 text-fg-muted">
                <TrophyMiniIcon size={18} />
              </span>
              <span className="min-w-0 flex-1 truncate text-body text-fg">{t.name}</span>
              {t.status === 'completed' && <Tag>Completed</Tag>}
            </button>
          ))}
        </div>
      )}

      <Sheet open={open} onClose={() => setOpen(false)} title="New tournament">
        <div>
          <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Tournament name" autoFocus />
          <div className="mt-4">
            <Button variant="primary" block disabled={!name.trim() || saving} onClick={create}>
              {saving ? 'Creating…' : 'Create tournament'}
            </Button>
          </div>
        </div>
      </Sheet>
    </Screen>
  );
}
