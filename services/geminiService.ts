
import { WorksheetAnalysis, WorksheetItem } from "../types";
import { Capacitor } from '@capacitor/core';
import { auth } from "./database";

export const analyzeWorksheet = async (
  base64Image: string,
  signal?: AbortSignal,
  userPlan: string = 'free'
): Promise<WorksheetAnalysis> => {
  const isNative = Capacitor.isNativePlatform();
  const baseUrl = isNative ? 'https://chekki-ai.vercel.app' : '';

  try {
    const idToken = await auth.currentUser?.getIdToken();

    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => timeoutController.abort(), 60000);
    const activeSignal = signal || timeoutController.signal;

    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
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
    throw error;
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[], signal?: AbortSignal): Promise<WorksheetItem[]> => {
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
