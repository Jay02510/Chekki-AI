
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ASSETS } from '../constants';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { LegalType } from '../types';

export const LoginModal: React.FC = () => {
  const { showLoginModal, closeLoginModal, signIn, signUp, sendResetEmail } = useAuth();
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeLoginModal}></div>

        <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-sm shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">

          <div className="relative h-36 md:h-44 bg-zinc-950 flex items-center justify-center shrink-0">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/30 to-purple-500/20 opacity-60"></div>
            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl"></div>

            <img
              src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-logo_q5xeux.png"
              alt="Chekki Mascot"
              className="relative z-10 w-28 h-28 md:w-36 md:h-36 object-contain animate-float drop-shadow-[0_20px_50px_rgba(249,115,22,0.4)]"
            />

            <button onClick={closeLoginModal} className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors bg-black/60 w-8 h-8 rounded-full flex items-center justify-center border border-white/10 z-20 text-sm shadow-xl">✕</button>
          </div>

          <div className="p-6 md:p-8 flex-1 overflow-y-auto custom-scrollbar">
            <div className="text-center mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-white font-display mb-1.5 tracking-tight">
                {getTitle()}
              </h2>
              <p className="text-zinc-500 text-[11px] md:text-xs font-medium leading-relaxed max-w-[220px] mx-auto">
                {getSubtitle()}
              </p>
            </div>

            {error && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-400 text-[10px] md:text-xs mb-5 text-center font-bold animate-shake">{error}</div>}
            {success && <div className="bg-emerald-500/10 border border-emerald-500/50 p-3 rounded-xl text-emerald-400 text-[10px] md:text-xs mb-5 text-center font-bold">{success}</div>}

            <form onSubmit={handleSubmit} className="space-y-3.5">
              {viewMode === 'signup' && (
                <div className="relative group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">👋</span>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent's Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-700" required />
                </div>
              )}

              <div className="relative group">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">📧</span>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-700" required />
              </div>

              {viewMode !== 'forgot' && (
                <div className="space-y-2.5">
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base">🔒</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-4 py-3.5 text-white outline-none focus:border-orange-500 transition-colors text-xs font-medium placeholder:text-zinc-700" required />
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

            <div className="mt-8 flex flex-col items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'forgot') setViewMode('login');
                  else setViewMode(viewMode === 'login' ? 'signup' : 'login');
                }}
                className="text-zinc-400 text-[11px] hover:text-white font-bold transition-colors"
              >
                {viewMode === 'login' ? (
                  <>New to Chekki? <span className="text-orange-500">Sign Up</span></>
                ) : viewMode === 'signup' ? (
                  <>Already have an account? <span className="text-orange-500">Log In</span></>
                ) : (
                  <><span className="text-orange-500">Back to Log In</span></>
                )}
              </button>

              <div className="w-full h-px bg-white/5 my-1"></div>

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
