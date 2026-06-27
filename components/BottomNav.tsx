import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';

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
  openLoginModal,
}) => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);

  if (!isVisible) return null;

  const tabs: { id: TabID; icon: React.ReactNode; label: string; korean: string }[] = [
    {
      id: 'scan',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z"
          />
        </svg>
      ),
      label: 'Scan',
      korean: '스캔',
    },
    {
      id: 'help',
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.625 9.75a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 0 1 .778-.332 48.294 48.294 0 0 0 5.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z"
          />
        </svg>
      ),
      label: 'Help',
      korean: '도움말',
    },
  ];

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center pointer-events-none px-4 pb-[env(safe-area-inset-bottom)]">
      <div className={`pointer-events-auto flex items-center gap-2 p-2 rounded-full backdrop-blur-2xl border shadow-2xl transition-all duration-500 ease-[var(--ease-premium)] ${isNight ? 'bg-[#111111]/80 border-white/10 shadow-black/80' : 'bg-white/80 border-zinc-200 shadow-zinc-300/50'}`}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (!isAuthenticated && tab.id === 'scan') {
                  openLoginModal?.();
                  return;
                }
                if (isActive && tab.id === 'scan') {
                  window.dispatchEvent(new CustomEvent('trigger-scan'));
                }
                onTabChange(tab.id);
              }}
              className={`relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-colors duration-200 group btn-press ${isActive ? (isNight ? 'text-orange-500' : 'text-orange-600') : 'hover:bg-white/5'}`}
              title={language === 'ko' ? tab.korean : tab.label}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-bg"
                  className={`absolute inset-0 rounded-full ${isNight ? 'bg-white/10' : 'bg-zinc-100'}`}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                />
              )}
              {isActive && (
                <div className="absolute inset-0 bg-orange-500 rounded-full opacity-20 blur-md pointer-events-none"></div>
              )}
              <span
                className={`relative z-10 transition-colors duration-200 ${isActive ? 'text-orange-500' : isNight ? 'text-zinc-500 group-hover:text-zinc-300' : 'text-zinc-400 group-hover:text-zinc-600'}`}
              >
                {tab.icon}
              </span>
              
              {isActive && (
                <motion.span 
                  layoutId="bottom-nav-indicator"
                  className="absolute -bottom-1.5 w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_10px_#f97316]"
                  transition={{ type: 'spring', bounce: 0.25, duration: 0.5 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
