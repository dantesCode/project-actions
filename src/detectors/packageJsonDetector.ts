import * as fs from "fs";
import * as path from "path";
import { SuggestedAction } from "../types";

export function detectPackageJsonScripts(workspaceRoot: string): SuggestedAction[] {
  const filePath = path.join(workspaceRoot, "package.json");
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const pkg = JSON.parse(fs.readFileSync(filePath, "utf-8"));
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
}

export async function detectPackageJsonScriptsAsync(workspaceRoot: string): Promise<SuggestedAction[]> {
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
}
