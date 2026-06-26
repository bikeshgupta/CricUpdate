import { useState } from 'react';
import { useMatch } from '../store/matchStore';
import type { Match } from '../scoring/types';
import { Button, Segmented, Sheet, TextInput } from './ui';

/** Add a late-arriving player to either team mid-match. */
export default function PlayerManager({ open, onClose, match }: { open: boolean; onClose: () => void; match: Match }) {
  const addPlayer = useMatch((s) => s.addPlayer);
  const [teamId, setTeamId] = useState(match.teamA.id);
  const [name, setName] = useState('');

  const submit = () => {
    if (!name.trim()) return;
    addPlayer(teamId, name.trim(), 'gents');
    setName('');
  };

  return (
    <Sheet open={open} onClose={onClose} title="Add player">
      <div className="space-y-3">
        <Segmented
          options={[
            { value: match.teamA.id, label: match.teamA.name },
            { value: match.teamB.id, label: match.teamB.name },
          ]}
          value={teamId}
          onChange={setTeamId}
        />
        <TextInput value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} placeholder="Player name" autoFocus />
        <Button variant="primary" block onClick={submit} disabled={!name.trim()}>
          Add player
        </Button>
      </div>
    </Sheet>
  );
}
