import React, { useMemo, useState } from 'react';
import { CheckCircle, MagnifyingGlass } from '@phosphor-icons/react';

export interface KtQueueLog {
  id: string;
  studentName: string;
  className?: string;
  date?: string;
  flaggedCount: number;
}

interface Props {
  logs: KtQueueLog[];
  activeId: string | null;
  justCopiedId: string | null;
  onSelect: (id: string) => void;
  isNight?: boolean;
  isKo?: boolean;
}

export const KtReviewQueue: React.FC<Props> = React.memo(function KtReviewQueue({
  logs,
  activeId,
  justCopiedId,
  onSelect,
  isNight = true,
  isKo = false,
}) {
  const [classFilter, setClassFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [search, setSearch] = useState('');

  const classOptions = useMemo(
    () => [...new Set(logs.map((l) => l.className).filter((c): c is string => !!c))].sort(),
    [logs]
  );
  const studentOptions = useMemo(
    () => [...new Set(logs.map((l) => l.studentName).filter(Boolean))].sort(),
    [logs]
  );

  const filteredLogs = useMemo(
    () =>
      logs.filter((l) => {
        if (classFilter !== 'all' && l.className !== classFilter) return false;
        if (studentFilter !== 'all' && l.studentName !== studentFilter) return false;
        if (search.trim() && !l.studentName.toLowerCase().includes(search.trim().toLowerCase())) return false;
        return true;
      }),
    [logs, classFilter, studentFilter, search]
  );

  if (logs.length === 0) {
    return (
      <div className={`px-4 py-3 rounded-2xl border text-xs font-medium ${
        isNight ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
      }`}>
        {isKo ? '모두 검토 완료! 대기 중인 항목이 없습니다.' : "All caught up — nothing waiting for review."}
      </div>
    );
  }

  const selectClass = `px-2.5 py-1.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${
    isNight ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'
  }`;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
          {isKo ? `검토 대기열 (${filteredLogs.length}/${logs.length}건)` : `Review Queue (${filteredLogs.length}/${logs.length})`}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
            isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-300'
          }`}>
            <MagnifyingGlass size={12} className={isNight ? 'text-zinc-500' : 'text-zinc-400'} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={isKo ? '학생 검색' : 'Search student'}
              className={`w-24 sm:w-32 bg-transparent text-[11px] font-bold outline-none ${isNight ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}`}
            />
          </div>
          {classOptions.length > 1 && (
            <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className={selectClass}>
              <option value="all">{isKo ? '전체 학급' : 'All classes'}</option>
              {classOptions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          )}
          {studentOptions.length > 1 && (
            <select value={studentFilter} onChange={(e) => setStudentFilter(e.target.value)} className={selectClass}>
              <option value="all">{isKo ? '전체 학생' : 'All students'}</option>
              {studentOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {filteredLogs.length === 0 ? (
        <div className={`px-4 py-3 rounded-2xl border text-xs font-medium ${
          isNight ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
        }`}>
          {isKo ? '필터와 일치하는 항목이 없습니다.' : 'No items match these filters.'}
        </div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto pr-1">
          {filteredLogs.map((log) => {
            const isActive = log.id === activeId;
            const isCopied = log.id === justCopiedId;
            return (
              <button
                key={log.id}
                type="button"
                onClick={() => onSelect(log.id)}
                className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-11 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                  isCopied
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                    : isActive
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_20px_50px_rgba(249,115,22,0.2)]'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {isCopied && <CheckCircle size={14} weight="fill" className="shrink-0" />}
                  <span className="text-xs font-bold truncate">{log.studentName}</span>
                  {log.className && (
                    <span className="text-[10px] font-mono opacity-70 truncate">{log.className}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {log.date && <span className="text-[10px] font-mono opacity-70">{log.date}</span>}
                  {log.flaggedCount > 0 && (
                    <span className="text-[10px] font-mono font-bold text-amber-400">⚠️ {log.flaggedCount}</span>
                  )}
                  {isCopied && (
                    <span className="text-[10px] font-mono font-bold">{isKo ? '복사됨' : 'Copied'}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
});
