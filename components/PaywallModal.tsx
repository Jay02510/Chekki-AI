import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { SubscriptionScreen } from './SubscriptionScreen';
import { LegalModal } from './LegalModal';
import { LegalType } from '../types';

interface Props {
  isNight?: boolean;
}

export const PaywallModal: React.FC<Props> = ({ isNight = true }) => {
  const { showPaywall, setShowPaywall } = useAuth();
  const [standaloneLegal, setStandaloneLegal] = useState<LegalType | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleShowLegal = (e: Event) => {
      const customEvent = e as CustomEvent<LegalType>;
      setStandaloneLegal(customEvent.detail);
    };

    window.addEventListener('show-legal', handleShowLegal);
    return () => window.removeEventListener('show-legal', handleShowLegal);
  }, []);

  useEffect(() => {
    if (showPaywall) {
      // Reset scroll position to top when modal is opened
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
    }
  }, [showPaywall]);

  if (!showPaywall) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
        onClick={() => setShowPaywall(false)}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Premium subscription"
        className={`relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter transition-opacity w-full max-w-lg md:max-w-2xl mx-4 ${standaloneLegal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

        {/* Fade-out overlay at the top to prevent text from cutting off when scrolled */}
        <div
          className={`absolute top-0 left-0 right-0 h-10 bg-gradient-to-b ${isNight ? 'from-zinc-900 via-zinc-900/95' : 'from-white via-white/95'} to-transparent pointer-events-none z-20 rounded-t-3xl`}
        />

        {/* Close */}
        <button
          onClick={() => setShowPaywall(false)}
          aria-label="Close"
          className="absolute top-4 right-5 text-zinc-500 hover:text-white transition-colors text-xl z-30 p-1"
        >
          ✕
        </button>

        <div
          ref={scrollContainerRef}
          className="p-6 md:p-8 pt-10 md:pt-12 overflow-y-auto max-h-[85vh] custom-scrollbar"
        >
          <SubscriptionScreen onClose={() => setShowPaywall(false)} isNight={isNight} />
        </div>
        </div>
      </div>

      {standaloneLegal && (
        <div className="fixed inset-0 z-[200]">
          <LegalModal
            type={standaloneLegal}
            onClose={() => setStandaloneLegal(null)}
            isStandalone={false}
          />
        </div>
      )}
    </div>
  );
};
