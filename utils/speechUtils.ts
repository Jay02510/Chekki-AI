export const normalizeText = (text: string): string => {
  if (!text) return '';

  // 1. Lowercase
  let normalized = text.toLowerCase();

  // 2. Handle common contractions
  const contractions: { [key: string]: string } = {
    "it's": 'it is',
    "isn't": 'is not',
    "aren't": 'are not',
    "wasn't": 'was not',
    "weren't": 'were not',
    "don't": 'do not',
    "doesn't": 'does not',
    "didn't": 'did not',
    "won't": 'will not',
    "can't": 'cannot',
    "i'm": 'i am',
    "you're": 'you are',
    "he's": 'he is',
    "she's": 'she is',
    "they're": 'they are',
    "we're": 'we are',
    "haven't": 'have not',
    "hasn't": 'has not',
    "hadn't": 'had not',
  };

  Object.keys(contractions).forEach((key) => {
    // Regex to match whole word contractions
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    normalized = normalized.replace(new RegExp(`\\b${escapedKey}\\b`, 'g'), contractions[key]);
  });

  // 3. Remove common prefixes like "A.", "1.", "a)", "1)"
  // We only remove if it's followed by a punctuation mark AND space to avoid removing words like "I"
  normalized = normalized.replace(/^[a-z0-9][.)]\s+/, '');

  // 4. Convert written numbers to digits (1-10) for consistency
  const numbers: { [key: string]: string } = {
    one: '1',
    two: '2',
    three: '3',
    four: '4',
    five: '5',
    six: '6',
    seven: '7',
    eight: '8',
    nine: '9',
    ten: '10',
  };
  Object.keys(numbers).forEach((key) => {
    normalized = normalized.replace(new RegExp(`\\b${key}\\b`, 'g'), numbers[key]);
  });

  // 5. Remove all non-alphanumeric (except spaces)
  normalized = normalized.replace(/[^\w\s]/g, '').trim();

  // 6. Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');

  return normalized;
};

/**
 * Compares recognized speech with the expected answer.
 * Returns true if it's a "good enough" match.
 */
export const compareSpeech = (transcript: string, expected: string): boolean => {
  const normSpeech = normalizeText(transcript);
  const normExpected = normalizeText(expected);

  if (!normSpeech || !normExpected) return false;

  // Case 1: Exact match after normalization
  if (normSpeech === normExpected) return true;

  // Case 2: Transcript contains the expected answer
  // (e.g. child says "It is an apple" when expected is "apple")
  if (normSpeech.includes(normExpected)) return true;

  // Case 3: Expected answer contains the transcript
  // ONLY if the transcript is substantial (e.g. > 2 chars)
  // (e.g. child says "apple" when expected is "An apple")
  if (normExpected.includes(normSpeech) && normSpeech.length > 2) {
    return true;
  }

  // Case 4: Word count based matching for longer sentences
  const speechWords = normSpeech.split(' ');
  const expectedWords = normExpected.split(' ');

  if (expectedWords.length >= 3) {
    let matchCount = 0;
    expectedWords.forEach((word) => {
      if (speechWords.includes(word)) matchCount++;
    });

    // If 60% of words match, count as correct (more lenient for kids)
    if (matchCount / expectedWords.length >= 0.6) return true;
  }

  return false;
};
