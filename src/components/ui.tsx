import { AnimatePresence, motion } from 'framer-motion';
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

export function Screen({ children }: { children: ReactNode }) {
  return <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col">{children}</div>;
}

/** Sticky top bar. `children` renders below the title row (e.g. a scoreboard). */
export function StickyHeader({
  title,
  left,
  right,
  children,
  border = true,
}: {
  title?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children?: ReactNode;
  border?: boolean;
}) {
  return (
    <header
      className={`sticky top-0 z-30 bg-bg/95 backdrop-blur ${border ? 'border-b border-line' : ''}`}
      style={{ paddingTop: 'env(safe-area-inset-top)' }}
    >
      <div className="flex h-12 items-center justify-between gap-2 px-4">
        <div className="flex min-w-0 items-center gap-2.5">
          {left}
          {title && <span className="truncate text-body font-semibold text-fg">{title}</span>}
        </div>
        <div className="flex items-center gap-1">{right}</div>
      </div>
      {children}
    </header>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="-ml-1 flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted hover:bg-surface" aria-label="Back">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>
  );
}

export function SectionHeader({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="section-header">
      <span>{children}</span>
      {action}
    </div>
  );
}

export function Divider() {
  return <div className="border-t border-line" />;
}

// ---------------------------------------------------------------------------
// Controls
// ---------------------------------------------------------------------------

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'md' | 'sm';
  block?: boolean;
};

const VARIANT_CLASS: Record<NonNullable<ButtonProps['variant']>, string> = {
  // literal class names so Tailwind's scanner keeps these @layer component classes
  primary: 'btn-primary',
  secondary: 'btn-secondary',
  danger: 'btn-danger',
  ghost: 'btn-ghost',
};

export function Button({ variant = 'secondary', size = 'md', block, className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`btn ${VARIANT_CLASS[variant]} ${size === 'sm' ? 'btn-sm' : ''} ${block ? 'w-full' : ''} ${className}`}
      {...rest}
    />
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`input ${props.className ?? ''}`} />;
}

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  accent,
}: {
  options: { value: T; label: ReactNode }[];
  value: T;
  onChange: (v: T) => void;
  accent?: boolean;
}) {
  return (
    <div className="seg">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={String(o.value)}
            onClick={() => onChange(o.value)}
            className={`seg-item ${active ? (accent ? 'seg-item-active-accent' : 'seg-item-active') : ''}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition duration-150 ${checked ? 'bg-accent' : 'bg-line-strong'}`}
    >
      <span
        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all duration-150 ${checked ? 'left-[18px]' : 'left-0.5'}`}
      />
    </button>
  );
}

export function Stepper({ value, onChange, min = 0, max = 99 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  const btn = 'flex h-8 w-8 items-center justify-center rounded-md border border-line-strong text-fg-muted active:opacity-80 disabled:opacity-30';
  return (
    <div className="flex items-center gap-2.5">
      <button className={btn} disabled={value <= min} onClick={() => onChange(Math.max(min, value - 1))}>−</button>
      <span className="nums w-5 text-center text-body text-fg">{value}</span>
      <button className={btn} disabled={value >= max} onClick={() => onChange(Math.min(max, value + 1))}>+</button>
    </div>
  );
}

/** A settings/control row: label on the left, control on the right. */
export function ControlRow({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="row justify-between py-2.5">
      <div className="min-w-0">
        <div className="text-body text-fg">{label}</div>
        {hint && <div className="text-caption text-fg-faint">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

// Rounded-square team badge with a deterministic, muted background colour.
const BADGE_COLORS = ['#1F6F66', '#3B5BA5', '#97653A', '#6B4E9E', '#3E7C4F', '#9E4A57', '#2E7D8A', '#7A6A3A'];

function hashIndex(str: string, mod: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h % mod;
}

export function TeamBadge({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'h-8 w-8 text-[12px]', md: 'h-10 w-10 text-[14px]', lg: 'h-14 w-14 text-[20px]' };
  const bg = BADGE_COLORS[hashIndex(name || '?', BADGE_COLORS.length)];
  const initials =
    (name || '?')
      .trim()
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('') || '?';
  return (
    <span className={`badge-team ${sizes[size]}`} style={{ backgroundColor: bg }}>
      {initials}
    </span>
  );
}

export function Tag({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'error' }) {
  const tones = {
    neutral: 'border-line-strong text-fg-muted',
    accent: 'border-accent/40 text-accent',
    success: 'border-success/40 text-success',
    error: 'border-error/40 text-error',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[11px] font-medium ${tones[tone]}`}>
      {children}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tabs (underline)
// ---------------------------------------------------------------------------

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
    <div className="flex border-b border-line px-2">
      {tabs.map((t) => {
        const isActive = t.id === active;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-3 py-2 text-body transition duration-150 ${isActive ? 'font-medium text-fg' : 'font-normal text-fg-muted hover:text-fg'}`}
          >
            {t.label}
            {isActive && <motion.span layoutId="tab-underline" className="absolute inset-x-3 -bottom-px h-0.5 bg-accent" transition={{ duration: 0.15 }} />}
          </button>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

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
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="relative z-10 w-full max-w-md rounded-t-2xl border-t border-line-strong bg-surface"
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
          >
            {title && (
              <div className="flex items-center justify-between border-b border-line px-4 py-3">
                <span className="text-body font-semibold text-fg">{title}</span>
                <button onClick={onClose} className="text-caption text-fg-muted hover:text-fg">
                  Close
                </button>
              </div>
            )}
            <div className="px-4 py-4">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
