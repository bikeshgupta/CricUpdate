import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { DEFAULT_SETTINGS, type Match } from '../scoring/types';
import { BackButton, Button, Screen, SectionHeader, StickyHeader, TextInput } from '../components/ui';

export default function PlanMatch() {
  const user = useAuth((s) => s.user)!;
  const createMatch = useMatch((s) => s.createMatch);
  const navigate = useNavigate();

  const [dateAt, setDateAt] = useState('');
  const [groundName, setGroundName] = useState('');
  const [groundAddress, setGroundAddress] = useState('');
  const [creating, setCreating] = useState(false);

  const create = async () => {
    if (creating) return;
    setCreating(true);
    try {
      const id = crypto.randomUUID().slice(0, 8);
      const match: Match = {
        id,
        ownerUid: user.uid,
        createdAt: Date.now(),
        status: 'planning',
        settings: DEFAULT_SETTINGS,
        teamA: { id: 'teamA', name: '', players: [] },
        teamB: { id: 'teamB', name: '', players: [] },
        toss: null,
        innings1: null,
        innings2: null,
        result: null,
        pool: [],
        ...(dateAt ? { scheduledAt: new Date(dateAt).getTime() } : {}),
        ...(groundName.trim() ? { groundName: groundName.trim(), groundStatus: 'pending' as const } : {}),
        ...(groundAddress.trim() ? { groundAddress: groundAddress.trim() } : {}),
      };
      await createMatch(match);
      navigate(`/match/${id}`);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Screen>
      <StickyHeader title="Plan a match" left={<BackButton onClick={() => navigate('/')} />} />

      <div className="flex-1">
        <p className="px-4 pt-4 text-caption text-fg-faint">
          Set a tentative date and share the invite link. People can RSVP, and you'll form teams on the day once
          everyone's gathered.
        </p>

        <SectionHeader>Tentative date &amp; time</SectionHeader>
        <div className="px-4">
          <input
            type="datetime-local"
            value={dateAt}
            onChange={(e) => setDateAt(e.target.value)}
            className="w-full rounded-md border border-line-strong bg-surface2 px-3 py-2.5 text-body text-fg outline-none focus:border-accent"
          />
        </div>

        <SectionHeader>Ground (optional)</SectionHeader>
        <div className="space-y-2 px-4">
          <TextInput value={groundName} onChange={(e) => setGroundName(e.target.value)} placeholder="Ground name" />
          <TextInput value={groundAddress} onChange={(e) => setGroundAddress(e.target.value)} placeholder="Address" />
        </div>
      </div>

      <div className="sticky bottom-0 mt-5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Button variant="primary" block disabled={creating} onClick={create}>
          {creating ? 'Creating…' : 'Create event'}
        </Button>
      </div>
    </Screen>
  );
}
