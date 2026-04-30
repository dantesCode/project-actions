import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { goModDetector } from '../../detectors/goModDetector';

suite('goModDetector', () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'go-test-'));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('returns empty array when no go.mod exists', async () => {
    const result = await goModDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('detects standard go commands', async () => {
    await fs.writeFile(path.join(tmpDir, 'go.mod'), 'module example.com/demo\n');
    const result = await goModDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes('build'));
    assert.ok(labels.includes('test'));
    assert.ok(labels.includes('run'));
    assert.ok(labels.includes('mod tidy'));
    assert.ok(labels.includes('vet'));
  });

  test('sets correct id, command, and source', async () => {
    await fs.writeFile(path.join(tmpDir, 'go.mod'), 'module example.com/demo\n');
    const result = await goModDetector.detect(tmpDir);
    const action = result.find((a) => a.label === 'test');
    assert.ok(action);
    assert.strictEqual(action!.id, 'go-mod-test');
    assert.strictEqual(action!.command, 'go test ./...');
    assert.strictEqual(action!.source, 'go.mod');
  });
});
