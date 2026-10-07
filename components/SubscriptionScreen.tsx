import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  subscriptionService,
  AppleProducts,
  GoogleProducts,
} from '../services/subscriptionService';
import { revenueCatService } from '../services/revenueCatService';
import { LegalModal } from './LegalModal';
import { AppleLogo } from './AppleLogo';
import { SCREENSHOT_MODE } from '../config';
import { Check, ChatCircleText, DeviceMobile, Lightbulb, MagicWand, Microphone, Sparkle } from '@phosphor-icons/react';

// ─── Sub-components ───────────────────────────────────────────────────────────

const getContextualCopy = (
  paywallContext: string | null,
  language: 'en' | 'ko',
  t: (key: string) => string
) => {
  if (paywallContext === 'moms_scripts') {
    return {
      headline:
        language === 'ko'
          ? '엄마표 티칭 스크립트 잠금 해제'
          : "Unlock Mom's Teaching Scripts",
      subtext:
        language === 'ko'
          ? '눈물 없이도 이 핵심 문법을 설명할 수 있는 단계별 이중언어 스크립트를 만나보세요.'
          : 'Get step-by-step, bilingual scripts to explain this exact grammar point without the tears.',
    };
  }
  if (paywallContext === 'guide') {
    return {
      headline: language === 'ko' ? '티칭 가이드 잠금 해제' : 'Unlock the Teaching Guide',
      subtext:
        language === 'ko'
          ? '정확하고 완벽한 해설과 가이드라인을 제공하여 아이를 안심하고 지도할 수 있습니다.'
          : 'Access complete guidelines, explanations, and key concepts to guide your child with absolute confidence.',
    };
  }
  if (
    paywallContext === 'speaking_coach' ||
    paywallContext === 'pronunciation' ||
    paywallContext === 'audio'
  ) {
    return {
      headline:
        language === 'ko'
          ? '원어민 발음 & 스피킹 코치 잠금 해제'
          : 'Unlock Speaking Coach & Audio',
      subtext:
        language === 'ko'
          ? '원어민의 생생한 음성을 듣고, 아이가 직접 말하며 실시간 발음 피드백을 받을 수 있습니다.'
          : 'Hear native pronunciations and let your child practice speaking with real-time feedback and rewards.',
    };
  }
  if (paywallContext === 'refinement') {
    return {
      headline: language === 'ko' ? 'AI 상세 설명 기능 잠금 해제' : 'Unlock AI Explanations',
      subtext:
        language === 'ko'
          ? '추가 질문을 통해 어떤 문제든 단계별로 깊이 있게 설명해주는 AI 튜터를 만나보세요.'
          : 'Ask follow-up questions and get detailed, customized explanations for any homework problem.',
    };
  }
  if (paywallContext === 'practice_sheet') {
    return {
      headline: language === 'ko' ? '복습 문제지 무제한 생성' : 'Unlock Practice Sheets',
      subtext:
        language === 'ko'
          ? '아이의 오답 패턴을 분석하여 맞춤형 복습 문제지를 즉시 생성하고 확인하세요.'
          : "Analyze your child's mistake patterns to instantly generate and print customized practice sheets.",
    };
  }
  return {
    headline: t('sub_trial_headline'),
    subtext: t('sub_trial_subtext'),
  };
};

const getWebContextualCopy = (
  paywallContext: string | null,
  language: 'en' | 'ko',
  t: (key: string) => string
) => {
  const defaultCopy = {
    headline: t('sub_webHeadline'),
    subtext: t('sub_webSubtext'),
  };
  if (!paywallContext) return defaultCopy;
  const details = getContextualCopy(paywallContext, language, t);
  return {
    headline: details.headline,
    subtext: `${details.subtext} ${language === 'ko' ? '모바일 앱에서 구독 후 즉시 이용하실 수 있습니다.' : 'Subscribe via our mobile app to unlock it instantly.'}`,
  };
};

