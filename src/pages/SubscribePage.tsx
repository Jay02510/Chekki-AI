import React, { useEffect, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const APP_STORE_URL = 'https://apps.apple.com/app/id6741479840';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chekkiai.app'; // Placeholder

// QR code for App Store (using a free QR code API)
const QR_CODE_URL = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(APP_STORE_URL)}`;

/**
 * /subscribe — Web-only subscription redirect page.
 * Guides web users to download the mobile app to subscribe.
 */
const SubscribePage: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  // Auto-detect browser language on mount
  useEffect(() => {
    const browserLang = navigator.language.toLowerCase();
    if (browserLang.startsWith('ko')) {
      setLanguage('ko');
    } else {
      setLanguage('en');
    }
  }, []);

  const isKo = language === 'ko';

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-4xl md:text-6xl font-black tracking-tight">
          Chekki<span className="text-orange-500">AI</span>
        </h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mt-2">
          Homework Helper
        </p>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-8 md:p-12 text-center shadow-[0_0_80px_rgba(249,115,22,0.1)] relative hover:border-orange-500/20 hover:-translate-y-1 transition-all duration-300 group">
        <div className="w-20 h-20 rounded-3xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-4xl mx-auto mb-6">
          📱
        </div>

        {/* Headline */}
        <h2 className="text-2xl md:text-3xl font-black text-white mb-3 leading-tight">
          {isKo
            ? 'ChekkiAI 프리미엄은\n모바일 앱에서 이용 가능합니다'
            : 'ChekkiAI Premium is available\non our mobile app'}
        </h2>

        <p className="text-zinc-400 text-sm leading-relaxed mb-8">
          {isKo
            ? '지금 앱을 다운로드하여 구독을 시작하세요'
            : 'Download the app to start your subscription today'}
        </p>

        {/* Store badges */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {/* App Store */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white text-black px-6 py-4 rounded-2xl font-black hover:bg-zinc-100 transition-all active:scale-95 shadow-lg"
          >
            <span className="text-3xl">🍎</span>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {isKo ? '다운로드' : 'Download on the'}
              </p>
              <p className="text-base font-black leading-none">App Store</p>
            </div>
          </a>

          {/* Google Play — placeholder */}
          <div
            className="flex items-center gap-3 bg-zinc-800 text-zinc-500 px-6 py-4 rounded-2xl cursor-not-allowed opacity-60"
            title={isKo ? '안드로이드 버전 출시 예정' : 'Android version coming soon'}
          >
            <span className="text-3xl">🤖</span>
            <div className="text-left">
              <p className="text-[10px] font-bold uppercase tracking-wider">
                {isKo ? '출시 예정' : 'Coming Soon'}
              </p>
              <p className="text-base font-black leading-none">Google Play</p>
            </div>
          </div>
        </div>

        {/* QR code for desktop */}
        <div className="hidden md:flex flex-col items-center gap-3 pt-6 border-t border-white/5">
          <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">
            {isKo ? 'QR 코드로 스캔하세요' : 'Scan to download on iPhone'}
          </p>
          <img
            src={QR_CODE_URL}
            alt="App Store QR Code"
            className="w-32 h-32 rounded-2xl border border-white/10 bg-white p-1"
          />
          <p className="text-[9px] text-zinc-600">App Store</p>
        </div>

        {/* Language toggle */}
        <div className="mt-8 flex justify-center">
          <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
            <button
              onClick={() => setLanguage('en')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${language === 'en' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ko')}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase ${language === 'ko' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
            >
              KO
            </button>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <p className="text-[10px] text-zinc-700 mt-10 text-center font-bold uppercase tracking-[0.2em]">
        © 2025 Chekki AI — {isKo ? '모바일 전용 구독' : 'Mobile App Subscriptions Only'}
      </p>
    </div>
  );
};

export default SubscribePage;
