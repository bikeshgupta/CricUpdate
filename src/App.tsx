import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './store/authStore';
import Login from './screens/Login';
import Home from './screens/Home';
import MatchSetup from './screens/MatchSetup';
import LiveMatch from './screens/LiveMatch';

export default function App() {
  const init = useAuth((s) => s.init);
  const ready = useAuth((s) => s.ready);
  const user = useAuth((s) => s.user);

  useEffect(() => init(), [init]);

  if (!ready) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center text-ink-muted">
        <span className="animate-pulse">Loading…</span>
      </div>
    );
  }

  return (
    <Routes>
      {/* Watching a live match never requires sign-in. */}
      <Route path="/match/:id" element={<LiveMatch />} />
      <Route path="/" element={user ? <Home /> : <Login />} />
      <Route path="/new" element={user ? <MatchSetup /> : <Navigate to="/" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
