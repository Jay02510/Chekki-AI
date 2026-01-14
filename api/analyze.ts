
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_SUMMARY = `
You are "Chekki AI". Quickly summarize this English Kindergarten worksheet.
Return ONLY JSON with this schema:
{
  "worksheet_summary": { 
    "title_en": "string", 
    "title_ko": "string", 
    "overview_ko": "Brief summary of the learning goal in Korean" 
  }
}
`;

const SYSTEM_PROMPT_ITEMS = `
You are "Chekki AI". Rigorously extract every single question.
CRITICAL EXTRACTION RULE: For "correct_answer", you MUST NOT return just a letter (A, B, C) or a number. 
You MUST return the FULL STRING representing the answer. 
Example: If the answer is choice B and choice B says "Apple", your correct_answer must be "B. Apple". 
If the item is a fill-in-the-blank for "Cat", return "Cat".

Follow the COMPREHENSIVENESS PROTOCOL: Scan top-to-bottom, left-to-right.
Return ONLY JSON with this schema:
{
  "items": [{
    "id": number,
    "type": "fill_in|matching|coloring|tracing|mcq|other",
    "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
    "question_text": "text",
    "correct_answer": "THE FULL TEXT OF THE ANSWER",
    "korean_guide": "explanation",
    "teaching_script_ko": "script",
    "teaching_tip_ko": "tip"
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
    
    // Use Flash for Summary to be near-instant.
    // Use Pro for Items only if Pro user OR explicitly retrying for accuracy.
    const modelName = isSummaryTask ? "gemini-3-flash-preview" : 
                     ((userPlan === 'pro' || isRetry) ? "gemini-3-pro-preview" : "gemini-3-flash-preview");

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: isSummaryTask ? "Identify the title and goal." : "Extract all questions with full text answers." },
      ],
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        temperature: 0, 
        // Reduced thinking budget for standard items to speed up response.
        thinkingConfig: { thinkingBudget: isSummaryTask ? 0 : (userPlan === 'pro' || isRetry ? 12000 : 0) }
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
