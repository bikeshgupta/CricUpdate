// Shared icon set — consistent 24x24 stroke style (round caps/joins, currentColor)
// matching BackButton/PlayerPicker's existing glyphs. No emoji anywhere in the app.

import type { SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'viewBox' | 'fill'> & { size?: number };

function Base({ size = 18, strokeWidth = 2, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  );
}

export function TrashIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
      <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </Base>
  );
}

export function EditIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M15.5 4.5l4 4L8 20l-4.5.5L4 16z" />
      <path d="M13.5 6.5l4 4" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base strokeWidth={2.5} {...props}>
      <path d="M20 6L9 17l-5-5" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M18 6L6 18" />
      <path d="M6 6l12 12" />
    </Base>
  );
}

export function ChevronRightIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 6l6 6-6 6" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}

export function BatIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14.5 3.5l5 5-7 7-5-5z" />
      <path d="M8 14.5L4 18.5" />
      <path d="M3.5 19l1.5 1.5" />
    </Base>
  );
}

export function BallIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3c-3 4.5-3 13.5 0 18" />
      <path d="M8 6.3h2.2" />
      <path d="M7 12h2.4" />
      <path d="M8 17.7h2.2" />
    </Base>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M16.5 5.5a3 3 0 0 1 0 5.9" />
      <path d="M15.5 14c2.5.3 4.5 2.1 4.5 5" />
    </Base>
  );
}

export function JoinIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M13 5l6 7-6 7" />
      <path d="M19 12H4" />
    </Base>
  );
}

export function LiveDotIcon({ size = 8, ...rest }: IconProps) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }} {...(rest as React.HTMLAttributes<HTMLSpanElement>)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-[#3DDC72] opacity-75" />
      <span
        className="relative inline-flex h-full w-full rounded-full bg-[#3DDC72]"
        style={{ boxShadow: '0 0 6px 1px rgba(61,220,114,0.8)' }}
      />
    </span>
  );
}

export function ClipboardListIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1z" />
      <path d="M6 6h12a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M8.5 11h7" />
      <path d="M8.5 14.5h7" />
      <path d="M8.5 18h4" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6.5 4v3" />
      <path d="M17.5 4v3" />
      <path d="M5 8h14" />
      <path d="M5 6h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      <path d="M9 13h.01" />
      <path d="M12 13h.01" />
      <path d="M15 13h.01" />
      <path d="M9 16.5h.01" />
      <path d="M12 16.5h.01" />
    </Base>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M9 4H6a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h3" />
      <path d="M15 16l5-4-5-4" />
      <path d="M20 12H9" />
    </Base>
  );
}

export function TrophyMiniIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M7 4h10v4a5 5 0 0 1-10 0z" />
      <path d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5 3.5 3.5 0 0 0 6.5 10H7" />
      <path d="M17 5h2.5A1.5 1.5 0 0 1 21 6.5 3.5 3.5 0 0 1 17.5 10H17" />
      <path d="M10 13v3" />
      <path d="M14 13v3" />
      <path d="M8 20h8" />
      <path d="M9 20v-2a3 3 0 0 1 3-3 3 3 0 0 1 3 3v2" />
    </Base>
  );
}
