import * as fs from "fs/promises";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

function hasTomlSection(raw: string, section: string): boolean {
  const escaped = section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`^\\[${escaped}\\]`, "m");
  return regex.test(raw);
}

function extractTomlTable(raw: string, section: string): string {
  const lines = raw.split("\n");
  let capturing = false;
  const result: string[] = [];
  const target = `[${section}]`;
  for (const line of lines) {
    if (line.trim() === target) {
      capturing = true;
      continue;
    }
    if (capturing && line.trim().startsWith("[")) {
      break;
    }
    if (capturing) {
      result.push(line);
    }
  }
  return result.join("\n");
}

function parseConsoleScripts(content: string): { name: string; module: string }[] {
  const scripts: { name: string; module: string }[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#") || trimmed.length === 0) {
      continue;
    }
    const match = trimmed.match(/^([A-Za-z0-9_-]+)\s*=\s*"?([^"\s:]+):/);
    if (match) {
      scripts.push({ name: match[1], module: match[2] });
    }
  }
  return scripts;
}

function parseSetupPyScripts(raw: string): { name: string; module: string }[] {
  const scripts: { name: string; module: string }[] = [];
  // Match entry_points={...} or entry_points=dict(...)
  const epMatch = raw.match(/entry_points\s*=\s*(?:\{[^}]*\}|dict\([^)]*\))/s);
  if (!epMatch) {
    return scripts;
  }
  const epBlock = epMatch[0];
  // Find console_scripts list inside
  const csMatch = epBlock.match(/['"]console_scripts['"]\s*:\s*\[([^\]]*)\]/s);
  if (!csMatch) {
    return scripts;
  }
  // Split by comma or newline, then process each entry
  const entries = csMatch[1].split(/,|\n/);
  for (const entry of entries) {
    const trimmed = entry.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    // Match "name = module:func" or 'name = module:func'
    const match = trimmed.match(/^['"]?([A-Za-z0-9_-]+)['"]?\s*=\s*['"]?([^'"\s:]+):/);
    if (match) {
      scripts.push({ name: match[1], module: match[2] });
    }
  }
  return scripts;
}

export const pythonDetector: Detector = {
  id: "python",
  fileGlobs: ["pyproject.toml", "setup.py", "setup.cfg"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const candidates = ["pyproject.toml", "setup.py", "setup.cfg"];
    let foundFile: string | undefined;

    for (const name of candidates) {
      const filePath = path.join(workspaceRoot, name);
      try {
        await fs.access(filePath);
        foundFile = name;
        break;
      } catch {
        continue;
      }
    }

    if (foundFile === undefined) {
      return [];
    }

    const actions: SuggestedAction[] = [];

    if (foundFile === "pyproject.toml") {
      const filePath = path.join(workspaceRoot, foundFile);
      const raw = await fs.readFile(filePath, "utf-8");

      // Parse [project.scripts]
      const scriptsTable = extractTomlTable(raw, "project.scripts");
      const scripts = parseConsoleScripts(scriptsTable);
      for (const s of scripts) {
        actions.push({
          id: `python-script-${s.name}`,
          label: s.name,
          command: `python -m ${s.module}`,
          source: "pyproject.toml",
          description: "from [project.scripts]",
        });
      }

      // Baseline: build
      actions.push({
        id: "python-build",
        label: "build",
        command: "python -m build",
        source: "pyproject.toml",
      });

      // Conditional: pip install -e . (skip if Makefile exists)
      const hasMakefile = await hasFile(workspaceRoot, "Makefile");
      const hasBuildSystem = hasTomlSection(raw, "build-system") || hasTomlSection(raw, "tool.setuptools");
      if (!hasMakefile && hasBuildSystem) {
        actions.push({
          id: "python-pip-install",
          label: "pip install -e .",
          command: "pip install -e .",
          source: "pyproject.toml",
        });
      }

      // Conditional: pytest
      if (hasTomlSection(raw, "tool.pytest") || hasTomlSection(raw, "tool.pytest.ini_options")) {
        actions.push({
          id: "python-pytest",
          label: "pytest",
          command: "pytest",
          source: "pyproject.toml",
        });
      }

      // Conditional: tox
      if (hasTomlSection(raw, "tool.tox") || hasTomlSection(raw, "tool.tox.env_list")) {
        actions.push({
          id: "python-tox",
          label: "tox",
          command: "tox",
          source: "pyproject.toml",
        });
      }

      // Conditional: nox
      if (hasTomlSection(raw, "tool.nox") || hasTomlSection(raw, "tool.nox.sessions")) {
        actions.push({
          id: "python-nox",
          label: "nox",
          command: "nox",
          source: "pyproject.toml",
        });
      }
    } else if (foundFile === "setup.py") {
      const filePath = path.join(workspaceRoot, foundFile);
      const raw = await fs.readFile(filePath, "utf-8");

      // Parse entry_points console_scripts
      const scripts = parseSetupPyScripts(raw);
      for (const s of scripts) {
        actions.push({
          id: `python-script-${s.name}`,
          label: s.name,
          command: `python -m ${s.module}`,
          source: "setup.py",
          description: "from entry_points",
        });
      }

      actions.push(
        {
          id: "python-setup-build",
          label: "build",
          command: "python setup.py build",
          source: "setup.py",
        },
        {
          id: "python-setup-test",
          label: "test",
          command: "python setup.py test",
          source: "setup.py",
        },
        {
          id: "python-setup-install",
          label: "install",
          command: "python setup.py install",
          source: "setup.py",
        },
      );
    } else if (foundFile === "setup.cfg") {
      const filePath = path.join(workspaceRoot, foundFile);
      const raw = await fs.readFile(filePath, "utf-8");

      // Parse [options.entry_points] console_scripts
      const epTable = extractTomlTable(raw, "options.entry_points");
      const scripts = parseConsoleScripts(epTable);
      for (const s of scripts) {
        actions.push({
          id: `python-script-${s.name}`,
          label: s.name,
          command: `python -m ${s.module}`,
          source: "setup.cfg",
          description: "from console_scripts",
        });
      }

      actions.push(
        { id: "python-cfg-build", label: "build", command: "python -m build", source: "setup.cfg" },
        { id: "python-cfg-pytest", label: "pytest", command: "pytest", source: "setup.cfg" },
      );
    }

    return actions;
  },
};

async function hasFile(workspaceRoot: string, fileName: string): Promise<boolean> {
  try {
    await fs.access(path.join(workspaceRoot, fileName));
    return true;
  } catch {
    return false;
  }
}
