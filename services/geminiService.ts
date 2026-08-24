import { WorksheetAnalysis, WorksheetItem } from '../types';
import { Capacitor } from '@capacitor/core';
import { auth } from './database';
import { API_BASE_URL, MOCK_MODE, MOCK_DELAY } from '../config';
import { compressImage, stripDataUrlPrefix } from './compressImage';

const getValidIdToken = async (maxRetries = 3): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    try {
      return await user.getIdToken();
    } catch (e) {
      console.warn('[geminiService] Direct token retrieval failed:', e);
    }
  }

  // If no user or direct retrieval failed, wait a bit for auth to initialize
  for (let i = 0; i < maxRetries; i++) {
    const activeUser = auth.currentUser;
    if (activeUser) {
      try {
        const token = await activeUser.getIdToken();
        if (token) return token;
      } catch (e) {
        console.error('Token retry error:', e);
      }
    }
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
  return null;
};

export const analyzeWorksheet = async (
  base64Image: string,
  signal?: AbortSignal,
  userPlan: string = 'free',
  childAge?: string,
  childEnglishLevel?: string,
  parentEnglishLevel?: string,
  language: string = 'ko',
  idempotencyKey?: string
): Promise<WorksheetAnalysis> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return {
      worksheet_summary: {
        title_en: 'Practice Worksheet: Multiplication',
        title_ko: '연습 학습지: 곱셈',
        overview_ko: '이 학습지는 기본적인 곱셈 개념을 복습하기 위한 것입니다.',
      },
      items: [
        {
          id: 1,
          type: 'text',
          question_text: 'What is 7 x 8?',
          correct_answer: '56',
          korean_guide: '7 x 8은 얼마인가요? 7에 8을 곱하면 56이 됩니다.',
          teaching_script_ko: '7 곱하기 8은 56입니다.',
          student_response: '56',
          is_correct: true,
        },
        {
          id: 2,
          type: 'text',
          question_text: 'What is 6 x 9?',
          correct_answer: '54',
          korean_guide: '6 x 9는 얼마인가요? 6에 9를 곱하면 54가 됩니다.',
          teaching_script_ko: '6 곱하기 9는 54입니다.',
          student_response: '52',
          is_correct: false,
        },
      ],
    };
  }

  const baseUrl = API_BASE_URL;

  try {
    // Start getting token and checking network in parallel
    const idTokenPromise = getValidIdToken();

    const idToken = await idTokenPromise;
    if (!idToken) {
      console.warn(
        '[geminiService] ⚠️ No auth token — proceeding as guest. API will likely reject with UNAUTHORIZED.'
      );
    }

    // The 5-minute safety timeout used to be entirely dead code: every real
    // caller (useWorksheetAnalysis) passes its own AbortController signal,
    // and `signal || timeoutController.signal` always picked the caller's
    // signal — timeoutController.signal was built and cleaned up but never
    // actually attached to the fetch below. A stalled connection (flaky
    // school WiFi, a backgrounded device) had no client-side escape hatch
    // at all; the caller's signal only aborts on unmount or a fresh scan,
    // not on a network stall. Now the timeout controller is always what's
    // passed to fetch, and the caller's signal (if any) is wired to abort
    // it too — both can cancel the request instead of only one winning.
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 300000);
    if (signal) {
      if (signal.aborted) timeoutController.abort();
      else signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }
    const activeSignal = timeoutController.signal;

    // --- CLIENT-SIDE IMAGE COMPRESSION ---
    // Downscale to max 1600px JPEG before sending to prevent the 4MB
    // Vercel body limit from being hit by high-res phone photos.
    // Only compress if the image size is large (e.g. base64 string length > 1,500,000 characters),
    // since the camera/upload views already compress images before passing them here.
    let processedImage = base64Image;
    if (base64Image.length > 1500000) {
      try {
        // If the input is a raw base64 string (no prefix), add one so the canvas can load it
        const hasPrefix = base64Image.startsWith('data:');
        const dataUrl = hasPrefix ? base64Image : `data:image/jpeg;base64,${base64Image}`;
        const compressed = await compressImage(dataUrl);
        // Strip the prefix back off — the API only wants the raw base64
        processedImage = stripDataUrlPrefix(compressed);
      } catch (compressionError) {
        console.warn('[geminiService] Image compression failed, using original:', compressionError);
      }
    }
    // --- END COMPRESSION ---

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: idToken ? `Bearer ${idToken}` : '',
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers,
      signal: activeSignal,
      body: JSON.stringify({
        task: 'analyze',
        image: processedImage,
        userPlan,
        childAge,
        childEnglishLevel,
        parentEnglishLevel,
        language,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        errorData = { error: `HTTP_${response.status}: ${text.substring(0, 100)}` };
      }
      const detailedMsg = errorData.details
        ? `${errorData.error || 'BACKEND_FAILED'}: ${errorData.details}`
        : errorData.error || 'BACKEND_FAILED';
      console.error('[geminiService] Backend error response:', errorData);
      throw new Error(detailedMsg);
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;

    console.error('[geminiService] API Call Failed:', error.message);

    if (!navigator.onLine) {
      throw new Error('OFFLINE_ERROR');
    }

    if (error.message === 'Failed to fetch' || error.message.includes('Load failed')) {
      throw new Error(`NETWORK_ERROR: Check connectivity to ${baseUrl}`);
    }

    throw error;
  }
};

