import React from 'react';
import { NativeFtDashboard } from './NativeFtDashboard';
import { CurriculumEditorForm } from './CurriculumEditorForm';
import { ErrorBoundary } from '../../components/ErrorBoundary';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  user: any;
  activeClass: any;
  selectedTextbookName: string;
  ftDashboardRoster: { uid: string; name: string; isPending?: boolean }[];
  handleLogSubmit: (payload: any) => void;
  isSubmittingLog: boolean;
  completionRate: number;
  completedHomeworkCount: number;
  activeStudentsCount: number;
  activeVocabWords: string[];
  sortedTroubleWords: { word: string; count: number }[];
  curriculumTopic: string;
  submittedLogs: any[];

  // homework (CurriculumEditorForm)
  uploadMode: 'syllabus' | 'worksheet';
  classes: any[];
  selectedClass: any;
  setSelectedClass: (c: any) => void;
  curriculumEditor: any;
}

// FT's tab content (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — NativeFtDashboard handles overview/insights/homework/history
// internally via its own activeTab prop; CurriculumEditorForm (the actual
// worksheet-scan/syllabus upload widget, shared with KT) renders alongside
// it on the syllabus/homework tabs, same as the original combined
// switchboard did.
export function FtTabContent(props: Props) {
  const { isNight, isKo, activeTab } = props;

  return (
    <>
      <ErrorBoundary>
        <NativeFtDashboard
          isNight={isNight}
          isKo={isKo}
          activeTab={activeTab}
          user={props.user}
          activeClass={props.activeClass}
          selectedTextbookName={props.selectedTextbookName}
          roster={props.ftDashboardRoster}
          handleFtLogSubmit={props.handleLogSubmit}
          isSubmittingFtLog={props.isSubmittingLog}
          completionRate={props.completionRate}
          completedHomeworkCount={props.completedHomeworkCount}
          activeStudentsCount={props.activeStudentsCount}
          activeVocabWords={props.activeVocabWords}
          sortedTroubleWords={props.sortedTroubleWords}
          setActiveTab={props.setActiveTab}
          curriculumTopic={props.curriculumTopic}
          submittedLogs={props.submittedLogs}
        />
      </ErrorBoundary>

      {(activeTab === 'syllabus' || activeTab === 'homework') && (
        <CurriculumEditorForm
          isNight={isNight}
          isKo={isKo}
          activeTab={activeTab}
          uploadMode={props.uploadMode}
          user={props.user}
          classes={props.classes}
          selectedClass={props.selectedClass}
          setSelectedClass={props.setSelectedClass}
          {...props.curriculumEditor}
        />
      )}
    </>
  );
}
