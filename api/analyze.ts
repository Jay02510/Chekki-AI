
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents.
Analyze the provided worksheet image and return a consolidated JSON object.

TASK 1: SUMMARY
Identify the worksheet title (English & Korean) and a brief overview of the learning goal in Korean.

TASK 2: FULL ANSWER KEY
Extract every question with its coordinates (normalized 0-1000) and provide the correct pedagogical answer.
Provide a "Teaching Script" in both Korean and English that a parent can read to their child.

RULES:
1. Output MUST be valid JSON.
2. Coordinates must be accurate for overlay placement.
3. Teaching scripts should be encouraging and warm.
`;

const CONSOLIDATED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    worksheet_summary: {
      type: Type.OBJECT,
      properties: {
        title_en: { type: Type.STRING },
        title_ko: { type: Type.STRING },
        overview_ko: { type: Type.STRING }
      },
      required: ["title_en", "title_ko", "overview_ko"]
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING },
          question_text: { type: Type.STRING },
          correct_answer: { type: Type.STRING },
          korean_guide: { type: Type.STRING },
          english_guide: { type: Type.STRING },
          teaching_script_ko: { type: Type.STRING },
          teaching_script_en: { type: Type.STRING },
          bounding_box: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER }
            },
            required: ["ymin", "xmin", "ymax", "xmax"]
          }
        },
        required: ["id", "type", "question_text", "correct_answer", "korean_guide", "english_guide", "teaching_script_ko", "teaching_script_en", "bounding_box"]
      }
    }
  },
  required: ["worksheet_summary", "items"]
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { task, image, originalItems, userPlan } = body;
    if (!process.env.API_KEY) return res.status(500).json({ error: "API_KEY_MISSING" });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Handle Practice Sheet Generation
    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: Generate 3 brand new similar questions for extra practice with bilingual guides.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    // MODEL ROUTING: Speed for Free, Reasoning for Pro
    const modelToUse = userPlan === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    // SINGLE PASS INFERENCE: Much faster than concurrent calls
    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } }, 
          { text: "Analyze this worksheet for summary and answer key." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: CONSOLIDATED_SCHEMA,
        // Only use thinking budget for Pro users to maintain high speed for free tier
        thinkingConfig: { thinkingBudget: userPlan === 'pro' ? 15000 : 0 }
      }
    });

    const result = JSON.parse(response.text || "{}");

    return res.status(200).json({
      worksheet_summary: result.worksheet_summary,
      items: result.items || []
    });

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
