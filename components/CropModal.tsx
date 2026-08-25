import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useModalExit } from '../hooks/useModalExit';

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
  const [box, setBox] = useState<Box>({ x: 10, y: 10, w: 80, h: 80 });
  const [lowResWarning, setLowResWarning] = useState(false);

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
      setBox({ x: 10, y: 10, w: 80, h: 80 });
    } catch (err) {
      console.error('Failed to rotate image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCropSubmit = async () => {
    setIsProcessing(true);
    try {
      const cropped = await cropImage(currentImage, box);
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
        className={`absolute inset-0 bg-black/85 backdrop-blur-sm transition-opacity ${isClosing ? 'modal-backdrop-exit' : ''}`}
        onClick={close}
      />

      {/* Modal Container */}
      <div
        className={`relative p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] ${isClosing ? 'modal-exit' : 'modal-enter'} flex flex-col max-h-[92vh] w-full max-w-xl sm:mx-4`}
      >
        <div
          className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] ${isNight ? 'bg-[#0a0a0a] text-zinc-200' : 'bg-white text-zinc-900'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex flex-col overflow-hidden`}
        >
          {/* Header */}
          <div
            className={`p-5 pb-3 border-b ${isNight ? 'border-zinc-900 bg-zinc-950/50' : 'border-zinc-100 bg-zinc-50/50'} flex items-start justify-between shrink-0`}
          >
            <div>
              <h3 className="text-lg md:text-xl font-black tracking-tight">
                {isKo ? '📸 이미지 편집' : '📸 Edit Image'}
              </h3>
              <p
                className={`text-xs mt-1 leading-normal ${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-medium font-korean`}
              >
                {isKo
                  ? '모서리를 조절해 채점할 영역을 선택하세요. 옆으로 누운 사진은 회전시켜주세요.'
                  : 'Drag corners to frame the worksheet. Rotate sideways photos upright.'}
              </p>
            </div>
            <button
              onClick={close}
              disabled={isProcessing}
              className={`p-2 rounded-full transition-colors ${isNight ? 'text-zinc-500 hover:text-white hover:bg-white/5' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100'}`}
              title="Close"
            >
              ✕
            </button>
          </div>

          {/* Body / Workspace */}
          <div className="p-4 flex-1 flex flex-col justify-center items-center overflow-y-auto max-h-[60vh]">
            <div
              ref={containerRef}
              className="relative select-none touch-none mx-auto border border-zinc-500/20 rounded-xl overflow-hidden max-h-[45vh]"
            >
              {/* Image Preview */}
              <img
                src={currentImage}
                alt="Workspace Preview"
                className="max-w-full max-h-[45vh] block object-contain pointer-events-none"
              />

              {/* Crop Bounding Box overlay */}
              <div
                className="absolute border-2 border-orange-500 cursor-move bg-orange-500/10 transition-[box-shadow]"
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
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 opacity-30 pointer-events-none border border-orange-500/30">
                  <div className="border-r border-b border-orange-500/20" />
                  <div className="border-r border-b border-orange-500/20" />
                  <div className="border-b border-orange-500/20" />
                  <div className="border-r border-b border-orange-500/20" />
                  <div className="border-r border-b border-orange-500/20" />
                  <div className="border-b border-orange-500/20" />
                  <div className="border-r border-orange-500/20" />
                  <div className="border-r border-orange-500/20" />
                  <div />
                </div>

                {/* Draggable Corner Handles with expanded transparent touch targets */}
                {/* Top Left */}
                <div
                  className="absolute w-8 h-8 -top-4 -left-4 flex items-center justify-center cursor-nwse-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'TL')}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-black/30" />
                </div>
                {/* Top Right */}
                <div
                  className="absolute w-8 h-8 -top-4 -right-4 flex items-center justify-center cursor-nesw-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'TR')}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-black/30" />
                </div>
                {/* Bottom Left */}
                <div
                  className="absolute w-8 h-8 -bottom-4 -left-4 flex items-center justify-center cursor-nesw-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'BL')}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-black/30" />
                </div>
                {/* Bottom Right */}
                <div
                  className="absolute w-8 h-8 -bottom-4 -right-4 flex items-center justify-center cursor-nwse-resize select-none touch-none z-10"
                  onPointerDown={(e) => startDrag(e, 'BR')}
                >
                  <div className="w-4 h-4 bg-orange-500 rounded-full border-2 border-white shadow-lg shadow-black/30" />
                </div>
              </div>
            </div>

            {/* Low-res warning overlay */}
            {lowResWarning && (
              <div
                className={`mt-3 px-3 py-1.5 rounded-full text-[10px] md:text-xs font-semibold font-korean flex items-center gap-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 animate-pulse shrink-0`}
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
            className={`px-4 py-2 border-t flex justify-center shrink-0 ${isNight ? 'border-zinc-900 bg-zinc-950/30' : 'border-zinc-100 bg-zinc-50/30'}`}
          >
            <button
              onClick={handleRotate}
              disabled={isProcessing}
              className={`px-4 py-1.5 rounded-full border text-[11px] md:text-xs font-bold tracking-wider flex items-center gap-1.5 transition-all duration-200 ${
                isNight
                  ? 'bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800'
                  : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100'
              } disabled:opacity-50`}
            >
              <span>🔄</span>
              <span>{isKo ? '90° 회전' : 'Rotate 90°'}</span>
            </button>
          </div>

          {/* Footer actions */}
          <div
            className={`p-4 border-t flex flex-col sm:flex-row justify-end gap-2.5 shrink-0 ${isNight ? 'border-zinc-900 bg-zinc-950/60' : 'border-zinc-100 bg-zinc-50/60'}`}
          >
            <button
              onClick={close}
              disabled={isProcessing}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold transition-all ${
                isNight
                  ? 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white border border-zinc-800/40'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 hover:text-zinc-900 border border-zinc-200/40'
              } disabled:opacity-50`}
            >
              {isKo ? '취소' : 'Cancel'}
            </button>

            <button
              onClick={onGradeOriginal}
              disabled={isProcessing}
              className={`w-full sm:w-auto px-5 py-3 rounded-xl text-xs font-bold border transition-all ${
                isNight
                  ? 'bg-zinc-950 border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                  : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50 hover:text-zinc-950'
              } disabled:opacity-50`}
            >
              {isKo ? '원본 채점' : 'Grade Original'}
            </button>

            <button
              onClick={handleCropSubmit}
              disabled={isProcessing}
              className="w-full sm:w-auto px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
            >
              {isProcessing ? (
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <span>✂️ {isKo ? '영역 자르고 채점' : 'Crop & Grade'}</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
