import React from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';
import { useModalExit } from '../hooks/useModalExit';
import { useLanguage } from '../contexts/LanguageContext';

interface SuccessDialogProps {
  message: string;
  isNight: boolean;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ message, onClose }) => {
  const { language } = useLanguage();
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div
        className={`absolute inset-0 bg-[#2b211a]/55 ${isClosing ? 'modal-backdrop-exit' : 'animate-fade-in'}`}
        onClick={close}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={message}
        tabIndex={-1}
        className={`relative w-full max-w-sm rounded-lg bg-surface p-6 text-center ring-1 ring-inset ring-rule shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)] ${isClosing ? 'modal-exit' : 'modal-enter'}`}
      >
        <img
          src="/images/chekki-thumbs.webp"
          alt=""
          className="mx-auto mb-3 h-24 w-24 object-contain"
        />
        <p className="text-[17px] font-extrabold leading-snug text-ink break-keep">{message}</p>
        <button
          onClick={close}
          className="btn-press mt-6 min-h-12 w-full rounded-md bg-line text-[15px] font-bold text-[#2b211a]"
        >
          {language === 'ko' ? '좋아요' : 'OK'}
        </button>
      </div>
    </div>
  );
};
