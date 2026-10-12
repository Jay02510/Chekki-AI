import React from 'react';
import { Buildings, Users, Table, UserGear, CreditCard } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';
import { StaffNavItem } from './StaffNavItem';

interface Props {
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const SETUP = [
  { id: 'students', Icon: Users, ko: '학생', en: 'Students' },
  { id: 'classes', Icon: Table, ko: '학급', en: 'Classes' },
  { id: 'teacher_assignment', Icon: UserGear, ko: '선생님 배정', en: 'Teachers' },
  { id: 'billing', Icon: CreditCard, ko: '결제', en: 'Billing' },
] as const;

// Director's sidebar nav: the dashboard, then the "Setup" pages.
export function DirectorSidebarNav({ isKo, activeTab, setActiveTab }: Props) {
  return (
    <>
      <StaffNavItem Icon={Buildings} label={isKo ? '대시보드' : 'Dashboard'} active={activeTab === 'director_hq'} onClick={() => setActiveTab('director_hq')} />
      <div className="mt-4 space-y-1 border-t border-rule pt-4">
        <span className="block px-3 pb-1 text-[13px] font-bold text-ink-3">{isKo ? '설정' : 'Setup'}</span>
        {SETUP.map(({ id, Icon, ko, en }) => (
          <StaffNavItem key={id} Icon={Icon} label={isKo ? ko : en} active={activeTab === id} onClick={() => setActiveTab(id)} />
        ))}
      </div>
    </>
  );
}
