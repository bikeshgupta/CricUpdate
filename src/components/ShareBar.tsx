import { useState } from 'react';

export default function ShareBar({ matchId, compact }: { matchId: string; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const url = `${window.location.origin}/match/${matchId}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard may be blocked; link is still visible when expanded */
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
    <div className="border-b border-line">
      <div className="row justify-between">
        <button onClick={() => setExpanded((v) => !v)} className="flex items-center gap-1.5 text-body text-fg">
          Share match
          <span className={`text-fg-faint transition-transform duration-150 ${expanded ? 'rotate-180' : ''}`}>⌄</span>
        </button>
        <button onClick={copy} className="btn btn-secondary btn-sm">
          {copied ? 'Copied' : 'Copy link'}
        </button>
      </div>
      {expanded && <div className="truncate px-4 pb-3 text-caption text-fg-muted">{url}</div>}
    </div>
  );
}
