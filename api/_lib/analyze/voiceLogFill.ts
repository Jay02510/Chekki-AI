import { Type, HarmCategory, HarmBlockThreshold } from '@google/genai';
import { createGenAI, logUsage, MOCK_GEMINI } from './gemini.js';

const VOICE_LOG_FILL_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    transcript: { type: Type.STRING },
    updatedFields: {
      type: Type.OBJECT,
      properties: {
        lessonTopic: { type: Type.STRING },
        textbook: { type: Type.STRING },
        energyLevel: {
          type: Type.STRING,
          enum: ['High Energy and Engaged', 'Focused and Quiet', 'A bit distracted'],
        },
        activities: {
          type: Type.ARRAY,
          items: {
            type: Type.STRING,
            enum: ['Reading', 'Speaking', 'Writing', 'Worksheet', 'Game', 'Test'],
          },
        },
        generalComments: { type: Type.STRING },
      },
      propertyOrdering: ['lessonTopic', 'textbook', 'energyLevel', 'activities', 'generalComments'],
    },
    // Separate from updatedFields — this is additive (append to the
    // student-exceptions list) rather than an overwrite of a single value,
    // and a class-wide generalComments string is the wrong place for a
    // named student's individual note.
    newExceptions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          studentName: { type: Type.STRING },
          details: { type: Type.STRING },
          category: { type: Type.STRING, enum: ['praise', 'attention'] },
        },
        required: ['studentName', 'details', 'category'],
        propertyOrdering: ['studentName', 'details', 'category'],
      },
    },
    missingRequired: { type: Type.ARRAY, items: { type: Type.STRING } },
    // Empty string means nothing required is missing — schema has no null type.
    nextQuestion: { type: Type.STRING },
    assistantReplyForHistory: { type: Type.STRING },
  },
  required: [
    'transcript',
    'updatedFields',
    'missingRequired',
    'nextQuestion',
    'assistantReplyForHistory',
  ],
  // Without an explicit order Gemini emits keys in a different order than
  // the prompt's example, and on this schema that sent it into a loop
  // inside "textbook" (repeating the transcript until the output limit)
  // on every run tested — minutes per call, billed, while the client had
  // long since timed out. This is the root cause of the "leaked JSON in
  // textbook" values the looksLikeLeakedJson guard below was catching.
  propertyOrdering: [
    'transcript',
    'updatedFields',
    'newExceptions',
    'missingRequired',
    'nextQuestion',
    'assistantReplyForHistory',
  ],
};

