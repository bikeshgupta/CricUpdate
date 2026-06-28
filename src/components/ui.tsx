import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';
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

/** Text input with a tap-to-fill dropdown of matching suggestions (e.g. previously-used player names). */
export function AutocompleteInput({
  value,
  onChange,
  suggestions,
  placeholder,
  onSubmit,
  autoFocus,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const q = value.trim().toLowerCase();
  const filtered = q ? suggestions.filter((s) => s.toLowerCase().includes(q) && s.toLowerCase() !== q).slice(0, 5) : [];
  return (
    <div className="relative">
      <TextInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 120)}
        onKeyDown={(e) => e.key === 'Enter' && onSubmit?.()}
        placeholder={placeholder}
        autoFocus={autoFocus}
      />
      {focused && filtered.length > 0 && (
        <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-[10px] border border-line-strong bg-surface2 shadow-lg">
          {filtered.map((s) => (
            <button
              key={s}
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(s);
              }}
              className="block w-full px-3 py-2 text-left text-body text-fg transition duration-100 hover:bg-surface active:bg-surface"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
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
  const btn = 'flex h-8 w-8 items-center justify-center rounded-md border border-line-strong text-fg-muted transition duration-100 active:scale-[0.92] disabled:opacity-30';
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

/** Plain inline status label — coloured text, no pill/border, to keep status callouts unobtrusive. */
export function StatusText({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'success' | 'error' }) {
  const tones = {
    neutral: 'text-fg-muted',
    accent: 'text-accent',
    success: 'text-success',
    error: 'text-error',
  };
  return <span className={`text-caption font-medium ${tones[tone]}`}>{children}</span>;
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
// Side panel (left-sliding drawer) — main nav entry point
// ---------------------------------------------------------------------------

export function Drawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <motion.div
            className="absolute inset-y-0 left-0 z-10 flex w-[78%] max-w-[300px] flex-col bg-surface"
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function DrawerItem({ icon, label, onClick }: { icon?: ReactNode; label: ReactNode; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-4 py-3 text-left text-body text-fg transition duration-150 hover:bg-surface2">
      {icon && <span className="flex h-5 w-5 shrink-0 items-center justify-center text-fg-muted">{icon}</span>}
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
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
