
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `Identify EK (English Kindergarten) worksheet title and primary learning goal. Return JSON: { "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" } }`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents.
Your primary task is to provide a PERFECT ANSWER KEY for the worksheet in the image.

CRITICAL PRIORITIES:
1. ACCURATE ANSWERS: Extract every question and provide the 100% correct answer.
2. BILINGUAL SCRIPTS: For every answer, provide a "Teaching Script" in both Korean and English. This is what the parent should SAY to the child (e.g., "Great job! Can you say 'Apple' like a big boy?").
3. COORDINATES: Provide precise "bounding_box" coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000 so we can overlay the answer directly on the question.

Note: While you should look at the child's handwriting if present, your main goal is to provide the correct answer key so the parent can guide them, regardless of what the child wrote.
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
        required: [
          "id", 
          "type", 
          "question_text", 
          "correct_answer", 
          "korean_guide", 
          "english_guide", 
          "teaching_script_ko",
          "teaching_script_en",
          "bounding_box"
        ]
      }
    }
  }
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { task, image, originalItems } = body;
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
        model: "gemini-3-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } }, 
            { text: "Extract the answer key with coordinates and bilingual scripts for all items." }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT_ITEMS,
          responseMimeType: "application/json",
          responseSchema: ITEM_SCHEMA,
          thinkingConfig: { thinkingBudget: 15000 }
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
