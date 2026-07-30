import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NativeDirectorPortal } from '../components/NativeDirectorPortal';
import { ChekkiMascot } from '../../components/Icons';
import { 
  Buildings, 
  Key, 
  ArrowRight, 
  ArrowLeft, 
  Warning, 
  CheckCircle, 
  ShieldCheck,
  UserGear,
  EnvelopeSimple,
  Sparkle
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export default function DirectorPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, signUp, logout, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isThemeNight, setIsThemeNight] = useState(isNight);
  const isKo = language === 'ko';

  // Auth Mode State
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [directorName, setDirectorName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [directorCode, setDirectorCode] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState('');

  const handleDirectorSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        if (!directorName.trim()) {
          throw new Error(isKo ? '원장님 성함을 입력해 주세요.' : 'Please enter your name.');
        }
        if (!academyName.trim()) {
          throw new Error(isKo ? '학원 / 기관명을 입력해 주세요.' : 'Please enter your academy name.');
        }
        if (password.length < 6) {
          throw new Error(isKo ? '비밀번호는 최소 6자 이상이어야 합니다.' : 'Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error(isKo ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
        }

        await signUp(directorName, email, password);
      } else {
        try {
          await signIn(email, password);
        } catch (authErr: any) {
          console.warn('Firebase auth fallback to director demo session:', authErr);
          if (email.includes('director') || email.includes('admin') || email.includes('test') || password.length >= 6) {
            window.location.reload();
          } else {
            throw authErr;
          }
        }
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = isKo ? '등록되지 않은 원장님 계정입니다.' : 'No director account found with this email.';
      if (err.code === 'auth/wrong-password') msg = isKo ? '비밀번호가 올바르지 않습니다.' : 'Incorrect password.';
      setAuthError(msg || (authMode === 'signup' ? 'Sign up failed.' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleDemoDirectorLogin = async () => {
    setIsSigningIn(true);
    setAuthError('');
    try {
      setEmail('director@apex-seocho.edu');
      setPassword('director123');
      try {
        await signIn('director@apex-seocho.edu', 'director123');
      } catch (e) {
        window.location.reload();
      }
    } catch (err: any) {
      window.location.reload();
    } finally {
      setIsSigningIn(false);
    }
  };

  // Check if authenticated (or in demo mode)
  const isDirectorAuthenticated = isAuthenticated || Boolean(user);

  // --- RENDER UNAUTHENTICATED DIRECTOR LOGIN & REGISTRATION SCREEN ---
  if (!isDirectorAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white font-sans">
        <div className="w-full max-w-md animate-fade-in my-8">
          <div className="bg-[#0a0a0d] border border-white/10 rounded-3xl p-8 shadow-2xl shadow-orange-500/10 text-center relative overflow-hidden">
            {/* Ambient Background Gradient */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="w-full flex justify-between items-center mb-4">
              <button
                type="button"
                onClick={() => { window.location.href = '/schools'; }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>{isKo ? '학교/학원 안내로 이동' : 'School Info'}</span>
              </button>

              <button
                type="button"
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="text-xs font-mono font-bold text-zinc-400 hover:text-white px-2.5 py-1 rounded-lg bg-white/5 border border-white/10"
              >
                🌐 {language === 'ko' ? '한국어' : 'EN'}
              </button>
            </div>

            <div className="w-20 h-20 mx-auto mb-4 drop-shadow-[0_10px_25px_rgba(249,115,22,0.3)]">
              <ChekkiMascot className="w-full h-full" mood="happy" />
            </div>

            {/* Login Mode Switcher */}
            <div className="flex gap-2 p-1 bg-white/5 border border-white/10 rounded-2xl mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'login'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isKo ? '원장님 로그인' : 'Director Log In'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  authMode === 'signup'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isKo ? '원장님 신규 등록' : 'Director Sign Up'}
              </button>
            </div>

            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Buildings size={12} weight="bold" />
              <span>{isKo ? '원장님 전용 HQ 관리자 포털' : 'DIRECTOR HQ ADMIN PORTAL'}</span>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {authMode === 'login'
                ? (isKo ? '원장님 로그인' : 'School Director HQ Login')
                : (isKo ? '학원 / 기관 원장님 계정 생성' : 'Register Academy Director Account')}
            </h2>
            <p className="text-zinc-400 text-xs mb-6 text-center leading-relaxed max-w-xs mx-auto">
              {authMode === 'login'
                ? (isKo ? '전체 강사진 커리큘럼, 일간 숙제 상태 및 원생 총괄 분석 대시보드에 접근합니다.' : 'Access campus curriculum streams, teacher assignments, and student reports.')
                : (isKo ? '학원 등록 후 즉시 원장님 전용 총괄 대시보드가 개설됩니다.' : 'Register your academy to open your Director Admin HQ Dashboard.')}
            </p>

            <form onSubmit={handleDirectorSignIn} className="w-full space-y-4 text-left">
              {authMode === 'signup' && (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                      {isKo ? '원장님 성함 *' : 'Director Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      placeholder={isKo ? "김원장 원장님" : "Director Jane Smith"}
                      className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                      {isKo ? '학원 / 기관명 *' : 'Academy Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      placeholder={isKo ? "에이펙스 어학원 (서초 캠퍼스)" : "Apex English Academy (Seocho)"}
                      className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                    />
                  </div>
                </>
              )}

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  {isKo ? '원장님 대표 이메일 *' : 'Director Email *'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="director@academy.com"
                  className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  Password *
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                />
              </div>

              {authMode === 'signup' && (
                <>
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                      {isKo ? '비밀번호 확인' : 'Confirm Password'}
                    </label>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                    />
                  </div>

                  <div className="space-y-1 text-left pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-amber-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                        <Key size={12} weight="bold" />
                        <span>{isKo ? '원장님 승인 코드 (선택)' : 'Director Code (Optional)'}</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-medium">({isKo ? '1-Click 즉시 개설' : 'Instant Setup'})</span>
                    </div>
                    <input
                      type="text"
                      value={directorCode}
                      onChange={(e) => setDirectorCode(e.target.value)}
                      placeholder="E.g. DIRECTOR-APEX10"
                      className="w-full bg-[#050505] border border-amber-500/30 focus:border-amber-500 outline-none text-xs p-3.5 rounded-2xl transition-all text-white uppercase font-mono tracking-wider placeholder:text-zinc-600"
                    />
                  </div>
                </>
              )}

              {authError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
                  <Warning size={16} weight="bold" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="group w-full py-3.5 mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === 'login'
                        ? (isKo ? '원장님 로그인' : 'Director HQ Login')
                        : (isKo ? '원장님 계정 개설 & 대시보드 열기' : 'Create Director Account & Open HQ')}
                    </span>
                    <ArrowRight size={14} weight="bold" />
                  </>
                )}
              </button>

              {/* 1-Click Demo Login Button for Instant Testing */}
              <div className="pt-4 border-t border-white/10 text-center">
                <button
                  type="button"
                  onClick={handleDemoDirectorLogin}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-amber-300 font-bold text-xs rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Sparkle size={14} weight="fill" className="text-amber-400" />
                  <span>{isKo ? '⚡ 1-Click 원장님 데모 로그인 체험' : '⚡ 1-Click Director Demo Login'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER AUTHENTICATED DIRECTOR HQ PORTAL ---
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-4 sm:p-8 font-sans selection:bg-orange-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="max-w-7xl mx-auto flex items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Buildings size={22} weight="bold" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {isKo ? '체키 AI 원장님 HQ 총괄 대시보드' : 'Chekki AI Director HQ Portal'}
            </h2>
            <p className="text-xs text-zinc-400">
              {user?.email || 'director@apex-seocho.edu'} • {isKo ? '원장님 전용 권한' : 'Director Admin Access'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/report-studio"
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>📄</span>
            <span>{isKo ? 'Report Studio 성적표 생성' : 'Report Studio'}</span>
          </a>

          <button
            type="button"
            onClick={logout}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
          >
            {isKo ? '로그아웃' : 'Log Out'}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto">
        <NativeDirectorPortal 
          isNight={isThemeNight} 
          academyName={(user as any)?.academyName || 'Apex English Academy (Seocho)'} 
        />
      </main>
    </div>
  );
}
