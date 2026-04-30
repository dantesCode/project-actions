import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { pythonDetector } from "../../detectors/pythonDetector";

suite("pythonDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "python-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no python config exists", async () => {
    const result = await pythonDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects pyproject.toml actions", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("pip install -e ."));
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("pytest"));
  });

  test("detects setup.py actions", async () => {
    await fs.writeFile(path.join(tmpDir, "setup.py"), "from setuptools import setup; setup()\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("install"));
  });

  test("detects setup.cfg actions", async () => {
    await fs.writeFile(path.join(tmpDir, "setup.cfg"), "[metadata]\nname = demo\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("pytest"));
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\n");
    const result = await pythonDetector.detect(tmpDir);
    const action = result.find((a) => a.label === "build");
    assert.ok(action);
    assert.strictEqual(action!.id, "python-build");
    assert.strictEqual(action!.command, "python -m build");
    assert.strictEqual(action!.source, "pyproject.toml");
  });
});
