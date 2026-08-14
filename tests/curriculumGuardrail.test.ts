import { describe, it, expect } from 'vitest';
import { validateCurriculumOtherField } from '../src/utils/curriculumGuardrail';

describe('validateCurriculumOtherField', () => {
  it('accepts an empty field (optional)', () => {
    expect(validateCurriculumOtherField('')).toEqual({ ok: true });
    expect(validateCurriculumOtherField('   ')).toEqual({ ok: true });
  });

  it('accepts English instructional text', () => {
    expect(validateCurriculumOtherField('Speaking: Practice reading the word umbrella 3 times.')).toEqual({ ok: true });
  });

  it('rejects English profanity', () => {
    const result = validateCurriculumOtherField('This is fucking great homework');
    expect(result).toEqual({ ok: false, reason: 'restricted_word', badWord: 'fuck' });
  });

  it('rejects Korean profanity', () => {
    const result = validateCurriculumOtherField('씨발 오늘 숙제');
    expect(result).toEqual({ ok: false, reason: 'restricted_word', badWord: '씨발' });
  });

  it('accepts Korean-only text (free text, no English requirement)', () => {
    const result = validateCurriculumOtherField('오늘 숙제는 여기 있습니다');
    expect(result).toEqual({ ok: true });
  });
});
