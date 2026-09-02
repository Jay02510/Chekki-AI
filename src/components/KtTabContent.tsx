import React, { useState } from 'react';
import { KtReviewQueue } from './KtReviewQueue';
import { NativeKtDashboard } from './NativeKtDashboard';
import { FtStatCards } from './NativeFtDashboard';
import { NativeTeacherLogForm } from './NativeTeacherLogForm';
import { CurriculumEditorForm } from './CurriculumEditorForm';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import { StudentInvitePanel } from './StudentInvitePanel';
import type { TabId } from '../../hooks/useTeacherTabs';
import type { ConsolidatedStudentDay } from '../services/consolidateStudentReports';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;

  // kt_script
  ktLogsLoadError: boolean;
  ktPendingLogs: any[];
  ktQueueLogs: any[];
  activeKtGroup: ConsolidatedStudentDay | null;
  justCopiedLogId: string | null;
  activeKtLogId: string | null;
  confirmDiscardKtDraft: () => boolean;
  setKtDraftDirty: (dirty: boolean) => void;
  setActiveKtLogId: (id: string | null) => void;
  groupKey: (g: ConsolidatedStudentDay) => string;
  formatConsolidatedDraft: (g: ConsolidatedStudentDay, isKo: boolean) => string;
  getConsolidatedDraft: (g: ConsolidatedStudentDay) => string;
  isMergingDraft: boolean;
  activeClass: any;
  academyName: string;
  user: any;
  ktConsolidatedGroups: ConsolidatedStudentDay[];
  handleKtApprove: (approvedSummary: string, approvedExceptions: { studentName: string; approvedText: string }[]) => Promise<boolean>;
  handleKtBulkApprove: (ids: string[]) => Promise<{ approved: number; skipped: number }>;

  // overview (KT)
  completionRate: number;
  completedHomeworkCount: number;
  activeStudentsCount: number;

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
  handleUpdateWeek: (weekNumber: number) => void;
  curriculumEditor: any;

  // students
  pendingRoster: any[];
  activeRoster: any[];
  invitedOnlyRosterRows?: any[];
  isLoadingRoster: boolean;
  handleApproveStudent: (uid: string) => void;
  handleDeclineStudent: (uid: string) => void;
  handleRemoveStudent: (uid: string) => void;
  handleMoveStudent: (uid: string, targetClassId: string) => void;
  fetchRosterAndMistakes: () => void;
  setSelectedStudentDetails: (student: any) => void;
}

