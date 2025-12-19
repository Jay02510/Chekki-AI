import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";
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

const createFallbackItems = (originalItems: WorksheetItem[]): WorksheetItem[] => {
    return originalItems.map((item, index) => {
        let newQuestion = item.question_text;
        let newAnswer = item.correct_answer;

        if (item.type === 'fill_in' || item.type === 'mcq') {
             newQuestion = `${item.question_text} (Review)`;
        } else {
             newQuestion = `${item.question_text}`;
        }

        return {
            ...item,
            id: 2000 + index, 
            question_text: newQuestion,
            correct_answer: newAnswer, 
            bounding_box: undefined 
        };
    });
};

export const analyzeWorksheet = async (base64Image: string): Promise<WorksheetAnalysis> => {
  console.log("Starting analysis...");
  
  if (!process.env.API_KEY) {
    console.error("API Key is missing from process.env.API_KEY");
    return { 
      items: [], 
      error: "MISSING_KEY", 
      message_ko: "API 키가 설정되지 않았습니다." 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: base64Image } },
          { text: "Analyze the entire image from top to bottom. Identify every single blank space, question, and writing line. Provide a correct example answer for every single item found. Return JSON with bounding boxes." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });
    
    const text = response.text;
    if (!text) throw new Error("Empty response from Gemini");
    
    return JSON.parse(text) as WorksheetAnalysis;

  } catch (error: any) {
    console.error("Direct API Error:", error);
    return { 
      items: [], 
      error: "API_ERROR", 
      message_ko: "AI 분석에 실패했습니다. 이미지와 설정을 확인해주세요." 
    };
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
    if (!process.env.API_KEY) return createFallbackItems(originalItems);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: {
                parts: [{ text: `Original Items JSON: ${JSON.stringify(originalItems)}` }]
            },
            config: {
                systemInstruction: CLONE_SYSTEM_PROMPT,
                responseMimeType: "application/json",
                temperature: 0.7,
            }
        });

        const text = response.text;
        if (!text) throw new Error("Empty response");
        const data = JSON.parse(text) as WorksheetAnalysis;
        return data.items || createFallbackItems(originalItems);
    } catch (e) {
        console.error("Generation error:", e);
        return createFallbackItems(originalItems);
    }
}