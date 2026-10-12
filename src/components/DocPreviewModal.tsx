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
      <div className="absolute inset-0 bg-[#2b211a]/55" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="doc-preview-title"
        tabIndex={-1}
        className={`relative p-1 border rounded-lg flex flex-col w-full max-w-4xl mx-4 animate-fade-in text-left max-h-[90vh] ${
        'bg-surface border-rule'
      }`}>
        <div className={`relative w-full h-full rounded-lg p-6 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col ${
          'bg-surface text-ink'
        }`}>
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-rule">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-sunken border border-rule text-ink-2 flex items-center justify-center">
                <Eye size={22} weight="bold" />
              </div>
              <div>
                <h3 id="doc-preview-title" className={`text-lg font-extrabold text-ink`}>
                  {isKo ? '스캔 원본 교재 / 워크시트 문서 미리보기' : 'Scanned Document Original Preview'}
                </h3>
                <p className="text-xs text-ink-3">
                  {uploadedFileName || (isKo ? '스캔된 교재 이미지/PDF' : 'Scanned Image / PDF')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={isKo ? '닫기' : 'Close'}
              className={`min-w-11 min-h-11 flex items-center justify-center rounded-md transition-[color,background-color,border-color,opacity,transform] cursor-pointer ${
                'bg-sunken hover:bg-sunken text-ink-2'
              }`}
            >
              <X size={18} weight="bold" />
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-4 bg-[#2b211a]/55 rounded-lg border border-rule overflow-hidden min-h-[50vh]">
            {textbookPreviewUrl ? (
              <img
                src={textbookPreviewUrl}
                alt="Scanned original document"
                className="max-h-[65vh] w-auto object-contain rounded-md"
              />
            ) : (
              <p className="text-sm text-ink-3 italic">
                {isKo ? '문서 미리보기 이미지를 로드할 수 없습니다.' : 'Document image preview unavailable.'}
              </p>
            )}
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-line hover:bg-line text-on-line font-bold text-xs rounded-md cursor-pointer"
            >
              {isKo ? '미리보기 닫기' : 'Close Preview'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
