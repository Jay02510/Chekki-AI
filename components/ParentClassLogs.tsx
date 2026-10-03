import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import { ChalkboardTeacher } from '@phosphor-icons/react';

// classes/{classId}/parentReports/{logId}_{studentUid} — written when a KT
// approves a class log (hooks/useKtReviewQueue.ts). Holds the class summary
// plus only this child's own note, so a parent never reads other children's.
interface ParentReport {
  id: string;
  className?: string;
  date?: string;
  lessonTopic?: string;
  summary?: string;
  note?: string | null;
}

interface Props {
  classId: string;
  studentUid?: string | null;
  studentName?: string | null;
  language: string;
}

export const ParentClassLogs: React.FC<Props> = ({ classId, studentUid, studentName, language }) => {
  const [logs, setLogs] = useState<ParentReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
          limit(20)
        );
        const snap = await getDocs(reportsQuery);
        setLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ParentReport)));
      } catch (err) {
        console.error('Failed to load class reports for parent view:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [classId, studentUid]);

  if (isLoading) return null;
  if (logs.length === 0) return null;

  return (
    <div className="mb-6 p-1 rounded-[2rem] bg-black/[0.03] border border-zinc-200 dark:bg-white/5 dark:border-white/10 shadow-lg">
      <div className="rounded-[calc(2rem-0.25rem)] p-5 md:p-6 bg-white dark:bg-brand-dark">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ChalkboardTeacher size={20} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">
              {isKo ? '선생님 수업 리포트' : "Teacher's Class Reports"}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              {isKo ? '학원 선생님이 검수 후 보낸 최근 수업 기록입니다.' : "Recent updates, reviewed by your child's teacher."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {logs.map((log) => (
              <div key={log.id} className="p-4 rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-brand-dark">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-200 dark:border-white/5">
                  <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{log.className}</span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{log.date}</span>
                </div>
                {log.lessonTopic && (
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    <span className="text-zinc-500 dark:text-zinc-400">{isKo ? '수업 주제: ' : 'Topic: '}</span>
                    {log.lessonTopic}
                  </p>
                )}
                {log.summary && (
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed whitespace-pre-line">{log.summary}</p>
                )}
                {log.note && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      {studentName ? (isKo ? `${studentName} 관련 메모` : `Note about ${studentName}`) : (isKo ? '우리 아이 메모' : 'Note about your child')}
                    </span>
                    <p className="text-sm text-amber-900 dark:text-amber-100 mt-1 leading-relaxed whitespace-pre-line">{log.note}</p>
                  </div>
                )}
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};
