import { useState } from 'react';

export default function ShareBar({ matchId, compact }: { matchId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}/match/${matchId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked; link is still visible */
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (compact) {
    return (
      <button onClick={copy} className="btn btn-ghost btn-sm" aria-label="Share match">
        {copied ? 'Copied' : 'Share'}
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border-y border-line px-4 py-3">
      <div className="min-w-0 flex-1">
        <div className="text-caption text-fg-muted">Live share link</div>
        <div className="truncate text-body text-fg">{url}</div>
      </div>
      <button onClick={copy} className="btn btn-secondary btn-sm shrink-0">
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  );
}
