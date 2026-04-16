import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { detectPackageJsonScripts } from "../../detectors/packageJsonDetector";

suite("detectPackageJsonScripts", () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "proj-"));
  });

  teardown(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test("returns empty array when no package.json", () => {
    assert.deepStrictEqual(detectPackageJsonScripts(tmpDir), []);
  });

  test("detects scripts and maps to npm run commands", () => {
    fs.writeFileSync(
      path.join(tmpDir, "package.json"),
      JSON.stringify({
        scripts: { dev: "vite", test: "jest" },
      }),
    );
    const results = detectPackageJsonScripts(tmpDir);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].command, "npm run dev");
    assert.strictEqual(results[0].source, "package.json");
    assert.strictEqual(results[1].command, "npm run test");
  });

  test("returns empty when scripts key is missing", () => {
    fs.writeFileSync(path.join(tmpDir, "package.json"), JSON.stringify({ name: "foo" }));
    assert.deepStrictEqual(detectPackageJsonScripts(tmpDir), []);
  });

  test("returns empty on malformed JSON", () => {
    fs.writeFileSync(path.join(tmpDir, "package.json"), "not-json{{{");
    assert.deepStrictEqual(detectPackageJsonScripts(tmpDir), []);
  });
});
