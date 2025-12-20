
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten (ages 4-7).

GOAL:
Analyze the worksheet image. Provide correct answers AND professional coaching advice.

HANDWRITING COACHING:
- For items involving writing (Tracing, Fill-in), look at the letter formation.
- Provide a 'handwriting_tip_ko' (Korean) if letters are likely to be tricky for a child (e.g., "글자 'p'의 꼬리를 조금 더 길게 내려써볼까요?").
- If it looks good, provide a specific compliment.

SCORING:
- Estimate a 'total_score' out of 100 based on the difficulty and completion of the worksheet.

JSON OUTPUT RULES:
- worksheet_summary: { title_en, title_ko, overview_ko, overview_en, total_score }
- items: Array of { id, type, bounding_box: {ymin, xmin, ymax, xmax}, question_text, correct_answer, korean_guide, handwriting_tip_ko, teaching_tip_ko }
- Bounding boxes must be integers 0-1000.
`;

const CLONE_PROMPT = `
You are an expert educational content generator. Take the provided list of questions and generate NEW ones with similar difficulty and vocabulary for practice. Return a JSON array of items.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = req.body;
    const apiKey = process.env.API_KEY; 

    if (!apiKey) {
      return res.status(500).json({ error: "API Key missing in environment" });
    }

    const ai = new GoogleGenAI({ apiKey });

    // Handle Similar Question Generation
    if (body.mode === 'generate_similar') {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: [{ parts: [{ text: `Original Items: ${JSON.stringify(body.items)}. Generate 5 similar new questions.` }] }],
            config: {
                systemInstruction: CLONE_PROMPT,
                responseMimeType: "application/json",
            },
        });
        return res.status(200).json(JSON.parse(response.text ?? '[]'));
    }

    // Handle Main Worksheet Analysis
    const { image } = body;
    if (!image) {
      return res.status(400).json({ error: "No image data provided" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          role: "user",
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Analyze this worksheet image following your instructions. Return the structured JSON for the parent." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    return res.status(200).json(JSON.parse(response.text ?? '{}'));

  } catch (error: any) {
    console.error("Vercel Function Error:", error);
    return res.status(500).json({ 
      error: "ANALYSIS_FAILED", 
      message: error.message || "Unknown server error" 
    });
  }
}
