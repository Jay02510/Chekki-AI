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
        userName: user?.name,
      });
      setIsSuccess(true);
      setTimeout(onClose, 2500);
    } catch (e) {
      alert('Oops! Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] w-full max-w-md mx-2 sm:mx-4">
        <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
        <div
          className={`${isNight ? 'bg-zinc-950' : 'bg-zinc-50 border-b border-zinc-100'} p-6 flex justify-center relative shrink-0`}
        >
          <div className="w-24 h-24">
            <ChekkiMascot className="w-full h-full" mood={isSuccess ? 'happy' : 'thinking'} />
          </div>
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 ${isNight ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-zinc-900'} transition-colors`}
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-8 space-y-6 text-center overflow-y-auto custom-scrollbar flex-1 pb-10">
          {isSuccess ? (
            <div className="py-10 animate-fade-in">
              <h3
                className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-korean break-keep`}
              >
                {t('fb_success')}
              </h3>
              <p className="text-zinc-500 text-sm">You are doing an amazing job, Mom!</p>
            </div>
          ) : (
            <>
              <div>
                <h2
                  className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-display`}
                >
                  {t('fb_title')}
                </h2>
                <p className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} text-sm font-korean break-keep`}>
                  {context ? t('fb_error_desc') : t('fb_desc')}
                </p>
              </div>

              {!context && (
                <div className="flex flex-col items-center gap-3">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                    {t('fb_rating')}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-all duration-200 active:scale-90 ${star <= rating ? 'scale-110' : 'opacity-30 grayscale'}`}
                      >
                        <svg
                          className={`w-8 h-8 ${star <= rating ? (star <= 2 ? 'text-red-400' : star === 3 ? 'text-yellow-400' : 'text-orange-400') : 'text-zinc-500'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-left space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-1">
                  {t('fb_comment')}
                </label>
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
                  className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <span className="flex items-center gap-2">
                      {t('fb_submit')}
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001a.752.752 0 0 1-.704 0l-.003-.001Z" />
                      </svg>
                    </span>
                  )}
                </button>

                <div className="pt-2">
                  <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] mb-2">
                    Or email us directly
                  </p>
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
    </div>
  );
};
