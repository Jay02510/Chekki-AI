import { X } from '@phosphor-icons/react';
import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalExit } from '../hooks/useModalExit';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Props {
  imageSrc: string;
  isNight?: boolean;
  onClose: () => void;
  onCropComplete: (croppedDataUrl: string) => void;
  onGradeOriginal: () => void;
}

interface Box {
  x: number; // percentage (0-100)
  y: number; // percentage (0-100)
  w: number; // percentage (0-100)
  h: number; // percentage (0-100)
}

// Helper to rotate image 90 degrees in memory via Canvas
const rotateImage90 = (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.height;
      canvas.height = img.width;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context for rotation'));
        return;
      }
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((90 * Math.PI) / 180);
      ctx.drawImage(img, -img.width / 2, -img.height / 2);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image for rotation'));
  });
};

// Helper to crop image in memory via Canvas
const cropImage = (src: string, box: Box): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const cropX = (box.x / 100) * img.width;
      const cropY = (box.y / 100) * img.height;
      const cropW = (box.w / 100) * img.width;
      const cropH = (box.h / 100) * img.height;

      canvas.width = cropW;
      canvas.height = cropH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas 2d context for cropping'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
  });
};

export const CropModal: React.FC<Props> = ({
  imageSrc,
  isNight = false,
  onClose,
  onCropComplete,
  onGradeOriginal,
}) => {
  const { language } = useLanguage();
  const [currentImage, setCurrentImage] = useState(imageSrc);
  const [isProcessing, setIsProcessing] = useState(false);
  const { isClosing, close } = useModalExit(onClose);
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose: close });
  const [box, setBox] = useState<Box>({ x: 3, y: 3, w: 94, h: 94 });
  const [lowResWarning, setLowResWarning] = useState(false);
  // One "Grade" button: an untouched frame grades the original photo, an
  // adjusted frame grades the crop (replaces separate Grade Original /
  // Crop & Grade / Cancel buttons).
  const [adjusted, setAdjusted] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  // Dynamically verify if selected crop area is too low-res
  useEffect(() => {
    const img = new Image();
    img.src = currentImage;
    img.onload = () => {
      const cropPixelWidth = img.width * (box.w / 100);
      const cropPixelHeight = img.height * (box.h / 100);
      setLowResWarning(cropPixelWidth < 300 || cropPixelHeight < 300);
    };
  }, [box, currentImage]);

  // Rotate in-memory and reset selection box to fit new aspect ratio
  const handleRotate = async () => {
    setIsProcessing(true);
    try {
      const rotated = await rotateImage90(currentImage);
      setCurrentImage(rotated);
      setBox({ x: 3, y: 3, w: 94, h: 94 });
      setAdjusted(false);
    } catch (err) {
      console.error('Failed to rotate image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropSubmit = async () => {
    setIsProcessing(true);
    try {
      if (!adjusted && currentImage === imageSrc) {
        onGradeOriginal();
        return;
      }
      const cropped = await cropImage(currentImage, adjusted ? box : { x: 0, y: 0, w: 100, h: 100 });
      onCropComplete(cropped);
    } catch (err) {
      console.error('Failed to crop image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const startDrag = (e: React.PointerEvent, handler: 'TL' | 'TR' | 'BL' | 'BR' | 'move') => {
    e.preventDefault();
    e.stopPropagation();
    setAdjusted(true);

    const container = containerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const startPointerX = e.clientX;
    const startPointerY = e.clientY;
    const startBox = { ...box };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const dx = moveEvent.clientX - startPointerX;
      const dy = moveEvent.clientY - startPointerY;

      const pctDx = (dx / rect.width) * 100;
      const pctDy = (dy / rect.height) * 100;

      const minSize = 15; // Minimum 15% width/height crop guard

      setBox((prev) => {
        let newX = prev.x;
        let newY = prev.y;
        let newW = prev.w;
        let newH = prev.h;

        if (handler === 'move') {
          newX = Math.max(0, Math.min(startBox.x + pctDx, 100 - startBox.w));
          newY = Math.max(0, Math.min(startBox.y + pctDy, 100 - startBox.h));
        } else if (handler === 'TL') {
          newX = Math.max(0, Math.min(startBox.x + pctDx, startBox.x + startBox.w - minSize));
          newW = startBox.w - (newX - startBox.x);
          newY = Math.max(0, Math.min(startBox.y + pctDy, startBox.y + startBox.h - minSize));
          newH = startBox.h - (newY - startBox.y);
        } else if (handler === 'TR') {
          newW = Math.max(minSize, Math.min(startBox.w + pctDx, 100 - startBox.x));
          newY = Math.max(0, Math.min(startBox.y + pctDy, startBox.y + startBox.h - minSize));
          newH = startBox.h - (newY - startBox.y);
        } else if (handler === 'BL') {
          newX = Math.max(0, Math.min(startBox.x + pctDx, startBox.x + startBox.w - minSize));
          newW = startBox.w - (newX - startBox.x);
          newH = Math.max(minSize, Math.min(startBox.h + pctDy, 100 - startBox.y));
        } else if (handler === 'BR') {
          newW = Math.max(minSize, Math.min(startBox.w + pctDx, 100 - startBox.x));
          newH = Math.max(minSize, Math.min(startBox.h + pctDy, 100 - startBox.y));
        }

        return { x: newX, y: newY, w: newW, h: newH };
      });
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const isKo = language === 'ko';

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center p-4 ${isClosing ? '' : 'animate-fade-in'}`}
    >
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 transition-opacity ${isClosing ? 'modal-backdrop-exit' : ''}`}
        onClick={close}
      />

      {/* Modal Container */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="crop-modal-title"
        tabIndex={-1}
        className={`relative rounded-md shadow-[0_30px_60px_-20px_rgba(0,0,0,0.6)] ${isClosing ? 'modal-exit' : 'modal-enter'} flex flex-col max-h-[92vh] w-full max-w-xl sm:mx-4`}
      >
        <div
          className={`relative w-full h-full rounded-md bg-surface text-ink flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`p-5 pb-4 border-b border-rule flex items-start justify-between shrink-0`}
          >
            <div>
              <h3 id="crop-modal-title" className="sign-ko text-xl">
                {isKo ? '채점할 영역 확인' : 'Check the photo'}
              </h3>
              <p
                className={`text-[14px] mt-1 leading-snug text-ink-3`}
              >
                {isKo
                  ? '필요하면 모서리를 끌어 영역을 맞추세요. 그대로 두면 전체 사진을 채점합니다.'
                  : 'Drag the corners to frame the worksheet, or leave it to grade the whole photo.'}
              </p>
            </div>
            <button
              onClick={close}
              disabled={isProcessing}
              className={`w-11 h-11 shrink-0 flex items-center justify-center rounded-md text-ink-3 hover:text-ink hover:bg-sunken`}
              aria-label={isKo ? '닫기' : 'Close'}
            >
              <X size={20} weight="bold" />
            </button>
          </div>

          {/* Body / Workspace */}
          <div className="p-4 flex-1 flex flex-col justify-center items-center overflow-y-auto max-h-[60vh]">
            <div
              ref={containerRef}
              className="relative select-none touch-none mx-auto ring-1 ring-rule rounded overflow-hidden max-h-[45vh]"
            >
              {/* Image Preview */}
              <img
                src={currentImage}
                alt="Workspace Preview"
                className="max-w-full max-h-[45vh] block object-contain pointer-events-none"
              />

              {/* Crop Bounding Box overlay */}
              <div
                className="absolute border-[3px] border-line cursor-move bg-line/10 transition-[box-shadow]"
                style={{
                  left: `${box.x}%`,
                  top: `${box.y}%`,
                  width: `${box.w}%`,
                  height: `${box.h}%`,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.65)',
                }}
                onPointerDown={(e) => startDrag(e, 'move')}
              >
                {/* 3x3 Grid Viewfinder lines */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none border border-line/30">
                  <div className="border-r border-b border-line/20" />
                  <div className="border-r border-b border-line/20" />
                  <div className="border-b border-line/20" />
                  <div className="border-r border-b border-line/20" />
                  <div className="border-r border-b border-line/20" />
                  <div className="border-b border-line/20" />
                  <div className="border-r border-line/20" />
                  <div className="border-r border-line/20" />
                  <div />
                </div>

                {/* Draggable Corner Handles with expanded transparent touch targets */}
                {/* Top Left */}
                <div
                  className="absolute w-8 h-8 -top-4 -left-4 flex items-center justify-center cursor-nwse-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'TL')}
                >
                  <div className="w-4 h-4 bg-line rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                </div>
                {/* Top Right */}
                <div
                  className="absolute w-8 h-8 -top-4 -right-4 flex items-center justify-center cursor-nesw-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'TR')}
                >
                  <div className="w-4 h-4 bg-line rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                </div>
                {/* Bottom Left */}
                <div
                  className="absolute w-8 h-8 -bottom-4 -left-4 flex items-center justify-center cursor-nesw-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'BL')}
                >
                  <div className="w-4 h-4 bg-line rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                </div>
                {/* Bottom Right */}
                <div
                  className="absolute w-8 h-8 -bottom-4 -right-4 flex items-center justify-center cursor-nwse-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'BR')}
                >
                  <div className="w-4 h-4 bg-line rounded-full border-[3px] border-white shadow-[0_2px_6px_rgba(0,0,0,0.35)]" />
                </div>
              </div>
            </div>

            {/* Low-res warning overlay */}
            {lowResWarning && (
              <div
                className={`mt-3 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold font-korean flex items-center gap-1.5 bg-line-soft text-line-ink shrink-0`}
              >
                <span>⚠️</span>
                <span>
                  {isKo
                    ? '자르는 영역이 너무 작아 글자가 흐리게 보일 수 있습니다.'
                    : 'The cropped area is very small. Text might be blurry.'}
                </span>
              </div>
            )}
          </div>

          {/* Quick Rotate Widget */}
          <div
            className={`px-4 py-2 border-t border-rule flex justify-center shrink-0`}
          >
            <button
              onClick={handleRotate}
              disabled={isProcessing}
              className={`px-4 min-h-11 rounded-md text-[14px] font-bold flex items-center gap-1.5 text-ink-2 ring-1 ring-inset ring-rule hover:text-ink disabled:opacity-50`}
            >
              <span aria-hidden="true">↻</span>
              <span>{isKo ? '회전' : 'Rotate'}</span>
            </button>
          </div>

          {/* Footer actions */}
          <div
            className={`p-4 border-t border-rule flex flex-col sm:flex-row justify-end gap-2.5 shrink-0`}
          >
            <button
              onClick={handleCropSubmit}
              disabled={isProcessing}
              className="w-full px-6 min-h-12 bg-line disabled:opacity-50 text-[#2b211a] font-bold text-[15px] rounded-md transition-transform active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <div className="w-3.5 h-3.5 border-2 border-[#2b211a]/30 border-t-[#2b211a] rounded-full animate-spin" />
              ) : (
                <span>{isKo ? '채점하기' : 'Grade'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
