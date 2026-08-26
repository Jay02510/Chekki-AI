import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { LegalModal } from './LegalModal';
import { ConfirmDialog } from './ConfirmDialog';
import { FeedbackModal } from './FeedbackModal';
import { db, dbInstance } from '../services/database';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { InAppReview } from '@capacitor-community/in-app-review';
import { copyToClipboard } from '../utils/clipboard';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  onClose: () => void;
  isNight: boolean;
  setIsNight: (val: boolean) => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose, isNight, setIsNight }) => {
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });
  const {
    user,
    updateProfile,
    deleteAccount,
    firebaseUser,
    setShowPaywall,
    subscriptionRecord,
    updateClassroomProfile,
    joinClassWithCode,
    leaveClassroom,
  } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [saveErrorMsg, setSaveErrorMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showLeaveClassConfirm, setShowLeaveClassConfirm] = useState(false);
  const [showLegal, setShowLegal] = useState<
    'privacy' | 'terms' | 'refund' | 'youth' | 'support' | null
  >(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Deep Diagnostics
  const [diagResults, setDiagResults] = useState({
    camera: '...',
    mic: '...',
    speech: '...',
    auth: '...',
  });

  // B2B Student/Class state
  const [studentName, setStudentName] = useState('');
  const [classJoinCode, setClassJoinCode] = useState('');
  const [isUpgradingCode, setIsUpgradingCode] = useState(false);
  const [redeemError, setRedeemError] = useState('');
  const [redeemSuccess, setRedeemSuccess] = useState('');
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  const [activeClassDetails, setActiveClassDetails] = useState<any>(null);
  const [isLoadingClassDetails, setIsLoadingClassDetails] = useState(false);

  useEffect(() => {
    if (user?.studentName) setStudentName(user.studentName);
  }, [user]);

  useEffect(() => {
    if (user?.classId) {
      setIsLoadingClassDetails(true);
      const docRef = doc(dbInstance, 'classes', user.classId);
      getDoc(docRef)
        .then((docSnap) => {
          if (docSnap.exists()) {
            setActiveClassDetails(docSnap.data());
          }
        })
        .catch((err) => {
          console.error('Error fetching class details:', err);
        })
        .finally(() => {
          setIsLoadingClassDetails(false);
        });
    } else {
      setActiveClassDetails(null);
    }
  }, [user?.classId]);

  const handleRedeemClassCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classJoinCode) return;
    setRedeemError('');
    setRedeemSuccess('');
    setIsUpgradingCode(true);
    try {
      const sanitized = classJoinCode.toUpperCase().trim();
      const success = await joinClassWithCode(sanitized);
      if (success) {
        setRedeemSuccess(
          language === 'ko'
            ? '학습지 파트너십 인증에 성공했습니다!'
            : 'Invite code redeemed successfully!'
        );
        setClassJoinCode('');
      } else {
        setRedeemError(
          language === 'ko'
            ? '올바르지 않거나 이미 사용된 초대 코드입니다.'
            : 'Invalid or already-used invite code.'
        );
      }
    } catch (err: any) {
      setRedeemError(err.message || 'Failed to redeem code.');
    } finally {
      setIsUpgradingCode(false);
    }
  };

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

    results.speech =
      'speechSynthesis' in window && 'webkitSpeechRecognition' in window ? 'ready' : 'legacy';
    const isDemo = ['test@example.com', 'expired@example.com'].includes(user?.email || '');
    results.auth = firebaseUser || isDemo ? 'verified' : 'anonymous';

    setDiagResults(results);
  };

  const handleSave = async () => {
    setSaveErrorMsg('');
    try {
      await updateProfile(name);
      if (user?.schoolId && user?.classId) {
        await updateClassroomProfile(user.classId, studentName);
      }
      setSuccessMsg(t('settings_saved'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      // updateUser/updateClassroomProfile used to swallow write failures
      // silently, so this catch never ran and the user had no way to know
      // their changes weren't actually saved (Audit: swallowed write errors).
      setSaveErrorMsg(
        language === 'ko' ? '저장에 실패했습니다. 다시 시도해주세요.' : 'Failed to save. Please try again.'
      );
    }
  };

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div
          className={`absolute inset-0 bg-black/90 backdrop-blur-xl ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
          onClick={close}
        ></div>

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          tabIndex={-1}
          className={`relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] w-full max-w-lg md:max-w-xl lg:max-w-2xl shadow-[0_50px_100px_rgba(0,0,0,0.5)] ${isClosing ? 'modal-exit' : 'modal-enter'} flex flex-col max-h-[90vh] mx-2 sm:mx-4`}
        >
          <div
            className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-zinc-950/90' : 'bg-white/90'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}
          >
            <div
              className={`${isNight ? 'bg-zinc-950 border-white/5' : 'bg-zinc-50 border-zinc-200'} px-5 py-5 sm:px-8 sm:py-6 border-b flex justify-between items-center shrink-0`}
            >
              <h2
                id="settings-modal-title"
                className={`text-balance text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display uppercase tracking-tight`}
              >
                {t('settings_title')}
              </h2>
              <button
                onClick={close}
                aria-label="Close"
                className="text-zinc-400 hover:text-orange-500 transition-colors text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8 overflow-y-auto custom-scrollbar flex-1 pb-24">
              {/* --- ADMIN BADGE (Conditional) --- */}
              {isAdmin && (
                <div className="bg-purple-500/10 rounded-3xl p-6 border border-purple-500/30 flex items-center justify-between">
                  <div>
                    <h3 className="text-balance text-sm font-black text-purple-400 uppercase tracking-tight leading-tight mb-1">
                      Admin Access
                    </h3>
                    <p className="text-xs sm:text-sm text-zinc-400 font-bold">
                      System management enabled
                    </p>
                  </div>
                  <svg
                    className="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m3.75 13.5 10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75Z"
                    />
                  </svg>
                </div>
              )}

              {/* --- SECURITY AUDIT SECTION --- */}
              <div
                className={`${isNight ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'} rounded-3xl p-4 sm:p-6 border`}
              >
                <div className="flex items-center gap-3 mb-4">
                  <svg
                    className={`w-5 h-5 ${isNight ? 'text-emerald-500' : 'text-emerald-600'}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
                    />
                  </svg>
                  <h3
                    className={`text-sm font-black ${isNight ? 'text-emerald-500' : 'text-emerald-600'} uppercase tracking-wide leading-tight`}
                  >
                    {t('sec_audit_title')}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-zinc-400 font-medium mb-4 leading-relaxed break-keep">
                  {t('sec_audit_desc')}
                </p>
                <div className="space-y-2">
                  {[1, 2, 3, 4].map((idx) => (
                    <div
                      key={idx}
                      className={`flex items-center gap-2 text-xs sm:text-sm ${isNight ? 'text-zinc-300' : 'text-zinc-600'} font-bold`}
                    >
                      <span className="text-emerald-500">✓</span>
                      {t(`sec_point_${idx}`)}
                    </div>
                  ))}
                </div>
              </div>

              {/* --- ADVANCED DIAGNOSTICS --- */}
              <div
                className={`${isNight ? 'bg-zinc-800/50 border-white/5' : 'bg-zinc-100/50 border-zinc-200'} rounded-3xl p-4 sm:p-6 border relative overflow-hidden group`}
              >
                <div className="absolute top-0 right-0 p-4">
                  <div
                    className={`w-2 h-2 rounded-full ${diagResults.auth === 'verified' ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : isNight ? 'bg-zinc-700' : 'bg-zinc-300'} animate-pulse`}
                  ></div>
                </div>

                <h3 className="text-balance text-xs sm:text-sm font-black text-orange-500 uppercase tracking-tight mb-4">
                  {t('settings_device_diag')}
                </h3>

                <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6">
                  {[
                    {
                      label: language === 'ko' ? '카메라' : 'Camera',
                      val: diagResults.camera === 'granted' ? 'OK' : 'Check',
                      color:
                        diagResults.camera === 'granted' ? 'text-emerald-500' : 'text-orange-500',
                    },
                    {
                      label: language === 'ko' ? '마이크' : 'Mic',
                      val: diagResults.mic === 'granted' ? 'OK' : 'Check',
                      color: diagResults.mic === 'granted' ? 'text-emerald-500' : 'text-orange-500',
                    },
                    {
                      label: language === 'ko' ? '음성 지원' : 'Voice API',
                      val: diagResults.speech,
                      color: 'text-indigo-500',
                    },
                    {
                      label: language === 'ko' ? '인증 상태' : 'Auth',
                      val: diagResults.auth,
                      color: isNight ? 'text-zinc-400' : 'text-zinc-500',
                    },
                  ].map((d, i) => (
                    <div
                      key={i}
                      className={`${isNight ? 'bg-black/40 border-white/5' : 'bg-white border-zinc-200 shadow-sm'} p-2 sm:p-3 rounded-2xl border`}
                    >
                      <p className="text-[10px] sm:text-xs font-black text-zinc-400 uppercase mb-1">
                        {d.label}
                      </p>
                      <p className={`text-xs font-black truncate ${d.color}`}>{d.val}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* --- SUBSCRIPTION STATUS --- */}
              <div
                className={`${isNight ? 'bg-zinc-800/30 border-white/5' : 'bg-zinc-100/50 border-zinc-200 shadow-sm'} rounded-3xl p-4 sm:p-6 border`}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-balance text-xs sm:text-sm font-black text-zinc-400 uppercase tracking-tight">
                    {language === 'ko' ? '구독 정보' : 'SUBSCRIPTION'}
                  </h3>
                  {/* Status Badge */}
                  {(!subscriptionRecord || subscriptionRecord.subscription_status === 'none') && (
                    <span
                      className={`text-[10px] sm:text-xs ${isNight ? 'bg-zinc-800 border-white/5' : 'bg-white border-zinc-200 shadow-sm'} text-zinc-500 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border`}
                    >
                      {t('sub_no_active')}
                    </span>
                  )}
                  {subscriptionRecord?.subscription_status === 'active' && (
                    <span
                      className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-full font-black uppercase tracking-wide border ${
                        subscriptionRecord.subscription_expiry_date &&
                        new Date(subscriptionRecord.subscription_expiry_date).getTime() -
                          new Date().getTime() <
                          8 * 24 * 60 * 60 * 1000 // Simple logic for trial detection: if expiry is within ~7 days of now
                          ? 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                          : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                      }`}
                    >
                      {subscriptionRecord.subscription_expiry_date &&
                      new Date(subscriptionRecord.subscription_expiry_date).getTime() -
                        new Date().getTime() <
                        8 * 24 * 60 * 60 * 1000
                        ? t('sub_trial_badge')
                        : t('sub_active')}
                    </span>
                  )}
                  {subscriptionRecord?.subscription_status === 'expired' && (
                    <span className="text-[10px] sm:text-xs bg-red-500/10 text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest border border-red-500/20">
                      {t('sub_expired')}
                    </span>
                  )}
                </div>

                <div className="space-y-4">
                  {subscriptionRecord?.subscription_status === 'active' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shadow-inner">
                          <svg
                            className="w-6 h-6 text-orange-500"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                            />
                          </svg>
                        </div>
                        <div>
                          {subscriptionRecord.subscription_expiry_date &&
                          new Date(subscriptionRecord.subscription_expiry_date).getTime() -
                            new Date().getTime() <
                            8 * 24 * 60 * 60 * 1000 ? (
                            <>
                              <p
                                className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}
                              >
                                {(() => {
                                  const days = Math.ceil(
                                    (new Date(
                                      subscriptionRecord.subscription_expiry_date
                                    ).getTime() -
                                      new Date().getTime()) /
                                      (1000 * 60 * 60 * 24)
                                  );
                                  return t('sub_trial_status').replace('{days}', days.toString());
                                })()}
                              </p>
                              {Math.ceil(
                                (new Date(subscriptionRecord.subscription_expiry_date).getTime() -
                                  new Date().getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) <= 2 && (
                                <p className="text-xs sm:text-sm text-orange-500 font-bold animate-pulse">
                                  {t('sub_trial_ending')}
                                </p>
                              )}
                            </>
                          ) : (
                            <p
                              className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}
                            >
                              {user?.plan === 'pro'
                                ? language === 'ko'
                                  ? '프리미엄 플랜'
                                  : 'Premium Plan'
                                : language === 'ko'
                                  ? '기본 플랜'
                                  : 'Basic Plan'}
                            </p>
                          )}
                          <p className="text-[10px] text-zinc-400 font-bold">
                            {subscriptionRecord.subscription_platform === 'apple'
                              ? t('sub_platformApple')
                              : subscriptionRecord.subscription_platform === 'google'
                                ? t('sub_platformGoogle')
                                : t('sub_platformWeb')}
                          </p>
                        </div>
                      </div>

                      {subscriptionRecord.subscription_expiry_date && (
                        <p className="text-sm text-zinc-400 font-medium">
                          {new Date(subscriptionRecord.subscription_expiry_date).toLocaleDateString(
                            language === 'ko' ? 'ko-KR' : 'en-US',
                            { year: 'numeric', month: 'long', day: 'numeric' }
                          )}
                          {t('sub_renews_on')}
                        </p>
                      )}

                      {Capacitor.getPlatform() === 'ios' ? (
                        <a
                          href="itms-apps://apps.apple.com/account/subscriptions"
                          className={`block w-full text-center ${isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'} py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97] border`}
                        >
                          {t('sub_manage')}
                        </a>
                      ) : Capacitor.getPlatform() === 'android' ? (
                        <a
                          href="https://play.google.com/store/account/subscriptions?package=com.chekkiai.app"
                          className={`block w-full text-center ${isNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-sm'} py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97] border`}
                        >
                          {t('sub_manage')}
                        </a>
                      ) : (
                        <p
                          className={`text-[11px] sm:text-xs text-zinc-500 italic ${isNight ? 'bg-black/20 border-white/5' : 'bg-zinc-100 border-zinc-200'} p-3 rounded-xl border`}
                        >
                          {t('sub_web_manage')}
                        </p>
                      )}
                    </div>
                  ) : subscriptionRecord?.subscription_status === 'expired' ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/5 border border-orange-500/10 flex items-center justify-center shadow-inner">
                          <svg
                            className="w-6 h-6 text-orange-400"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                            />
                          </svg>
                        </div>
                        <div>
                          <p
                            className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}
                          >
                            {t('sub_expired')}
                          </p>
                          {subscriptionRecord.subscription_expiry_date && (
                            <p className="text-xs sm:text-sm text-zinc-400 font-bold">
                              {new Date(
                                subscriptionRecord.subscription_expiry_date
                              ).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}{' '}
                              {t('sub_expired_on')}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          close();
                          setShowPaywall(true);
                        }}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-black py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97]"
                      >
                        {t('sub_renew_now')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-xs sm:text-sm text-zinc-400 font-medium leading-relaxed break-keep">
                        {language === 'ko'
                          ? '구독하여 모든 프로 기능을 무제한으로 이용하세요.'
                          : 'Subscribe to unlock all premium features and unlimited AI magic.'}
                      </p>
                      {Capacitor.getPlatform() === 'web' ? (
                        <div className="space-y-4">
                          <p className="text-xs sm:text-sm text-zinc-400 font-bold text-center italic break-keep">
                            {language === 'ko'
                              ? '모바일 앱을 통해 구독하세요'
                              : 'Subscribe via our mobile app'}
                          </p>
                          <div className="flex justify-center gap-3">
                            <a
                              href="https://apps.apple.com/app/id6741479840"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 opacity-80 hover:opacity-100 hover:bg-white/10 transition-colors text-[10px] sm:text-xs font-black text-white uppercase tracking-widest"
                            >
                              App Store
                            </a>
                            <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 opacity-50 text-[10px] sm:text-xs font-black text-zinc-400 uppercase tracking-widest">
                              Google Play
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            close();
                            setShowPaywall(true);
                          }}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-black py-4 rounded-2xl text-xs sm:text-sm font-black uppercase tracking-widest shadow-lg shadow-orange-500/20 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97]"
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
                <h3 className="text-balance text-xs font-black text-zinc-400 uppercase tracking-tight mb-4">
                  {t('settings_profile')}
                </h3>
                <div className="space-y-4">
                  <label
                    className={`block text-xs sm:text-sm font-black ${isNight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}
                  >
                    {t('settings_name_label')}
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-2xl px-5 py-4 focus:border-orange-500 outline-none transition-colors`}
                  />
                </div>
              </div>

              {/* --- SCHOOL & CLASSROOM SETTINGS (Case A: B2C Parents, allow late B2B redemption) --- */}
              {!user?.schoolId ? (
                <div className="space-y-6 pt-4 border-t border-zinc-900/10">
                  <h3 className="text-balance text-xs font-black text-zinc-400 uppercase tracking-tight">
                    {language === 'ko' ? '🏫 학급 가입 및 Premium 인증' : '🏫 School Sponsorship'}
                  </h3>

                  {/* Default: most parents don't have a code yet — nudge them
                      to invite their director instead of a dead-end form. */}
                  <div className="p-5 bg-orange-500/5 border border-orange-500/15 rounded-3xl space-y-4 text-left">
                    <p className="text-xs text-zinc-400 font-medium leading-relaxed break-keep">
                      {language === 'ko'
                        ? '다니고 계신 어학원 원장님이 체키 스쿨 프로를 도입하시면, 원장님 초대로 Premium 혜택을 100% 무료로 이용하실 수 있어요.'
                        : "If your child's academy director adopts Chekki School Pro, you get Premium access 100% free via their personal invite."}
                    </p>

                    <div className="bg-zinc-950/40 border border-white/10 rounded-2xl p-3.5 space-y-1.5">
                      <p className="text-[10px] font-mono font-bold uppercase text-orange-400 tracking-wider">
                        {language === 'ko' ? '📋 추천 메시지 미리보기' : '📋 PREVIEW MESSAGE'}
                      </p>
                      <p className="text-xs text-zinc-300 leading-relaxed">
                        {language === 'ko'
                          ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
                          : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools"}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        const inviteMsg = language === 'ko'
                          ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
                          : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools";
                        const copied = await copyToClipboard(inviteMsg);
                        if (copied) {
                          setInviteCopied(true);
                          setTimeout(() => setInviteCopied(false), 2500);
                        } else {
                          showToast({
                            type: 'error',
                            message: language === 'ko' ? '복사에 실패했습니다. 다시 시도해 주세요.' : 'Copy failed — please try again.',
                          });
                        }
                      }}
                      className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-black font-black text-xs rounded-2xl shadow-md transition-colors cursor-pointer"
                    >
                      {inviteCopied
                        ? (language === 'ko' ? '✓ 복사 완료!' : '✓ Copied!')
                        : (language === 'ko' ? '메시지 복사하기' : 'Copy Invite Message')}
                    </button>
                  </div>

                  {/* Fallback for the minority who already have a personal code. */}
                  {!showCodeEntry ? (
                    <button
                      type="button"
                      onClick={() => setShowCodeEntry(true)}
                      className="text-zinc-400 hover:text-orange-500 text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {language === 'ko' ? '이미 초대 코드가 있으신가요?' : 'Already have an invite code?'}
                    </button>
                  ) : (
                    <form
                      onSubmit={handleRedeemClassCode}
                      className="p-5 bg-zinc-900/40 border border-zinc-900 rounded-3xl space-y-4 text-left"
                    >
                      <p className="text-xs text-zinc-400 font-medium leading-relaxed break-keep">
                        {language === 'ko'
                          ? '다니고 계신 어학원(Poly, GATE, ECC 등) 담당 선생님께 초대받으셨나요? 초대 코드를 입력해 Premium 혜택과 맞춤형 숙제 관리를 시작하세요.'
                          : "Were you invited by your child's teacher (Poly, GATE, ECC, etc.)? Enter your invite code to activate premium grading and sync homework."}
                      </p>

                      {user?.plan === 'pro' && (
                        <div className="p-3 bg-orange-500/5 border border-orange-500/15 text-orange-400 text-[10px] sm:text-xs font-semibold rounded-xl leading-normal font-korean">
                          ⚠️{' '}
                          {language === 'ko'
                            ? '주의: 현재 유료 정기 결제 플랜을 사용 중이십니다. 초대 코드를 등록해도 자동 정기 결제는 연동되지 않으므로, 이중 청구를 방지하기 위해 App Store 또는 Google Play에서 구독을 수동으로 취소해 주세요.'
                            : 'Note: You have an active Premium plan. Joining via an invite code transitions your account sponsorship. Please cancel your App Store or Play Store subscription manually to avoid duplicate billing.'}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label
                          className={`block text-xs font-black ${isNight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}
                        >
                          {language === 'ko'
                            ? '초대 코드 입력'
                            : 'Enter Invite Code'}
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={classJoinCode}
                            onChange={(e) => setClassJoinCode(e.target.value)}
                            placeholder="E.g. MERC82"
                            maxLength={6}
                            className={`flex-1 min-w-0 ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-2xl px-5 py-3 focus:border-orange-500 outline-none text-sm uppercase font-mono tracking-widest`}
                          />
                          <button
                            type="submit"
                            disabled={isUpgradingCode}
                            className="px-6 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold text-xs rounded-2xl shadow-md transition-[background-color,opacity] flex items-center justify-center gap-1.5 shrink-0"
                          >
                            {isUpgradingCode ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <span>{language === 'ko' ? '등록' : 'Redeem'}</span>
                            )}
                          </button>
                        </div>
                      </div>

                      {redeemError && (
                        <p className="text-red-400 text-xs font-semibold pl-1">⚠️ {redeemError}</p>
                      )}
                      {redeemSuccess && (
                        <p className="text-emerald-400 text-xs font-semibold pl-1">
                          ✓ {redeemSuccess}
                        </p>
                      )}
                    </form>
                  )}
                </div>
              ) : (
                /* --- SCHOOL & CLASSROOM SETTINGS (Case B: Already B2B, configure child/class) --- */
                <div className="space-y-6 pt-4 border-t border-zinc-900/10">
                  <div className="flex items-center justify-between">
                    <h3 className="text-balance text-xs font-black text-zinc-400 uppercase tracking-tight">
                      {language === 'ko' ? '🏫 학교 / 학급 정보' : '🏫 School & Classroom Info'}
                    </h3>
                    <button
                      onClick={() => setShowLeaveClassConfirm(true)}
                      className="text-[10px] font-black text-red-500 hover:text-red-400 transition-colors uppercase tracking-wider"
                    >
                      {language === 'ko' ? '학급 연동 해제' : 'Leave Class'}
                    </button>
                  </div>

                  <div className="p-5 bg-orange-500/5 border border-orange-500/10 rounded-3xl space-y-4 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">
                          {language === 'ko' ? '소속 교육기관' : 'Partner School'}
                        </span>
                        <p
                          className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'} truncate`}
                        >
                          {user.schoolName || user.schoolId}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block mb-0.5">
                          {language === 'ko' ? '소속 학급반' : 'Classroom'}
                        </span>
                        {isLoadingClassDetails ? (
                          <div className="w-16 h-4 bg-zinc-900 animate-pulse rounded" />
                        ) : (
                          <p
                            className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'} truncate`}
                          >
                            {activeClassDetails
                              ? `${activeClassDetails.name} (${activeClassDetails.level})`
                              : 'N/A'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Class Status Banner */}
                    {user.classId && user.classStatus === 'pending' && (
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[10px] sm:text-xs font-semibold rounded-xl leading-normal font-korean">
                        ⏳{' '}
                        {language === 'ko'
                          ? '교사의 학급 승인을 기다리고 있습니다. 승인이 완료되면 학급 진도에 맞춰 채점이 자동 활성화됩니다.'
                          : 'Awaiting teacher approval. Once approved, homework grading will automatically align with the class curriculum.'}
                      </div>
                    )}
                    {user.classId && user.classStatus === 'active' && (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] sm:text-xs font-semibold rounded-xl leading-normal font-korean">
                        ✅{' '}
                        {language === 'ko'
                          ? '가입 승인 완료: 현재 이 반의 주간 커리큘럼 기반으로 채점이 진행되고 있습니다.'
                          : 'Classroom enrollment active: Graders are currently aligned with the weekly curriculum.'}
                      </div>
                    )}

                    <div className="space-y-1.5 pt-2 border-t border-zinc-900/10">
                      <label
                        className={`block text-xs font-black ${isNight ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-widest`}
                      >
                        {language === 'ko' ? '자녀 이름' : "Child's Name"}
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder={language === 'ko' ? '예: 김유나' : 'E.g. Yuna Kim'}
                        className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-900'} border rounded-2xl px-5 py-4 focus:border-orange-500 outline-none text-sm transition-colors`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* --- PREFERENCES --- */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-800'}`}>
                    {t('settings_lang_label')}
                  </div>
                  <div
                    className={`flex ${isNight ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} rounded-xl p-1 border`}
                  >
                    <button
                      onClick={() => setLanguage('en')}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase ${language === 'en' ? (isNight ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500'}`}
                    >
                      EN
                    </button>
                    <button
                      onClick={() => setLanguage('ko')}
                      className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase ${language === 'ko' ? (isNight ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500'}`}
                    >
                      KO
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-800'}`}>
                    {t('settings_theme_label')}
                  </div>
                  <div
                    className={`flex ${isNight ? 'bg-zinc-950 border-zinc-800' : 'bg-zinc-100 border-zinc-200'} rounded-xl p-1 border`}
                  >
                    <button
                      onClick={() => setIsNight(false)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 ${!isNight ? (isNight ? 'bg-zinc-800 text-white shadow-lg' : 'bg-white text-zinc-900 shadow-sm') : 'text-zinc-500'}`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"
                        />
                      </svg>
                      <span className="hidden xs:inline">
                        {language === 'ko' ? '라이트' : 'Light'}
                      </span>
                    </button>
                    <button
                      onClick={() => setIsNight(true)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-black uppercase transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 ${isNight ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500'}`}
                    >
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 0 0 9.002-5.998Z"
                        />
                      </svg>
                      <span className="hidden xs:inline">
                        {language === 'ko' ? '다크' : 'Dark'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              {/* --- RATE APP --- */}
              <button
                onClick={() => {
                  if (Capacitor.isNativePlatform()) {
                    InAppReview.requestReview().catch(console.error);
                  } else {
                    window.open(
                      'https://play.google.com/store/apps/details?id=com.chekkiai.app',
                      '_blank'
                    );
                  }
                }}
                className={`w-full flex items-center justify-center gap-3 ${isNight ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:bg-orange-500/20' : 'bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100'} font-black py-4 rounded-2xl transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100 active:scale-[0.97] mt-6 uppercase tracking-widest text-xs sm:text-sm`}
              >
                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                  <path
                    fillRule="evenodd"
                    d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                    clipRule="evenodd"
                  />
                </svg>
                {language === 'ko' ? '앱 평가하기' : 'Rate This App'}
              </button>

              {/* --- LEGAL LINKS --- */}
              <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 px-4 py-2 border-t border-white/5 pt-6">
                <button
                  onClick={() => setShowLegal('privacy')}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wide underline decoration-zinc-800"
                >
                  {t('nav_privacy')}
                </button>
                <button
                  onClick={() => setShowLegal('terms')}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wide underline decoration-zinc-800"
                >
                  {t('nav_terms')}
                </button>
                <button
                  onClick={() => setShowLegal('refund')}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wide underline decoration-zinc-800"
                >
                  {t('nav_refund')}
                </button>
                <button
                  onClick={() => setShowLegal('youth')}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wide underline decoration-zinc-800"
                >
                  {t('nav_youth')}
                </button>
                <button
                  onClick={() => setShowLegal('support')}
                  className="text-xs sm:text-sm text-zinc-400 hover:text-white font-bold transition-colors uppercase tracking-wide underline decoration-zinc-800"
                >
                  {language === 'ko' ? '고객 지원' : 'Help & Support'}
                </button>
              </div>

              {/* --- DANGER ZONE --- */}
              <div>
                {!showDeleteConfirm ? (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full text-center px-5 py-4 rounded-2xl border border-red-500/20 text-red-500 text-xs sm:text-sm font-black uppercase tracking-wide hover:bg-red-500/10 transition-transform duration-200 ease-[var(--ease-out-strong)] opacity-100"
                  >
                    {t('settings_delete_account')}
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 flex items-center justify-between">
                    <p className="text-xs sm:text-sm text-orange-400 font-black uppercase tracking-wide leading-normal break-keep">
                      {t('settings_delete_confirm')}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          try {
                            await deleteAccount();
                          } catch (e: any) {
                            showToast({ type: 'error', message: e.message || 'Error deleting account' });
                            setShowDeleteConfirm(false);
                          }
                        }}
                        className="px-4 py-2 bg-red-600 text-white text-xs sm:text-sm font-black rounded-lg"
                      >
                        {t('settings_delete_yes')}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="px-4 py-2 bg-zinc-800 text-zinc-300 text-xs sm:text-sm font-black rounded-lg"
                      >
                        {t('settings_delete_no')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* --- FIXED FOOTER --- */}
            <div
              className={`${isNight ? 'bg-zinc-900/95 border-white/5' : 'bg-zinc-50/95 border-zinc-200'} backdrop-blur-md px-8 py-5 flex items-center justify-between border-t shrink-0`}
            >
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-wide ${
                  saveErrorMsg ? 'text-red-500' : 'text-emerald-500'
                }`}
              >
                {saveErrorMsg || successMsg}
              </span>
              <button
                onClick={handleSave}
                className={`${isNight ? 'bg-white text-black hover:bg-zinc-100' : 'bg-zinc-900 text-white hover:bg-black'} px-10 py-4 rounded-2xl font-black text-sm btn-press transition-transform duration-200 ease-[var(--ease-out-strong)]`}
              >
                {t('settings_save')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {showLeaveClassConfirm && (
        <ConfirmDialog
          title={language === 'ko'
            ? '정말 학급에서 탈퇴하시겠습니까? 학원 전용 Premium 플랜도 해제됩니다.'
            : 'Are you sure you want to leave this class? Your premium sponsorship will be deactivated.'}
          confirmText={language === 'ko' ? '탈퇴' : 'Leave'}
          cancelText={language === 'ko' ? '취소' : 'Cancel'}
          variant="destructive"
          isNight={isNight}
          onConfirm={() => {
            setShowLeaveClassConfirm(false);
            leaveClassroom();
          }}
          onCancel={() => setShowLeaveClassConfirm(false)}
        />
      )}
    </>
  );
};
