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
import { ChatCircleText, Check, Moon, ShieldCheck, Star, Sun, X } from '@phosphor-icons/react';
import { Fold } from './metro';

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
    updateStudentName,
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
        await updateStudentName(studentName);
      }
      setSuccessMsg(t('settings_saved'));
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      console.error('Failed to save settings:', e);
      // updateUser/updateStudentName used to swallow write failures
      // silently, so this catch never ran and the user had no way to know
      // their changes weren't actually saved (Audit: swallowed write errors).
      setSaveErrorMsg(
        language === 'ko' ? '저장에 실패했습니다. 다시 시도해주세요.' : 'Failed to save. Please try again.'
      );
    }
  };

  const expiryMs = subscriptionRecord?.subscription_expiry_date
    ? new Date(subscriptionRecord.subscription_expiry_date).getTime() - Date.now()
    : null;
  // Simple trial detection: an active plan expiring within ~7 days.
  const isTrial = expiryMs !== null && expiryMs < 8 * 24 * 60 * 60 * 1000;
  const daysLeft = expiryMs !== null ? Math.ceil(expiryMs / (1000 * 60 * 60 * 24)) : 0;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const directorInviteMsg =
    language === 'ko'
      ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
      : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools";

  const sectionTitle = 'text-[13px] font-bold text-ink-3 mb-2.5';
  const card = 'rounded-md bg-surface ring-1 ring-inset ring-rule p-4 sm:p-5';
  const input =
    'w-full rounded-md bg-sunken px-4 min-h-12 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line';
  const primaryBtn = 'btn-press flex min-h-12 w-full items-center justify-center rounded-md bg-line text-[15px] font-bold text-[#2b211a] disabled:opacity-50';
  const outlineBtn =
    'btn-press flex min-h-12 w-full items-center justify-center rounded-md bg-surface text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3';
  const segment = (on: boolean) =>
    `flex min-h-10 items-center gap-1.5 rounded px-4 text-[14px] font-bold ${on ? 'bg-sign text-on-sign dark:bg-ink dark:text-ground' : 'text-ink-2 hover:text-ink'}`;
  const legalLinks: { key: 'privacy' | 'terms' | 'refund' | 'youth' | 'support'; label: string }[] = [
    { key: 'support', label: language === 'ko' ? '고객 지원' : 'Help & Support' },
    { key: 'privacy', label: t('nav_privacy') },
    { key: 'terms', label: t('nav_terms') },
    { key: 'refund', label: t('nav_refund') },
    { key: 'youth', label: t('nav_youth') },
  ];

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      {showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} warm />}

      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
        <div
          className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
          onClick={close}
          aria-hidden="true"
        />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-modal-title"
          tabIndex={-1}
          className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-ground ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-xl sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
        >
          <div className="flex shrink-0 items-center justify-between border-b border-rule bg-surface px-5 py-3 sm:px-6">
            <h2 id="settings-modal-title" className="text-[20px] font-extrabold tracking-[-0.02em] text-ink">
              {t('settings_title')}
            </h2>
            <button
              onClick={close}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
              className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          <div className="custom-scrollbar flex-1 space-y-7 overflow-y-auto px-4 py-5 sm:px-6">
            {isAdmin && (
              <p className="rounded-md bg-sunken px-4 py-3 text-[14px] font-semibold text-ink-2">
                Admin access enabled
              </p>
            )}

            {/* --- PROFILE --- */}
            <section>
              <h3 className={sectionTitle}>{t('settings_profile')}</h3>
              <div className={card}>
                <label htmlFor="settings-name" className="mb-2 block text-[14px] font-semibold text-ink-2">
                  {t('settings_name_label')}
                </label>
                <input id="settings-name" type="text" value={name} onChange={(e) => setName(e.target.value)} className={input} />
              </div>
            </section>

            {/* --- ACADEMY / CLASS --- */}
            {!user?.schoolId ? (
              /* Case A: B2C parent, allow late B2B redemption */
              <section>
                <h3 className={sectionTitle}>{language === 'ko' ? '학원 연결' : 'Your academy'}</h3>
                <div className={`${card} space-y-4`}>
                  {/* Default: most parents don't have a code yet, so nudge them
                      to invite their director instead of a dead-end form. */}
                  <p className="text-[15px] leading-relaxed text-ink-2 break-keep">
                    {language === 'ko'
                      ? '다니는 학원이 체키 스쿨을 쓰면, 원장님 초대로 Premium을 무료로 쓸 수 있어요.'
                      : "If your child's academy uses Chekki School, you get Premium free through their invite."}
                  </p>
                  <div className="rounded-md bg-sunken p-3.5">
                    <p className="mb-1 text-[13px] font-bold text-line-ink">
                      {language === 'ko' ? '원장님께 보낼 메시지' : 'Message for the director'}
                    </p>
                    <p className="text-[14px] leading-relaxed text-ink-2">{directorInviteMsg}</p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const copied = await copyToClipboard(directorInviteMsg);
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
                    className={primaryBtn}
                  >
                    {inviteCopied
                      ? language === 'ko' ? '복사했어요' : 'Copied'
                      : language === 'ko' ? '메시지 복사하기' : 'Copy message'}
                  </button>

                  {/* Fallback for the minority who already have a personal code. */}
                  {!showCodeEntry ? (
                    <button
                      type="button"
                      onClick={() => setShowCodeEntry(true)}
                      className="min-h-11 w-full text-[14px] font-semibold text-line-ink underline"
                    >
                      {language === 'ko' ? '초대 코드가 있어요' : 'I have an invite code'}
                    </button>
                  ) : (
                    <form onSubmit={handleRedeemClassCode} className="space-y-3 border-t border-rule pt-4">
                      {user?.plan === 'pro' && (
                        <p className="rounded-md bg-line-soft p-3 text-[14px] leading-normal text-ink break-keep">
                          {language === 'ko'
                            ? '지금 유료 구독 중이에요. 초대 코드를 등록해도 자동 결제는 멈추지 않으니, 이중 결제를 막으려면 App Store 또는 Google Play에서 구독을 직접 취소해 주세요.'
                            : 'You have an active Premium plan. Joining via an invite code transitions your account sponsorship. Please cancel your App Store or Play Store subscription manually to avoid duplicate billing.'}
                        </p>
                      )}
                      <label htmlFor="settings-code" className="block text-[14px] font-semibold text-ink-2">
                        {language === 'ko' ? '초대 코드' : 'Invite code'}
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="settings-code"
                          type="text"
                          value={classJoinCode}
                          onChange={(e) => setClassJoinCode(e.target.value)}
                          placeholder="MERC82"
                          maxLength={6}
                          autoCapitalize="characters"
                          className={`${input} min-w-0 flex-1 uppercase tracking-widest`}
                        />
                        <button
                          type="submit"
                          disabled={isUpgradingCode}
                          className="btn-press flex min-h-12 shrink-0 items-center justify-center rounded-md bg-line px-5 text-[15px] font-bold text-[#2b211a] disabled:opacity-50"
                        >
                          {isUpgradingCode ? (
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" />
                          ) : language === 'ko' ? '등록' : 'Redeem'}
                        </button>
                      </div>
                      {redeemError && <p role="alert" className="text-[14px] font-semibold text-wrong">{redeemError}</p>}
                      {redeemSuccess && <p role="status" className="text-[14px] font-semibold text-correct">{redeemSuccess}</p>}
                    </form>
                  )}
                </div>
              </section>
            ) : (
              /* Case B: already linked to an academy */
              <section>
                <h3 className={sectionTitle}>{language === 'ko' ? '학원 / 반' : 'Academy & class'}</h3>
                <div className={`${card} space-y-4`}>
                  <dl className="grid grid-cols-2 gap-4">
                    <div className="min-w-0">
                      <dt className="text-[13px] font-semibold text-ink-3">{language === 'ko' ? '학원' : 'Academy'}</dt>
                      <dd className="truncate text-[16px] font-bold text-ink">{user.schoolName || user.schoolId}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[13px] font-semibold text-ink-3">{language === 'ko' ? '반' : 'Class'}</dt>
                      <dd className="truncate text-[16px] font-bold text-ink">
                        {isLoadingClassDetails ? (
                          <span className="inline-block h-4 w-16 animate-pulse rounded bg-sunken" />
                        ) : activeClassDetails ? (
                          `${activeClassDetails.name} (${activeClassDetails.level})`
                        ) : (
                          'N/A'
                        )}
                      </dd>
                    </div>
                  </dl>

                  {user.classId && user.classStatus === 'pending' && (
                    <p className="rounded-md bg-line-soft p-3 text-[14px] leading-normal text-ink break-keep">
                      {language === 'ko'
                        ? '선생님 승인을 기다리고 있어요. 승인되면 반 교재에 맞춰 채점해요.'
                        : 'Waiting for the teacher to approve. Once approved, grading follows the class materials.'}
                    </p>
                  )}
                  {user.classId && user.classStatus === 'active' && (
                    <p className="rounded-md bg-right-soft p-3 text-[14px] leading-normal text-ink break-keep">
                      {language === 'ko'
                        ? '연결됐어요. 이번 주 반 교재에 맞춰 채점하고 있어요.'
                        : "You're linked. Grading follows this week's class materials."}
                    </p>
                  )}

                  <div className="border-t border-rule pt-4">
                    <label htmlFor="settings-child" className="mb-2 block text-[14px] font-semibold text-ink-2">
                      {language === 'ko' ? '아이 이름' : "Child's name"}
                    </label>
                    <input
                      id="settings-child"
                      type="text"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      placeholder={language === 'ko' ? '예: 김유나' : 'e.g. Yuna Kim'}
                      className={input}
                    />
                  </div>
                  <button
                    onClick={() => setShowLeaveClassConfirm(true)}
                    className="min-h-11 text-[14px] font-semibold text-wrong underline"
                  >
                    {language === 'ko' ? '학원 연결 끊기' : 'Leave class'}
                  </button>
                </div>
              </section>
            )}

            {/* --- SUBSCRIPTION --- */}
            <section>
              <h3 className={sectionTitle}>{language === 'ko' ? '구독' : 'Plan'}</h3>
              <div className={`${card} space-y-4`}>
                {subscriptionRecord?.subscription_status === 'active' ? (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[17px] font-extrabold text-ink">
                          {isTrial
                            ? t('sub_trial_status').replace('{days}', daysLeft.toString())
                            : user?.plan === 'pro'
                              ? language === 'ko' ? '프리미엄 플랜' : 'Premium Plan'
                              : language === 'ko' ? '기본 플랜' : 'Basic Plan'}
                        </p>
                        <p className="text-[14px] text-ink-3">
                          {subscriptionRecord.subscription_platform === 'apple'
                            ? t('sub_platformApple')
                            : subscriptionRecord.subscription_platform === 'google'
                              ? t('sub_platformGoogle')
                              : subscriptionRecord.subscription_platform === 'school_code'
                                ? language === 'ko' ? '학원 제공' : 'Provided by your academy'
                                : t('sub_platformWeb')}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-line-soft px-2.5 py-0.5 text-[13px] font-bold text-line-ink">
                        {isTrial ? t('sub_trial_badge') : t('sub_active')}
                      </span>
                    </div>
                    {isTrial && daysLeft <= 2 && (
                      <p className="text-[14px] font-semibold text-line-ink">{t('sub_trial_ending')}</p>
                    )}
                    {subscriptionRecord.subscription_expiry_date && (
                      <p className="text-[14px] text-ink-2">
                        {fmtDate(subscriptionRecord.subscription_expiry_date)}
                        {t('sub_renews_on')}
                      </p>
                    )}
                    {Capacitor.getPlatform() === 'ios' ? (
                      <a href="itms-apps://apps.apple.com/account/subscriptions" className={outlineBtn}>
                        {t('sub_manage')}
                      </a>
                    ) : Capacitor.getPlatform() === 'android' ? (
                      <a href="https://play.google.com/store/account/subscriptions?package=com.chekkiai.app" className={outlineBtn}>
                        {t('sub_manage')}
                      </a>
                    ) : (
                      <p className="rounded-md bg-sunken p-3 text-[14px] text-ink-2">{t('sub_web_manage')}</p>
                    )}
                  </>
                ) : subscriptionRecord?.subscription_status === 'expired' ? (
                  <>
                    <div>
                      <p className="text-[17px] font-extrabold text-ink">{t('sub_expired')}</p>
                      {subscriptionRecord.subscription_expiry_date && (
                        <p className="text-[14px] text-ink-3">
                          {fmtDate(subscriptionRecord.subscription_expiry_date)} {t('sub_expired_on')}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        close();
                        setShowPaywall(true);
                      }}
                      className={primaryBtn}
                    >
                      {t('sub_renew_now')}
                    </button>
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-[15px] leading-relaxed text-ink-2 break-keep">
                        {language === 'ko'
                          ? '구독하면 채점을 횟수 제한 없이 쓸 수 있어요.'
                          : 'Subscribe for unlimited grading and every premium feature.'}
                      </p>
                      <span className="shrink-0 rounded-full bg-sunken px-2.5 py-0.5 text-[13px] font-bold text-ink-3">
                        {t('sub_no_active')}
                      </span>
                    </div>
                    {Capacitor.getPlatform() === 'web' ? (
                      <>
                        <p className="text-[14px] text-ink-3">
                          {language === 'ko' ? '구독은 모바일 앱에서 할 수 있어요.' : 'Subscriptions are in the mobile app.'}
                        </p>
                        <div className="flex gap-2">
                          <a
                            href="https://apps.apple.com/app/id6741479840"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={outlineBtn}
                          >
                            App Store
                          </a>
                          <span className="flex min-h-12 w-full items-center justify-center rounded-md bg-sunken text-[14px] font-semibold text-ink-3">
                            Google Play ({language === 'ko' ? '준비 중' : 'soon'})
                          </span>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          close();
                          setShowPaywall(true);
                        }}
                        className={primaryBtn}
                      >
                        {t('sub_subscribe_now')}
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>

            {/* --- PREFERENCES --- */}
            <section>
              <h3 className={sectionTitle}>{language === 'ko' ? '화면' : 'Display'}</h3>
              <div className={`${card} space-y-4`}>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-ink">{t('settings_lang_label')}</span>
                  <div className="flex rounded-md bg-sunken p-0.5" role="group" aria-label={t('settings_lang_label')}>
                    <button onClick={() => setLanguage('ko')} aria-pressed={language === 'ko'} className={segment(language === 'ko')}>
                      한국어
                    </button>
                    <button onClick={() => setLanguage('en')} aria-pressed={language === 'en'} className={segment(language === 'en')}>
                      English
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[15px] font-semibold text-ink">{t('settings_theme_label')}</span>
                  <div className="flex rounded-md bg-sunken p-0.5" role="group" aria-label={t('settings_theme_label')}>
                    <button onClick={() => setIsNight(false)} aria-pressed={!isNight} className={segment(!isNight)}>
                      <Sun size={16} weight="bold" />
                      {language === 'ko' ? '밝게' : 'Light'}
                    </button>
                    <button onClick={() => setIsNight(true)} aria-pressed={isNight} className={segment(isNight)}>
                      <Moon size={16} weight="bold" />
                      {language === 'ko' ? '어둡게' : 'Dark'}
                    </button>
                  </div>
                </div>
              </div>
            </section>

            {/* --- HELP --- */}
            <section>
              <h3 className={sectionTitle}>{language === 'ko' ? '도움' : 'Help'}</h3>
              <div className="overflow-hidden rounded-md bg-surface ring-1 ring-inset ring-rule">
                <button
                  onClick={() => setShowFeedback(true)}
                  className="flex min-h-12 w-full items-center gap-3 px-4 text-left text-[15px] font-semibold text-ink hover:bg-sunken"
                >
                  <ChatCircleText size={18} weight="bold" className="text-ink-3" />
                  {t('fb_title')}
                </button>
                <button
                  onClick={() => {
                    if (Capacitor.isNativePlatform()) {
                      InAppReview.requestReview().catch(console.error);
                    } else {
                      window.open('https://play.google.com/store/apps/details?id=com.chekkiai.app', '_blank');
                    }
                  }}
                  className="flex min-h-12 w-full items-center gap-3 border-t border-rule px-4 text-left text-[15px] font-semibold text-ink hover:bg-sunken"
                >
                  <Star size={18} weight="bold" className="text-ink-3" />
                  {language === 'ko' ? '앱 평가하기' : 'Rate this app'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
                {legalLinks.map((l) => (
                  <button
                    key={l.key}
                    onClick={() => setShowLegal(l.key)}
                    className="min-h-10 text-[13px] font-semibold text-ink-3 underline hover:text-ink"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </section>

            {/* --- PRIVACY & DEVICE CHECK (folded: rarely needed) --- */}
            <Fold
              title={language === 'ko' ? '개인정보 보호와 기기 확인' : 'Privacy & device check'}
              icon={<ShieldCheck size={20} weight="bold" />}
            >
              <p className="text-[14px] leading-relaxed text-ink-2 break-keep">{t('sec_audit_desc')}</p>
              <ul className="mt-3 space-y-1.5">
                {[1, 2, 3, 4].map((idx) => (
                  <li key={idx} className="flex items-start gap-2 text-[14px] font-semibold text-ink">
                    <Check size={16} weight="bold" className="mt-0.5 shrink-0 text-line-ink" />
                    {t(`sec_point_${idx}`)}
                  </li>
                ))}
              </ul>
              <p className="mb-2 mt-5 text-[13px] font-bold text-ink-3">{t('settings_device_diag')}</p>
              <dl className="grid grid-cols-2 gap-2">
                {[
                  { label: language === 'ko' ? '카메라' : 'Camera', val: diagResults.camera === 'granted' ? 'OK' : 'Check' },
                  { label: language === 'ko' ? '마이크' : 'Mic', val: diagResults.mic === 'granted' ? 'OK' : 'Check' },
                  { label: language === 'ko' ? '음성 지원' : 'Voice API', val: diagResults.speech },
                  { label: language === 'ko' ? '인증 상태' : 'Auth', val: diagResults.auth },
                ].map((d) => (
                  <div key={d.label} className="rounded-md bg-sunken p-3">
                    <dt className="text-[13px] font-semibold text-ink-3">{d.label}</dt>
                    <dd className="truncate text-[15px] font-bold text-ink">{d.val}</dd>
                  </div>
                ))}
              </dl>
            </Fold>

            {/* --- DELETE ACCOUNT --- */}
            <section>
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="min-h-11 w-full text-center text-[14px] font-semibold text-wrong underline"
                >
                  {t('settings_delete_account')}
                </button>
              ) : (
                <div className="space-y-3 rounded-md bg-wrong-soft p-4">
                  <p className="text-[15px] font-bold leading-normal text-ink break-keep">{t('settings_delete_confirm')}</p>
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
                      className="btn-press min-h-11 flex-1 rounded-md bg-wrong text-[14px] font-bold text-white"
                    >
                      {t('settings_delete_yes')}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      className="btn-press min-h-11 flex-1 rounded-md bg-surface text-[14px] font-bold text-ink ring-1 ring-inset ring-rule"
                    >
                      {t('settings_delete_no')}
                    </button>
                  </div>
                </div>
              )}
            </section>
          </div>

          {/* --- FIXED FOOTER --- */}
          <div className="flex shrink-0 items-center justify-between gap-3 border-t border-rule bg-surface px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] sm:px-6">
            <span role="status" className={`min-w-0 text-[14px] font-semibold ${saveErrorMsg ? 'text-wrong' : 'text-correct'}`}>
              {saveErrorMsg || successMsg}
            </span>
            <button
              onClick={handleSave}
              className="btn-press min-h-12 shrink-0 rounded-md bg-line px-8 text-[15px] font-bold text-[#2b211a]"
            >
              {t('settings_save')}
            </button>
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
          warm
          onConfirm={() => {
            setShowLeaveClassConfirm(false);
            leaveClassroom().catch((e) => {
              console.error('Failed to leave class:', e);
              setSaveErrorMsg(
                language === 'ko' ? '학급 탈퇴에 실패했습니다. 다시 시도해주세요.' : "Couldn't leave the class. Please try again."
              );
            });
          }}
          onCancel={() => setShowLeaveClassConfirm(false)}
        />
      )}
    </>
  );
};
