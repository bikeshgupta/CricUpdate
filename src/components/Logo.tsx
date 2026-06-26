// MatchOn wordmark — the "O" is a cricket ball (seam + stitches).

export function BallO({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className="inline-block align-middle">
      <circle cx="16" cy="16" r="15" fill="#16A085" />
      <path d="M16 1.5 Q 10.5 16 16 30.5" fill="none" stroke="#fff" strokeWidth="1.5" strokeOpacity="0.9" />
      <g stroke="#fff" strokeWidth="1.3" strokeOpacity="0.85" strokeLinecap="round">
        <line x1="12.6" y1="6.6" x2="16.4" y2="5.9" />
        <line x1="11.4" y1="11.3" x2="15.4" y2="10.9" />
        <line x1="11" y1="16" x2="15" y2="16" />
        <line x1="11.4" y1="20.7" x2="15.4" y2="21.1" />
        <line x1="12.6" y1="25.4" x2="16.4" y2="26.1" />
      </g>
    </svg>
  );
}

export function Wordmark({ size = 30 }: { size?: number }) {
  return (
    <div className="flex items-center font-bold tracking-tight text-fg" style={{ fontSize: size, lineHeight: 1 }}>
      <span>Match</span>
      <BallO size={size * 0.86} />
      <span>n</span>
    </div>
  );
}

export function BrandLockup() {
  return (
    <div className="flex flex-col items-center gap-1">
      <Wordmark size={30} />
      <div className="text-caption font-medium text-fg-muted">by SymPal games</div>
    </div>
  );
}
