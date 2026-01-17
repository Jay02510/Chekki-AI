
import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `Identify EK (English Kindergarten) worksheet title and primary learning goal. Return JSON: { "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" } }`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI", a high-fidelity educational assistant.
Rigorously extract all items/exercises from the image.

For each item, you MUST provide:
1. FULL TEXT answers (e.g., "B. Apple" not just "B").
2. Precise coordinates (bounding_box 0-1000).
3. A "Teaching Script" (엄마의 한마디): A warm, encouraging sentence for a parent to say to their child in Korean.
4. A "Korean Guide": An explanation of the grammar/vocab rule in Korean.
5. An "English Guide": A clear, step-by-step explanation of the solution in English.
6. A "Teaching Tip": A pedagogical tip for parents in both languages.
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
          english_guide: { type: Type.STRING },
          teaching_script_ko: { type: Type.STRING },
          teaching_tip_ko: { type: Type.STRING },
          teaching_tip_en: { type: Type.STRING }
        },
        required: [
          "id", 
          "type", 
          "bounding_box", 
          "question_text", 
          "correct_answer", 
          "korean_guide", 
          "english_guide", 
          "teaching_script_ko"
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

    // Correct initialization using named parameter as per @google/genai guidelines
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 2-3 unique questions with guides.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      // Extracting generated text using the .text property (not a method)
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    // Using the recommended Content structure { parts: [...] } for multimodal generation content
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
            { text: "Perform rigorous extraction of all questions including detailed teaching guides in both English and Korean." }
          ]
        },
        config: {
          systemInstruction: SYSTEM_PROMPT_ITEMS,
          responseMimeType: "application/json",
          responseSchema: ITEM_SCHEMA,
          thinkingConfig: { thinkingBudget: 12000 }
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
