import React, { useMemo, useState } from 'react';
import { CheckCircle, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';

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
  /** Renders the full review panel for the expanded row, inline in the list
   * (accordion) instead of the caller having to scroll to a panel below. */
  renderActiveDetail?: (log: KtQueueLog) => React.ReactNode;
}

// Horizontal drag distance (px) past which a swipe collapses the expanded
// row. Collapse only hides the inline panel — it never touches review/
// approval state, so a stray swipe can't accidentally skip a report.
const SWIPE_DISMISS_THRESHOLD = 80;

export const KtReviewQueue: React.FC<Props> = React.memo(function KtReviewQueue({
  logs,
  activeId,
  justCopiedId,
  onSelect,
  isNight = true,
  isKo = false,
  renderActiveDetail,
}) {
  const [classFilter, setClassFilter] = useState('all');
  const [studentFilter, setStudentFilter] = useState('all');
  const [search, setSearch] = useState('');
  // Collapses the whole queue section (search/filters + list) so a long
  // queue doesn't dominate the screen — independent from per-row expansion.
  const [isQueueOpen, setIsQueueOpen] = useState(true);
  // Independent from `activeId` (the parent's selection, which also drives
  // draft/edit state) — this only controls whether the accordion panel for
  // the active row is visually open. Defaults open whenever the selection
  // changes, so picking a new item expands it right away.
  const [expandedId, setExpandedId] = useState<string | null>(activeId);
  const [dragX, setDragX] = useState(0);
  const dragStartX = React.useRef<number | null>(null);
  // Tracks the previous activeId so the sync below only fires on an actual
  // selection change — not on every render after a manual/swipe collapse,
  // which would otherwise immediately re-open the row it just closed.
  const prevActiveId = React.useRef(activeId);

  if (activeId !== prevActiveId.current) {
    prevActiveId.current = activeId;
    if (activeId !== null) setExpandedId(activeId);
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartX.current = e.touches[0].clientX;
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartX.current === null) return;
    setDragX(e.touches[0].clientX - dragStartX.current);
  };
  const handleTouchEnd = () => {
    if (Math.abs(dragX) > SWIPE_DISMISS_THRESHOLD) {
      setExpandedId(null);
    }
    setDragX(0);
    dragStartX.current = null;
  };

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
        if (search.trim() && !l.studentName.toLowerCase().includes(search.trim().toLowerCase()))
          return false;
        return true;
      }),
    [logs, classFilter, studentFilter, search]
  );

  if (logs.length === 0) {
    return (
      <div
        className={`px-4 py-3 rounded-2xl border text-xs font-medium ${
          isNight
            ? 'bg-white/5 border-white/10 text-zinc-500'
            : 'bg-zinc-50 border-zinc-200 text-zinc-500'
        }`}
      >
        {isKo
          ? '모두 검토 완료! 대기 중인 항목이 없습니다.'
          : 'All caught up — nothing waiting for review.'}
      </div>
    );
  }

  const selectClass = `px-2.5 py-1.5 rounded-xl border text-[11px] font-bold outline-none cursor-pointer ${
    isNight ? 'bg-white/5 border-white/10 text-zinc-300' : 'bg-white border-zinc-300 text-zinc-700'
  }`;

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setIsQueueOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 min-h-11 rounded-2xl border cursor-pointer transition-colors ${
          isNight
            ? 'bg-white/5 border-white/10 hover:bg-white/10'
            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
        }`}
      >
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono">
          {isKo
            ? `검토 대기열 (${filteredLogs.length}/${logs.length}건)`
            : `Review Queue (${filteredLogs.length}/${logs.length})`}
        </span>
        <CaretDown
          size={14}
          weight="bold"
          className={`text-zinc-400 shrink-0 transition-transform ${isQueueOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isQueueOpen && (
        <>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border ${
                  isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-300'
                }`}
              >
                <MagnifyingGlass
                  size={12}
                  className={isNight ? 'text-zinc-500' : 'text-zinc-400'}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={isKo ? '학생 검색' : 'Search student'}
                  className={`w-24 sm:w-32 bg-transparent text-[11px] font-bold outline-none ${isNight ? 'text-white placeholder:text-zinc-600' : 'text-zinc-900 placeholder:text-zinc-400'}`}
                />
              </div>
              {classOptions.length > 1 && (
                <select
                  value={classFilter}
                  onChange={(e) => setClassFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{isKo ? '전체 학급' : 'All classes'}</option>
                  {classOptions.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              )}
              {studentOptions.length > 1 && (
                <select
                  value={studentFilter}
                  onChange={(e) => setStudentFilter(e.target.value)}
                  className={selectClass}
                >
                  <option value="all">{isKo ? '전체 학생' : 'All students'}</option>
                  {studentOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {filteredLogs.length === 0 ? (
            <div
              className={`px-4 py-3 rounded-2xl border text-xs font-medium ${
                isNight
                  ? 'bg-white/5 border-white/10 text-zinc-500'
                  : 'bg-zinc-50 border-zinc-200 text-zinc-500'
              }`}
            >
              {isKo ? '필터와 일치하는 항목이 없습니다.' : 'No items match these filters.'}
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredLogs.map((log) => {
                const isActive = log.id === activeId;
                const isCopied = log.id === justCopiedId;
                const isExpanded = isActive && log.id === expandedId && !!renderActiveDetail;
                return (
                  <div key={log.id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(log.id);
                        setExpandedId((prev) => (isActive && prev === log.id ? null : log.id));
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 min-h-11 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.99] ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : isActive
                            ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_20px_50px_rgba(249,115,22,0.2)]'
                            : isNight
                              ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                              : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                      } ${isExpanded ? 'rounded-b-none' : ''}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {isCopied && <CheckCircle size={14} weight="fill" className="shrink-0" />}
                        <span className="text-xs font-bold truncate">{log.studentName}</span>
                        {log.className && (
                          <span className="text-[10px] font-mono opacity-70 truncate">
                            {log.className}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.date && (
                          <span className="text-[10px] font-mono opacity-70">{log.date}</span>
                        )}
                        {log.flaggedCount > 0 && (
                          <span className="text-[10px] font-mono font-bold text-amber-400">
                            ⚠️ {log.flaggedCount}
                          </span>
                        )}
                        {isCopied && (
                          <span className="text-[10px] font-mono font-bold">
                            {isKo ? '복사됨' : 'Copied'}
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{
                          transform: `translateX(${dragX}px)`,
                          opacity:
                            1 - Math.min(Math.abs(dragX) / (SWIPE_DISMISS_THRESHOLD * 2), 0.6),
                        }}
                        className={`rounded-b-2xl border border-t-0 p-3 transition-[opacity] ${
                          isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-300'
                        }`}
                      >
                        {renderActiveDetail!(log)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
});
