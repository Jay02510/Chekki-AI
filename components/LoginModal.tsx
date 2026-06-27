import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalType } from '../types';
import { LegalModal } from './LegalModal';
import { Capacitor } from '@capacitor/core';

interface Props {
  isNight?: boolean;
}

export const LoginModal: React.FC<Props> = ({ isNight = true }) => {
  const {
    showLoginModal,
    closeLoginModal,
    signIn,
    signInWithApple,
    signInWithGoogle,
    signInWithKakao,
    signUp,
    sendResetEmail,
  } = useAuth();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showLegal, setShowLegal] = useState<LegalType | null>(null);

  if (!showLoginModal) return null;
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (viewMode === 'login') {
        await signIn(email, password);
      } else if (viewMode === 'signup') {
        if (!name.trim()) throw new Error('Please enter your name.');
        if (!email.includes('@')) throw new Error('Please enter a valid email address.');
        if (password.length < 6) throw new Error('Password must be at least 6 characters.');
        await signUp(name, email, password);
      } else if (viewMode === 'forgot') {
        await sendResetEmail(email);
        setSuccess('Check your inbox for a password reset link!');
        setTimeout(() => setViewMode('login'), 5000);
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = 'Incorrect password.';
      if (err.code === 'auth/invalid-credential')
        msg = 'Invalid email or password. Please try again.';
      if (err.code === 'auth/email-already-in-use') msg = 'Email already registered.';
      if (err.code === 'auth/invalid-email') msg = 'Please enter a valid email address.';
      if (err.code === 'auth/too-many-requests')
        msg = 'Too many attempts. Please wait and try again.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await signInWithApple();
    } catch (err: any) {
      const errorMsg = err.message || '';
      // Silently ignore if the user cancels (Apple Error 1001 or standard cancel strings)
      if (
        errorMsg.includes('1001') ||
        errorMsg.toLowerCase().includes('cancelled') ||
        errorMsg.toLowerCase().includes('user canceled') ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        setIsLoading(false);
        return;
      }

      console.error('[LoginModal] Apple Sign-In Error:', err);

      // Friendly messages for common actual failures
      if (errorMsg.includes('network')) {
        setError('Network error. Please check your internet connection.');
      } else {
        setError('Sign-in failed. Please try again or use your email.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (
        errorMsg.toLowerCase().includes('cancelled') ||
        errorMsg.toLowerCase().includes('user canceled') ||
        err.code === 'auth/popup-closed-by-user'
      ) {
        setIsLoading(false);
        return;
      }
      console.error('[LoginModal] Google Sign-In Error:', err);
      setError(`Google Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKakaoSignIn = async () => {
    setError(null);
    setSuccess(null);
    setIsLoading(true);
    try {
      await signInWithKakao();
    } catch (err: any) {
      const errorMsg = err.message || '';
      if (
        errorMsg.toLowerCase().includes('cancelled') ||
        errorMsg.toLowerCase().includes('user canceled') ||
        errorMsg.toLowerCase().includes('cancel')
      ) {
        setIsLoading(false);
        return;
      }
      console.error('[LoginModal] Kakao Sign-In Error:', err);
      setError(`Kakao Error: ${err.message || JSON.stringify(err)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    if (viewMode === 'login') return 'Welcome Back!';
    if (viewMode === 'signup') return 'Create Account';
    return 'Reset Password';
  };

  const getSubtitle = () => {
    if (viewMode === 'login') return 'Sign in to continue your teaching journey';
    if (viewMode === 'signup') return 'Join Chekki to make homework time happy';
    return "Enter your email and we'll send you a recovery link";
  };

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-20 md:pt-28 overflow-y-auto">
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
          onClick={() => {
            if (!email && !password && !name) closeLoginModal();
          }}
        ></div>

        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          className={`relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl modal-enter w-full max-w-sm flex flex-col mx-4`}
        >
          <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-zinc-950/90' : 'bg-white/90'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
          {/* Clean header — no image */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-orange flex items-center justify-center shadow-lg shadow-orange-500/25">
                <span className="text-white text-xs font-black">C</span>
              </div>
              <span
                className={`${isNight ? 'text-white/80' : 'text-zinc-900/80'} text-sm font-black tracking-tight`}
              >
                Chekki
              </span>
            </div>
            <button
              onClick={closeLoginModal}
              aria-label="Close sign-in dialog"
              className={`text-zinc-500 hover:text-brand-orange transition-colors ${isNight ? 'bg-black/30 border-white/5' : 'bg-zinc-100 border-zinc-200'} w-8 h-8 rounded-full flex items-center justify-center border text-[10px] shadow-sm`}
            >
              ✕
            </button>
          </div>

          <div className="p-6 md:p-8 pt-4 flex-1">
            <div className="text-center mb-6">
              <h2
                id="login-modal-title"
                className={`text-balance text-2xl md:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-1.5 tracking-tight`}
              >
                {getTitle()}
              </h2>
              <p className="text-zinc-500 text-[11px] md:text-xs font-semibold leading-relaxed max-w-[240px] mx-auto">
                {getSubtitle()}
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl text-red-500 text-[11px] mb-5 font-semibold animate-shake flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
                  />
                </svg>
                <span className="flex-1 text-left leading-normal">{error}</span>
              </div>
            )}
            {success && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 px-4 py-3 rounded-2xl text-emerald-500 text-[11px] mb-5 font-semibold flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                  />
                </svg>
                <span className="flex-1 text-left leading-normal">{success}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {viewMode === 'signup' && (
                <div className="relative group">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-brand-orange transition-colors duration-250"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                    />
                  </svg>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Parent's Name"
                    aria-label="Your name"
                    className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800/80 text-white focus:bg-black' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white'} border rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-500/20 transition-all text-xs font-semibold placeholder:text-zinc-500`}
                    required
                  />
                </div>
              )}

              <div className="relative group">
                <svg
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-brand-orange transition-colors duration-250"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                  />
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email Address"
                  aria-label="Email address"
                  className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800/80 text-white focus:bg-black' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white'} border rounded-2xl pl-11 pr-4 py-3.5 outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-500/20 transition-all text-xs font-semibold placeholder:text-zinc-500`}
                  required
                />
              </div>

              {viewMode !== 'forgot' && (
                <div className="space-y-2.5">
                  <div className="relative group">
                    <svg
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-zinc-500 group-focus-within:text-brand-orange transition-colors duration-250"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
                      />
                    </svg>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      aria-label="Password"
                      className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800/80 text-white focus:bg-black' : 'bg-zinc-50 border-zinc-200 text-zinc-900 focus:bg-white'} border rounded-2xl pl-11 pr-12 py-3.5 outline-none focus:border-brand-orange focus:ring-2 focus:ring-orange-500/20 transition-all text-xs font-semibold placeholder:text-zinc-500`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-brand-orange transition-colors duration-250"
                    >
                      {showPassword ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                  {viewMode === 'login' && (
                    <div className="flex justify-end px-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('forgot')}
                        className="text-[10px] text-zinc-500 hover:text-brand-orange font-bold transition-colors duration-250"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-brand-orange hover:bg-orange-600 text-white font-black py-3.5 rounded-2xl shadow-xl shadow-orange-500/30 transform active:scale-[0.98] disabled:opacity-50 transition-all duration-250 text-sm font-display tracking-wide mt-2"
              >
                {isLoading
                  ? viewMode === 'login'
                    ? 'Signing in...'
                    : viewMode === 'signup'
                      ? 'Creating account...'
                      : 'Sending link...'
                  : viewMode === 'login'
                    ? 'Log In'
                    : viewMode === 'signup'
                      ? 'Sign Up'
                      : 'Send Reset Link'}
              </button>
            </form>

            <div className="relative flex py-4 items-center">
              <div className="flex-grow border-t border-zinc-200 dark:border-white/5"></div>
              <span className="flex-shrink mx-4 text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">
                or continue with
              </span>
              <div className="flex-grow border-t border-zinc-200 dark:border-white/5"></div>
            </div>

            <div className="space-y-2.5">
              {Capacitor.getPlatform() !== 'android' && (
                <button
                  type="button"
                  onClick={handleAppleSignIn}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-black/25 hover:bg-zinc-900 transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 text-xs border border-white/5"
                >
                  <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.062 10.97c.03-2.52 2.06-3.73 2.15-3.79-1.17-1.71-2.99-1.94-3.64-1.97-1.54-.16-3.01.91-3.79.91-.78 0-1.99-.89-3.29-.86-1.71.03-3.29.99-4.17 2.54-1.79 3.11-.46 7.71 1.28 10.22.85 1.23 1.86 2.61 3.19 2.56 1.28-.05 1.76-.83 3.31-.83 1.54 0 1.99.83 3.34.8 1.36-.03 2.23-1.25 3.07-2.48 1.05-1.51 1.39-2.98 1.42-3.05-.03-.01-2.73-1.04-2.76-4.15zm-2.82-7.14c.7-1.02 1.15-2.07.91-3.61-1.14.05-2.52.76-3.34 1.71-.73.85-1.37 1.94-1.17 3.04 1.26.1 2.52-.77 3.6-1.14z" />
                  </svg>
                  Continue with Apple
                </button>
              )}

              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className={`w-full flex items-center justify-center gap-3 ${isNight ? 'bg-zinc-950 text-white hover:bg-zinc-900 border-zinc-800/80 shadow-[0_10px_25px_rgba(0,0,0,0.4)]' : 'bg-white border border-zinc-200 text-zinc-900 hover:bg-zinc-50 shadow-md shadow-zinc-900/5'} font-bold py-3.5 rounded-2xl transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 text-xs`}
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <button
                type="button"
                onClick={handleKakaoSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-[#FEE500] text-[#191919] font-bold py-3.5 rounded-2xl shadow-lg shadow-yellow-500/10 hover:bg-[#FADA0A] transition-all duration-200 transform active:scale-[0.98] disabled:opacity-50 text-xs"
              >
                <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c-4.97 0-9 3.185-9 7.11 0 2.507 1.642 4.718 4.11 5.922l-.83 3.037c-.075.28.188.528.454.356l3.585-2.378c.552.077 1.114.118 1.681.118 4.97 0 9-3.185 9-7.11S16.97 3 12 3z" />
                </svg>
                Continue with Kakao
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'forgot') setViewMode('login');
                  else setViewMode(viewMode === 'login' ? 'signup' : 'login');
                }}
                className={`text-zinc-500 text-[11px] hover:text-brand-orange font-bold transition-colors duration-250`}
              >
                {viewMode === 'login' ? (
                  <>
                    New to Chekki? <span className="text-brand-orange">Sign Up</span>
                  </>
                ) : viewMode === 'signup' ? (
                  <>
                    Already have an account? <span className="text-brand-orange">Log In</span>
                  </>
                ) : (
                  <>
                    <span className="text-brand-orange">Back to Log In</span>
                  </>
                )}
              </button>

              <div className={`w-full h-px ${isNight ? 'bg-white/5' : 'bg-zinc-100'} my-1`}></div>

              <button
                onClick={closeLoginModal}
                className="text-zinc-500 text-[10px] hover:text-brand-orange font-black uppercase tracking-widest transition-all duration-250 underline underline-offset-2"
              >
                {t('login_guest_link')}
              </button>

              <div className="text-[8px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 px-4">
                <span>By continuing, you agree to our</span>
                <button
                  onClick={() => setShowLegal('terms')}
                  className="underline text-zinc-500 hover:text-zinc-400"
                >
                  Terms
                </button>
                <button
                  onClick={() => setShowLegal('privacy')}
                  className="underline text-zinc-500 hover:text-zinc-400"
                >
                  Privacy
                </button>
                <button
                  onClick={() => setShowLegal('support')}
                  className="underline text-zinc-500 hover:text-zinc-400"
                >
                  Support
                </button>
                <button
                  onClick={() => setShowLegal('refund')}
                  className="underline text-zinc-500 hover:text-zinc-400"
                >
                  Refund
                </button>
                <button
                  onClick={() => setShowLegal('youth')}
                  className="underline text-zinc-500 hover:text-zinc-400"
                >
                  Youth
                </button>
              </div>
            </div>
          </div>
          </div>
        </div>
      </div>
    </>
  );
};
