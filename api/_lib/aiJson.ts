/**
 * Strips Markdown code-fence wrapping (```json ... ```) that Gemini
 * sometimes wraps its JSON output in, then parses it. Throws on invalid
 * JSON instead of swallowing the error — callers must handle the failure
 * as a real error, not fall back to fabricated data (see api/analyze.ts's
 * textbook_curriculum_ocr / syllabus_course_plan handlers).
 */
export function parseAiJson(rawText: string): unknown {
  const cleaned = rawText.replace(/```json\n?|```/g, '').trim();
  return JSON.parse(cleaned);
}
