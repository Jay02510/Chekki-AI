import React from 'react';
import { NativeDirectorPortal } from './NativeDirectorPortal';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentInvitePanel } from './StudentInvitePanel';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import { TeacherInvitePanel } from './TeacherInvitePanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
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
  onClassesChanged?: () => void;
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
  // Only query when the director is actually viewing this tab — this hook
  // fires one logs-subcollection query per class, and was previously called
  // unconditionally on every DirectorTabContent render (director_hq,
  // students — any tab), reading Firestore for a view the director might
  // never open (audit: unnecessary reads on every portal visit).
  const { complianceRows, isLoading: isLoadingCompliance } = useLogCompliance(
    activeTab === 'log_compliance' ? props.classes : []
  );

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
          onClassesChanged={props.onClassesChanged}
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
            <StudentInvitePanel
              isNight={isNight}
              isKo={isKo}
              classId={props.selectedClass.id}
              classes={props.classes
                .filter((c: any) => !c.isDemo)
                .map((c: any) => ({ id: c.id, name: c.name }))}
            />
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
        </div>
      )}

      {activeTab === 'teacher_assignment' && (
        <div className="space-y-6">
          {props.schoolId && props.classes.length === 0 ? (
            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 font-bold">
              Create at least one class before inviting teachers — invites need a class to assign the teacher to.
            </div>
          ) : props.schoolId ? (
            <TeacherInvitePanel
              isNight={isNight}
              isKo={false}
              schoolId={props.schoolId}
              seatsTotal={props.seatsTotal || { ft: 0, kt: 0 }}
              classes={props.classes
                .filter((c: any) => !c.isDemo)
                .map((c: any) => ({ id: c.id, name: c.name }))}
            />
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
              School profile still loading — invites will be available once it finishes.
            </div>
          )}

          {props.schoolId ? (
            <TeacherRosterPanel
              isNight={isNight}
              schoolId={props.schoolId}
              classes={props.classes}
              onAssignmentChanged={props.onClassesChanged}
            />
          ) : (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
              School profile still loading — teacher assignment will be available once it finishes.
            </div>
          )}
        </div>
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
