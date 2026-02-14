
import { WorksheetAnalysis, WorksheetItem } from "../types";

/**
 * All requests are routed through the Vercel backend.
 * Support for AbortController signals to prevent stale updates.
 */
export const analyzeWorksheet = async (
  base64Image: string, 
  signal?: AbortSignal, 
  userPlan: string = 'free'
): Promise<WorksheetAnalysis> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal,
      body: JSON.stringify({ 
        task: 'analyze',
        image: base64Image,
        userPlan
      })
    });

    if (!response.ok) {
      if (response.statusText === 'AbortError') throw new Error("ABORTED");
      throw new Error("BACKEND_FAILED");
    }
    return await response.json();
  } catch (error: any) {
    if (error.name === 'AbortError') throw error;
    console.error(`[Chekki Service] Analysis failed:`, error.message);
    throw new Error("ANALYSIS_FAILED");
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[], signal?: AbortSignal): Promise<WorksheetItem[]> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
    console.error("[Chekki Service] Generation failed:", e);
    return originalItems;
  }
};
