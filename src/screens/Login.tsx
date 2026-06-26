import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../store/authStore';
import { AccentButton, GhostButton, Screen } from '../components/ui';
import { sampleMatches } from '../mocks/sampleData';

function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#0B0F14" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6c1.9-5.5 7-9.8 13.7-9.8z" opacity=".0"/>
      <circle cx="24" cy="24" r="22" fill="#0B0F14" />
      <path fill="#C7F94B" d="M34.6 24.3c0-.8-.1-1.6-.2-2.3H24v4.5h6c-.3 1.5-1.1 2.7-2.4 3.6v3h3.9c2.3-2.1 3.1-5.2 3.1-8.8z"/>
      <path fill="#C7F94B" d="M24 35c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9h-4v3.1C15.4 32.4 19.4 35 24 35z"/>
      <path fill="#C7F94B" d="M17.4 25.4c-.2-.7-.4-1.4-.4-2.1s.1-1.5.4-2.1v-3.1h-4C12.5 17.6 12 19.7 12 22s.5 4.4 1.4 6.2l4-2.8z"/>
      <path fill="#C7F94B" d="M24 15.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4C29.9 12.2 27.2 11 24 11c-4.6 0-8.6 2.6-10.6 6.5l4 3.1c.9-2.8 3.5-4.8 6.6-4.8z"/>
    </svg>
  );
}

export default function Login() {
  const signIn = useAuth((s) => s.signIn);
  const navigate = useNavigate();
  const demoId = sampleMatches[0]?.id;

  return (
    <Screen>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-accent/30 bg-accent/10 shadow-glow">
            <div className="relative h-7 w-7 rounded-full border-2 border-accent">
              <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">CricUpdate</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-muted">
            Score a match ball by ball. No ads, no clutter — just cricket.
          </p>

          <div className="glass mt-9 space-y-3 p-5 text-left">
            <AccentButton onClick={signIn} className="flex w-full items-center justify-center gap-3">
              <GoogleGlyph />
              Continue with Google
            </AccentButton>
            <p className="px-1 text-center text-[11px] text-ink-faint">
              Demo build — sign-in is mocked, one tap drops you in.
            </p>
          </div>

          {demoId && (
            <GhostButton
              onClick={() => navigate(`/match/${demoId}`)}
              className="mt-3 w-full text-sm"
            >
              Have a link? Watch a live match →
            </GhostButton>
          )}
        </motion.div>
      </div>
    </Screen>
  );
}
