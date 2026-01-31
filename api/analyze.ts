
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `Identify EK (English Kindergarten) worksheet title and primary learning goal. Return JSON: { "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" } }`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents.
Your primary task is to provide a PERFECT FULL ANSWER KEY for the worksheet.

CRITICAL EXTRACTION RULES:
1. FULL ANSWERS ONLY: For MCQ, provide the full text.
2. ACCURATE SEQUENCING: Extract every question.
3. BILINGUAL SCRIPTS: Provide Teaching Scripts in Korean and English.
4. COORDINATES: Normalized 0-1000 bounding_box.
`;

const ITEM_SCHEMA = {
  type: Type.OBJECT,
  properties: {
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
          teaching_tip_ko: { type: Type.STRING },
          teaching_tip_en: { type: Type.STRING },
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
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { task, image, originalItems, userPlan } = body;
    if (!process.env.API_KEY) return res.status(500).json({ error: "API_KEY_MISSING" });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: Generate 3 brand new similar questions for extra practice with bilingual guides.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    const modelToUse = userPlan === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const [summaryResult, itemsResult] = await Promise.all([
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } }, 
            { text: "Identify the worksheet title and goals." }
          ]
        },
        config: { systemInstruction: SYSTEM_PROMPT_SUMMARY, responseMimeType: "application/json" }
      }).then(r => JSON.parse(r.text || "{}")),

      ai.models.generateContent({
        model: modelToUse,
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } }, 
            { text: "Extract the FULL answer key with coordinates and bilingual scripts for all items." }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT_ITEMS,
          responseMimeType: "application/json",
          responseSchema: ITEM_SCHEMA,
          thinkingConfig: { thinkingBudget: userPlan === 'pro' ? 20000 : 0 }
        }
      }).then(r => JSON.parse(r.text || "{}"))
    ]);

    return res.status(200).json({
      worksheet_summary: summaryResult.worksheet_summary,
      items: itemsResult.items || []
    });

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