const NativeSubscriptionView: React.FC<{ onClose?: () => void; isNight?: boolean }> = ({
  onClose,
  isNight = true,
}) => {
  const { processPayment, restorePurchases, paywallContext } = useAuth();
  const { language, t } = useLanguage();
  const [products, setProducts] = useState<any[]>([]);

  const platform = Capacitor.getPlatform();
  const isIOS = platform === 'ios';
  const defaultProduct = isIOS ? AppleProducts.YEARLY : GoogleProducts.YEARLY;
  const monthlyProductIdentifier = isIOS ? AppleProducts.MONTHLY : GoogleProducts.MONTHLY;
  const yearlyProductIdentifier = isIOS ? AppleProducts.YEARLY : GoogleProducts.YEARLY;

  const [selectedProduct, setSelectedProduct] = useState<string>(defaultProduct);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchProducts = async () => {
    setIsLoading(true);
    setError('');
    try {
      const p = isIOS
        ? await subscriptionService.fetchAppleProducts()
        : await subscriptionService.fetchAndroidProducts();
      if (p.length === 0) {
        setError(t('sub_load_error'));
      } else {
        setProducts(p);
      }
    } catch (err) {
      setError(t('sub_load_error'));
    } finally {
      setIsLoading(false);
      // Reset parent scrollable container scrollTop to 0 after loading completes
      setTimeout(() => {
        const scrollContainer = document.querySelector('.custom-scrollbar');
        if (scrollContainer) {
          scrollContainer.scrollTop = 0;
        }
      }, 50);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const monthlyProduct = products.find(
    (p) => (p.product?.identifier || p.identifier) === monthlyProductIdentifier
  );
  const yearlyProduct = products.find(
    (p) => (p.product?.identifier || p.identifier) === yearlyProductIdentifier
  );

  const handleSubscribe = async () => {
    setIsProcessing(true);
    setError('');

    // Find the full object (Package or StoreProduct) based on the selected identifier
    const productObj = products.find(
      (p) => (p.product?.identifier || p.identifier) === selectedProduct
    );

    const result = await processPayment(productObj || selectedProduct);
    if (!result.success) {
      // If the user cancelled, we don't show an error message.
      if (!result.userCancelled) {
        setError(result.message || t('sub_error'));
      }
    } else {
      onClose?.();
    }
    setIsProcessing(false);
  };

  const handleRestore = async () => {
    setIsProcessing(true);
    setError('');
    const result = await restorePurchases();
    if (result.success) {
      onClose?.();
    } else {
      setError(result.message || t('sub_error'));
    }
    setIsProcessing(false);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="w-10 h-10 border-4 border-line/30 border-t-line rounded-full animate-spin" />
        <p className="text-ink-3 text-[15px] font-semibold">{t('sub_loading')}</p>
      </div>
    );
  }

  if (error && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6">
        <p className="text-ink-2 text-[15px] max-w-xs break-keep">{error}</p>
        <button
          onClick={fetchProducts}
          className="btn-press px-8 min-h-12 rounded-md bg-surface ring-1 ring-inset ring-rule text-ink font-bold text-[15px] hover:ring-ink-3"
        >
          {t('sub_retry')}
        </button>
      </div>
    );
  }

  const features = ['bene_unlimited', 'bene_tutor', 'bene_scripts', 'bene_overlays', 'bene_pronounce', 'bene_anytime'];

  const getDisclosureText = (text: string) => {
    if (!isIOS) {
      return text
        .replace(/Apple ID/g, 'Google Play')
        .replace(/App Store/g, 'Google Play')
        .replace(/iTunes/g, 'Google Play');
    }
    return text;
  };

  return (
    <div className="space-y-5">
      <div className="text-center space-y-2 pb-2">
        <span className="inline-flex items-center rounded-full bg-line-soft px-3 py-1 text-[13px] font-bold text-line-ink">
          {language === 'ko' ? '7일 무료 체험' : '7-day free trial'}
        </span>
        <h2 className="text-[24px] md:text-[28px] font-extrabold tracking-[-0.02em] text-ink leading-tight break-keep">
          {getContextualCopy(paywallContext, language, t).headline}
        </h2>
        <p className="text-ink-2 text-[15px] leading-relaxed max-w-sm mx-auto break-keep">
          {getContextualCopy(paywallContext, language, t).subtext}
        </p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-2.5 sm:gap-x-6 rounded-md bg-sunken p-5">
        {features.map((key) => (
          <li key={key} className="flex items-start gap-2.5 text-[15px] font-semibold text-ink break-keep">
            <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-line-ink" />
            {t(key as any)}
          </li>
        ))}
      </ul>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-start">
        <button
          onClick={() => setSelectedProduct(yearlyProductIdentifier)}
          aria-pressed={selectedProduct === yearlyProductIdentifier}
          className={`text-left rounded-md p-5 transition-colors relative flex flex-col gap-1 lg:order-first ${
            selectedProduct === yearlyProductIdentifier
              ? 'bg-line-soft ring-2 ring-inset ring-line'
              : 'bg-surface ring-1 ring-inset ring-rule hover:ring-ink-3'
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-sign text-on-sign px-2.5 py-0.5 rounded-full font-bold">
              {t('sub_bestValue')}
            </span>
            <span className="text-xs bg-surface text-line-ink ring-1 ring-inset ring-line/40 px-2.5 py-0.5 rounded-full font-bold">
              {t('sub_trial_badge')}
            </span>
          </div>

          <p className="text-[14px] font-bold text-ink-2">
            {t('sub_yearly')}
          </p>

          <div className="flex items-baseline gap-1.5">
            <p
              className="font-extrabold text-ink text-[30px] num"
            >
              {SCREENSHOT_MODE
                ? t('sub_yearly')
                : yearlyProduct?.product?.priceString ||
                  yearlyProduct?.priceString ||
                  (language === 'ko' ? '₩99,000' : '$69.99')}
            </p>
            {!SCREENSHOT_MODE && (
              <p className="text-[14px] font-semibold text-ink-3">{t('sub_perYear')}</p>
            )}
          </div>

          {!SCREENSHOT_MODE && (
            <p className="text-[13px] text-line-ink font-bold mt-0.5">
              {t('sub_save_yearly')}
            </p>
          )}

          {selectedProduct === yearlyProductIdentifier && (
            <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-line text-[#2b211a] flex items-center justify-center">
              <Check size={14} weight="bold" />
            </span>
          )}
        </button>

        <button
          onClick={() => setSelectedProduct(monthlyProductIdentifier)}
          aria-pressed={selectedProduct === monthlyProductIdentifier}
          className={`text-left rounded-md p-5 transition-colors relative flex flex-col gap-1 ${
            selectedProduct === monthlyProductIdentifier
              ? 'bg-line-soft ring-2 ring-inset ring-line'
              : 'bg-surface ring-1 ring-inset ring-rule hover:ring-ink-3'
          }`}
        >
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-xs bg-surface text-line-ink ring-1 ring-inset ring-line/40 px-2.5 py-0.5 rounded-full font-bold">
              {t('sub_trial_badge')}
            </span>
          </div>
          <p className="text-[14px] font-bold text-ink-2">
            {t('sub_monthly')}
          </p>
          <div className="flex items-baseline gap-1">
            <p
              className="font-extrabold text-ink text-[26px] num"
            >
              {SCREENSHOT_MODE
                ? t('sub_monthly')
                : monthlyProduct?.product?.priceString ||
                  monthlyProduct?.priceString ||
                  (language === 'ko' ? '₩9,900' : '$6.99')}
            </p>
            {!SCREENSHOT_MODE && (
              <p className="text-[14px] font-semibold text-ink-3">{t('sub_perMonth')}</p>
            )}
          </div>

          {selectedProduct === monthlyProductIdentifier && (
            <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-line text-[#2b211a] flex items-center justify-center">
              <Check size={14} weight="bold" />
            </span>
          )}
        </button>
      </div>

      <div className="space-y-3">
        <button
          onClick={handleSubscribe}
          disabled={isProcessing}
          className="btn-press w-full min-h-14 rounded-md bg-line disabled:opacity-50 text-[#2b211a] font-extrabold text-[17px] flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <div className="w-5 h-5 border-[3px] border-[#2b211a]/25 border-t-[#2b211a] rounded-full animate-spin" />
          ) : (
            <>
              <span>{t('sub_cta_trial')}</span>
              <span className="text-[#2b211a]/70 text-[14px] font-bold">
                —{' '}
                {selectedProduct === yearlyProductIdentifier
                  ? language === 'ko'
                    ? '연간'
                    : 'Yearly'
                  : language === 'ko'
                    ? '월간'
                    : 'Monthly'}
              </span>
            </>
          )}
        </button>

        {error && (
          <p role="alert" className="text-center text-wrong text-[14px] font-semibold">
            {error}
          </p>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-y-1.5 gap-x-4 pt-1">
          {[
            { icon: '🔒', key: 'sub_trial_no_charge' },
            { icon: '✓', key: 'sub_cancelAnytimeSettings' },
            { icon: '↩', key: 'sub_trial_restore' },
          ].map((item) => (
            <span
              key={item.key}
              className="text-[13px] text-ink-3 font-semibold flex items-center gap-1"
            >
              <span aria-hidden="true">{item.icon}</span>
              {getDisclosureText(t(item.key as any))}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5">
        <button
          onClick={handleRestore}
          disabled={isProcessing}
          className="min-h-11 px-3 text-ink-2 hover:text-line-ink font-bold text-[14px] underline"
        >
          {t('sub_restore')}
        </button>

        <div className="rounded-md bg-sunken p-5 space-y-4 w-full">
          <p className="text-[13px] text-ink-3 leading-relaxed text-center break-keep">
            {getDisclosureText(t('sub_disclosure_trial'))}
          </p>

          <div className="flex justify-center gap-4 text-[13px] font-bold">
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('show-legal', { detail: 'privacy' }))
              }
              className="text-line-ink hover:underline"
            >
              {language === 'ko' ? '개인정보 처리방침' : 'Privacy Policy'}
            </button>
            <span className="text-rule" aria-hidden="true">|</span>
            <button
              onClick={() =>
                window.dispatchEvent(new CustomEvent('show-legal', { detail: 'terms' }))
              }
              className="text-line-ink hover:underline"
            >
              {language === 'ko' ? '이용약관' : 'Terms of Use'}
            </button>
          </div>
          <p className="text-xs text-ink-3 text-center">
            Subscription follows {isIOS ? 'Apple Standard EULA' : 'Google Play Terms of Service'}
          </p>
        </div>
      </div>
    </div>
  );
};

const WebSubscriptionView: React.FC<{ isNight?: boolean }> = () => {
  const { language, t } = useLanguage();
  const { paywallContext } = useAuth();
  const copy = getWebContextualCopy(paywallContext, language, t);

  const ContextIcon =
    paywallContext === 'moms_scripts' || paywallContext === 'refinement'
      ? ChatCircleText
      : paywallContext === 'guide'
        ? Lightbulb
        : paywallContext === 'speaking_coach' || paywallContext === 'pronunciation' || paywallContext === 'audio'
          ? Microphone
          : paywallContext === 'practice_sheet'
            ? MagicWand
            : paywallContext
              ? Sparkle
              : DeviceMobile;

  return (
    <div className="flex flex-col items-center text-center py-4">
      <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-line-soft text-line-ink">
        <ContextIcon size={30} weight="bold" />
      </span>
      <h3 className="mt-4 text-[20px] font-extrabold tracking-[-0.02em] text-ink leading-tight break-keep">{copy.headline}</h3>
      <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-ink-2 break-keep">{copy.subtext}</p>

      <a
        href="/subscribe"
        className="btn-press mt-6 flex min-h-12 w-full max-w-xs items-center justify-center rounded-md bg-line text-[15px] font-bold text-[#2b211a]"
      >
        {t('sub_webCta')}
      </a>
      <p className="mt-4 flex items-center gap-3 text-[13px] font-semibold text-ink-3">
        <span className="flex items-center gap-1">
          <AppleLogo className="w-3 h-3" /> iOS
        </span>
        <span className="text-rule" aria-hidden="true">|</span>
        <span>Android ({language === 'ko' ? '준비 중' : 'soon'})</span>
      </p>
    </div>
  );
};

// ─── Main Export ──────────────────────────────────────────────────────────────

interface Props {
  onClose?: () => void;
  isNight?: boolean;
}

export const SubscriptionScreen: React.FC<Props> = ({ onClose, isNight = true }) => {
  const { language, t } = useLanguage();
  const platform = Capacitor.getPlatform(); // 'ios' | 'android' | 'web'

  return (
    <div>
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-[13px] font-bold text-line-ink">{t('sub_title')}</p>
        <p className="mt-0.5 text-[15px] text-ink-2 break-keep">{t('sub_subtitle')}</p>
      </div>

      {/* Platform-specific content */}
      {platform === 'ios' && <NativeSubscriptionView onClose={onClose} isNight={isNight} />}
      {platform === 'android' && <NativeSubscriptionView onClose={onClose} isNight={isNight} />}
      {platform === 'web' && <WebSubscriptionView isNight={isNight} />}
    </div>
  );
};
