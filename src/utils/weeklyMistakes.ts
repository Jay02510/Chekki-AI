// "This week" for homework is the Korean calendar week (Monday 00:00 KST),
// the same clock the parent quotas use (see kstDate). It used to mean
// "matches this week's vocab list, any date", which hid every grammar or
// sentence mistake and called a kid "All correct" when no vocab was uploaded.

const KST_OFFSET = 9 * 3_600_000;
const DAY = 86_400_000;

export const kstWeekStart = (now: Date = new Date()): number => {
  const kst = now.getTime() + KST_OFFSET;
  const dayStart = kst - (((kst % DAY) + DAY) % DAY);
  const weekday = new Date(dayStart).getUTCDay(); // 0 = Sunday
  return dayStart - ((weekday + 6) % 7) * DAY - KST_OFFSET;
};

export const isThisKstWeek = (iso: string | undefined | null, now: Date = new Date()): boolean => {
  if (!iso) return false;
  const t = new Date(iso).getTime();
  return Number.isFinite(t) && t >= kstWeekStart(now) && t <= now.getTime();
};

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

interface MissLike {
  question_text?: string;
  correct_answer?: string;
  student_response?: string;
}

/**
 * What a teacher would call this miss: the vocab word it tests (whole-word
 * match, so "cat" no longer matches "category"), otherwise the correct
 * answer itself when it's short enough to read as a word or phrase. Long
 * sentence answers return null: still a mistake, just not a "word".
 */
export function missLabel(m: MissLike, vocab: string[]): string | null {
  const hay = `${m.correct_answer || ''} ${m.question_text || ''}`.toLowerCase();
  const word = vocab.find((w) => w && new RegExp(`(^|[^a-z])${escapeRe(w)}([^a-z]|$)`).test(hay));
  if (word) return word;
  const answer = (m.correct_answer || '').trim().toLowerCase().replace(/[.!?]+$/, '');
  return answer && answer.length <= 30 ? answer : null;
}

/** Most-missed first. Vocab words start at 0 so the list still shows this week's words before any scan. */
export function countMissedWords(misses: MissLike[], vocab: string[]): { word: string; count: number }[] {
  const counts = new Map<string, number>(vocab.map((w) => [w, 0]));
  for (const m of misses) {
    const label = missLabel(m, vocab);
    if (label) counts.set(label, (counts.get(label) || 0) + 1);
  }
  return [...counts].map(([word, count]) => ({ word, count })).sort((a, b) => b.count - a.count);
}
