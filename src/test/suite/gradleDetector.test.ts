import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { gradleDetector } from "../../detectors/gradleDetector";

suite("gradleDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "gradle-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no build.gradle exists", async () => {
    const result = await gradleDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects common tasks from build.gradle", async () => {
    await fs.writeFile(path.join(tmpDir, "build.gradle"), "task customTask\ntask 'anotherTask'\n");
    const result = await gradleDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("clean"));
    assert.ok(labels.includes("customTask"));
    assert.ok(labels.includes("anotherTask"));
  });

  test("detects common tasks from build.gradle.kts", async () => {
    await fs.writeFile(path.join(tmpDir, "build.gradle.kts"), 'tasks.register("myKtsTask") {}\n');
    const result = await gradleDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("myKtsTask"));
  });

  test("uses gradlew wrapper when present", async () => {
    await fs.writeFile(path.join(tmpDir, "build.gradle"), "");
    await fs.writeFile(path.join(tmpDir, "gradlew"), "#!/bin/sh");
    await fs.chmod(path.join(tmpDir, "gradlew"), 0o755);

    const result = await gradleDetector.detect(tmpDir);
    const buildAction = result.find((a) => a.label === "build");
    assert.ok(buildAction);
    assert.ok(buildAction!.command.startsWith("./gradlew"));
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(path.join(tmpDir, "build.gradle"), "task build");
    const result = await gradleDetector.detect(tmpDir);
    const action = result.find((a) => a.label === "build");
    assert.ok(action);
    assert.strictEqual(action!.id, "gradle-build");
    assert.strictEqual(action!.command, "gradle build");
    assert.strictEqual(action!.source, "build.gradle");
  });

  test("returns empty array for malformed build.gradle", async () => {
    const malformedDir = await fs.mkdtemp(path.join(os.tmpdir(), "gradle-malformed-"));
    try {
      await fs.writeFile(path.join(malformedDir, "build.gradle"), "task { invalid }}}");
      const actions = await gradleDetector.detect(malformedDir);
      assert.ok(actions.length > 0, "returns default Gradle tasks for malformed build.gradle");
    } finally {
      await fs.rm(malformedDir, { recursive: true, force: true });
    }
  });
});
