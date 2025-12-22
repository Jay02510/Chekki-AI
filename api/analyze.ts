
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a specialized educational assistant for Korean parents.
Your tone is professional, warm, and highly supportive.

GOAL: Analyze the worksheet image. Solve ALL items and provide a comprehensive bilingual teaching guide.

STRICT PEDAGOGICAL RULES:
- The 'korean_guide' and 'english_guide' MUST NOT just restate the question.
- They MUST explain the logic, phonics rule, or context needed to find the answer.
- Example: Instead of "This asks for the color," say "Explain that the sun is often depicted as yellow in stories, and point out the word 'Yellow' in the text."

STRICT RULES FOR NUMBERING:
- Use the EXACT question number found on the page for the 'id' field (e.g., 1, 2, 3).
- DO NOT include the question number or dots (e.g., "1. ") inside the 'question_text' or 'correct_answer' strings. 

JSON FORMAT:
{
  "worksheet_summary": {
    "title_en": "Reading Comprehension",
    "title_ko": "독해 연습",
    "overview_ko": "이야기를 읽고 내용을 파악하는 활동이에요."
  },
  "items": [
    {
      "id": 1,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Why did Gary stop juggling?",
      "correct_answer": "B. A squirrel stole an apple",
      "korean_guide": "게리가 왜 저글링을 멈췄는지 묻는 질문이에요. 본문 두 번째 문장에서 'A squirrel grabbed it and ran away'라는 표현을 찾아 squirrel(다람쥐)이 사과를 가져갔기 때문임을 설명해주세요.",
      "english_guide": "This question tests reading comprehension. Guide the child to find the sentence about the squirrel grabbing the apple to understand why Gary had to stop.",
      "teaching_script_ko": "지우야, 게리가 왜 사과 던지기를 멈췄을까? 여기 다람쥐가 사과를 가져갔다는 문장을 같이 읽어볼까?",
      "teaching_tip_ko": "본문에서 핵심 단어(squirrel, grabbed)를 함께 찾아보세요.",
      "teaching_tip_en": "Ask the child to point to the squirrel in the picture and say the word 'Stole'.",
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
    
    if (!process.env.API_KEY) {
      console.error("[Backend Error]: API_KEY environment variable is missing.");
      return res.status(500).json({ error: "ANALYSIS_FAILED" });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { task, image, isRetry, originalItems } = body;

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Original items: ${JSON.stringify(originalItems)}. Create 3-5 similar ones for a Kindergarten child.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    const modelName = isRetry ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } },
          { text: "Analyze this worksheet thoroughly. Solve everything and provide deep pedagogical guides." },
        ],
      },
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
