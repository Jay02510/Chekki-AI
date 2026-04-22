
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { ChekkiMascot } from './Icons';
import { db } from '../services/database';

interface Props {
  onClose: () => void;
  context?: any; // Specific question context if reporting from result card
  isNight?: boolean;
}

export const FeedbackModal: React.FC<Props> = ({ onClose, context, isNight = true }) => {
  const { firebaseUser, user } = useAuth();
  const { t } = useLanguage();
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!firebaseUser) return;
    setIsSubmitting(true);
    
    try {
      await db.sendFeedback(firebaseUser.uid, {
        rating: context ? undefined : rating,
        comment,
        context,
        userEmail: user?.email, // Added for easier admin identification in DB
        userName: user?.name
      });
      setIsSuccess(true);
      setTimeout(onClose, 2500);
    } catch (e) {
      alert("Oops! Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
      
      <div className={`relative ${isNight ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-2xl'} rounded-3xl w-full max-w-md shadow-2xl border overflow-hidden animate-fade-in-up`}>
        
        <div className={`${isNight ? 'bg-zinc-950' : 'bg-zinc-50 border-b border-zinc-100'} p-6 flex justify-center relative`}>
           <div className="w-24 h-24">
              <ChekkiMascot className="w-full h-full" mood={isSuccess ? "happy" : "thinking"} />
           </div>
           <button onClick={onClose} className={`absolute top-4 right-4 ${isNight ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'} transition-colors`}>✕</button>
        </div>

        <div className="p-8 space-y-6 text-center">
            {isSuccess ? (
                <div className="py-10 animate-fade-in">
                   <h3 className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-korean`}>{t('fb_success')}</h3>
                   <p className="text-zinc-500 text-sm">You are doing an amazing job, Mom!</p>
                </div>
            ) : (
                <>
                  <div>
                    <h2 className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-display`}>{t('fb_title')}</h2>
                    <p className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} text-sm font-korean`}>{context ? t('fb_error_desc') : t('fb_desc')}</p>
                  </div>

                  {!context && (
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">{t('fb_rating')}</p>
                        <div className="flex gap-2">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button 
                                    key={star} 
                                    onClick={() => setRating(star)}
                                    className={`text-3xl transition-transform active:scale-90 ${star <= rating ? 'grayscale-0 scale-110' : 'grayscale opacity-30'}`}
                                >
                                    {['😡', '😕', '😐', '🙂', '🤩'][star-1]}
                                </button>
                            ))}
                        </div>
                    </div>
                  )}

                  <div className="text-left space-y-2">
                      <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">{t('fb_comment')}</label>
                      <textarea 
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          placeholder="..."
                          className={`w-full ${isNight ? 'bg-zinc-950 border-zinc-800 text-zinc-200' : 'bg-zinc-50 border-zinc-200 text-zinc-900'} rounded-xl p-4 focus:border-orange-500 outline-none h-32 resize-none transition-colors`}
                      />
                  </div>

                  <div className="space-y-4">
                    <button 
                      onClick={handleSubmit}
                      disabled={isSubmitting || (!comment && context)}
                      className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          <span>{t('fb_submit')} ❤️</span>
                      )}
                    </button>
                    
                    <div className="pt-2">
                      <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2">Or email us directly</p>
                      <a 
                        href="mailto:chekkihelp@gmail.com" 
                        className={`text-xs font-bold ${isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'} transition-colors underline underline-offset-4`}
                      >
                        chekkihelp@gmail.com
                      </a>
                    </div>
                  </div>
                </>
            )}
        </div>
      </div>
    </div>
  );
};