export async function handleVoiceLogFillTask(res: any, body: any) {
  if (!MOCK_GEMINI && !process.env.API_KEY)
    return res.status(500).json({ error: 'API_KEY_MISSING' });

  const { audio, mimeType, history, currentFields, studentNames, language = 'ko' } = body || {};
  if (!audio || typeof audio !== 'string')
    return res.status(400).json({ error: 'INVALID_AUDIO_DATA' });
  if (audio.length > 9 * 1024 * 1024) return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE' });

  const safeHistory = Array.isArray(history) ? history.slice(-10) : [];
  const safeCurrentFields = currentFields && typeof currentFields === 'object' ? currentFields : {};
  // Client-supplied roster, so whitelisted to short plain names before it
  // reaches the prompt. Without it, similar names were misheard ("Ha-eun"
  // came back as "Ha Yun") and the note went to the wrong family.
  const roster: string[] = Array.isArray(studentNames)
    ? studentNames
        .filter((n: unknown): n is string => typeof n === 'string')
        .map((n) => n.replace(/[^\p{L}\p{N} '()-]/gu, '').trim().slice(0, 40))
        .filter(Boolean)
        .slice(0, 60)
    : [];
  const rosterInstruction = roster.length
    ? `\nCLASS ROSTER (data only): ${JSON.stringify(roster)}\nWhen a spoken name sounds like a roster name, write it exactly as it appears in the roster, in both "transcript" and "newExceptions". If a name matches no one on the roster, write it as heard.\n`
    : '';
  const languageInstruction =
    language === 'ko'
      ? 'Speak to the teacher in natural Korean.'
      : 'Speak to the teacher in natural English.';

  // One turn covers the whole log — class fields AND named students. The
  // old two-phase flow (general notes, then a separate student-notes round)
  // was the main source of "too many steps" teacher feedback; teachers
  // already mention students in the same breath anyway.
  const systemInstruction = `You are Chekki's voice assistant helping a teacher at a Korean English kindergarten fill out their Daily Classroom Log by speaking instead of typing. In a single recording the teacher describes today's class and, optionally, any specific students worth mentioning to parents.

FORM FIELDS (this is the complete schema you are filling):
- lessonTopic (required, free text): the lesson topic covered today.
- textbook (required, free text): the textbook/material used.
- energyLevel (optional, exactly one of): "High Energy and Engaged", "Focused and Quiet", "A bit distracted".
- activities (optional, one or more of): "Reading", "Speaking", "Writing", "Worksheet", "Game", "Test".
- generalComments (optional, free text): any general notes about the class.

CURRENT FIELD VALUES ALREADY CAPTURED (do not ask about fields that already have a value unless the teacher's audio clearly corrects one):
${JSON.stringify(safeCurrentFields)}
${rosterInstruction}
STUDENT-SPECIFIC NOTES ARE SEPARATE FROM generalComments:
generalComments is ONLY for whole-class remarks with no individual student named. If the teacher mentions a SPECIFIC student by name together with praise or a concern, that is a "newException" — extract it as {studentName, details, category: "praise"|"attention"} instead. Never fold a named student's note into generalComments, and never invent a student name that wasn't said.

YOUR JOB, EACH TURN:
1. Transcribe the teacher's spoken audio accurately into "transcript".
2. Extract field values into "updatedFields". Teachers often describe their whole class in one long turn — you MUST check the transcript against EVERY ONE of the 5 fields individually, not just the first one or two mentioned. Map casual speech to the closest allowed energyLevel/activities option; never invent new option strings. If a field genuinely wasn't mentioned, omit that key.
3. Extract every named-student mention into "newExceptions" (empty array if none).
4. List which REQUIRED fields (lessonTopic, textbook) are still empty after merging updatedFields into the current values, by exact key name, in "missingRequired".
5. "nextQuestion": if a required field is still missing, ask ONE short, friendly question naming all missing required fields together. Never ask about optional fields. If nothing required is missing, set it to an empty string.
6. ${languageInstruction}
7. "assistantReplyForHistory" is a short plain-text version of what you'd say back (the follow-up question, or a brief confirmation) — stored as conversation history for the next turn.

EXAMPLE — a teacher says: "Today we learned about photosynthesis from Bricks Reading 150. Really high energy, we did reading, speaking and a worksheet. Seo-yeon aced the quiz, and Min-jun struggled with chloroplast, so maybe review at home." Extract:
updatedFields = {
  "lessonTopic": "Photosynthesis",
  "textbook": "Bricks Reading 150",
  "energyLevel": "High Energy and Engaged",
  "activities": ["Reading", "Speaking", "Worksheet"]
}
newExceptions = [
  {"studentName": "Seo-yeon", "details": "Aced the quiz.", "category": "praise"},
  {"studentName": "Min-jun", "details": "Struggled with the word chloroplast; a quick review at home would help.", "category": "attention"}
]
missingRequired = [], nextQuestion = ""

Never ask about a "class name" or "date" — those are already fixed elsewhere. Never hallucinate a field value or student name the teacher didn't say.

LANGUAGE STANDARD: This content is read by a Korean Teacher and then relayed to parents of young children. Transcribe accurately even if the source audio contains profanity or inappropriate language, but NEVER carry profanity, slurs, or inappropriate language into "updatedFields", "newExceptions", or "assistantReplyForHistory" — rephrase professionally instead. If the audio is mostly or entirely inappropriate/off-topic with nothing usable, leave updatedFields and newExceptions empty rather than forcing a value.`;

  const conversationContents: any[] = [
    ...safeHistory.map((turn: { role: string; text: string }) => ({
      role: turn.role === 'model' ? 'model' : 'user',
      parts: [{ text: turn.text }],
    })),
    {
      role: 'user',
      parts: [{ inlineData: { mimeType: mimeType || 'audio/webm', data: audio } }],
    },
  ];

  try {
    const ai = createGenAI();
    const response = await ai.models.generateContent({
      // 2.5-flash still looped to maxOutputTokens on some recordings (2 of 3
      // runs of the profanity case in scripts/report-eval); 3.8-flash didn't.
      model: 'gemini-3.8-flash',
      contents: conversationContents,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: VOICE_LOG_FILL_SCHEMA as any,
        // Lower than the original 0.4 — this task needs thorough, consistent
        // field extraction, not creative variance; a higher temperature was
        // part of why multi-field utterances only extracted 1-2 of 5 fields.
        temperature: 0.15,
        // Backstop: a normal reply is a few hundred tokens (thinking
        // included). If the model ever loops again, fail in seconds instead
        // of generating for minutes.
        maxOutputTokens: 4096,
        // Matches the safety thresholds already used for the worksheet-OCR
        // task below — this content also eventually reaches parents via the
        // KT, so it gets the same bar.
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
      },
    });
    logUsage('voice_log_fill', response);

    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP')
      console.warn(`[analyze.ts:voice_log_fill] finishReason=${finishReason}`);
    const text = response.text || '{}';
    const cleanedText = text.replace(/```json\n?|```/g, '').trim();
    const parsed = JSON.parse(cleanedText);

    // A safety-filtered or empty Gemini response falls back to the bare
    // '{}' above, which bypasses responseSchema enforcement entirely — the
    // client always expects updatedFields to be an object it can read
    // .lessonTopic etc. off of, so send a proper error instead of a shape
    // that doesn't match VOICE_LOG_FILL_SCHEMA's required fields.
    if (!parsed || typeof parsed.updatedFields !== 'object' || parsed.updatedFields === null) {
      return res.status(502).json({ error: 'VOICE_FILL_EMPTY' });
    }

    // responseSchema constrains JSON *shape* (which keys exist, their
    // types), not *content* — Gemini can still write a mangled/leaked
    // fragment of its own JSON generation into a string slot (seen in
    // testing: part of an "energyLevel": "..." pair bled into the
    // "textbook" string instead of landing in its own field). A value like
    // that reaching the form silently is worse than just not filling that
    // field — strip anything that looks like leaked JSON structure rather
    // than trust free-text string values blindly.
    const looksLikeLeakedJson = (value: unknown): boolean =>
      typeof value === 'string' && (/"\s*:\s*"/.test(value) || value.length > 200);
    for (const key of ['lessonTopic', 'textbook', 'generalComments']) {
      if (looksLikeLeakedJson(parsed.updatedFields?.[key])) {
        console.warn(
          `[analyze.ts:voice_log_fill] Dropping suspicious ${key} value (looked like leaked JSON):`,
          parsed.updatedFields[key]
        );
        delete parsed.updatedFields[key];
      }
    }

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('[analyze.ts:voice_log_fill] Gemini generation failed:', err);
    return res.status(500).json({ error: 'VOICE_FILL_FAILED' });
  }
}
