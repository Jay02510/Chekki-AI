
import {GoogleGenAI} from "@google/genai";

export const config = {
  maxDuration: 60, 
};

const SYSTEM_PROMPT_ANALYZE = `
You are "Chekki AI", a meticulous educational assistant specialized in English Kindergarten (EK) curriculum.
Your primary mission is to RIGOROUSLY IDENTIFY EVERY SINGLE QUESTION AND INTERACTIVE ELEMENT on the provided worksheet image.

### COMPREHENSIVENESS PROTOCOL:
1. **Exhaustive Scan**: Do not skip any items. Scan the page from top-to-bottom and left-to-right. 
2. **Identify Small Details**: Look for subtle markers:
   - Numbers (1., 2., 3...)
   - Letters (a., b., c...)
   - Blanks and lines (_______)
   - Checkboxes or empty circles ( [ ], ( ) )
   - Matching items (images on left, text on right)
   - Tracing prompts (dotted letters)
3. **Capture Groups**: If a section has one instruction but multiple sub-questions, extract EACH sub-question as a separate item in the list.
4. **No Omissions**: It is better to include a redundant item than to miss a valid question.

### PEDAGOGICAL RULES (EK):
- **Tone**: Warm, encouraging, concise for parents.
- **Phonics focus**: If the worksheet is about sounds, mention the specific phoneme (e.g., "Focus on the /sh/ sound").
- **Mom's Script**: Provide a natural, short Korean phrase for the parent to say to the child (e.g., "우리 민준이, 이 그림이랑 어울리는 단어를 한번 연결해볼까?").

### FORMATTING RULES:
- **ID**: Strictly numeric starting from 1.
- **Correct Answer**: Provide the complete, accurate answer based on common EK curriculum standards.
- **Bounding Box**: Provide accurate [ymin, xmin, ymax, xmax] coordinates (0-1000 scale) for where the question/answer area is located on the image.

### JSON SCHEMA:
{
  "worksheet_summary": { 
    "title_en": "string", 
    "title_ko": "string", 
    "overview_ko": "Brief summary of the learning goal in Korean" 
  },
  "items": [{
    "id": number,
    "type": "fill_in|matching|coloring|tracing|mcq|other",
    "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number },
    "question_text": "The text of the question as printed on the page",
    "correct_answer": "The solved answer",
    "korean_guide": "Easy explanation for the parent in Korean",
    "english_guide": "Brief English explanation",
    "teaching_script_ko": "Short script for the mom to read aloud in Korean",
    "teaching_tip_ko": "Specific pedagogical tip in Korean",
    "confidence_score": number
  }]
}
`;

const SYSTEM_PROMPT_GENERATE = `
EK curriculum designer. Create 3-5 similar practice items. Return JSON array.
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
        contents: `Context: ${JSON.stringify(originalItems)}. Task: 3-5 similar questions.`,
        config: {
          systemInstruction: SYSTEM_PROMPT_GENERATE,
          responseMimeType: "application/json",
          temperature: 0.3,
          thinkingConfig: { thinkingBudget: 0 }
        },
      });
      return res.status(200).json(JSON.parse(response.text || "[]"));
    }

    if (!image) return res.status(400).json({ error: "NO_IMAGE" });
    
    // Pro users get the high-quality model by default.
    // We use gemini-3-pro-preview for best vision extraction.
    const modelName = (userPlan === 'pro' || isRetry) ? "gemini-3-pro-preview" : "gemini-3-flash-preview";

    const response = await ai.models.generateContent({
      model: modelName,
      contents: [
        { inlineData: { mimeType: "image/jpeg", data: image } },
        { text: "Exhaustively extract and solve every single question on this worksheet. Follow the JSON schema strictly." },
      ],
      config: {
        systemInstruction: SYSTEM_PROMPT_ANALYZE,
        responseMimeType: "application/json",
        temperature: 0, 
        // Increased thinking budget for Pro to ensure thorough spatial reasoning
        ...(userPlan === 'pro' || isRetry ? { thinkingConfig: { thinkingBudget: 24000 } } : { thinkingConfig: { thinkingBudget: 0 } })
      },
    });

    if (!response.text) throw new Error("EMPTY_RESPONSE");
    
    // Safety check for common parsing errors
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
