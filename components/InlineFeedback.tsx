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

  // Sending needs a signed-in user; guests would rate into a void.
  if (!firebaseUser) return null;
  const ko = language === 'ko';

  if (isSuccess) {
    return (
      <div className="rounded-md bg-right-soft px-5 py-4 animate-fade-in" role="status">
        <p className="text-[15px] font-bold text-ink">{t('fb_success')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-md bg-surface px-5 py-5 ring-1 ring-inset ring-rule">
      <p className="text-[15px] font-bold text-ink">{ko ? '오늘 채키가 도움이 되었나요?' : 'Did Chekki help tonight?'}</p>
      <p className="mt-0.5 text-[13px] text-ink-3">{ko ? '1은 별로, 5는 아주 좋았어요' : '1 is not really, 5 is a lot'}</p>
      <div className="mt-3 flex gap-2" role="radiogroup" aria-label={ko ? '평점' : 'Rating'}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            role="radio"
            aria-checked={rating === n}
            onClick={() => setRating(n)}
            className={`num h-11 w-11 rounded-full border-[4px] text-[15px] font-extrabold transition-colors ${
              rating === n ? 'border-line bg-line text-[#2b211a]' : 'border-rule bg-surface text-ink-2 hover:border-line'
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      {rating !== null && (
        <div className="mt-4 space-y-3 animate-fade-in">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={ko ? '더 하고 싶은 말씀이 있으신가요?' : 'Anything we could do better?'}
            className="h-24 w-full resize-none rounded-md bg-sunken p-3 text-[15px] text-ink placeholder:text-ink-3 outline-none ring-1 ring-inset ring-rule focus:ring-2 focus:ring-line"
          />
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex min-h-11 w-full items-center justify-center rounded-md bg-sign text-[15px] font-bold text-on-sign disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              t('fb_submit')
            )}
          </button>
        </div>
      )}
    </div>
  );
};
