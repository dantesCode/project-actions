import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { cargoTomlDetector } from '../../detectors/cargoTomlDetector';

suite('cargoTomlDetector', () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cargo-test-'));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('returns empty array when no Cargo.toml exists', async () => {
    const result = await cargoTomlDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('detects standard cargo commands', async () => {
    await fs.writeFile(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "demo"\n');
    const result = await cargoTomlDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes('build'));
    assert.ok(labels.includes('test'));
    assert.ok(labels.includes('run'));
    assert.ok(labels.includes('check'));
    assert.ok(labels.includes('clippy'));
    assert.ok(labels.includes('fmt'));
  });

  test('detects workspace and adds build --workspace', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'Cargo.toml'),
      '[workspace]\nmembers = ["crates/*"]\n',
    );
    const result = await cargoTomlDetector.detect(tmpDir);
    const ws = result.find((a) => a.label === 'build --workspace');
    assert.ok(ws);
    assert.strictEqual(ws!.command, 'cargo build --workspace');
  });

  test('sets correct id, command, and source', async () => {
    await fs.writeFile(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "demo"\n');
    const result = await cargoTomlDetector.detect(tmpDir);
    const action = result.find((a) => a.label === 'test');
    assert.ok(action);
    assert.strictEqual(action!.id, 'cargo-toml-test');
    assert.strictEqual(action!.command, 'cargo test');
    assert.strictEqual(action!.source, 'Cargo.toml');
  });
});
