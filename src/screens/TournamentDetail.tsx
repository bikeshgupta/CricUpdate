import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { dataService } from '../services/dataService';
import { computeStandings } from '../scoring/standings';
import type { Match, Tournament } from '../scoring/types';
import { BackButton, Button, Screen, SectionHeader, StickyHeader, StatusText } from '../components/ui';
import { LiveDotIcon, TrophyMiniIcon } from '../components/icons';

function isLive(m: Match): boolean {
  return m.status === 'innings1' || m.status === 'innings2';
}

function MatchStatusTag({ match }: { match: Match }) {
  if (isLive(match)) {
    return (
      <span className="inline-flex items-center gap-1.5 text-caption font-medium text-accent">
        <LiveDotIcon /> Live
      </span>
    );
  }
  if (match.status === 'complete') return <span className="truncate text-caption text-success">{match.result}</span>;
  if (match.status === 'scheduled') return <StatusText>Scheduled</StatusText>;
  return <StatusText>{match.status}</StatusText>;
}

export default function TournamentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuth((s) => s.user);

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([dataService.getTournament(id), dataService.listMatchesByTournament(id)]).then(([t, m]) => {
      setTournament(t);
      setMatches(m);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <div className="flex min-h-[100dvh] items-center justify-center text-caption text-fg-muted">Loading…</div>;
  }

  if (!tournament) {
    return (
      <Screen>
        <StickyHeader title="Tournament" left={<BackButton onClick={() => navigate('/')} />} />
        <div className="px-4 py-6 text-caption text-fg-muted">This tournament isn’t available on this device.</div>
      </Screen>
    );
  }

  const isOwner = !!user && user.uid === tournament.ownerUid;
  const standings = computeStandings(matches);

  return (
    <Screen>
      <StickyHeader title={tournament.name} left={<BackButton onClick={() => navigate(-1)} />} />

      <div className="px-4 pb-3 pt-3">
        <div className="flex items-center gap-2 rounded-lg border border-line-strong px-3 py-2.5">
          <TrophyMiniIcon size={18} className="shrink-0 text-fg-muted" />
          <span className="truncate text-body font-medium text-fg">{tournament.name}</span>
          {tournament.status === 'completed' && <StatusText>Completed</StatusText>}
        </div>
      </div>

      <SectionHeader>Points table</SectionHeader>
      {standings.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">No completed matches yet — standings will appear here once a match finishes.</div>
      ) : (
        <div className="overflow-x-auto px-4">
          <table className="w-full text-left">
            <thead>
              <tr className="text-caption text-fg-faint">
                <th className="py-1.5 font-medium">Team</th>
                <th className="py-1.5 text-right font-medium">P</th>
                <th className="py-1.5 text-right font-medium">W</th>
                <th className="py-1.5 text-right font-medium">L</th>
                <th className="py-1.5 text-right font-medium">T</th>
                <th className="py-1.5 text-right font-medium">Pts</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((row) => (
                <tr key={row.teamName} className="border-t border-line text-body text-fg">
                  <td className="py-1.5 nums truncate">{row.teamName}</td>
                  <td className="nums py-1.5 text-right text-fg-muted">{row.played}</td>
                  <td className="nums py-1.5 text-right text-fg-muted">{row.won}</td>
                  <td className="nums py-1.5 text-right text-fg-muted">{row.lost}</td>
                  <td className="nums py-1.5 text-right text-fg-muted">{row.tied}</td>
                  <td className="nums py-1.5 text-right font-semibold text-fg">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <SectionHeader
        action={
          isOwner && (
            <Button size="sm" variant="secondary" onClick={() => navigate(`/new?tournamentId=${tournament.id}`)}>
              + Add match
            </Button>
          )
        }
      >
        Matches
      </SectionHeader>
      {matches.length === 0 ? (
        <div className="px-4 py-5 text-caption text-fg-faint">No matches added yet.</div>
      ) : (
        <div className="divide-line border-t border-line">
          {matches.map((m) => (
            <button
              key={m.id}
              onClick={() => navigate(`/match/${m.id}`)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition duration-150 hover:bg-surface"
            >
              <div className="min-w-0 flex-1">
                <span className="truncate text-item font-medium text-fg">
                  {m.teamA.name} <span className="text-fg-faint">v</span> {m.teamB.name}
                </span>
                <div className="mt-0.5">
                  <MatchStatusTag match={m} />
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </Screen>
  );
}
