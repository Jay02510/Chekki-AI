/**
 * Validation for the curriculum "Other" field — free text for teachers to
 * add whatever supplementary notes they need, extracted from
 * TeacherPage.tsx's handleSaveCurriculum so the rules themselves are
 * directly testable. Only a profanity filter applies; there is no
 * English-only requirement (Audit: KT teachers write notes in Korean).
 */
const RESTRICTED_WORDS = [
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap', 'dick', 'pussy', 'slut', 'whore',
  '씨발', '개새끼', '병신', '지랄', '존나', '좆', '꺼져', '미친년', '미친놈',
];

export type CurriculumOtherFieldResult =
  | { ok: true }
  | { ok: false; reason: 'restricted_word'; badWord: string };

/**
 * Validates the free-text "Other" curriculum field. An empty/whitespace-only
 * value is always valid (the field is optional).
 */
export function validateCurriculumOtherField(otherText: string): CurriculumOtherFieldResult {
  const trimmed = otherText.trim();
  if (!trimmed) return { ok: true };

  const lower = trimmed.toLowerCase();
  for (const badWord of RESTRICTED_WORDS) {
    if (lower.includes(badWord)) {
      return { ok: false, reason: 'restricted_word', badWord };
    }
  }

  return { ok: true };
}
