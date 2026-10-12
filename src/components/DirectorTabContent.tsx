import React from 'react';
import { CaretDown, WarningCircle } from '@phosphor-icons/react';
import { NativeDirectorPortal } from './NativeDirectorPortal';
import { NativeDirectorStudentsTab } from './NativeDirectorStudentsTab';
import { StudentInvitePanel } from './StudentInvitePanel';
import { StudentDatabaseGrid } from './StudentDatabaseGrid';
import { TeacherInvitePanel } from './TeacherInvitePanel';
import { TeacherRosterPanel } from './TeacherRosterPanel';
import { SchoolBillingPanel } from './SchoolBillingPanel';
import { useLogCompliance } from '../../hooks/useLogCompliance';
import { staffUi } from './staffUi';
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
  const { complianceRows } = useLogCompliance(
    activeTab === 'classes' ? props.classes : []
  );

  return (
    <>
      {activeTab === 'director_hq' && (
        <NativeDirectorPortal
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
            isKo={isKo}
            schoolId={props.schoolId}
            seatsTotal={props.seatsTotal}
            trialStatus={props.trialStatus}
            onRequestPlanChange={props.onRequestPlanChange}
          />
        ) : (
          <p className="rounded-lg bg-surface p-4 text-[14px] font-semibold text-ink-2 ring-1 ring-inset ring-rule">
            {isKo ? '학원 정보를 불러오는 중이에요. 잠시 후 결제 정보가 보여요.' : 'School profile still loading — billing info will be available once it finishes.'}
          </p>
        )
      )}

      {activeTab === 'students' && (
        <div className={`${staffUi.page} space-y-10`}>
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
              <div className="flex items-center gap-3 rounded-lg bg-line-soft p-4">
                <WarningCircle size={20} weight="fill" className="shrink-0 text-line-ink" aria-hidden="true" />
                <p className="text-[14px] font-bold text-ink">
                  {isKo
                    ? `${inactive.length}명의 학생이 ${INACTIVE_DAYS}일 이상 스캔하지 않았습니다.`
                    : `${inactive.length} student${inactive.length === 1 ? '' : 's'} ${inactive.length === 1 ? 'hasn\'t' : 'haven\'t'} scanned in ${INACTIVE_DAYS}+ days.`}
                </p>
              </div>
            );
          })()}
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
            isKo={isKo}
            pendingRoster={props.pendingRoster}
            handleApproveStudent={props.handleApproveStudent}
            handleDeclineStudent={props.handleDeclineStudent}
          />
          <StudentDatabaseGrid
            isKo={isKo}
            activeRoster={props.activeRoster}
            pendingRoster={props.pendingRoster}
            // Invited-but-not-joined students live in the invite panel above.
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
        <section className="mx-auto max-w-5xl text-left text-ink">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">{isKo ? '전체 학급' : 'All classes'}</h2>
              <p className="text-[14px] text-ink-3">{isKo ? '학급을 누르면 최근 14일 일지 제출 현황이 보여요.' : 'Open a class to see the last 14 days of logs.'}</p>
            </div>
            <button
              type="button"
              onClick={props.onNewClassClick}
              className="btn-press inline-flex min-h-11 cursor-pointer items-center rounded-md bg-line px-5 text-[15px] font-extrabold text-on-line"
            >
              {isKo ? '새 학급' : 'New class'}
            </button>
          </div>

          {props.classes.filter((c: any) => !c.isDemo).length === 0 ? (
            <p className="rounded-lg bg-surface p-10 text-center ring-1 ring-inset ring-rule text-[15px] text-ink-3">
              {isKo ? '아직 학급이 없습니다.' : 'No classes yet.'}
            </p>
          ) : (
            <ul className="divide-y divide-rule border-y border-rule">
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
                  const teacherCount = (c.assignedTeacherUids || []).length;
                  const studentCount =
                    props.activeRoster.filter((r: any) => r.classId === c.id).length +
                    props.pendingRoster.filter((r: any) => r.classId === c.id).length;
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        aria-expanded={isSelected}
                        onClick={() => props.onSelectClass(c.id)}
                        className="relative flex min-h-[64px] w-full cursor-pointer items-center justify-between gap-3 py-3 text-left"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-[16px] font-bold">{c.name}</p>
                          <p className="truncate text-[13px] text-ink-3">
                            {c.level || (isKo ? '일반' : 'General')} · {compliance?.teacherName || (isKo ? `교사 ${teacherCount}명` : `${teacherCount} ${teacherCount === 1 ? 'teacher' : 'teachers'}`)} · {isKo ? `원생 ${studentCount}명` : `${studentCount} ${studentCount === 1 ? 'student' : 'students'}`}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                          {compliance && (
                            compliance.missStreak > 0 ? (
                              <span className="rounded-md bg-wrong-soft px-2.5 py-1 text-[13px] font-bold text-wrong">
                                {isKo ? `${compliance.missStreak}일 미제출` : `${compliance.missStreak} days missed`}
                              </span>
                            ) : (
                              <span className="rounded-md bg-right-soft px-2.5 py-1 text-[13px] font-bold text-correct">
                                {isKo ? '제출 완료' : 'Up to date'}
                              </span>
                            )
                          )}
                          <CaretDown size={18} weight="bold" className={`text-ink-3 transition-transform duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${isSelected ? 'rotate-180' : ''}`} aria-hidden="true" />
                        </div>
                      </button>
                      {isSelected && (
                        <div className="space-y-4 pb-5">
                          {compliance && (
                            <div>
                              <p className="mb-1.5 text-[13px] font-bold text-ink-3">
                                {isKo ? '최근 14일 일지 제출' : 'Last 14 days, log submitted'}
                              </p>
                              <div className="inline-flex max-w-full flex-col">
                              <div className="flex gap-1 overflow-x-auto pb-1">
                                {compliance.days.map((d) => (
                                  <span
                                    key={d.date}
                                    title={d.date}
                                    aria-label={`${d.date}: ${d.submitted ? (isKo ? '제출' : 'submitted') : d.isToday ? (isKo ? '오늘' : 'today') : d.isDayOff ? (isKo ? '휴일' : 'day off') : (isKo ? '미제출' : 'missed')}`}
                                    className={`h-6 w-6 shrink-0 rounded ${
                                      d.submitted ? 'bg-correct' : d.isToday ? 'bg-sunken ring-1 ring-inset ring-ink-3' : d.isDayOff ? 'bg-sunken' : 'bg-wrong-soft'
                                    }`}
                                  />
                                ))}
                              </div>
                              <div className="flex justify-between text-[12px] text-ink-3">
                                <span>{isKo ? '14일 전' : '14 days ago'}</span>
                                <span>{isKo ? '오늘' : 'Today'}</span>
                              </div>
                              </div>
                            </div>
                          )}

                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[13px] text-ink-3">
                              {isKo
                                ? '배정 교사 관리는 "선생님 배정" 탭에서 할 수 있습니다.'
                                : 'Manage which teachers are assigned from the Teachers tab.'}
                            </p>
                            {/* Delete lives inside the expanded row (still behind
                                handleDeleteClass's confirm) rather than on
                                every collapsed row. */}
                            <button
                              type="button"
                              onClick={() => props.onDeleteClass(c.id)}
                              className="min-h-11 cursor-pointer px-1 text-[14px] font-bold text-wrong hover:underline"
                            >
                              {isKo ? '이 학급 삭제' : 'Delete this class'}
                            </button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      )}

      {activeTab === 'teacher_assignment' && (
        <div className={`${staffUi.page} space-y-10`}>
          {props.schoolId && props.classes.length === 0 ? (
            <p className="rounded-lg bg-line-soft p-4 text-[14px] font-semibold text-ink">
              {isKo ? '선생님을 초대하려면 먼저 학급을 하나 만들어 주세요. 초대할 때 학급을 배정해야 해요.' : 'Create at least one class before inviting teachers — invites need a class to assign the teacher to.'}
            </p>
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
            <p className="rounded-lg bg-surface p-4 text-[14px] font-semibold text-ink-2 ring-1 ring-inset ring-rule">
              {isKo ? '학원 정보를 불러오는 중이에요.' : 'School profile still loading — invites will be available once it finishes.'}
            </p>
          )}

          {props.schoolId ? (
            <TeacherRosterPanel
              isNight={isNight}
              isKo={isKo}
              schoolId={props.schoolId}
              classes={props.classes}
              onAssignmentChanged={props.onClassesChanged}
            />
          ) : (
            <p className="rounded-lg bg-surface p-4 text-[14px] font-semibold text-ink-2 ring-1 ring-inset ring-rule">
              {isKo ? '학원 정보를 불러오는 중이에요.' : 'School profile still loading — teacher assignment will be available once it finishes.'}
            </p>
          )}
        </div>
      )}

    </>
  );
}
