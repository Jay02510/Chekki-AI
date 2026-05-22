import React, { useState, useEffect, Suspense } from 'react';
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

    useEffect(() => {
        const handleShowLegal = (e: Event) => {
            const customEvent = e as CustomEvent<LegalType>;
            setStandaloneLegal(customEvent.detail);
        };

        window.addEventListener('show-legal', handleShowLegal);
        return () => window.removeEventListener('show-legal', handleShowLegal);
    }, []);

    if (!showPaywall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
                onClick={() => setShowPaywall(false)}
            />

            <div className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} rounded-[2.5rem] md:rounded-[3rem] w-full max-w-lg md:max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.2)] border animate-fade-in-up transition-opacity ${standaloneLegal ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>

                {/* Gradient glow */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-40 bg-gradient-to-b from-orange-500/10 to-transparent pointer-events-none" />

                {/* Close */}
                <button
                    onClick={() => setShowPaywall(false)}
                    className="absolute top-4 right-5 text-zinc-500 hover:text-white transition-colors text-xl z-10 p-1"
                >
                    ✕
                </button>

                <div className="p-6 md:p-8 overflow-y-auto max-h-[85vh] custom-scrollbar">
                      <SubscriptionScreen onClose={() => setShowPaywall(false)} isNight={isNight} />
                </div>
            </div>

            {standaloneLegal && (
                <div className="fixed inset-0 z-[200]">
                      <LegalModal type={standaloneLegal} onClose={() => setStandaloneLegal(null)} isStandalone={false} />
                </div>
            )}
        </div>
    );
};
