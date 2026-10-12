import React, { useState } from 'react';
import { Check } from '@phosphor-icons/react';
import { staffUi } from './staffUi';

interface Props {
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
  isKo,
  pendingRoster,
  handleApproveStudent,
  handleDeclineStudent,
}) => {
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
    <section className="rounded-lg border border-rule bg-surface p-5 text-left text-ink">
      <h3 className={staffUi.h3}>{isKo ? '가입 승인 대기' : 'Waiting for approval'}</h3>
      <p className={`${staffUi.sub} mb-3`}>
        {isKo
          ? '이 학급에 가입을 요청한 학부모예요. 승인하면 학급 현황에 합산돼요.'
          : 'Parents asking to join this class. Approve to add them to class stats.'}
      </p>
      <ul className={staffUi.rows}>
        {pendingRoster.map((student) => (
          <li key={student.uid} className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[16px] font-bold">{student.studentName || (isKo ? '이름 없음' : 'Unnamed')}</p>
              <p className="truncate text-[13px] text-ink-3">{[student.name, student.email].filter(Boolean).join(' · ')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => runRosterAction(() => handleDeclineStudent(student.uid))}
                disabled={isRosterActionBusy}
                className={staffUi.quietBtn}
              >
                {isKo ? '거절' : 'Decline'}
              </button>
              <button
                type="button"
                onClick={() => runRosterAction(() => handleApproveStudent(student.uid))}
                disabled={isRosterActionBusy}
                className={staffUi.primaryBtn}
              >
                <Check size={18} weight="bold" aria-hidden="true" />
                {isKo ? '승인' : 'Approve'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
};
