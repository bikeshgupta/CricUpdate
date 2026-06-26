import { useState } from 'react';

export default function ShareBar({ matchId, compact }: { matchId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/match/${matchId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked; the link is still visible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  if (compact) {
    return (
      <button onClick={copy} className="text-xs font-semibold text-accent">
        {copied ? 'Copied!' : 'Share'}
      </button>
    );
  }

  return (
    <div className="glass flex items-center gap-3 p-3">
      <div className="min-w-0 flex-1">
        <div className="micro-label">Live share link</div>
        <div className="truncate text-sm text-ink">{url}</div>
      </div>
      <button
        onClick={copy}
        className="shrink-0 rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-base"
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}
