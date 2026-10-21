import { describe, expect, it } from 'vitest';
import { BubbleBox, spreadBubbles } from '../utils/bubbleLayout';

const overlaps = (boxes: BubbleBox[], shifts: Map<number, number>) =>
  boxes.some((a, i) =>
    boxes.slice(i + 1).some((b) => {
      const ay = a.cy + shifts.get(a.id)!;
      const by = b.cy + shifts.get(b.id)!;
      return Math.abs(a.cx - b.cx) < (a.w + b.w) / 2 && Math.abs(ay - by) < (a.h + b.h) / 2;
    })
  );

describe('spreadBubbles', () => {
  it('leaves bubbles that do not touch where they are', () => {
    const shifts = spreadBubbles([
      { id: 1, cx: 50, cy: 50, w: 40, h: 20 },
      { id: 2, cx: 150, cy: 50, w: 40, h: 20 },
    ]);
    expect(shifts.get(1)).toBe(0);
    expect(shifts.get(2)).toBe(0);
  });

  it('moves a stacked bubble the shorter way', () => {
    // 2 sits mostly below 1, so it goes down to 1's bottom (60) + gap
    const shifts = spreadBubbles(
      [
        { id: 1, cx: 50, cy: 50, w: 60, h: 20 },
        { id: 2, cx: 60, cy: 55, w: 60, h: 20 },
      ],
      4
    );
    expect(shifts.get(1)).toBe(0);
    expect(shifts.get(2)).toBe(64 - 45);
  });

  it('spreads a dense block apart without leaving the page', () => {
    // eight answers in a 100-unit strip near the bottom of a 540-unit page
    const boxes = Array.from({ length: 8 }, (_, i) => ({
      id: i + 1,
      cx: 200 + (i % 2) * 90,
      cy: 400 + Math.floor(i / 2) * 25,
      w: 120,
      h: 38,
    }));
    const shifts = spreadBubbles(boxes, 4, 540);
    expect(overlaps(boxes, shifts)).toBe(false);
    for (const b of boxes) {
      const y = b.cy + shifts.get(b.id)!;
      expect(y - b.h / 2).toBeGreaterThanOrEqual(0);
      expect(y + b.h / 2).toBeLessThanOrEqual(540);
    }
  });
});
