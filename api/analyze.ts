
// ZERO DEPENDENCY API HANDLER
// We use dynamic imports for auth and native fetch for Gemini to prevent Vercel 500 crashes
// caused by heavy module initializations (Cold Start failures).

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

  let body: any = {};
  let authError = "";
  let authUser = null;
  let taskName = "unknown";

  try {
    try { body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {}); } catch (e) { }

    const { task, image, originalItems } = body;
    taskName = task || "scan";

    // 2. Auth via Dynamic Import (Protects against firebase-admin top-level crash)
    try {
      const authModule = await import('../utils/auth');
      authUser = await authModule.verifyAuth(req);
    } catch (e: any) {
      if (!e.message?.includes("No Firebase Project ID")) {
        authError = e.message;
      }
    }

    const userPlanRaw = body.userPlan || 'free';
    const userPlan: string = typeof userPlanRaw === 'string' ? userPlanRaw : 'free';

    if (task === 'ping') return res.status(200).json({ status: "ok", sdk: "REST_FETCH", auth: !!authUser, authError });

    const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "API_KEY_MISSING" });

    // 3. GENERATE TASK (Native Fetch)
    if (task === 'generate') {
      const gUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      const gRes = await fetch(gUrl, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `Generate 3 similar questions: ${JSON.stringify(originalItems).substring(0, 1000)}` }] }],
          generationConfig: { responseMimeType: "application/json", temperature: 0.7 }
        })
      });
      const gData = await gRes.json();
      if (!gRes.ok) throw new Error(gData.error?.message || "Generation Failed");
      const gText = gData.candidates?.[0]?.content?.parts?.[0]?.text || "[]";
      return res.status(200).json(JSON.parse(gText));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });

    // 4. SCAN TASK (Native Fetch)
    const SYSTEM_PROMPT = `You are "Chekki AI". Analyze worksheet. Output MUST be valid JSON according to schema. Extract question text, pedagogical answer, and teaching scripts. bounding_box uses normalized coordinates 0-1000.`;

    const CONSOLIDATED_SCHEMA = {
      type: "OBJECT",
      properties: {
        worksheet_summary: {
          type: "OBJECT",
          properties: { title_en: { type: "STRING" }, title_ko: { type: "STRING" }, overview_ko: { type: "STRING" } },
          required: ["title_en", "title_ko", "overview_ko"]
        },
        items: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              id: { type: "NUMBER" },
              type: { type: "STRING" },
              question_text: { type: "STRING" },
              correct_answer: { type: "STRING" },
              korean_guide: { type: "STRING" },
              english_guide: { type: "STRING" },
              teaching_script_ko: { type: "STRING" },
              teaching_script_en: { type: "STRING" },
              bounding_box: {
                type: "OBJECT",
                properties: { ymin: { type: "NUMBER" }, xmin: { type: "NUMBER" }, ymax: { type: "NUMBER" }, xmax: { type: "NUMBER" } },
                required: ["ymin", "xmin", "ymax", "xmax"]
              }
            },
            required: ["id", "type", "question_text", "correct_answer", "korean_guide", "english_guide", "teaching_script_ko", "teaching_script_en", "bounding_box"]
          }
        }
      },
      required: ["worksheet_summary", "items"]
    };

    const runScan = async (modelName: string) => {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;
      const payload = {
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts: [{ inlineData: { mimeType: "image/jpeg", data: image } }, { text: "Scan." }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          responseSchema: CONSOLIDATED_SCHEMA
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      };

      const resFetch = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await resFetch.json();
      if (!resFetch.ok) throw new Error(data.error?.message || `Google API: ${resFetch.status}`);

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("No text returned");
      return text;
    };

    let resultText = "";
    try {
      resultText = await runScan(userPlan === 'pro' ? 'gemini-1.5-pro' : 'gemini-1.5-flash');
    } catch (e: any) {
      console.warn("[Retry] Primary Model Failed:", e.message);
      resultText = await runScan('gemini-1.5-flash');
    }

    return res.status(200).json(JSON.parse(resultText));

  } catch (error: any) {
    console.error("Critical Failure:", error.message);
    return res.status(500).json({ error: "INTERNAL_ERROR", detail: error.message, task: taskName, authError });
  }
}
