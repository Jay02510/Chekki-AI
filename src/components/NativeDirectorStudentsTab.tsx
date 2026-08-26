import React, { useState } from 'react';
import { Warning } from '@phosphor-icons/react';

interface Props {
  isNight: boolean;
  isKo: boolean;
  pendingRoster: any[];
  handleApproveStudent: (uid: string) => void;
  handleDeclineStudent: (uid: string) => void;
}

/**
 * Director's "Pending Classroom Approvals" — parents who requested to join
 * a class and are awaiting a director decision. Used to also render the full
 * approved-roster table here too, but that duplicated StudentDatabaseGrid
 * (same data, same Move/Remove/Details actions, two Export CSV buttons on
 * one tab) — StudentDatabaseGrid now owns that view (merged in
 * invitedOnlyRosterRows/Refresh/Scanned-This-Week that used to live here).
 * This component is left scoped to the one workflow the grid doesn't do:
 * approve/decline.
 */
export const NativeDirectorStudentsTab: React.FC<Props> = ({
  isNight,
  isKo,
  pendingRoster,
  handleApproveStudent,
  handleDeclineStudent,
}) => {
  const isThemeNight = isNight;
  // Not guarded against a double-click firing the async Firestore write
  // twice — the writes themselves are idempotent, but logActivity() isn't,
  // so a double-click leaves two duplicate entries in the audit trail.
  const [isRosterActionBusy, setIsRosterActionBusy] = useState(false);
  const runRosterAction = async (action: () => void) => {
    if (isRosterActionBusy) return;
    setIsRosterActionBusy(true);
    try {
      await action();
    } finally {
      setIsRosterActionBusy(false);
    }
  };

  if (pendingRoster.length === 0) return null;

  return (
    <div className={`p-1 rounded-[2.5rem] text-left transition-colors animate-fade-in ${
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
                    <p className="text-[10px] text-zinc-400 font-mono">{student.email}</p>
                  </td>
                  <td className="py-4 text-right pr-2 space-x-3">
                    <button
                      onClick={() => runRosterAction(() => handleDeclineStudent(student.uid))}
                      disabled={isRosterActionBusy}
                      className={`px-4 py-2 border font-bold rounded-xl transition-all text-xs active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                        isThemeNight ? 'border-white/10 hover:border-white/20 bg-brand-dark text-zinc-400 hover:text-zinc-200' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-100 text-zinc-700'
                      }`}
                    >
                      ✕ {isKo ? '거절' : 'Decline'}
                    </button>
                    <button
                      onClick={() => runRosterAction(() => handleApproveStudent(student.uid))}
                      disabled={isRosterActionBusy}
                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all text-xs active:scale-[0.97] cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
  );
};
