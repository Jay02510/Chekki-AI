import { FieldValue } from 'firebase-admin/firestore';
import { logUsage } from './gemini.js';
import { parseAiJson } from '../aiJson.js';
import type { TaskContext } from './context.js';

// Teacher dashboard: textbook/worksheet answer-key OCR and syllabus parsing (single or multi-page).
export async function handleCurriculumOcr(ctx: TaskContext): Promise<any> {
  const { res, body, ai, mode, userRef, userSnap, realUserPlan, today, isNewDay } = ctx;
  const rawImageList: string[] =
    Array.isArray(body?.images_base64) && body.images_base64.length > 0
      ? body.images_base64
      : body?.image_base64 || body?.image
        ? [body.image_base64 || body.image]
        : [];

  if (rawImageList.length === 0) {
    return res.status(400).json({ error: 'MISSING_IMAGE' });
  }

  const defaultMime =
    body?.mimeType || (rawImageList[0].startsWith('JVBERi0') ? 'application/pdf' : 'image/jpeg');

  const imageParts = rawImageList.map((imgBase64) => ({
    inlineData: {
      mimeType: defaultMime,
      data: imgBase64,
    },
  }));

  const isSyllabus = mode === 'syllabus_course_plan';

  const promptText = isSyllabus
    ? `You are an expert curriculum parser for English Kindergarten & Elementary textbooks.
Extract a course-level overview from the provided syllabus/table-of-contents/unit-index page image(s).
You are analyzing ${rawImageList.length} page(s)/image(s) that describe the SCOPE of a course or term (unit titles, week ranges, target vocabulary/phonics scope across many units) — NOT a single day's worksheet.

Aggregate across all units visible into one overall term scope, AND provide a page-by-page breakdown for each page uploaded.

Return ONLY valid JSON matching this schema:
{
  "topic": string (overall course/term title, e.g. "Term 2 - Phonics & Reading"),
  "vocabWords": string[] (all target vocabulary words across the term/units shown),
  "phonicsRules": string[] (all target phonics rules across the term/units shown),
  "passage": string (a representative reading passage or topic description, if present),
  "other": string (course-level notes: pacing, number of weeks, homework policy, etc.),
  "detectedAnswers": [],
  "pages": [
    {
      "pageIndex": number (1-based index: 1, 2, 3...),
      "pageTitle": string (e.g. "Page 1 - Unit Index"),
      "topic": string,
      "vocabWords": string[],
      "phonicsRules": string[],
      "passage": string,
      "other": string,
      "detectedAnswers": []
    }
  ]
}`
    : `You are an expert curriculum parser for English Kindergarten & Elementary textbooks and worksheets.
Extract the core teaching components and parent answer key from the provided textbook/worksheet page image(s).
You are analyzing ${rawImageList.length} page(s)/image(s).

Provide both an overall aggregated unit summary AND a page-by-page breakdown for each page uploaded.

Return ONLY valid JSON matching this schema:
{
  "topic": string (overall unit title/theme),
  "vocabWords": string[] (all target vocabulary words across pages),
  "phonicsRules": string[] (all target phonics rules across pages),
  "passage": string (target reading story/passage),
  "other": string (supplementary homework or speaking instructions),
  "detectedAnswers": [
    {
      "questionNumber": string,
      "questionText": string,
      "answer": string,
      "category": string,
      "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number } (the question's location on ITS OWN page image, coordinates 0-1000 scaled to that page's width/height — same convention as a normal graded-worksheet scan. Omit this field for a question if you can't confidently locate it, rather than guessing.)
    }
  ],
  "pages": [
    {
      "pageIndex": number (1-based index: 1, 2, 3...),
      "pageTitle": string (e.g. "Page 1 - Vocabulary"),
      "topic": string,
      "vocabWords": string[],
      "phonicsRules": string[],
      "passage": string,
      "other": string,
      "detectedAnswers": [
        {
          "questionNumber": string,
          "questionText": string,
          "answer": string,
          "category": string,
          "bounding_box": { "ymin": number, "xmin": number, "ymax": number, "xmax": number } (0-1000 scale, that page's own image — omit if unsure)
        }
      ]
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: promptText }, ...imageParts],
      },
    ],
    config: { responseMimeType: 'application/json', temperature: 0.2 },
  });
  logUsage(isSyllabus ? 'syllabus_course_plan' : 'textbook_curriculum_ocr', response);

  const rawText = response.text || '{}';
  try {
    const parsed = parseAiJson(rawText);

    // This branch returns before the shared scansUsedToday increment
    // further down in the handler ever runs, so every curriculum/
    // syllabus OCR scan — the busiest AI feature in the teacher
    // dashboard — was completely free for non-pro accounts regardless
    // of the quota gate checked above (audit: unlimited free scans on
    // this mode). Same increment used on the cache-hit path above.
    if (userSnap && userSnap.exists && realUserPlan !== 'pro') {
      try {
        await userRef.update({
          scansUsedToday: isNewDay ? 1 : FieldValue.increment(1),
          lastScanDate: today,
        });
      } catch (dbLimitErr) {
        console.warn(
          '[analyze] Failed to update user scans limit on curriculum OCR success:',
          dbLimitErr
        );
      }
    }

    return res.status(200).json({ analysis: parsed });
  } catch (err) {
    // Previously this fell back to hardcoded fake "Weather & Nature"
    // curriculum data with a 200 status, which a teacher could then save
    // as real curriculum with no indication the scan had actually
    // failed (Audit: server-side fake-success on AI JSON parse failure).
    // A real failure must surface as a real error — the client already
    // treats any non-2xx as a scan failure and shows a retry toast.
    console.error('[analyze] Failed to parse AI curriculum JSON:', err);
    return res.status(502).json({ error: 'AI_PARSE_FAILED' });
  }
}
