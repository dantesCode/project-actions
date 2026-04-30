import * as fs from 'fs/promises';
import * as path from 'path';
import { Detector, SuggestedAction } from '../types';

export const pomXmlDetector: Detector = {
  id: 'pom-xml',
  fileGlobs: ['pom.xml'],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, 'pom.xml');

    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const actions: SuggestedAction[] = [];

      // Standard Maven lifecycle phases
      const phases = ['clean', 'compile', 'test', 'package', 'verify', 'install', 'deploy'];

      // Detect Maven wrapper (mvnw)
      let mvnCmd = 'mvn';
      try {
        await fs.access(path.join(workspaceRoot, 'mvnw'));
        mvnCmd = './mvnw';
      } catch {
        // use default mvn
      }

      // Add lifecycle phases
      for (const phase of phases) {
        actions.push({
          id: `pom-xml-${phase}`,
          label: phase,
          command: `${mvnCmd} ${phase}`,
          source: 'pom.xml',
        });
      }

      // Detect Maven profiles
      const profileRegex = /<profile>[\s\S]*?<id>([^<]+)<\/id>[\s\S]*?<\/profile>/g;
      let profileMatch: RegExpExecArray | null;
      while ((profileMatch = profileRegex.exec(raw)) !== null) {
        const profileId = profileMatch[1].trim();
        if (profileId) {
          actions.push({
            id: `pom-xml-profile-${profileId}`,
            label: `profile:${profileId}`,
            command: `${mvnCmd} -P${profileId} install`,
            source: 'pom.xml',
          });
        }
      }

      return actions;
    } catch {
      return [];
    }
  },
};
