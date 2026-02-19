import {GoogleGenAI, Type} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

// Hardened system prompt to prevent jailbreaking / prompt injection
const SYSTEM_PROMPT = `
You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents.
Your SOLE purpose is to analyze worksheets and provide educational support. 

RULES FOR CORRECT ANSWERS:
1. Every entry in the "correct_answer" field MUST be the complete pedagogical solution.
2. For Multiple Choice Questions (MCQ), you MUST include both the Option Letter AND the Full Text (e.g., "A. Milo borrowed an umbrella").
3. NEVER provide just the letter (e.g., "A" is incorrect, "A. Answer text" is correct).
4. Maintain the exact text as it appears in the worksheet options, including capitalization and punctuation.
5. All JSON output must strictly follow the schema.

RULES FOR TEACHING SCRIPTS:
- Provide warm, encouraging scripts in Korean for the parent to read.
- Keep the English teaching tips clear and helpful for non-native speaking parents.
`;

const CONSOLIDATED_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    worksheet_summary: {
      type: Type.OBJECT,
      properties: {
        title_en: { type: Type.STRING },
        title_ko: { type: Type.STRING },
        overview_ko: { type: Type.STRING }
      },
      required: ["title_en", "title_ko", "overview_ko"]
    },
    items: {
      type: Type.ARRAY,
      description: "Detailed analysis of each question found in the worksheet.",
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.INTEGER },
          type: { type: Type.STRING },
          question_text: { type: Type.STRING },
          correct_answer: { 
            type: Type.STRING,
            description: "The complete pedagogical answer. For multiple choice, MUST include Letter AND Full Text (e.g., 'A. Milo borrowed an umbrella'). NEVER just the letter."
          },
          korean_guide: { type: Type.STRING },
          english_guide: { type: Type.STRING },
          teaching_script_ko: { type: Type.STRING },
          teaching_script_en: { type: Type.STRING },
          bounding_box: {
            type: Type.OBJECT,
            properties: {
              ymin: { type: Type.NUMBER },
              xmin: { type: Type.NUMBER },
              ymax: { type: Type.NUMBER },
              xmax: { type: Type.NUMBER }
            },
            required: ["ymin", "xmin", "ymax", "xmax"]
          }
        },
        required: ["id", "type", "question_text", "correct_answer", "korean_guide", "english_guide", "teaching_script_ko", "teaching_script_en", "bounding_box"]
      }
    }
  },
  required: ["worksheet_summary", "items"]
};

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Credentials', "true");
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { task, image, originalItems, userPlan } = body;
    
    if (image && image.length > 10 * 1024 * 1024) { 
        return res.status(413).json({ error: "PAYLOAD_TOO_LARGE" });
    }

    if (!process.env.API_KEY) return res.status(500).json({ error: "API_KEY_MISSING" });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    if (task === 'generate') {
      if (!Array.isArray(originalItems)) return res.status(400).json({ error: "INVALID_INPUT" });
      
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems).substring(0, 2000)}. Task: Generate 3 brand new similar questions for extra practice with bilingual guides. Follow the MCQ rule: Letter + Full Text.`,
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image || typeof image !== 'string') return res.status(400).json({ error: "INVALID_IMAGE_DATA" });

    const modelToUse = userPlan === 'pro' ? 'gemini-3-pro-preview' : 'gemini-3-flash-preview';

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } }, 
          { text: "Analyze this worksheet for summary and answer key. Ensure MCQ answers include the letter and full option text." }
        ]
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: CONSOLIDATED_SCHEMA,
        thinkingConfig: { thinkingBudget: userPlan === 'pro' ? 15000 : 0 }
      }
    });

    const result = JSON.parse(response.text || "{}");

    return res.status(200).json({
      worksheet_summary: result.worksheet_summary,
      items: result.items || []
    });

  } catch (error: any) {
    console.error("[Backend Security Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}