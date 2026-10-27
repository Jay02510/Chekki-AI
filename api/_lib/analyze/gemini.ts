import { GoogleGenAI, Type } from '@google/genai';

// Cheapest possible cost visibility: every Gemini response carries token
// counts on usageMetadata, but nothing in this file ever read them — there
// was no way to answer "what does this feature actually cost" without
// guessing. Logs to stdout (visible in Vercel function logs) tagged by task
// name; not persisted anywhere yet, so it's a starting point for real
// numbers, not a billing system.
export function logUsage(task: string, response: any) {
  const u = response?.usageMetadata;
  if (!u) return;
  console.log(
    `[usage] task=${task} promptTokens=${u.promptTokenCount ?? '?'} outputTokens=${u.candidatesTokenCount ?? '?'} totalTokens=${u.totalTokenCount ?? '?'}`
  );
}

// Fills a response schema (the same Type.OBJECT/ARRAY/STRING trees passed as
// config.responseSchema below) with placeholder values recursively, so a
// mocked call returns something shaped close enough to the real thing for
// downstream parsing to succeed.
export function mockStubFromSchema(schema: any): any {
  if (!schema) return {};
  switch (schema.type) {
    case Type.OBJECT: {
      const obj: Record<string, any> = {};
      for (const key of Object.keys(schema.properties || {})) {
        obj[key] = mockStubFromSchema(schema.properties[key]);
      }
      return obj;
    }
    case Type.ARRAY:
      return [mockStubFromSchema(schema.items)];
    case Type.INTEGER:
    case Type.NUMBER:
      return 1;
    case Type.BOOLEAN:
      return true;
    default:
      return schema.enum ? schema.enum[0] : 'Mock response (MOCK_GEMINI=true)';
  }
}

// MOCK_GEMINI=true (set on Vercel Preview only) swaps every Gemini call for
// a same-shaped stub so load/stress tests never hit the real API — no cost,
// no quota, no real-model latency skewing the numbers being measured.
export const MOCK_GEMINI = process.env.MOCK_GEMINI === 'true';

export function createGenAI() {
  if (!MOCK_GEMINI) return new GoogleGenAI({ apiKey: process.env.API_KEY });
  return {
    models: {
      generateContent: async (req: any) => {
        const isJson =
          req?.config?.responseSchema || req?.config?.responseMimeType === 'application/json';
        const text = isJson
          ? JSON.stringify(mockStubFromSchema(req?.config?.responseSchema))
          : 'Mock response text (MOCK_GEMINI=true)';
        return { text, usageMetadata: undefined };
      },
    },
  } as any;
}
