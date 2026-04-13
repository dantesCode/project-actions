import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectComposerJsonScripts } from '../../detectors/composerJsonDetector';

suite('detectComposerJsonScripts', () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-'));
  });

  teardown(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  test('returns empty array when no composer.json', () => {
    assert.deepStrictEqual(detectComposerJsonScripts(tmpDir), []);
  });

  test('detects scripts and maps to composer run-script commands', () => {
    fs.writeFileSync(path.join(tmpDir, 'composer.json'), JSON.stringify({
      scripts: { test: 'phpunit', 'cs-fix': 'php-cs-fixer fix' }
    }));
    const results = detectComposerJsonScripts(tmpDir);
    assert.strictEqual(results.length, 2);
    assert.strictEqual(results[0].command, 'composer run-script test');
    assert.strictEqual(results[0].source, 'composer.json');
  });

  test('returns empty when scripts key is missing', () => {
    fs.writeFileSync(path.join(tmpDir, 'composer.json'), JSON.stringify({ name: 'my/pkg' }));
    assert.deepStrictEqual(detectComposerJsonScripts(tmpDir), []);
  });

  test('returns empty on malformed JSON', () => {
    fs.writeFileSync(path.join(tmpDir, 'composer.json'), 'not-json{{{');
    assert.deepStrictEqual(detectComposerJsonScripts(tmpDir), []);
  });
});
