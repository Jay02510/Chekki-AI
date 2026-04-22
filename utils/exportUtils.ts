import { WorksheetItem } from '../types';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { Capacitor } from '@capacitor/core';
import { PUBLIC_APP_URL } from '../config';

export const generateCompositeImage = async (imgUrl: string, items: WorksheetItem[], language: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    if (!imgUrl.startsWith('data:') && !imgUrl.includes('localhost') && !imgUrl.startsWith('capacitor://') && !imgUrl.startsWith('file://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        let finalWidth = img.naturalWidth || img.width;
        let finalHeight = img.naturalHeight || img.height;

        const MAX_DIM = 2000;
        if (finalWidth > MAX_DIM || finalHeight > MAX_DIM) {
          const ratio = Math.min(MAX_DIM / finalWidth, MAX_DIM / finalHeight);
          finalWidth = Math.round(finalWidth * ratio);
          finalHeight = Math.round(finalHeight * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return reject(new Error('No 2D context'));

        ctx.drawImage(img, 0, 0, finalWidth, finalHeight);

        const MathMax = Math.max;
        const scale = canvas.width / 1000;
        
        items.forEach(item => {
          const box = item.bounding_box;
          if (!box && !item.custom_coords) return;
          const topPercent = item.custom_coords ? item.custom_coords.top : ((box!.ymin + box!.ymax) / 2000) * 100;
          const leftPercent = item.custom_coords ? item.custom_coords.left : ((box!.xmin + box!.xmax) / 2000) * 100;

          const baseFontSize = MathMax(16, 28 * scale);
          const cx = (leftPercent / 100) * canvas.width;
          const cy = (topPercent / 100) * canvas.height;

          const textId = item.id.toString();
          const textAnswer = item.correct_answer;
          
          ctx.font = `900 ${baseFontSize}px sans-serif`;
          const idMetrics = ctx.measureText(textId);
          const answerMetrics = ctx.measureText(textAnswer);
          
          const paddingX = baseFontSize * 0.8;
          const paddingY = baseFontSize * 0.6;
          
          const idBoxWidth = MathMax(baseFontSize * 1.5, idMetrics.width + paddingX);
          const answerBoxWidth = answerMetrics.width + paddingX;
          const rectWidth = idBoxWidth + answerBoxWidth + paddingX * 0.5;
          const rectHeight = baseFontSize + paddingY * 2;
          
          const rawStartX = cx - rectWidth / 2;
          const rawStartY = cy - rectHeight / 2;
          const startX = Math.max(8, Math.min(rawStartX, canvas.width - rectWidth - 8));
          const startY = Math.max(8, Math.min(rawStartY, canvas.height - rectHeight - 8));

          ctx.save();
          ctx.shadowColor = 'rgba(0,0,0,0.5)';
          ctx.shadowBlur = 12 * scale;
          ctx.shadowOffsetY = 8 * scale;
          
          ctx.fillStyle = '#ea580c'; 
          ctx.beginPath();
          ctx.roundRect(startX, startY, rectWidth, rectHeight, baseFontSize * 0.6);
          ctx.fill();

          ctx.shadowColor = 'transparent';
          ctx.lineWidth = 2 * scale;
          ctx.strokeStyle = 'rgba(255,255,255,0.3)';
          ctx.stroke();

          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.beginPath();
          ctx.roundRect(startX + paddingX * 0.4, startY + paddingY * 0.5, idBoxWidth - paddingX * 0.4, rectHeight - paddingY, baseFontSize * 0.4);
          ctx.fill();

          ctx.fillStyle = '#ffffff';
          ctx.textBaseline = 'middle';
          
          ctx.textAlign = 'center';
          ctx.font = `900 ${baseFontSize * 0.85}px sans-serif`;
          ctx.fillText(textId, startX + paddingX * 0.2 + idBoxWidth / 2, cy);
          
          ctx.textAlign = 'left';
          ctx.font = `900 ${baseFontSize}px 'Comic Sans MS', 'Chalkboard SE', 'Marker Felt', sans-serif`;
          ctx.fillText(textAnswer, startX + idBoxWidth + paddingX * 0.4, cy);

          ctx.restore();
        });
        
        // Add "Ritual Record" Footer
        const footerHeight = 60 * scale;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, finalHeight - footerHeight, finalWidth, footerHeight);
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `italic 900 ${22 * scale}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText('✨ Chekki AI Ritual Result', 20 * scale, finalHeight - (footerHeight / 2) + (8 * scale));
        
        ctx.textAlign = 'right';
        ctx.font = `bold ${16 * scale}px sans-serif`;
        const dateStr = new Date().toLocaleDateString(language === 'ko' ? 'ko-KR' : 'en-US', { 
          year: 'numeric', month: 'long', day: 'numeric' 
        });
        ctx.fillText(dateStr, finalWidth - (20 * scale), finalHeight - (footerHeight / 2) + (6 * scale));

        resolve(canvas.toDataURL('image/jpeg', 0.95));
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = (e) => reject(new Error('Image load failed for composite'));
    img.src = imgUrl;
  });
};

export const saveImageToDevice = async (
  base64DataUrl: string, 
  shareTitle: string = 'Chekki AI Image',
  shareText: string = 'Check this out from Chekki AI!',
  fileNamePrefix: string = 'chekki-image'
): Promise<boolean> => {
  try {
    const finalBase64Data = base64DataUrl.includes('base64,') ? base64DataUrl.split('base64,')[1] : base64DataUrl;

    if (Capacitor.isNativePlatform()) {
      const fileName = `${fileNamePrefix}-${Date.now()}.jpg`;
      const savedFile = await Filesystem.writeFile({
        path: fileName,
        data: finalBase64Data,
        directory: Directory.Cache,
      });

      await Share.share({
        title: shareTitle,
        text: shareText,
        url: PUBLIC_APP_URL,
        files: [savedFile.uri],
        dialogTitle: shareTitle,
      });
      return true;
    } else {
      // Web fallback
      // First try navigator sharing if it supports files
      try {
        const byteCharacters = atob(finalBase64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'image/jpeg' });
        const file = new File([blob], `${fileNamePrefix}-${Date.now()}.jpg`, { type: 'image/jpeg' });
        
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
              title: shareTitle,
              text: shareText,
              url: PUBLIC_APP_URL,
              files: [file]
          });
          return true;
        }
      } catch (e) {
         console.warn("Navigator share with files failed", e);
      }

      // If navigator share fails or is unsupported, trigger a download download
      const a = document.createElement('a');
      a.href = base64DataUrl.includes('base64,') ? base64DataUrl : `data:image/jpeg;base64,${base64DataUrl}`;
      a.download = `${fileNamePrefix}-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    }
  } catch (err) {
    console.error('Error saving/sharing image:', err);
    return false;
  }
};
