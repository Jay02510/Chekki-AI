import React, { useState } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { SignOut, Trash, X } from '@phosphor-icons/react';
import { auth } from '../../services/database';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import type { UserProfile } from '../../types';

interface Props {
  isKo: boolean;
  user: UserProfile | null;
  loginRole: 'teacher' | 'director';
  educatorRole: 'ft' | 'kt';
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
  setTeacherObStep: React.Dispatch<React.SetStateAction<number>>;
  setShowTeacherOnboarding: React.Dispatch<React.SetStateAction<boolean>>;
  setShowFeedbackModal: React.Dispatch<React.SetStateAction<boolean>>;
  handleDeleteTeacherAccount: () => Promise<void>;
  isDeletingAccount: boolean;
  logout: () => void;
}

// Staff settings: account info, password reset, tour replay, feedback,
// sign-out and account deletion. Mounted only while open, so the reset
// status starts empty each time.
export function TeacherSettingsModal({
  isKo,
  user,
  loginRole,
  educatorRole,
  setShowSettingsModal,
  setTeacherObStep,
  setShowTeacherOnboarding,
  setShowFeedbackModal,
  handleDeleteTeacherAccount,
  isDeletingAccount,
  logout,
}: Props) {
  const settingsDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: true,
    onClose: () => setShowSettingsModal(false),
  });
  const [resetPwStatus, setResetPwStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    setResetPwStatus(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetPwStatus({
        text: isKo
          ? `비밀번호 재설정 링크가 ${user.email}로 발송되었습니다.`
          : `Password reset email sent to ${user.email}.`,
      });
    } catch (err: any) {
      setResetPwStatus({
        text: err.message || (isKo ? '비밀번호 재설정 이메일 발송 실패' : 'Failed to send password reset email'),
        isError: true,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-[#2b211a]/55" 
        onClick={() => setShowSettingsModal(false)} 
     />
      <div
        ref={settingsDialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-modal-title"
        tabIndex={-1}
        className={`relative p-1 border rounded-lg flex flex-col w-full max-w-lg mx-4 animate-fade-in text-left ${
        'bg-surface border-rule'
      }`}>
        <div className={`relative w-full h-full rounded-lg p-8 transition-colors ${
          'bg-surface text-ink'
        }`}>
          <button
            type="button"
            onClick={() => setShowSettingsModal(false)}
            aria-label={isKo ? '닫기' : 'Close'}
            className={`absolute top-6 right-6 min-w-11 min-h-11 flex items-center justify-center rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
              'text-ink-3 hover:text-ink bg-sunken hover:bg-sunken'
            }`}
          >
            <X size={16} weight="bold" />
          </button>

          <h3 id="settings-modal-title" className="mb-6 text-[22px] font-extrabold tracking-[-0.01em] text-ink">
            {loginRole === 'director' || user?.role === 'director'
              ? (isKo ? '원장님 설정' : 'Director settings')
              : (educatorRole === 'kt'
                  ? (isKo ? '한국인 선생님 설정' : 'Korean teacher settings')
                  : (isKo ? '원어민 선생님 설정' : 'Foreign teacher settings'))}
          </h3>

          <div className="space-y-6">
            {/* Profile Info */}
            <div className={`p-4 border rounded-lg space-y-2 ${
              'bg-surface border-rule'
            }`}>
              <span className="text-[12px] font-bold text-ink-3 block">
                {isKo ? '계정 정보' : 'Account'}
              </span>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-3">
                  {loginRole === 'director' || user?.role === 'director' 
                    ? (isKo ? '원장님 성함' : 'Director Name') 
                    : (isKo ? '선생님 성함' : 'Teacher Name')}:
                </span>
                <strong className={'text-ink'}>{user?.name || 'Director Admin'}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-3">{isKo ? '이메일 주소' : 'Email Address'}:</span>
                <strong className={` text-ink`}>{user?.email}</strong>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-ink-3">{isKo ? '소속 학원' : 'Assigned School'}:</span>
                <strong className="text-line-ink">{user?.schoolName || 'B2B Academy'}</strong>
              </div>
            </div>

            {/* Password Reset */}
            <div className={`p-4 border rounded-lg space-y-3 ${
              'bg-surface border-rule'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <h4 className={`text-xs font-bold mb-0.5 text-ink`}>
                    {isKo ? '비밀번호 재설정' : 'Password & Security'}
                  </h4>
                  <p className="text-[12px] text-ink-3">
                    {isKo ? '이메일로 비밀번호 재설정 링크를 받습니다.' : 'Receive a password reset link via email.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleSendResetPassword}
                  className={`px-3.5 py-2 disabled:opacity-50 font-bold text-xs rounded-md border transition-[color,background-color,border-color,box-shadow,transform] whitespace-nowrap cursor-pointer ${
                    'bg-sunken hover:bg-sunken text-ink border-rule'
                  }`}
                >
                  {isSendingReset ? (isKo ? '발송 중...' : 'Sending...') : (isKo ? '재설정 이메일 발송' : 'Reset Password')}
                </button>
              </div>
              {resetPwStatus && (
                <p className={`text-xs p-2.5 rounded-md font-medium ${resetPwStatus.isError ? 'bg-wrong-soft text-wrong border border-rule' : 'bg-right-soft text-correct border border-rule'}`}>
                  {resetPwStatus.text}
                </p>
              )}
            </div>

            {/* Re-open Walkthrough Guide — the tour's content is FT/KT-
                specific (waiting on a director's class assignment), so
                hide this for directors rather than show them a guide
                written about a role they don't have (Audit: director's
                settings surfaced the FT/KT-worded tour). */}
            {loginRole !== 'director' && user?.role !== 'director' && (
              <div className={`flex items-center justify-between p-4 border rounded-lg ${
                'bg-surface border-rule'
              }`}>
                <div>
                  <h4 className={`text-xs font-bold mb-0.5 text-ink`}>
                    {isKo ? '교사 온보딩 가이드 다시보기' : 'Onboarding Walkthrough'}
                  </h4>
                  <p className="text-[12px] text-ink-3">
                    {isKo ? '학급 개설 및 학부모 6자리 코드 연결 가이드' : 'Review 3-step teacher tutorial guide.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    setTeacherObStep(0);
                    setShowTeacherOnboarding(true);
                  }}
                  className={`px-3.5 py-2 font-bold text-xs rounded-md border transition-[color,background-color,border-color,box-shadow,transform] whitespace-nowrap cursor-pointer ${
                    'bg-sunken hover:bg-sunken text-ink border-rule'
                  }`}
                >
                  {isKo ? '가이드 열기' : 'Open Tutorial'}
                </button>
              </div>
            )}

            {/* Report a Bug / Send Feedback — staff dashboard had no path to
                reach us at all; only the parent-facing app did. */}
            <div className={`flex items-center justify-between p-4 border rounded-lg ${
              'bg-surface border-rule'
            }`}>
              <div>
                <h4 className={`text-xs font-bold mb-0.5 text-ink`}>
                  {isKo ? '버그 신고 / 의견 보내기' : 'Report a Bug / Send Feedback'}
                </h4>
                <p className="text-[12px] text-ink-3">
                  {isKo ? '문제를 발견하셨나요? 팀에게 바로 알려주세요.' : 'Found something broken? Let us know directly.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowFeedbackModal(true);
                }}
                className="px-3.5 py-2 bg-line-soft hover:bg-line-soft text-line-ink font-bold text-xs rounded-md border border-rule transition-[color,background-color,border-color,box-shadow,transform] whitespace-nowrap cursor-pointer"
              >
                {isKo ? '보내기' : 'Send'}
              </button>
            </div>

            {/* Account Actions: Delete Account & Log Out */}
            <div className="pt-2 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={handleDeleteTeacherAccount}
                disabled={isDeletingAccount}
                className="w-full py-3 bg-wrong-soft hover:bg-wrong-soft text-wrong font-bold text-xs rounded-lg border border-rule transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
              >
                <Trash size={16} weight="bold" />
                <span>{isDeletingAccount ? (isKo ? '계정 삭제 중...' : 'Deleting Account...') : (isKo ? '선생님 계정 영구 삭제' : 'Permanently Delete Account')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  logout();
                }}
                className={`w-full py-3 font-bold text-xs rounded-lg border transition-[color,background-color,border-color,box-shadow,transform] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                  'bg-sunken hover:bg-sunken text-ink-2 border-rule'
                }`}
              >
                <SignOut size={16} weight="bold" />
                <span>{isKo ? '교사 계정 로그아웃' : 'Log Out of Teacher Account'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
