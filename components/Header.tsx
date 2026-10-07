import React, { useState } from 'react';
import {
  House,
  ArrowRight,
  NotePencil,
  Lightbulb,
  CreditCard,
  GearSix,
  Sun,
  Moon,
  Question,
  SignOut,
} from '@phosphor-icons/react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { ChekkiMascot } from './Icons';
import { SettingsModal } from './SettingsModal';
import { BillingModal } from './BillingModal';
import { ProgressiveOnboardingModal } from './ProgressiveOnboardingModal';
import { LegalModal } from './LegalModal';
import { ASSETS } from '../constants';
import { SCREENSHOT_MODE } from '../config';
import { Capacitor } from '@capacitor/core';

interface Props {
  onReset: () => void;
  isNight: boolean;
  setIsNight: (val: boolean) => void;
  onOpenHelp?: () => void;
  onOpenDashboard?: () => void;
  isSpeedMode: boolean;
  setIsSpeedMode: (val: boolean) => void;
  showSpeedToggle?: boolean;
  // True while MobileAppBanner is showing above the page — pushes the
  // header's own fixed offset down so the banner doesn't cover the logo,
  // language toggle, and login button (Audit: banner covers header nav).
  pushedDownByBanner?: boolean;
}

export const Header: React.FC<Props> = ({
  onReset,
  isNight,
  setIsNight,
  isSpeedMode,
  setIsSpeedMode,
  showSpeedToggle,
  onOpenHelp,
  onOpenDashboard,
  pushedDownByBanner,
}) => {
  const { user, isAuthenticated, openLoginModal, logout, setShowPaywall } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { mistakes } = useMistakes();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ko' : 'en');
  };

  const handleLogout = () => {
    setShowUserMenu(false);
    logout();
    onReset();
  };

  // "Enter invite code" on the scan home dispatches this; Settings holds
  // the invite-code field.
  React.useEffect(() => {
    const open = () => setShowSettings(true);
    window.addEventListener('open-settings-class-code', open);
    return () => window.removeEventListener('open-settings-class-code', open);
  }, []);

  const ko = language === 'ko';
  const menuItem =
    'w-full text-left px-3 py-2.5 text-sm font-semibold text-ink-2 hover:bg-sunken hover:text-ink rounded flex items-center gap-3';

  const speedToggle = (wide: boolean) => (
    <div
      role="group"
      aria-label={ko ? '보기 방식' : 'View mode'}
      className={`flex items-center rounded-md bg-sunken p-0.5 ${wide ? 'w-full' : ''}`}
    >
      {[
        { on: !isSpeedMode, label: ko ? '튜터' : 'Tutor', set: false },
        { on: isSpeedMode, label: ko ? '스피드' : 'Speed', set: true },
      ].map((o) => (
        <button
          key={o.label}
          type="button"
          aria-pressed={o.on}
          onClick={(e) => {
            e.stopPropagation();
            setIsSpeedMode(o.set);
          }}
          className={`${wide ? 'flex-1' : ''} min-h-9 px-3 rounded text-[13px] font-bold transition-colors ${
            o.on ? 'bg-line text-[#2b211a]' : 'text-ink-3 hover:text-ink'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <>
      {showSettings && (
        <SettingsModal
          onClose={() => setShowSettings(false)}
          isNight={isNight}
          setIsNight={setIsNight}
        />
      )}
      {showBilling && <BillingModal onClose={() => setShowBilling(false)} isNight={isNight} />}
      {showOnboarding && (
        <ProgressiveOnboardingModal
          onComplete={() => setShowOnboarding(false)}
          onSkip={() => setShowOnboarding(false)}
          isNight={isNight}
          setIsNight={setIsNight}
          initialStep={6}
        />
      )}
      {showSupport && <LegalModal type="support" onClose={() => setShowSupport(false)} />}

      <header
        className={`fixed ${pushedDownByBanner ? 'top-[64px] md:top-0' : 'top-0'} inset-x-0 z-50 bg-ground border-b border-rule pt-[env(safe-area-inset-top)] transition-[top] duration-200`}
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-3 md:px-6">
          <button
            type="button"
            aria-label={t('tt_home')}
            title={t('tt_home')}
            onClick={onReset}
            className="flex min-w-0 items-center gap-2.5 rounded"
          >
            {/* text wordmark, same as the schools site */}
            <span className="text-[20px] font-extrabold tracking-[-0.02em] text-ink sm:text-[22px]">
              Chekki<span className="text-line">AI</span>
            </span>
          </button>

          <div className="flex items-center gap-2">
            {!Capacitor.isNativePlatform() && (
              <a
                href="/"
                className={`${showSpeedToggle && !(isAuthenticated && user) ? 'hidden sm:inline-flex' : 'inline-flex'} min-h-10 items-center gap-1.5 rounded-md px-2.5 text-[13px] font-semibold text-ink-2 hover:bg-sunken hover:text-ink`}
                title={ko ? '메인 랜딩페이지로 이동' : 'Back to main site'}
                aria-label={ko ? '메인으로' : 'Main site'}
              >
                <House weight="bold" size={16} />
                <span className="hidden sm:inline">{ko ? '메인으로' : 'Main site'}</span>
              </a>
            )}

            <div role="group" aria-label={ko ? '언어' : 'Language'} className="flex items-center rounded-md bg-sunken p-0.5">
              {(['ko', 'en'] as const).map((lng) => (
                <button
                  key={lng}
                  type="button"
                  aria-pressed={language === lng}
                  onClick={() => setLanguage(lng)}
                  className={`min-h-9 min-w-10 rounded px-2.5 text-[13px] font-bold transition-colors ${
                    language === lng ? 'bg-sign text-on-sign' : 'text-ink-3 hover:text-ink'
                  }`}
                >
                  {lng === 'ko' ? '한' : 'EN'}
                </button>
              ))}
            </div>

            {showSpeedToggle && !(isAuthenticated && user) && speedToggle(false)}

            {isAuthenticated && user ? (
              <div className="relative">
                <button
                  type="button"
                  aria-label={ko ? '계정 메뉴 열기' : 'Open account menu'}
                  aria-haspopup="true"
                  aria-expanded={showUserMenu}
                  title={user.name}
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-sign text-[15px] font-extrabold text-on-sign uppercase"
                >
                  {user.name.charAt(0)}
                  {user.plan === 'pro' && (
                    <span className="absolute -right-1 -bottom-1 rounded bg-line px-1 text-[10px] font-extrabold leading-4 text-[#2b211a]">
                      PRO
                    </span>
                  )}
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-md bg-surface shadow-[0_16px_40px_-12px_rgba(0,0,0,0.35)] ring-1 ring-rule animate-slide-down">
                      <div className="border-b border-rule px-4 py-3">
                        <p className="truncate text-[15px] font-bold text-ink">{user.name}</p>
                        <p className="truncate text-[13px] text-ink-3">{user.email}</p>
                        <p className="mt-1.5 text-[13px] font-semibold text-ink-2">
                          {user.plan === 'pro' ? 'Pro' : SCREENSHOT_MODE ? 'Standard' : ko ? '무료 플랜' : 'Free plan'}
                        </p>
                      </div>

                      {user.plan !== 'pro' && (
                        <div className="border-b border-rule p-2">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowPaywall(true);
                            }}
                            className="flex w-full items-center justify-between rounded bg-line px-3 py-2.5 text-sm font-bold text-[#2b211a]"
                          >
                            {ko ? '7일 무료 체험 시작' : 'Start 7-day free trial'}
                            <ArrowRight size={16} weight="bold" />
                          </button>
                        </div>
                      )}

                      {showSpeedToggle && <div className="border-b border-rule p-2">{speedToggle(true)}</div>}

                      <div className="space-y-0.5 p-2">
                        <button
                          className={`${menuItem} justify-between`}
                          onClick={() => {
                            setShowUserMenu(false);
                            onOpenDashboard?.();
                          }}
                        >
                          <span className="flex items-center gap-3">
                            <NotePencil size={18} weight="bold" className="text-ink-3" />
                            {t('tt_review_note')}
                          </span>
                          {mistakes.length > 0 && (
                            <span className="num rounded bg-wrong-soft px-1.5 text-xs font-bold text-wrong">{mistakes.length}</span>
                          )}
                        </button>
                        <button
                          className={menuItem}
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowOnboarding(true);
                          }}
                        >
                          <Lightbulb size={18} weight="bold" className="text-ink-3" />
                          {ko ? 'AI 설정' : 'AI settings'}
                        </button>
                        <button
                          className={menuItem}
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowBilling(true);
                          }}
                        >
                          <CreditCard size={18} weight="bold" className="text-ink-3" />
                          {t('nav_billing')}
                        </button>
                        <button
                          className={menuItem}
                          onClick={() => {
                            setShowUserMenu(false);
                            setShowSettings(true);
                          }}
                        >
                          <GearSix size={18} weight="bold" className="text-ink-3" />
                          {t('nav_settings')}
                        </button>
                        <button
                          className={menuItem}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsNight(!isNight);
                            setShowUserMenu(false);
                          }}
                        >
                          {isNight ? (
                            <Sun size={18} weight="bold" className="text-ink-3" />
                          ) : (
                            <Moon size={18} weight="bold" className="text-ink-3" />
                          )}
                          {isNight ? t('theme_light') : t('theme_dark')}
                        </button>
                        <button
                          className={menuItem}
                          onClick={() => {
                            setShowUserMenu(false);
                            if (onOpenHelp) onOpenHelp();
                            else setShowSupport(true);
                          }}
                        >
                          <Question size={18} weight="bold" className="text-ink-3" />
                          {ko ? '고객 지원' : 'Help & support'}
                        </button>
                      </div>

                      {/* sign-out sits alone, away from everything else */}
                      <div className="mt-2 border-t border-rule p-2">
                        <button
                          onClick={handleLogout}
                          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-left text-sm font-semibold text-wrong hover:bg-wrong-soft"
                        >
                          <SignOut size={18} weight="bold" />
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className="min-h-10 whitespace-nowrap rounded-md bg-sign px-4 text-[14px] font-bold text-on-sign"
              >
                {t('login')}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
