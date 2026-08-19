// Escapes a CSV field per RFC 4180: wraps in quotes and doubles any embedded
// quotes whenever the value contains a comma, quote, or newline.
export function csvField(value: unknown): string {
  const str = value === null || value === undefined ? '' : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function downloadCSV(header: string[], rows: unknown[][], filenameBase: string) {
  const csv = [header, ...rows].map((row) => row.map(csvField).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeName = (filenameBase || 'export').replace(/[^a-z0-9-_]+/gi, '-');
  link.href = url;
  link.download = `${safeName}-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
