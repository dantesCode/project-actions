import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import * as vscode from "vscode";
import { loadConfigAsync } from "../../configLoader";
import { validateConfig } from "../../configSchema";
import { detectors } from "../../detectors";
import { invalidateCache } from "../../ideDetector";
import { ProjectActionsConfig } from "../../types";

suite("benchmarks", () => {
  let tmpDir: string;
  let originalWorkspaceFolders: typeof vscode.workspace.workspaceFolders;
  let originalAppName: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "proj-"));
    originalWorkspaceFolders = vscode.workspace.workspaceFolders;
    originalAppName = vscode.env.appName;
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

  suite("config file loading performance", () => {
    test("loadConfigAsync completes within reasonable time", async () => {
      const configDir = path.join(tmpDir, ".vscode");
      fs.mkdirSync(configDir, { recursive: true });

      const config: ProjectActionsConfig = {
        groups: [
          {
            id: "build",
            label: "Build",
            actions: [
              { id: "build-1", label: "Build Project", command: "npm run build" },
              { id: "build-2", label: "Build Watch", command: "npm run build:watch" },
              { id: "build-3", label: "Build Prod", command: "npm run build:prod" },
              { id: "build-4", label: "Clean Build", command: "npm run clean" },
              { id: "build-5", label: "Rebuild", command: "npm run rebuild" },
            ],
          },
          {
            id: "test",
            label: "Test",
            actions: [
              { id: "test-1", label: "Run Tests", command: "npm test" },
              { id: "test-2", label: "Test Watch", command: "npm run test:watch" },
              { id: "test-3", label: "Test Coverage", command: "npm run test:coverage" },
              { id: "test-4", label: "Test Unit", command: "npm run test:unit" },
              { id: "test-5", label: "Test E2E", command: "npm run test:e2e" },
            ],
          },
          {
            id: "dev",
            label: "Development",
            actions: [
              { id: "dev-1", label: "Start Dev", command: "npm run dev" },
              { id: "dev-2", label: "Start Server", command: "npm run server" },
              { id: "dev-3", label: "Lint", command: "npm run lint" },
              { id: "dev-4", label: "Format", command: "npm run format" },
              { id: "dev-5", label: "Type Check", command: "npm run typecheck" },
            ],
          },
        ],
      };

      fs.writeFileSync(path.join(configDir, "project-actions.json"), JSON.stringify(config));

      for (let i = 0; i < 10; i++) {
        await loadConfigAsync();
      }

      const times: number[] = [];
      for (let i = 0; i < 50; i++) {
        const start = performance.now();
        await loadConfigAsync();
        times.push(performance.now() - start);
      }

      const min = Math.min(...times);
      const max = Math.max(...times);
      const mean = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(
        `loadConfigAsync: min=${min.toFixed(3)}ms, max=${max.toFixed(3)}ms, mean=${mean.toFixed(3)}ms`,
      );

      assert.ok(mean < 50, `Mean time ${mean.toFixed(3)}ms should be under 50ms`);
      assert.ok(max < 100, `Max time ${max.toFixed(3)}ms should be under 100ms`);
    });
  });

  suite("detector full pipeline performance", () => {
    test("all detectors complete within reasonable time", async () => {
      const scripts: Record<string, string> = {};
      for (let i = 1; i <= 20; i++) {
        scripts[`script-${i}`] = `echo "Script ${i}"`;
      }

      const packageJson = {
        name: "benchmark-test",
        version: "1.0.0",
        scripts,
      };

      fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify(packageJson, null, 2));

      for (let i = 0; i < 5; i++) {
        await Promise.all(detectors.map((d) => d.detect(tmpDir)));
      }

      const times: number[] = [];
      for (let i = 0; i < 20; i++) {
        const start = performance.now();
        await Promise.all(detectors.map((d) => d.detect(tmpDir)));
        times.push(performance.now() - start);
      }

      const min = Math.min(...times);
      const max = Math.max(...times);
      const mean = times.reduce((a, b) => a + b, 0) / times.length;
      const total = times.reduce((a, b) => a + b, 0);

      console.log(
        `detectors pipeline: min=${min.toFixed(3)}ms, max=${max.toFixed(3)}ms, mean=${mean.toFixed(3)}ms, total=${total.toFixed(3)}ms`,
      );

      assert.ok(
        total < 500,
        `Total time for 20 iterations (${total.toFixed(3)}ms) should be under 500ms`,
      );
      assert.ok(mean < 50, `Mean time ${mean.toFixed(3)}ms should be under 50ms`);
    });
  });

  suite("config validation performance", () => {
    test("validateConfig completes within reasonable time", () => {
      const groups = [];
      for (let g = 1; g <= 5; g++) {
        const actions = [];
        for (let a = 1; a <= 10; a++) {
          actions.push({
            id: `group-${g}-action-${a}`,
            label: `Action ${a} in Group ${g}`,
            command: `echo "Group ${g} Action ${a}"`,
          });
        }
        groups.push({
          id: `group-${g}`,
          label: `Group ${g}`,
          actions,
        });
      }

      const config: ProjectActionsConfig = { groups };

      for (let i = 0; i < 100; i++) {
        validateConfig(config);
      }

      const times: number[] = [];
      for (let i = 0; i < 200; i++) {
        const start = performance.now();
        validateConfig(config);
        times.push(performance.now() - start);
      }

      const min = Math.min(...times);
      const max = Math.max(...times);
      const mean = times.reduce((a, b) => a + b, 0) / times.length;

      console.log(
        `validateConfig: min=${min.toFixed(3)}ms, max=${max.toFixed(3)}ms, mean=${mean.toFixed(3)}ms`,
      );

      assert.ok(mean < 1, `Mean time ${mean.toFixed(3)}ms should be under 1ms`);
      assert.ok(max < 5, `Max time ${max.toFixed(3)}ms should be under 5ms`);
    });
  });
});
