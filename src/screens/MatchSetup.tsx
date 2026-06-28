import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { useMatch } from '../store/matchStore';
import { useSavedPlayers, useSavedTeams } from '../hooks/useSavedRoster';
import { useSquads } from '../hooks/useSquads';
import { dataService } from '../services/dataService';
import { DEFAULT_SETTINGS, type Match, type MatchSettings, type Player, type Squad, type Team } from '../scoring/types';
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
  TextInput,
} from '../components/ui';
import { TrashIcon } from '../components/icons';
import RosterEditor from '../components/RosterEditor';
import TeamSplitter, { autoBalanceTeams } from '../components/TeamSplitter';

type DraftTeam = Team; // { id, name, players: Player[] }
type Mode = 'predefined' | 'adhoc';
type Step = 'mode' | 'pick' | 'pool' | 'split' | 'roster';

const PRESET_OVERS = [2, 5, 6, 8, 10, 20];
const CUSTOM_OVERS_SENTINEL = -1;
const MIN_POOL_SIZE = 4;

const STEP_TITLES: Record<Step, string> = {
  mode: 'New match',
  pick: 'New match',
  pool: 'Pick players',
  split: 'Split teams',
  roster: 'Add players',
};

function newTeam(name = ''): DraftTeam {
  return { id: crypto.randomUUID(), name, players: [] };
}

// ---------------------------------------------------------------------------

