
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { ChekkiMascot } from './Icons';
const CommunityModal = React.lazy(() => import('./CommunityModal').then(module => ({ default: module.CommunityModal })));
const SettingsModal = React.lazy(() => import('./SettingsModal').then(module => ({ default: module.SettingsModal })));
const BillingModal = React.lazy(() => import('./BillingModal').then(module => ({ default: module.BillingModal })));
const ProgressiveOnboardingModal = React.lazy(() => import('./ProgressiveOnboardingModal').then(module => ({ default: module.ProgressiveOnboardingModal })));
const LegalModal = React.lazy(() => import('./LegalModal').then(module => ({ default: module.LegalModal })));
import { ASSETS } from '../constants';
import { SCREENSHOT_MODE } from '../config';

interface Props {
  onReset: () => void;
  isNight: boolean;
  setIsNight: (val: boolean) => void;
  onOpenHelp?: () => void;
}

export const Header: React.FC<Props> = ({ onReset, isNight, setIsNight, onOpenHelp }) => {
  const { user, openLoginModal, logout } = useAuth();
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
      <React.Suspense fallback={null}>
        {showCommunity && <CommunityModal onClose={() => setShowCommunity(false)} isNight={isNight} />}
        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} isNight={isNight} setIsNight={setIsNight} />}
        {showBilling && <BillingModal onClose={() => setShowBilling(false)} isNight={isNight} />}
        {showOnboarding && <ProgressiveOnboardingModal onComplete={() => setShowOnboarding(false)} onSkip={() => setShowOnboarding(false)} isNight={isNight} />}
        {showSupport && <LegalModal type="support" onClose={() => setShowSupport(false)} />}
      </React.Suspense>

      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)]">
        <div className={`absolute inset-0 ${isNight ? 'bg-[#050505]/80 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-md'} border-b ${isNight ? 'border-white/5' : 'border-zinc-200/80 shadow-sm'}`}></div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between gap-2">

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
              <span className="text-[7px] md:text-[11px] lg:text-[13px] text-zinc-500 font-black tracking-widest md:tracking-[0.2em] uppercase mt-0.5 opacity-80 leading-tight truncate">
                {t('tagline')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 h-full flex-shrink-0">

            {/* Removed Notebook and Theme icons from here to reduce cognitive load */}

            <div className="flex items-center gap-2 md:gap-4">
              <div className={`flex items-center gap-1 md:gap-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-zinc-100 border-zinc-200'} p-1 rounded-full border`}>
                <button
                  onClick={() => setLanguage('en')}
                  className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-black transition-all ${language === 'en' ? (isNight ? 'bg-white text-black shadow-lg' : 'bg-zinc-900 text-white shadow-md') : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')} uppercase tracking-widest`}
                >
                  EN
                </button>
                <button
                  onClick={() => setLanguage('ko')}
                  className={`px-3 md:px-5 py-1.5 md:py-2.5 rounded-full text-[10px] md:text-xs font-black transition-all ${language === 'ko' ? (isNight ? 'bg-white text-black shadow-lg' : 'bg-zinc-900 text-white shadow-md') : (isNight ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600')} uppercase tracking-widest`}
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
                    <span className="text-xl md:text-2xl pt-1">👑</span>
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

                      <div className="p-2 space-y-1">
                        <button
                          onClick={() => { setShowUserMenu(false); setShowOnboarding(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          <span>💡</span> {language === 'ko' ? 'AI 설정' : 'AI Settings'}
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowBilling(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center justify-between group leading-tight`}
                        >
                          <div className="flex items-center gap-3">
                            <span>💳</span> {t('nav_billing')}
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
                          <span>💬</span> {language === 'ko' ? '고객 지원' : 'Help & Support'}
                        </button>
                        <button
                          onClick={() => { setShowUserMenu(false); setShowMistakeModal(true); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center justify-between group leading-tight`}
                        >
                          <div className="flex items-center gap-3">
                            <span>📝</span> {t('tt_review_note')}
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
                          <span>⚙️</span> {t('nav_settings')}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsNight(!isNight); setShowUserMenu(false); }}
                          className={`w-full text-left px-3 py-2 text-xs ${isNight ? 'text-zinc-300 hover:bg-zinc-800 hover:text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'} rounded-lg transition-colors flex items-center gap-3 leading-tight`}
                        >
                          <span>{isNight ? '☀️' : '🌙'}</span> {isNight ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                        </button>
                      </div>

                      <div className={`border-t ${isNight ? 'border-zinc-800' : 'border-zinc-100'} p-2`}>
                        <button
                          onClick={handleLogout}
                          className={`w-full text-left px-3 py-2 text-xs text-red-400 ${isNight ? 'hover:bg-red-500/10' : 'hover:bg-red-50'} hover:text-red-500 rounded-lg transition-colors flex items-center gap-3 font-medium leading-tight`}
                        >
                          <span>🚪</span> {t('logout')}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <button
                onClick={openLoginModal}
                className={`flex-shrink-0 ${isNight ? 'bg-white text-black hover:bg-zinc-200' : 'bg-zinc-900 text-white hover:bg-black'} px-3.5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-black font-display transition-all transform active:scale-95 shadow-lg whitespace-nowrap min-w-fit`}
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
