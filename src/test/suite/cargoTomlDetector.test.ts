import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { cargoTomlDetector } from "../../detectors/cargoTomlDetector";

suite("cargoTomlDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "cargo-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no Cargo.toml exists", async () => {
    const result = await cargoTomlDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects standard cargo commands", async () => {
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), '[package]\nname = "demo"\n');
    const result = await cargoTomlDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("run"));
    assert.ok(labels.includes("check"));
    assert.ok(labels.includes("clippy"));
    assert.ok(labels.includes("fmt"));
  });

  test("detects workspace and adds build --workspace", async () => {
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), '[workspace]\nmembers = ["crates/*"]\n');
    const result = await cargoTomlDetector.detect(tmpDir);
    const ws = result.find((a) => a.label === "build --workspace");
    assert.ok(ws);
    assert.strictEqual(ws!.command, "cargo build --workspace");
  });

  test("detects [[bin]] targets", async () => {
    const content = '[package]\nname = "demo"\n\n[[bin]]\nname = "mybin"\npath = "src/bin/main.rs"\n';
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), content);
    const result = await cargoTomlDetector.detect(tmpDir);
    const bin = result.find((a) => a.id === "cargo-toml-bin-mybin");
    assert.ok(bin);
    assert.strictEqual(bin!.command, "cargo run --bin mybin");
  });

  test("detects [[example]] targets", async () => {
    const content = '[package]\nname = "demo"\n\n[[example]]\nname = "myexample"\npath = "examples/myexample.rs"\n';
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), content);
    const result = await cargoTomlDetector.detect(tmpDir);
    const ex = result.find((a) => a.id === "cargo-toml-example-myexample");
    assert.ok(ex);
    assert.strictEqual(ex!.command, "cargo run --example myexample");
  });

  test("detects [[test]] targets", async () => {
    const content = '[package]\nname = "demo"\n\n[[test]]\nname = "mytest"\npath = "tests/mytest.rs"\n';
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), content);
    const result = await cargoTomlDetector.detect(tmpDir);
    const t = result.find((a) => a.id === "cargo-toml-test-mytest");
    assert.ok(t);
    assert.strictEqual(t!.command, "cargo test --test mytest");
  });

  test("detects [[bench]] targets", async () => {
    const content = '[package]\nname = "demo"\n\n[[bench]]\nname = "mybench"\nharness = false\n';
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), content);
    const result = await cargoTomlDetector.detect(tmpDir);
    const b = result.find((a) => a.id === "cargo-toml-bench-mybench");
    assert.ok(b);
    assert.strictEqual(b!.command, "cargo bench --bench mybench");
  });

  test("detects xtask workspace member", async () => {
    const content = '[workspace]\nmembers = ["xtask", "lib"]\n';
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), content);
    const result = await cargoTomlDetector.detect(tmpDir);
    const xtask = result.find((a) => a.id === "cargo-toml-xtask");
    assert.ok(xtask);
    assert.strictEqual(xtask!.command, "cargo xtask");
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(path.join(tmpDir, "Cargo.toml"), '[package]\nname = "demo"\n');
    const result = await cargoTomlDetector.detect(tmpDir);
    const action = result.find((a) => a.label === "test");
    assert.ok(action);
    assert.strictEqual(action!.id, "cargo-toml-test");
    assert.strictEqual(action!.command, "cargo test");
    assert.strictEqual(action!.source, "Cargo.toml");
  });
});
