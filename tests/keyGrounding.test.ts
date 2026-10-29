import { describe, it, expect } from 'vitest';
import { verifyKeyGrounding } from '../api/_lib/analyze/scanPrompt';

const key = [
  { questionText: 'What did Milo borrow?', answer: 'an umbrella' },
  { questionText: 'Fill in: I ___ a cat.', answer: 'have' },
];

describe('verifyKeyGrounding', () => {
  it('keeps the flag when the answer contains a key answer', () => {
    const [item] = verifyKeyGrounding(
      [{ correct_answer: 'A. Milo borrowed an Umbrella.', graded_against_key: true }],
      key
    );
    expect(item.graded_against_key).toBe(true);
  });

  it('drops a claim the key does not back up', () => {
    const [item] = verifyKeyGrounding(
      [{ correct_answer: 'B. a raincoat', graded_against_key: true }],
      key
    );
    expect(item.graded_against_key).toBe(false);
  });

  it('is always false with no answer key', () => {
    const [item] = verifyKeyGrounding([{ correct_answer: 'have', graded_against_key: true }], []);
    expect(item.graded_against_key).toBe(false);
  });

  it('never turns on a flag the model did not set', () => {
    const [item] = verifyKeyGrounding([{ correct_answer: 'have' }], key);
    expect(item.graded_against_key).toBe(false);
  });
});
