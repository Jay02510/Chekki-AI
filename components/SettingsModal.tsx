
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
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Admin Stats
  const [adminStats, setAdminStats] = useState<{ totalUsers: number, betaUsage: any } | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Developer Email Check
  const isAdmin = firebaseUser?.email === 'jsn.benjamin@gmail.com';

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

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
        // Only trigger clipboard fallback if it's a real error, not a user cancellation (AbortError)
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
    <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden group flex flex-col h-full">
        <div className="relative aspect-[3/4] overflow-hidden shrink-0">
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
            <p className="text-[10px] font-black text-zinc-300 truncate uppercase tracking-widest">{title}</p>
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
      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose}></div>
        
        <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
          
          <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-2xl font-black text-white font-display">Settings</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
          </div>

          <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar flex-1">
              
              {/* --- ADMIN DASHBOARD SECTION --- */}
              {isAdmin && (
                <div className="bg-indigo-600/10 border border-indigo-500/30 rounded-3xl p-6 animate-fade-in shadow-xl shadow-indigo-500/5">
                   <div className="flex items-center justify-between mb-5">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">📊</span>
                        <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest">Admin Insights</h3>
                      </div>
                      <button onClick={fetchAdminStats} disabled={isAdminLoading} className="text-[10px] font-black text-indigo-400 hover:text-white transition-colors uppercase">{isAdminLoading ? '...' : 'Refresh'}</button>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 tracking-wider">Total Parents</p>
                        <div className="text-3xl font-black text-white">{adminStats?.totalUsers || 0}</div>
                      </div>
                      <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                        <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1 tracking-wider">CHEKKI40 Used</p>
                        <div className="text-3xl font-black text-orange-500">{adminStats?.betaUsage?.['CHEKKI40'] || 0}</div>
                      </div>
                   </div>
                </div>
              )}

              {/* --- RESOURCE CENTER (Marketing Kit) --- */}
              <div>
                  <div className="flex items-center justify-between mb-5">
                    <div>
                        <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest mb-1">{t('res_title')}</h3>
                        <p className="text-[10px] text-zinc-500 font-medium">{t('res_subtitle')}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                      <FlyerItem 
                        title={t('res_kr')} 
                        thumb={ASSETS.FLYER_KR_THUMB} 
                        pdf={ASSETS.PDF_KR_SHARE} 
                        dl={ASSETS.PDF_KR_DOWNLOAD}
                      />
                      <FlyerItem 
                        title={t('res_en')} 
                        thumb={ASSETS.FLYER_EN_THUMB} 
                        pdf={ASSETS.PDF_EN_SHARE} 
                        dl={ASSETS.PDF_EN_DOWNLOAD}
                      />
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

              <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-5">Account Profile</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Display Name</label>
                          <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-orange-500 outline-none transition-colors font-medium"
                          />
                      </div>
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>
              <div>
                  <h3 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-5">Academy Partnership</h3>
                  {user?.schoolId ? (
                      <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-2xl p-5 flex items-center gap-4">
                          <div className="text-3xl">🏫</div>
                          <div>
                              <p className="text-sm font-black text-white">{user.schoolName}</p>
                              <p className="text-[10px] text-indigo-300 uppercase tracking-widest font-black opacity-60">Authorized Student Account</p>
                          </div>
                      </div>
                  ) : (
                      <div className="flex gap-2">
                          <input 
                              type="text" 
                              value={schoolCode}
                              onChange={(e) => setSchoolCode(e.target.value.toUpperCase())}
                              placeholder="Hagwon Code"
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded-2xl px-5 py-4 text-white focus:border-indigo-500 outline-none transition-colors text-xs font-mono tracking-widest"
                          />
                          <button onClick={() => joinSchool(schoolCode)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black text-xs transition-all active:scale-95 shadow-lg shadow-indigo-600/20">Link</button>
                      </div>
                  )}
              </div>

              <div className="h-px bg-white/5"></div>

              <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-5">Preferences</h3>
                  <div className="space-y-6">
                      <div className="flex items-center justify-between">
                          <div>
                              <div className="text-sm font-bold text-white">App Language</div>
                              <div className="text-[10px] text-zinc-500 font-medium">Select interface language</div>
                          </div>
                          <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                              <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${language === 'en' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>English</button>
                              <button onClick={() => setLanguage('ko')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${language === 'ko' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-400'}`}>한국어</button>
                          </div>
                      </div>
                      <div className="flex items-center justify-between">
                          <div className="text-sm font-bold text-white">Sound Effects</div>
                          <button onClick={() => setSoundEffects(!soundEffects)} className={`w-14 h-7 rounded-full p-1.5 transition-colors duration-300 ${soundEffects ? 'bg-orange-500' : 'bg-zinc-800'}`}>
                              <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-300 ${soundEffects ? 'translate-x-7' : 'translate-x-0'}`}></div>
                          </button>
                      </div>
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

              <div>
                  <h3 className="text-xs font-black text-red-500 uppercase tracking-widest mb-5">Danger Zone</h3>
                  {!showDeleteConfirm ? (
                      <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-left px-5 py-4 rounded-2xl border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-black uppercase tracking-widest hover:bg-red-500/10 transition-colors">Delete Account</button>
                  ) : (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center justify-between animate-fade-in">
                          <p className="text-[10px] text-red-200 font-black uppercase tracking-widest">Are you sure?</p>
                          <div className="flex gap-3">
                              <button onClick={deleteAccount} className="px-5 py-2.5 bg-red-600 text-white text-[10px] font-black rounded-xl uppercase hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">Yes, Delete</button>
                              <button onClick={() => setShowDeleteConfirm(false)} className="px-5 py-2.5 bg-zinc-800 text-zinc-300 text-[10px] font-black rounded-xl uppercase hover:bg-zinc-700 transition-colors">Cancel</button>
                          </div>
                      </div>
                  )}
              </div>

              <div className="pt-4 flex items-center justify-between">
                  <span className="text-emerald-500 text-xs font-black uppercase tracking-widest animate-fade-in">{successMsg}</span>
                  <button onClick={handleSave} className="bg-white text-black hover:bg-zinc-200 px-8 py-4 rounded-2xl font-black text-sm transition-all shadow-xl active:scale-95">Save Changes</button>
              </div>

          </div>
        </div>
      </div>
    </>
  );
};