// KT's tab content (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — kt_script (review queue + KakaoTalk script), overview (stat
// summary), kt_log (daily log form), homework (worksheet scanner, shared
// component with FT), students (shared component with director).
export function KtTabContent(props: Props) {
  const { isNight, isKo, activeTab } = props;
  // Roster invite/upload is an occasional admin action, not part of a KT's
  // routine "did today's reports get done" check — collapsed behind a
  // toggle so it doesn't render its own student table by default, stacked
  // right above StudentDatabaseGrid's table of the same students (Audit:
  // KT overview showed every student twice, in two different tables with
  // two different status vocabularies).
  const [showInvitePanel, setShowInvitePanel] = useState(false);

  return (
    <>
      {activeTab === 'kt_script' && props.ktLogsLoadError && (
        <div className="mb-4 p-3.5 rounded-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/30 text-red-400">
          <span className="text-sm">
            {isKo
              ? '⚠️ 리포트 대기열을 불러오지 못했습니다. 아래는 실제 데이터가 아닙니다 — 새로고침 후 다시 시도해주세요.'
              : "⚠️ Couldn't load the review queue — what's shown below is not real data. Please refresh and try again."}
          </span>
        </div>
      )}
      {activeTab === 'kt_script' && props.ktPendingLogs.length > 0 && (
        <div className="mb-4 max-w-4xl mx-auto w-full">
          <KtReviewQueue
            logs={props.ktQueueLogs}
            activeId={props.activeKtGroup ? props.groupKey(props.activeKtGroup) : null}
            justCopiedId={props.justCopiedLogId}
            onBulkApprove={props.handleKtBulkApprove}
            onSelect={(id) => {
              if (id === props.activeKtLogId) return;
              if (!props.confirmDiscardKtDraft()) return;
              props.setKtDraftDirty(false);
              props.setActiveKtLogId(id);
            }}
            isNight={isNight}
            isKo={isKo}
            // Opens the review panel inline under the selected row (accordion)
            // instead of the caller having to scroll down to a fixed panel —
            // reuses the same activeKtGroup data the standalone panel used.
            renderActiveDetail={() => (
              <NativeKtDashboard
                key={props.activeKtGroup ? props.groupKey(props.activeKtGroup) : 'empty'}
                isNight={isNight}
                isKo={isKo}
                className={props.activeKtGroup ? props.activeKtGroup.studentName : (props.activeClass?.name || '7세반 (샘플)')}
                academyName={props.academyName}
                userProfile={props.user}
                generatedOutput={
                  props.activeKtGroup
                    ? {
                        bilingualClassSummary: {
                          // Consolidated draft: shared intro + every source
                          // paragraph (general + exception) stacked below it,
                          // already separated by blank lines — see
                          // formatConsolidatedDraft. Exceptions are baked in
                          // here rather than left to the exceptions-append
                          // step below, so skipInlineExceptions avoids
                          // duplicating them.
                          korean: props.getConsolidatedDraft(props.activeKtGroup),
                          english: '',
                        },
                        studentReports: [],
                      }
                    : null
                }
                skipInlineExceptions={!!props.activeKtGroup}
                isMergingDraft={props.isMergingDraft}
                pendingCount={Math.max(0, props.ktConsolidatedGroups.length - 1)}
                onApprove={props.handleKtApprove}
                onDirtyChange={props.setKtDraftDirty}
              />
            )}
          />
        </div>
      )}
      {activeTab === 'kt_script' && props.ktPendingLogs.length === 0 && (
        <NativeKtDashboard
          key="empty"
          isNight={isNight}
          isKo={isKo}
          className={props.activeClass?.name || '7세반 (샘플)'}
          academyName={props.academyName}
          userProfile={props.user}
          generatedOutput={null}
          skipInlineExceptions={false}
          isMergingDraft={props.isMergingDraft}
          pendingCount={0}
          onApprove={props.handleKtApprove}
          onDirtyChange={props.setKtDraftDirty}
        />
      )}

      {activeTab === 'overview' && (
        // KT Overview: stat summary + the full student roster in one place
        // (previously a separate "Student Roster" tab — collapsed together
        // since a KT checking class status almost always wants both at
        // once, and switching tabs just to see names was pure friction).
        <div className="space-y-6 animate-fade-in">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {isKo ? '선택된 반:' : 'Active class:'} <span className="font-mono font-bold">{props.activeClass?.name || '—'}</span>
            </p>
            <button
              type="button"
              onClick={() => props.setActiveTab('kt_script')}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              {isKo ? '알림톡 작성하기 →' : 'Go to Script →'}
            </button>
          </div>
          <FtStatCards
            isNight={isNight}
            isKo={isKo}
            completionRate={props.completionRate}
            completedHomeworkCount={props.completedHomeworkCount}
            activeStudentsCount={props.activeStudentsCount}
          />

          {props.selectedClass && !props.selectedClass.isDemo && (
            showInvitePanel ? (
              <StudentInvitePanel isNight={isNight} isKo={isKo} classId={props.selectedClass.id} />
            ) : (
              <button
                type="button"
                onClick={() => setShowInvitePanel(true)}
                className={`w-full py-3 rounded-2xl border border-dashed text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer ${
                  isNight ? 'border-white/15 text-zinc-400 hover:text-white hover:border-white/30' : 'border-zinc-300 text-zinc-500 hover:text-zinc-900 hover:border-zinc-400'
                }`}
              >
                {isKo ? '+ 학생 초대 / 명단 관리' : '+ Invite Students / Manage Roster'}
              </button>
            )
          )}
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
            handleMoveStudent={props.handleMoveStudent}
            handleRemoveStudent={props.handleRemoveStudent}
            setSelectedStudentDetails={props.setSelectedStudentDetails}
          />
        </div>
      )}

      {activeTab === 'kt_log' && (
        <div className="animate-fade-in">
          <NativeTeacherLogForm
            isNight={isNight}
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
          handleUpdateWeek={props.handleUpdateWeek}
          {...props.curriculumEditor}
        />
      )}

    </>
  );
}
