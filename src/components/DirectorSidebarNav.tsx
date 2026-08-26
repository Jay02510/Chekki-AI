import React from 'react';
import { Buildings, Users, Table, UserGear, ClipboardText, CaretRight } from '@phosphor-icons/react';
import type { TabId } from '../../hooks/useTeacherTabs';

interface Props {
  isNight: boolean;
  isKo: boolean;
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

// Director's sidebar nav (Phase 6 of the buzzing-nibbling-hearth TeacherPage
// split) — director_hq hub + the "Setup" section's student-roster link.
// Purely presentational: activeTab/setActiveTab are the only state it touches.
export function DirectorSidebarNav({ isNight, isKo, activeTab, setActiveTab }: Props) {
  return (
    <>
      <button
        onClick={() => setActiveTab('director_hq')}
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
          activeTab === 'director_hq'
            ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
            : isNight
              ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
              : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl transition-colors ${
            activeTab === 'director_hq'
              ? 'bg-orange-500/20 text-orange-500'
              : isNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
          }`}>
            <Buildings size={18} weight="bold" />
          </div>
          <span>{isKo ? '🏢 원장님 HQ 총괄 대시보드' : '🏢 Director HQ Dashboard'}</span>
        </div>
        <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'director_hq' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
      </button>

      <div className="pt-6 mt-2 border-t border-white/5 space-y-2">
        <span className="block px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">
          {isKo ? '설정' : 'Setup'}
        </span>

        <button
          onClick={() => setActiveTab('students')}
          className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
            activeTab === 'students'
              ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
              : isNight
                ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${
              activeTab === 'students'
                ? 'bg-orange-500/20 text-orange-500'
                : isNight ? 'bg-white/5 text-purple-400 group-hover:text-white' : 'bg-purple-100 text-purple-600 group-hover:text-zinc-900'
            }`}>
              <Users size={18} weight="bold" />
            </div>
            <span>{isKo ? '👥 학생 관리' : '👥 Students'}</span>
          </div>
          <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'students' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
        </button>

        <button
          onClick={() => setActiveTab('classes')}
          className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
            activeTab === 'classes'
              ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
              : isNight
                ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${
              activeTab === 'classes'
                ? 'bg-orange-500/20 text-orange-500'
                : isNight ? 'bg-white/5 text-emerald-400 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:text-zinc-900'
            }`}>
              <Table size={18} weight="bold" />
            </div>
            <span>{isKo ? '🏫 학급 관리' : '🏫 Classes'}</span>
          </div>
          <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'classes' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
        </button>

        <button
          onClick={() => setActiveTab('teacher_assignment')}
          className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
            activeTab === 'teacher_assignment'
              ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
              : isNight
                ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${
              activeTab === 'teacher_assignment'
                ? 'bg-orange-500/20 text-orange-500'
                : isNight ? 'bg-white/5 text-blue-400 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:text-zinc-900'
            }`}>
              <UserGear size={18} weight="bold" />
            </div>
            <span>{isKo ? '🧑‍🏫 선생님 배정' : '🧑‍🏫 Teacher Assignment'}</span>
          </div>
          <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'teacher_assignment' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
        </button>

        <button
          onClick={() => setActiveTab('log_compliance')}
          className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
            activeTab === 'log_compliance'
              ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
              : isNight
                ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl transition-colors ${
              activeTab === 'log_compliance'
                ? 'bg-orange-500/20 text-orange-500'
                : isNight ? 'bg-white/5 text-rose-400 group-hover:text-white' : 'bg-rose-100 text-rose-600 group-hover:text-zinc-900'
            }`}>
              <ClipboardText size={18} weight="bold" />
            </div>
            <span>{isKo ? '📋 일지 제출 현황' : '📋 Log Compliance'}</span>
          </div>
          <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'log_compliance' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
        </button>
      </div>
    </>
  );
}
