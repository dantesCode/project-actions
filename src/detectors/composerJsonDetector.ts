import * as fs from 'fs';
import * as path from 'path';
import { SuggestedAction } from './packageJsonDetector';

export function detectComposerJsonScripts(workspaceRoot: string): SuggestedAction[] {
  const filePath = path.join(workspaceRoot, 'composer.json');
  if (!fs.existsSync(filePath)) {
    return [];
  }

  try {
    const composer = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const scripts: Record<string, unknown> = composer.scripts ?? {};
    return Object.keys(scripts).map(name => ({
      id: `composer-json-${name}`,
      label: name,
      command: `composer run-script ${name}`,
      source: 'composer.json',
    }));
  } catch {
    return [];
  }
}
