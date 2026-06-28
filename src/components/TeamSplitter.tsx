import type { Player, Team } from '../scoring/types';
import { Button, TextInput } from './ui';

function shuffled<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Evenly, randomly deals a player pool into two fresh sides. */
export function autoBalanceTeams(pool: Player[], nameA = 'Team 1', nameB = 'Team 2'): [Team, Team] {
  const mixed = shuffled(pool);
  const half = Math.ceil(mixed.length / 2);
  return [
    { id: crypto.randomUUID(), name: nameA, players: mixed.slice(0, half) },
    { id: crypto.randomUUID(), name: nameB, players: mixed.slice(half) },
  ];
}

/** Auto-balanced two-side split with tap-to-move manual override. Fully controlled by the parent. */
export default function TeamSplitter({
  teamA,
  teamB,
  onTeamAChange,
  onTeamBChange,
  onReshuffle,
}: {
  teamA: Team;
  teamB: Team;
  onTeamAChange: (t: Team) => void;
  onTeamBChange: (t: Team) => void;
  onReshuffle: () => void;
}) {
  const moveToOtherTeam = (pid: string, from: 'A' | 'B') => {
    if (from === 'A') {
      const player = teamA.players.find((p) => p.id === pid);
      if (!player) return;
      onTeamAChange({ ...teamA, players: teamA.players.filter((p) => p.id !== pid) });
      onTeamBChange({ ...teamB, players: [...teamB.players, player] });
    } else {
      const player = teamB.players.find((p) => p.id === pid);
      if (!player) return;
      onTeamBChange({ ...teamB, players: teamB.players.filter((p) => p.id !== pid) });
      onTeamAChange({ ...teamA, players: [...teamA.players, player] });
    }
  };

  return (
    <div>
      <div className="px-4 pb-3">
        <Button variant="secondary" block onClick={onReshuffle}>
          Re-shuffle teams
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-3 px-4">
        <SplitColumn team={teamA} onRename={(name) => onTeamAChange({ ...teamA, name })} onTapPlayer={(pid) => moveToOtherTeam(pid, 'A')} />
        <SplitColumn team={teamB} onRename={(name) => onTeamBChange({ ...teamB, name })} onTapPlayer={(pid) => moveToOtherTeam(pid, 'B')} />
      </div>
    </div>
  );
}

function SplitColumn({ team, onRename, onTapPlayer }: { team: Team; onRename: (name: string) => void; onTapPlayer: (pid: string) => void }) {
  return (
    <div className="rounded-[10px] border border-line-strong bg-surface">
      <div className="border-b border-line px-2.5 py-2">
        <TextInput value={team.name} onChange={(e) => onRename(e.target.value)} placeholder="Team name" />
      </div>
      <div className="divide-line">
        {team.players.map((p) => (
          <button key={p.id} onClick={() => onTapPlayer(p.id)} className="block w-full px-2.5 py-2 text-left text-body text-fg transition duration-150 hover:bg-surface2">
            {p.name}
          </button>
        ))}
        {team.players.length === 0 && <div className="px-2.5 py-3 text-caption text-fg-faint">No players</div>}
      </div>
    </div>
  );
}
