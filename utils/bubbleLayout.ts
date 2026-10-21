export interface BubbleBox {
  id: number;
  cx: number;
  cy: number;
  w: number;
  h: number;
}

// Answer bubbles sit on each answer's center, so dense rows collide. Walk them
// in reading order and move each one up or down by the smallest amount that
// clears every bubble already placed, staying inside the page when it can.
// Returns the vertical shift per bubble id, in the same units as the boxes.
// ponytail: greedy and vertical only, O(n³) worst case; fine for a
// worksheet's few dozen bubbles.
export function spreadBubbles(
  boxes: BubbleBox[],
  gap = 4,
  pageHeight = Infinity
): Map<number, number> {
  const placed: { x0: number; x1: number; y0: number; y1: number }[] = [];
  const shifts = new Map<number, number>();
  const order = [...boxes].sort((a, b) => a.cy - b.cy || a.cx - b.cx);

  for (const b of order) {
    const x0 = b.cx - b.w / 2;
    const x1 = b.cx + b.w / 2;
    const startY = b.cy - b.h / 2;
    const row = placed.filter((p) => x0 < p.x1 + gap && x1 > p.x0 - gap);
    const clear = (y: number) => row.every((p) => y >= p.y1 + gap || y + b.h <= p.y0 - gap);
    const inPage = (y: number) => y >= 0 && y + b.h <= pageHeight;

    // the only useful spots: where it is, or flush above/below a neighbour
    const candidates = [startY, ...row.flatMap((p) => [p.y1 + gap, p.y0 - gap - b.h])].sort(
      (a, c) => Math.abs(a - startY) - Math.abs(c - startY)
    );
    const y0 = candidates.find((y) => clear(y) && inPage(y)) ?? candidates.find(clear) ?? startY;

    placed.push({ x0, x1, y0, y1: y0 + b.h });
    shifts.set(b.id, y0 - startY);
  }
  return shifts;
}
