
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are Homework Helper AI, a supportive assistant for Korean parents.
GOAL: Analyze the worksheet image. Solve ALL visible items.
RULES:
1. IDENTIFY ALL: Scan every question on the page.
2. LABELLING: Use the labels/numbers from the page.
3. OUTPUT: Provide correct answer and warm Korean 'korean_guide' for the parent.
4. BOXES: Provide 'bounding_box' [ymin, xmin, ymax, xmax].
FORMAT: JSON { "worksheet_summary": {...}, "items": [...] }
`;

const SYSTEM_PROMPT_GENERATE = `
You are a creative educational content creator.
GOAL: Based on provided questions, generate 3-5 high-quality similar practice questions for a child.
RULES: Use simple language suitable for a kindergarten/elementary student. 
FORMAT: Return a JSON array of items following the WorksheetItem structure.
`;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    // Create the GoogleGenAI instance with the API key from environment variables.
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const { task, image, isRetry, originalItems } = body;

    if (task === 'generate') {
      // Use gemini-3-flash-preview for standard text generation tasks.
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Original items: ${JSON.stringify(originalItems)}. Create 3-5 similar ones.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      });
      // response.text is a property, not a method.
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    const model = isRetry ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    // contents must be an object with parts for multi-part queries (image + text).
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } },
          { text: "Analyze this worksheet thoroughly and solve every item." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT_ANALYZE,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    // response.text property directly returns the extracted string.
    const outputText = response.text;
    if (!outputText) throw new Error("EMPTY_RESPONSE");
    
    return res.status(200).json(JSON.parse(outputText));

  } catch (error: any) {
    console.error("[Backend Error]:", error.message);
    return res.status(500).json({ error: "ANALYSIS_FAILED" });
  }
}
