
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { LegalModal } from './LegalModal';

export const LoginModal: React.FC = () => {
  const { showLoginModal, closeLoginModal, login } = useAuth();
  const [isLoginMode, setIsLoginMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Legal Modal State
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);

  if (!showLoginModal) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    if (!isLoginMode && !name.trim()) return;
    if (isLoginMode && !password.trim()) return;
    
    setIsLoading(true);
    // Simulate network delay for realism
    setTimeout(() => {
        // In a real app, we would verify password here.
        // For this demo, we assume success and derive a name if logging in.
        // If it's a new sign up, use the provided name.
        const displayName = isLoginMode ? email.split('@')[0] : name;
        
        login(displayName, email);
        
        setIsLoading(false);
        // Clean up
        setName('');
        setEmail('');
        setPassword('');
        setIsLoginMode(false); // Reset to default for next time
    }, 1500);
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    // Clear sensitive fields when switching, maybe keep email
    setPassword('');
  };

  return (
    <>
      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeLoginModal}></div>
        
        <div className="relative bg-zinc-900 rounded-3xl w-full max-w-md shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up">
          
          {/* Header Visual */}
          <div className="bg-gradient-to-br from-brand-orange/20 to-brand-purple/20 p-8 flex justify-center relative">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="w-24 h-24 relative">
                  <div className="absolute inset-0 bg-white/20 blur-xl rounded-full"></div>
                  <ChekkiMascot className="w-full h-full drop-shadow-lg relative z-10" mood={isLoginMode ? "winking" : "happy"} />
              </div>
              <button onClick={closeLoginModal} className="absolute top-4 right-4 text-white/50 hover:text-white">✕</button>
          </div>

          <div className="p-8">
              <h2 className="text-2xl font-bold text-white text-center mb-2 font-display">
                  {isLoginMode ? 'Welcome Back!' : 'Welcome to Chekki!'}
              </h2>
              <p className="text-zinc-400 text-center mb-8 text-sm font-korean">
                  {isLoginMode ? '다시 오신 것을 환영해요.' : '숙제 채점과 학습 관리를 시작해보세요.'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLoginMode && (
                      <div className="animate-fade-in">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Parent's Name</label>
                          <input 
                              type="text" 
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g. Ji-woo Mom"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all placeholder:text-zinc-600"
                              required={!isLoginMode}
                          />
                      </div>
                  )}
                  
                  <div>
                      <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Email Address</label>
                      <input 
                          type="email" 
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@example.com"
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all placeholder:text-zinc-600"
                          required
                      />
                  </div>

                  {isLoginMode && (
                      <div className="animate-fade-in">
                          <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 ml-1">Password</label>
                          <input 
                              type="password" 
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder="••••••••"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-brand-orange focus:ring-1 focus:ring-brand-orange outline-none transition-all placeholder:text-zinc-600"
                              required={isLoginMode}
                          />
                      </div>
                  )}

                  <button 
                      type="submit" 
                      disabled={isLoading}
                      className="w-full bg-brand-orange hover:bg-orange-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-4 flex justify-center items-center gap-2"
                  >
                      {isLoading ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div>
                            <span>{isLoginMode ? 'Logging in...' : 'Signing in...'}</span>
                          </>
                      ) : (
                          <span>{isLoginMode ? 'Log In' : 'Start Free Trial'}</span>
                      )}
                  </button>
              </form>

              <div className="mt-6 text-center">
                  <p className="text-zinc-500 text-xs">
                      {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                      <button 
                          onClick={toggleMode}
                          className="text-brand-orange hover:text-orange-400 font-bold ml-1 transition-colors underline decoration-brand-orange/30 underline-offset-4"
                      >
                          {isLoginMode ? 'Sign Up' : 'Log In'}
                      </button>
                  </p>
                  
                  {/* LEGAL LINKS - REQUIRED FOR APP STORE SUBMISSION */}
                  <div className="mt-8 pt-4 border-t border-white/5 flex flex-wrap justify-center gap-4 text-[10px] text-zinc-600">
                      <button onClick={() => setShowLegal('privacy')} className="hover:text-zinc-400 transition-colors">Privacy Policy</button>
                      <span className="text-zinc-700">•</span>
                      <button onClick={() => setShowLegal('terms')} className="hover:text-zinc-400 transition-colors">Terms of Use (EULA)</button>
                  </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
};
