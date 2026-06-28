import React from 'react';

interface ConfirmDialogProps {
  title: string;
  confirmText?: string;
  cancelText?: string;
  isSaving?: boolean;
  isNight: boolean;
  variant?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  confirmText,
  cancelText,
  isSaving,
  isNight,
  variant = 'default',
  onConfirm,
  onCancel,
}) => {
  // Focus trap: keep Tab cycling within the two dialog buttons
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = (e.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(
      'button:not([disabled])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  const isDestructive = variant === 'destructive';
  return (
    <div
      className="fixed inset-0 z-[250] flex items-center justify-center p-4"
      onKeyDown={handleKeyDown}
    >
      <div
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
        onClick={onCancel}
        aria-hidden="true"
      />
      <div className="relative p-1.5 bg-white/5 border border-white/10 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.5)] modal-enter flex flex-col max-h-[95vh] w-full max-w-sm mx-4">
        <div className={`relative w-full h-full rounded-[calc(2rem-0.375rem)] ${isNight ? 'bg-[#050505]' : 'bg-white'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden`}>
        <div
          className={`w-14 h-14 rounded-2xl ${isDestructive ? 'bg-red-950/40 border-red-500/20' : isNight ? 'bg-zinc-800 border-white/5' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center mx-auto mb-5`}
        >
          {isDestructive ? (
            <svg
              className="w-7 h-7 text-red-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
              />
            </svg>
          ) : (
            <svg
              className={`w-7 h-7 ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z"
              />
            </svg>
          )}
        </div>
        <p
          id="confirm-title"
          className={`${isNight ? 'text-white' : 'text-zinc-900'} font-black text-lg mb-6 font-korean uppercase tracking-tight`}
        >
          {title}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isSaving}
            autoFocus
            className={`w-full ${isDestructive ? 'bg-red-600 hover:bg-red-700 text-white' : isNight ? 'bg-white text-black' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-[0.97] disabled:opacity-50`}
          >
            {confirmText || 'Confirm'}
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className={`w-full ${isNight ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-[0.97] disabled:opacity-50`}
          >
            {cancelText || 'Cancel'}
          </button>
        </div>
      </div>
      </div>
    </div>
  );
};
