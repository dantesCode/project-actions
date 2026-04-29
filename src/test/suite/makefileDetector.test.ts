import * as assert from "assert";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { makefileDetector } from "../../detectors/makefileDetector";

suite("makefileDetector", () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "makefile-"));
  });

  teardown(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  function writeMakefile(content: string, name = "Makefile"): void {
    fs.writeFileSync(path.join(tmpDir, name), content);
  }

  test("returns empty array when no Makefile exists", async () => {
    const results = await makefileDetector.detect(tmpDir);
    assert.deepStrictEqual(results, []);
  });

  test("detects basic targets and maps to make commands", async () => {
    writeMakefile(
      [
        "build:",
        "\tgo build ./...",
        "",
        "test:",
        "\tgo test ./...",
        "",
        "clean:",
        "\trm -rf dist/",
      ].join("\n"),
    );

    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].id, "makefile-build");
    assert.strictEqual(results[0].label, "build");
    assert.strictEqual(results[0].command, "make build");
    assert.strictEqual(results[0].source, "Makefile");
    assert.strictEqual(results[1].command, "make test");
    assert.strictEqual(results[2].command, "make clean");
  });

  test("filters to .PHONY targets when declared", async () => {
    writeMakefile(
      [
        ".PHONY: build test",
        "",
        "build:",
        "\tgo build",
        "",
        "test:",
        "\tgo test",
        "",
        "internal-target:",
        "\techo internal",
      ].join("\n"),
    );

    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 2);
    assert.ok(results.some((r) => r.label === "build"));
    assert.ok(results.some((r) => r.label === "test"));
    assert.ok(!results.some((r) => r.label === "internal-target"));
  });

  test("collects .PHONY spread over multiple lines", async () => {
    writeMakefile(
      [
        ".PHONY: build",
        ".PHONY: test lint",
        "",
        "build:",
        "\tgo build",
        "test:",
        "\tgo test",
        "lint:",
        "\tgolangci-lint run",
        "hidden:",
        "\techo hidden",
      ].join("\n"),
    );

    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 3);
    assert.ok(!results.some((r) => r.label === "hidden"));
  });

  test("skips targets starting with dot (special targets)", async () => {
    writeMakefile(
      [".DEFAULT_GOAL := build", ".PHONY: build", "", "build:", "\techo building"].join("\n"),
    );

    const results = await makefileDetector.detect(tmpDir);
    assert.ok(!results.some((r) => r.label.startsWith(".")));
  });

  test("skips pattern rules containing %", async () => {
    writeMakefile(["%.o: %.c", "\tcc -c $<", "", "build:", "\tcc -o app main.o"].join("\n"));

    const results = await makefileDetector.detect(tmpDir);
    assert.ok(!results.some((r) => r.label.includes("%")));
    assert.ok(results.some((r) => r.label === "build"));
  });

  test("skips variable assignments that contain := or =", async () => {
    writeMakefile(
      ["CC := gcc", "CFLAGS = -Wall", "", "build:", "\t$(CC) main.c -o app"].join("\n"),
    );

    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, "build");
  });

  test("deduplicates targets defined more than once", async () => {
    writeMakefile(["build:", "\techo first", "build:", "\techo second"].join("\n"));

    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.filter((r) => r.label === "build").length, 1);
  });

  test("detects makefile (lowercase) as fallback", async () => {
    writeMakefile("build:\n\techo hi\n", "makefile");
    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, "build");
  });

  test("detects GNUmakefile as fallback", async () => {
    writeMakefile("test:\n\techo test\n", "GNUmakefile");
    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, "test");
  });

  test("targets with hyphens and underscores are detected", async () => {
    writeMakefile(["run-dev:", "\tnpm run dev", "run_prod:", "\tnpm run prod"].join("\n"));

    const results = await makefileDetector.detect(tmpDir);
    assert.ok(results.some((r) => r.label === "run-dev"));
    assert.ok(results.some((r) => r.label === "run_prod"));
  });

  test("reports actual filename as source for makefile", async () => {
    writeMakefile("hello:\n\techo hello", "makefile");
    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].source, "makefile");
  });

  test("reports actual filename as source for GNUmakefile", async () => {
    writeMakefile("hello:\n\techo hello", "GNUmakefile");
    const results = await makefileDetector.detect(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].source, "GNUmakefile");
  });
});
