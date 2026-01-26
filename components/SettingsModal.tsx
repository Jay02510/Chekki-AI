
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { FeedbackModal } from './FeedbackModal';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, deleteAccount, upgradeToPro } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [betaError, setBetaError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleRedeem = async () => {
    setBetaError(false);
    const success = await upgradeToPro(betaCode);
    if (success) {
        setSuccessMsg('Upgraded to Pro! 🚀');
        setBetaCode('');
        setTimeout(() => setSuccessMsg(''), 5000);
    } else {
        setBetaError(true);
        setTimeout(() => setBetaError(false), 3000);
    }
  };

  const handleDelete = () => {
    deleteAccount();
    onClose();
  };

  return (
    <>
      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-800 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
          
          <div className="bg-zinc-950 px-6 py-4 border-b border-zinc-800 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-bold text-white font-display">Settings</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">✕</button>
          </div>

          <div className="p-6 space-y-8 overflow-y-auto custom-scrollbar">
              
              <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Account Profile</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Display Name</label>
                          <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-colors"
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-medium text-zinc-400 mb-1">Email Address</label>
                          <input 
                              type="email" 
                              value={user?.email || ''}
                              disabled
                              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                          />
                      </div>
                  </div>
              </div>

              {user?.plan !== 'pro' && (
                  <>
                    <div className="h-px bg-zinc-800"></div>
                    <div>
                        <h3 className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-4">Redeem Access Code</h3>
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={betaCode}
                                onChange={(e) => setBetaCode(e.target.value.toUpperCase())}
                                placeholder="Enter Beta Code"
                                className={`flex-1 bg-zinc-950 border ${betaError ? 'border-red-500' : 'border-zinc-700'} rounded-lg px-4 py-2 text-white focus:border-orange-500 outline-none transition-colors text-sm font-mono tracking-widest`}
                            />
                            <button 
                                onClick={handleRedeem}
                                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                            >
                                Redeem
                            </button>
                        </div>
                        {betaError && <p className="text-[10px] text-red-500 mt-1 font-bold">Invalid or limit reached.</p>}
                        <p className="text-[10px] text-zinc-600 mt-2">New Beta Code: CHEKKI40 (Limit: 40 users)</p>
                    </div>
                  </>
              )}

              <div className="h-px bg-zinc-800"></div>

              <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Support & Feedback</h3>
                  <div className="space-y-3">
                      <button 
                        onClick={() => setShowFeedback(true)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between group hover:border-orange-500 transition-colors"
                      >
                         <div className="flex items-center gap-3">
                            <span className="text-xl">💬</span>
                            <div className="text-left">
                               <div className="text-sm font-bold text-white">{t('fb_title')}</div>
                               <div className="text-[10px] text-zinc-500">Tell me how to improve!</div>
                            </div>
                         </div>
                         <span className="text-zinc-600 group-hover:text-orange-500 transition-colors">→</span>
                      </button>
                  </div>
              </div>

              <div className="h-px bg-zinc-800"></div>

              <div>
                  <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">Preferences</h3>
                  
                  <div className="space-y-4">
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="text-sm font-medium text-white">App Language</div>
                              <div className="text-xs text-zinc-500">Select interface language</div>
                          </div>
                          <div className="flex bg-zinc-950 rounded-lg p-1 border border-zinc-800">
                              <button onClick={() => setLanguage('en')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${language === 'en' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>English</button>
                              <button onClick={() => setLanguage('ko')} className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${language === 'ko' ? 'bg-zinc-700 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>한국어</button>
                          </div>
                      </div>

                      <div className="flex items-center justify-between">
                          <div>
                              <div className="text-sm font-medium text-white">Notifications</div>
                              <div className="text-xs text-zinc-500">Weekly homework reports</div>
                          </div>
                          <button onClick={() => setNotifications(!notifications)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${notifications ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${notifications ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between">
                          <div>
                              <div className="text-sm font-medium text-white">Sound Effects</div>
                              <div className="text-xs text-zinc-500">Audio feedback on tasks</div>
                          </div>
                          <button onClick={() => setSoundEffects(!soundEffects)} className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${soundEffects ? 'bg-orange-500' : 'bg-zinc-700'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white shadow transition-transform duration-300 ${soundEffects ? 'translate-x-6' : 'translate-x-0'}`}></div>
                          </button>
                      </div>
                  </div>
              </div>

              <div className="h-px bg-zinc-800"></div>

              <div>
                  <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider mb-4">Danger Zone</h3>
                  {!showDeleteConfirm ? (
                      <button 
                          onClick={() => setShowDeleteConfirm(true)}
                          className="w-full text-left px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-medium hover:bg-red-500/10 transition-colors"
                      >
                          Delete Account
                      </button>
                  ) : (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 animate-fade-in">
                          <p className="text-sm text-red-200 mb-3 font-bold">Are you sure? This cannot be undone.</p>
                          <div className="flex gap-3">
                              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md">Yes, Delete</button>
                              <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-md">Cancel</button>
                          </div>
                      </div>
                  )}
              </div>

              <div className="flex justify-center gap-6 text-[10px] text-zinc-600 pt-4">
                  <button onClick={() => setShowLegal('privacy')} className="hover:text-zinc-400">Privacy Policy</button>
                  <button onClick={() => setShowLegal('terms')} className="hover:text-zinc-400">Terms of Use (EULA)</button>
                  <a href="mailto:chekkihelp@gmail.com" className="hover:text-zinc-400">Support</a>
              </div>

              <div className="pt-2 flex items-center justify-between">
                  <span className="text-green-500 text-sm font-bold animate-fade-in">{successMsg}</span>
                  <button 
                      onClick={handleSave}
                      className="bg-white text-black hover:bg-zinc-200 px-6 py-2 rounded-lg font-bold transition-colors shadow-lg shadow-white/5"
                  >
                      Save Changes
                  </button>
              </div>

          </div>
        </div>
      </div>
    </>
  );
};
