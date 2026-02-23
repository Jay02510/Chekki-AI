
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold, SchemaType } from "@google/generative-ai";
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
    // 2. Define Scope Constants (Inside handler for maximum safety)
    const SYSTEM_PROMPT = `You are "Chekki AI", a high-fidelity educational assistant. Analyze worksheets and provide educational support. Output MUST be valid JSON according to schema. Extract question text, pedagogical answer (Full Text + Letter), and teaching scripts. bounding_box uses normalized coordinates 0-1000.`;

    const CONSOLIDATED_SCHEMA = {
      type: SchemaType.OBJECT,
      properties: {
        worksheet_summary: {
          type: SchemaType.OBJECT,
          properties: {
            title_en: { type: SchemaType.STRING },
            title_ko: { type: SchemaType.STRING },
            overview_ko: { type: SchemaType.STRING }
          },
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
                properties: {
                  ymin: { type: SchemaType.NUMBER },
                  xmin: { type: SchemaType.NUMBER },
                  ymax: { type: SchemaType.NUMBER },
                  xmax: { type: SchemaType.NUMBER }
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

    // 3. Safe Body Padding & Mocked Auth for Stability Test
    let body: any = {};
    try {
      body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    } catch (e) { }

    const { task, image, originalItems } = body;

    // TEMPORARY: Skip verifyAuth to see if firebase-admin load is the blocker
    // const authUser = await verifyAuth(req);
    // const userPlan = authUser ? (body.userPlan || 'free') : 'free';
    const userPlan = 'free' as string;

    if (task === 'ping') return res.status(200).json({ status: "ok", sdk: "generative-ai", time: new Date().toISOString() });

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "SERVER_CONFIGURATION_ERROR" });

    const genAI = new GoogleGenerativeAI(apiKey);

    if (task === 'generate') {
      if (!Array.isArray(originalItems)) return res.status(400).json({ error: "INVALID_INPUT" });
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Generate 3 similar questions: ${JSON.stringify(originalItems).substring(0, 1000)}` }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
      });
      return res.status(200).json(JSON.parse(result.response.text() || "[]"));
    }

    if (!image) return res.status(400).json({ error: "INVALID_IMAGE_DATA" });

    // 4. Execution with Fallback using standard SDK
    const runScan = async (modelName: string) => {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: SYSTEM_PROMPT
      });
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { inlineData: { mimeType: "image/jpeg", data: image } },
            { text: "Analyze worksheet." }
          ]
        }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: CONSOLIDATED_SCHEMA as any,
          temperature: 0.1, // Lower temperature for more stable JSON
        },
        safetySettings: [
          { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
          { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
        ]
      });
      return result.response.text();
    };

    let resultText = "";
    try {
      resultText = await runScan(userPlan === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash');
    } catch (e) {
      console.warn("[Retry] Primary Model Failed, falling back to flash...");
      resultText = await runScan('gemini-1.5-flash');
    }

    return res.status(200).json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("[Critical] Handler Crash:", error.message);
    return res.status(500).json({ error: "INTERNAL_SERVER_ERROR", detail: error.message });
  }
}
