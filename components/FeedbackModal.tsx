import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Star, X } from '@phosphor-icons/react';
import { db } from '../services/database';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  onClose: () => void;
  context?: any; // Specific question context if reporting from result card
  isNight?: boolean;
}

export const FeedbackModal: React.FC<Props> = ({ onClose, context }) => {
  const { firebaseUser, user } = useAuth();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });

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
        userRole: user?.role, // Now submitted from parent AND staff (director/teacher) dashboards — role lets admins triage which surface a report came from
      });
      setIsSuccess(true);
      setTimeout(close, 2500);
    } catch (e) {
      showToast({
        type: 'error',
        message: language === 'ko' ? '보내지 못했어요. 잠시 후 다시 시도해 주세요.' : "Couldn't send that. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isKo = language === 'ko';
  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('fb_title')}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-surface pb-[env(safe-area-inset-bottom)] ring-1 ring-inset ring-rule sm:pb-0 shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-md sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
      >
        <button
          onClick={close}
          aria-label={isKo ? '닫기' : 'Close'}
          className="absolute right-3 top-3 z-10 flex h-11 w-11 items-center justify-center rounded-md text-ink-3 hover:bg-sunken hover:text-ink"
        >
          <X size={20} weight="bold" />
        </button>
        <div className="custom-scrollbar overflow-y-auto px-5 pb-6 pt-6 text-center sm:px-6">
          <img
            src={isSuccess ? '/images/chekki-thumbs.webp' : '/images/chekki-wave.webp'}
            alt=""
            className="mx-auto h-24 w-24 object-contain"
          />
          {isSuccess ? (
            <div className="animate-fade-in pb-4 pt-2">
              <h3 className="text-[22px] font-extrabold tracking-[-0.02em] text-ink break-keep">{t('fb_success')}</h3>
            </div>
          ) : (
            <>
              <h2 className="mt-2 text-[22px] font-extrabold tracking-[-0.02em] text-ink break-keep">{t('fb_title')}</h2>
              <p className="mt-1 text-[15px] text-ink-2 break-keep">{context ? t('fb_error_desc') : t('fb_desc')}</p>

              {!context && (
                <fieldset className="mt-5">
                  <legend className="mx-auto text-[14px] font-semibold text-ink-2">{t('fb_rating')}</legend>
                  <div className="mt-2 flex justify-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        aria-label={isKo ? `${star}점` : `${star} star${star > 1 ? 's' : ''}`}
                        aria-pressed={star === rating}
                        className="btn-press flex h-11 w-11 items-center justify-center"
                      >
                        <Star size={30} weight="fill" className={star <= rating ? 'text-line' : 'text-rule'} />
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}

              <label htmlFor="fb-comment" className="mt-5 block text-left text-[14px] font-semibold text-ink-2">
                {t('fb_comment')}
              </label>
              <textarea
                id="fb-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="mt-2 h-28 w-full resize-none rounded-md bg-sunken p-3 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line"
              />

              <button
                onClick={handleSubmit}
                disabled={isSubmitting || (!comment && context)}
                className="btn-press mt-4 flex min-h-12 w-full items-center justify-center rounded-md bg-line text-[15px] font-bold text-[#2b211a] disabled:opacity-40"
              >
                {isSubmitting ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#2b211a]/30 border-t-[#2b211a]" />
                ) : (
                  t('fb_submit')
                )}
              </button>

              <p className="mt-4 text-[13px] text-ink-3">
                {isKo ? '이메일로 보내셔도 돼요' : 'Or email us'}{' '}
                <a href="mailto:support@chekkiai.com" className="font-semibold text-line-ink underline">
                  support@chekkiai.com
                </a>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
