import React from 'react';
import { CheckCircle, XCircle, Circle, Fire } from '@phosphor-icons/react';
import type { ComplianceRow } from '../../hooks/useLogCompliance';

interface Props {
  isNight: boolean;
  isKo: boolean;
  complianceRows: ComplianceRow[];
  isLoading: boolean;
}

/**
 * Director's "Log Compliance" view — per-class, per-day rollup of whether
 * the assigned teacher submitted that day's log, with a trailing miss-streak
 * badge. Pure read/aggregate view over data useLogCompliance already
 * queried; no writes here.
 */
export function LogComplianceTracker({ isNight, isKo, complianceRows, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[30vh]">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (complianceRows.length === 0) {
    return (
      <div className="py-16 text-center text-zinc-500 text-xs">
        {isKo ? '표시할 반이 없습니다.' : 'No classes to show yet.'}
      </div>
    );
  }

  const days = complianceRows[0].days;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className={`p-1 rounded-[2.5rem] ${isNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'}`}>
        <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 ${isNight ? 'bg-brand-dark text-white' : 'bg-white text-zinc-900'}`}>
          <div className="mb-6">
            <h4 className={`text-lg font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
              {isKo ? '수업 일지 제출 현황' : 'Log Submission Compliance'}
            </h4>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isKo ? '지난 14일간 반별 일지 제출 여부입니다.' : 'Daily log submission over the last 14 days, per class.'}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[9px] ${isNight ? 'border-white/5' : 'border-zinc-200'}`}>
                  <th className="pb-4 pl-2 sticky left-0">{isKo ? '반' : 'Class'}</th>
                  {days.map((d) => (
                    <th key={d.date} className="pb-4 px-1 text-center font-mono">
                      {d.date.slice(5)}
                    </th>
                  ))}
                  <th className="pb-4 pr-2 text-right">{isKo ? '연속 미제출' : 'Miss Streak'}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                {complianceRows.map((row) => (
                  <tr key={row.classId} className={`transition-colors ${isNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                    <td className="py-3 pl-2 font-black sticky left-0">
                      <p className={isNight ? 'text-white' : 'text-zinc-900'}>{row.className}</p>
                      <p className="text-[10px] text-zinc-500 font-mono font-normal">{row.teacherName}</p>
                    </td>
                    {row.days.map((d) => (
                      <td key={d.date} className="py-3 px-1 text-center">
                        {d.submitted ? (
                          <CheckCircle size={14} weight="fill" className="inline text-emerald-500" />
                        ) : d.isToday ? (
                          <Circle size={14} weight="bold" className="inline text-zinc-500/40" />
                        ) : (
                          <XCircle size={14} weight="fill" className="inline text-red-500/40" />
                        )}
                      </td>
                    ))}
                    <td className="py-3 pr-2 text-right">
                      {row.missStreak >= 2 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-500/10 border border-red-500/20 text-red-400">
                          <Fire size={12} weight="bold" />
                          {row.missStreak}
                        </span>
                      ) : (
                        <span className="text-zinc-500 text-[10px] font-mono">{row.missStreak}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
