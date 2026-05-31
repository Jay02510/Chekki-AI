
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { ChekkiMascot } from './Icons';
import { CommunityModal } from './CommunityModal';
import { SettingsModal } from './SettingsModal';
import { BillingModal } from './BillingModal';
import { ProgressiveOnboardingModal } from './ProgressiveOnboardingModal';
import { LegalModal } from './LegalModal';
import { ASSETS } from '../constants';
import { SCREENSHOT_MODE } from '../config';

interface Props {
  onReset: () => void;
  isNight: boolean;
  setIsNight: (val: boolean) => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<Props> = ({ onReset, isNight, setIsNight, onOpenHelp }) => {
  const { user, openLoginModal, logout, setShowPaywall } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { setShowMistakeModal, mistakes } = useMistakes();

  const [showCommunity, setShowCommunity] = useState(false);
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

  return (
    <>
        {showCommunity && <CommunityModal onClose={() => setShowCommunity(false)} isNight={isNight} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isNight={isNight} setIsNight={setIsNight} />}
        {showBilling && <BillingModal onClose={() => setShowBilling(false)} isNight={isNight} />}
        {showOnboarding && <ProgressiveOnboardingModal onComplete={() => setShowOnboarding(false)} onSkip={() => setShowOnboarding(false)} isNight={isNight} />}
        {showSupport && <LegalModal type="support" onClose={() => setShowSupport(false)} />}

      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)]">
        <div className={`absolute inset-0 ${isNight ? 'bg-[#050505]/80 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-md'} border-b ${isNight ? 'border-white/5' : 'border-zinc-200/80 shadow-sm'}`}></div>

        <div className="relative max-w-7xl xl:max-w-[1440px] 2xl:max-w-[1600px] mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between gap-2">

          <div
            className="flex items-center cursor-pointer group h-full flex-shrink min-w-0"
            onClick={onReset}
            title={t('tt_home')}
          >
            {!logoError ? (
              <div className="relative w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20 flex-shrink-0">
                <img
                  src={ASSETS.LOGO}
                  alt="Chekki AI"
                  className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl filter brightness-110 scale-[1.15] md:scale-[1.25] origin-left"
                  onError={() => setLogoError(true)}
                />
              </div>
            ) : (
              <div className={`w-10 h-10 md:w-14 md:h-14 lg:w-20 lg:h-20 ${isNight ? 'bg-gradient-to-br from-orange-500 to-pink-500' : 'bg-orange-500'} rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300 flex-shrink-0`}>
                <ChekkiMascot className="w-8 h-8 lg:w-14 lg:h-14 text-white drop-shadow-md" mood="happy" />
              </div>
            )}

