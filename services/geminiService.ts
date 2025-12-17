
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT, MOCK_DATA } from "../constants";
import { WorksheetAnalysis, WorksheetItem } from "../types";

const CLONE_SYSTEM_PROMPT = `
You are an expert educational content generator.
Your task is to take an existing list of worksheet items (questions/answers) and generate a "Practice Set" with NEW content that tests the exact same skills but with different words/numbers.

RULES:
1. Maintain the same "ItemType" for each item.
2. If the original was "A is for Apple", the new one should be "A is for Ant" or "B is for Bear" (keep difficulty similar).
3. If the original was "1 + 1 = 2", the new one could be "2 + 3 = 5".
4. Return exactly the same number of items.
5. JSON Output must match the WorksheetAnalysis structure (items array).
6. Do NOT return bounding_box (set to null) as this is a digital worksheet.
`;

// Helper for deterministic cloning (fallback mechanism)
// This ensures the user NEVER sees a blank screen if the AI fails.
const createFallbackItems = (originalItems: WorksheetItem[]): WorksheetItem[] => {
    return originalItems.map((item, index) => {
        let newQuestion = item.question_text;
        let newAnswer = item.correct_answer;

        // Simple heuristics to vary the content slightly
        if (item.type === 'fill_in' || item.type === 'mcq') {
             newQuestion = `${item.question_text} (Review)`;
        } else {
             newQuestion = `${item.question_text}`;
        }

        return {
            ...item,
            id: 2000 + index, // New ID range
            question_text: newQuestion,
            correct_answer: newAnswer, // Keep answer for practice key, or could blank it out
            bounding_box: undefined // Clear box for print layout
        };
    });
};

export const analyzeWorksheet = async (base64Image: string): Promise<WorksheetAnalysis> => {
  console.log("Starting analysis...");

  // 1. FASTEST PATH: Direct Client-Side Key
  const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;

  if (apiKey) {
    console.log("Client API Key found. Executing direct analysis...");
    try {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Analyze the entire image from top to bottom. Identify every single blank space, question, and writing line. Provide a correct example answer for every single item found. Return JSON with bounding boxes." },
          ],
        },
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: "application/json",
          temperature: 0.2, 
        },
      });
      
      const text = response.text;
      if (!text) throw new Error("Empty response from Gemini");
      
      console.log("Analysis successful.");
      return JSON.parse(text) as WorksheetAnalysis;

    } catch (error) {
      console.error("Direct API Error:", error);
      // In production, we return an error state so the UI can prompt a retry
      return { 
        ...MOCK_DATA, // Type safety filler
        items: [], // Clear items to prevent showing mock data
        error: "API_ERROR", 
        message_ko: "AI 분석에 실패했습니다. (API Key Error - Please check settings)" 
      };
    }
  }

  // 2. PRODUCTION PATH: Backend Proxy (Vercel)
  console.log("No local API Key. Attempting Backend Proxy...");
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s Timeout for heavier images

    const response = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64Image }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      return data as WorksheetAnalysis;
    } else {
       throw new Error(`Server responded with ${response.status}`);
    }
  } catch (err) {
    console.warn("Backend proxy unavailable or timed out.", err);
    return {
        ...MOCK_DATA,
        items: [],
        error: "CONNECTION_ERROR",
        message_ko: "서버 연결에 실패했습니다. 인터넷 연결을 확인하거나 다시 시도해주세요."
    };
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
    const apiKey = process.env.API_KEY || (import.meta as any).env?.VITE_API_KEY;
    
    // If no key, immediately fallback to algorithmic generation
    if (!apiKey) {
        return createFallbackItems(originalItems);
    }

    try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [{ text: `Original Items JSON: ${JSON.stringify(originalItems)}` }]
            },
            config: {
                systemInstruction: CLONE_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                temperature: 0.7, // Higher temp for creativity
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        const data = JSON.parse(text) as WorksheetAnalysis;
        
        // Validation: If AI returned empty items, use fallback
        if (!data.items || data.items.length === 0) {
            throw new Error("AI returned no items");
        }
        
        return data.items;
    } catch (e) {
        console.error("Clone failed, using fallback strategy", e);
        // Robust Fallback: Never show a blank screen
        return createFallbackItems(originalItems);
    }
}
