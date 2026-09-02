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
  invitedOnlyRosterRows?: any[];
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
  onNewClassClick: () => void;
  onDeleteClass: (classId: string) => void;
  onSelectClass: (classId: string) => void;
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
  // Also fetched for 'classes': that tab used to just duplicate the header's
  // class switcher/New Class/Delete controls with nothing else to show for
  // itself (Audit: "All Classes" tab doesn't do or show anything useful) —
  // teacherName and missStreak already exist on ComplianceRow, so reusing
  // this hook here is what makes each class row worth a dedicated tab
  // instead of just a list of the same buttons already in the header.
  const { complianceRows, isLoading: isLoadingCompliance } = useLogCompliance(
    activeTab === 'log_compliance' || activeTab === 'classes' ? props.classes : []
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

      {activeTab === 'classes' && (
        <div className={`p-1 rounded-[2.5rem] ${isNight ? 'bg-white/5 border border-white/10' : 'bg-white border border-zinc-200 shadow-md'}`}>
          <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 ${isNight ? 'bg-brand-dark' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div>
                <h4 className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '전체 학급' : 'All Classes'}
                </h4>
                <p className="text-xs text-zinc-400">
                  {isKo ? '이 학원의 모든 학급입니다.' : 'Every class in this school.'}
                </p>
              </div>
              <button
                type="button"
                onClick={props.onNewClassClick}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black text-xs font-bold cursor-pointer transition-colors"
              >
                {isKo ? '+ 새 학급' : '+ New Class'}
              </button>
            </div>

            {props.classes.filter((c: any) => !c.isDemo).length === 0 ? (
              <p className="text-xs text-zinc-500 text-center py-6">
                {isKo ? '아직 학급이 없습니다.' : 'No classes yet.'}
              </p>
            ) : (
              <div className="space-y-2">
                {props.classes
                  .filter((c: any) => !c.isDemo)
                  .map((c: any) => {
                    const isSelected = props.selectedClass?.id === c.id;
                    const compliance = complianceRows.find((row) => row.classId === c.id);
                    // Clicking a row only ever set it as the "active class"
                    // for other tabs (log form, script, etc.) — nothing
                    // visibly changed on THIS screen, so it looked like the
                    // click did nothing (Audit: director clicks a class,
                    // sees no info about it). Student count is computed
                    // from roster data the parent already fetched — no new
                    // network call — so an expanded row costs nothing extra.
                    const studentCount =
                      props.activeRoster.filter((r: any) => r.classId === c.id).length +
                      props.pendingRoster.filter((r: any) => r.classId === c.id).length;
                    return (
                      <div
                        key={c.id}
                        className={`rounded-2xl border transition-colors ${
                          isSelected
                            ? (isNight ? 'bg-orange-500/10 border-orange-500/40' : 'bg-orange-50 border-orange-300')
                            : (isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100')
                        }`}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => props.onSelectClass(c.id)}
                          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); props.onSelectClass(c.id); } }}
                          className="flex items-center justify-between p-4 cursor-pointer"
                        >
                          <div>
                            <p className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                              {c.name}{isSelected ? ` · ${isKo ? '선택됨' : 'Selected'}` : ''}
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">
                              {c.level || 'General'} · {compliance?.teacherName || `${(c.assignedTeacherUids || []).length} ${isKo ? '명 배정' : 'teacher(s)'}`} · {studentCount} {isKo ? '명 원생' : 'student(s)'}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {compliance && (
                              compliance.missStreak > 0 ? (
                                <span className="px-2 py-1 rounded-lg bg-rose-500/10 text-rose-400 text-[10px] font-bold border border-rose-500/30">
                                  🔥 {compliance.missStreak}{isKo ? '일 미제출' : `-day miss streak`}
                                </span>
                              ) : (
                                <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
                                  ✓ {isKo ? '제출 완료' : 'Up to date'}
                                </span>
                              )
                            )}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); props.onDeleteClass(c.id); }}
                              className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30 cursor-pointer transition-colors shrink-0"
                            >
                              {isKo ? '삭제' : 'Delete'}
                            </button>
                          </div>
                        </div>
                        {isSelected && (
                          <div className={`px-4 pb-4 text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                            {isKo
                              ? '배정 교사 관리는 "교사 배정" 탭에서 할 수 있습니다.'
                              : 'Manage which teachers are assigned from the Teacher Assignment tab.'}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
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
              isKo={isKo}
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
