
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { LegalModal } from './LegalModal';

export const LoginModal: React.FC = () => {
  const { showLoginModal, closeLoginModal, signIn, signUp } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
        if (isLoginMode) {
            await signIn(email, password);
        } else {
            if (password.length < 6) throw new Error("Password must be at least 6 characters.");
            await signUp(name, email, password);
        }
    } catch (err: any) {
        let msg = err.message;
        if (err.code === 'auth/user-not-found') msg = "No account found with this email.";
        if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        if (err.code === 'auth/email-already-in-use') msg = "Email already registered.";
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <>
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeLoginModal}></div>
        <div className="relative bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
          <div className="bg-gradient-to-br from-brand-orange/20 to-brand-purple/20 p-8 flex justify-center relative">
              <div className="w-20 h-20 relative"><ChekkiMascot className="w-full h-full" mood={isLoginMode ? "winking" : "happy"} /></div>
              <button onClick={closeLoginModal} className="absolute top-4 right-4 text-white/50">✕</button>
          </div>
          <div className="p-8">
              <h2 className="text-2xl font-bold text-white text-center mb-6 font-display">
                  {isLoginMode ? 'Welcome Back!' : 'Join Chekki AI'}
              </h2>
              {error && <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-lg text-red-400 text-xs mb-4 text-center font-bold">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLoginMode && (
                      <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent's Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" required />
                  )}
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" required />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 chars)" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white outline-none focus:border-orange-500" required />
                  <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 disabled:opacity-50">
                      {isLoading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Create Account')}
                  </button>
              </form>
              <div className="mt-6 text-center">
                  <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-zinc-500 text-xs hover:text-orange-400 font-bold">
                      {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
                  </button>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};
