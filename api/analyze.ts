
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `Identify EK (English Kindergarten) worksheet title and primary learning goal. Return JSON: { "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" } }`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents.
Extract all questions and answers from the provided image.

CRITICAL: For every item, you MUST provide precise "bounding_box" coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000.
Linguistic Rule: Provide ALL guides and scripts in BOTH Korean and English.

For each item:
1. "question_text": The question as it appears.
2. "correct_answer": The full text answer.
3. "teaching_script_ko": Encouraging words for the parent in Korean.
4. "teaching_script_en": Encouraging words for the parent in English.
5. "korean_guide": Rule explanation in Korean.
6. "english_guide": Rule explanation in English.
7. "bounding_box": Precise coordinates for overlay.
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
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 2-3 unique questions with guides.`,
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
            { text: "Provide worksheet summary." }
          ]
        },
        config: { systemInstruction: SYSTEM_PROMPT_SUMMARY, responseMimeType: "application/json" }
      }).then(r => JSON.parse(r.text || "{}")),

      ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: {
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } }, 
            { text: "Extract all items with coordinates and bilingual scripts." }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT_ITEMS,
          responseMimeType: "application/json",
          responseSchema: ITEM_SCHEMA,
          thinkingConfig: { thinkingBudget: 10000 }
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
