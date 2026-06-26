import { useState } from 'react';
import { useMatch } from '../store/matchStore';
import type { Match, PlayerCategory } from '../scoring/types';
import { GhostButton, MicroLabel, Sheet } from './ui';

/** Add a late-arriving player to either team mid-match. */
export default function PlayerManager({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match }) {
  const addPlayer = useMatch((s) => s.addPlayer);
  const [teamId, setTeamId] = useState(match.teamA.id);
  const [name, setName] = useState('');
  const [cat, setCat] = useState<PlayerCategory>('gents');

  const submit = () => {
    if (!name.trim()) return;
    addPlayer(teamId, name.trim(), cat);
    setName('');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add a player">
      <div className="space-y-4">
        <div>
          <MicroLabel className="mb-2">Team</MicroLabel>
          <div className="grid grid-cols-2 gap-2">
            {[match.teamA, match.teamB].map((t) => (
              <GhostButton key={t.id} active={teamId === t.id} onClick={() => setTeamId(t.id)}>
                {t.name}
              </GhostButton>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && submit()}
            placeholder="Player name"
            className="flex-1 rounded-xl border border-glass-border bg-black/20 px-3.5 py-3 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent/50"
          />
          <button
            onClick={() => setCat(cat === 'gents' ? 'ladies' : 'gents')}
            className={`rounded-xl border px-3 text-xs font-semibold ${
              cat === 'ladies' ? 'border-accent/60 text-accent' : 'border-glass-border text-ink-muted'
            }`}
          >
            {cat === 'gents' ? 'Gents' : 'Ladies'}
          </button>
        </div>

        <button
          onClick={submit}
          className="w-full rounded-2xl bg-accent py-3 text-center font-semibold text-base"
        >
          Add player
        </button>

        <p className="text-center text-[11px] text-ink-faint">
          New players become available to bat or bowl right away.
        </p>
      </div>
    </Sheet>
  );
}
