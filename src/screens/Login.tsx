import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { Button, Screen } from '../components/ui';
import { BrandLockup } from '../components/Logo';
import { sampleMatches } from '../mocks/sampleData';
import { usingFirebase } from '../services/dataService';

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#fff" />
      <path fill="#4285F4" d="M21.6 12.2c0-.6-.1-1.2-.2-1.8H12v3.4h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.1z" />
      <path fill="#34A853" d="M12 22c2.7 0 5-1 6.6-2.7l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.7-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22z" />
      <path fill="#FBBC05" d="M6.4 13.7a6 6 0 0 1 0-3.8V7.3H3.1a10 10 0 0 0 0 9l3.3-2.6z" />
      <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.8-2.8A10 10 0 0 0 3.1 7.3l3.3 2.6C7.2 7.5 9.4 6.1 12 6.1z" />
    </svg>
  );
}

export default function Login() {
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();
  const demoId = sampleMatches[0]?.id;

  return (
    <Screen>
      <div className="flex flex-1 flex-col px-6">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <BrandLockup />
          <p className="mt-5 max-w-[17rem] text-body text-fg-muted">
            Ball-by-ball cricket scoring with live shareable links. No ads, no clutter.
          </p>
        </div>

        <div className="space-y-3 pb-10">
          <Button variant="primary" block onClick={signIn}>
            <GoogleGlyph />
            Continue with Google
          </Button>
          {!usingFirebase && demoId && (
            <Button variant="ghost" block onClick={() => navigate(`/match/${demoId}`)}>
              Have a link? Watch a live match
            </Button>
          )}
          {!usingFirebase && <p className="text-center text-caption text-fg-faint">Demo build — sign-in is mocked.</p>}
        </div>
      </div>
    </Screen>
  );
}
