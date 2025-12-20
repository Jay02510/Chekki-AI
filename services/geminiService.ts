
import { GoogleGenAI } from "@google/genai";
import { WorksheetAnalysis, WorksheetItem } from "../types";
import { SYSTEM_PROMPT } from "../constants";

/**
 * Direct client-side SDK call with Tiered Fallback Logic.
 * 1st Attempt: 'gemini-flash-lite-latest' (Fastest)
 * Retry Attempt: 'gemini-3-flash-preview' (Most Intelligent)
 */
export const analyzeWorksheet = async (base64Image: string, isRetry = false): Promise<WorksheetAnalysis> => {
  console.log(`[Chekki] Starting direct analysis (isRetry: ${isRetry})...`);
  
  // Robust API key retrieval for various environments
  const apiKey = process.env.API_KEY || (window as any).API_KEY;
  
  if (!apiKey) {
    console.error("[Chekki] API Key check failed. Environment:", process.env);
    throw new Error("API Key is missing. Please check your environment variables.");
  }

  const ai = new GoogleGenAI({ apiKey });
  // Fallback Logic: Lite first, then upgrade to the more powerful 3 Flash on retry
  const modelName = isRetry ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';
  
  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: base64Image } },
            { text: "Analyze this worksheet with 100% thoroughness. Solve every single question. Return ONLY JSON." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text;
    if (!text) throw new Error("EMPTY_RESPONSE");

    const result = JSON.parse(text);
    console.log("[Chekki] Analysis successful with model:", modelName);
    return result as WorksheetAnalysis;

  } catch (error: any) {
    console.error(`[Chekki] Error with ${modelName}:`, error);
    // If it fails with "Entity not found", it might be an invalid API key or model availability issue
    if (error.message?.includes("not found")) {
        throw new Error("Model or API configuration error. Please try again later.");
    }
    throw error;
  }
};

export const generateSimilarWorksheet = async (originalItems: WorksheetItem[]): Promise<WorksheetItem[]> => {
  const apiKey = process.env.API_KEY || (window as any).API_KEY;
  if (!apiKey) return originalItems;
  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { text: `Based on these questions: ${JSON.stringify(originalItems)}, generate 3-5 similar practice questions for a child. Return as JSON array of items.` },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      },
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return originalItems;
  }
};
