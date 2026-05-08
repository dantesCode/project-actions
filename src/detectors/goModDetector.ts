import * as fs from "fs/promises";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

async function hasMainPackage(dirPath: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith(".go")) {
        const content = await fs.readFile(path.join(dirPath, entry.name), "utf-8");
        if (/^\s*package\s+main\b/m.test(content)) {
          return true;
        }
      }
    }
  } catch {
    return false;
  }
  return false;
}

export const goModDetector: Detector = {
  id: "go-mod",
  fileGlobs: ["go.mod"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, "go.mod");

    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const actions: SuggestedAction[] = [];

      const commands = [
        { label: "build", cmd: "go build ./..." },
        { label: "test", cmd: "go test ./..." },
        { label: "run", cmd: "go run ." },
        { label: "mod tidy", cmd: "go mod tidy" },
        { label: "vet", cmd: "go vet ./..." },
      ];

      for (const c of commands) {
        actions.push({
          id: `go-mod-${c.label.replace(/\s+/g, "-")}`,
          label: c.label,
          command: c.cmd,
          source: "go.mod",
        });
      }

      // Detect cmd/ subdirectories with main packages
      const cmdDir = path.join(workspaceRoot, "cmd");
      try {
        const entries = await fs.readdir(cmdDir, { withFileTypes: true });
        const subdirs = entries.filter((e) => e.isDirectory());
        const results = await Promise.all(
          subdirs.map(async (entry) => {
            const subDir = path.join(cmdDir, entry.name);
            const found = await hasMainPackage(subDir);
            return { entry, found };
          }),
        );
        for (const { entry, found } of results) {
          if (found) {
            actions.push({
              id: `go-mod-cmd-${entry.name}`,
              label: `run cmd/${entry.name}`,
              command: `go run ./cmd/${entry.name}`,
              source: "go.mod",
            });
          }
        }
      } catch {
        // cmd/ does not exist
      }

      return actions;
    } catch {
      return [];
    }
  },
};
