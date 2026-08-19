import { describe, it, expect } from 'vitest';
import { csvField } from './csvExport';

describe('csvField', () => {
  it('passes plain values through unquoted', () => {
    expect(csvField('Jane Doe')).toBe('Jane Doe');
    expect(csvField(42)).toBe('42');
  });

  it('treats null/undefined as an empty field', () => {
    expect(csvField(null)).toBe('');
    expect(csvField(undefined)).toBe('');
  });

  it('quotes and escapes a value containing a comma', () => {
    expect(csvField('Doe, Jane')).toBe('"Doe, Jane"');
  });

  it('quotes and doubles embedded quotes', () => {
    expect(csvField('She said "hi"')).toBe('"She said ""hi"""');
  });

  it('quotes a value containing a newline', () => {
    expect(csvField('line1\nline2')).toBe('"line1\nline2"');
  });
});
