import * as fs from 'fs/promises';
import * as path from 'path';
import { Detector, SuggestedAction } from '../types';

export const cargoTomlDetector: Detector = {
  id: 'cargo-toml',
  fileGlobs: ['Cargo.toml'],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, 'Cargo.toml');

    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      const actions: SuggestedAction[] = [];

      const commands = [
        { label: 'build', cmd: 'cargo build' },
        { label: 'test', cmd: 'cargo test' },
        { label: 'run', cmd: 'cargo run' },
        { label: 'check', cmd: 'cargo check' },
        { label: 'clippy', cmd: 'cargo clippy' },
        { label: 'fmt', cmd: 'cargo fmt' },
      ];

      for (const c of commands) {
        actions.push({
          id: `cargo-toml-${c.label}`,
          label: c.label,
          command: c.cmd,
          source: 'Cargo.toml',
        });
      }

      // Detect workspace members from [workspace] members = [...]
      const workspaceMatch = raw.match(/\[workspace\]/);
      if (workspaceMatch) {
        actions.push({
          id: 'cargo-toml-build-workspace',
          label: 'build --workspace',
          command: 'cargo build --workspace',
          source: 'Cargo.toml',
        });
      }

      return actions;
    } catch {
      return [];
    }
  },
};
