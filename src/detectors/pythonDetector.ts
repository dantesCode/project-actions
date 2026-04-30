import * as fs from "fs/promises";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

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
      actions.push(
        {
          id: "python-pip-install",
          label: "pip install -e .",
          command: "pip install -e .",
          source: "pyproject.toml",
        },
        {
          id: "python-build",
          label: "build",
          command: "python -m build",
          source: "pyproject.toml",
        },
        { id: "python-pytest", label: "pytest", command: "pytest", source: "pyproject.toml" },
      );
    } else if (foundFile === "setup.py") {
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
      actions.push(
        { id: "python-cfg-build", label: "build", command: "python -m build", source: "setup.cfg" },
        { id: "python-cfg-pytest", label: "pytest", command: "pytest", source: "setup.cfg" },
      );
    }

    return actions;
  },
};
