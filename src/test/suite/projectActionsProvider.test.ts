import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { ProjectActionsProvider, ActionTreeItem } from "../../projectActionsProvider";

suite("ProjectActionsProvider", () => {
  let tmpDir: string;
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;
  let originalAppName: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-actions-provider-"));
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

  suite("getChildren (root)", () => {
    test("shows Create Config when no config file exists", () => {
      const provider = new ProjectActionsProvider();
      const items = provider.getChildren();

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].contextValue, "createConfig");
      assert.strictEqual(items[0].label, "Create Config File");
    });

    test("shows Open workspace info when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const provider = new ProjectActionsProvider();
      const items = provider.getChildren();

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].contextValue, "info");
      assert.strictEqual(items[0].label, "Open a workspace folder to get started");
    });

    test("shows error item when config is invalid", () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify({ groups: "not an array" }));

      const provider = new ProjectActionsProvider();
      const items = provider.getChildren();

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].contextValue, "error");
      const label = typeof items[0].label === "string" ? items[0].label : items[0].label?.label;
      assert.ok(label?.startsWith("Error loading config:"));
    });

    test("shows empty message when config has no groups", () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify({ groups: [] }));

      const provider = new ProjectActionsProvider();
      const items = provider.getChildren();

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].contextValue, "info");
      assert.strictEqual(items[0].label, "No actions defined yet");
    });

    test("shows groups with sidebar-placed actions", () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          groups: [
            {
              id: "general",
              label: "General",
              actions: [
                { id: "dev", label: "Dev", command: "npm run dev", placements: ["sidebar"] },
                { id: "build", label: "Build", command: "npm run build", placements: ["statusBar"] },
              ],
            },
          ],
        }),
      );

      const provider = new ProjectActionsProvider();
      const items = provider.getChildren();

      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].contextValue, "group");
      assert.strictEqual(items[0].label, "General");
      assert.strictEqual(items[0].children!.length, 1);
      assert.strictEqual(items[0].children![0].label, "Dev");
    });
  });

  suite("getChildren (group)", () => {
    test("returns action children for a group item", () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(
        configPath,
        JSON.stringify({
          groups: [
            {
              id: "general",
              label: "General",
              actions: [
                { id: "dev", label: "Dev", command: "npm run dev", placements: ["sidebar"] },
              ],
            },
          ],
        }),
      );

      const provider = new ProjectActionsProvider();
      const groupItems = provider.getChildren();
      const actionItems = provider.getChildren(groupItems[0]);

      assert.strictEqual(actionItems.length, 1);
      assert.strictEqual(actionItems[0].contextValue, "curatedAction");
      assert.strictEqual(actionItems[0].actionId, "dev");
      assert.strictEqual(actionItems[0].actionCommand, "npm run dev");
    });
  });

  suite("refresh", () => {
    test("fires onDidChangeTreeData event", () => {
      const provider = new ProjectActionsProvider();
      let fired = false;
      provider.onDidChangeTreeData(() => {
        fired = true;
      });

      provider.refresh();

      assert.strictEqual(fired, true);
    });
  });

  suite("ActionTreeItem", () => {
    test("creates item with correct contextValue", () => {
      const item = new ActionTreeItem("Test", "curatedAction");
      assert.strictEqual(item.contextValue, "curatedAction");
      assert.strictEqual(item.label, "Test");
    });

    test("can set action properties", () => {
      const item = new ActionTreeItem("Dev", "curatedAction");
      item.actionId = "dev";
      item.actionCommand = "npm run dev";
      item.actionSource = ".vscode/project-actions.json (General)";
      item.actionTerminalMode = "new";
      item.groupId = "general";

      assert.strictEqual(item.actionId, "dev");
      assert.strictEqual(item.actionCommand, "npm run dev");
      assert.strictEqual(item.actionSource, ".vscode/project-actions.json (General)");
      assert.strictEqual(item.actionTerminalMode, "new");
      assert.strictEqual(item.groupId, "general");
    });
  });
});
