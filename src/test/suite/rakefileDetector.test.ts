import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs/promises';
import * as os from 'os';
import { rakefileDetector } from '../../detectors/rakefileDetector';

suite('rakefileDetector', () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'rake-test-'));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test('returns empty array when no Rakefile exists', async () => {
    const result = await rakefileDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test('detects default and custom tasks from Rakefile', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'Rakefile'),
      [
        'task :default => :test',
        'task :test',
        'task :build',
        'task "deploy"',
        "task 'lint'",
      ].join('\n'),
    );
    const result = await rakefileDetector.detect(tmpDir);
    // Should include default, test (always), plus build, deploy, lint
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes('default'));
    assert.ok(labels.includes('test'));
    assert.ok(labels.includes('build'));
    assert.ok(labels.includes('deploy'));
    assert.ok(labels.includes('lint'));
  });

  test('sets correct id, command, and source', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'Rakefile'),
      'task :build',
    );
    const result = await rakefileDetector.detect(tmpDir);
    const buildTask = result.find((a) => a.label === 'build');
    assert.ok(buildTask);
    assert.strictEqual(buildTask!.id, 'rakefile-build');
    assert.strictEqual(buildTask!.command, 'rake build');
    assert.strictEqual(buildTask!.source, 'Rakefile');
  });

  test('returns default and test for unparseable file', async () => {
    await fs.writeFile(path.join(tmpDir, 'Rakefile'), '\0invalid');
    const result = await rakefileDetector.detect(tmpDir);
    // Standard Rake tasks always shown for existing files
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].label, 'default');
    assert.strictEqual(result[1].label, 'test');
  });
});
