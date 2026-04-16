import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { createGroupInWorkspaceConfig } from "../../configWriter";

suite("configWriter", () => {
  let tmpDir: string;
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;
  let originalAppName: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-actions-config-writer-"));
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    originalAppName = vscode.env.appName;

    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      configurable: true,
      value: [{ uri: vscode.Uri.file(tmpDir), name: "tmp", index: 0 }],
    });

    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "Visual Studio Code",
    });
  });

  teardown(() => {
    Object.defineProperty(vscode.workspace, "workspaceFolders", {
      configurable: true,
      value: originalWorkspaceFolders,
    });

    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: originalAppName,
    });

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test("creates the first category without adding an empty General category", async () => {
    const infoMessages: string[] = [];
    const originalShowInformationMessage = vscode.window.showInformationMessage;

    Object.defineProperty(vscode.window, "showInformationMessage", {
      configurable: true,
      value: (message: string) => {
        infoMessages.push(message);
        return Promise.resolve(undefined);
      },
    });

    try {
      let refreshed = false;

      await createGroupInWorkspaceConfig("Deploy", () => {
        refreshed = true;
      });

      assert.strictEqual(refreshed, true);

      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = JSON.parse(fs.readFileSync(configPath, "utf-8")) as {
        groups: Array<{ id: string; label: string; actions: unknown[] }>;
      };

      assert.deepStrictEqual(config.groups, [{ id: "deploy", label: "Deploy", actions: [] }]);
      assert.deepStrictEqual(infoMessages, ['Category "Deploy" created.']);
    } finally {
      Object.defineProperty(vscode.window, "showInformationMessage", {
        configurable: true,
        value: originalShowInformationMessage,
      });
    }
  });
});