export default function MatchSetup() {
  const user = useAuth((s) => s.user)!;
  const createMatch = useMatch((s) => s.createMatch);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tournamentId = searchParams.get('tournamentId') || undefined;
  const savedTeams = useSavedTeams(user.uid);
  const savedPlayers = useSavedPlayers(user.uid);
  const { squads } = useSquads(user.uid);

  const [step, setStep] = useState<Step>('mode');
  const [mode, setMode] = useState<Mode>('predefined');
  const [teamA, setTeamA] = useState<DraftTeam | null>(null);
  const [teamB, setTeamB] = useState<DraftTeam | null>(null);
  const [tab, setTab] = useState<'A' | 'B'>('A');
  const [overs, setOvers] = useState(6);
  const [customOvers, setCustomOvers] = useState(false);
  const [settings, setSettings] = useState<MatchSettings>(DEFAULT_SETTINGS);
  const [showRules, setShowRules] = useState(false);

  // team-picker sheet (pre-defined path)
  const [pickSlot, setPickSlot] = useState<'A' | 'B' | null>(null);

  // ad-hoc pool step
  const [pool, setPool] = useState<Player[]>([]);
  const [poolDraft, setPoolDraft] = useState('');
  const [loadSquadOpen, setLoadSquadOpen] = useState(false);
  const [saveSquadName, setSaveSquadName] = useState('');
  const [savingSquad, setSavingSquad] = useState(false);

  // schedule-for-later (ad-hoc path)
  const [scheduling, setScheduling] = useState(false);
  const [scheduleAt, setScheduleAt] = useState('');

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

  // --- ad-hoc pool ---
  const addDraftToPool = () => {
    const name = poolDraft.trim();
    if (!name) return;
    setPool((p) => [...p, { id: crypto.randomUUID(), name, category: 'gents' }]);
    setPoolDraft('');
  };
  const removeFromPool = (pid: string) => setPool((p) => p.filter((x) => x.id !== pid));
  const loadSquad = (s: Squad) => {
    setPool((p) => {
      const existing = new Set(p.map((x) => x.name.trim().toLowerCase()));
      const fresh = s.players
        .filter((pl) => !existing.has(pl.name.trim().toLowerCase()))
        .map<Player>((pl) => ({ id: crypto.randomUUID(), name: pl.name, category: 'gents' }));
      return [...p, ...fresh];
    });
    setLoadSquadOpen(false);
  };
  const saveSquad = async () => {
    const name = saveSquadName.trim();
    if (!name || pool.length === 0 || savingSquad) return;
    setSavingSquad(true);
    try {
      const now = Date.now();
      await dataService.createSquad({ id: crypto.randomUUID(), ownerUid: user.uid, name, players: pool, createdAt: now, updatedAt: now });
      setSaveSquadName('');
    } finally {
      setSavingSquad(false);
    }
  };

  // --- split into two sides ---
  const autoBalance = () => {
    const [a, b] = autoBalanceTeams(pool, teamA?.name || 'Team 1', teamB?.name || 'Team 2');
    setTeamA(a);
    setTeamB(b);
  };
  const goToSplit = () => {
    setStep('split');
    if (!teamA || !teamB) autoBalance();
  };

  const handleBack = () => {
    if (step === 'pick') setStep('mode');
    else if (step === 'pool') setStep('mode');
    else if (step === 'split') setStep('pool');
    else if (step === 'roster') setStep(mode === 'adhoc' ? 'split' : 'pick');
    else navigate('/');
  };

  const buildMatch = (status: Match['status']): Match | null => {
    if (!ready || !teamA || !teamB) return null;
    const id = crypto.randomUUID().slice(0, 8);
    return {
      id,
      ownerUid: user.uid,
      createdAt: Date.now(),
      status,
      settings: { ...settings, oversPerInnings: overs, playersPerTeam: Math.max(teamA.players.length, teamB.players.length) },
      teamA: { ...teamA, id: 'teamA' },
      teamB: { ...teamB, id: 'teamB' },
      toss: null,
      innings1: null,
      innings2: null,
      result: null,
      ...(tournamentId ? { tournamentId } : {}),
      ...(status === 'scheduled' && scheduleAt ? { scheduledAt: new Date(scheduleAt).getTime() } : {}),
    };
  };

  const start = async () => {
    const match = buildMatch('toss');
    if (!match) return;
    await createMatch(match);
    navigate(`/match/${match.id}`);
  };

  const scheduleForLater = async () => {
    if (!scheduleAt) return;
    const match = buildMatch('scheduled');
    if (!match) return;
    await createMatch(match);
    navigate(`/match/${match.id}`);
  };

  return (
    <Screen>
      <StickyHeader title={STEP_TITLES[step]} left={<BackButton onClick={handleBack} />} />

      {step === 'mode' && (
        <div className="flex-1 space-y-3 px-4 pt-5">
          <ModeCard
            title="Pre-defined teams"
            subtitle="Pick two saved teams, or build a fresh roster for each side."
            onTap={() => {
              setMode('predefined');
              setStep('pick');
            }}
          />
          <ModeCard
            title="Pick players on the spot"
            subtitle="Build today's pool of players, then auto-split into two sides — tap to override."
            onTap={() => {
              setMode('adhoc');
              setStep('pool');
            }}
          />
        </div>
      )}

      {step === 'pick' && (
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
      )}

      {step === 'pool' && (
        <div className="flex-1">
          <div className="px-4 pb-2 pt-4 text-caption text-fg-faint">
            Add everyone who's here today. You'll split into two sides next.
          </div>
          <div className="flex items-center gap-2 px-4 pb-2">
            <div className="flex-1">
              <AutocompleteInput value={poolDraft} onChange={setPoolDraft} suggestions={savedPlayers} onSubmit={addDraftToPool} placeholder="Add player name" />
            </div>
            <Button variant="secondary" onClick={addDraftToPool} disabled={!poolDraft.trim()} className="shrink-0 px-4">
              Add
            </Button>
          </div>
          <button onClick={() => setLoadSquadOpen(true)} className="mx-4 mb-2 block text-caption font-medium text-accent">
            Load a saved squad
          </button>

          {pool.length > 0 && (
            <div className="divide-line border-t border-line">
              {pool.map((p, i) => (
                <div key={p.id} className="row justify-between">
                  <span className="flex items-center gap-3 text-body text-fg">
                    <span className="text-caption text-fg-faint">{i + 1}</span>
                    {p.name}
                  </span>
                  <button onClick={() => removeFromPool(p.id)} aria-label="Remove player" className="flex h-8 w-8 items-center justify-center rounded-md text-fg-faint hover:bg-surface2 hover:text-error">
                    <TrashIcon size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {pool.length > 0 && (
            <div className="flex items-center gap-2 border-y border-line px-4 py-2.5">
              <div className="flex-1">
                <TextInput value={saveSquadName} onChange={(e) => setSaveSquadName(e.target.value)} placeholder="Save this pool as a squad (optional)" />
              </div>
              <Button variant="secondary" onClick={saveSquad} disabled={!saveSquadName.trim() || savingSquad} className="shrink-0 px-4">
                {savingSquad ? 'Saving…' : 'Save'}
              </Button>
            </div>
          )}

          <div className="sticky bottom-0 mt-5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="primary" block disabled={pool.length < MIN_POOL_SIZE} onClick={goToSplit}>
              {pool.length < MIN_POOL_SIZE ? `Add at least ${MIN_POOL_SIZE} players (${pool.length}/${MIN_POOL_SIZE})` : 'Continue'}
            </Button>
          </div>
        </div>
      )}

      {step === 'split' && teamA && teamB && (
        <div className="flex-1">
          <div className="px-4 pb-2 pt-4 text-caption text-fg-faint">
            Auto-balanced into two even sides — tap a player to move them across, or re-shuffle.
          </div>
          <TeamSplitter teamA={teamA} teamB={teamB} onTeamAChange={setTeamA} onTeamBChange={setTeamB} onReshuffle={autoBalance} />
          <div className="sticky bottom-0 mt-5 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            <Button variant="primary" block disabled={!teamA?.players.length || !teamB?.players.length} onClick={() => setStep('roster')}>
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'roster' && (
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
              value={customOvers ? CUSTOM_OVERS_SENTINEL : overs}
              onChange={(v) => {
                if (v === CUSTOM_OVERS_SENTINEL) setCustomOvers(true);
                else {
                  setCustomOvers(false);
                  setOvers(v);
                }
              }}
            />
            {customOvers && (
              <div className="flex items-center justify-between rounded-[10px] border border-line-strong bg-surface px-3 py-2.5">
                <span className="text-caption text-fg-muted">Custom overs</span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={50}
                  value={overs}
                  onChange={(e) => {
                    const n = parseInt(e.target.value, 10);
                    if (!Number.isNaN(n)) setOvers(Math.min(50, Math.max(1, n)));
                  }}
                  className="nums w-16 rounded-md border border-line-strong bg-surface2 px-2 py-1.5 text-center text-body text-fg outline-none focus:border-accent"
                />
              </div>
            )}
          </div>

          <button onClick={() => setShowRules((v) => !v)} className="section-header w-full">
            <span>Match rules</span>
            <span className="text-fg-faint">{showRules ? 'Hide' : 'Edit'}</span>
          </button>
          {showRules && <RulesEditor settings={settings} setSettings={setSettings} />}

          <div className="sticky bottom-0 mt-6 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
            {mode === 'adhoc' && (
              <div className="mb-2">
                {!scheduling ? (
                  <button onClick={() => setScheduling(true)} className="block w-full pb-2 text-center text-caption font-medium text-accent">
                    Schedule for later instead
                  </button>
                ) : (
                  <div className="mb-2 space-y-2 rounded-[10px] border border-line-strong bg-surface px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-caption text-fg-muted">Starts at</span>
                      <input
                        type="datetime-local"
                        value={scheduleAt}
                        onChange={(e) => setScheduleAt(e.target.value)}
                        className="rounded-md border border-line-strong bg-surface2 px-2 py-1.5 text-body text-fg outline-none focus:border-accent"
                      />
                    </div>
                    <Button variant="secondary" block disabled={!ready || !scheduleAt} onClick={scheduleForLater}>
                      Save scheduled match
                    </Button>
                  </div>
                )}
              </div>
            )}
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

      <Sheet open={loadSquadOpen} onClose={() => setLoadSquadOpen(false)} title="Load a squad">
        {squads.length === 0 ? (
          <div className="py-3 text-center text-caption text-fg-faint">No saved squads yet.</div>
        ) : (
          <div className="divide-line overflow-hidden rounded-lg border border-line-strong">
            {squads.map((s) => (
              <button key={s.id} onClick={() => loadSquad(s)} className="row w-full justify-between bg-surface hover:bg-surface2">
                <span className="text-body text-fg">{s.name}</span>
                <span className="text-caption text-fg-muted">{s.players.length} players ›</span>
              </button>
            ))}
          </div>
        )}
      </Sheet>
    </Screen>
  );
}

function ModeCard({ title, subtitle, onTap }: { title: string; subtitle: string; onTap: () => void }) {
  return (
    <button onClick={onTap} className="block w-full rounded-[10px] border border-line-strong bg-surface px-4 py-4 text-left transition duration-150 active:opacity-80">
      <div className="text-item font-semibold text-fg">{title}</div>
      <div className="mt-1 text-caption text-fg-muted">{subtitle}</div>
    </button>
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
          <div className="line-clamp-1 text-center text-item font-medium text-fg">{team.name || 'New team'}</div>
          <div className="text-caption font-medium text-fg-muted">{team.players.length} players</div>
        </>
      ) : (
        <>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-dashed border-line-strong text-2xl text-fg-muted">+</div>
          <div className="text-body text-fg-muted">Add team</div>
        </>
      )}
    </button>
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
