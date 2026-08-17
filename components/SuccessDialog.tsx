import React from 'react';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface SuccessDialogProps {
  message: string;
  isNight: boolean;
  onClose: () => void;
}

export const SuccessDialog: React.FC<SuccessDialogProps> = ({ message, isNight, onClose }) => {
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 md:p-6">
      <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={onClose}></div>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={message}
        tabIndex={-1}
        className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter max-w-md w-full mx-4"
      >
        <div
          className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-brand-dark' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden text-center p-8 md:p-10`}
        >
          <div
            className={`w-16 h-16 ${isNight ? 'bg-emerald-500/20' : 'bg-emerald-50'} rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(16,185,129,0.2)]`}
          >
            <svg
              className="w-8 h-8 text-emerald-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
              />
            </svg>
          </div>
          <p
            className={`${isNight ? 'text-white' : 'text-zinc-900'} font-bold text-lg mb-8 font-korean leading-relaxed`}
          >
            {message}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-xl shadow-emerald-500/20 active:scale-[0.97] transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
