import * as assert from "assert";
import * as vscode from "vscode";
import { detectIde, getConfigPath, getConfigDir, invalidateCache } from "../../ideDetector";

suite("ideDetector cache", () => {
  setup(() => {
    invalidateCache();
  });

  teardown(() => {
    invalidateCache();
  });

  test("detectIde returns consistent result", () => {
    const result1 = detectIde();
    const result2 = detectIde();
    assert.deepStrictEqual(result1, result2);
  });

  test("detectIde returns same object on second call (cached)", () => {
    const result1 = detectIde();
    const result2 = detectIde();
    assert.strictEqual(result1, result2);
  });

  test("invalidateCache causes new object on next call", () => {
    const result1 = detectIde();
    invalidateCache();
    const result2 = detectIde();
    assert.notStrictEqual(result1, result2);
  });
});

suite("ideDetector detection logic", () => {
  let originalAppName: string;

  setup(() => {
    originalAppName = vscode.env.appName;
    invalidateCache();
  });

  teardown(() => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: originalAppName,
    });
    invalidateCache();
  });

  test("detects VS Code from Visual Studio Code", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "Visual Studio Code",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "vscode");
    assert.strictEqual(ide.configDir, ".vscode");
    assert.strictEqual(ide.configFile, ".vscode/project-actions.json");
  });

  test("detects VS Code from VS Code", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "VS Code",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "vscode");
    assert.strictEqual(ide.configDir, ".vscode");
  });

  test("detects Cursor", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "Cursor",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "cursor");
    assert.strictEqual(ide.configDir, ".cursor");
    assert.strictEqual(ide.configFile, ".cursor/project-actions.json");
  });

  test("detects VSCodium", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "VSCodium",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "vscodium");
    assert.strictEqual(ide.configDir, ".vscodium");
    assert.strictEqual(ide.configFile, ".vscodium/project-actions.json");
  });

  test("defaults to vscode for unknown IDE", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "UnknownIDE",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "vscode");
    assert.strictEqual(ide.configDir, ".vscode");
  });

  test("matches cursor case-insensitively", () => {
    Object.defineProperty(vscode.env, "appName", {
      configurable: true,
      value: "CURSOR",
    });
    const ide = detectIde();
    assert.strictEqual(ide.type, "cursor");
    assert.strictEqual(ide.configDir, ".cursor");
  });
});

suite("getConfigPath and getConfigDir", () => {
  test("getConfigPath returns correct path for vscode", () => {
    const ide = { type: "vscode" as const, appName: "VS Code", configDir: ".vscode", configFile: ".vscode/project-actions.json" };
    const result = getConfigPath("/workspace", ide);
    assert.strictEqual(result, "/workspace/.vscode/project-actions.json");
  });

  test("getConfigPath returns correct path for cursor", () => {
    const ide = { type: "cursor" as const, appName: "Cursor", configDir: ".cursor", configFile: ".cursor/project-actions.json" };
    const result = getConfigPath("/workspace", ide);
    assert.strictEqual(result, "/workspace/.cursor/project-actions.json");
  });

  test("getConfigPath returns correct path for vscodium", () => {
    const ide = { type: "vscodium" as const, appName: "VSCodium", configDir: ".vscodium", configFile: ".vscodium/project-actions.json" };
    const result = getConfigPath("/workspace", ide);
    assert.strictEqual(result, "/workspace/.vscodium/project-actions.json");
  });

  test("getConfigDir returns correct dir", () => {
    const ide = { type: "vscode" as const, appName: "VS Code", configDir: ".vscode", configFile: ".vscode/project-actions.json" };
    const result = getConfigDir("/workspace", ide);
    assert.strictEqual(result, "/workspace/.vscode");
  });
});
