
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `
You are "Chekki AI", a specialist in identifying English Kindergarten (EK) worksheets.
Identify the worksheet's main title and its primary learning objective.
Return ONLY JSON:
{
  "worksheet_summary": { 
    "title_en": "string", 
    "title_ko": "string", 
    "overview_ko": "Brief summary of the learning goal in Korean" 
  }
}
`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI". Your goal is to extract every question, vocabulary word, or exercise item from the worksheet.

CRITICAL RULES:
1. FULL TEXT ANSWERS: For "correct_answer", you MUST NOT return just a letter (like "A") or a number. You MUST return the FULL text content of the answer. 
   - Example: If Choice B is "Banana", return "B. Banana". 
   - Example: If it's a vocabulary sheet for the word "Cringe", return "Cringe".
2. ITEM IDENTIFICATION: If the page doesn't have numbered questions, treat each vocabulary word or section (e.g., "Read and write the words") as an item.
3. BOUNDING BOXES: Provide coordinates (0-1000) for where the item's answer or focus area is.

Return ONLY JSON:
{
  "items": [{
    "id": number,
    "type": "vocabulary|fill_in|matching|coloring|mcq",
    "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
    "question_text": "The prompt or the word itself",
    "correct_answer": "THE FULL TEXT OF THE ANSWER",
    "korean_guide": "Explanation in Korean",
    "teaching_script_ko": "A kind script for a mom to say to her child in Korean",
    "teaching_tip_ko": "A helpful teaching tip in Korean"
  }]
}
`;

const SYSTEM_PROMPT_GENERATE = `
EK curriculum designer. Create 2-3 similar practice items based on context. Return JSON array.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!process.env.API_KEY) return res.status(500).json({ error: "ANALYSIS_FAILED" });

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { task, image, isRetry, originalItems, userPlan } = body;

    if (task === 'generate') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 2-3 unique questions.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    
    const isSummaryTask = task === 'summary';
    const systemPrompt = isSummaryTask ? SYSTEM_PROMPT_SUMMARY : SYSTEM_PROMPT_ITEMS;
    
    // We use Gemini 3 Pro for the ITEMS task to ensure rigorous extraction of vocabulary and boxes.
    const modelName = isSummaryTask ? "gemini-3-flash-preview" : "gemini-3-pro-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: isSummaryTask ? "Identify the title and goal." : "Rigorously extract all items/words/questions with coordinates and full-text answers." },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0, 
        thinkingConfig: { thinkingBudget: isSummaryTask ? 0 : 20000 }
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    
    let cleanJson = response.text.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.replace(/```json|```/g, '').trim();
    }
    
    return res.status(200).json(JSON.parse(cleanJson));

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
