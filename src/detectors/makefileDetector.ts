import * as fs from "fs";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

export const makefileDetector: Detector = {
  id: "makefile",
  fileGlobs: ["Makefile", "makefile", "GNUmakefile"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const candidates = ["Makefile", "makefile", "GNUmakefile"];
    let content: string | undefined;
    let foundFile: string | undefined;

    for (const name of candidates) {
      const filePath = path.join(workspaceRoot, name);
      try {
        await fs.promises.access(filePath);
        content = await fs.promises.readFile(filePath, "utf-8");
        foundFile = name;
        break;
      } catch {
        continue;
      }
    }

    if (content === undefined) {
      return [];
    }

    const lines = content.split("\n");

    const phonyTargets = new Set<string>();
    for (const line of lines) {
      const phonyMatch = line.match(/^\.PHONY\s*:\s*(.+)/);
      if (phonyMatch) {
        phonyMatch[1]
          .trim()
          .split(/\s+/)
          .forEach((t) => phonyTargets.add(t));
      }
    }

    const TARGET_RE = /^([a-zA-Z0-9][a-zA-Z0-9_\-./]*)(\s*:[^=]|:$)/;
    const allTargets: string[] = [];

    for (const line of lines) {
      if (line.startsWith("#") || line.trim() === "") {
        continue;
      }
      const match = line.match(TARGET_RE);
      if (match) {
        const name = match[1].trim();
        if (!name.includes("%") && !name.startsWith(".")) {
          allTargets.push(name);
        }
      }
    }

    const seen = new Set<string>();
    const targets: string[] = [];
    for (const t of allTargets) {
      if (!seen.has(t)) {
        seen.add(t);
        targets.push(t);
      }
    }

    const finalTargets =
      phonyTargets.size > 0 ? targets.filter((t) => phonyTargets.has(t)) : targets;

    return finalTargets.map((name) => ({
      id: `makefile-${name}`,
      label: name,
      command: `make ${name}`,
      source: foundFile!,
    }));
  },
};
