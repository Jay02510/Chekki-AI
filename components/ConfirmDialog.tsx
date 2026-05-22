
import React from 'react';

interface ConfirmDialogProps {
  title: string;
  confirmText?: string;
  cancelText?: string;
  isSaving?: boolean;
  isNight: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  title,
  confirmText,
  cancelText,
  isSaving,
  isNight,
  onConfirm,
  onCancel
}) => {
  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onCancel}></div>
      <div className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200 shadow-2xl'} border rounded-[2.5rem] p-8 max-w-sm w-full text-center animate-fade-in-up`}>
        <div className={`w-14 h-14 rounded-2xl ${isNight ? 'bg-zinc-800 border-white/5' : 'bg-zinc-100 border-zinc-200'} border flex items-center justify-center mx-auto mb-5`}>
          <svg className={`w-7 h-7 ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 5.25h.008v.008H12v-.008Z" />
          </svg>
        </div>
        <p className={`${isNight ? 'text-white' : 'text-zinc-900'} font-black text-lg mb-6 font-korean uppercase tracking-tight`}>{title}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} disabled={isSaving} className={`w-full ${isNight ? 'bg-white text-black' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50`}>
            {confirmText || "Yes"}
          </button>
          <button onClick={onCancel} disabled={isSaving} className={`w-full ${isNight ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'} py-4 rounded-2xl font-black uppercase text-xs transition-all active:scale-95 disabled:opacity-50`}>
            {cancelText || "No"}
          </button>
        </div>
      </div>
    </div>
  );
};
