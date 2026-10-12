import React from 'react';
import { Buildings, Users, Table, UserGear, CreditCard } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const SETUP: { id: TabId; Icon: typeof Users; ko: string; en: string }[] = [
  { id: 'students', Icon: Users, ko: '학생', en: 'Students' },
  { id: 'classes', Icon: Table, ko: '학급', en: 'Classes' },
  { id: 'teacher_assignment', Icon: UserGear, ko: '선생님 배정', en: 'Teachers' },
  { id: 'billing', Icon: CreditCard, ko: '결제', en: 'Billing' },
];

// Director's sidebar nav: the dashboard, then the "Setup" pages. One accent
// (the active row), plain icons; same warm tokens as /schools.
export function DirectorSidebarNav({ isKo, activeTab, setActiveTab }: Props) {
  const item = (id: TabId, Icon: typeof Users, label: string) => {
    const active = activeTab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setActiveTab(id)}
        aria-current={active ? 'page' : undefined}
        className={`btn-press flex min-h-11 w-full cursor-pointer items-center gap-3 rounded-md px-3 text-left text-[15px] font-bold ${
          active ? 'bg-line-soft text-ink' : 'text-ink-2 hover:bg-sunken hover:text-ink'
        }`}
      >
        <Icon size={20} weight={active ? 'fill' : 'regular'} className={active ? 'text-line-ink' : 'text-ink-3'} aria-hidden="true" />
        <span>{label}</span>
      </button>
    );
  };

  return (
    <>
      {item('director_hq', Buildings, isKo ? '대시보드' : 'Dashboard')}
      <div className="mt-4 space-y-1 border-t border-rule pt-4">
        <span className="block px-3 pb-1 text-[13px] font-bold text-ink-3">{isKo ? '설정' : 'Setup'}</span>
        {SETUP.map(({ id, Icon, ko, en }) => item(id, Icon, isKo ? ko : en))}
      </div>
    </>
  );
}
