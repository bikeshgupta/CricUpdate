import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

export function Screen({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col px-5 pb-8 pt-[max(1rem,env(safe-area-inset-top))]">
      {children}
    </div>
  );
}

export function AppBar({
  title,
  left,
  right,
  live,
}: {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  live?: boolean;
}) {
  return (
    <header className="mb-5 flex items-center justify-between gap-3 pt-1">
      <div className="flex items-center gap-2.5">
        {live && (
          <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            <span className="h-2 w-2 rounded-full bg-accent animate-pulse-glow" />
            Live
          </span>
        )}
        {left}
        {title && <span className="text-sm font-semibold text-ink">{title}</span>}
      </div>
      <div className="flex items-center gap-2">{right}</div>
    </header>
  );
}

export function GlassCard({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`glass p-4 ${onClick ? 'cursor-pointer transition active:scale-[0.99]' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

export function AccentButton({
  children,
  onClick,
  disabled,
  className = '',
  type = 'button',
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`btn-accent ${className}`}>
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  className = '',
  active,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`btn-ghost ${active ? 'border-accent/60 text-accent' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

export function MicroLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`micro-label ${className}`}>{children}</div>;
}

/** Bottom sheet modal. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="glass relative z-10 w-full max-w-md rounded-b-none rounded-t-3xl border-b-0 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-glass-border" />
            {title && <div className="mb-4 text-center text-base font-semibold text-ink">{title}</div>}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** Cricbuzz-style segmented tab bar. */
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="mb-4 flex rounded-xl border border-glass-border bg-surface-sunken p-1">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="relative flex-1 rounded-lg py-2 text-sm font-semibold transition"
          >
            {isActive && (
              <motion.span
                layoutId="tab-pill"
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              />
            )}
            <span className={`relative ${isActive ? 'text-base' : 'text-ink-muted'}`}>
              {t.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Chip({
  children,
  selected,
  onClick,
  tone = 'default',
}: {
  children: ReactNode;
  selected?: boolean;
  onClick?: () => void;
  tone?: 'default' | 'lady';
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-2 text-sm font-medium transition active:scale-95 ${
        selected
          ? 'border-accent bg-accent/15 text-accent'
          : 'border-glass-border bg-glass-fill text-ink'
      } ${tone === 'lady' && !selected ? 'text-ink-muted' : ''}`}
    >
      {children}
    </button>
  );
}
