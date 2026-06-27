/**
 * compressImage.ts
 *
 * Client-side image compression utility.
 * Downscales a base64-encoded image to a max dimension of 1600px
 * and re-encodes as JPEG at 0.82 quality.
 *
 * This prevents oversized phone photos (10MB+) from hitting the
 * 4MB Vercel body size limit without throwing errors to the user.
 */

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.82;

/**
 * Compresses a base64 data URL image to a smaller JPEG.
 * Falls back to returning the original if Canvas API is unavailable.
 *
 * @param base64DataUrl  A base64 data URL string (e.g. "data:image/jpeg;base64,...")
 * @returns              A compressed base64 JPEG data URL
 */
export async function compressImage(base64DataUrl: string): Promise<string> {
  if (typeof document === 'undefined' || !document.createElement) {
    return base64DataUrl;
  }

  return new Promise((resolve) => {
    const img = new Image();

    img.onload = () => {
      let { width, height } = img;

      // Only downscale — never upscale
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(base64DataUrl);
        return;
      }

      // White background prevents transparency artifacts when converting PNG→JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      resolve(canvas.toDataURL('image/jpeg', JPEG_QUALITY));
    };

    img.onerror = () => {
      console.warn('[compressImage] Failed to load image for compression; using original.');
      resolve(base64DataUrl);
    };

    img.src = base64DataUrl;
  });
}

/**
 * Strips the "data:image/...;base64," prefix from a data URL,
 * returning only the raw base64 string (which is what the API expects).
 */
export function stripDataUrlPrefix(dataUrl: string): string {
  const idx = dataUrl.indexOf(',');
  if (idx === -1) return dataUrl;
  return dataUrl.substring(idx + 1);
}
