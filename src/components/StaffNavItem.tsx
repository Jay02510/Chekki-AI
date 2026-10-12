import React from 'react';
import type { Icon as PhosphorIcon } from '@phosphor-icons/react';

// One row of the staff sidebar nav (Director, KT, FT): plain icon, the
// active row in line-soft. Same look as the /schools tokens.
export function StaffNavItem({ Icon, label, active, onClick }: { Icon: PhosphorIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={`btn-press flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-[15px] font-bold ${
        active ? 'bg-line-soft text-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink'
      }`}
    >
      <Icon size={20} weight={active ? 'fill' : 'regular'} className={active ? 'text-line-ink' : 'text-ink-3'} aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}
