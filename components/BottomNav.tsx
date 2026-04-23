import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

export type TabID = 'scan' | 'help';

interface BottomNavProps {
  activeTab: TabID;
  onTabChange: (tab: TabID) => void;
  isVisible: boolean;
  isNight?: boolean;
  isAuthenticated?: boolean;
  openLoginModal?: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ 
  activeTab, 
  onTabChange, 
  isVisible, 
  isNight = true,
  isAuthenticated = false,
  openLoginModal
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  const tabs: { id: TabID; icon: string; label: string; korean: string }[] = [
    { id: 'scan', icon: '📸', label: 'Scan', korean: '스캔' },
    { id: 'help', icon: '💬', label: 'Help', korean: '도움말' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] flex flex-col items-center pointer-events-none">
      {/* Backdrop for open state */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-all duration-500 pointer-events-auto ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={() => setIsOpen(false)}
      />

      <div className="relative w-full flex flex-col items-center">
        {/* Drawer Content - Absolutely positioned above the handle for perfect retraction */}
        <div className={`absolute bottom-full left-0 right-0 w-full max-w-lg mx-auto transition-all duration-700 cubic-bezier(0.32, 0.72, 0, 1) ${isOpen ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-12 opacity-0 pointer-events-none'}`}>
          <div className={`mx-4 mb-4 rounded-[2.5rem] p-4 border shadow-2xl ${isNight ? 'bg-zinc-900/95 border-white/10' : 'bg-white/95 border-zinc-200'} backdrop-blur-3xl overflow-hidden`}>
            <div className="flex flex-col gap-2">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setIsOpen(false);
                      if (!isAuthenticated && tab.id === 'scan') {
                        openLoginModal?.();
                        return;
                      }
                      if (isActive && tab.id === 'scan') {
                        window.dispatchEvent(new CustomEvent('trigger-scan'));
                      }
                      onTabChange(tab.id);
                    }}
                    className={`flex items-center gap-4 px-6 py-5 rounded-[1.8rem] transition-all duration-300 ${isActive ? (isNight ? 'bg-white/10' : 'bg-zinc-100') : 'hover:bg-white/5'}`}
                  >
                    <span className={`text-2xl transition-transform duration-500 ${isActive ? 'scale-110' : 'opacity-40 grayscale'}`}>
                      {tab.icon}
                    </span>
                    <div className="flex flex-col items-start">
                      <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${isActive ? 'text-orange-500' : (isNight ? 'text-zinc-500' : 'text-zinc-400')}`}>
                         {!isAuthenticated && tab.id === 'scan' ? (language === 'ko' ? '로그인' : 'Log In') : (language === 'ko' ? tab.korean : tab.label)}
                      </span>
                      <span className="text-[9px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
                        {tab.id === 'scan' ? (language === 'ko' ? '새로운 숙제 스캔' : 'Scan New Homework') : (language === 'ko' ? '도움이 필요하신가요?' : 'Need some help?')}
                      </span>
                    </div>
                    {isActive && (
                      <div className="ml-auto w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_15px_#f97316] animate-pulse"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Trigger Handle - Positioned higher to avoid conflict with iOS Home Indicator */}
        <div className={`w-full max-w-[140px] md:max-w-xs mx-auto transition-transform duration-700 pointer-events-auto ${isOpen ? 'translate-y-0' : 'translate-y-[calc(100%-2.5rem)] hover:translate-y-0'} pb-[calc(env(safe-area-inset-bottom)+2rem)] px-6`}>
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full h-12 md:h-16 rounded-full flex flex-col items-center justify-center transition-all duration-500 shadow-2xl active:scale-[0.98] group relative overflow-hidden border-2 ${
              isOpen 
                ? 'bg-zinc-900 border-white/20' 
                : `${isNight ? 'bg-zinc-900/60 border-white/10' : 'bg-white/60 border-zinc-200 shadow-sm'} backdrop-blur-xl`
            }`}
          >
            <div className="flex flex-col items-center gap-0.5">
              <svg 
                className={`w-7 h-7 md:w-8 md:h-8 text-orange-500 transition-all duration-700 ${isOpen ? 'rotate-180 opacity-40' : 'animate-bounce'}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={4}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
              </svg>
              <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-[0.4em] transition-all duration-500 ${isOpen ? 'text-zinc-500 opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                {isOpen ? (language === 'ko' ? '닫기' : 'Close') : (language === 'ko' ? '메뉴' : 'Menu')}
              </span>
              {!isOpen && (
                 <span className="text-[6px] font-black text-zinc-500 uppercase tracking-widest opacity-40">MENU</span>
              )}
            </div>
          </button>
        </div>
      </div>

    </div>
  );
};
