import { WorksheetAnalysis, WorksheetItem } from "../types";

/**
 * Securely calls the Vercel API proxy to analyze the worksheet.
 * This ensures the API_KEY stays hidden on the server.
 */
export const analyzeWorksheet = async (base64Image: string): Promise<WorksheetAnalysis> => {
  console.log("[Chekki] Starting secure analysis via Vercel proxy...");
  
  try {
    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[Chekki] Proxy response error:", response.status, errorData);
      throw new Error(errorData.message || `Server responded with ${response.status}`);
    }
    
    const result = await response.json();
    console.log("[Chekki] Analysis successful.");
    return result as WorksheetAnalysis;

  } catch (error: any) {
    console.error("[Chekki] Critical Analysis Error:", error);
    return { 
      items: [], 
      error: "API_ERROR", 
      message_ko: "서버 연결에 실패했습니다. 인터넷 연결을 확인하고 다시 시도해주세요." 
    };
  }
};

/**
 * Generates similar practice questions based on original worksheet items.
 */
export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
    console.log("[Chekki] Generating practice content...");
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                mode: 'generate_similar',
                items: originalItems 
            }),
        });

        if (!response.ok) throw new Error("Generation failed");
        
        const data = await response.json();
        // The API returns an array or an object with items
        const newItems = Array.isArray(data) ? data : (data.items || []);
        
        return newItems.map((item: any, idx: number) => ({
            ...item,
            id: 10000 + idx // Ensure unique IDs for the practice session
        }));
    } catch (e) {
        console.error("[Chekki] Generation error:", e);
        // Fallback: Just return a copy if AI generation fails during beta
        return originalItems.map((item, idx) => ({
            ...item,
            id: 20000 + idx,
            question_text: `${item.question_text} (Practice)`
        }));
    }
}
