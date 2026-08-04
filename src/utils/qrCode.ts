export function createQrSvgDataUrl(text: string, size = 180): string {
  const normalized = text.trim();
  const modules = Array.from({ length: size }, () => Array(size).fill(false));
  const margin = Math.floor(size * 0.12);
  const cellSize = Math.max(1, Math.floor((size - margin * 2) / 21));
  const totalCells = 21;
  const offset = margin + Math.floor((size - margin * 2 - totalCells * cellSize) / 2);

  const setFinder = (x: number, y: number) => {
    for (let yy = 0; yy < 7; yy += 1) {
      for (let xx = 0; xx < 7; xx += 1) {
        const isEdge = xx === 0 || xx === 6 || yy === 0 || yy === 6;
        const isCenter = xx >= 2 && xx <= 4 && yy >= 2 && yy <= 4;
        if (isEdge || isCenter) {
          modules[y + yy][x + xx] = true;
        }
      }
    }
  };

  setFinder(0, 0);
  setFinder(totalCells - 7, 0);
  setFinder(0, totalCells - 7);

  const data = normalized.split('').map((char) => char.charCodeAt(0));
  let value = 0;
  for (let i = 0; i < data.length; i += 1) {
    value = (value << 8) + data[i];
  }

  const seed = value % 9973;
  const rand = () => {
    let state = seed;
    state = (state * 1103515245 + 12345) >>> 0;
    return state % 2;
  };

  for (let y = 0; y < totalCells; y += 1) {
    for (let x = 0; x < totalCells; x += 1) {
      const isFinder = (x < 7 && y < 7) || (x > totalCells - 8 && y < 7) || (x < 7 && y > totalCells - 8);
      if (isFinder) continue;
      const bit = rand();
      modules[offset + y][offset + x] = bit === 1;
    }
  }

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="white"/>
    ${Array.from({ length: totalCells }, (_, y) =>
      Array.from({ length: totalCells }, (_, x) => {
        const px = offset + x * cellSize;
        const py = offset + y * cellSize;
        const isActive = modules[offset + y][offset + x];
        return isActive ? `<rect x="${px}" y="${py}" width="${cellSize}" height="${cellSize}" fill="#111827"/>` : '';
      }).join('')
    ).join('')}
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}
