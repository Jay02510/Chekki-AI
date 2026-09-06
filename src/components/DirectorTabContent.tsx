import React, { useState } from 'react';
import { NativeDirectorPortal } from './NativeDirectorPortal';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentInvitePanel } from './StudentInvitePanel';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import { TeacherInvitePanel } from './TeacherInvitePanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { SchoolBillingPanel } from './SchoolBillingPanel';
import { useLogCompliance } from '../../hooks/useLogCompliance';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
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
  // Invite/roster management is an occasional admin action, not part of
  // scanning the day's student list — a modal instead of an always-rendered
  // panel keeps this off the page by default, so the same students don't
  // show up in two tables at once (Audit: students tab always showed every
  // student twice — once in the invite panel, once in StudentDatabaseGrid).
  const [showInvitePanel, setShowInvitePanel] = useState(false);
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
  const { complianceRows } = useLogCompliance(
    activeTab === 'classes' ? props.classes : []
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
          onNavigateToBilling={() => props.setActiveTab('billing')}
        />
      )}

      {activeTab === 'billing' && (
        props.schoolId ? (
          <SchoolBillingPanel
            isNight={isNight}
            isKo={isKo}
            schoolId={props.schoolId}
            seatsTotal={props.seatsTotal}
            trialStatus={props.trialStatus}
            onRequestPlanChange={props.onRequestPlanChange}
          />
        ) : (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 font-bold">
            School profile still loading — billing info will be available once it finishes.
          </div>
        )
      )}

      {activeTab === 'students' && (
        <div className="space-y-8">
          {(() => {
            // lastScanDate already exists on every activeRoster row (feeds
            // StudentDatabaseGrid's "Last Active" column below) — nobody
            // aggregated it into a single "who's gone quiet" signal, so a
            // director had to eyeball every row's timestamp themselves to
            // spot a cooling-off parent (Audit: no inactive-student flag).
            const INACTIVE_DAYS = 7;
            const cutoff = Date.now() - INACTIVE_DAYS * 24 * 60 * 60 * 1000;
            const inactive = props.activeRoster.filter((s: any) => {
              const t = s.lastScanDate ? new Date(s.lastScanDate).getTime() : NaN;
              return !Number.isFinite(t) || t < cutoff;
            });
            if (inactive.length === 0) return null;
            return (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                <span className="text-lg">⚠️</span>
                <p className="text-xs font-bold text-amber-400">
                  {isKo
                    ? `${inactive.length}명의 학생이 ${INACTIVE_DAYS}일 이상 스캔하지 않았습니다.`
                    : `${inactive.length} student${inactive.length === 1 ? '' : 's'} ${inactive.length === 1 ? 'hasn\'t' : 'haven\'t'} scanned in ${INACTIVE_DAYS}+ days.`}
                </p>
              </div>
            );
          })()}
          {props.selectedClass && !props.selectedClass.isDemo && showInvitePanel && (
            <StudentInvitePanel
              isNight={isNight}
              isKo={isKo}
              classId={props.selectedClass.id}
              classes={props.classes
                .filter((c: any) => !c.isDemo)
                .map((c: any) => ({ id: c.id, name: c.name }))}
              onClose={() => setShowInvitePanel(false)}
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
            onOpenInvitePanel={() => setShowInvitePanel(true)}
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
                          <div className={`mx-4 mb-4 p-4 rounded-xl border space-y-3 ${isNight ? 'bg-black/20 border-white/10' : 'bg-white border-zinc-200'}`}>
                            <div className="grid grid-cols-3 gap-3">
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{isKo ? '담임 교사' : 'Teacher'}</p>
                                <p className={`text-xs font-bold mt-0.5 ${isNight ? 'text-white' : 'text-zinc-900'}`}>{compliance?.teacherName || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{isKo ? '배정 교사 수' : 'Teachers Assigned'}</p>
                                <p className={`text-xs font-bold mt-0.5 ${isNight ? 'text-white' : 'text-zinc-900'}`}>{(c.assignedTeacherUids || []).length}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">{isKo ? '원생 수' : 'Students'}</p>
                                <p className={`text-xs font-bold mt-0.5 ${isNight ? 'text-white' : 'text-zinc-900'}`}>{studentCount}</p>
                              </div>
                            </div>

                            {compliance && (
                              <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-1.5">
                                  {isKo ? '최근 14일 일지 제출' : 'Last 14 days, log submitted'}
                                </p>
                                <div className="flex gap-1 overflow-x-auto pb-1">
                                  {compliance.days.map((d) => (
                                    <div
                                      key={d.date}
                                      title={d.date}
                                      className={`w-5 h-5 rounded flex items-center justify-center text-[9px] shrink-0 ${
                                        d.submitted
                                          ? 'bg-emerald-500/20 text-emerald-400'
                                          : d.isToday
                                            ? (isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-500')
                                            : 'bg-rose-500/20 text-rose-400'
                                      }`}
                                    >
                                      {d.submitted ? '✓' : d.isToday ? '·' : '✕'}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <p className={`text-[11px] ${isNight ? 'text-zinc-500' : 'text-zinc-500'}`}>
                              {isKo
                                ? '배정 교사 관리는 "교사 배정" 탭에서 할 수 있습니다.'
                                : 'Manage which teachers are assigned from the Teacher Assignment tab.'}
                            </p>
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

    </>
  );
}
