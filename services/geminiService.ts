
import { WorksheetAnalysis, WorksheetItem } from "../types";

/**
 * All requests are routed through the Vercel backend.
 */
export const analyzeWorksheet = async (base64Image: string, isRetry = false): Promise<WorksheetAnalysis> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        task: 'analyze',
        image: base64Image,
        isRetry: isRetry
      })
    });

    if (!response.ok) throw new Error("BACKEND_FAILED");
    return await response.json();
  } catch (error: any) {
    console.error(`[Chekki Service] Analysis failed:`, error.message);
    throw new Error("ANALYSIS_FAILED");
  }
};

/**
 * REVERTED: Now uses a single robust generation request.
 */
export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
  } catch (e) {
    console.error("[Chekki Service] Generation failed:", e);
    return originalItems;
  }
};
