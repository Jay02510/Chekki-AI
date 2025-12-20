
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten. 
Your tone is professional, warm, and highly supportive.

GOAL: Analyze the worksheet image. Solve ALL items and provide a teaching guide for the parent.

STRICT RULES FOR NUMBERING:
- Use the EXACT question number found on the page for the 'id' field (e.g., 1, 2, 3).
- DO NOT include the question number or dots (e.g., "1. ") inside the 'question_text' or 'correct_answer' strings. 
- Example: "id": 5, "question_text": "Is it a cat?" (Correct). "id": 5, "question_text": "5. Is it a cat?" (Incorrect).

STRICT RULES FOR MCQ (Multiple Choice Questions):
- The 'correct_answer' MUST include the choice label AND the full text of that choice.
- Example: "A. The big blue dog" (NOT just "A").
- This is critical for the parent to read the answer aloud without looking at the original image.

GENERAL RULES:
1. IDENTIFY ALL: Scan every question, tracing line, or matching item.
2. MOM'S SCRIPT (teaching_script_ko): Create a short, natural sentence in Korean that a mother can say to her child to explain the question.
3. TEACHING TIP: Focus on Phonics, letter formation, or basic grammar.

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
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "What color is the sun?",
      "correct_answer": "B. Yellow",
      "korean_guide": "태양의 색깔을 묻는 질문이에요.",
      "teaching_script_ko": "지우야, 하늘에 떠 있는 해님은 무슨 색깔일까? 노란색은 영어로 'Yellow'라고 한단다!",
      "teaching_tip_ko": "색깔 단어를 반복해서 들려주세요.",
      "confidence_score": 0.99
    }
  ]
}
`;

const SYSTEM_PROMPT_GENERATE = `
You are a creative educational content creator.
GOAL: Based on provided questions, generate 3-5 high-quality similar practice questions for an English Kindergarten student.
FORMAT: Return a JSON array of items following the WorksheetItem structure.
NUMBERING RULE: Use sequential integers for 'id'. Do not put numbers in question_text.
MCQ RULE: Always provide the full choice text in the correct_answer field (e.g. "C. Elephant").
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
