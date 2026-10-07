import { X } from '@phosphor-icons/react';
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useLanguage } from '../contexts/LanguageContext';
import { AppleLogo } from './AppleLogo';
import { ChekkiMascot } from './Icons';

const BANNER_DISMISSED_KEY = 'chekki_banner_dismissed_until';
const APP_STORE_URL = 'https://apps.apple.com/app/id6741479840';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chekkiai.app'; // Placeholder

function detectMobilePlatform(): 'ios' | 'android' | null {
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';
  return null;
}

interface Props {
  // Lets the page shift fixed-position chrome (the Header) below this
  // banner instead of letting it get covered — the banner is taller than
  // Header's own top offset (Audit: mobile web banner covers header nav).
  onVisibilityChange?: (visible: boolean) => void;
}

/**
 * MobileAppBanner
 * Shown ONLY when platform === 'web' and the visitor is on a mobile device.
 * Dismissed state persists for 7 days via localStorage.
 */
export const MobileAppBanner: React.FC<Props> = ({ onVisibilityChange }) => {
  const { language } = useLanguage();
  const [show, setShow] = useState(false);
  const [mobilePlatform, setMobilePlatform] = useState<'ios' | 'android' | null>(null);

  // Only applies when Capacitor platform is 'web'
  const isWeb = Capacitor.getPlatform() === 'web';

  useEffect(() => {
    if (!isWeb) return;

    const detected = detectMobilePlatform();
    if (!detected) return; // Desktop — no banner

    const dismissedUntil = localStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissedUntil && Date.now() < parseInt(dismissedUntil)) return;

    setMobilePlatform(detected);
    setShow(true);
    onVisibilityChange?.(true);
  }, [isWeb]);

  const dismiss = () => {
    const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem(BANNER_DISMISSED_KEY, sevenDays.toString());
    setShow(false);
    onVisibilityChange?.(false);
  };

  if (!isWeb || !show || !mobilePlatform) return null;

  const storeUrl = mobilePlatform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
  const storeLabel =
    mobilePlatform === 'ios'
      ? language === 'ko'
        ? 'App Store에서 다운로드'
        : 'Download on the App Store'
      : language === 'ko'
        ? 'Google Play에서 다운로드'
        : 'Get it on Google Play';

  return (
    <div className="fixed top-0 left-0 right-0 z-[200] flex items-center gap-3 bg-sign px-4 py-2.5 text-on-sign animate-slide-down">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-line">
        <ChekkiMascot className="h-8 w-8" mood="happy" />
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px] font-bold">
          {language === 'ko' ? '앱으로 쓰면 더 편해요' : 'Easier in the ChekkiAI app'}
        </p>
        <p className="truncate text-[12px] text-on-sign-2">
          {language === 'ko' ? '구독은 앱에서만 할 수 있어요' : 'Subscriptions are app-only'}
        </p>
      </div>

      <a
        href={storeUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={storeLabel}
        className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-md bg-line px-3 text-[13px] font-bold text-[#2b211a]"
      >
        {mobilePlatform === 'ios' && <AppleLogo className="h-3.5 w-3.5" />}
        {language === 'ko' ? '받기' : 'Get'}
      </a>

      <button
        onClick={dismiss}
        aria-label={language === 'ko' ? '배너 닫기' : 'Dismiss banner'}
        className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center text-on-sign-2 hover:text-on-sign"
      >
        <X size={18} weight="bold" />
      </button>
    </div>
  );
};
