
import { WorksheetAnalysis, WorksheetItem } from "../types";
import { Capacitor } from '@capacitor/core';
import { auth } from "./database";
import { API_BASE_URL, MOCK_MODE, MOCK_DELAY } from "../config";

export const analyzeWorksheet = async (
  base64Image: string,
  signal?: AbortSignal,
  userPlan: string = 'free'
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
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) {
      console.warn("[geminiService] No ID token found - might be guest or login issue.");
    }

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 60000);
    const activeSignal = signal || timeoutController.signal;

    console.log(`[geminiService] Fetching: ${baseUrl}/api/analyze (Auth: ${!!idToken})`);

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
        userPlan
      })
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(text);
      } catch (e) {
        // Not JSON, return raw first 100 chars
        errorData = { error: `HTTP_${response.status}: ${text.substring(0, 100)}` };
      }
      throw new Error(errorData.error || "BACKEND_FAILED");
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;

    // Detailed logging for native/simulator debugging
    console.error("[geminiService] API Call Failed:", {
      message: error.message,
      baseUrl,
      online: navigator.onLine,
      stack: error.stack
    });

    if (!navigator.onLine) {
      throw new Error("OFFLINE_ERROR");
    }

    if (error.message === 'Failed to fetch' || error.message.includes('Load failed')) {
      throw new Error(`NETWORK_ERROR: ${error.message}${Capacitor.isNativePlatform() ? ' (Check simulator connectivity/URL)' : ''}`);
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
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
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
