import React from 'react';
import { X, Eye } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Props {
  isThemeNight: boolean;
  isKo: boolean;
  uploadedFileName?: string | null;
  textbookPreviewUrl?: string | null;
  onClose: () => void;
}

export const DocPreviewModal: React.FC<Props> = ({
  isThemeNight,
  isKo,
  uploadedFileName,
  textbookPreviewUrl,
  onClose,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  return (
    <div className="fixed inset-0 z-[450] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        tabIndex={-1}
        className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-4xl mx-4 animate-fade-in text-left max-h-[90vh] ${
        isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
      }`}>
        <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col ${
          isThemeNight ? 'bg-[#0c0c0e] text-zinc-100' : 'bg-white text-zinc-900'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                <Eye size={22} weight="bold" />
              </div>
              <div>
                <h3 id="doc-preview-title" className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '스캔 원본 교재 / 워크시트 문서 미리보기' : 'Scanned Document Original Preview'}
                </h3>
                <p className="text-xs text-zinc-400">
                  {uploadedFileName || (isKo ? '스캔된 교재 이미지/PDF' : 'Scanned Image / PDF')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
              }`}
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 overflow-hidden min-h-[50vh]">
            {textbookPreviewUrl ? (
              <img
                src={textbookPreviewUrl}
                alt="Scanned original document"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl"
              />
            ) : (
              <p className="text-sm text-zinc-400 italic">
                {isKo ? '문서 미리보기 이미지를 로드할 수 없습니다.' : 'Document image preview unavailable.'}
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
            >
              {isKo ? '미리보기 닫기' : 'Close Preview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
