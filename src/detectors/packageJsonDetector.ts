import * as fs from "fs";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

async function detectPackageManager(workspaceRoot: string): Promise<string> {
  const locks = [
    { file: "bun.lock", cmd: "bun run" },
    { file: "yarn.lock", cmd: "yarn run" },
    { file: "pnpm-lock.yaml", cmd: "pnpm run" },
  ];
  for (const { file, cmd } of locks) {
    try {
      await fs.promises.access(path.join(workspaceRoot, file));
      return cmd;
    } catch {
      // continue
    }
  }
  return "npm run";
}

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
      const pmRun = await detectPackageManager(workspaceRoot);
      return Object.keys(scripts).map((name) => ({
        id: `package-json-${name}`,
        label: name,
        command: `${pmRun} ${name}`,
        source: "package.json",
      }));
    } catch {
      return [];
    }
  },
};
