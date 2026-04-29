import * as path from 'path';
import * as fs from 'fs/promises';
import { SuggestedAction, Detector } from '../types';

export const rakefileDetector: Detector = {
  id: 'rakefile',
  fileGlobs: ['Rakefile'],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, 'Rakefile');
    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const lines = raw.split('\n');
      const tasks = new Set<string>();

      // Standard Rake tasks
      tasks.add('default');
      tasks.add('test');

      // Regex matches: task :name, task name, task "name"
      const taskRegex = /^task\s+['":]?(\w+)['"]?\s*(?:,|do|\{|$)/;

      for (const line of lines) {
        const match = line.match(taskRegex);
        if (match) {
          tasks.add(match[1]);
        }
      }

      return Array.from(tasks).map((name) => ({
        id: `rakefile-${name}`,
        label: name,
        command: `rake ${name}`,
        source: 'Rakefile',
      }));
    } catch {
      return [];
    }
  },
};
