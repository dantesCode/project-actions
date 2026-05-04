import * as fs from "fs";
import * as path from "path";
import { formatSize } from "./lib/format";

const root = process.cwd();

function getFileSize(filePath: string): number {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function getDirSize(dirPath: string): number {
  let total = 0;
  try {
    const entries = fs.readdirSync(dirPath, { recursive: true }) as string[];
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry);
      const stat = fs.statSync(fullPath);
      if (stat.isFile()) {
        total += stat.size;
      }
    }
  } catch {
    return 0;
  }
  return total;
}

function getVsixFiles(): { name: string; size: number }[] {
  try {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    return entries
      .filter((e) => e.isFile() && e.name.endsWith(".vsix"))
      .map((e) => ({ name: e.name, size: getFileSize(path.join(root, e.name)) }));
  } catch {
    return [];
  }
}

const extensionJsSize = getFileSize(path.join(root, "out", "extension.js"));
const vsixFiles = getVsixFiles();
const outDirSize = getDirSize(path.join(root, "out"));
const nodeModulesSize = getDirSize(path.join(root, "node_modules"));

const rows: { label: string; size: number; note?: string }[] = [
  { label: "out/extension.js", size: extensionJsSize },
];

if (vsixFiles.length === 0) {
  rows.push({ label: "VSIX", size: 0, note: "none" });
} else {
  for (const v of vsixFiles) {
    rows.push({ label: "VSIX", size: v.size, note: v.name });
  }
}

rows.push({ label: "out/ total", size: outDirSize });
rows.push({ label: "node_modules/", size: nodeModulesSize });

const maxLabel = Math.max(...rows.map((r) => r.label.length));
const divider = "─".repeat(44);

console.log("Bundle Size Report");
console.log(divider);

for (const row of rows) {
  let line = row.label.padEnd(maxLabel + 4) + formatSize(row.size);
  if (row.note) {
    line += `  (${row.note})`;
  }
  console.log(line);
}
