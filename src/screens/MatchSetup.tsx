import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { DEFAULT_SETTINGS, type MatchSettings, type Player, type PlayerCategory, type Team } from '../scoring/types';
import {
  BackButton,
  Button,
  ControlRow,
  Screen,
  SectionHeader,
  Segmented,
  Sheet,
  StickyHeader,
  Stepper,
  Switch,
  Tag,
  TextInput,
} from '../components/ui';

interface DraftPlayer {
  name: string;
  category: PlayerCategory;
}

function TeamBlock({
  label,
  name,
  setName,
  players,
  setPlayers,
  onAdd,
}: {
  label: string;
  name: string;
  setName: (v: string) => void;
  players: DraftPlayer[];
  setPlayers: (p: DraftPlayer[]) => void;
  onAdd: () => void;
}) {
  return (
    <section>
      <SectionHeader action={<span className="text-caption text-fg-faint">{players.length} players</span>}>
        {label}
      </SectionHeader>
      <div className="px-4 pb-1">
        <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Team name" />
      </div>
      {players.length > 0 && (
        <div className="divide-line mt-1 border-t border-line">
          {players.map((p, i) => (
            <div key={i} className="row justify-between">
              <span className="flex items-center gap-2 text-body text-fg">
                {p.name}
                {p.category === 'ladies' && <Tag>L</Tag>}
              </span>
              <button onClick={() => setPlayers(players.filter((_, j) => j !== i))} className="text-caption text-fg-faint hover:text-error">
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={onAdd} className="row w-full border-t border-line text-body font-medium text-accent">
        + Add player
      </button>
    </section>
  );
}

function RulesEditor({ settings, setSettings }: { settings: MatchSettings; setSettings: (s: MatchSettings) => void }) {
  const patch = (p: Partial<MatchSettings>) => setSettings({ ...settings, ...p });
  return (
    <div className="divide-line border-t border-line">
      <ControlRow label="Wide = runs">
        <Stepper value={settings.wideRuns} onChange={(v) => patch({ wideRuns: v })} />
      </ControlRow>
      <ControlRow label="No-ball = runs">
        <Stepper value={settings.noBallRuns} onChange={(v) => patch({ noBallRuns: v })} />
      </ControlRow>
      <ControlRow label="Re-bowl wides">
        <Switch checked={settings.reBowlWide} onChange={(v) => patch({ reBowlWide: v })} />
      </ControlRow>
      <ControlRow label="Re-bowl no-balls">
        <Switch checked={settings.reBowlNoBall} onChange={(v) => patch({ reBowlNoBall: v })} />
      </ControlRow>
      <ControlRow label="Allow running on wides">
        <Switch checked={settings.runsAllowedOnWide} onChange={(v) => patch({ runsAllowedOnWide: v })} />
      </ControlRow>
      <ControlRow label="No runs on wide for ladies">
        <Switch checked={settings.noRunsOnWideForLadies} onChange={(v) => patch({ noRunsOnWideForLadies: v })} />
      </ControlRow>
      <ControlRow label="Free hit after no-ball">
        <Switch checked={settings.freeHitAfterNoBall} onChange={(v) => patch({ freeHitAfterNoBall: v })} />
      </ControlRow>
    </div>
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

  // add-player sheet
  const [addTeam, setAddTeam] = useState<'A' | 'B' | null>(null);
  const [draftName, setDraftName] = useState('');
  const [draftCat, setDraftCat] = useState<PlayerCategory>('gents');

  const ready = playersA.length >= 2 && playersB.length >= 2 && nameA.trim() && nameB.trim();

  const commitPlayer = () => {
    if (!draftName.trim() || !addTeam) return;
    const player = { name: draftName.trim(), category: draftCat };
    if (addTeam === 'A') setPlayersA((p) => [...p, player]);
    else setPlayersB((p) => [...p, player]);
    setDraftName('');
  };

  const toTeam = (id: string, name: string, drafts: DraftPlayer[]): Team => ({
    id,
    name: name.trim(),
    players: drafts.map<Player>((d) => ({ id: crypto.randomUUID(), name: d.name, category: d.category })),
  });

  const start = async () => {
    if (!ready) return;
    const id = crypto.randomUUID().slice(0, 8);
    await createMatch({
      id,
      ownerUid: user.uid,
      createdAt: Date.now(),
      status: 'toss',
      settings: { ...settings, oversPerInnings: overs, playersPerTeam: Math.max(playersA.length, playersB.length) },
      teamA: toTeam('teamA', nameA, playersA),
      teamB: toTeam('teamB', nameB, playersB),
      toss: null,
      innings1: null,
      innings2: null,
      result: null,
    });
    navigate(`/match/${id}`);
  };

  return (
    <Screen>
      <StickyHeader title="New match" left={<BackButton onClick={() => navigate('/')} />} />

      <div className="divide-line flex-1">
        <TeamBlock label="Team 1" name={nameA} setName={setNameA} players={playersA} setPlayers={setPlayersA} onAdd={() => setAddTeam('A')} />
        <TeamBlock label="Team 2" name={nameB} setName={setNameB} players={playersB} setPlayers={setPlayersB} onAdd={() => setAddTeam('B')} />

        <section>
          <SectionHeader>Overs per innings</SectionHeader>
          <div className="px-4 pb-2">
            <Segmented options={[2, 5, 6, 8, 10, 20].map((o) => ({ value: o, label: o }))} value={overs} onChange={setOvers} />
          </div>
        </section>

        <section>
          <button onClick={() => setShowRules((v) => !v)} className="section-header w-full">
            <span>Match rules</span>
            <span className="text-fg-faint">{showRules ? 'Hide' : 'Edit'}</span>
          </button>
          {showRules && <RulesEditor settings={settings} setSettings={setSettings} />}
        </section>
      </div>

      <div className="sticky bottom-0 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
        <Button variant="primary" block disabled={!ready} onClick={start}>
          {ready ? 'Start toss' : 'Add at least 2 players per team'}
        </Button>
      </div>

      <Sheet open={addTeam !== null} onClose={() => setAddTeam(null)} title={`Add player · ${addTeam === 'A' ? nameA : nameB}`}>
        <div className="space-y-3">
          <TextInput value={draftName} onChange={(e) => setDraftName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && commitPlayer()} placeholder="Player name" autoFocus />
          <Segmented
            options={[
              { value: 'gents', label: 'Gents' },
              { value: 'ladies', label: 'Ladies' },
            ]}
            value={draftCat}
            onChange={setDraftCat}
          />
          <Button variant="primary" block onClick={commitPlayer} disabled={!draftName.trim()}>
            Add player
          </Button>
          <p className="text-center text-caption text-fg-faint">Keep adding — the sheet stays open.</p>
        </div>
      </Sheet>
    </Screen>
  );
}
