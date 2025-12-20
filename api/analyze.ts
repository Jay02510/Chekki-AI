
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents.

TASK:
Analyze the provided worksheet image focusing on questions 5, 6, 7, and 8.

OUTPUT REQUIREMENTS:
1. QUESTION NUMBERS: Use the exact numbers (5, 6, 7, 8).
2. FULL ANSWERS (CRITICAL): Provide the letter AND the full answer text (e.g., "B. A squirrel stole one"). 
3. BOUNDING BOXES: Provide coordinates [ymin, xmin, ymax, xmax] as integers (0-1000). The box should be large enough to contain the correct choice text.
4. KOREAN GUIDES: Warm, encouraging explanations in Korean for parents.

JSON STRUCTURE:
{
  "worksheet_summary": {
    "title_en": "Reading Comprehension",
    "title_ko": "독해 문제 확인",
    "overview_ko": "게리의 저글링 이야기와 관련된 5~8번 문제입니다.",
    "total_score": 100
  },
  "items": [
    {
      "id": 5,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "...",
      "correct_answer": "B. A squirrel stole one",
      "korean_guide": "...",
      "teaching_tip_ko": "..."
    }
  ]
}
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.GEMINI_API || process.env.API_KEY; 
    const ai = new GoogleGenAI({ apiKey });

    const { image } = body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Analyze questions 5, 6, 7, and 8. Place the bounding boxes exactly over the correct options. Ensure the correct_answer field includes both the letter and text." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    return res.status(500).json({ error: "ANALYSIS_FAILED", message: error.message });
  }
}
