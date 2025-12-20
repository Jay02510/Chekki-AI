
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents.

TASK:
Analyze the provided worksheet image. There are 4 questions visible (Numbered 5, 6, 7, and 8).

OUTPUT REQUIREMENTS:
1. QUESTION NUMBERS: Use the exact numbers on the page (5, 6, 7, 8).
2. FULL ANSWER TEXT (CRITICAL): For the 'correct_answer' field, do NOT just put the letter. You MUST put the letter and the full sentence (e.g., "B. A squirrel stole one"). This is for a text-to-speech engine to read back to a child.
3. BOUNDING BOXES: Provide accurate coordinates [ymin, xmin, ymax, xmax] as integers (0-1000) for where the answer sticker should appear on the worksheet.
4. LANGUAGE: Provide 'korean_guide' and 'teaching_tip_ko' in warm, encouraging Korean.

JSON STRUCTURE:
{
  "worksheet_summary": {
    "title_en": "Gary's Juggling Act",
    "title_ko": "게리의 저글링 쇼",
    "overview_ko": "게리의 저글링 이야기와 관련된 이해도 확인 문제입니다.",
    "total_score": 100
  },
  "items": [
    {
      "id": 5,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Why did Gary stop juggling the apples?",
      "correct_answer": "B. A squirrel stole one",
      "korean_guide": "다람쥐가 사과 하나를 훔쳐가서 저글링을 멈추게 되었어요.",
      "teaching_tip_ko": "아이가 'stole'이라는 단어를 모른다면 '훔치다'의 과거형이라고 설명해주세요."
    }
  ]
}
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.GEMINI_API || process.env.API_KEY; 
    
    if (!apiKey) {
      return res.status(500).json({ error: "API_KEY_MISSING", message: "Server API Key is not configured." });
    }

    const ai = new GoogleGenAI({ apiKey });

    const { image } = body;
    if (!image) {
      return res.status(400).json({ error: "NO_IMAGE", message: "No image data provided" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Identify questions 5, 6, 7, and 8. For each, give the full correct answer string (Letter + Text)." },
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
    console.error("[Chekki API] Error:", error);
    return res.status(500).json({ error: "ANALYSIS_FAILED", message: error.message });
  }
}
