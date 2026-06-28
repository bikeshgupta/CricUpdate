import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/authStore';
import { backendReady } from './services/dataService';
import { BrandLockup } from './components/Logo';
import { Screen } from './components/ui';
import Login from './screens/Login';
import Home from './screens/Home';
import MatchSetup from './screens/MatchSetup';
import LiveMatch from './screens/LiveMatch';
import Players from './screens/Players';
import PlayerProfile from './screens/PlayerProfile';
import Squads from './screens/Squads';
import Tournaments from './screens/Tournaments';
import TournamentDetail from './screens/TournamentDetail';

export default function App() {
  // Firebase must be configured for the app to run.
  if (!backendReady) return <SetupNotice />;
  return <AppRoutes />;
}

function AppRoutes() {
  const init = useAuth((s) => s.init);
  const ready = useAuth((s) => s.ready);
  const user = useAuth((s) => s.user);

  useEffect(() => init(), [init]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-caption text-fg-muted">Loading…</div>
    );
  }

  return (
    <Routes>
      {/* Watching a live match, and browsing player stats, never require sign-in. */}
      <Route path="/match/:id" element={<LiveMatch />} />
      <Route path="/players" element={<Players />} />
      <Route path="/player/:nameKey" element={<PlayerProfile />} />
      <Route path="/tournament/:id" element={<TournamentDetail />} />
      <Route path="/" element={user ? <Home /> : <Login />} />
      <Route path="/new" element={user ? <MatchSetup /> : <Navigate to="/" replace />} />
      <Route path="/squads" element={user ? <Squads /> : <Navigate to="/" replace />} />
      <Route path="/tournaments" element={user ? <Tournaments /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function SetupNotice() {
  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <BrandLockup />
        <p className="max-w-xs text-body text-fg-muted">Firebase isn’t configured for this build.</p>
        <p className="max-w-xs text-caption text-fg-faint">
          Add your project’s <span className="text-fg">VITE_FIREBASE_*</span> values to a{' '}
          <span className="text-fg">.env</span> file (see <span className="text-fg">.env.example</span> and{' '}
          <span className="text-fg">FIREBASE_SETUP.md</span>), then reload.
        </p>
      </div>
    </Screen>
  );
}
