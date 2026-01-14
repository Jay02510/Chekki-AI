
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
 * SPEED OPTIMIZATION: Fire 4 parallel threads for micro-generation.
 * This spreads the compute load and returns the full set much faster.
 */
export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
  try {
    // Fire 4 concurrent promises for 1-2 items each
    const promises = [1, 2, 3, 4].map(() => 
      fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          task: 'generate',
          originalItems: originalItems.slice(0, 5) 
        })
      }).then(res => res.ok ? res.json() : [])
    );

    const results = await Promise.all(promises);
    
    const allItems = results.flat().map((item, idx) => ({
      ...item,
      id: idx + 1
    }));

    return allItems.length > 0 ? allItems : originalItems;
  } catch (e) {
    console.error("[Chekki Service] Generation failed:", e);
    return originalItems;
  }
};
