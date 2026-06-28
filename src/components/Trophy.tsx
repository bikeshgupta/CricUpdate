// Hand-drawn award trophies — a shared gold cup silhouette with a distinct
// graphite emblem per category. No emoji/Unicode glyphs.

export type TrophyVariant = 'mvp' | 'batter' | 'bowler' | 'fielder';

const GOLD_LIGHT = '#E3C988';
const GOLD_DARK = '#9C7F3E';
const GOLD_MID = '#B89657';
const INK = '#1E1E20';

function Cup({ gradientId }: { gradientId: string }) {
  return (
    <>
      <rect x="20" y="53" width="24" height="4" rx="1.5" fill={GOLD_DARK} />
      <path d="M23 46 H41 L39 53 H25 Z" fill={GOLD_MID} />
      <rect x="29" y="37" width="6" height="10" fill={GOLD_MID} />
      <path d="M19 11 C10 11 9 22 18 25" fill="none" stroke={GOLD_MID} strokeWidth="3" strokeLinecap="round" />
      <path d="M45 11 C54 11 55 22 46 25" fill="none" stroke={GOLD_MID} strokeWidth="3" strokeLinecap="round" />
      <path d="M19 8 H45 V18 C45 28.5 39.5 35 32 35 C24.5 35 19 28.5 19 18 Z" fill={`url(#${gradientId})`} />
    </>
  );
}

function Emblem({ variant }: { variant: TrophyVariant }) {
  switch (variant) {
    case 'mvp':
      return <path d="M32 11 L34.7 16.6 L41 17.4 L36.3 21.6 L37.6 27.8 L32 24.6 L26.4 27.8 L27.7 21.6 L23 17.4 L29.3 16.6 Z" fill={INK} />;
    case 'batter':
      return (
        <g fill={INK} transform="rotate(20 32 19)">
          <rect x="30.3" y="8.5" width="3.4" height="9" rx="1.5" />
          <path d="M27.2 17 C27 21.3 27.7 25.6 28.9 27.4 C29.7 28.6 33.2 28.6 34 27 C34.9 25.2 35.2 21 35 17 Z" />
        </g>
      );
    case 'bowler':
      return (
        <g>
          <circle cx="32" cy="20" r="8" fill={INK} />
          <path d="M32 12.3 Q27.7 20 32 27.7" fill="none" stroke={GOLD_LIGHT} strokeWidth="1.1" />
          <g stroke={GOLD_LIGHT} strokeWidth="1" strokeLinecap="round">
            <line x1="29" y1="14.6" x2="32.6" y2="14" />
            <line x1="27.9" y1="20" x2="31.6" y2="20" />
            <line x1="29" y1="25.4" x2="32.6" y2="26" />
          </g>
        </g>
      );
    case 'fielder':
      return (
        <g>
          <path d="M24 25 C23.3 17 27 11.5 32 11.5 C37 11.5 40.7 17 40 25 C39.7 28 37.6 29.5 35 29.5 L29 29.5 C26.4 29.5 24.3 28 24 25 Z" fill={INK} />
          <g stroke={GOLD_LIGHT} strokeWidth="1" strokeLinecap="round">
            <line x1="28.3" y1="15" x2="28.3" y2="24.5" />
            <line x1="32" y1="13.7" x2="32" y2="25.3" />
            <line x1="35.7" y1="15" x2="35.7" y2="24.5" />
          </g>
        </g>
      );
  }
}

export function Trophy({ variant, size = 56 }: { variant: TrophyVariant; size?: number }) {
  const gradientId = `trophy-grad-${variant}`;
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD_LIGHT} />
          <stop offset="100%" stopColor={GOLD_DARK} />
        </linearGradient>
      </defs>
      <Cup gradientId={gradientId} />
      <Emblem variant={variant} />
    </svg>
  );
}
