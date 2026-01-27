
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ASSETS } from '../constants';
import { LegalModal } from './LegalModal';

export const LoginModal: React.FC = () => {
  const { showLoginModal, closeLoginModal, signIn, signUp, joinSchool } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [showSchoolField, setShowSchoolField] = useState(false);
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
            
            if (schoolCode.trim()) {
                const schoolSuccess = await joinSchool(schoolCode);
                if (!schoolSuccess) {
                    console.warn("Invalid school code provided during signup.");
                }
            }
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
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={closeLoginModal}></div>
        <div className="relative bg-zinc-900 rounded-[3rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
          
          <div className="bg-gradient-to-br from-brand-orange/20 to-brand-purple/20 p-10 flex justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-white/5 blur-3xl rounded-full scale-150"></div>
              {/* MASCOT SCALED UP TO MATCH ONBOARDING */}
              <div className="w-72 h-72 md:w-80 md:h-80 relative z-10 animate-float flex items-center justify-center">
                  <img src={ASSETS.LOGO} alt="Chekki Mascot" className="w-full h-full object-contain scale-110" />
              </div>
              <button onClick={closeLoginModal} className="absolute top-8 right-8 text-white/40 hover:text-white transition-colors bg-black/20 w-10 h-10 rounded-full flex items-center justify-center border border-white/5">✕</button>
          </div>

          <div className="p-10">
              <h2 className="text-3xl md:text-4xl font-black text-white text-center mb-2 font-display">
                  {isLoginMode ? 'Welcome Back!' : 'Create Account'}
              </h2>
              <p className="text-zinc-500 text-center text-sm mb-10 font-medium">
                  {isLoginMode ? 'Sign in to continue your teaching journey' : 'Start your free trial or enter your school code'}
              </p>

              {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-xs mb-6 text-center font-bold animate-shake">{error}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-5">
                  {!isLoginMode && (
                      <div className="relative group">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">👋</span>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent's Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-5 text-white outline-none focus:border-orange-500 transition-colors" required />
                      </div>
                  )}
                  
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">📧</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-5 text-white outline-none focus:border-orange-500 transition-colors" required />
                  </div>

                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🔒</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-5 text-white outline-none focus:border-orange-500 transition-colors" required />
                  </div>

                  {!isLoginMode && (
                      <div className="pt-2">
                        {!showSchoolField ? (
                            <button 
                                type="button" 
                                onClick={() => setShowSchoolField(true)}
                                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-2 px-1"
                            >
                                🏫 I have a Hagwon Code
                            </button>
                        ) : (
                            <div className="relative group animate-fade-in-up">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg">🏫</span>
                                <input 
                                    type="text" 
                                    value={schoolCode} 
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} 
                                    placeholder="Enter Hagwon Code (e.g. POLY10)" 
                                    className="w-full bg-indigo-500/5 border border-indigo-500/30 rounded-2xl pl-12 pr-4 py-5 text-white outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest text-sm" 
                                />
                            </div>
                        )}
                      </div>
                  )}

                  <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-orange-600 text-white font-black py-6 rounded-2xl shadow-2xl shadow-orange-500/30 transform active:scale-95 disabled:opacity-50 transition-all text-xl mt-6">
                      {isLoading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Sign Up')}
                  </button>
              </form>
              
              <div className="mt-10 text-center">
                  <button onClick={() => { setIsLoginMode(!isLoginMode); setShowSchoolField(false); }} className="text-zinc-500 text-xs hover:text-orange-400 font-bold transition-colors">
                      {isLoginMode ? "New to Chekki? Create an Account" : "Already have an account? Log In"}
                  </button>
              </div>

              <p className="text-[10px] text-zinc-600 text-center mt-8 uppercase tracking-widest leading-relaxed">
                  By continuing, you agree to our <button onClick={() => setShowLegal('terms')} className="underline">Terms</button> & <button onClick={() => setShowLegal('privacy')} className="underline">Privacy</button>
              </p>
          </div>
        </div>
      </div>
    </>
  );
};
