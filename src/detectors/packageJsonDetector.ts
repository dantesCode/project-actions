import * as fs from "fs";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

export const packageJsonDetector: Detector = {
  id: "package-json",
  fileGlobs: ["package.json"],
  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, "package.json");
    try {
      await fs.promises.access(filePath);
    } catch {
      return [];
    }

    try {
      const content = await fs.promises.readFile(filePath, "utf-8");
      const pkg = JSON.parse(content);
      const scripts: Record<string, string> = pkg.scripts ?? {};
      return Object.keys(scripts).map((name) => ({
        id: `package-json-${name}`,
        label: name,
        command: `npm run ${name}`,
        source: "package.json",
      }));
    } catch {
      return [];
    }
  },
};
