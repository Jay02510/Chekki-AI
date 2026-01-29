
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { FeedbackModal } from './FeedbackModal';
import { ASSETS } from '../constants';
import { db } from '../services/database';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, deleteAccount, upgradeToPro, firebaseUser, joinSchool } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [soundEffects, setSoundEffects] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Diagnostic States
  const [diagnostic, setDiagnostic] = useState({
    camera: 'checking...',
    mic: 'checking...',
    network: navigator.onLine ? 'online' : 'offline',
    browser: 'checking...'
  });

  // Admin Stats
  const [adminStats, setAdminStats] = useState<{ totalUsers: number, betaUsage: any } | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  const isAdmin = firebaseUser?.email === 'jsn.benjamin@gmail.com';

  useEffect(() => {
    if (user) setName(user.name);
    runDiagnostics();
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const runDiagnostics = async () => {
    const diag: any = { ...diagnostic };
    
    // Check Permissions
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      diag.camera = cam.state;
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      diag.mic = mic.state;
    } catch (e) {
      diag.camera = 'unsupported';
      diag.mic = 'unsupported';
    }

    // Check Environment
    const ua = navigator.userAgent.toLowerCase();
    if (/kakaotalk|naver|line|fbav|instagram/i.test(ua)) {
      diag.browser = 'In-App (Restricted)';
    } else {
      diag.browser = 'Standard (Optimal)';
    }

    setDiagnostic(diag);
  };

  const fetchAdminStats = async () => {
    setIsAdminLoading(true);
    const stats = await db.getSystemStats();
    if (stats) setAdminStats(stats);
    setIsAdminLoading(false);
  };

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleNativeShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chekki AI Flyer',
          text: `Check out Chekki AI - ${title}`,
          url: url,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          setSuccessMsg(t('res_copied'));
          setTimeout(() => setSuccessMsg(''), 2000);
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      setSuccessMsg(t('res_copied'));
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const FlyerItem = ({ title, thumb, pdf, dl }: { title: string, thumb: string, pdf: string, dl: string }) => (
    <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden group flex flex-col h-full max-w-xs mx-auto">
        <div className="relative aspect-[3/4.2] overflow-hidden shrink-0">
            <img 
              src={thumb} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-zinc-900" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/18181b/ffffff?text=Poster'; }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-4 backdrop-blur-sm">
                <a href={pdf} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black shadow-xl uppercase tracking-tighter hover:bg-zinc-200 transition-colors">View PDF</a>
            </div>
        </div>
        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
            <p className="text-[10px] font-black text-zinc-300 truncate uppercase tracking-widest text-center">{title}</p>
            <div className="flex gap-1.5">
                <a 
                    href={dl} 
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black py-2.5 rounded-lg text-center border border-white/10 transition-colors uppercase"
                >
                    {t('res_download')}
                </a>
                <button 
                    onClick={() => handleNativeShare(pdf, title)}
                    className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black py-2.5 rounded-lg border border-orange-500/20 transition-colors uppercase"
                >
                    {t('res_share')}
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
        
        <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
          
          <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-black text-white font-display">Settings</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
          </div>

          <div className="p-6 md:p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-20">
              
              {/* --- SYSTEM DIAGNOSTICS --- */}
              <div className="bg-zinc-800/50 rounded-3xl p-5 border border-white/5">
                <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4">Mobile System Health</h3>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Camera', val: diagnostic.camera, icon: '📷' },
                    { label: 'Mic', val: diagnostic.mic, icon: '🎤' },
                    { label: 'Network', val: diagnostic.network, icon: '🌐' },
                    { label: 'Env', val: diagnostic.browser, icon: '📱' }
                  ].map((d, i) => (
                    <div key={i} className="bg-black/40 p-3 rounded-xl border border-white/5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">{d.label}</p>
                      <p className="text-[10px] font-bold text-white truncate flex items-center gap-1.5">
                        <span className="opacity-70">{d.icon}</span> {d.val}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- ADMIN DASHBOARD --- */}
              {isAdmin && (
                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-3xl p-6 shadow-xl">
                   <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Admin Insights</h3>
                      </div>
                      <button onClick={fetchAdminStats} disabled={isAdminLoading} className="text-[10px] font-black text-indigo-400 uppercase">{isAdminLoading ? '...' : 'Refresh'}</button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Total Parents</p>
                        <div className="text-3xl font-black text-white">{adminStats?.totalUsers || 0}</div>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">CHEKKI40 Used</p>
                        <div className="text-3xl font-black text-orange-500">{adminStats?.betaUsage?.['CHEKKI40'] || 0}</div>
                      </div>
                   </div>
                </div>
              )}

              {/* --- READ MORE SECTION --- */}
              <div>
                  <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-4">{t('res_title')}</h3>
                  <div className="flex justify-center">
                      <FlyerItem title={t('res_flyer')} thumb={ASSETS.FLYER_THUMB} pdf={ASSETS.PDF_SHARE} dl={ASSETS.PDF_DOWNLOAD} />
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* --- PROFILE --- */}
              <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Account Profile</h3>
                  <div className="space-y-4">
                      <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">Display Name</label>
                      <input 
                          type="text" 
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-500 outline-none transition-colors"
                      />
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

              {/* --- PREFERENCES --- */}
              <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Preferences</h3>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-white">App Language</div>
                          <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                              <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'en' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>English</button>
                              <button onClick={() => setLanguage('ko')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'ko' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}>한국어</button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* --- DELETE --- */}
              <div>
                  {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center px-5 py-4 rounded-2xl border border-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest">Delete Account</button>
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

              <div className="sticky bottom-0 left-0 right-0 bg-zinc-900/90 backdrop-blur-md pt-4 pb-2 flex items-center justify-between">
                  <span className="text-emerald-500 text-xs font-black uppercase tracking-widest">{successMsg}</span>
                  <button onClick={handleSave} className="bg-white text-black px-8 py-3 rounded-2xl font-black text-sm active:scale-95 shadow-xl">Save Changes</button>
              </div>

          </div>
        </div>
      </div>
    </>
  );
};
