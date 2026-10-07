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
        className="w-28 h-28 rounded-md bg-sunken ring-1 ring-inset ring-rule flex items-center justify-center text-center text-[13px] font-bold text-line-ink p-2"
      >
        App Store
      </a>
    );
  }

  return (
    <img
      src={qrDataUrl}
      alt="App Store QR Code"
      className="w-28 h-28 rounded-md ring-1 ring-rule bg-white p-1"
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

  const segment = (on: boolean) =>
    `min-h-10 rounded px-4 text-[14px] font-bold ${on ? 'bg-sign text-on-sign dark:bg-ink dark:text-ground' : 'text-ink-2 hover:text-ink'}`;

  return (
    <div className="font-warm min-h-screen bg-ground tile-ground text-ink flex flex-col items-center px-4 pb-12 pt-[calc(env(safe-area-inset-top)+12px)]">
      <div className="flex w-full max-w-lg items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="-ml-2 flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-ink-2 hover:text-ink"
        >
          <ArrowLeft size={18} weight="bold" />
          {isKo ? '뒤로' : 'Back'}
        </button>
        <div className="flex rounded-md bg-sunken p-0.5" role="group" aria-label={isKo ? '언어' : 'Language'}>
          <button onClick={() => setLanguage('ko')} aria-pressed={isKo} className={segment(isKo)}>
            한국어
          </button>
          <button onClick={() => setLanguage('en')} aria-pressed={!isKo} className={segment(!isKo)}>
            English
          </button>
        </div>
      </div>

      <div className="mt-8 w-full max-w-lg rounded-lg bg-surface p-6 text-center ring-1 ring-inset ring-rule sm:p-8">
        <img src="/images/chekki-wave.webp" alt="" className="mx-auto h-24 w-24 object-contain" />
        <p className="mt-3 text-[17px] font-extrabold tracking-[-0.02em] text-ink">
          Chekki<span className="text-line">AI</span> Premium
        </p>
        <h1 className="mt-2 whitespace-pre-line text-[24px] font-extrabold leading-tight tracking-[-0.02em] text-ink sm:text-[28px] break-keep">
          {isKo ? '구독은 모바일 앱에서\n할 수 있어요' : 'Subscribe in\nthe mobile app'}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink-2 break-keep">
          {isKo
            ? '체키 앱을 받아서 7일 무료 체험을 시작하세요. 웹에서 쓰던 계정 그대로 로그인하면 돼요.'
            : 'Get the Chekki app and start the 7-day free trial. Sign in with the same account you use here.'}
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={APP_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md bg-sign px-5 text-on-sign dark:bg-ink dark:text-ground"
          >
            <AppleLogo size={26} weight="fill" className="shrink-0" />
            <span className="text-left">
              <span className="block text-[12px] font-semibold opacity-80">{isKo ? '다운로드' : 'Download on the'}</span>
              <span className="block text-[16px] font-extrabold leading-none">App Store</span>
            </span>
          </a>
          <a
            href={PLAY_STORE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-press flex min-h-14 flex-1 items-center justify-center gap-3 rounded-md bg-surface px-5 text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
          >
            <GooglePlayLogo size={24} weight="fill" className="shrink-0" />
            <span className="text-left">
              <span className="block text-[12px] font-semibold text-ink-3">{isKo ? '다운로드' : 'Get it on'}</span>
              <span className="block text-[16px] font-extrabold leading-none">Google Play</span>
            </span>
          </a>
        </div>

        {/* QR code for desktop */}
        <div className="mt-6 hidden flex-col items-center gap-2 border-t border-rule pt-6 md:flex">
          <p className="text-[14px] font-semibold text-ink-2">
            {isKo ? '휴대폰 카메라로 찍으면 App Store가 열려요' : 'Scan with your phone camera to open the App Store'}
          </p>
          <QRCodeWithFallback url={APP_STORE_URL} />
        </div>
      </div>

      {/* Footer & Business Info */}
      <footer className="mt-10 w-full max-w-lg space-y-3 text-center text-[12px] text-ink-3">
        <div className="space-y-1">
          <p>
            <span><strong>{isKo ? '상호:' : 'Company:'}</strong> 채키 AI (Chekki AI)</span> | {' '}
            <span><strong>{isKo ? '대표자:' : 'Representative:'}</strong> Benjamin Jason</span>
          </p>
          <p>
            <span><strong>{isKo ? '사업자번호:' : 'Biz Reg No:'}</strong> 814-14-03096</span> | {' '}
            <span><strong>{isKo ? '이메일:' : 'Email:'}</strong> support@chekkiai.com</span>
          </p>
        </div>

        <div className="flex justify-center gap-4 font-semibold">
          <a href="/privacy" onClick={(e) => { e.preventDefault(); window.location.href = '/privacy'; }} className="underline hover:text-ink">
            {isKo ? '개인정보처리방침' : 'Privacy Policy'}
          </a>
          <span>|</span>
          <a href="/terms" onClick={(e) => { e.preventDefault(); window.location.href = '/terms'; }} className="underline hover:text-ink">
            {isKo ? '이용약관' : 'Terms of Service'}
          </a>
          <span>|</span>
          <a href="/refund" onClick={(e) => { e.preventDefault(); window.location.href = '/refund'; }} className="underline hover:text-ink">
            {isKo ? '환불정책' : 'Refund Policy'}
          </a>
        </div>

        <p className="pt-1">
          © {new Date().getFullYear()} Chekki AI — {isKo ? '모바일 전용 구독' : 'Mobile App Subscriptions Only'}
        </p>
      </footer>
    </div>
  );
};

export default SubscribePage;
