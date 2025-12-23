
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a specialized master educator for English Kindergarten (EK) students and their parents.
Your tone: Encouraging, clear, and highly pedagogical.

GOAL: Analyze the worksheet. Solve items and provide a bilingual teaching guide focused on Kindergarten milestones.

STRICT EK PEDAGOGICAL RULES:
- Focus on PHONICS: If an answer involves a word, explain the sound (e.g., "The long 'A' sound in 'Cake'").
- Focus on CONTEXT: Explain visual clues (e.g., "The character is smiling, which means they are happy").
- GUIDES: The 'korean_guide' and 'english_guide' MUST explain the "Why" and "How" to solve it.
- MOM'S SCRIPT: Provide a warm, natural sentence in Korean for the parent to say to the child.

STRICT FORMATTING:
- ID: Use the exact number on the page.
- TEXT: Strip all prefixes like "1. " or "Q:".
- MCQ: Include the letter and full text (e.g., "A. Blue balloon").

JSON FORMAT:
{
  "worksheet_summary": {
    "title_en": "Phonics and Reading",
    "title_ko": "파닉스와 독해 연습",
    "overview_ko": "글자의 소리와 그림의 내용을 파악하는 활동이에요."
  },
  "items": [
    {
      "id": 1,
      "type": "mcq",
      "bounding_box": { "ymin": 0, "xmin": 0, "ymax": 0, "xmax": 0 },
      "question_text": "Which animal lives in the water?",
      "correct_answer": "C. The colorful fish",
      "korean_guide": "물속에 사는 동물을 찾는 문제입니다. 그림에서 지느러미(fins)가 있는 물고기를 찾아보고, 'Water'라는 단어와 연결지어 설명해주세요.",
      "english_guide": "Focus on the environment. Ask the child to point to the water and identify the animal with fins.",
      "teaching_script_ko": "지우야, 이 중에서 물속에 퐁당 살고 있는 친구는 누구일까? 물고기(Fish)를 같이 찾아볼까?",
      "teaching_tip_ko": "'Water'와 'Fish'의 첫 소리인 /w/와 /f/를 강조하며 읽어주세요.",
      "teaching_tip_en": "Have the child trace the scales of the fish while saying 'F-F-Fish'.",
      "confidence_score": 0.99
    }
  ]
}
`;

const SYSTEM_PROMPT_GENERATE = `
You are a creative EK curriculum designer.
Generate 3-5 similar practice questions that test the same skills (Phonics, Vocabulary, Logic) as the provided items.
Return a JSON array of items following the WorksheetItem structure.
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
        contents: `Original items: ${JSON.stringify(originalItems)}. Create 3-5 similar practice items.`,
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
          { text: "Analyze this EK worksheet. Focus on phonics and comprehension logic." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ANALYZE,
        responseMimeType: "application/json",
        temperature: 0.1, 
        // For Pro model, we use a thinking budget for deeper analysis of handwriting
        ...(isRetry ? { thinkingConfig: { thinkingBudget: 4000 } } : {})
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    return res.status(200).json(JSON.parse(response.text));

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
