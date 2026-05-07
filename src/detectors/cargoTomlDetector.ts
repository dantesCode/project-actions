import * as fs from "fs/promises";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

function parseTomlArrayTable(raw: string, tableName: string): Array<Record<string, string>> {
  const entries: Array<Record<string, string>> = [];
  const lines = raw.split("\n");
  let currentEntry: Record<string, string> | null = null;
  let inTargetSection = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith(`[[${tableName}]]`)) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = {};
      inTargetSection = true;
      continue;
    }
    if (trimmed.startsWith("[[") && inTargetSection) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = null;
      inTargetSection = false;
      continue;
    }
    if (trimmed.startsWith("[") && !trimmed.startsWith("[[") && inTargetSection) {
      if (currentEntry) {
        entries.push(currentEntry);
      }
      currentEntry = null;
      inTargetSection = false;
      continue;
    }
    if (inTargetSection && currentEntry) {
      const match = trimmed.match(/^(\w+)\s*=\s*"([^"]*)"$/);
      if (match) {
        currentEntry[match[1]] = match[2];
      } else {
        const singleMatch = trimmed.match(/^(\w+)\s*=\s*'([^']*)'$/);
        if (singleMatch) {
          currentEntry[singleMatch[1]] = singleMatch[2];
        }
      }
    }
  }

  if (currentEntry) {
    entries.push(currentEntry);
  }

  return entries;
}

function extractWorkspaceMembers(raw: string): string[] {
  const lines = raw.split("\n");
  let inWorkspace = false;
  let membersLine = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "[workspace]") {
      inWorkspace = true;
      continue;
    }
    if (inWorkspace) {
      if (trimmed.startsWith("[") && !trimmed.startsWith("[[")) {
        break;
      }
      if (trimmed.startsWith("members")) {
        membersLine = trimmed;
        break;
      }
    }
  }

  if (!membersLine) {
    return [];
  }

  const members: string[] = [];
  const memberRegex = /["']([^"']+)["']/g;
  let m;
  while ((m = memberRegex.exec(membersLine)) !== null) {
    members.push(m[1]);
  }
  return members;
}

export const cargoTomlDetector: Detector = {
  id: "cargo-toml",
  fileGlobs: ["Cargo.toml"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const filePath = path.join(workspaceRoot, "Cargo.toml");

    try {
      await fs.access(filePath);
    } catch {
      return [];
    }

    try {
      const raw = await fs.readFile(filePath, "utf-8");
      const actions: SuggestedAction[] = [];

      const commands = [
        { label: "build", cmd: "cargo build" },
        { label: "test", cmd: "cargo test" },
        { label: "run", cmd: "cargo run" },
        { label: "check", cmd: "cargo check" },
        { label: "clippy", cmd: "cargo clippy" },
        { label: "fmt", cmd: "cargo fmt" },
      ];

      for (const c of commands) {
        actions.push({
          id: `cargo-toml-${c.label}`,
          label: c.label,
          command: c.cmd,
          source: "Cargo.toml",
        });
      }

      const workspaceMatch = raw.match(/\[workspace\]/);
      if (workspaceMatch) {
        actions.push({
          id: "cargo-toml-build-workspace",
          label: "build --workspace",
          command: "cargo build --workspace",
          source: "Cargo.toml",
        });
      }

      const bins = parseTomlArrayTable(raw, "bin");
      for (const bin of bins) {
        if (bin.name) {
          actions.push({
            id: `cargo-toml-bin-${bin.name}`,
            label: `run --bin ${bin.name}`,
            command: `cargo run --bin ${bin.name}`,
            source: "Cargo.toml",
          });
        }
      }

      const examples = parseTomlArrayTable(raw, "example");
      for (const ex of examples) {
        if (ex.name) {
          actions.push({
            id: `cargo-toml-example-${ex.name}`,
            label: `run --example ${ex.name}`,
            command: `cargo run --example ${ex.name}`,
            source: "Cargo.toml",
          });
        }
      }

      const tests = parseTomlArrayTable(raw, "test");
      for (const t of tests) {
        if (t.name) {
          actions.push({
            id: `cargo-toml-test-${t.name}`,
            label: `test --test ${t.name}`,
            command: `cargo test --test ${t.name}`,
            source: "Cargo.toml",
          });
        }
      }

      const benches = parseTomlArrayTable(raw, "bench");
      for (const b of benches) {
        if (b.name) {
          actions.push({
            id: `cargo-toml-bench-${b.name}`,
            label: `bench --bench ${b.name}`,
            command: `cargo bench --bench ${b.name}`,
            source: "Cargo.toml",
          });
        }
      }

      const members = extractWorkspaceMembers(raw);
      if (members.includes("xtask")) {
        actions.push({
          id: "cargo-toml-xtask",
          label: "xtask",
          command: "cargo xtask",
          source: "Cargo.toml",
        });
      }

      return actions;
    } catch {
      return [];
    }
  },
};
