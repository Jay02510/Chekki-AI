
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
  const { user, updateProfile, deleteAccount, firebaseUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Deep Diagnostics
  const [isRunningDiag, setIsRunningDiag] = useState(false);
  const [diagResults, setDiagResults] = useState({
    camera: '...',
    mic: '...',
    apiLatency: '...',
    speech: '...',
    auth: '...'
  });

  const isAdmin = firebaseUser?.email === 'jsn.benjamin@gmail.com';
  const [adminStats, setAdminStats] = useState<any>(null);

  useEffect(() => {
    if (user) setName(user.name);
    runQuickDiag();
  }, [user]);

  const runQuickDiag = async () => {
    const results: any = { ...diagResults };
    
    // Check Hardware
    try {
      const cam = await navigator.permissions.query({ name: 'camera' as any });
      results.camera = cam.state;
      const mic = await navigator.permissions.query({ name: 'microphone' as any });
      results.mic = mic.state;
    } catch (e) {
      results.camera = 'restricted';
      results.mic = 'restricted';
    }

    // Check Audio/Speech APIs
    results.speech = ('speechSynthesis' in window && 'webkitSpeechRecognition' in window) ? 'ready' : 'legacy';
    results.auth = firebaseUser ? 'verified' : 'anonymous';

    setDiagResults(results);
  };

  const runDeepDiag = async () => {
    setIsRunningDiag(true);
    const start = Date.now();
    try {
      // Real API ping
      const res = await fetch('/api/analyze', { method: 'OPTIONS' });
      const end = Date.now();
      setDiagResults(prev => ({ ...prev, apiLatency: `${end - start}ms` }));
    } catch (e) {
      setDiagResults(prev => ({ ...prev, apiLatency: 'error' }));
    }
    setIsRunningDiag(false);
  };

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg('Settings saved!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleNativeShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Chekki AI Flyer', text: title, url });
      } catch (err) {
        navigator.clipboard.writeText(url);
        setSuccessMsg(t('res_copied'));
      }
    } else {
      navigator.clipboard.writeText(url);
      setSuccessMsg(t('res_copied'));
    }
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
              
              {/* --- ADVANCED DIAGNOSTICS --- */}
              <div className="bg-zinc-800/50 rounded-3xl p-6 border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4">
                  <div className={`w-2 h-2 rounded-full ${diagResults.apiLatency !== '...' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-zinc-700'} animate-pulse`}></div>
                </div>
                
                <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Real-time Performance</h3>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {[
                    { label: 'Latency', val: diagResults.apiLatency, color: 'text-emerald-400' },
                    { label: 'Cam/Mic', val: diagResults.camera === 'granted' ? 'OK' : 'Check', color: diagResults.camera === 'granted' ? 'text-emerald-400' : 'text-orange-400' },
                    { label: 'Voice API', val: diagResults.speech, color: 'text-indigo-400' },
                    { label: 'Session', val: diagResults.auth, color: 'text-zinc-400' }
                  ].map((d, i) => (
                    <div key={i} className="bg-black/40 p-3 rounded-2xl border border-white/5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">{d.label}</p>
                      <p className={`text-xs font-black truncate ${d.color}`}>{d.val}</p>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={runDeepDiag}
                  disabled={isRunningDiag}
                  className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-all flex items-center justify-center gap-2"
                >
                  {isRunningDiag ? <span className="animate-spin">🌀</span> : '⚡'} 
                  {isRunningDiag ? 'Running Deep Check...' : 'Run Full Diagnostic'}
                </button>
              </div>

              {/* --- FLYER RESOURCES --- */}
              <div>
                  <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">{t('res_title')}</h3>
                  <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden group flex flex-col h-full max-w-xs mx-auto">
                      <div className="relative aspect-[3/4.2] overflow-hidden shrink-0">
                          <img src={ASSETS.FLYER_THUMB} alt="Chekki Flyer" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-zinc-900" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-4 backdrop-blur-sm">
                              <a href={ASSETS.PDF_SHARE} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black shadow-xl uppercase tracking-tighter hover:bg-zinc-200 transition-colors">View PDF</a>
                          </div>
                      </div>
                      <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <p className="text-[10px] font-black text-zinc-300 truncate uppercase tracking-widest text-center">{t('res_flyer')}</p>
                          <div className="flex gap-1.5">
                              <a href={ASSETS.PDF_DOWNLOAD} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black py-2.5 rounded-lg text-center border border-white/10 transition-colors uppercase">Download</a>
                              <button onClick={() => handleNativeShare(ASSETS.PDF_SHARE, t('res_flyer'))} className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black py-2.5 rounded-lg border border-orange-500/20 transition-colors uppercase">Share</button>
                          </div>
                      </div>
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

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
                      <div className="text-sm font-bold text-white">Language</div>
                      <div className="flex bg-zinc-950 rounded-xl p-1 border border-zinc-800">
                          <button onClick={() => setLanguage('en')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'en' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>EN</button>
                          <button onClick={() => setLanguage('ko')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase ${language === 'ko' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}>KO</button>
                      </div>
                  </div>
              </div>

              <div className="h-px bg-white/5"></div>

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
