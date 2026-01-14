
export const compressImage = (file: File, maxWidth = 900, quality = 0.4): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Smaller cap for faster transit
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) {
          reject(new Error('Canvas context failed'));
          return;
        }
        
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'low'; // Fast resize
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // JPEG at 0.4 is perfect balance for text OCR and tiny payload
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };

      img.onerror = () => reject(new Error("Image load failed"));
    };

    reader.onerror = () => reject(new Error("File read failed"));
  });
};
