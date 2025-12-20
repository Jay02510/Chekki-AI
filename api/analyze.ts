
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a warm and supportive assistant for Korean moms.

PRIMARY GOAL:
Analyze the worksheet and provide the correct answers for questions 5, 6, 7, and 8.

TONE & STYLE:
1. BE WARM & ENCOURAGING: Write like a kind senior teacher or a supportive fellow mom. Avoid robotic, stiff, or overly formal academic language.
2. USE FRIENDLY KOREAN: Use soft endings like "-에요/아요" instead of stiff "-습니다". 
3. BE CLEAR: The parent should feel confident explaining this to their child after reading your guide.

EXPERT ANSWER KEY RULES:
1. QUESTION IDENTIFICATION: Use the exact numbers (5, 6, 7, 8) from the page.
2. ACCURATE SOLVING: Provide the letter AND the full text of the choice (e.g., "B. A squirrel stole one").
3. SUPPORTIVE EXPLANATION: In 'korean_guide', explain the reason warmly. E.g., "우리 아이에게 '다람쥐가 사과를 훔쳐가서 게리가 멈췄단다'라고 다정하게 설명해 주세요."
4. SPATIAL MAPPING: Ensure the 'bounding_box' is centered over the correct choice text.

JSON STRUCTURE:
{
  "worksheet_summary": {
    "title_en": "Gary's Juggling Act",
    "title_ko": "게리의 저글링 쇼",
    "overview_ko": "부모님, 오늘 숙제도 채키와 함께 다정하게 확인해 보세요!",
    "total_score": 100
  },
  "items": [
    {
      "id": 5,
      "type": "mcq",
      "bounding_box": { "ymin": 420, "xmin": 50, "ymax": 460, "xmax": 350 },
      "question_text": "Why did Gary stop juggling the apples?",
      "correct_answer": "B. A squirrel stole one",
      "korean_guide": "이야기 본문을 보면 다람쥐(squirrel)가 사과를 쏙 훔쳐가서(stole) 게리가 당황해 멈췄다고 나와 있어요. 아이에게 '귀여운 다람쥐가 범인이었네!'라고 얘기해 주시면 어떨까요?",
      "teaching_tip_ko": "stole은 '훔치다'라는 steal의 과거형이라는 것도 살짝 짚어주시면 좋아요."
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
            { text: "Solve questions 5, 6, 7, and 8 accurately. Provide a warm and friendly coaching guide for the mom in Korean." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.2, 
      },
    });

    return res.status(200).json(JSON.parse(response.text || '{}'));
  } catch (error: any) {
    return res.status(500).json({ error: "ANALYSIS_FAILED", message: error.message });
  }
}
