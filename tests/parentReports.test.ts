import { describe, expect, it } from 'vitest';
import { parentReportRecipients } from '../src/services/parentReports';

describe('parentReportRecipients', () => {
  it('gives each student only their own note, skips pending invites, dedupes', () => {
    const result = parentReportRecipients(
      ['a', 'b', 'pending:x', 'a'],
      [
        { studentName: 'A', studentUid: 'a', approvedText: 'note for a' },
        { studentName: 'Walk-in', studentUid: null, approvedText: 'no account' },
        { studentName: 'C', studentUid: 'c', approvedText: 'note for c' },
      ]
    );
    expect(result).toEqual([
      { studentUid: 'a', note: 'note for a' },
      { studentUid: 'b', note: null },
      { studentUid: 'c', note: 'note for c' },
    ]);
  });
});
