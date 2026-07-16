import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppleLogo } from './AppleLogo';

interface Props {
  onClose: () => void;
  isNight?: boolean;
}

export const BillingModal: React.FC<Props> = ({ onClose, isNight = true }) => {
  const { user, subscriptionRecord, cancelSubscription, setShowPaywall } = useAuth();
  const { language, t } = useLanguage();
  const isPro = user?.plan === 'pro';
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const platform = Capacitor.getPlatform();

  const formatDate = (isoStr?: string | null) => {
    if (!isoStr) return 'N/A';
    return new Date(isoStr).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const platformBadge = () => {
    const p = subscriptionRecord?.subscription_platform;
    if (!p || p === 'none') return null;
    const badgeContent = () => {
      if (p === 'apple')
        return (
          <>
            <AppleLogo className="w-2.5 h-2.5" /> {t('sub_platformApple')}
          </>
        );
      if (p === 'google')
        return (
          <>
            <svg className="w-3 h-3" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {t('sub_platformGoogle')}
          </>
        );
      if (p === 'web')
        return (
          <>
            <svg
              className="w-3 h-3 text-blue-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
              />
            </svg>
            {t('sub_platformWeb')}
          </>
        );
      return p;
    };

    return (
      <span
        className={`text-[9px] ${isNight ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-orange-50 border-orange-200 text-orange-600'} px-3 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1.5 border`}
      >
        {badgeContent()}
      </span>
    );
  };

  const cancelInstructions = () => {
    if (subscriptionRecord?.subscription_platform === 'apple') {
      return (
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
            {language === 'ko'
              ? 'Apple 구독을 취소하려면 iPhone의 설정 > [본인 이름] > 구독으로 이동하세요.'
              : 'To cancel your Apple subscription, go to Settings > [Your Name] > Subscriptions on your iPhone.'}
          </p>
          <a
            href="itms-apps://apps.apple.com/account/subscriptions"
            className={`block w-full text-center ${isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'} py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.97] border`}
          >
            {t('sub_manage')}
          </a>
        </div>
      );
    }
    if (subscriptionRecord?.subscription_platform === 'google') {
      return (
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-400 leading-relaxed font-medium">
            {language === 'ko'
              ? 'Google Play 구독을 취소하려면 Google Play 스토어 > 구독으로 이동하세요.'
              : 'To cancel your Google subscription, go to Google Play Store > Subscriptions.'}
          </p>
          <a
            href="https://play.google.com/store/account/subscriptions?package=com.chekkiai.app"
            className={`block w-full text-center ${isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'} py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-[0.97] border`}
          >
            {t('sub_manage')}
          </a>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] w-full max-w-2xl mx-2 sm:mx-4">
        <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
        <div
          className={`${isNight ? 'bg-zinc-950 border-white/5' : 'bg-zinc-50 border-zinc-200'} px-5 py-5 sm:px-8 sm:py-6 border-b flex justify-between items-center shrink-0`}
        >
          <div className="flex items-center gap-3">
            <svg
              className={`w-6 h-6 ${isNight ? 'text-orange-400' : 'text-orange-500'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
              />
            </svg>
            <h2
              className={`text-balance text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display tracking-tight`}
            >
              {t('billing_title')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-orange-500 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-8 md:p-10 flex flex-col items-center text-center space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div
            className={`w-20 h-20 rounded-full ${isNight ? 'bg-orange-500/10' : 'bg-orange-50 shadow-inner'} flex items-center justify-center`}
          >
            <svg
              className={`w-10 h-10 ${isNight ? 'text-orange-400' : 'text-orange-500'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
              />
            </svg>
          </div>

          {subscriptionRecord?.subscription_status === 'active' ? (
            <>
              <h3
                className={`text-balance text-[10px] font-black uppercase tracking-tight ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}
              >
                {t('billing_active')}
              </h3>
              {platformBadge()}
              <div className="space-y-1.5 text-zinc-400 font-medium text-sm">
                <p>
                  {t('billing_plan')}:{' '}
                  <span className="text-orange-500 font-black">
                    {subscriptionRecord.apple_product_id === 'com.chekkiai.app.yearly'
                      ? t('sub_yearly')
                      : t('sub_monthly')}
                  </span>
                </p>
                {user?.subscriptionStartedAt && (
                  <p>
                    {t('billing_started')}: {formatDate(user.subscriptionStartedAt)}
                  </p>
                )}
                {user?.nextBillingDate && (
                  <p>
                    {t('billing_next')}: {formatDate(user.nextBillingDate)}
                  </p>
                )}
                {subscriptionRecord?.subscription_expiry_date && (
                  <p>
                    {t('billing_expires')}:{' '}
                    {formatDate(subscriptionRecord.subscription_expiry_date)}
                  </p>
                )}
                {user?.isCanceled && (
                  <p className="text-red-400 text-xs font-bold mt-2">
                    {t('billing_canceled_notice')}
                  </p>
                )}
              </div>

              {/* Cancel instructions — platform-specific */}
              {cancelInstructions() && (
                <div
                  className={`${isNight ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-50 border-zinc-200 shadow-inner'} rounded-2xl p-6 w-full max-w-sm text-left border`}
                >
                  {cancelInstructions()}
                </div>
              )}
            </>
          ) : (
            <>
              <h3
                className={`text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display uppercase`}
              >
                {t('sub_no_active')}
              </h3>
              <p className="text-zinc-400 text-sm font-medium max-w-xs leading-relaxed">
                {language === 'ko'
                  ? '모든 AI 기능을 무제한으로 사용하세요.'
                  : 'Unlock all AI tools with unlimited access.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  setShowPaywall(true);
                }}
                className="w-full max-w-xs bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-orange-500/20 active:scale-[0.97] transition-all"
              >
                {t('sub_subscribe_now')}
              </button>
            </>
          )}

          <div className={`h-px w-12 ${isNight ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
          <button
            onClick={onClose}
            className={`${isNight ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500 shadow-sm'} px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all`}
          >
            {t('billing_back')}
          </button>
        </div>

        {showCancelConfirm && (
          <div
            className={`absolute inset-0 ${isNight ? 'bg-zinc-950/95' : 'bg-white/95'} backdrop-blur-md flex flex-col justify-center items-center p-8 text-center animate-fade-in z-50`}
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
              <svg
                className="w-8 h-8 text-red-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                />
              </svg>
            </div>
            <h3
              className={`text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-2`}
            >
              {t('billing_cancel_btn')}
            </h3>
            <p className="text-zinc-400 text-sm font-medium mb-8 max-w-sm leading-relaxed break-keep">
              {t('billing_cancel_desc')}
            </p>
            <div className="flex flex-col gap-3 w-full max-w-xs">
              <button
                onClick={async () => {
                  await cancelSubscription();
                  setShowCancelConfirm(false);
                }}
                className="w-full bg-red-500 hover:bg-red-600 text-white py-4 rounded-xl font-black transition-all active:scale-[0.97] shadow-lg shadow-red-500/20"
              >
                {t('billing_cancel_yes')}
              </button>
              <button
                onClick={() => setShowCancelConfirm(false)}
                className={`w-full ${isNight ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-500'} text-white py-4 rounded-xl font-black transition-all`}
              >
                {t('billing_cancel_no')}
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
