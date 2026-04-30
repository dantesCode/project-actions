import * as fs from 'fs/promises';
import * as path from 'path';
import { Detector, SuggestedAction } from '../types';

export const goModDetector: Detector = {
  id: 'go-mod',
  fileGlobs: ['go.mod'],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, 'go.mod');

    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const actions: SuggestedAction[] = [];

      const commands = [
        { label: 'build', cmd: 'go build ./...' },
        { label: 'test', cmd: 'go test ./...' },
        { label: 'run', cmd: 'go run .' },
        { label: 'mod tidy', cmd: 'go mod tidy' },
        { label: 'vet', cmd: 'go vet ./...' },
      ];

      for (const c of commands) {
        actions.push({
          id: `go-mod-${c.label.replace(/\s+/g, '-')}`,
          label: c.label,
          command: c.cmd,
          source: 'go.mod',
        });
      }

      return actions;
    } catch {
      return [];
    }
  },
};
