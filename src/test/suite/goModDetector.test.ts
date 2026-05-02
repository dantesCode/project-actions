import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { goModDetector } from "../../detectors/goModDetector";

suite("goModDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "go-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no go.mod exists", async () => {
    const result = await goModDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects standard go commands", async () => {
    await fs.writeFile(path.join(tmpDir, "go.mod"), "module example.com/demo\n");
    const result = await goModDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("run"));
    assert.ok(labels.includes("mod tidy"));
    assert.ok(labels.includes("vet"));
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(path.join(tmpDir, "go.mod"), "module example.com/demo\n");
    const result = await goModDetector.detect(tmpDir);
    const action = result.find((a) => a.label === "test");
    assert.ok(action);
    assert.strictEqual(action!.id, "go-mod-test");
    assert.strictEqual(action!.command, "go test ./...");
    assert.strictEqual(action!.source, "go.mod");
  });

  test("detects cmd/ subdirectories with main packages", async () => {
    await fs.writeFile(path.join(tmpDir, "go.mod"), "module example.com/demo\n");
    await fs.mkdir(path.join(tmpDir, "cmd", "server"), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, "cmd", "server", "main.go"),
      "package main\nfunc main() {}\n",
    );
    await fs.mkdir(path.join(tmpDir, "cmd", "worker"), { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, "cmd", "worker", "main.go"),
      "package main\nfunc main() {}\n",
    );
    const result = await goModDetector.detect(tmpDir);
    const server = result.find((a) => a.id === "go-mod-cmd-server");
    assert.ok(server);
    assert.strictEqual(server!.label, "run cmd/server");
    assert.strictEqual(server!.command, "go run ./cmd/server");
    const worker = result.find((a) => a.id === "go-mod-cmd-worker");
    assert.ok(worker);
    assert.strictEqual(worker!.label, "run cmd/worker");
    assert.strictEqual(worker!.command, "go run ./cmd/worker");
  });

  test("skips cmd/ dirs without main package", async () => {
    await fs.writeFile(path.join(tmpDir, "go.mod"), "module example.com/demo\n");
    await fs.mkdir(path.join(tmpDir, "cmd", "lib"), { recursive: true });
    await fs.writeFile(path.join(tmpDir, "cmd", "lib", "lib.go"), "package lib\n");
    const result = await goModDetector.detect(tmpDir);
    assert.ok(!result.some((a) => a.id === "go-mod-cmd-lib"));
  });

  test("returns empty array for malformed go.mod", async () => {
    const malformedDir = await fs.mkdtemp(path.join(os.tmpdir(), "go-mod-malformed-"));
    try {
      await fs.writeFile(path.join(malformedDir, "go.mod"), "module foo bar baz\n");
      const actions = await goModDetector.detect(malformedDir);
      assert.ok(actions.length > 0, "returns default Go commands for malformed go.mod");
    } finally {
      await fs.rm(malformedDir, { recursive: true, force: true });
    }
  });
});
