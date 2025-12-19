
import { GoogleGenAI } from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT = `
You are Homework Helper AI, a specialized educational assistant for Korean parents whose children attend English Kindergarten (ages 4-7).
Return a strict JSON output that provides correct answers, Korean/English explanations, specific teaching advice, AND bounding boxes.
Use gemini-3-flash-preview for high accuracy analysis of handwriting and worksheet structure.
`;

export default async function handler(request: Request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
  }

  try {
    const { image } = await request.json();
    if (!image) return new Response(JSON.stringify({ error: "No image provided" }), { status: 400 });

    const apiKey = process.env.API_KEY; 
    if (!apiKey) return new Response(JSON.stringify({ error: "Server misconfiguration" }), { status: 500 });

    const ai = new GoogleGenAI({ apiKey });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          { inlineData: { mimeType: "image/jpeg", data: image } },
          { text: "Analyze the entire image from top to bottom. Identify every single blank space, question, and writing line. Provide a correct example answer for every single item found. Return JSON with bounding boxes." },
        ],
      },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        temperature: 0.1, 
      },
    });

    return new Response(response.text, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error("Server API Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
  }
}
