import { compressImage } from '../../services/compressImage';

// Well under Firestore's 1MiB document limit, leaving room for the rest of
// the schools/{id} doc (seats, plan, trial fields, etc).
const MAX_LOGO_DATA_URL_LENGTH = 500 * 1024;

export class LogoTooLargeError extends Error {
  constructor() {
    super('Logo is still too large after compression. Try a smaller image or paste a URL instead.');
    this.name = 'LogoTooLargeError';
  }
}

/**
 * Reads an image File, compresses it via the same pipeline used for
 * textbook-scan uploads, and returns a base64 data URL small enough to
 * store as a single Firestore string field.
 */
export async function readAndCompressLogoFile(file: File): Promise<string> {
  const rawBase64Url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Could not read that image file.'));
    reader.readAsDataURL(file);
  });

  const compressed = await compressImage(rawBase64Url);

  if (compressed.length > MAX_LOGO_DATA_URL_LENGTH) {
    throw new LogoTooLargeError();
  }

  return compressed;
}
