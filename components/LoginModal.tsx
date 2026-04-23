
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalType } from '../types';
const LegalModal = React.lazy(() => import('./LegalModal').then(module => ({ default: module.LegalModal })));

interface Props {
  isNight?: boolean;
}

export const LoginModal: React.FC<Props> = ({ isNight = true }) => {
  const { showLoginModal, closeLoginModal, signIn, signInWithApple, signUp, sendResetEmail } = useAuth();
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
        if (!name.trim()) throw new Error("Please enter your name.");
        if (!email.includes('@')) throw new Error("Please enter a valid email address.");
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signUp(name, email, password);
      } else if (viewMode === 'forgot') {
        await sendResetEmail(email);
        setSuccess("Check your inbox for a password reset link!");
        setTimeout(() => setViewMode('login'), 5000);
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
      if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
      if (err.code === 'auth/invalid-credential') msg = "Invalid email or password. Please try again.";
      if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
      if (err.code === 'auth/invalid-email') msg = "Please enter a valid email address.";
      if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Please wait and try again.";
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
      if (err.message?.includes('cancelled') || err.message?.includes('user canceled') || err.code === 'auth/popup-closed-by-user') {
        // Silently ignore cancellation
        return;
      }
      setError("Apple Sign-In encountered an error. Please try email login instead.");
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
      <React.Suspense fallback={null}>
        {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      </React.Suspense>
      <div className="fixed inset-0 z-[100] flex items-start justify-center p-4 pt-24 md:pt-32 overflow-y-auto">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={() => { if (!email && !password && !name) closeLoginModal(); }}></div>

        <div className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} rounded-[2.5rem] w-full max-w-sm shadow-2xl border overflow-hidden animate-fade-in-up flex flex-col`}>

          {/* Clean header — no image */}
          <div className="relative flex items-center justify-between px-6 pt-6 pb-2 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-brand-orange flex items-center justify-center shadow-md shadow-orange-500/30">
                <span className="text-white text-xs font-black">C</span>
              </div>
              <span className={`${isNight ? 'text-white/80' : 'text-zinc-900/80'} text-sm font-bold tracking-tight`}>Chekki</span>
            </div>
            <button onClick={closeLoginModal} className={`text-zinc-500 hover:text-orange-500 transition-colors ${isNight ? 'bg-black/40 border-white/10' : 'bg-zinc-100 border-zinc-200'} w-8 h-8 rounded-full flex items-center justify-center border text-sm shadow-xl`}>✕</button>
          </div>

          <div className="p-6 md:p-8 pt-4 flex-1 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-8">
              <h2 className={`text-2xl md:text-3xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display mb-1.5 tracking-tight`}>
                {getTitle()}
              </h2>
              <p className="text-zinc-500 text-[11px] md:text-xs font-medium leading-relaxed max-w-[220px] mx-auto">
                {getSubtitle()}
              </p>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-500 text-[10px] md:text-xs mb-5 text-center font-bold animate-shake">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/50 p-3 rounded-xl text-emerald-500 text-[10px] md:text-xs mb-5 text-center font-bold">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {viewMode === 'signup' && (
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">👋</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent's Name" className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-inner'} border rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-400`} required />
                </div>
              )}

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📧</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-inner'} border rounded-xl pl-11 pr-4 py-3.5 outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-400`} required />
              </div>

              {viewMode !== 'forgot' && (
                <div className="space-y-2.5">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">🔒</span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="Password" 
                      className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-zinc-50 border-zinc-200 text-zinc-900 shadow-inner'} border rounded-xl pl-11 pr-12 py-3.5 outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-400`} 
                      required 
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-orange-500 transition-colors"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" /></svg>
                      )}
                    </button>
                  </div>
                  {viewMode === 'login' && (
                    <div className="flex justify-end px-1">
                      <button
                        type="button"
                        onClick={() => setViewMode('forgot')}
                        className="text-[10px] text-zinc-500 hover:text-orange-500 font-bold transition-colors"
                      >
                        Forgot Password?
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-orange-600 text-white font-black py-4 rounded-xl shadow-xl shadow-orange-500/20 transform active:scale-95 disabled:opacity-50 transition-all text-base mt-3">
                {isLoading ? 'Processing...' : (viewMode === 'login' ? 'Log In' : viewMode === 'signup' ? 'Sign Up' : 'Send Reset Link')}
              </button>
            </form>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={handleAppleSignIn}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 bg-black text-white font-bold py-3.5 rounded-xl shadow-lg hover:bg-zinc-800 transition-all active:scale-95 disabled:opacity-50"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.062 10.97c.03-2.52 2.06-3.73 2.15-3.79-1.17-1.71-2.99-1.94-3.64-1.97-1.54-.16-3.01.91-3.79.91-.78 0-1.99-.89-3.29-.86-1.71.03-3.29.99-4.17 2.54-1.79 3.11-.46 7.71 1.28 10.22.85 1.23 1.86 2.61 3.19 2.56 1.28-.05 1.76-.83 3.31-.83 1.54 0 1.99.83 3.34.8 1.36-.03 2.23-1.25 3.07-2.48 1.05-1.51 1.39-2.98 1.42-3.05-.03-.01-2.73-1.04-2.76-4.15zm-2.82-7.14c.7-1.02 1.15-2.07.91-3.61-1.14.05-2.52.76-3.34 1.71-.73.85-1.37 1.94-1.17 3.04 1.26.1 2.52-.77 3.6-1.14z" />
                </svg>
                Continue with Apple
              </button>
            </div>

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'forgot') setViewMode('login');
                  else setViewMode(viewMode === 'login' ? 'signup' : 'login');
                }}
                className={`text-zinc-500 text-[11px] hover:text-orange-500 font-bold transition-colors`}
              >
                {viewMode === 'login' ? (
                  <>New to Chekki? <span className="text-orange-500">Sign Up</span></>
                ) : viewMode === 'signup' ? (
                  <>Already have an account? <span className="text-orange-500">Log In</span></>
                ) : (
                  <><span className="text-orange-500">Back to Log In</span></>
                )}
              </button>

              <div className={`w-full h-px ${isNight ? 'bg-white/5' : 'bg-zinc-100'} my-1`}></div>

              <button
                onClick={closeLoginModal}
                className="text-zinc-500 text-[10px] hover:text-orange-400 font-black uppercase tracking-widest transition-all animate-pulse"
              >
                {t('login_guest_link')}
              </button>

              <div className="text-[8px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed mt-2 flex flex-wrap justify-center gap-x-2 gap-y-1 px-4">
                <span>By continuing, you agree to our</span>
                <button onClick={() => setShowLegal('terms')} className="underline text-zinc-500 hover:text-zinc-400">Terms</button>
                <button onClick={() => setShowLegal('privacy')} className="underline text-zinc-500 hover:text-zinc-400">Privacy</button>
                <button onClick={() => setShowLegal('support')} className="underline text-zinc-500 hover:text-zinc-400">Support</button>
                <button onClick={() => setShowLegal('refund')} className="underline text-zinc-500 hover:text-zinc-400">Refund</button>
                <button onClick={() => setShowLegal('youth')} className="underline text-zinc-500 hover:text-zinc-400">Youth</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