export const generateSimilarWorksheet = async (
  originalItems: WorksheetItem[],
  language: string = 'ko',
  signal?: AbortSignal,
  idempotencyKey?: string
): Promise<WorksheetItem[]> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return originalItems.map((item) => ({
      ...item,
      question_text: `[New Version] ${item.question_text}`,
      korean_guide: `[새 버전] ${item.korean_guide}`,
      student_response: undefined,
      is_correct: undefined,
    }));
  }
  try {
    const idToken = await getValidIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: idToken ? `Bearer ${idToken}` : '',
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        task: 'generate',
        originalItems: originalItems.slice(0, 5),
        language,
      }),
    });

    if (!response.ok) throw new Error('GEN_FAILED');
    const newItems = await response.json();

    return newItems.map((item: any, idx: number) => ({
      ...item,
      id: idx + 1,
    }));
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
    return originalItems;
  }
};

export const refineWorksheetItem = async (
  item: WorksheetItem,
  reason: string,
  language: string = 'ko',
  idempotencyKey?: string,
  signal?: AbortSignal
): Promise<Partial<WorksheetItem>> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return {
      korean_guide: `[다듬어짐] ${item.korean_guide} (이유: ${reason})`,
      english_guide: `[Refined] ${item.english_guide} (Reason: ${reason})`,
      teaching_script_ko: `[다듬어짐] ${item.teaching_script_ko}`,
      teaching_script_en: `[Refined] ${item.teaching_script_en}`,
    };
  }

  try {
    const idToken = await getValidIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: idToken ? `Bearer ${idToken}` : '',
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        task: 'refine',
        itemToRefine: item,
        reason: reason,
        language: language,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[geminiService] Refine failed:', errText);
      throw new Error('REFINE_FAILED');
    }

    const refinedData = await response.json();
    return refinedData;
  } catch (e: any) {
    console.error('[geminiService] Refine API error:', e);
    throw e;
  }
};

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export const askChekkiQuestion = async (
  question: string,
  language: string = 'ko',
  isGuest: boolean = false,
  signal?: AbortSignal,
  history: ChatTurn[] = [],
  idempotencyKey?: string,
  worksheetContext?: string
): Promise<string> => {
  if (MOCK_MODE) {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY));
    return isGuest
      ? "This is a basic answer. 'A' is used before consonants, and 'an' before vowels."
      : "This is a detailed answer. 'A' is used before words starting with a consonant, and 'an' is used before words starting with a vowel. For example, 'A dog' vs 'An apple'. Want to see more examples? 😊";
  }

  try {
    const idToken = await getValidIdToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: idToken ? `Bearer ${idToken}` : '',
    };
    if (idempotencyKey) {
      headers['X-Idempotency-Key'] = idempotencyKey;
    }

    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers,
      signal,
      body: JSON.stringify({
        task: 'ask_question',
        question: question,
        isGuest: isGuest,
        language: language,
        history: history,
        worksheetContext: worksheetContext,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      let errorMsg = 'ASK_FAILED';
      try {
        const errorData = JSON.parse(errText);
        errorMsg = errorData.error || 'ASK_FAILED';
      } catch (e) {
        errorMsg = errText || 'ASK_FAILED';
      }
      console.error('[geminiService] Ask failed:', errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    return data.answer || '';
  } catch (e: any) {
    console.error('[geminiService] Ask API error:', e);
    throw e;
  }
};
