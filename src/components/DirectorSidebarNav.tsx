import React from 'react';
import { Buildings, Users, CaretRight } from '@phosphor-icons/react';
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
        className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
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
        <span className="block px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
          {isKo ? '설정' : 'Setup'}
        </span>

        <button
          onClick={() => setActiveTab('students')}
          className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
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
            <span>{isKo ? '👥 원생 명단 관리 (Roster)' : '👥 Student Roster'}</span>
          </div>
          <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'students' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
        </button>
      </div>
    </>
  );
}
