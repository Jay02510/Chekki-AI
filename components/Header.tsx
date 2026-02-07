
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useMistakes } from '../contexts/MistakeContext';
import { ChekkiMascot } from './Icons';
import { CommunityModal } from './CommunityModal';
import { SettingsModal } from './SettingsModal';
import { BillingModal } from './BillingModal';
import { ASSETS } from '../constants';

interface Props {
  onReset: () => void;
}

export const Header: React.FC<Props> = ({ onReset }) => {
  const { user, openLoginModal, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { setShowMistakeModal, mistakes } = useMistakes();
  
  const [showCommunity, setShowCommunity] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showBilling, setShowBilling] = useState(false);
  const [logoError, setLogoError] = useState(false);

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
      {showCommunity && <CommunityModal onClose={() => setShowCommunity(false)} />}
      {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      {showBilling && <BillingModal onClose={() => setShowBilling(false)} />}
      
      <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 pt-[env(safe-area-inset-top)]">
        <div className="absolute inset-0 bg-[#050505]/80 backdrop-blur-xl border-b border-white/5"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-24 flex items-center justify-between gap-2">
          
          <div 
            className="flex items-center cursor-pointer group h-full flex-shrink min-w-0" 
            onClick={onReset}
          >
            {!logoError ? (
              <div className="relative w-12 h-12 md:w-32 md:h-32 flex-shrink-0">
                  <img 
                    src={ASSETS.LOGO} 
                    alt="Chekki AI" 
                    className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-full object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-2xl filter brightness-110"
                    onError={() => setLogoError(true)} 
                  />
              </div>
            ) : (
              <div className="w-10 h-10 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20 group-hover:scale-105 transition-transform duration-300 flex-shrink-0">
                 <ChekkiMascot className="w-6 h-6 text-white drop-shadow-md" mood="happy" />
              </div>
            )}
            
            <div className="flex flex-col justify-center -ml-1 md:-ml-10 relative z-10 pt-1 min-w-0">
              <h1 className="text-lg md:text-3xl font-black text-white leading-none font-display tracking-tight group-hover:tracking-normal transition-all duration-300 truncate">
                Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
              </h1>
              <span className="text-[7px] md:text-[11px] text-zinc-500 font-black tracking-widest md:tracking-[0.2em] uppercase mt-0.5 opacity-80 leading-tight truncate">
                {t('tagline')}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 md:gap-4 h-full flex-shrink-0">
            {user && (
              <div className="flex items-center gap-1.5 md:gap-2">
                 <button 
                  onClick={() => setShowCommunity(true)}
                  className="hidden sm:flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                  title="Mom's Lounge"
                 >
                   <span>☕</span>
                 </button>

                 <button 
                   onClick={() => setShowMistakeModal(true)}
                   className="relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
                   title="Review Note"
                 >
                   <span>📝</span>
                   {mistakes.length > 0 && (
                     <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] md:text-[9px] w-3.5 h-3.5 md:w-4 md:h-4 flex items-center justify-center rounded-full font-bold shadow-lg shadow-red-500/50">
                       {mistakes.length}
                     </span>
                   )}
                 </button>
              </div>
            )}

            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2 py-1.5 md:px-2.5 md:py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-white/10 transition-colors group flex-shrink-0"
            >
              <span className={`text-[9px] md:text-xs font-bold font-display transition-colors ${language === 'en' ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>EN</span>
              <div className="w-px h-2.5 bg-white/20"></div>
              <span className={`text-[9px] md:text-xs font-bold font-display transition-colors ${language === 'ko' ? 'text-white' : 'text-zinc-600 group-hover:text-zinc-400'}`}>KO</span>
            </button>

            {user ? (
              <div className="flex items-center gap-4 pl-1 relative flex-shrink-0">
                <div 
                  className="h-8 w-8 md:h-10 md:w-10 bg-gradient-to-br from-zinc-800 to-zinc-700 rounded-full flex items-center justify-center text-zinc-300 font-bold border border-white/10 shadow-inner cursor-pointer hover:ring-2 hover:ring-orange-500/50 transition-all uppercase select-none text-xs md:text-base" 
                  onClick={() => setShowUserMenu(!showUserMenu)} 
                >
                  {user.name.charAt(0)}
                </div>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)}></div>
                    <div className="absolute right-0 top-12 md:top-14 w-60 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-fade-in-up origin-top-right ring-1 ring-white/10">
                       <div className="p-4 border-b border-zinc-800 bg-zinc-900/50 text-left">
                          <p className="text-white font-bold truncate font-display leading-tight">{user.name}</p>
                          <p className="text-[10px] text-zinc-500 truncate mb-2 leading-tight">{user.email}</p>
                          <div className="flex items-center gap-2">
                             <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${user.plan === 'pro' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/20' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'}`}>
                                {user.plan === 'pro' ? 'PRO' : 'FREE'}
                             </span>
                          </div>
                       </div>
                       
                       <div className="p-2 space-y-1">
                          <button 
                            onClick={() => { setShowUserMenu(false); setShowSettings(true); }}
                            className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors flex items-center gap-3 leading-tight"
                          >
                             <span>⚙️</span> Settings
                          </button>
                           <button 
                             onClick={() => { setShowUserMenu(false); setShowBilling(true); }}
                             className="w-full text-left px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white rounded-lg transition-colors flex items-center gap-3 leading-tight"
                           >
                             <span>💳</span> Billing
                          </button>
                       </div>

                       <div className="border-t border-zinc-800 p-2">
                          <button 
                             onClick={handleLogout}
                             className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors flex items-center gap-3 font-medium leading-tight"
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
                className="flex-shrink-0 bg-white text-black px-3.5 py-2 md:px-6 md:py-2.5 rounded-full text-[10px] md:text-sm font-black font-display hover:bg-zinc-200 transition-all transform active:scale-95 shadow-lg shadow-white/5 whitespace-nowrap min-w-fit"
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
