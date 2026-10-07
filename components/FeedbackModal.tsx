import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { ChekkiMascot } from './Icons';
import { Star, X } from '@phosphor-icons/react';
import { db } from '../services/database';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  onClose: () => void;
  context?: any; // Specific question context if reporting from result card
  isNight?: boolean;
  /** Parent app look (warm tokens). Staff pages keep the old dark look. */
  warm?: boolean;
}

export const FeedbackModal: React.FC<Props> = ({ onClose, context, isNight = true, warm = false }) => {
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

  if (warm) {
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
          className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-lg bg-surface ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] sm:max-w-md sm:rounded-lg ${isClosing ? 'modal-exit' : 'modal-enter'}`}
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
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm ${isClosing ? 'modal-backdrop-exit' : ''}`}
        onClick={close}
      ></div>

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('fb_title')}
        tabIndex={-1}
        className={`relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] ${isClosing ? 'modal-exit' : 'modal-enter'} flex flex-col max-h-[95vh] w-full max-w-md mx-2 sm:mx-4`}
      >
        <div
          className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-brand-dark' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}
        >
          <div
            className={`${isNight ? 'bg-zinc-950' : 'bg-zinc-50 border-b border-zinc-100'} p-6 flex justify-center relative shrink-0`}
          >
            <div className="w-24 h-24">
              <ChekkiMascot className="w-full h-full" mood={isSuccess ? 'happy' : 'thinking'} />
            </div>
            <button
              onClick={close}
              aria-label="Close"
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
                <p className="text-zinc-400 text-sm">Thanks for letting us know!</p>
              </div>
            ) : (
              <>
                <div>
                  <h2
                    className={`text-2xl font-bold ${isNight ? 'text-white' : 'text-zinc-900'} mb-2 font-display`}
                  >
                    {t('fb_title')}
                  </h2>
                  <p
                    className={`${isNight ? 'text-zinc-400' : 'text-zinc-500'} text-sm font-korean break-keep`}
                  >
                    {context ? t('fb_error_desc') : t('fb_desc')}
                  </p>
                </div>

                {!context && (
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                      {t('fb_rating')}
                    </p>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setRating(star)}
                          className={`transition-[transform,opacity,filter] duration-200 active:scale-90 ${star <= rating ? 'scale-110' : 'opacity-30 grayscale'}`}
                        >
                          <svg
                            className={`w-8 h-8 ${star <= rating ? (star <= 2 ? 'text-red-400' : star === 3 ? 'text-yellow-400' : 'text-orange-400') : 'text-zinc-400'}`}
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
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest ml-1">
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
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-bold py-4 rounded-xl shadow-lg shadow-orange-500/20 transition-[background-color,opacity,transform] active:scale-[0.97] flex items-center justify-center gap-2"
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
                    <p className="text-[10px] text-zinc-400 uppercase tracking-[0.2em] mb-2">
                      Or email us directly
                    </p>
                    <a
                      href="mailto:support@chekkiai.com"
                      className={`text-xs font-bold ${isNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'} transition-colors underline underline-offset-4`}
                    >
                      support@chekkiai.com
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
