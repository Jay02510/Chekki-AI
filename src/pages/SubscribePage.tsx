import React, { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { AppleLogo, GooglePlayLogo, ArrowLeft } from '@phosphor-icons/react';
import { createQrSvgDataUrl } from '../utils/qrCode';

const APP_STORE_URL = 'https://apps.apple.com/app/id6741479840';
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.chekkiai.app';

/** QR code with graceful fallback that does not depend on a third-party API. */
const QRCodeWithFallback: React.FC<{ url: string }> = ({ url }) => {
  const [failed, setFailed] = useState(false);
  const qrDataUrl = useMemo(() => createQrSvgDataUrl(url), [url]);

  if (failed) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="w-28 h-28 rounded-2xl border border-white/10 bg-zinc-900 flex items-center justify-center text-center text-[10px] font-bold text-orange-400 p-2 hover:bg-zinc-800 transition-colors"
      >
        📱 Tap to open App Store
      </a>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="App Store QR Code"
      className="w-28 h-28 rounded-2xl border border-white/10 bg-white p-1"
      onError={() => setFailed(true)}
    />
  );
};

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

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark text-white flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-orange-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Navigation Top Bar / Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <button
          type="button"
          onClick={handleBack}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-bold text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>{isKo ? '뒤로 가기' : 'Back'}</span>
        </button>
      </div>

      {/* Logo */}
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Chekki<span className="text-orange-500">AI</span>
        </h1>
        <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.3em] mt-1.5">
          Homework Helper
        </p>
      </div>

      {/* Main card */}
      <div className="bg-zinc-900 border border-white/10 rounded-3xl max-w-lg w-full p-8 md:p-10 text-center shadow-[0_0_80px_rgba(249,115,22,0.1)] relative hover:border-orange-500/20 transition-all duration-200 group">
        <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-3xl mx-auto mb-6 text-orange-500">
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
            ? 'App Store 및 Google Play Store에서 체키 앱을 다운로드하여 구독을 진행해 보세요.'
            : 'Download the official app on App Store or Google Play Store to start your subscription today.'}
        </p>

        {/* Store badges */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          {/* App Store */}
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-white text-black px-6 py-3.5 rounded-2xl font-black hover:bg-zinc-100 transition-all active:scale-[0.97] shadow-lg flex-1"
          >
            <AppleLogo size={28} weight="fill" className="text-black shrink-0" />
            <div className="text-left">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                {isKo ? '다운로드' : 'Download on the'}
              </p>
              <p className="text-sm font-black leading-none mt-0.5">App Store</p>
            </div>
          </a>

          {/* Google Play */}
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/15 border border-white/20 text-white px-6 py-3.5 rounded-2xl font-black transition-all active:scale-[0.97] shadow-lg flex-1"
          >
            <GooglePlayLogo size={26} weight="fill" className="text-emerald-400 shrink-0" />
            <div className="text-left">
              <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-400">
                {isKo ? '다운로드' : 'Get it on'}
              </p>
              <p className="text-sm font-black leading-none mt-0.5">Google Play</p>
            </div>
          </a>
        </div>

        {/* QR code for desktop */}
        <div className="hidden md:flex flex-col items-center gap-3 pt-6 border-t border-white/5">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            {isKo ? 'iPhone / Android QR 코드로 스캔' : 'Scan to download on mobile'}
          </p>
          <QRCodeWithFallback url={APP_STORE_URL} />
          <p className="text-[9px] text-zinc-500">iOS &amp; Android App Store</p>
        </div>

        {/* Language toggle */}
        <div className="mt-6 flex justify-center">
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

      {/* Footer & Business Info */}
      <footer className="mt-12 text-center text-xs text-zinc-500 space-y-4 max-w-lg w-full border-t border-white/10 pt-8">
        <div className="space-y-1 text-[11px] text-zinc-400">
          <p>
            <span><strong>{isKo ? '상호:' : 'Company:'}</strong> 채키 AI (Chekki AI)</span> | {' '}
            <span><strong>{isKo ? '대표자:' : 'Representative:'}</strong> Benjamin Jason</span>
          </p>
          <p>
            <span><strong>{isKo ? '사업자번호:' : 'Biz Reg No:'}</strong> 814-14-03096</span> | {' '}
            <span><strong>{isKo ? '이메일:' : 'Email:'}</strong> support@chekkiai.com</span>
          </p>
        </div>

        <div className="flex justify-center gap-4 text-[11px] font-bold text-zinc-400">
          <a href="/privacy" onClick={(e) => { e.preventDefault(); window.location.href = '/privacy'; }} className="hover:text-orange-400">
            {isKo ? '개인정보처리방침' : 'Privacy Policy'}
          </a>
          <span>|</span>
          <a href="/terms" onClick={(e) => { e.preventDefault(); window.location.href = '/terms'; }} className="hover:text-orange-400">
            {isKo ? '이용약관' : 'Terms of Service'}
          </a>
          <span>|</span>
          <a href="/refund" onClick={(e) => { e.preventDefault(); window.location.href = '/refund'; }} className="hover:text-orange-400">
            {isKo ? '환불정책' : 'Refund Policy'}
          </a>
        </div>

        <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest pt-2">
          © {new Date().getFullYear()} Chekki AI — {isKo ? '모바일 전용 구독' : 'Mobile App Subscriptions Only'}
        </p>
      </footer>
    </div>
  );
};

export default SubscribePage;
