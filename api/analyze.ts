
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten. 
Your tone is professional, warm, and highly supportive.

GOAL: Analyze the worksheet image. Solve ALL items and provide a teaching guide for the parent.

RULES:
1. IDENTIFY ALL: Scan every question, tracing line, or matching item.
2. MOM'S SCRIPT (teaching_script_ko): Create a short, natural sentence in Korean that a mother can say to her child to explain the question. Use friendly "Gyeong-eo" (polite) or "Ban-mal" (intimate) suitable for a parent-child bond.
   - Example: "우리 OO야, 여기 'A'는 'Apple'할 때 'A'래. 같이 한번 써볼까?"
3. TEACHING TIP: Focus on Phonics, letter formation, or basic grammar.
4. LABELLING: Use the numbers found on the page.

JSON FORMAT:
{
  "worksheet_summary": {
    "title_en": "Phonics Fun",
    "title_ko": "즐거운 파닉스",
    "overview_ko": "알파벳의 소리와 모양을 익히는 활동이에요."
  },
  "items": [
    {
      "id": 1,
      "type": "tracing",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Trace the letter A",
      "correct_answer": "A",
      "korean_guide": "대문자 A를 선을 따라 그리는 문제예요.",
      "teaching_script_ko": "지우야, 이건 사과할 때 '애' 소리가 나는 'A'야. 위에서 아래로 예쁘게 그려볼까?",
      "teaching_tip_ko": "연필을 쥐는 힘이 부족할 수 있으니 손을 살짝 잡아주세요.",
      "confidence_score": 0.99
    }
  ]
}
`;

const SYSTEM_PROMPT_GENERATE = `
You are a creative educational content creator.
GOAL: Based on provided questions, generate 3-5 high-quality similar practice questions for an English Kindergarten student.
FORMAT: Return a JSON array of items following the WorksheetItem structure.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const apiKey = process.env.API_KEY; 
    
    if (!apiKey) {
      console.error("[Backend Error]: API_KEY environment variable is missing.");
      return res.status(500).json({ error: "ANALYSIS_FAILED" });
    }

    const ai = new GoogleGenAI({ apiKey });
    const { task, image, isRetry, originalItems } = body;

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ text: `Original items: ${JSON.stringify(originalItems)}. Create 3-5 similar ones for a Kindergarten child.` }],
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    const model = isRetry ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: model,
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Analyze this worksheet thoroughly. Solve everything and provide teaching scripts for a Korean mom." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_ANALYZE,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return res.status(200).json(JSON.parse(response.text));

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
