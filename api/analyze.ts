
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a masters-level educator for English Kindergarten (EK).
Tone: Warm, encouraging, concise.

GOAL: Extract worksheet items, solve them, and provide high-quality bilingual guides.

CRITICAL SPEED RULE:
- Be concise. Avoid filler text.
- Respond in strictly valid JSON.

EK PEDAGOGICAL RULES:
- PHONICS: Highlight specific letter sounds (e.g., "The /b/ sound in 'Bear'").
- MOM'S SCRIPT: Short, natural Korean phrases for parents to read.

FORMATTING:
- ID: Numeric.
- TEXT: No prefixes like "Q:".
- MCQ: Include label and text (e.g., "A. Blue").

JSON SCHEMA:
{
  "worksheet_summary": { "title_en": "string", "title_ko": "string", "overview_ko": "string" },
  "items": [{
    "id": number,
    "type": "fill_in|matching|coloring|tracing|mcq|other",
    "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
    "question_text": "string",
    "correct_answer": "string",
    "korean_guide": "string",
    "english_guide": "string",
    "teaching_script_ko": "string",
    "teaching_tip_ko": "string",
    "confidence_score": number
  }]
}
`;

const SYSTEM_PROMPT_GENERATE = `
EK curriculum designer. Create 3-5 similar practice items. Return JSON array.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!process.env.API_KEY) return res.status(500).json({ error: "ANALYSIS_FAILED" });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { task, image, isRetry, originalItems } = body;

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 3-5 similar questions.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 } // Speed-oriented generation
        },
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    
    // Model strategy: Flash for instant results, Pro for complex retry reasoning
    const modelName = isRetry ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: "Solve this EK worksheet concisely." },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_ANALYZE,
        responseMimeType: "application/json",
        temperature: 0, 
        // Optimization: Disable thinking on first attempt for speed, let model decide on retry
        ...(isRetry ? {} : { thinkingConfig: { thinkingBudget: 0 } })
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return res.status(200).json(JSON.parse(response.text));

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
