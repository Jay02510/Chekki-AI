import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, Timestamp } from 'firebase/firestore';
import { ClockCounterClockwise } from '@phosphor-icons/react';
import { dbInstance } from '../../services/database';

interface ActivityEntry {
  id: string;
  type: string;
  targetLabel: string;
  actorName: string;
  createdAt?: Timestamp;
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
}

const LABELS: Record<string, { en: string; ko: string }> = {
  student_approved: { en: 'approved', ko: '승인함' },
  student_declined: { en: 'declined', ko: '거절함' },
  student_removed: { en: 'removed', ko: '삭제함' },
  student_moved: { en: 'moved', ko: '이동시킴' },
};

/**
 * Director HQ Overview's answer to "what happened in my school recently" —
 * previously nothing anywhere showed this; roster approve/decline/remove/
 * move left zero trace of who or when. Reads activityLog (written by
 * TeacherPage.tsx's logActivity helper) scoped to this school. Only covers
 * roster actions for now, not every action type in the app (class create/
 * delete, teacher invite/assign, etc. aren't wired into this log yet).
 */
export const ActivityFeed: React.FC<Props> = ({ isNight = true, isKo = false, schoolId }) => {
  const [entries, setEntries] = useState<ActivityEntry[]>([]);

  useEffect(() => {
    if (!schoolId) return;
    // No orderBy — schoolId(==) + createdAt(orderBy) needs a composite index
    // that doesn't exist; sorted client-side instead (same fix as the
    // pendingStudents listener in StudentInvitePanel). No limit() either:
    // without orderBy, Firestore's result order is unspecified, so limiting
    // before the client-side sort could silently drop the actual most-recent
    // entries once a school has more than the cap.
    const q = query(collection(dbInstance, 'activityLog'), where('schoolId', '==', schoolId));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })) as ActivityEntry[];
        rows.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setEntries(rows.slice(0, 15));
      },
      (err) => console.warn('Failed to load activity feed:', err)
    );
    return () => unsub();
  }, [schoolId]);

  if (entries.length === 0) return null;

  return (
    <div className={`p-6 rounded-2xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
      <div className="flex items-center gap-2">
        <ClockCounterClockwise size={16} weight="bold" className="text-zinc-400" />
        <span className="text-[10px] font-bold text-zinc-400 uppercase font-mono tracking-wider">
          {isKo ? '최근 활동' : 'Recent Activity'}
        </span>
      </div>
      <ul className="text-xs space-y-1.5">
        {entries.map((entry) => (
          <li key={entry.id} className={`flex items-center justify-between gap-3 p-2 rounded ${isNight ? 'bg-white/5' : 'bg-white border border-zinc-200'}`}>
            <span className={isNight ? 'text-zinc-300' : 'text-zinc-700'}>
              <span className="font-bold">{entry.actorName}</span>{' '}
              {isKo ? (LABELS[entry.type]?.ko || entry.type) : (LABELS[entry.type]?.en || entry.type)}{' '}
              <span className="font-mono">{entry.targetLabel}</span>
            </span>
            {entry.createdAt && (
              <span className="text-[10px] text-zinc-500 shrink-0">
                {entry.createdAt.toDate().toLocaleString(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
