
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { verifyAuth } from "../utils/auth";

export const config = {
  maxDuration: 60,
};


export default async function handler(req: any, res: any) {
  // 1. Immediate CORS & Method Check
  const allowedOrigins = ['capacitor://localhost', 'http://localhost', 'https://chekki-ai.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    // 2. Define Scope Constants (Inside handler to avoid top-level parse crashes)
    const SYSTEM_PROMPT = `You are "Chekki AI", a high-fidelity educational assistant for English Kindergarten parents. Analyze worksheets and provide educational support. Output MUST be valid JSON according to schema. Extract question text, pedagogical answer (Full Text + Letter), and teaching scripts. bounding_box uses normalized coordinates 0-1000.`;

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
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.INTEGER },
              type: { type: Type.STRING },
              question_text: { type: Type.STRING },
              correct_answer: { type: Type.STRING },
              korean_guide: { type: Type.STRING },
              english_guide: { type: Type.STRING },
              teaching_script_ko: { type: Type.STRING },
              teaching_script_en: { type: Type.STRING },
              bounding_box: {
                type: Type.OBJECT,
                properties: { ymin: { type: Type.NUMBER }, xmin: { type: Type.NUMBER }, ymax: { type: Type.NUMBER }, xmax: { type: Type.NUMBER } },
                required: ["ymin", "xmin", "ymax", "xmax"]
              }
            },
            required: ["id", "type", "question_text", "correct_answer", "korean_guide", "english_guide", "teaching_script_ko", "teaching_script_en", "bounding_box"]
          }
        }
      },
      required: ["worksheet_summary", "items"]
    };

    // 3. Safe Body Parsing
    let body: any = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) {
      console.error("[Fatal] Body Parse Error");
    }

    const { task, image, originalItems } = body;
    const authUser = await verifyAuth(req);
    const userPlan = authUser ? (body.userPlan || 'free') : 'free';

    // 4. SDK Initialization (Inside handler)
    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "SERVER_CONFIGURATION_ERROR" });

    const ai = new GoogleGenAI({ apiKey, apiVersion: 'v1beta' });

    if (task === 'generate') {
      if (!Array.isArray(originalItems)) return res.status(400).json({ error: "INVALID_INPUT" });
      const response = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ text: `Generate 3 similar questions for: ${JSON.stringify(originalItems).substring(0, 1000)}` }] }],
        config: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "INVALID_IMAGE_DATA" });

    // 5. Execution with Fallback
    const modelToUse = userPlan === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash';
    let resultText = "";

    try {
      const resp = await ai.models.generateContent({
        model: modelToUse,
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Analyze worksheet." }] }],
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json", responseSchema: CONSOLIDATED_SCHEMA as any }
      });
      resultText = resp.text || "{}";
    } catch (e) {
      console.warn("[Retry] Primary Model Failed, trying fallback...");
      const fallback = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: [{ role: 'user', parts: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Analyze worksheet." }] }],
        config: { systemInstruction: SYSTEM_PROMPT, responseMimeType: "application/json", responseSchema: CONSOLIDATED_SCHEMA as any }
      });
      resultText = fallback.text || "{}";
    }

    return res.status(200).json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("[Critical] Handler Crash:", error.message);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", detail: error.message });
  }
}
