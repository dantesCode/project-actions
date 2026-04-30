import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { composerJsonDetector } from "../../detectors/composerJsonDetector";

suite("composerJsonDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "comp-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no composer.json exists", async () => {
    const result = await composerJsonDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects scripts and maps to composer run-script commands", async () => {
    await fs.writeFile(
      path.join(tmpDir, "composer.json"),
      JSON.stringify({
        scripts: { test: "phpunit", "cs-fix": "php-cs-fixer fix" },
      }),
    );
    const result = await composerJsonDetector.detect(tmpDir);
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].command, "composer run-script test");
    assert.strictEqual(result[0].source, "composer.json");
  });

  test("returns empty array when scripts key is missing", async () => {
    await fs.writeFile(
      path.join(tmpDir, "composer.json"),
      JSON.stringify({ name: "my/pkg" }),
    );
    const result = await composerJsonDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("returns empty array on malformed JSON", async () => {
    await fs.writeFile(path.join(tmpDir, "composer.json"), "not-json{{{");
    const result = await composerJsonDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });
});
