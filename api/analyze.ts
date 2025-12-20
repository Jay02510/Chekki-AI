
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten (ages 4-7).

GOAL:
Analyze the worksheet image. Provide correct answers AND professional coaching advice.

CRITICAL INSTRUCTIONS FOR ACCURACY:
1. QUESTION NUMBERS: Use the ACTUAL question numbers printed on the worksheet (e.g., 5, 6, 7, 8). Do NOT start from 1 if the page starts at 5.
2. FULL ANSWERS (MANDATORY): For multiple choice (MCQ), NEVER return just the letter (e.g., 'B'). You MUST return the letter AND the full text of the choice (e.g., 'B. A squirrel stole one'). This is vital for the child's audio playback.
3. QUESTION TEXT: Extract the full question text exactly as it appears.
4. SCAN SEQUENCE: If the worksheet has columns, scan the LEFT column from top-to-bottom first, then move to the RIGHT column.

HANDWRITING COACHING:
- For items involving writing (Tracing, Fill-in), look at the child's letter formation.
- Provide a 'handwriting_tip_ko' (Korean) if letters are likely to be tricky for a child (e.g., "글자 'p'의 꼬리를 조금 더 길게 내려써볼까요?").

SCORING:
- Estimate a 'total_score' out of 100 based on the difficulty and completion of the worksheet.

JSON OUTPUT RULES:
- worksheet_summary: { title_en, title_ko, overview_ko, overview_en, total_score }
- items: Array of { id, type, bounding_box: {ymin, xmin, ymax, xmax}, question_text, correct_answer, korean_guide, handwriting_tip_ko, teaching_tip_ko }
- Bounding boxes must be integers 0-1000.
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

    if (body.mode === 'generate_similar') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `Original Items: ${JSON.stringify(body.items)}. Generate 5 similar new questions for practice.` }] }],
        config: {
          systemInstruction: "You are an expert educator. Generate new questions with the same difficulty level.",
          responseMimeType: "application/json",
        },
      });
      return res.status(200).json(JSON.parse(response.text || '[]'));
    }

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
            { text: "Analyze this worksheet. IMPORTANT: Capture the WHOLE text of the correct answer for playback, not just the letter. Use the question numbers from the image." },
          ],
        },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    const outputText = response.text || '{}';
    return res.status(200).json(JSON.parse(outputText));

  } catch (error: any) {
    console.error("[Chekki API] Error:", error);
    return res.status(500).json({ 
      error: "ANALYSIS_FAILED", 
      message: error.message || "Unknown error" 
    });
  }
}
