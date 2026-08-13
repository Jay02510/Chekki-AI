import { describe, it, expect } from 'vitest';
import { parseAiJson } from '../api/_lib/aiJson';

describe('parseAiJson', () => {
  it('parses plain JSON', () => {
    expect(parseAiJson('{"topic": "Weather"}')).toEqual({ topic: 'Weather' });
  });

  it('strips ```json fences', () => {
    const raw = '```json\n{"topic": "Weather"}\n```';
    expect(parseAiJson(raw)).toEqual({ topic: 'Weather' });
  });

  it('strips bare ``` fences', () => {
    const raw = '```\n{"topic": "Weather"}\n```';
    expect(parseAiJson(raw)).toEqual({ topic: 'Weather' });
  });

  it('throws (does not fall back to fake data) on invalid JSON', () => {
    expect(() => parseAiJson('not json at all')).toThrow();
  });

  it('throws on empty input', () => {
    expect(() => parseAiJson('')).toThrow();
  });
});
