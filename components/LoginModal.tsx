
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
        <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" onClick={closeLoginModal}></div>
        <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-md shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up flex flex-col">
          
          {/* Compact Header Image */}
          <div className="relative h-44 md:h-56 bg-zinc-950 flex items-center justify-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/20 to-transparent opacity-50"></div>
              <img 
                src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-logo_q5xeux.png" 
                alt="Chekki Mascot" 
                className="relative z-10 w-32 h-32 md:w-44 md:h-44 object-contain animate-float" 
              />
              <button onClick={closeLoginModal} className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors bg-black/40 w-8 h-8 rounded-full flex items-center justify-center border border-white/5 z-20">✕</button>
          </div>

          <div className="p-8 md:p-10 flex-1 overflow-y-auto custom-scrollbar">
              <div className="text-center mb-8">
                <h2 className="text-3xl md:text-4xl font-black text-white font-display mb-2">
                    {isLoginMode ? 'Welcome Back!' : 'Create Account'}
                </h2>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">
                    {isLoginMode ? 'Sign in to continue your teaching journey' : 'Join Chekki to make homework time happy'}
                </p>
              </div>

              {error && <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl text-red-400 text-xs mb-6 text-center font-bold animate-shake">{error}</div>}
              
              <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLoginMode && (
                      <div className="relative group">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">👋</span>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Parent's Name" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-700" required />
                      </div>
                  )}
                  
                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">📧</span>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-700" required />
                  </div>

                  <div className="relative group">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">🔒</span>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-orange-500 transition-colors font-medium placeholder:text-zinc-700" required />
                  </div>

                  {!isLoginMode && (
                      <div className="pt-1">
                        {!showSchoolField ? (
                            <button 
                                type="button" 
                                onClick={() => setShowSchoolField(true)}
                                className="text-[10px] font-black text-indigo-400 uppercase tracking-widest hover:text-indigo-300 transition-colors flex items-center gap-2 px-1 py-2"
                            >
                                🏫 I have a Hagwon Code
                            </button>
                        ) : (
                            <div className="relative group animate-fade-in-up">
                                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg">🏫</span>
                                <input 
                                    type="text" 
                                    value={schoolCode} 
                                    onChange={(e) => setSchoolCode(e.target.value.toUpperCase())} 
                                    placeholder="Enter Hagwon Code (e.g. POLY10)" 
                                    className="w-full bg-indigo-500/5 border border-indigo-500/30 rounded-2xl pl-12 pr-4 py-4 text-white outline-none focus:border-indigo-500 transition-colors font-mono tracking-widest text-sm" 
                                />
                            </div>
                        )}
                      </div>
                  )}

                  <button type="submit" disabled={isLoading} className="w-full bg-brand-orange hover:bg-orange-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-orange-500/20 transform active:scale-95 disabled:opacity-50 transition-all text-xl mt-4">
                      {isLoading ? 'Processing...' : (isLoginMode ? 'Log In' : 'Sign Up')}
                  </button>
              </form>
              
              <div className="mt-8 flex flex-col items-center gap-4">
                  <button 
                    onClick={() => { setIsLoginMode(!isLoginMode); setShowSchoolField(false); }} 
                    className="text-zinc-400 text-sm hover:text-white font-bold transition-colors"
                  >
                      {isLoginMode ? (
                        <>New to Chekki? <span className="text-orange-500">Sign Up</span></>
                      ) : (
                        <>Already have an account? <span className="text-orange-500">Log In</span></>
                      )}
                  </button>

                  <p className="text-[10px] text-zinc-600 text-center uppercase tracking-widest leading-relaxed max-w-[280px]">
                      By continuing, you agree to our <button onClick={() => setShowLegal('terms')} className="underline">Terms</button> & <button onClick={() => setShowLegal('privacy')} className="underline">Privacy</button>
                  </p>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};
