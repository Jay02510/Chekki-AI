import React from 'react';
import { Notebook, FileText, ClockCounterClockwise } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';
import { StaffNavItem } from './StaffNavItem';

interface Props {
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

const TABS = [
  { id: 'overview', Icon: Notebook, ko: '오늘의 일지', en: 'Daily log' },
  { id: 'homework', Icon: FileText, ko: '정답지 올리기', en: 'Answer key' },
  { id: 'history', Icon: ClockCounterClockwise, ko: '일지 기록', en: 'Log history' },
] as const;

// FT's sidebar nav: overview/homework/history tabs.
//
// The Syllabus/Curriculum Setup tab is intentionally omitted here (demo:
// OCR scan flow not battle-tested enough for live demo) — re-add if that
// changes.
export function FtSidebarNav({ isKo, activeTab, setActiveTab }: Props) {
  return (
    <>
      {TABS.map(({ id, Icon, ko, en }) => (
        <StaffNavItem key={id} Icon={Icon} label={isKo ? ko : en} active={activeTab === id} onClick={() => setActiveTab(id)} />
      ))}
    </>
  );
}
