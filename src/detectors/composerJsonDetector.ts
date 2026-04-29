import * as path from "path";
import * as fs from "fs/promises";
import { SuggestedAction, Detector } from "../types";

export const composerJsonDetector: Detector = {
  id: "composer-json",
  fileGlobs: ["composer.json"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, "composer.json");
    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const composer = JSON.parse(raw);
      const scripts: Record<string, unknown> = composer.scripts ?? {};
      return Object.keys(scripts).map((name) => ({
        id: `composer-json-${name}`,
        label: name,
        command: `composer run-script ${name}`,
        source: "composer.json",
      }));
    } catch {
      return [];
    }
  },
};
