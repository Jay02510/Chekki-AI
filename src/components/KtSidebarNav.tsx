import React from 'react';
import { Sparkle, ChartBar, Notebook, FileText, Phone } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';
import { StaffNavItem } from './StaffNavItem';

interface Props {
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  showReportCardModal: boolean;
  setShowReportCardModal: (show: boolean) => void;
}

const TABS = [
  { id: 'kt_script', Icon: Sparkle, ko: '학부모 리포트', en: 'Parent reports' },
  { id: 'overview', Icon: ChartBar, ko: '학급 현황', en: 'Class overview' },
  { id: 'kt_log', Icon: Notebook, ko: '오늘의 일지', en: 'Daily log' },
  { id: 'homework', Icon: FileText, ko: '정답지 올리기', en: 'Answer key' },
] as const;

// KT's sidebar nav: script/overview/log/homework tabs plus the parent call
// notes generator (parent-facing communication is KT's job).
//
// The Syllabus/Curriculum Setup tab is intentionally omitted here (demo:
// OCR scan flow not battle-tested enough for live demo) — re-add if that
// changes.
export function KtSidebarNav({ isKo, activeTab, setActiveTab, showReportCardModal, setShowReportCardModal }: Props) {
  return (
    <>
      {TABS.map(({ id, Icon, ko, en }) => (
        <StaffNavItem key={id} Icon={Icon} label={isKo ? ko : en} active={activeTab === id} onClick={() => setActiveTab(id)} />
      ))}
      <div className="mt-4 border-t border-rule pt-4">
        <StaffNavItem Icon={Phone} label={isKo ? '학부모 상담 노트' : 'Parent call notes'} active={showReportCardModal} onClick={() => setShowReportCardModal(true)} />
      </div>
    </>
  );
}
