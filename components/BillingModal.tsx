
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

interface Props {
    onClose: () => void;
}

export const BillingModal: React.FC<Props> = ({ onClose }) => {
    const { user, upgradeToPro, cancelSubscription, setShowPaywall } = useAuth();
    const { language, t } = useLanguage();
    const isPro = user?.plan === 'pro';
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const formatDate = (isoStr?: string) => {
        if (!isoStr) return "N/A";
        return new Date(isoStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

            <div className="relative bg-zinc-900 rounded-[2rem] w-full max-w-2xl shadow-2xl border border-white/5 overflow-hidden animate-fade-in-up">

                <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <span className="text-2xl">💳</span>
                        <h2 className="text-2xl font-black text-white font-display">Billing & Subscription</h2>
                    </div>
                    <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                </div>

                <div className="p-12 flex flex-col items-center text-center space-y-6">
                    <div className="w-24 h-24 rounded-full bg-orange-500/10 flex items-center justify-center text-5xl mb-4 animate-bounce">
                        💳
                    </div>

                    {isPro ? (
                        <>
                            <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">Active Subscription</h3>
                            <div className="space-y-2 text-zinc-400 font-medium">
                                <p>Plan: <span className="text-orange-500">Standard Pro (9,900원)</span></p>
                                <p>Started: {formatDate(user.subscriptionStartedAt)}</p>
                                <p>Next Billing: {formatDate(user.nextBillingDate)}</p>
                            </div>
                            <button
                                onClick={() => setShowCancelConfirm(true)}
                                className="text-zinc-500 hover:text-red-500 text-[10px] font-black uppercase tracking-[0.2em] transition-colors mt-8"
                            >
                                Cancel Subscription
                            </button>
                        </>
                    ) : (
                        <>
                            <h3 className="text-3xl font-black text-white font-display uppercase tracking-tight">
                                {language === 'ko' ? '프로 요금제 구독' : 'Subscribe to Pro'}
                            </h3>
                            <div className="bg-orange-500/10 border border-orange-500/30 rounded-2xl p-6 w-full max-w-sm">
                                <p className="text-white font-black text-2xl mb-1">9,900원 <span className="text-zinc-500 text-xs">/ 30일</span></p>
                                <p className="text-zinc-400 text-[10px] font-medium leading-relaxed">
                                    {language === 'ko'
                                        ? "모든 AI 분석 도구와 오답 노트를 무제한으로 사용하세요."
                                        : "Unlock all AI tools and unlimited review notes."}
                                </p>
                            </div>

                            <button
                                onClick={async () => {
                                    if (!(window as any).IMP) return alert("Payment SDK not loaded.");
                                    const { IMP } = window as any;
                                    IMP.init("imp78430160"); // Actual PortOne merchant code

                                    IMP.request_pay({
                                        pg: "html5_inicis",
                                        pay_method: "card",
                                        merchant_uid: `mid_${new Date().getTime()}`,
                                        name: "Chekki AI Standard Pro (30 Days)",
                                        amount: 9900,
                                        buyer_email: user?.email,
                                        buyer_name: user?.name,
                                        buyer_tel: "010-0000-0000",
                                    }, async (rsp: any) => {
                                        if (rsp.success) {
                                            const success = await upgradeToPro();
                                            if (success) alert(language === 'ko' ? "결제가 완료되었습니다!" : "Payment successful!");
                                        } else {
                                            alert(language === 'ko' ? `결제 실패: ${rsp.error_msg}` : `Payment failed: ${rsp.error_msg}`);
                                        }
                                    });
                                }}
                                className="w-full max-w-sm bg-orange-500 hover:bg-orange-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                {language === 'ko' ? '9,900원 결제하기' : 'Pay 9,900 KRW'}
                            </button>
                        </>
                    )}

                    <div className="h-px w-12 bg-zinc-800 my-4"></div>
                    <button
                        onClick={onClose}
                        className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                    >
                        Back to App
                    </button>
                </div>
            </div>
        </div>
    );
};
