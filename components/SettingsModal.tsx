
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { FeedbackModal } from './FeedbackModal';
import { db } from '../services/database';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, deleteAccount, firebaseUser, setShowPaywall, subscriptionRecord } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | 'refund' | 'youth' | null>(null);
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
    const isDemo = ['test@example.com', 'expired@example.com'].includes(user?.email || '');
    results.auth = (firebaseUser || isDemo) ? 'verified' : 'anonymous';

    setDiagResults(results);
  };

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg(t('settings_saved'));
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>

        <div className="relative bg-zinc-900 rounded-[2.5rem] md:rounded-[3rem] w-full max-w-lg md:max-w-xl lg:max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

          <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
            <h2 className="text-xl font-black text-white font-display uppercase tracking-widest">{t('settings_title')}</h2>
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

              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">{t('settings_device_diag')}</h3>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: language === 'ko' ? '카메라' : 'Camera', val: diagResults.camera === 'granted' ? 'OK' : 'Check', color: diagResults.camera === 'granted' ? 'text-emerald-400' : 'text-orange-400' },
                  { label: language === 'ko' ? '마이크' : 'Mic', val: diagResults.mic === 'granted' ? 'OK' : 'Check', color: diagResults.mic === 'granted' ? 'text-emerald-400' : 'text-orange-400' },
                  { label: language === 'ko' ? '음성 지원' : 'Voice API', val: diagResults.speech, color: 'text-indigo-400' },
                  { label: language === 'ko' ? '인증 상태' : 'Auth', val: diagResults.auth, color: 'text-zinc-400' }
                ].map((d, i) => (
                  <div key={i} className="bg-black/40 p-3 rounded-2xl border border-white/5">
                    <p className="text-[8px] font-black text-zinc-500 uppercase mb-1">{d.label}</p>
                    <p className={`text-xs font-black truncate ${d.color}`}>{d.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* --- SUBSCRIPTION STATUS --- */}
            <div className="bg-zinc-800/30 rounded-[2rem] p-6 border border-white/5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{language === 'ko' ? '구독 정보' : 'SUBSCRIPTION'}</h3>
                {/* Status Badge */}
                {(!subscriptionRecord || subscriptionRecord.subscription_status === 'none') && (
                  <span className="text-[8px] bg-zinc-800 text-zinc-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-white/5">
                    {t('sub_no_active')}
                  </span>
                )}
                {subscriptionRecord?.subscription_status === 'active' && (
                  <span className={`text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest border ${subscriptionRecord.subscription_expiry_date && (new Date(subscriptionRecord.subscription_expiry_date).getTime() - new Date().getTime()) < 8 * 24 * 60 * 60 * 1000 // Simple logic for trial detection: if expiry is within ~7 days of now
                      ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                      : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                    }`}>
                    {subscriptionRecord.subscription_expiry_date && (new Date(subscriptionRecord.subscription_expiry_date).getTime() - new Date().getTime()) < 8 * 24 * 60 * 60 * 1000
                      ? t('sub_trial_badge')
                      : t('sub_active')}
                  </span>
                )}
                {subscriptionRecord?.subscription_status === 'expired' && (
                  <span className="text-[8px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-red-500/20">
                    {t('sub_expired')}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                {subscriptionRecord?.subscription_status === 'active' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-xl">
                        🚀
                      </div>
                      <div>
                        {subscriptionRecord.subscription_expiry_date && (new Date(subscriptionRecord.subscription_expiry_date).getTime() - new Date().getTime()) < 8 * 24 * 60 * 60 * 1000 ? (
                          <>
                            <p className="text-sm font-black text-white">
                              {(() => {
                                const days = Math.ceil((new Date(subscriptionRecord.subscription_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                                return t('sub_trial_status').replace('{days}', days.toString());
                              })()}
                            </p>
                            {Math.ceil((new Date(subscriptionRecord.subscription_expiry_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 2 && (
                              <p className="text-[10px] text-orange-500 font-bold animate-pulse">
                                {t('sub_trial_ending')}
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-sm font-black text-white">
                            {user?.plan === 'pro' ? (language === 'ko' ? '프리미엄 플랜' : 'Premium Plan') : (language === 'ko' ? '기본 플랜' : 'Basic Plan')}
                          </p>
                        )}
                        <p className="text-[10px] text-zinc-500 font-bold">
                          {subscriptionRecord.subscription_platform === 'apple' ? t('sub_platformApple') :
                            subscriptionRecord.subscription_platform === 'google' ? t('sub_platformGoogle') :
                              t('sub_platformWeb')}
                        </p>
                      </div>
                    </div>

                    {subscriptionRecord.subscription_expiry_date && (
                      <p className="text-[10px] text-zinc-400 font-medium">
                        {new Date(subscriptionRecord.subscription_expiry_date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                        {t('sub_renews_on')}
                      </p>
                    )}

                    {Capacitor.getPlatform() === 'ios' ? (
                      <a
                        href="itms-apps://apps.apple.com/account/subscriptions"
                        className="block w-full text-center bg-white/5 hover:bg-white/10 border border-white/10 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
                      >
                        {t('sub_manage')}
                      </a>
                    ) : (
                      <p className="text-[9px] text-zinc-500 italic bg-black/20 p-3 rounded-xl border border-white/5">
                        {t('sub_web_manage')}
                      </p>
                    )}
                  </div>
                ) : subscriptionRecord?.subscription_status === 'expired' ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center text-xl">
                        ⚠️
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">{t('sub_expired')}</p>
                        {subscriptionRecord.subscription_expiry_date && (
                          <p className="text-[10px] text-zinc-500 font-bold">
                            {new Date(subscriptionRecord.subscription_expiry_date).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                            {' '}{t('sub_expired_on')}
                          </p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => { onClose(); setShowPaywall(true); }}
                      className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                    >
                      {t('sub_renew_now')}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[11px] text-zinc-400 font-medium leading-relaxed">
                      {language === 'ko'
                        ? '구독하여 모든 프로 기능을 무제한으로 이용하세요.'
                        : 'Subscribe to unlock all premium features and unlimited AI magic.'}
                    </p>
                    {Capacitor.getPlatform() === 'web' ? (
                      <div className="space-y-4">
                        <p className="text-[10px] text-zinc-500 font-bold text-center italic">{language === 'ko' ? '모바일 앱을 통해 구독하세요' : 'Subscribe via our mobile app'}</p>
                        <div className="flex justify-center gap-3">
                          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 opacity-50 text-[8px] font-black text-zinc-500 uppercase tracking-widest">App Store</div>
                          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 opacity-50 text-[8px] font-black text-zinc-500 uppercase tracking-widest">Google Play</div>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => { onClose(); setShowPaywall(true); }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-all active:scale-95"
                      >
                        {t('sub_subscribe_now')}
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* --- PROFILE --- */}
            <div>
              <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">{t('settings_profile')}</h3>
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest">{t('settings_name_label')}</label>
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
                <div className="text-sm font-bold text-white">{t('settings_lang_label')}</div>
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
                {t('nav_privacy')}
              </button>
              <button
                onClick={() => setShowLegal('terms')}
                className="text-[10px] text-zinc-500 hover:text-white font-bold transition-colors uppercase tracking-widest underline decoration-zinc-800"
              >
                {t('nav_terms')}
              </button>
              <button
                onClick={() => setShowLegal('refund')}
                className="text-[10px] text-zinc-500 hover:text-white font-bold transition-colors uppercase tracking-widest underline decoration-zinc-800"
              >
                {t('nav_refund')}
              </button>
              <button
                onClick={() => setShowLegal('youth')}
                className="text-[10px] text-zinc-500 hover:text-white font-bold transition-colors uppercase tracking-widest underline decoration-zinc-800"
              >
                {t('nav_youth')}
              </button>
            </div>

            {/* --- DANGER ZONE --- */}
            <div>
              {!showDeleteConfirm ? (
                <button onClick={() => setShowDeleteConfirm(true)} className="w-full text-center px-5 py-4 rounded-2xl border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 transition-all">{t('settings_delete_account')}</button>
              ) : (
                <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center justify-between">
                  <p className="text-[10px] text-red-200 font-black uppercase">{t('settings_delete_confirm')}</p>
                  <div className="flex gap-2">
                    <button onClick={deleteAccount} className="px-4 py-2 bg-red-600 text-white text-[10px] font-black rounded-lg">{t('settings_delete_yes')}</button>
                    <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 bg-zinc-800 text-zinc-300 text-[10px] font-black rounded-lg">{t('settings_delete_no')}</button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* --- FIXED FOOTER --- */}
          <div className="bg-zinc-900/95 backdrop-blur-md px-8 py-5 flex items-center justify-between border-t border-white/5 shrink-0">
            <span className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{successMsg}</span>
            <button
              onClick={handleSave}
              className="bg-white text-black px-10 py-4 rounded-2xl font-black text-sm active:scale-95 shadow-2xl transition-all hover:bg-zinc-100"
            >
              {t('settings_save')}
            </button>
          </div>
        </div>
      </div >
    </>
  );
};
