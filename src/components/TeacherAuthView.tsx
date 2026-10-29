import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { auth } from '../../services/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { seatsForPlan, labelsForPlan } from '../../api/_lib/pricingTiers';
import {
  ArrowRight,
  ArrowLeft,
  ChalkboardTeacher,
  Warning,
  Buildings,
} from '@phosphor-icons/react';

interface Props {
  loginRole: 'teacher' | 'director';
  setLoginRole: React.Dispatch<React.SetStateAction<'teacher' | 'director'>>;
  inviteSlug: string;
  activationPlanId: string | null;
  isActivateParam: boolean;
}

// Schools sign-in and sign-up screen (/teacher before auth). Extracted from
// TeacherPage.tsx; owns the form, invite redemption and forgot-password.
export function TeacherAuthView({ loginRole, setLoginRole, inviteSlug, activationPlanId, isActivateParam }: Props) {
  const { signIn, signUp } = useAuth();
  const { language, setLanguage } = useLanguage();
  const isKo = language === 'ko';
  // Auth state - Defaults to 'signup' if coming from setup CTA or invite link
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('activate') === 'true' || params.get('invite') || params.get('signup') === 'true') {
        return 'signup';
      }
    }
    return 'login';
  });
  const [name, setName] = useState('');
  const [academyNameInput, setAcademyNameInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Separate from the settings modal's reset status in TeacherPage: this
  // screen sends the reset to whatever email is typed, not the signed-in user.
  const [resetPwStatus, setResetPwStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  // Direct teacher self-signup is disabled (see the Auth Mode Toggle render
  // guard further down) — teacher accounts only exist via a director's
  // invite link now. Without this, a bare /teacher?signup=true visit could
  // still land in 'signup' mode for a teacher with the toggle hidden and no
  // way back to Log In.
  useEffect(() => {
    if (loginRole === 'teacher' && !inviteSlug && authMode === 'signup') {
      setAuthMode('login');
    }
  }, [loginRole, inviteSlug, authMode]);

  // Login screen: no user yet, so reset goes to whatever is typed in the
  // email field. Same message for unknown emails (no account enumeration).
  const handleForgotPassword = async () => {
    const target = email.trim();
    if (!target) {
      setResetPwStatus({ text: isKo ? '위에 이메일을 먼저 입력해 주세요.' : 'Enter your email above first.', isError: true });
      return;
    }
    setIsSendingReset(true);
    try {
      await sendPasswordResetEmail(auth, target);
    } catch { /* fall through to the neutral message */ }
    setResetPwStatus({
      text: isKo
        ? `${target}로 가입된 계정이 있다면 재설정 링크를 보냈어요. 메일함을 확인해 주세요.`
        : `If ${target} has an account, we've sent a reset link. Check your inbox.`,
    });
    setIsSendingReset(false);
  };

  // Redeems the current inviteSlug (a director-generated single-use invite
  // link) against whichever account just authenticated — shared by both the
  // signup and login paths below. Previously only the signup branch called
  // this; a teacher whose Firebase Auth account already existed (e.g.
  // removed from a school, then re-invited to a different one) hit
  // "auth/email-already-in-use" on signup, was told to log in instead, but
  // the login branch never redeemed the invite at all — they'd sign in
  // successfully and land right back on their old, now-stale profile with
  // no class, no matter how many times they clicked the new invite link
  // (audit: re-invited teacher can't accept a new invite email).
  const redeemInviteIfPresent = async () => {
    if (!inviteSlug) return;
    const uid = auth.currentUser?.uid || '';
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/redeem-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ inviteId: inviteSlug }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to redeem invite');
      }
      if (uid) {
        localStorage.setItem(`chekki_user_role_${uid}`, 'teacher');
        localStorage.setItem(`chekki_educator_role_${uid}`, data.educatorRole);
        if (data.schoolName) localStorage.setItem(`chekki_invite_school_name_${uid}`, data.schoolName);
        if (data.invitedByName) localStorage.setItem(`chekki_invite_by_${uid}`, data.invitedByName);
        localStorage.setItem(`chekki_invite_school_${uid}`, inviteSlug);
      }
      // Un-uid-keyed mirrors — read by the welcome-screen initializer, which
      // runs on the reload below before Firebase auth has necessarily
      // restored the uid synchronously.
      if (data.schoolName) localStorage.setItem('chekki_invite_school_name', data.schoolName);
      if (data.invitedByName) localStorage.setItem('chekki_invite_by', data.invitedByName);
      localStorage.setItem('chekki_invite_school', inviteSlug);
    } catch (inviteErr: any) {
      throw new Error(
        isKo
          ? `초대 링크를 사용할 수 없습니다: ${inviteErr.message}`
          : `This invite link couldn't be used: ${inviteErr.message}`
      );
    }

    // The `?invite=` param never got cleared after a successful redemption,
    // so it stuck around through the reload and every reload after that —
    // the "you're signed in as a different account, invite wasn't applied"
    // banner is gated on nothing but that param being present (see
    // showInviteSessionNotice), so it kept flashing on the account that had
    // JUST correctly redeemed the invite.
    const url = new URL(window.location.href);
    url.searchParams.delete('invite');
    window.history.replaceState({}, '', url.toString());
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          throw new Error(isKo ? '선생님 이름을 입력해 주세요.' : 'Please enter your name.');
        }
        if (password.length < 6) {
          throw new Error(isKo ? '비밀번호는 최소 6자 이상이어야 합니다.' : 'Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error(isKo ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
        }

        await signUp(name, email, password);

        const newUid = auth.currentUser?.uid || '';

        if (inviteSlug) {
          // Arrived via a role-locked director invite (audit §21d) — role and
          // educatorRole are decided by the invite document, not the signup
          // form's Teacher/Director toggle. Redeeming is server-side via the
          // Admin SDK, same reasoning as set-initial-role below.
          await redeemInviteIfPresent();
        } else {
          // Assign the role server-side — firestore.rules blocks clients from
          // writing their own `role` field, so a direct client updateDoc() call
          // silently fails (audit §20b). /api/set-initial-role uses the Admin
          // SDK and only allows a one-time assignment on a fresh account.
          const assignedRole = loginRole === 'director' ? 'director' : 'teacher';
          if (newUid) {
            try {
              const idToken = await auth.currentUser?.getIdToken();
              const planId = typeof window !== 'undefined' ? sessionStorage.getItem('chekki_selected_plan') || undefined : undefined;
              const response = await fetch('/api/set-initial-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                  role: assignedRole,
                  planId,
                  // The signup form never sent this, so every new director's
                  // school silently fell back to the server's "New Academy"
                  // placeholder with no way to rename it afterward (Audit:
                  // dashboard shows "New Academy", no academy-name step).
                  academyName: assignedRole === 'director' ? academyNameInput.trim() || undefined : undefined,
                }),
              });
              if (!response.ok) {
                const failure = await response.json().catch(() => ({}));
                console.warn('Server-side role assignment failed, using localStorage fallback:', failure);
                if (failure.needsEmailVerification) {
                  window.alert(
                    isKo
                      ? `결제하신 학원을 연결하려면 이메일 인증이 필요합니다. ${email} 로 보낸 인증 링크를 누른 뒤 이 페이지를 새로고침해 주세요.`
                      : `To connect your paid academy, please verify your email. Click the link we sent to ${email}, then reload this page.`
                  );
                }
                // Retried automatically by the pendingRoleSync effect below
                // on this device — the role otherwise only lives in
                // localStorage and silently vanishes on any other
                // device/browser.
                localStorage.setItem(`chekki_pending_role_sync_${newUid}`, assignedRole);
              }
            } catch (roleErr) {
              console.warn('Role write failed, using localStorage fallback:', roleErr);
              localStorage.setItem(`chekki_pending_role_sync_${newUid}`, assignedRole);
            }
            localStorage.setItem(`chekki_user_role_${newUid}`, assignedRole);
          }
        }

        window.location.reload();

      } else {
        await signIn(email, password);
        // A teacher whose account already existed (removed from a school,
        // then re-invited) never got their new invite redeemed before this
        // fix — the signup branch above was the only one that called
        // redeemInviteIfPresent, and "email already in use" pointed them
        // here without ever completing the redemption. Same reload as
        // signup: the redeemed role/schoolId need a clean re-fetch.
        if (inviteSlug) {
          await redeemInviteIfPresent();
          window.location.reload();
        }
      }
    } catch (err: any) {
      let msg = err.message;
      // One message for unknown email and wrong password, so this form can't
      // be used to check which emails have accounts (same fix as the parent
      // app's LoginModal, docs/DECISIONS.md #020). Newer Firebase SDKs and
      // projects with email enumeration protection already return
      // auth/invalid-credential for both.
      if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(err.code)) {
        msg = isKo ? '이메일 또는 비밀번호가 올바르지 않습니다.' : 'Incorrect email or password.';
      }
      if (err.code === 'auth/email-already-in-use') msg = isKo ? '이미 가입된 이메일입니다. 로그인해 주세요.' : 'Email already registered. Please log in.';
      setAuthError(msg || (authMode === 'signup' ? 'Sign up failed.' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsSigningIn(false);
    }
  };

  // A director arriving fresh off picking a plan on /schools (?plan=... in
  // the URL, carried into activationPlanId above) gets a dedicated signup
  // screen instead of the shared Login/SignUp toggle — see caveman review:
  // "no Login vs Sign Up choice for someone who just picked a plan."
  const isPlanSignup = !!(activationPlanId && isActivateParam && loginRole === 'director' && authMode === 'signup' && !inviteSlug);
  const planSeats = seatsForPlan(activationPlanId);
  const planLabel = labelsForPlan(activationPlanId);
  return (
    <div className="fixed inset-0 z-[500] overflow-y-auto bg-ground text-ink-2 flex items-start sm:items-center justify-center px-4 py-8 sm:py-4 selection:bg-line selection:text-on-line">
      <div className="relative w-full max-w-md flex flex-col">
        <div className="bg-surface rounded-lg p-8 sm:p-10 flex flex-col items-center ring-1 ring-inset ring-rule">
          <div className="w-full flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={() => { window.location.href = loginRole === 'director' ? '/schools' : '/'; }}
              className="inline-flex items-center gap-1.5 text-xs text-ink-3 hover:text-ink transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} weight="bold" />
              <span>{loginRole === 'director' ? (isKo ? '학원용 소개로 돌아가기' : 'Back to Chekki for Schools') : (isKo ? '메인 서비스로 돌아가기' : 'Return to Main Service')}</span>
            </button>
            {/* The only language switcher lived in the post-auth header
                (below), leaving every pre-auth screen — login, signup,
                and specifically an invited FT/KT arriving straight at an
                invite link with no prior page to set language on — stuck
                in whatever language the app happened to load in, with no
                way to change it before creating their account. */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="inline-flex items-center gap-1 text-xs text-ink-3 hover:text-ink transition-colors cursor-pointer shrink-0"
              title="Switch Language / 언어 변경"
            >
              
              <span>{language === 'ko' ? '한국어' : 'EN'}</span>
            </button>
          </div>

          {/* Role Switcher Pill (Teacher vs Director HQ) — hidden when the
              account is arriving via a role-locked director invite link,
              since the role isn't a choice in that case (audit §21d), and
              also hidden for a plan-linked director signup (picked a plan
              on /schools) since that's already role-locked to director. */}
          {/* Sign-in doesn't need a role choice — the account's own role
              decides which dashboard opens. The toggle only matters for
              creating an account. */}
          {authMode === 'signup' && !inviteSlug && !isPlanSignup && (
            <div className="w-full flex p-1 bg-surface border border-rule rounded-lg mb-4">
              <button
                type="button"
                onClick={() => { setLoginRole('teacher'); setAuthError(''); if (!inviteSlug) setAuthMode('login'); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginRole === 'teacher'
                    ? 'bg-line text-on-line'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <ChalkboardTeacher size={14} weight="bold" />
                <span>{isKo ? '선생님' : 'Teacher'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setLoginRole('director'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer flex items-center justify-center gap-1.5 ${
                  loginRole === 'director'
                    ? 'bg-line text-on-line'
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                <Buildings size={14} weight="bold" />
                <span>{isKo ? '원장님' : 'Director'}</span>
              </button>
            </div>
          )}
          {/* Invited signup gets ONE badge, not three stacked banners that
              all said the same thing (audit: "Teacher Access Portal" pill +
              "Joining via invite link" card + "creating account from an
              invite" banner all rendered together, looking cluttered). */}
          {inviteSlug && authMode === 'signup' ? (
            <div className="w-full mb-4 p-3.5 rounded-lg bg-right-soft border border-rule flex items-center gap-2.5">
              <Buildings size={16} className="text-correct shrink-0" />
              <div className="text-left">
                <p className="text-[12px] text-correct font-bold">{isKo ? '초대받은 선생님 계정 생성' : "You're creating a teacher account from an invite"}</p>
                <p className="text-xs font-bold text-ink">{isKo ? '가입 후 학원명이 표시됩니다' : "You'll see your academy's name once you sign up."}</p>
              </div>
            </div>
          ) : null /* role toggle + heading already name the role */}

          {/* Auth Mode Toggle (Login vs Sign Up) — hidden for a plan-linked
              director signup, replaced by a small "already have an
              account?" link below instead. That choice belongs to
              returning users, not someone who just picked a plan.
              Also hidden for teacher-without-invite: this used to offer a
              self-serve "Sign Up" that promised joining a school "via
              their authorization code," but no code field was ever wired
              up in this form — the account it created had no schoolId, no
              educatorRole, and no class, a permanent dead end. Teacher
              accounts are only ever created via a director's invite link
              now (audit §21); direct teacher signup below is disabled. */}
          {!isPlanSignup && !(loginRole === 'teacher' && !inviteSlug) && !inviteSlug && (
            <div className="w-full flex bg-surface p-1 rounded-lg border border-rule mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                  authMode === 'login'
                    ? (loginRole === 'director' ? 'bg-line text-on-line' : 'bg-line text-on-line')
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {isKo ? '로그인' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer ${
                  authMode === 'signup'
                    ? (loginRole === 'director' ? 'bg-line text-on-line' : 'bg-line text-on-line')
                    : 'text-ink-3 hover:text-ink'
                }`}
              >
                {isKo ? '회원가입' : 'Sign Up'}
              </button>
            </div>
          )}

          <h2 className="text-2xl font-extrabold tracking-tight text-ink mb-2 font-display">
            {isPlanSignup
              ? (isKo
                  ? `${planLabel.nameKo} 원장님 계정 만들기 — 원어민 선생님 ${planSeats.ft}명, 한국인 선생님 ${planSeats.kt}명`
                  : `Create your director account for ${planLabel.nameEn}: ${planSeats.ft} foreign teacher and ${planSeats.kt} Korean teacher seats`)
              : authMode === 'login'
              ? (isKo ? '로그인' : 'Sign in')
              : (loginRole === 'director' ? (isKo ? '원장님 계정 생성' : 'Create Director Account') : (isKo ? '교사 계정 생성' : 'Create Teacher Account'))}
          </h2>
          <p className={`text-ink-3 text-xs text-center leading-relaxed max-w-xs ${isPlanSignup ? 'mb-2' : 'mb-6'}`}>
            {isPlanSignup
              ? (activationPlanId === 'trial'
                  ? (isKo ? '신용카드 등록 없이 14일 무료 체험이 바로 시작됩니다.' : 'Free for 14 days, no payment required now.')
                  : (isKo ? '가입 즉시 원장님 전용 대시보드가 개설됩니다. 결제는 대시보드에서 별도로 안내드립니다.' : 'Your Director dashboard activates immediately after signup — billing is handled separately from your dashboard.'))
              : authMode === 'login'
              ? (isKo ? '선생님과 원장님 모두 여기에서 로그인합니다.' : 'Teachers and directors both sign in here.')
              : (loginRole === 'director'
                  ? (isKo ? '학원명을 등록하고 즉시 원장님 전용 대시보드를 개설하세요.' : 'Register your academy and open your director dashboard.')
                  : inviteSlug
                  ? (isKo ? '아래 정보를 입력해 계정을 만드세요.' : 'Fill in your details below to create your account.')
                  : (isKo ? '가입 후 전달받으신 교사 인증 코드를 등록하여 즉시 시작하세요.' : 'Sign up to register your school authorization code.'))}
          </p>
          {!isPlanSignup && loginRole === 'teacher' && !inviteSlug && (
            <p className="text-[12px] text-ink-3 text-center max-w-xs -mt-4 mb-6 leading-relaxed">
              {isKo
                ? '교사 계정은 원장님의 초대 링크로만 생성됩니다. 초대 링크가 없다면 원장님께 요청해 주세요.'
                : "Teacher accounts are only created via your director's invite link. Ask them to send you one."}
            </p>
          )}
          {isPlanSignup && (
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setAuthError(''); }}
              className="text-[12px] text-ink-3 hover:text-ink-3 transition-colors cursor-pointer mb-6 underline underline-offset-2"
            >
              {isKo ? '이미 계정이 있으신가요? 로그인' : 'Already have an account? Log in'}
            </button>
          )}

          <form onSubmit={handleSignIn} className="w-full space-y-4">
            {authMode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-ink-3 pl-1">
                  {loginRole === 'director' ? (isKo ? '원장님 성함' : 'Director Name') : (isKo ? '선생님 성함' : 'Teacher Full Name')}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={loginRole === 'director' ? (isKo ? "예: 김지원" : "e.g. Kim Ji-won") : (isKo ? "예: 김지원" : "e.g. Sarah Lee")}
                  className="w-full bg-surface border border-rule focus:border-line outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] text-ink placeholder:text-ink-3/60"
               />
              </div>
            )}

            {authMode === 'signup' && loginRole === 'director' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-ink-3 pl-1">
                  {isKo ? '학원명' : 'Academy Name'}
                </label>
                <input
                  type="text"
                  required
                  value={academyNameInput}
                  onChange={(e) => setAcademyNameInput(e.target.value)}
                  placeholder={isKo ? '예: 해피 잉글리시 어학원' : 'e.g. Happy English Academy'}
                  className="w-full bg-surface border border-rule focus:border-line outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] text-ink placeholder:text-ink-3/60"
               />
              </div>
            )}

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-ink-3 pl-1">
                {inviteSlug && authMode === 'signup' ? (isKo ? '이메일 확인' : 'Confirm your email') : (isKo ? '이메일' : 'Email')}
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={loginRole === 'director' ? "director@school.com" : "teacher@school.com"}
                className="w-full bg-surface border border-rule focus:border-line outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] text-ink placeholder:text-ink-3/60"
             />
            </div>

            <div className="space-y-1.5 text-left">
              <label className="text-xs font-bold text-ink-3 pl-1">
                {isKo ? '비밀번호' : 'Password'}
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-rule focus:border-line outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] text-ink placeholder:text-ink-3/60"
             />
              {authMode === 'login' && (
                <button
                  type="button"
                  disabled={isSendingReset}
                  onClick={handleForgotPassword}
                  className="min-h-11 pl-1 text-xs text-ink-3 hover:text-ink-2 underline underline-offset-2 cursor-pointer transition-colors disabled:opacity-50"
                >
                  {isKo ? '비밀번호를 잊으셨나요?' : 'Forgot password?'}
                </button>
              )}
              {authMode === 'login' && resetPwStatus && (
                <p role="status" className={`pl-1 text-xs break-keep ${resetPwStatus.isError ? 'text-wrong' : 'text-ink-2'}`}>
                  {resetPwStatus.text}
                </p>
              )}
            </div>

            {authMode === 'signup' && (
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-ink-3 pl-1">
                  {isKo ? '비밀번호 확인' : 'Confirm Password'}
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-surface border border-rule focus:border-line outline-none text-sm p-4 rounded-lg transition-[color,background-color,border-color,box-shadow,transform] text-ink placeholder:text-ink-3"
               />
              </div>
            )}


            {authError && (
              <div className="p-4 bg-wrong-soft border border-rule text-wrong text-xs font-semibold rounded-lg text-center flex items-center justify-center gap-2">
                <Warning size={16} weight="bold" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSigningIn}
              className="group w-full py-4 mt-2 bg-line hover:bg-line disabled:opacity-50 text-on-line font-bold text-sm rounded-lg transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
            >
              {isSigningIn ? (
                <div className="w-5 h-5 border-2 border-rule border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {authMode === 'login'
                      ? (isKo ? '로그인' : 'Log In')
                      : (loginRole === 'director' ? (isKo ? '무료 체험 시작하기' : 'Start free trial') : (isKo ? '가입하고 시작하기' : 'Sign up and start'))}
                  </span>
                  <ArrowRight size={16} weight="bold" aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          {authMode === 'login' && !inviteSlug && !isPlanSignup && loginRole === 'teacher' && (
            <button
              type="button"
              onClick={() => { setLoginRole('director'); setAuthMode('signup'); setAuthError(''); }}
              className="mt-5 min-h-11 text-xs text-ink-3 hover:text-ink-2 underline underline-offset-2 cursor-pointer transition-colors"
            >
              {isKo ? '새 학원이신가요? 원장님 계정 만들기' : 'New academy? Create a director account'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
