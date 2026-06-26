import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import {
  DEFAULT_SETTINGS,
  type MatchSettings,
  type Player,
  type PlayerCategory,
  type Team,
} from '../scoring/types';
import {
  AccentButton,
  AppBar,
  Chip,
  GhostButton,
  GlassCard,
  MicroLabel,
  Screen,
} from '../components/ui';

interface DraftPlayer {
  name: string;
  category: PlayerCategory;
}

function TeamEditor({
  label,
  name,
  setName,
  players,
  setPlayers,
}: {
  label: string;
  name: string;
  setName: (v: string) => void;
  players: DraftPlayer[];
  setPlayers: (p: DraftPlayer[]) => void;
}) {
  const [draft, setDraft] = useState('');
  const [cat, setCat] = useState<PlayerCategory>('gents');

  const add = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    setPlayers([...players, { name: trimmed, category: cat }]);
    setDraft('');
  };

  return (
    <GlassCard className="space-y-3">
      <MicroLabel>{label}</MicroLabel>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Team name"
        className="w-full rounded-xl border border-glass-border bg-black/20 px-3.5 py-3 text-base font-semibold text-ink outline-none placeholder:text-ink-faint focus:border-accent/50"
      />

      <div className="flex flex-wrap gap-2">
        {players.map((p, i) => (
          <span
            key={i}
            className="flex items-center gap-1.5 rounded-full border border-glass-border bg-glass-fill py-1.5 pl-3 pr-1.5 text-sm text-ink"
          >
            {p.name}
            {p.category === 'ladies' && <span className="text-[10px] text-accent">L</span>}
            <button
              onClick={() => setPlayers(players.filter((_, j) => j !== i))}
              className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-ink-muted"
            >
              ×
            </button>
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add player name"
          className="flex-1 rounded-xl border border-glass-border bg-black/20 px-3.5 py-2.5 text-sm text-ink outline-none placeholder:text-ink-faint focus:border-accent/50"
        />
        <button
          onClick={() => setCat(cat === 'gents' ? 'ladies' : 'gents')}
          className={`rounded-xl border px-3 text-xs font-semibold ${
            cat === 'ladies'
              ? 'border-accent/60 text-accent'
              : 'border-glass-border text-ink-muted'
          }`}
        >
          {cat === 'gents' ? 'Gents' : 'Ladies'}
        </button>
        <GhostButton onClick={add} className="px-4 py-2.5 text-sm">
          Add
        </GhostButton>
      </div>
    </GlassCard>
  );
}

function SettingsEditor({
  settings,
  setSettings,
}: {
  settings: MatchSettings;
  setSettings: (s: MatchSettings) => void;
}) {
  const patch = (p: Partial<MatchSettings>) => setSettings({ ...settings, ...p });

  const Stepper = ({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) => (
    <div className="flex items-center justify-between">
      <span className="text-sm text-ink">{label}</span>
      <div className="flex items-center gap-3">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="h-8 w-8 rounded-lg border border-glass-border text-ink-muted">−</button>
        <span className="nums w-5 text-center text-sm text-ink">{value}</span>
        <button onClick={() => onChange(value + 1)} className="h-8 w-8 rounded-lg border border-glass-border text-ink-muted">+</button>
      </div>
    </div>
  );

  const Toggle = ({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) => (
    <button onClick={onToggle} className="flex w-full items-center justify-between">
      <span className="text-sm text-ink">{label}</span>
      <span className={`relative h-6 w-11 rounded-full transition ${on ? 'bg-accent' : 'bg-glass-border'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-base transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} />
      </span>
    </button>
  );

  return (
    <GlassCard className="space-y-4">
      <MicroLabel>Match rules</MicroLabel>
      <Stepper label="Wide = runs" value={settings.wideRuns} onChange={(v) => patch({ wideRuns: v })} />
      <Stepper label="No-ball = runs" value={settings.noBallRuns} onChange={(v) => patch({ noBallRuns: v })} />
      <div className="h-px bg-glass-border" />
      <Toggle on={settings.reBowlWide} onToggle={() => patch({ reBowlWide: !settings.reBowlWide })} label="Re-bowl wides" />
      <Toggle on={settings.reBowlNoBall} onToggle={() => patch({ reBowlNoBall: !settings.reBowlNoBall })} label="Re-bowl no-balls" />
      <Toggle on={settings.runsAllowedOnWide} onToggle={() => patch({ runsAllowedOnWide: !settings.runsAllowedOnWide })} label="Allow running on wides" />
      <Toggle on={settings.noRunsOnWideForLadies} onToggle={() => patch({ noRunsOnWideForLadies: !settings.noRunsOnWideForLadies })} label="No runs on wide for ladies" />
      <Toggle on={settings.freeHitAfterNoBall} onToggle={() => patch({ freeHitAfterNoBall: !settings.freeHitAfterNoBall })} label="Free hit after no-ball" />
    </GlassCard>
  );
}

export default function MatchSetup() {
  const user = useAuth((s) => s.user)!;
  const createMatch = useMatch((s) => s.createMatch);
  const navigate = useNavigate();

  const [nameA, setNameA] = useState('Team A');
  const [nameB, setNameB] = useState('Team B');
  const [playersA, setPlayersA] = useState<DraftPlayer[]>([]);
  const [playersB, setPlayersB] = useState<DraftPlayer[]>([]);
  const [overs, setOvers] = useState(6);
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [showRules, setShowRules] = useState(false);

  const ready = playersA.length >= 2 && playersB.length >= 2 && nameA.trim() && nameB.trim();

  const toTeam = (id: string, name: string, drafts: DraftPlayer[]): Team => ({
    id,
    name: name.trim(),
    players: drafts.map<Player>((d) => ({ id: crypto.randomUUID(), name: d.name, category: d.category })),
  });

  const start = async () => {
    if (!ready) return;
    const id = crypto.randomUUID().slice(0, 8);
    const match = {
      id,
      ownerUid: user.uid,
      createdAt: Date.now(),
      status: 'toss' as const,
      settings: { ...settings, oversPerInnings: overs, playersPerTeam: Math.max(playersA.length, playersB.length) },
      teamA: toTeam('teamA', nameA, playersA),
      teamB: toTeam('teamB', nameB, playersB),
      toss: null,
      innings1: null,
      innings2: null,
      result: null,
    };
    await createMatch(match);
    navigate(`/match/${id}`);
  };

  return (
    <Screen>
      <AppBar
        title="New match"
        left={
          <button onClick={() => navigate('/')} className="text-ink-muted">
            ←
          </button>
        }
      />

      <div className="space-y-4">
        <TeamEditor label="Team 1" name={nameA} setName={setNameA} players={playersA} setPlayers={setPlayersA} />
        <TeamEditor label="Team 2" name={nameB} setName={setNameB} players={playersB} setPlayers={setPlayersB} />

        <GlassCard className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink">Overs per innings</span>
            <div className="flex flex-wrap gap-2">
              {[2, 5, 6, 8, 10, 20].map((o) => (
                <Chip key={o} selected={overs === o} onClick={() => setOvers(o)}>
                  {o}
                </Chip>
              ))}
            </div>
          </div>
        </GlassCard>

        <button
          onClick={() => setShowRules((v) => !v)}
          className="flex w-full items-center justify-between px-1 text-sm text-ink-muted"
        >
          <span>Advanced rules (wides, no-balls, gender rule)</span>
          <span>{showRules ? '▴' : '▾'}</span>
        </button>
        {showRules && <SettingsEditor settings={settings} setSettings={setSettings} />}
      </div>

      <div className="sticky bottom-4 mt-6">
        <AccentButton onClick={start} disabled={!ready} className="w-full">
          {ready ? 'Go to Toss →' : 'Add at least 2 players per team'}
        </AccentButton>
      </div>
    </Screen>
  );
}
