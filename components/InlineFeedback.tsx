import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../services/database';

export const InlineFeedback: React.FC = () => {
  const { t, language } = useLanguage();
  const { user, firebaseUser } = useAuth();

  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!firebaseUser) return;
    setIsSubmitting(true);

    try {
      await db.sendFeedback(firebaseUser.uid, {
        rating: rating || 0,
        comment: comment || 'No comment provided',
        userName: user?.name,
        userEmail: user?.email,
      });
      setIsSuccess(true);
    } catch (e) {
      console.error('Feedback failed', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-8 text-center animate-fade-in">
        <span className="text-4xl block mb-2">💖</span>
        <h4 className="text-white font-black text-lg font-korean">{t('fb_success')}</h4>
        <p className="text-emerald-400/60 text-[10px] font-bold uppercase tracking-wide mt-1">
          Benjamin has been notified!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-5 md:p-6 animate-fade-in-up">
      <div className="text-center mb-3">
        <h4 className="text-white font-black text-lg md:text-xl font-display mb-1">
          {language === 'ko' ? '채키가 도움이 되었나요? 🎓' : 'Is Chekki helping tonight?'}
        </h4>
        <p className="text-zinc-500 text-xs font-korean">
          {language === 'ko'
            ? '더 나은 서비스를 위해 의견을 남겨주세요.'
            : 'Help us make homework time even better.'}
        </p>
      </div>

      <div className="flex justify-center gap-3 md:gap-4 mb-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => setRating(star)}
            className={`text-3xl md:text-4xl transition-all hover:scale-125 active:scale-90 ${rating === star ? 'grayscale-0 scale-110' : 'grayscale opacity-30 hover:opacity-100 hover:grayscale-0'}`}
          >
            {['😞', '😐', '🙂', '😊', '🤩'][star - 1]}
          </button>
        ))}
      </div>

      {rating !== null && (
        <div className="space-y-4 animate-fade-in">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={
              language === 'ko'
                ? '더 하고 싶은 말씀이 있으신가요?'
                : 'Tell Benjamin what we could do better...'
            }
            className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-zinc-200 text-sm focus:border-indigo-500 outline-none h-24 resize-none transition-all placeholder:text-zinc-700"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-50 text-white hover:text-indigo-900 font-black text-sm transition-all transform active:scale-[0.97] flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-indigo-900/30 border-t-indigo-900 rounded-full animate-spin"></div>
            ) : (
              <span>{t('fb_submit')}</span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
