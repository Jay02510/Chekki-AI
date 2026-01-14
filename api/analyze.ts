
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `Identify EK worksheet title and goal. Return JSON: { "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" } }`;
const SYSTEM_PROMPT_ITEMS = `Extract all exercises/words. RULES: 1. FULL TEXT answers. 2. Precise boxes (0-1000). 3. Identify vocab words as items if no numbers.`;

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
          bounding_box: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER }
            }
          },
          question_text: { type: Type.STRING },
          correct_answer: { type: Type.STRING },
          korean_guide: { type: Type.STRING },
          teaching_script_ko: { type: Type.STRING },
          teaching_tip_ko: { type: Type.STRING }
        },
        required: ["id", "type", "bounding_box", "question_text", "correct_answer"]
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

    // Handle Practice Generation (Flash is enough)
    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 2-3 unique questions.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    // HYBRID PARALLEL EXECUTION (Server-Side)
    // We run both tasks at once on the server to save client-side round trips.
    const [summaryResult, itemsResult] = await Promise.all([
      // Task 1: Summary (Fast Flash Model)
      ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Summary." }],
        config: { systemInstruction: SYSTEM_PROMPT_SUMMARY, responseMimeType: "application/json" }
      }).then(r => JSON.parse(r.text || "{}")),

      // Task 2: Item Extraction (Pro Model with Optimized Thinking)
      ai.models.generateContent({
        model: "gemini-3-pro-preview",
        contents: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Extract items." }],
        config: {
          systemInstruction: SYSTEM_PROMPT_ITEMS,
          responseMimeType: "application/json",
          responseSchema: ITEM_SCHEMA,
          thinkingConfig: { thinkingBudget: 10000 } // Optimized budget for speed
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
