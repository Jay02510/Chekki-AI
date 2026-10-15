import { describe, expect, it } from 'vitest';
import { countMissedWords, isThisKstWeek, kstWeekStart, missLabel } from '../src/utils/weeklyMistakes';

describe('kstWeekStart', () => {
  it('is Monday 00:00 KST (Sunday 15:00 UTC)', () => {
    // Wednesday 2026-10-14 10:00 KST
    expect(new Date(kstWeekStart(new Date('2026-10-14T01:00:00Z'))).toISOString()).toBe('2026-10-11T15:00:00.000Z');
  });
  it('Monday 08:00 KST is already the new week, Sunday 23:00 KST is not', () => {
    const mon8 = new Date('2026-10-11T23:00:00Z');
    expect(isThisKstWeek('2026-10-11T15:30:00Z', mon8)).toBe(true);
    expect(isThisKstWeek('2026-10-11T14:00:00Z', mon8)).toBe(false);
  });
});

describe('missLabel', () => {
  it('matches vocab whole words only', () => {
    expect(missLabel({ correct_answer: 'category' }, ['cat'])).toBe('category');
    expect(missLabel({ question_text: 'The cat sat.', correct_answer: 'sat' }, ['cat'])).toBe('cat');
  });
  it('falls back to a short correct answer, skips long sentences', () => {
    expect(missLabel({ correct_answer: 'went.' }, [])).toBe('went');
    expect(missLabel({ correct_answer: 'She went to the park with her mother yesterday.' }, [])).toBeNull();
  });
});

describe('countMissedWords', () => {
  it('counts non-vocab misses and keeps vocab at 0', () => {
    const out = countMissedWords([{ correct_answer: 'went' }, { correct_answer: 'went' }, { correct_answer: 'leaf' }], ['leaf', 'root']);
    expect(out).toEqual([
      { word: 'went', count: 2 },
      { word: 'leaf', count: 1 },
      { word: 'root', count: 0 },
    ]);
  });
});
