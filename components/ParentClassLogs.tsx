import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import { ChalkboardTeacher } from '@phosphor-icons/react';

interface ApprovedException {
  studentName: string;
  approvedText: string;
}

interface ClassLogEntry {
  id: string;
  className?: string;
  date?: string;
  lessonTopic?: string;
  reviewStatus?: 'pending_review' | 'sent';
  approvedSummary?: string;
  approvedExceptions?: ApprovedException[];
}

interface Props {
  classId: string;
  studentName?: string | null;
  language: string;
}

export const ParentClassLogs: React.FC<Props> = ({ classId, studentName, language }) => {
  const [logs, setLogs] = useState<ClassLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isKo = language === 'ko';

  useEffect(() => {
    if (!classId) return;
    (async () => {
      setIsLoading(true);
      try {
        const logsRef = collection(dbInstance, 'classes', classId, 'logs');
        // No `where('reviewStatus', ...)` here — combining it with orderBy on a
        // different field needs a composite index this project doesn't
        // provision. Pull the recent window and filter to KT-reviewed,
        // sent logs client-side instead — parents must only ever see the
        // KT-approved version, never the raw FT note underneath it.
        const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(logsQuery);
        const sent = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as ClassLogEntry))
          .filter((l) => l.reviewStatus === 'sent')
          .slice(0, 20);
        setLogs(sent);
      } catch (err) {
        console.error('Failed to load class logs for parent view:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [classId]);

  if (isLoading) return null;
  if (logs.length === 0) return null;

  return (
    <div className="mb-6 p-1 rounded-[2rem] bg-white/5 border border-white/10 shadow-lg">
      <div className="rounded-[calc(2rem-0.25rem)] p-5 md:p-6 bg-brand-dark">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
            <ChalkboardTeacher size={20} weight="bold" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white">
              {isKo ? '선생님 수업 리포트' : "Teacher's Class Reports"}
            </h3>
            <p className="text-xs text-zinc-400">
              {isKo ? '학원 선생님이 검수 후 보낸 최근 수업 기록입니다.' : "Recent updates, reviewed by your child's teacher."}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {logs.map((log) => {
            const myNote = studentName
              ? log.approvedExceptions?.find((ex) => ex.studentName === studentName)
              : undefined;
            return (
              <div key={log.id} className="p-4 rounded-2xl border border-white/10 bg-brand-dark">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
                  <span className="font-bold text-sm text-blue-400">{log.className}</span>
                  <span className="text-xs text-zinc-500 font-mono">{log.date}</span>
                </div>
                {log.lessonTopic && (
                  <p className="text-xs text-zinc-300">
                    <span className="text-zinc-500">{isKo ? '수업 주제: ' : 'Topic: '}</span>
                    {log.lessonTopic}
                  </p>
                )}
                {log.approvedSummary && (
                  <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{log.approvedSummary}</p>
                )}
                {myNote && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide">
                      {isKo ? `${studentName} 관련 메모` : `Note about ${studentName}`}
                    </span>
                    <p className="text-xs text-amber-100 mt-1 leading-relaxed">{myNote.approvedText}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