            <div className="flex flex-col justify-center relative z-10 pt-1 min-w-0 ml-2">
              <h1 className={`text-lg md:text-3xl lg:text-4xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} leading-none font-display tracking-tight group-hover:tracking-normal transition-all duration-300 truncate`}>
                Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
              </h1>
              <span className="text-[7px] md:text-[11px] lg:text-[13px] text-zinc-500 font-black tracking-normal md:tracking-wide uppercase mt-0.5 opacity-80 leading-tight truncate">
                {t('tagline')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 h-full flex-shrink-0">

            {/* Removed Notebook and Theme icons from here to reduce cognitive load */}

            <div className="flex items-center gap-2 md:gap-4">
              <div className={`relative flex items-center ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'} p-1 rounded-full border overflow-hidden`}>
                {/* Sliding indicator */}
                <div 
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full transition-all duration-300 ease-out shadow-sm ${
                    language === 'ko' ? 'translate-x-[calc(100%)]' : 'translate-x-0'
                  } ${isNight ? 'bg-white' : 'bg-zinc-900'}`}
                ></div>
                
                <button
                  onClick={() => setLanguage('en')}
                  className={`relative z-10 px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-black transition-colors duration-300 ${
                    language === 'en' ? (isNight ? 'text-black' : 'text-white') : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                  } uppercase tracking-widest`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ko')}
                  className={`relative z-10 px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-black transition-colors duration-300 ${
                    language === 'ko' ? (isNight ? 'text-black' : 'text-white') : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')
                  } uppercase tracking-widest`}
                >
                  KO
                </button>
              </div>

            {/* Removed Theme toggle from here */}
            </div>

            {user ? (
              <div className="flex items-center gap-4 pl-1 relative flex-shrink-0">
                <div
                  className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-bold border border-white/10 shadow-inner cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all uppercase select-none text-xs md:text-base"
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  title={user.name}
                >
                  {user.plan === 'pro' ? (
                    <svg className="w-5 h-5 md:w-6 md:h-6 drop-shadow-[0_2px_8px_rgba(245,158,11,0.5)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <linearGradient id="crownGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFE066" />
                          <stop offset="50%" stopColor="#F59E0B" />
                          <stop offset="100%" stopColor="#EC4899" />
                        </linearGradient>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="1" result="blur" />
                          <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                      </defs>
                      <path 
                        d="M2 17.5L5 8L9.5 13L12 4L14.5 13L19 8L22 17.5H2Z" 
                        fill="url(#crownGrad)"
                        stroke="#FFF"
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                      <path 
                        d="M2 17.5H22V20H2V17.5Z" 
                        fill="url(#crownGrad)"
                        opacity="0.9"
                      />
                      <circle cx="2" cy="17.5" r="1" fill="#FFF" />
                      <circle cx="22" cy="17.5" r="1" fill="#FFF" />
                      <circle cx="12" cy="4" r="1.5" fill="#FFF" filter="url(#glow)" />
                      <circle cx="5" cy="8" r="1.2" fill="#FFF" filter="url(#glow)" />
                      <circle cx="19" cy="8" r="1.2" fill="#FFF" filter="url(#glow)" />
                      <circle cx="9.5" cy="13" r="0.8" fill="#FFF" />
                      <circle cx="14.5" cy="13" r="0.8" fill="#FFF" />
                      <circle cx="6" cy="18.75" r="0.8" fill="#FFF" />
                      <circle cx="12" cy="18.75" r="0.8" fill="#FFF" />
                      <circle cx="18" cy="18.75" r="0.8" fill="#FFF" />
                    </svg>
                  ) : (
                    user.name.charAt(0)
                  )}
                </div>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className={`absolute right-0 top-12 md:top-14 w-60 ${isNight ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'} rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up origin-top-right ring-1 ${isNight ? 'ring-white/10' : 'ring-black/5'}`}>
                      <div className={`p-4 border-b ${isNight ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-100 bg-zinc-50'} text-left`}>
                        <p className={`font-bold truncate font-display leading-tight ${isNight ? 'text-white' : 'text-zinc-900'}`}>{user.name}</p>
                        <p className="text-[10px] text-zinc-500 truncate mb-2 leading-tight">{user.email}</p>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.plan === 'pro' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : (isNight ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-zinc-100 text-zinc-500 border border-zinc-200')}`}>
                            {user.plan === 'pro' ? 'PRO' : (SCREENSHOT_MODE ? 'STANDARD' : 'FREE')}
                          </span>
                        </div>
                      </div>

                      {user.plan !== 'pro' && (
                        <div className="px-3 pt-3 pb-1.5 border-b border-zinc-100 dark:border-zinc-800">
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              setShowPaywall(true);
                            }}
                            className="w-full py-2 px-3 rounded-lg text-[10px] md:text-xs font-black text-white bg-gradient-to-r from-orange-500 via-pink-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-md shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-1.5 animate-pulse"
                          >
                            <span>🚀</span>
                            <span>{language === 'ko' ? '7일 무료 체험 시작' : 'Start 7-Day Free Trial'}</span>
                          </button>
                        </div>
                      )}

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setShowUserMenu(false); setShowOnboarding(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.189m-1.5.189a6.01 6.01 0 0 1-1.5-.189m3.75 7.478a12.06 12.06 0 0 1-4.5 0m3.75 2.383a14.406 14.406 0 0 1-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 1 0-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" /></svg>
                          {language === 'ko' ? 'AI 설정' : 'AI Settings'}
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowBilling(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center justify-between group leading-tight`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" /></svg>
                            {t('nav_billing')}
                          </div>
                        </button>
                        <button
                          onClick={() => { 
                            setShowUserMenu(false); 
                            if (onOpenHelp) onOpenHelp();
                            else setShowSupport(true);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" /></svg>
                          {language === 'ko' ? '고객 지원' : 'Help & Support'}
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowMistakeModal(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center justify-between group leading-tight`}
                        >
                          <div className="flex items-center gap-3">
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" /></svg>
                            {t('tt_review_note')}
                          </div>
                          {mistakes.length > 0 && (
                            <span className="bg-red-500 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold">
                              {mistakes.length}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowSettings(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                          {t('nav_settings')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNight(!isNight); setShowUserMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          {isNight ? (
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" /></svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z" /></svg>
                          )}
                          {isNight ? t('theme_light') : t('theme_dark')}
                        </button>
                      </div>

                      <div className={`border-t ${isNight ? 'border-zinc-800' : 'border-zinc-100'} p-2`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-3 py-2 text-xs text-red-400 ${isNight ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} hover:text-red-500 rounded-lg transition-colors flex items-center gap-3 font-medium leading-tight`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 9V5.25A2.25 2.25 0 0 1 10.5 3h6a2.25 2.25 0 0 1 2.25 2.25v13.5A2.25 2.25 0 0 1 16.5 21h-6a2.25 2.25 0 0 1-2.25-2.25V15m-3 0-3-3m0 0 3-3m-3 3H15" /></svg>
                          {t('logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={openLoginModal}
                  className={`flex-shrink-0 ${isNight ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'} px-3.5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-black font-display transition-all transform active:scale-95 shadow-lg whitespace-nowrap min-w-fit`}
                >
                  {t('login')}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
