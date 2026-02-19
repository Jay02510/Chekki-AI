
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { FeedbackModal } from './FeedbackModal';
import { db } from '../services/database';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, deleteAccount, firebaseUser, setShowPaywall } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Deep Diagnostics
  const [diagResults, setDiagResults] = useState({
    camera: '...',
    mic: '...',
    speech: '...',
    auth: '...'
  });

  useEffect(() => {
    if (user) setName(user.name);
    if (firebaseUser) {
      db.isAdmin(firebaseUser.uid).then(setIsAdmin);
    }
    runQuickDiag();
  }, [user, firebaseUser]);

  const runQuickDiag = async () => {
    const results: any = { ...diagResults };

    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      results.camera = cam.state;
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      results.mic = mic.state;
    } catch (e) {
      results.camera = 'restricted';
      results.mic = 'restricted';
    }

    results.speech = ('speechSynthesis' in window && 'webkitSpeechRecognition' in window) ? 'ready' : 'legacy';
    results.auth = firebaseUser ? 'verified' : 'anonymous';

    setDiagResults(results);
  };

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg('Settings saved!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

        <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-lg shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

          <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black text-white font-display uppercase tracking-widest">System Lab</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
          </div>

          <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-24">

            {/* --- ADMIN BADGE (Conditional) --- */}
            {isAdmin && (
              <div className="bg-purple-500/10 rounded-3xl p-6 border border-purple-500/30 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest leading-none mb-1">Admin Access</h3>
                  <p className="text-[10px] text-zinc-500 font-bold">System management enabled</p>
                </div>
                <span className="text-2xl">⚡</span>
              </div>
            )}

            {/* --- SECURITY AUDIT SECTION --- */}
            <div className="bg-emerald-500/5 rounded-3xl p-6 border border-emerald-500/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">🛡️</span>
                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest leading-none">{t('sec_audit_title')}</h3>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium mb-4 leading-relaxed">{t('sec_audit_desc')}</p>
              <div className="space-y-2">
                {[1, 2, 3, 4].map(idx => (
                  <div key={idx} className="flex items-center gap-2 text-[10px] text-zinc-300 font-bold">
                    <span className="text-emerald-500">✓</span>
                    {t(`sec_point_${idx}`)}
                  </div>
                ))}
              </div>
            </div>

            {/* --- ADVANCED DIAGNOSTICS --- */}
            <div className="bg-zinc-800/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4">
                <div className={`w-2 h-2 rounded-full ${diagResults.auth === 'verified' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-700'} animate-pulse`}></div>
              </div>

              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Device Diagnostics</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Camera', val: diagResults.camera === 'granted' ? 'OK' : 'Check', color: diagResults.camera === 'granted' ? 'text-emerald-400' : 'text-orange-400' },
                  { label: 'Mic', val: diagResults.mic === 'granted' ? 'OK' : 'Check', color: diagResults.mic === 'granted' ? 'text-emerald-400' : 'text-orange-400' },
                  { label: 'Voice API', val: diagResults.speech, color: 'text-indigo-400' },
                  { label: 'Auth', val: diagResults.auth, color: 'text-zinc-400' }
                ].map((d, i) => (
                  <div key={i} className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">{d.label}</p>
                    <p className={`text-xs font-black truncate ${d.color}`}>{d.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* --- BETA / PREMIUM ACCESS --- */}
            <div className="bg-orange-500/5 rounded-3xl p-6 border border-orange-500/20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest">{t('beta_access_title')}</h3>
                <span className="text-[9px] font-black text-orange-500/40 uppercase tracking-widest">{t('subs_coming_soon')}</span>
              </div>

              {user?.plan === 'pro' ? (
                <div className="bg-orange-500/10 rounded-2xl p-4 border border-orange-500/20 flex items-center gap-3">
                  <span className="text-xl">🚀</span>
                  <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">Pro Magic Active</p>
                    <p className="text-[9px] text-zinc-500 font-bold">Unlimited access during beta</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-[10px] text-zinc-400 font-medium leading-relaxed">
                    {language === 'ko'
                      ? "베타 기간 동안 초대 코드를 입력하여 무제한 기능을 사용해 보세요."
                      : "Unlock unlimited features for free during our beta period."}
                  </p>
                  <button
                    onClick={() => { onClose(); setShowPaywall(true); }}
                    className="w-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Redeem Beta Code
                  </button>
                </div>
              )}
            </div>

            {/* --- PROFILE --- */}
            <div>
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Parent Profile</h3>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Your Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-500 outline-none transition-colors"
                />
              </div>
            </div>

            {/* --- PREFERENCES --- */}
            <div>
              <div className="flex items-center justify-between">
                <div className="text-sm font-bold text-white">App Language</div>
                <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                  <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'en' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>EN</button>
                  <button onClick={() => setLanguage('ko')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'ko' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>KO</button>
                </div>
              </div>
            </div>

            <div className="h-px bg-white/5"></div>

            {/* --- LEGAL LINKS --- */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 py-2 border-t border-white/5 pt-6">
              <button
                onClick={() => setShowLegal('privacy')}
                className="text-[10px] text-zinc-500 hover:text-white font-bold transition-colors uppercase tracking-widest underline decoration-zinc-800"
              >
                Privacy Policy
              </button>
              <button
                onClick={() => setShowLegal('terms')}
                className="text-[10px] text-zinc-500 hover:text-white font-bold transition-colors uppercase tracking-widest underline decoration-zinc-800"
              >
                Terms of Service
              </button>
            </div>

            {/* --- DANGER ZONE --- */}
            <div>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center px-5 py-4 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">Delete Account</button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center justify-between">
                  <p className="text-[10px] text-red-200 font-black uppercase">Are you sure?</p>
                  <div className="flex gap-2">
                    <button onClick={deleteAccount} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg">Yes</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 text-[10px] font-black rounded-lg">No</button>
                  </div>
                </div>
              )}
            </div>

            <div className="sticky bottom-0 left-0 right-0 bg-zinc-900/95 backdrop-blur-md pt-4 pb-2 flex items-center justify-between border-t border-white/5">
              <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
              <button onClick={handleSave} className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm active:scale-95 shadow-2xl transition-all">Save Changes</button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
};
