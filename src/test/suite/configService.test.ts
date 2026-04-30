import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import {
  createConfigFile,
  addSuggestionToConfig,
  removeActionFromConfig,
  createGroupInWorkspaceConfig,
  moveActionInWorkspaceConfig,
  readWorkspaceConfig,
  createEmptyConfig,
} from "../../configService";

suite("configService", () => {
  let tmpDir: string;
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;
  let originalAppName: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-actions-config-service-"));
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

  suite("createConfigFile", () => {
    test("creates config file in .vscode directory", () => {
      const result = createConfigFile();

      assert.strictEqual(result.ok, true);
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      assert.strictEqual(fs.existsSync(configPath), true);
    });

    test("returns error when config already exists", () => {
      createConfigFile();
      const result = createConfigFile();

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "Config file already exists.");
    });

    test("returns error when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = createConfigFile();

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "No workspace folder open.");
    });
  });

  suite("createEmptyConfig", () => {
    test("creates config with General group", () => {
      const config = createEmptyConfig();

      assert.strictEqual(config.groups.length, 1);
      assert.strictEqual(config.groups[0].id, "general");
      assert.strictEqual(config.groups[0].label, "General");
      assert.deepStrictEqual(config.groups[0].actions, []);
    });
  });

  suite("readWorkspaceConfig", () => {
    test("returns null when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = readWorkspaceConfig({ createIfMissing: false });

      assert.strictEqual(result, null);
    });

    test("returns null when config does not exist and createIfMissing is false", () => {
      const result = readWorkspaceConfig({ createIfMissing: false });

      assert.strictEqual(result, null);
    });

    test("returns empty config when file does not exist and createIfMissing is true", () => {
      const result = readWorkspaceConfig({ createIfMissing: true });

      assert.notStrictEqual(result, null);
      assert.deepStrictEqual(result!.config.groups, []);
    });

    test("returns parsed config when file exists", () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = { groups: [{ id: "test", label: "Test", actions: [] }] };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = readWorkspaceConfig({ createIfMissing: false });

      assert.notStrictEqual(result, null);
      assert.deepStrictEqual(result!.config.groups, config.groups);
    });
  });

  suite("addSuggestionToConfig", () => {
    test("adds suggestion to empty config", async () => {
      const suggestion = {
        id: "dev",
        label: "Dev",
        command: "npm run dev",
        source: "package.json",
      };
      const result = await addSuggestionToConfig(suggestion);

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.message, '"Dev" added to Project Scripts.');

      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      assert.strictEqual(saved.groups.length, 1);
      assert.strictEqual(saved.groups[0].actions.length, 1);
      assert.strictEqual(saved.groups[0].actions[0].id, "dev");
    });

    test("returns already exists message when action id is duplicate", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
        ],
      };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const suggestion = {
        id: "dev",
        label: "Dev 2",
        command: "npm run dev2",
        source: "package.json",
      };
      const result = await addSuggestionToConfig(suggestion);

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, '"Dev 2" is already in Project Scripts.');
    });

    test("adds to first group when config has groups", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = { groups: [{ id: "deploy", label: "Deploy", actions: [] }] };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const suggestion = {
        id: "dev",
        label: "Dev",
        command: "npm run dev",
        source: "package.json",
      };
      await addSuggestionToConfig(suggestion);

      const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      assert.strictEqual(saved.groups[0].id, "deploy");
      assert.strictEqual(saved.groups[0].actions[0].id, "dev");
    });
  });

  suite("removeActionFromConfig", () => {
    test("removes action and returns success", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
        ],
      };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await removeActionFromConfig("dev");

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.message, '"Dev" removed from Project Scripts.');

      const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      assert.deepStrictEqual(saved.groups[0].actions, []);
    });

    test("returns error when action not found", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = { groups: [{ id: "general", label: "General", actions: [] }] };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await removeActionFromConfig("nonexistent");

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "Action not found in config.");
    });
  });

  suite("createGroupInWorkspaceConfig", () => {
    test("creates group and returns success", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = { groups: [{ id: "general", label: "General", actions: [] }] };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await createGroupInWorkspaceConfig("Deploy");

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.message, 'Category "Deploy" created.');

      const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      assert.strictEqual(saved.groups.length, 2);
      assert.strictEqual(saved.groups[1].id, "deploy");
      assert.strictEqual(saved.groups[1].label, "Deploy");
    });

    test("rejects empty label", async () => {
      const result = await createGroupInWorkspaceConfig("   ");

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "Category name cannot be empty.");
    });

    test("rejects duplicate category label", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = { groups: [{ id: "deploy", label: "Deploy", actions: [] }] };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await createGroupInWorkspaceConfig("Deploy");

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "A category with this name already exists.");
    });
  });

  suite("moveActionInWorkspaceConfig", () => {
    test("moves action to different category", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
          { id: "deploy", label: "Deploy", actions: [] },
        ],
      };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await moveActionInWorkspaceConfig("dev", { targetGroupId: "deploy" });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.changed, true);

      const saved = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      assert.deepStrictEqual(saved.groups[0].actions, []);
      assert.deepStrictEqual(saved.groups[1].actions[0].id, "dev");
    });

    test("returns no change when moving to same category without beforeActionId", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
        ],
      };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await moveActionInWorkspaceConfig("dev", { targetGroupId: "general" });

      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.changed, false);
    });

    test("returns error when target group not found", async () => {
      const configPath = path.join(tmpDir, ".vscode", "project-actions.json");
      const config = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
        ],
      };
      fs.mkdirSync(path.join(tmpDir, ".vscode"), { recursive: true });
      fs.writeFileSync(configPath, JSON.stringify(config));

      const result = await moveActionInWorkspaceConfig("dev", { targetGroupId: "nonexistent" });

      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.message, "Target category not found.");
    });
  });
});
