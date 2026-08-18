import React from 'react';
import { Sparkle, ChartBar, Notebook, FileText, CaretRight } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
  showReportCardModal: boolean;
  setShowReportCardModal: (show: boolean) => void;
}

// KT's sidebar nav (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — script/overview/log/homework tabs plus the report-generator
// trigger. Purely presentational.
//
// The Syllabus/Curriculum Setup tab is intentionally omitted here (demo:
// OCR scan flow not battle-tested enough for live demo, matching the
// commented-out button this was extracted from) — re-add if that changes.
export function KtSidebarNav({ isNight, isKo, activeTab, setActiveTab, showReportCardModal, setShowReportCardModal }: Props) {
  return (
    <>
      <button
        onClick={() => setActiveTab('kt_script')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'kt_script'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'kt_script'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-emerald-400 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:text-zinc-900'
          }`}>
            <Sparkle size={18} weight="fill" />
          </div>
          <span>{isKo ? '⚡ 알림톡 대본 & 1클릭 복사' : '⚡ KakaoTalk Parent Script'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'kt_script' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

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
              : isNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
          }`}>
            <ChartBar size={18} weight="bold" />
          </div>
          <span>{isKo ? '반 출석 및 채점 현황' : 'Class Overview'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

      <button
        onClick={() => setActiveTab('kt_log')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'kt_log'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'kt_log'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-orange-400 group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:text-zinc-900'
          }`}>
            <Notebook size={18} weight="bold" />
          </div>
          <span>{isKo ? '✏️ 오늘 수업 일지 작성' : "✏️ Submit Today's Log"}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'kt_log' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
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

      {/* AI Report Studio Generator Trigger Button — parent-facing report
          generation is KT's job (they're the one who reviews/sends parent
          communication), not FT's or the director's. */}
      <button
        type="button"
        onClick={() => setShowReportCardModal(true)}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          showReportCardModal
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 font-black'
            : isNight
              ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:border-orange-500/40'
              : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-orange-300'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            showReportCardModal
              ? 'bg-orange-500/20 text-orange-400'
              : isNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-600 group-hover:text-zinc-900'
          }`}>
            <Sparkle size={18} weight="fill" />
          </div>
          <span>{isKo ? '📊 학부모 성적표 발급기' : '📊 Generate Weekly Report'}</span>
        </div>
        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
          showReportCardModal
            ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
            : isNight ? 'bg-white/5 text-zinc-500 border-white/10' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
        }`}>
          GENERATE
        </span>
      </button>
    </>
  );
}
