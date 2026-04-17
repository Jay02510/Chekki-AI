
import { WorksheetAnalysis, WorksheetItem } from "../types";
import { Capacitor } from '@capacitor/core';
import { auth } from "./database";
import { API_BASE_URL, MOCK_MODE, MOCK_DELAY } from "../config";

const getValidIdToken = async (maxRetries = 3): Promise<string | null> => {
  const user = auth.currentUser;
  if (user) {
    try {
      return await user.getIdToken();
    } catch (e) {
      console.warn("[geminiService] Direct token retrieval failed:", e);
    }
  }

  // If no user or direct retrieval failed, wait a bit for auth to initialize
  for (let i = 0; i < maxRetries; i++) {
    const activeUser = auth.currentUser;
    if (activeUser) {
      try {
        const token = await activeUser.getIdToken();
        if (token) return token;
      } catch (e) { console.error("Token retry error:", e); }
    }
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  return null;
};

export const analyzeWorksheet = async (
  base64Image: string,
  signal?: AbortSignal,
  userPlan: string = 'free',
  childAge?: string,
  childEnglishLevel?: string,
  parentEnglishLevel?: string
): Promise<WorksheetAnalysis> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
      worksheet_summary: {
        title_en: "Practice Worksheet: Multiplication",
        title_ko: "연습 학습지: 곱셈",
        overview_ko: "이 학습지는 기본적인 곱셈 개념을 복습하기 위한 것입니다."
      },
      items: [
        {
          id: 1,
          type: 'text',
          question_text: "What is 7 x 8?",
          correct_answer: "56",
          korean_guide: "7 x 8은 얼마인가요? 7에 8을 곱하면 56이 됩니다.",
          teaching_script_ko: "7 곱하기 8은 56입니다.",
          student_response: "56",
          is_correct: true
        },
        {
          id: 2,
          type: 'text',
          question_text: "What is 6 x 9?",
          correct_answer: "54",
          korean_guide: "6 x 9는 얼마인가요? 6에 9를 곱하면 54가 됩니다.",
          teaching_script_ko: "6 곱하기 9는 54입니다.",
          student_response: "52",
          is_correct: false
        }
      ]
    };
  }

  const baseUrl = API_BASE_URL;

  try {
    // Start getting token and checking network in parallel
    const idTokenPromise = getValidIdToken();

    const idToken = await idTokenPromise;
    if (!idToken) {
      console.warn("[geminiService] ⚠️ No auth token — proceeding as guest. API will likely reject with UNAUTHORIZED.");
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 300000);
    const activeSignal = signal || timeoutController.signal;

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : ''
      },
      signal: activeSignal,
      body: JSON.stringify({
        task: 'analyze',
        image: base64Image,
        userPlan,
        childAge,
        childEnglishLevel,
        parentEnglishLevel
      })
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
        ? `${errorData.error || "BACKEND_FAILED"}: ${errorData.details}`
        : (errorData.error || "BACKEND_FAILED");
      console.error("[geminiService] Backend error response:", errorData);
      throw new Error(detailedMsg);
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;

    console.error("[geminiService] API Call Failed:", error.message);

    if (!navigator.onLine) {
      throw new Error("OFFLINE_ERROR");
    }

    if (error.message === 'Failed to fetch' || error.message.includes('Load failed')) {
      throw new Error(`NETWORK_ERROR: Check connectivity to ${baseUrl}`);
    }

    throw error;
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[], signal?: AbortSignal): Promise<WorksheetItem[]> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return originalItems.map(item => ({
      ...item,
      question_text: `[New Version] ${item.question_text}`,
      korean_guide: `[새 버전] ${item.korean_guide}`,
      student_response: undefined,
      is_correct: undefined
    }));
  }
  try {
    const idToken = await getValidIdToken();
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : ''
      },
      signal,
      body: JSON.stringify({
        task: 'generate',
        originalItems: originalItems.slice(0, 5)
      })
    });

    if (!response.ok) throw new Error("GEN_FAILED");
    const newItems = await response.json();

    return newItems.map((item: any, idx: number) => ({
      ...item,
      id: idx + 1
    }));
  } catch (e: any) {
    if (e.name === 'AbortError') throw e;
    return originalItems;
  }
};

export const refineWorksheetItem = async (item: WorksheetItem, reason: string): Promise<Partial<WorksheetItem>> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return {
      korean_guide: `[다듬어짐] ${item.korean_guide} (이유: ${reason})`,
      english_guide: `[Refined] ${item.english_guide} (Reason: ${reason})`,
      teaching_script_ko: `[다듬어짐] ${item.teaching_script_ko}`,
      teaching_script_en: `[Refined] ${item.teaching_script_en}`
    };
  }

  try {
    const idToken = await getValidIdToken();
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : ''
      },
      body: JSON.stringify({
        task: 'refine',
        itemToRefine: item,
        reason: reason
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[geminiService] Refine failed:", errText);
      throw new Error("REFINE_FAILED");
    }

    const refinedData = await response.json();
    return refinedData;
  } catch (e: any) {
    console.error("[geminiService] Refine API error:", e);
    throw e;
  }
};

export const askChekkiQuestion = async (question: string, isGuest: boolean = false, signal?: AbortSignal): Promise<string> => {
  if (MOCK_MODE) {
    await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
    return isGuest 
      ? "This is a basic answer. 'A' is used before consonants, and 'an' before vowels."
      : "This is a detailed answer. 'A' is used before words starting with a consonant, and 'an' is used before words starting with a vowel. For example, 'A dog' vs 'An apple'.";
  }

  try {
    const idToken = await getValidIdToken();
    const response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': idToken ? `Bearer ${idToken}` : ''
      },
      signal,
      body: JSON.stringify({
        task: 'ask_question',
        question: question,
        isGuest: isGuest
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("[geminiService] Ask failed:", errText);
      throw new Error("ASK_FAILED");
    }

    const data = await response.json();
    return data.answer || "";
  } catch (e: any) {
    console.error("[geminiService] Ask API error:", e);
    throw e;
  }
};
