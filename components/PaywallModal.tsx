
import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionScreen } from './SubscriptionScreen';

export const PaywallModal: React.FC = () => {
    const { showPaywall, setShowPaywall } = useAuth();

    if (!showPaywall) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 md:p-4">
            <div
                className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in"
                onClick={() => setShowPaywall(false)}
            />

            <div className="relative bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] w-full max-w-lg md:max-w-2xl overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.2)] border border-white/10 animate-fade-in-up">

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
                    <SubscriptionScreen onClose={() => setShowPaywall(false)} />
                </div>
            </div>
        </div>
    );
};
