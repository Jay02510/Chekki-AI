
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a supportive assistant for Korean parents.

GOAL:
Analyze the worksheet image. Solve ALL visible items (questions, fill-in-the-blanks).

RULES:
1. IDENTIFY ALL: Scan every question on the page.
2. LABELLING: Use the labels/numbers from the page.
3. OUTPUT: Provide the correct answer and a warm, simple Korean explanation ('korean_guide') for the parent.
4. BOXES: Provide 'bounding_box' [ymin, xmin, ymax, xmax] for the answer area.

FORMAT:
{
  "worksheet_summary": { "title_en": "Title", "title_ko": "제목", "overview_ko": "다정한 요약" },
  "items": [
    {
      "id": 1,
      "type": "fill_in",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "text",
      "correct_answer": "answer",
      "korean_guide": "따뜻한 설명",
      "teaching_tip_ko": "팁"
    }
  ]
}
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.API_KEY || process.env.GEMINI_API; 
    
    if (!apiKey) {
      return res.status(500).json({ error: "MISSING_API_KEY" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const { image } = body;
    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    // Using gemini-3-flash-preview for the best speed/quality balance
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Solve this worksheet quickly. Provide JSON output with warm Korean guides for a mom." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    if (!response.text) {
        throw new Error("EMPTY_RESPONSE_FROM_MODEL");
    }

    return res.status(200).json(JSON.parse(response.text));
  } catch (error: any) {
    console.error("[API Error]:", error);
    return res.status(500).json({ 
      error: "ANALYSIS_FAILED", 
      message: error.message || "Unknown error occurred" 
    });
  }
}
