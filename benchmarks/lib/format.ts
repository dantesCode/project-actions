export function formatSize(bytes: number): string {
  if (bytes === 0) {
    return "0.0 KB";
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  if (mb < 1024) {
    return `${mb.toFixed(1)} MB`;
  }
  return `${(mb / 1024).toFixed(1)} GB`;
}

export function printTable(
  title: string,
  headers: string[],
  rows: Record<string, string | number>[],
): void {
  const colWidths = headers.map((h) => {
    const headerLen = h.length;
    const maxValLen = Math.max(...rows.map((r) => String(r[h]).length));
    return Math.max(headerLen, maxValLen);
  });

  const totalWidth = colWidths.reduce((a, b) => a + b, 0) + (colWidths.length - 1) * 2;

  console.log(title);
  console.log("─".repeat(totalWidth));
  console.log(
    headers.map((h, i) => (i === 0 ? h.padEnd(colWidths[i]) : h.padStart(colWidths[i]))).join("  "),
  );
  for (const row of rows) {
    const cells = headers.map((h, i) => {
      const val = String(row[h]);
      return i === 0 ? val.padEnd(colWidths[i]) : val.padStart(colWidths[i]);
    });
    console.log(cells.join("  "));
  }
  console.log("─".repeat(totalWidth));
}
