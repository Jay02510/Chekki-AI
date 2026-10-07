import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Capacitor } from '@capacitor/core';
import { SubscriptionScreen } from './SubscriptionScreen';
import { LegalModal } from './LegalModal';
import { LegalType } from '../types';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useModalExit } from '../hooks/useModalExit';
import { X } from '@phosphor-icons/react';

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

  const { isClosing, close } = useModalExit(() => setShowPaywall(false));
  const dialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showPaywall && !standaloneLegal,
    onClose: close,
  });

  if (!showPaywall) return null;

  return (
    <div className="fixed inset-0 z-[10010] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Premium"
        tabIndex={-1}
        className={`relative flex w-full flex-col overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-2xl sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'} ${standaloneLegal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
      >
        <button
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
        >
          <X size={20} weight="bold" />
        </button>

        <div ref={scrollContainerRef} className="custom-scrollbar max-h-[90vh] overflow-y-auto p-5 pt-8 sm:p-8">
          <SubscriptionScreen onClose={() => setShowPaywall(false)} isNight={isNight} />
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
