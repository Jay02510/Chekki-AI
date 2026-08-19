import React from 'react';
import { Warning, UserCheck, CheckCircle, MagnifyingGlass, DownloadSimple } from '@phosphor-icons/react';
import { StatTile } from './ui/StatTile';
import { downloadCSV } from '../utils/csvExport';

function exportRosterCSV(pendingRoster: any[], activeRoster: any[], className: string) {
  const header = ['Student Name', 'Parent Name', 'Parent Email', 'Status', 'Weekly Scan', 'Last Scan Date', 'Flagged', 'Flag Reason', 'Flag Date'];
  const rows = [
    ...pendingRoster.map((s) => [s.studentName || 'Unnamed', s.name || '', s.email || '', 'Pending', '', '', '', '', '']),
    ...activeRoster.map((s) => [
      s.studentName || 'Unnamed',
      s.name || '',
      s.email || '',
      'Active',
      s.hasScannedThisWeek ? 'Scanned' : 'Not Scanned',
      s.lastScanDate || '',
      s.flaggedException ? 'Yes' : 'No',
      s.flaggedException?.reason || '',
      s.flaggedException?.date || '',
    ]),
  ];

  downloadCSV(header, rows, `${className || 'roster'}-roster`);
}

interface Props {
  isNight: boolean;
  isKo: boolean;
  pendingRoster: any[];
  activeRoster: any[];
  isLoadingRoster: boolean;
  classes: any[];
  selectedClass: any;
  handleApproveStudent: (uid: string) => void;
  handleDeclineStudent: (uid: string) => void;
  handleRemoveStudent: (uid: string) => void;
  handleMoveStudent: (uid: string, targetClassId: string) => void;
  fetchRosterAndMistakes: () => void;
  setSelectedStudentDetails: (student: any) => void;
}

/**
 * Director's "Student Roster" tab, carved out of TeacherPage.tsx
 * (audit §6/§10/§17f) — second step of the incremental split, following the
 * same pattern as NativeFtDashboard: pure relocation of JSX behind a props
 * interface, no behavior change.
 *
 * Note: NativeDirectorPortal.tsx already has its own internal "roster" and
 * "exceptions" tabs, but those are backed by local-only mock state
 * (`useState<StudentItem[]>([])`, never fetched from Firestore, never
 * populated except by a manual "Add Student" form) — a pre-existing,
 * separate gap from what's extracted here. This component is the *real*,
 * live-Firestore roster (pending approvals + active students with scan
 * status), reached via TeacherPage's own "Student Roster" sidebar tab, not
 * through NativeDirectorPortal. Reconciling the two roster surfaces is a
 * follow-up, not attempted in this pass.
 */
