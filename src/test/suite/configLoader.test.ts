import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import {
  loadConfig,
  loadConfigAsync,
  getConfigPathForWorkspace,
  getConfigDirForWorkspace,
} from "../../configLoader";
import { invalidateCache } from "../../ideDetector";

suite("configLoader", () => {
  let tmpDir: string;
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;
  let originalAppName: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "project-actions-config-loader-"));
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    originalAppName = vscode.env.appName;

    // Invalidate IDE cache so detectIde() picks up new appName
    invalidateCache();

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

    invalidateCache();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  suite("loadConfig", () => {
    test("returns error when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = loadConfig();

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "No workspace folder is open.");
    });

    test("returns NO_CONFIG when config file does not exist", () => {
      const result = loadConfig();

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "NO_CONFIG");
    });

    test("returns valid config when valid JSON exists", () => {
      const configDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(configDir, { recursive: true });
      const config = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };
      fs.writeFileSync(path.join(configDir, "project-actions.json"), JSON.stringify(config));

      const result = loadConfig();

      assert.strictEqual(result.valid, true);
      if (result.config) {
        assert.strictEqual(result.config.groups.length, 1);
        assert.strictEqual(result.config.groups[0].id, "general");
      }
    });

    test("returns parse error for invalid JSON", () => {
      const configDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(path.join(configDir, "project-actions.json"), "{ bad json");

      const result = loadConfig();

      assert.strictEqual(result.valid, false);
      assert.ok(result.error && result.error.includes("Could not parse project-actions.json"));
    });

    test("returns validation error for invalid config structure", () => {
      const configDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(configDir, { recursive: true });
      fs.writeFileSync(
        path.join(configDir, "project-actions.json"),
        JSON.stringify({ not: "valid" }),
      );

      const result = loadConfig();

      assert.strictEqual(result.valid, false);
      assert.ok(result.error);
    });

    test("resolves config path for Cursor IDE", () => {
      invalidateCache();
      Object.defineProperty(vscode.env, "appName", {
        configurable: true,
        value: "Cursor",
      });

      const cursorDir = path.join(tmpDir, ".cursor");
      fs.mkdirSync(cursorDir, { recursive: true });
      const config = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };
      fs.writeFileSync(path.join(cursorDir, "project-actions.json"), JSON.stringify(config));

      // Also create .vscode dir to ensure Cursor path is preferred
      const vscodeDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(vscodeDir, { recursive: true });
      fs.writeFileSync(
        path.join(vscodeDir, "project-actions.json"),
        JSON.stringify({ groups: [{ id: "wrong", label: "Wrong", actions: [] }] }),
      );

      const result = loadConfig();

      assert.strictEqual(result.valid, true);
      if (result.config) {
        assert.strictEqual(result.config.groups[0].id, "general");
      }
    });
  });

  suite("loadConfigAsync", () => {
    test("returns error when no workspace folder", async () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = await loadConfigAsync();

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "No workspace folder is open.");
    });

    test("returns NO_CONFIG when config file does not exist", async () => {
      const result = await loadConfigAsync();

      assert.strictEqual(result.valid, false);
      assert.strictEqual(result.error, "NO_CONFIG");
    });

    test("returns valid config when valid JSON exists", async () => {
      const configDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(configDir, { recursive: true });
      const config = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };
      fs.writeFileSync(path.join(configDir, "project-actions.json"), JSON.stringify(config));

      const result = await loadConfigAsync();

      assert.strictEqual(result.valid, true);
      if (result.config) {
        assert.strictEqual(result.config.groups.length, 1);
        assert.strictEqual(result.config.groups[0].id, "general");
      }
    });
  });

  suite("getConfigPathForWorkspace", () => {
    test("returns null when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = getConfigPathForWorkspace();

      assert.strictEqual(result, null);
    });

    test("returns config path for VS Code", () => {
      const result = getConfigPathForWorkspace();

      assert.notStrictEqual(result, null);
      assert.ok(result!.endsWith(".vscode/project-actions.json"));
    });

    test("returns config path for Cursor", () => {
      invalidateCache();
      Object.defineProperty(vscode.env, "appName", {
        configurable: true,
        value: "Cursor",
      });

      const result = getConfigPathForWorkspace();

      assert.notStrictEqual(result, null);
      assert.ok(result!.endsWith(".cursor/project-actions.json"));
    });
  });

  suite("getConfigDirForWorkspace", () => {
    test("returns null when no workspace folder", () => {
      Object.defineProperty(vscode.workspace, "workspaceFolders", {
        configurable: true,
        value: undefined,
      });

      const result = getConfigDirForWorkspace();

      assert.strictEqual(result, null);
    });

    test("returns config dir for VS Code", () => {
      const result = getConfigDirForWorkspace();

      assert.notStrictEqual(result, null);
      assert.ok(result!.endsWith(".vscode"));
    });

    test("returns config dir for Cursor", () => {
      invalidateCache();
      Object.defineProperty(vscode.env, "appName", {
        configurable: true,
        value: "Cursor",
      });

      const result = getConfigDirForWorkspace();

      assert.notStrictEqual(result, null);
      assert.ok(result!.endsWith(".cursor"));
    });
  });
});
