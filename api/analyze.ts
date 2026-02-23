
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";

export const config = {
  maxDuration: 60,
};

export default async function handler(req: any, res: any) {
  // 1. Immediate CORS
  const allowedOrigins = ['capacitor://localhost', 'http://localhost', 'https://chekki-ai.vercel.app'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: "METHOD_NOT_ALLOWED" });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { task, image, originalItems } = body;

    // 2. ULTRA-ISOLATION: No external auth utils during this test
    // We are mocking auth status entirely to confirm if firebase-admin is the crasher
    const userPlan = (body.userPlan || 'free') as string;

    if (task === 'ping') return res.status(200).json({ status: "ok", time: new Date().toISOString() });

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    const genAI = new GoogleGenerativeAI(apiKey);

    if (task === 'generate') {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1beta" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Generate 3 similar questions: ${JSON.stringify(originalItems).substring(0, 1000)}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      });
      return res.status(200).json(JSON.parse(result.response.text()));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    const SYSTEM_PROMPT = `Analyze worksheet. Valid JSON according to schema. Coordinates 0-1000. Extract text, answers, and scripts.`;

    const CONSOLIDATED_SCHEMA = {
      type: SchemaType.OBJECT,
      properties: {
        worksheet_summary: {
          type: SchemaType.OBJECT,
          properties: { title_en: { type: SchemaType.STRING }, title_ko: { type: SchemaType.STRING }, overview_ko: { type: SchemaType.STRING } },
          required: ["title_en", "title_ko", "overview_ko"]
        },
        items: {
          type: SchemaType.ARRAY,
          items: {
            type: SchemaType.OBJECT,
            properties: {
              id: { type: SchemaType.NUMBER },
              type: { type: SchemaType.STRING },
              question_text: { type: SchemaType.STRING },
              correct_answer: { type: SchemaType.STRING },
              korean_guide: { type: SchemaType.STRING },
              english_guide: { type: SchemaType.STRING },
              teaching_script_ko: { type: SchemaType.STRING },
              teaching_script_en: { type: SchemaType.STRING },
              bounding_box: {
                type: SchemaType.OBJECT,
                properties: { ymin: { type: SchemaType.NUMBER }, xmin: { type: SchemaType.NUMBER }, ymax: { type: SchemaType.NUMBER }, xmax: { type: SchemaType.NUMBER } },
                required: ["ymin", "xmin", "ymax", "xmax"]
              }
            },
            required: ["id", "type", "question_text", "correct_answer", "korean_guide", "english_guide", "teaching_script_ko", "teaching_script_en", "bounding_box"]
          }
        }
      },
      required: ["worksheet_summary", "items"]
    };

    const model = genAI.getGenerativeModel(
      { model: userPlan === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash', systemInstruction: SYSTEM_PROMPT },
      { apiVersion: "v1beta" }
    );

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Scan." }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: CONSOLIDATED_SCHEMA as any, temperature: 0.1 }
    });

    return res.status(200).json(JSON.parse(result.response.text()));

  } catch (error: any) {
    console.error("Critical Failure:", error.message);
    return res.status(500).json({ error: "INTERNAL_ERROR", detail: error.message });
  }
}