export const NativeDirectorStudentsTab: React.FC<Props> = ({
  isNight,
  isKo,
  pendingRoster,
  activeRoster,
  isLoadingRoster,
  classes,
  selectedClass,
  handleApproveStudent,
  handleDeclineStudent,
  handleRemoveStudent,
  handleMoveStudent,
  fetchRosterAndMistakes,
  setSelectedStudentDetails,
}) => {
  const isThemeNight = isNight;
  return (
    <div className="space-y-8 animate-fade-in">

      {/* --- SECTION 1: PENDING APPROVALS --- */}
      {pendingRoster.length > 0 && (
        <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
          isThemeNight ? 'bg-orange-500/10 border border-orange-500/30 shadow-2xl' : 'bg-orange-50/60 border border-orange-200 shadow-md'
        }`}>
          <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
            isThemeNight ? 'bg-brand-dark' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-500 flex items-center justify-center">
                <Warning size={22} weight="bold" />
              </div>
              <div>
                <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '가입 승인 대기 목록' : 'Pending Classroom Approvals'}
                </h4>
                <p className="text-xs text-orange-500 font-medium leading-normal">
                  {isKo
                    ? '이 학급반에 가입을 요청한 학부모 목록입니다. 승인 후 대시보드에 합산됩니다.'
                    : 'Parents requesting to enroll their children. Approve to add them to class analytics.'}
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                    <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                    <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                    <th className="pb-4 text-right pr-2">{isKo ? '승인 여부' : 'Approval Actions'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isThemeNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                  {pendingRoster.map((student) => (
                    <tr key={student.uid} className={`transition-colors ${isThemeNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                      <td className={`py-4 pl-2 font-black text-sm ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                        {student.studentName || 'Unnamed'}
                      </td>
                      <td className="py-4">
                        <p className={`font-bold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>{student.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                      </td>
                      <td className="py-4 text-right pr-2 space-x-3">
                        <button
                          onClick={() => handleDeclineStudent(student.uid)}
                          className={`px-4 py-2 border font-bold rounded-xl transition-all text-xs active:scale-[0.97] cursor-pointer ${
                            isThemeNight ? 'border-white/10 hover:border-white/20 bg-brand-dark text-zinc-400 hover:text-zinc-200' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          ✕ {isKo ? '거절' : 'Decline'}
                        </button>
                        <button
                          onClick={() => handleApproveStudent(student.uid)}
                          className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all text-xs active:scale-[0.97] cursor-pointer"
                        >
                          ✓ {isKo ? '승인' : 'Approve'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* --- SECTION 2: ACTIVE ROSTER --- */}
      <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
        isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
      }`}>
        <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
          isThemeNight ? 'bg-brand-dark text-white' : 'bg-white text-zinc-900'
        }`}>
          <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                <UserCheck size={22} weight="bold" />
              </div>
              <div>
                <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '소속 원생 명단' : 'Approved Student Roster'}
                </h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  {isKo
                    ? '현재 승인 완료되어 활동 중인 학생 명단입니다.'
                    : 'Active classroom student roster logs and transfer operations.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportRosterCSV(pendingRoster, activeRoster, selectedClass?.name)}
                disabled={pendingRoster.length === 0 && activeRoster.length === 0}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${
                  isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                }`}
                title="Export roster as CSV"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>{isKo ? 'CSV 내보내기' : 'Export CSV'}</span>
              </button>
              <button
                type="button"
                onClick={fetchRosterAndMistakes}
                className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
                  isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                }`}
                title="Refresh parent scans & roster"
              >
                <span>🔄</span>
                <span>{isKo ? '동기화 새로고침' : 'Refresh Live Sync'}</span>
              </button>
            </div>
          </div>

          {!isLoadingRoster && activeRoster.length > 0 && (
            <div className="mb-6 max-w-xs">
              <StatTile
                isNight={isThemeNight}
                label={isKo ? '이번 주 스캔 완료' : 'Scanned This Week'}
                icon={<CheckCircle size={14} weight="bold" className="text-orange-500" />}
                ring={{
                  value: Math.round(
                    (activeRoster.filter((s) => s.hasScannedThisWeek).length / activeRoster.length) * 100
                  ),
                }}
                value={
                  <>
                    {activeRoster.filter((s) => s.hasScannedThisWeek).length}
                    <span className="text-sm font-normal text-zinc-500"> / {activeRoster.length}</span>
                  </>
                }
              />
            </div>
          )}

          {isLoadingRoster ? (
            <div className="flex items-center justify-center min-h-[30vh]">
              <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
            </div>
          ) : activeRoster.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-xs leading-relaxed font-korean">
              {isKo
                ? '이 학급반에 등록된 학생이 없습니다. 가입 코드를 학부모에게 공유하거나 승인을 기다려 주세요.'
                : 'No active students enrolled in this class yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                    <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                    <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                    <th className="pb-4">{isKo ? '숙제 상태' : 'Weekly Status'}</th>
                    <th className="pb-4">{isKo ? '마지막 스캔일' : 'Last Active'}</th>
                    <th className="pb-4 text-right pr-2">{isKo ? '원생 관리' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isThemeNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                  {activeRoster.map((student) => (
                    <tr key={student.uid} className={`transition-colors ${isThemeNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                      <td className={`py-4 pl-2 font-black text-sm ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                        <span className="flex items-center gap-1.5">
                          {student.studentName || 'Unnamed'}
                          {student.flaggedException && (
                            <span title="Flagged">
                              <Warning size={14} weight="fill" className="text-amber-500" />
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-4">
                        <p className={`font-bold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>{student.name}</p>
                        <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                      </td>
                      <td className="py-4">
                        {student.hasScannedThisWeek ? (
                          <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 w-fit">
                            <CheckCircle size={14} weight="bold" />
                            <span>{isKo ? '스캔 완료' : 'Scanned'}</span>
                          </span>
                        ) : (
                          <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${
                            isThemeNight ? 'bg-zinc-900 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                          }`}>
                            <span>❌</span>
                            <span>{isKo ? '미스캔' : 'Not Scanned'}</span>
                          </span>
                        )}
                      </td>
                      <td className="py-4 font-mono text-zinc-500 text-[10px]">
                        {student.lastScanDate ? student.lastScanDate : '-'}
                      </td>
                      <td className="py-4 text-right pr-2 flex items-center justify-end gap-2">
                        <select
                          onChange={(e) => handleMoveStudent(student.uid, e.target.value)}
                          value=""
                          className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer outline-none focus:border-orange-500 appearance-none transition-colors ${
                            isThemeNight ? 'bg-brand-dark border border-white/10 text-zinc-400' : 'bg-zinc-100 border border-zinc-300 text-zinc-700'
                          }`}
                        >
                          <option value="">{isKo ? '반 이동' : 'Move Class'}</option>
                          {classes
                            .filter((c) => c.id !== selectedClass?.id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                        <button
                          onClick={() => handleRemoveStudent(student.uid)}
                          className="px-3.5 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all text-[10px] active:scale-[0.95] cursor-pointer"
                        >
                          {isKo ? '삭제' : 'Remove'}
                        </button>
                        <button
                          onClick={() => setSelectedStudentDetails(student)}
                          className={`px-4 py-2 border font-bold rounded-xl transition-all text-[10px] active:scale-[0.95] flex items-center gap-1.5 cursor-pointer ${
                            isThemeNight ? 'border-white/10 bg-brand-dark hover:bg-white/5 text-orange-400 hover:text-orange-300' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-orange-600'
                          }`}
                        >
                          <MagnifyingGlass size={12} weight="bold" />
                          <span>{isKo ? '오답 상세' : 'View Details'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
