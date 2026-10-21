import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import { CaretDown, ChalkboardTeacher } from '@phosphor-icons/react';
import { Fold } from './metro';

// classes/{classId}/parentReports/{logId}_{studentUid} — written when a KT
// approves a class log (hooks/useKtReviewQueue.ts). Holds the class summary
// plus only this child's own note, so a parent never reads other children's.
interface ParentReport {
  id: string;
  className?: string;
  date?: string;
  lessonTopic?: string;
  summary?: string;
  summaryEn?: string;
  note?: string | null;
}

// Same "10월 16일 (금)" / "Fri, Oct 16" style as past scans. date is a
// YYYY-MM-DD string; build a local date so it never shifts a day.
const formatLogDate = (date: string, isKo: boolean) => {
  const [y, m, d] = date.split('-').map(Number);
  if (!y || !m || !d) return date;
  return new Intl.DateTimeFormat(isKo ? 'ko-KR' : 'en-US', { month: 'short', day: 'numeric', weekday: 'short' }).format(new Date(y, m - 1, d));
};

interface Props {
  classId: string;
  studentUid?: string | null;
  studentName?: string | null;
  language: string;
  /** Show only the newest N reports (the scan home shows 1). */
  max?: number;
}

export const ParentClassLogs: React.FC<Props> = ({ classId, studentUid, studentName, language, max = 20 }) => {
  const [logs, setLogs] = useState<ParentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // "New" until the newest report has been shown once on this device.
  // ponytail: per-device; a push notification is the real fix once push exists.
  const [isNew, setIsNew] = useState(false);
  const isKo = language === 'ko';

  useEffect(() => {
    if (!classId || !studentUid) return;
    (async () => {
      setIsLoading(true);
      try {
        const reportsQuery = query(
          collection(dbInstance, 'classes', classId, 'parentReports'),
          where('studentUid', '==', studentUid),
          orderBy('date', 'desc'),
          limit(max)
        );
        const snap = await getDocs(reportsQuery);
        const loaded = snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParentReport));
        setLogs(loaded);
        if (loaded[0]) {
          try {
            const key = `chekki_seen_report_${studentUid}`;
            setIsNew(localStorage.getItem(key) !== loaded[0].id);
            localStorage.setItem(key, loaded[0].id);
          } catch {
            /* storage blocked: no badge */
          }
        }
      } catch (err) {
        console.error('Failed to load class reports for parent view:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [classId, studentUid, max]);

  if (isLoading) return null;
  if (logs.length === 0) return null;

  return (
    <Fold
      defaultOpen
      icon={<ChalkboardTeacher size={20} weight="bold" />}
      title={isKo ? '선생님 수업 리포트' : "Teacher's class report"}
      sub={isKo ? '한국인 선생님이 확인하고 보낸 수업 기록이에요.' : "Checked and sent by your child's Korean teacher."}
      badge={isNew ? <span className="rounded-full bg-line px-2.5 py-0.5 text-[13px] font-bold text-[#2b211a]">{isKo ? '새 리포트' : 'New'}</span> : undefined}
    >
      <ol className="divide-y divide-rule">
        {logs.map((log, i) => (
          <li key={log.id}>
            <details open={i === 0} className="group/log">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">
                  <span className="block text-[15px] font-bold text-ink">{log.className}</span>
                  {log.lessonTopic && <span className="block truncate text-[13px] text-ink-3 group-open/log:whitespace-normal">{log.lessonTopic}</span>}
                </span>
                <span className="flex shrink-0 items-center gap-2">
                  <span className="num text-[13px] text-ink-3">{log.date && formatLogDate(log.date, isKo)}</span>
                  <CaretDown size={16} weight="bold" className="text-ink-3 transition-transform group-open/log:rotate-180" />
                </span>
              </summary>
              <div className="pb-4">
                {log.summary && (
                  <p className="whitespace-pre-line text-[15px] leading-relaxed text-ink break-keep">{!isKo && log.summaryEn ? log.summaryEn : log.summary}</p>
                )}
                {log.note && (
                  <div className="mt-3 rounded-md bg-line-soft px-4 py-3">
                    <p className="text-[13px] font-bold text-line-ink">
                      {studentName
                        ? isKo
                          ? `${studentName}에 대한 메모`
                          : `About ${studentName}`
                        : isKo
                          ? '우리 아이 메모'
                          : 'About your child'}
                    </p>
                    <p className="mt-1 whitespace-pre-line text-[15px] leading-relaxed text-ink break-keep">{log.note}</p>
                  </div>
                )}
              </div>
            </details>
          </li>
        ))}
      </ol>
    </Fold>
  );
};
