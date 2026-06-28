import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService, type PlayerProfile as ClaimedProfile } from '../services/dataService';
import { battingAverage, computeAllPlayerStats, economyOf, strikeRate, type PlayerStatTotals } from '../scoring/playerStats';
import { BackButton, Button, Screen, SectionHeader, StickyHeader, Tag, TeamBadge, TextInput } from '../components/ui';

function fmt(n: number | null, digits = 1): string {
  return n === null ? '—' : n.toFixed(digits);
}

function StatTile({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[10px] border border-line-strong bg-surface py-3">
      <span className="nums text-[18px] font-semibold leading-none text-fg">{value}</span>
      <span className="mt-1 text-caption font-medium text-fg-muted">{label}</span>
    </div>
  );
}

function ClaimForm({ nameKey, suggestedName, uid, onClaimed }: { nameKey: string; suggestedName: string; uid: string; onClaimed: (p: ClaimedProfile) => void }) {
  const [name, setName] = useState(suggestedName);
  const [handle, setHandle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizeHandle = (v: string) => v.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);

  const submit = async () => {
    const h = sanitizeHandle(handle);
    const n = name.trim();
    if (!h || h.length < 3 || !n || busy) return;
    setBusy(true);
    setError(null);
    try {
      const available = await dataService.isHandleAvailable(h);
      if (!available) {
        setError('That handle is already taken.');
        return;
      }
      await dataService.claimPlayerProfile(nameKey, n, h, uid);
      onClaimed({ nameKey, name: n, handle: h, claimedByUid: uid, claimedAt: Date.now() });
    } catch {
      setError('Could not claim this card. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3 px-4 py-4">
      <div>
        <div className="mb-1.5 text-caption text-fg-muted">Display name</div>
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
      </div>
      <div>
        <div className="mb-1.5 text-caption text-fg-muted">Unique handle</div>
        <TextInput
          value={handle}
          onChange={(e) => setHandle(sanitizeHandle(e.target.value))}
          placeholder="e.g. rsharma07"
          autoCapitalize="none"
        />
      </div>
      {error && <p className="text-caption text-error">{error}</p>}
      <Button variant="primary" block disabled={!name.trim() || handle.length < 3 || busy} onClick={submit}>
        {busy ? 'Claiming…' : 'Claim this card'}
      </Button>
    </div>
  );
}

export default function PlayerProfile() {
  const { nameKey: rawNameKey } = useParams<{ nameKey: string }>();
  const nameKey = decodeURIComponent(rawNameKey ?? '');
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [stats, setStats] = useState<PlayerStatTotals | null>(null);
  const [profile, setProfile] = useState<ClaimedProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showClaim, setShowClaim] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([dataService.listAllMatches(), dataService.getPlayerProfile(nameKey)]).then(([matches, p]) => {
      if (!active) return;
      const byKey = computeAllPlayerStats(matches);
      setStats(byKey.get(nameKey) ?? null);
      setProfile(p);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [nameKey]);

  const avg = useMemo(() => (stats ? battingAverage(stats) : null), [stats]);
  const sr = useMemo(() => (stats ? strikeRate(stats) : null), [stats]);
  const econ = useMemo(() => (stats ? economyOf(stats) : null), [stats]);

  const displayName = profile?.name ?? stats?.displayName ?? nameKey;
  const isOwnCard = !!user && profile?.claimedByUid === user.uid;

  return (
    <Screen>
      <StickyHeader title="Player card" left={<BackButton onClick={() => navigate(-1)} />} />

      {loading ? (
        <div className="px-4 py-5 text-caption text-fg-faint">Loading…</div>
      ) : (
        <>
          <div className="flex flex-col items-center gap-2 px-4 py-6">
            <TeamBadge name={displayName} size="lg" />
            <div className="text-section font-semibold text-fg">{displayName}</div>
            {profile ? (
              <Tag tone="accent">@{profile.handle}</Tag>
            ) : (
              <span className="text-caption text-fg-faint">Unclaimed card</span>
            )}
          </div>

          <SectionHeader>Career stats</SectionHeader>
          <div className="grid grid-cols-3 gap-2 px-4">
            <StatTile value={stats?.matches ?? 0} label="Matches" />
            <StatTile value={stats?.runs ?? 0} label="Runs" />
            <StatTile value={stats?.highScore ?? 0} label="High score" />
            <StatTile value={fmt(avg)} label="Average" />
            <StatTile value={fmt(sr)} label="Strike rate" />
            <StatTile value={`${stats?.fours ?? 0}/${stats?.sixes ?? 0}`} label="4s / 6s" />
            <StatTile value={stats?.wickets ?? 0} label="Wickets" />
            <StatTile value={fmt(econ)} label="Economy" />
            <StatTile value={stats?.bestBowling ? `${stats.bestBowling.wickets}/${stats.bestBowling.runs}` : '—'} label="Best bowling" />
          </div>

          {!stats && (
            <div className="px-4 pt-4 text-caption text-fg-faint">No matches recorded for this name yet.</div>
          )}

          {profile ? (
            isOwnCard ? (
              <div className="px-4 pt-5 text-caption text-fg-faint">This is your claimed card.</div>
            ) : null
          ) : user ? (
            showClaim ? (
              <ClaimForm nameKey={nameKey} suggestedName={stats?.displayName ?? nameKey} uid={user.uid} onClaimed={setProfile} />
            ) : (
              <div className="px-4 pt-5">
                <Button variant="primary" block onClick={() => setShowClaim(true)}>
                  Claim this card
                </Button>
              </div>
            )
          ) : (
            <div className="px-4 pt-5 text-caption text-fg-faint">Sign in with Google to claim this card.</div>
          )}
        </>
      )}
    </Screen>
  );
}
