import React from 'react';
import { KtInbox } from './KtInbox';
import { NativeTeacherLogForm } from './NativeTeacherLogForm';
import { CurriculumEditorForm } from './CurriculumEditorForm';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import type { TabId } from '../../hooks/useTeacherTabs';
import type { ApprovedNote, PendingClassLog } from '../../hooks/useKtReviewQueue';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // kt_script
  ktLogsLoadError: boolean;
  ktPendingLogs: PendingClassLog[];
  confirmDiscardKtDraft: () => boolean;
  setKtDraftDirty: (dirty: boolean) => void;
  approveClassLog: (log: PendingClassLog, summary: string, notes: ApprovedNote[]) => Promise<boolean>;
  academyName: string;
  user: any;
  activeClass: any;

  // kt_log
  handleLogSubmit: (payload: any) => void;
  isSubmittingLog: boolean;
  selectedTextbookName: string | undefined;
  ftDashboardRoster: { uid: string; name: string; isPending?: boolean }[];

  // homework (CurriculumEditorForm)
  uploadMode: 'syllabus' | 'worksheet';
  classes: any[];
  selectedClass: any;
  setSelectedClass: (c: any) => void;
  curriculumEditor: any;

  // students
  pendingRoster: any[];
  activeRoster: any[];
  invitedOnlyRosterRows?: any[];
  isLoadingRoster: boolean;
  handleApproveStudent: (uid: string) => void;
  handleDeclineStudent: (uid: string) => void;
  fetchRosterAndMistakes: () => void;
  setSelectedStudentDetails: (student: any) => void;
}

// KT's tab content — kt_script (class-day review inbox), overview (class
// roster, read-only apart from join requests), kt_log (daily log form),
// homework (answer key upload, shared with FT).
export function KtTabContent(props: Props) {
  const { isNight, isKo, activeTab } = props;

  return (
    <>
      {activeTab === 'kt_script' && (
        <KtInbox
          isNight={isNight}
          isKo={isKo}
          logs={props.ktPendingLogs}
          loadError={props.ktLogsLoadError}
          academyName={props.academyName}
          user={props.user}
          approve={props.approveClassLog}
          setDirty={props.setKtDraftDirty}
          confirmDiscard={props.confirmDiscardKtDraft}
        />
      )}

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-fade-in">
          <NativeDirectorStudentsTab
            isNight={isNight}
            isKo={isKo}
            pendingRoster={props.pendingRoster}
            handleApproveStudent={props.handleApproveStudent}
            handleDeclineStudent={props.handleDeclineStudent}
          />
          <StudentDatabaseGrid
            isNight={isNight}
            isKo={isKo}
            activeRoster={props.activeRoster}
            pendingRoster={props.pendingRoster}
            invitedOnlyRosterRows={props.invitedOnlyRosterRows}
            isLoadingRoster={props.isLoadingRoster}
            fetchRosterAndMistakes={props.fetchRosterAndMistakes}
            classes={props.classes}
            selectedClass={props.selectedClass}
            setSelectedStudentDetails={props.setSelectedStudentDetails}
          />
        </div>
      )}

      {activeTab === 'kt_log' && (
        <div className="animate-fade-in">
          <NativeTeacherLogForm
            isNight={isNight}
            isKo={isKo}
            onSubmitLog={props.handleLogSubmit}
            isSubmitting={props.isSubmittingLog}
            userProfile={props.user}
            selectedClassName={props.activeClass?.name}
            selectedTextbookName={props.selectedTextbookName}
            roster={props.ftDashboardRoster}
            isRealClassSynced={!props.activeClass?.isDemo}
          />
        </div>
      )}

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
