import { useEffect, useMemo, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { dbInstance } from '../services/database';

const WINDOW_DAYS = 14;

function isoDate(d: Date) {
  return d.toISOString().split('T')[0];
}

function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(isoDate(d));
  }
  return days;
}

export interface ComplianceRow {
  classId: string;
  className: string;
  teacherName: string;
  days: { date: string; submitted: boolean; isToday: boolean }[];
  missStreak: number;
}

// Cross-class rollup of "did the assigned teacher submit a log today" —
// classes/{classId}/logs is already queried per-class elsewhere
// (useKtReviewQueue's cross-class pending-review query, TeacherPage's
// per-selected-class history fetch) but nothing aggregates *missing* days
// across every class a director owns. Read-only: no new collection, no
// writes, just a windowed query + a submitted/missing map per class per day.
export function useLogCompliance(classes: any[]) {
  const [complianceRows, setComplianceRows] = useState<ComplianceRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const days = useMemo(() => lastNDays(WINDOW_DAYS), []);
  const realClasses = useMemo(() => classes.filter((c: any) => c?.id && !c.isDemo), [classes]);
  const classesKey = realClasses.map((c: any) => c.id).join('|');

  useEffect(() => {
    if (realClasses.length === 0) {
      setComplianceRows([]);
      return;
    }
    setIsLoading(true);
    const todayIso = isoDate(new Date());
    (async () => {
      try {
        const rows = await Promise.all(
          realClasses.map(async (c: any) => {
            const logsRef = collection(dbInstance, 'classes', c.id, 'logs');
            const logsQuery = query(logsRef, where('date', '>=', days[0]), orderBy('date', 'asc'));
            const snap = await getDocs(logsQuery);
            const submittedDates = new Set(snap.docs.map((d) => d.data().date));

            const dayResults = days.map((date) => ({
              date,
              submitted: submittedDates.has(date),
              isToday: date === todayIso,
            }));

            // Today isn't missed until the day is actually over — without
            // this, every class shows a false "missed" streak the moment a
            // director opens this tab each morning, before any teacher has
            // had a chance to log yet.
            let missStreak = 0;
            for (let i = dayResults.length - 1; i >= 0; i--) {
              const day = dayResults[i];
              if (day.isToday && !day.submitted) continue;
              if (day.submitted) break;
              missStreak++;
            }

            const teacherName = c.teacherName || c.assignedTeacherNames?.[0] || (c.teacherUid ? c.teacherUid.slice(0, 8) : '—');

            return {
              classId: c.id,
              className: c.name || 'Unnamed Class',
              teacherName,
              days: dayResults,
              missStreak,
            } as ComplianceRow;
          })
        );
        setComplianceRows(rows);
      } catch (err) {
        console.error('Failed to load log compliance data:', err);
        setComplianceRows([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [classesKey, days]);

  return { complianceRows, isLoading };
}
