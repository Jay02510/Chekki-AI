import React from 'react';
import { NativeDirectorPortal } from './NativeDirectorPortal';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentInvitePanel } from './StudentInvitePanel';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import { LogComplianceTracker } from './LogComplianceTracker';
import { useLogCompliance } from '../../hooks/useLogCompliance';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  academyName: string;
  academyLogo?: string;
  schoolId: string | undefined;
  planId: string | null | undefined;
  seatsTotal: { ft: number; kt: number };
  trialStatus: { onTrial: boolean; daysRemaining: number; expired: boolean } | null;
  onRequestSeatExpansion: (extraSeats: number) => Promise<boolean>;
  onRequestPlanChange: (planId: string, planName: string) => Promise<boolean>;
  pendingRoster: any[];
  activeRoster: any[];
  classes: any[];
  selectedClass: any;
  weeklyVocabWords: string[];
  weeklyPhonicsRules: string[];
  curriculumTopic: string;
  curriculumPassage: string;
  onResolveFlag: (uid: string) => void;
  isLoadingRoster: boolean;
  handleApproveStudent: (uid: string) => void;
  handleDeclineStudent: (uid: string) => void;
  handleRemoveStudent: (uid: string) => void;
  handleMoveStudent: (uid: string, targetClassId: string) => void;
  fetchRosterAndMistakes: () => void;
  setSelectedStudentDetails: (student: any) => void;
}

// Director's tab content (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — director_hq (NativeDirectorPortal) and students (roster). Only
// ever rendered when the caller has already confirmed the user is a
// director, so the inner student-invite-panel role check from the original
// combined switchboard is dropped (it always resolved true here anyway).
export function DirectorTabContent(props: Props) {
  const { isNight, isKo, activeTab } = props;
  const { complianceRows, isLoading: isLoadingCompliance } = useLogCompliance(props.classes);

  return (
    <>
      {activeTab === 'director_hq' && (
        <NativeDirectorPortal
          isNight={isNight}
          isKo={isKo}
          academyName={props.academyName}
          academyLogo={props.academyLogo}
          schoolId={props.schoolId}
          planId={props.planId}
          seatsTotal={props.seatsTotal}
          trialStatus={props.trialStatus}
          onRequestSeatExpansion={props.onRequestSeatExpansion}
          onRequestPlanChange={props.onRequestPlanChange}
          pendingRoster={props.pendingRoster}
          activeRoster={props.activeRoster}
          classes={props.classes}
          selectedClass={props.selectedClass}
          weeklyVocabWords={props.weeklyVocabWords}
          weeklyPhonicsRules={props.weeklyPhonicsRules}
          curriculumTopic={props.curriculumTopic}
          curriculumPassage={props.curriculumPassage}
          onResolveFlag={props.onResolveFlag}
        />
      )}

      {activeTab === 'students' && (
        <div className="space-y-8">
          {props.selectedClass && !props.selectedClass.isDemo && (
            <StudentInvitePanel isNight={isNight} isKo={isKo} classId={props.selectedClass.id} />
          )}
          <NativeDirectorStudentsTab
            isNight={isNight}
            isKo={isKo}
            pendingRoster={props.pendingRoster}
            activeRoster={props.activeRoster}
            isLoadingRoster={props.isLoadingRoster}
            classes={props.classes}
            selectedClass={props.selectedClass}
            handleApproveStudent={props.handleApproveStudent}
            handleDeclineStudent={props.handleDeclineStudent}
            handleRemoveStudent={props.handleRemoveStudent}
            handleMoveStudent={props.handleMoveStudent}
            fetchRosterAndMistakes={props.fetchRosterAndMistakes}
            setSelectedStudentDetails={props.setSelectedStudentDetails}
          />
        </div>
      )}

      {activeTab === 'student_database' && (
        <StudentDatabaseGrid
          isNight={isNight}
          isKo={isKo}
          activeRoster={props.activeRoster}
          pendingRoster={props.pendingRoster}
          classes={props.classes}
          handleMoveStudent={props.handleMoveStudent}
          handleRemoveStudent={props.handleRemoveStudent}
          setSelectedStudentDetails={props.setSelectedStudentDetails}
        />
      )}

      {activeTab === 'log_compliance' && (
        <LogComplianceTracker
          isNight={isNight}
          isKo={isKo}
          complianceRows={complianceRows}
          isLoading={isLoadingCompliance}
        />
      )}
    </>
  );
}
