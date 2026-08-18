import React from 'react';
import { ChartBar, Sparkle, FileText, ClockCounterClockwise, CaretRight } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

// FT's sidebar nav (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — overview/insights/homework/history tabs. Purely presentational.
//
// The Syllabus/Curriculum Setup tab is intentionally omitted here (demo:
// OCR scan flow not battle-tested enough for live demo, matching the
// commented-out button this was extracted from) — re-add if that changes.
export function FtSidebarNav({ isNight, isKo, activeTab, setActiveTab }: Props) {
  return (
    <>
      <button
        onClick={() => setActiveTab('overview')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'overview'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'overview'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-orange-400 group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:text-zinc-900'
          }`}>
            <ChartBar size={18} weight="bold" />
          </div>
          <span>{isKo ? '클래스 스캐너 & 일지' : 'Class Scanner & Log'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

      <button
        onClick={() => setActiveTab('insights')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'insights'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'insights'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-amber-400 group-hover:text-white' : 'bg-amber-100 text-amber-600 group-hover:text-zinc-900'
          }`}>
            <Sparkle size={18} weight="bold" />
          </div>
          <span>{isKo ? '📚 주간 커리큘럼 & 오답 분석' : '📚 Weekly Insights'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'insights' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

      <button
        onClick={() => setActiveTab('homework')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'homework'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'homework'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-emerald-400 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:text-zinc-900'
          }`}>
            <FileText size={18} weight="bold" />
          </div>
          <span>{isKo ? '📄 워크시트 채점기' : '📄 Worksheet Scanner'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'homework' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

      <button
        onClick={() => setActiveTab('history')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'history'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'history'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-blue-400 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:text-zinc-900'
          }`}>
            <ClockCounterClockwise size={18} weight="bold" />
          </div>
          <span>{isKo ? '📜 작성한 일지 이력' : '📜 Log History'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'history' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>
    </>
  );
}
