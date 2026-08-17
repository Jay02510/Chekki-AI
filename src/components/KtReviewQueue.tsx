import React from 'react';
import { CheckCircle } from '@phosphor-icons/react';

export interface KtQueueLog {
  id: string;
  lessonTopic?: string;
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
  if (logs.length === 0) {
    return (
      <div className={`px-4 py-3 rounded-2xl border text-xs font-medium ${
        isNight ? 'bg-white/5 border-white/10 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-500'
      }`}>
        {isKo ? '모두 검토 완료! 대기 중인 항목이 없습니다.' : "All caught up — nothing waiting for review."}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest font-mono block">
        {isKo ? `검토 대기열 (${logs.length}건)` : `Review Queue (${logs.length})`}
      </span>
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {logs.map((log) => {
          const isActive = log.id === activeId;
          const isCopied = log.id === justCopiedId;
          return (
            <button
              key={log.id}
              type="button"
              onClick={() => onSelect(log.id)}
              className={`shrink-0 px-3.5 py-2.5 min-h-11 rounded-2xl border text-left transition-all cursor-pointer active:scale-[0.97] ${
                isCopied
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                  : isActive
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-[0_20px_50px_rgba(249,115,22,0.2)]'
                  : isNight
                  ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                  : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-1.5">
                {isCopied && <CheckCircle size={14} weight="fill" />}
                <span className="text-xs font-bold whitespace-nowrap max-w-[10rem] truncate">
                  {log.lessonTopic || (isKo ? '수업 일지' : 'Class log')}
                </span>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                {log.date && <span className="text-[10px] font-mono opacity-70">{log.date}</span>}
                {log.flaggedCount > 0 && (
                  <span className="text-[10px] font-mono font-bold text-amber-400">
                    ⚠️ {log.flaggedCount}
                  </span>
                )}
                {isCopied && (
                  <span className="text-[10px] font-mono font-bold">{isKo ? '복사됨' : 'Copied'}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
});
