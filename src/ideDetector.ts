import * as vscode from "vscode";

export type IdeType = "vscode" | "cursor" | "vscodium" | "other";

export interface IdeInfo {
  type: IdeType;
  appName: string;
  configDir: string;
  configFile: string;
}

const IDE_CONFIG_DIRS: Record<IdeType, string> = {
  vscode: ".vscode",
  cursor: ".cursor",
  vscodium: ".vscodium",
  other: ".vscode",
};

const IDE_APP_NAME_PATTERNS: Record<IdeType, string[]> = {
  vscode: ["Visual Studio Code", "VS Code"],
  cursor: ["Cursor"],
  vscodium: ["VSCodium"],
  other: [],
};

let cachedIde: IdeInfo | undefined = undefined;

export function invalidateCache(): void {
  cachedIde = undefined;
}

export function detectIde(): IdeInfo {
  if (cachedIde) {
    return cachedIde;
  }

  const appName = vscode.env.appName;
  let type: IdeType = "vscode";

  for (const [ideType, patterns] of Object.entries(IDE_APP_NAME_PATTERNS)) {
    if (patterns.some((pattern) => new RegExp(`\\b${pattern.toLowerCase()}\\b`).test(appName.toLowerCase()))) {
      type = ideType as IdeType;
      break;
    }
  }

  const configDir = IDE_CONFIG_DIRS[type];
  const configFile = `${configDir}/project-actions.json`;

  const ide: IdeInfo = { type, appName, configDir, configFile };
  cachedIde = ide;
  return ide;
}

export function getConfigPath(root: string, ide: IdeInfo): string {
  return `${root}/${ide.configFile}`;
}

export function getConfigDir(root: string, ide: IdeInfo): string {
  return `${root}/${ide.configDir}`;
}
