import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { useSavedPlayers, useSavedTeams } from '../hooks/useSavedRoster';
import { DEFAULT_SETTINGS, type Match, type MatchSettings, type Player, type Team } from '../scoring/types';
import {
  AutocompleteInput,
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
  TeamBadge,
  TextInput,
} from '../components/ui';
import { CheckIcon, CloseIcon, EditIcon, TrashIcon } from '../components/icons';

type DraftTeam = Team; // { id, name, players: Player[] }

const PRESET_OVERS = [2, 5, 6, 8, 10, 20];
const CUSTOM_OVERS_SENTINEL = -1;

function newTeam(name = ''): DraftTeam {
  return { id: crypto.randomUUID(), name, players: [] };
}

// ---------------------------------------------------------------------------

export default function MatchSetup() {
  const user = useAuth((s) => s.user)!;
  const createMatch = useMatch((s) => s.createMatch);
  const navigate = useNavigate();
  const savedTeams = useSavedTeams(user.uid);
  const savedPlayers = useSavedPlayers(user.uid);

  const [step, setStep] = useState<'pick' | 'roster'>('pick');
  const [teamA, setTeamA] = useState<DraftTeam | null>(null);
  const [teamB, setTeamB] = useState<DraftTeam | null>(null);
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const [overs, setOvers] = useState(6);
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [showRules, setShowRules] = useState(false);

  // team-picker sheet
  const [pickSlot, setPickSlot] = useState<'A' | 'B' | null>(null);

  const teamsChosen = !!teamA && !!teamB;
  const ready = !!teamA && !!teamB && teamA.players.length >= 2 && teamB.players.length >= 2 && teamA.name.trim() && teamB.name.trim();

  const importTeam = (t: Team): DraftTeam => ({
    id: crypto.randomUUID(),
    name: t.name,
    players: t.players.map<Player>((p) => ({ id: crypto.randomUUID(), name: p.name, category: 'gents' })),
  });

  const choose = (team: DraftTeam) => {
    if (pickSlot === 'A') setTeamA(team);
    else if (pickSlot === 'B') setTeamB(team);
    setPickSlot(null);
  };

  const setActive = (updater: (t: DraftTeam) => DraftTeam) => {
    if (tab === 'A' && teamA) setTeamA(updater(teamA));
    else if (tab === 'B' && teamB) setTeamB(updater(teamB));
  };
  const activeTeam = tab === 'A' ? teamA : teamB;

  const start = async () => {
    if (!ready || !teamA || !teamB) return;
    const id = crypto.randomUUID().slice(0, 8);
    const match: Match = {
      id,
      ownerUid: user.uid,
      createdAt: Date.now(),
      status: 'toss',
      settings: { ...settings, oversPerInnings: overs, playersPerTeam: Math.max(teamA.players.length, teamB.players.length) },
      teamA: { ...teamA, id: 'teamA' },
      teamB: { ...teamB, id: 'teamB' },
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
      <StickyHeader
        title={step === 'pick' ? 'New match' : 'Add players'}
        left={<BackButton onClick={() => (step === 'roster' ? setStep('pick') : navigate('/'))} />}
      />

      {step === 'pick' ? (
        <div className="flex-1">
          <div className="flex items-stretch gap-3 px-4 pb-2 pt-5">
            <TeamCard team={teamA} onTap={() => setPickSlot('A')} />
            <div className="flex items-center text-body font-semibold text-fg-muted">vs</div>
            <TeamCard team={teamB} onTap={() => setPickSlot('B')} />
          </div>
          <div className="px-4 text-center text-caption text-fg-faint">
            Pick an existing team or create a new one for each side.
          </div>
          <div className="sticky bottom-0 mt-5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="primary" block disabled={!teamsChosen} onClick={() => setStep('roster')}>
              {teamsChosen ? 'Continue' : 'Choose both teams'}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1">
          <div className="grid grid-cols-2 border-b border-line">
            {(['A', 'B'] as const).map((slot) => {
              const t = slot === 'A' ? teamA : teamB;
              const isActive = tab === slot;
              return (
                <button
                  key={slot}
                  onClick={() => setTab(slot)}
                  className={`relative truncate px-3 py-3 text-body font-medium transition duration-150 ${isActive ? 'text-fg' : 'text-fg-muted'}`}
                >
                  {t?.name || (slot === 'A' ? 'Team 1' : 'Team 2')}
                  <span className="ml-1.5 text-caption text-fg-faint">{t?.players.length ?? 0}</span>
                  {isActive && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-accent" />}
                </button>
              );
            })}
          </div>

          {activeTeam && (
            <RosterEditor
              team={activeTeam}
              suggestions={savedPlayers}
              onRename={(name) => setActive((t) => ({ ...t, name }))}
              onAdd={(name) => setActive((t) => ({ ...t, players: [...t.players, { id: crypto.randomUUID(), name, category: 'gents' }] }))}
              onRemove={(pid) => setActive((t) => ({ ...t, players: t.players.filter((p) => p.id !== pid) }))}
              onEditPlayer={(pid, name) => setActive((t) => ({ ...t, players: t.players.map((p) => (p.id === pid ? { ...p, name } : p)) }))}
            />
          )}

          <SectionHeader>Overs per innings</SectionHeader>
          <div className="space-y-2 px-4 pb-2">
            <Segmented
              options={[...PRESET_OVERS.map((o) => ({ value: o, label: o })), { value: CUSTOM_OVERS_SENTINEL, label: 'Custom' }]}
              value={PRESET_OVERS.includes(overs) ? overs : CUSTOM_OVERS_SENTINEL}
              onChange={(v) => {
                if (v === CUSTOM_OVERS_SENTINEL) {
                  if (PRESET_OVERS.includes(overs)) setOvers(7);
                } else setOvers(v);
              }}
            />
            {!PRESET_OVERS.includes(overs) && (
              <div className="flex items-center justify-between rounded-[10px] border border-line-strong bg-surface px-3 py-2.5">
                <span className="text-caption text-fg-muted">Custom overs</span>
                <Stepper value={overs} onChange={setOvers} min={1} max={50} />
              </div>
            )}
          </div>

          <button onClick={() => setShowRules((v) => !v)} className="section-header w-full">
            <span>Match rules</span>
            <span className="text-fg-faint">{showRules ? 'Hide' : 'Edit'}</span>
          </button>
          {showRules && <RulesEditor settings={settings} setSettings={setSettings} />}

          <div className="sticky bottom-0 mt-6 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="primary" block disabled={!ready} onClick={start}>
              {ready ? 'Start match' : 'Add at least 2 players per team'}
            </Button>
          </div>
        </div>
      )}

      <TeamPickerSheet
        open={pickSlot !== null}
        onClose={() => setPickSlot(null)}
        savedTeams={savedTeams}
        excludeName={(pickSlot === 'A' ? teamB : teamA)?.name}
        onCreateNew={() => choose(newTeam(pickSlot === 'A' ? 'Team A' : 'Team B'))}
        onSelectExisting={(t) => choose(importTeam(t))}
      />
    </Screen>
  );
}

function TeamCard({ team, onTap }: { team: DraftTeam | null; onTap: () => void }) {
  return (
    <button
      onClick={onTap}
      className="flex flex-1 flex-col items-center justify-center gap-2 rounded-[10px] border border-line-strong bg-surface px-3 py-5 transition duration-150 active:opacity-80"
    >
      {team ? (
        <>
          <TeamBadge name={team.name || 'New'} size="lg" />
          <div className="line-clamp-1 text-center text-item font-medium text-fg">{team.name || 'New team'}</div>
          <div className="text-caption font-medium text-fg-muted">{team.players.length} players</div>
        </>
      ) : (
        <>
          <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-line-strong text-2xl text-fg-muted">+</div>
          <div className="text-body text-fg-muted">Add team</div>
        </>
      )}
    </button>
  );
}

function RosterEditor({
  team,
  suggestions,
  onRename,
  onAdd,
  onRemove,
  onEditPlayer,
}: {
  team: DraftTeam;
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
          {team.players.map((p, i) =>
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

function TeamPickerSheet({
  open,
  onClose,
  savedTeams,
  excludeName,
  onCreateNew,
  onSelectExisting,
}: {
  open: boolean;
  onClose: () => void;
  savedTeams: Team[];
  excludeName?: string;
  onCreateNew: () => void;
  onSelectExisting: (t: Team) => void;
}) {
  const available = useMemo(
    () => savedTeams.filter((t) => t.name.trim().toLowerCase() !== (excludeName ?? '').trim().toLowerCase()),
    [savedTeams, excludeName],
  );
  return (
    <Sheet open={open} onClose={onClose} title="Select team">
      <div className="space-y-3">
        <Button variant="primary" block onClick={onCreateNew}>
          + Create new team
        </Button>
        {available.length > 0 && (
          <>
            <div className="px-1 pt-1 text-caption text-fg-muted">Or pick a saved team</div>
            <div className="divide-line overflow-hidden rounded-lg border border-line-strong">
              {available.map((t) => (
                <button key={t.id} onClick={() => onSelectExisting(t)} className="row w-full justify-between bg-surface hover:bg-surface2">
                  <span className="text-body text-fg">{t.name}</span>
                  <span className="text-caption text-fg-muted">{t.players.length} players ›</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </Sheet>
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
      <ControlRow label="Free hit after no-ball">
        <Switch checked={settings.freeHitAfterNoBall} onChange={(v) => patch({ freeHitAfterNoBall: v })} />
      </ControlRow>
    </div>
  );
}
