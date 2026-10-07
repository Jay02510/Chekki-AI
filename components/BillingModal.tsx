import React from 'react';
import { X } from '@phosphor-icons/react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AppleLogo } from './AppleLogo';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  onClose: () => void;
  isNight?: boolean;
}

export const BillingModal: React.FC<Props> = ({ onClose, isNight = true }) => {
  const { user, subscriptionRecord, setShowPaywall } = useAuth();
  const { language, t } = useLanguage();
  const isPro = user?.plan === 'pro';
  const platform = Capacitor.getPlatform();
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });

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
      // Premium provided through the parent's academy (school invite) —
      // rendered the raw enum "SCHOOL_CODE" before.
      if (p === 'school_code') return language === 'ko' ? '학원 제공' : 'Provided by your academy';
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
              className="w-3 h-3"
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
        className="inline-flex items-center gap-1.5 rounded-full bg-line-soft px-3 py-1 text-[13px] font-bold text-line-ink"
      >
        {badgeContent()}
      </span>
    );
  };

  const cancelInstructions = () => {
    if (subscriptionRecord?.subscription_platform === 'apple') {
      return (
        <div className="space-y-3">
          <p className="text-[14px] text-ink-2 leading-relaxed break-keep">
            {language === 'ko'
              ? 'Apple 구독을 취소하려면 iPhone의 설정 > [본인 이름] > 구독으로 이동하세요.'
              : 'To cancel your Apple subscription, go to Settings > [Your Name] > Subscriptions on your iPhone.'}
          </p>
          <a
            href="itms-apps://apps.apple.com/account/subscriptions"
            className="btn-press flex min-h-12 w-full items-center justify-center rounded-md bg-surface text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            {t('sub_manage')}
          </a>
        </div>
      );
    }
    if (subscriptionRecord?.subscription_platform === 'google') {
      return (
        <div className="space-y-3">
          <p className="text-[14px] text-ink-2 leading-relaxed break-keep">
            {language === 'ko'
              ? 'Google Play 구독을 취소하려면 Google Play 스토어 > 구독으로 이동하세요.'
              : 'To cancel your Google subscription, go to Google Play Store > Subscriptions.'}
          </p>
          <a
            href="https://play.google.com/store/account/subscriptions?package=com.chekkiai.app"
            className="btn-press flex min-h-12 w-full items-center justify-center rounded-md bg-surface text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            {t('sub_manage')}
          </a>
        </div>
      );
    }
    return null;
  };

  const isKo = language === 'ko';
  const rows: [string, string][] = [];
  if (subscriptionRecord?.subscription_status === 'active') {
    if (subscriptionRecord.subscription_platform !== 'school_code')
      rows.push([
        t('billing_plan'),
        subscriptionRecord.apple_product_id === 'com.chekkiai.app.yearly' ? t('sub_yearly') : t('sub_monthly'),
      ]);
    if (user?.subscriptionStartedAt) rows.push([t('billing_started'), formatDate(user.subscriptionStartedAt)]);
    if (user?.nextBillingDate) rows.push([t('billing_next'), formatDate(user.nextBillingDate)]);
    if (subscriptionRecord.subscription_expiry_date)
      rows.push([t('billing_expires'), formatDate(subscriptionRecord.subscription_expiry_date)]);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={close}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="billing-modal-title"
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-md sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-rule px-5 py-3 sm:px-6">
          <h2 id="billing-modal-title" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
            {t('billing_title')}
          </h2>
          <button
            onClick={close}
            aria-label={isKo ? '닫기' : 'Close'}
            className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
          >
            <X size={20} weight="bold" />
          </button>
        </div>

        <div className="custom-scrollbar flex-1 space-y-4 overflow-y-auto p-5 sm:p-6">
          {subscriptionRecord?.subscription_status === 'active' ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <p className="text-[17px] font-extrabold text-ink">{t('billing_active')}</p>
                {platformBadge()}
              </div>
              {rows.length > 0 && (
                <dl className="divide-y divide-rule rounded-md bg-sunken px-4">
                  {rows.map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between gap-3 py-3 text-[15px]">
                      <dt className="text-ink-2">{k}</dt>
                      <dd className="font-bold text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {user?.isCanceled && (
                <p className="rounded-md bg-line-soft p-3 text-[14px] font-semibold text-ink break-keep">
                  {t('billing_canceled_notice')}
                </p>
              )}
              {cancelInstructions()}
            </>
          ) : (
            <div className="py-2 text-center">
              <p className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">{t('sub_no_active')}</p>
              <p className="mt-1 text-[15px] text-ink-2 break-keep">
                {isKo ? '구독하면 채점을 횟수 제한 없이 쓸 수 있어요.' : 'Subscribe for unlimited grading and every premium feature.'}
              </p>
              <button
                onClick={() => {
                  onClose();
                  setShowPaywall(true);
                }}
                className="btn-press mt-5 flex min-h-12 w-full items-center justify-center rounded-md bg-line text-[15px] font-bold text-[#2b211a]"
              >
                {t('sub_subscribe_now')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
