
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

/**
 * MobileAppBanner
 * Shown ONLY when platform === 'web' and the visitor is on a mobile device.
 * Dismissed state persists for 7 days via localStorage.
 */
export const MobileAppBanner: React.FC = () => {
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
    }, [isWeb]);

    const dismiss = () => {
        const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
        localStorage.setItem(BANNER_DISMISSED_KEY, sevenDays.toString());
        setShow(false);
    };

    if (!isWeb || !show || !mobilePlatform) return null;

    const storeUrl = mobilePlatform === 'ios' ? APP_STORE_URL : PLAY_STORE_URL;
    const storeLabel = mobilePlatform === 'ios'
        ? (language === 'ko' ? 'App Store에서 다운로드' : 'Download on the App Store')
        : (language === 'ko' ? 'Google Play에서 다운로드' : 'Get it on Google Play');

    return (
        <div className="fixed top-0 left-0 right-0 z-[200] bg-zinc-900 border-b border-white/10 px-4 py-3 flex items-center gap-3 shadow-xl animate-fade-in">
            {/* App icon */}
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg">
                <ChekkiMascot className="w-8 h-8" mood="happy" />
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className="text-white font-black text-xs truncate">
                    {language === 'ko' ? 'ChekkiAI를 앱으로 이용하세요' : 'Get the full experience on ChekkiAI app'}
                </p>
                <p className="text-zinc-500 text-[10px] truncate">
                    {language === 'ko' ? '앱에서만 구독이 가능합니다' : 'Subscription is only available in the app'}
                </p>
            </div>

            {/* Store link */}
            <a
                href={storeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-black px-3 py-2 rounded-xl transition-colors whitespace-nowrap"
            >
                {mobilePlatform === 'ios' ? <AppleLogo className="w-4 h-4" /> : '🤖'} {language === 'ko' ? '다운로드' : 'Download'}
            </a>

            {/* Dismiss */}
            <button
                onClick={dismiss}
                aria-label="Dismiss banner"
                className="shrink-0 text-zinc-600 hover:text-white text-lg transition-colors p-1"
            >
                ✕
            </button>
        </div>
    );
};
