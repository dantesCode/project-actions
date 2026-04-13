import * as assert from 'assert';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { detectMakefileTargets } from '../../detectors/makefileDetector';

suite('detectMakefileTargets', () => {
  let tmpDir: string;

  setup(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'makefile-'));
  });

  teardown(() => {
    fs.rmSync(tmpDir, { recursive: true });
  });

  function writeMakefile(content: string, name = 'Makefile'): void {
    fs.writeFileSync(path.join(tmpDir, name), content);
  }

  test('returns empty array when no Makefile exists', () => {
    assert.deepStrictEqual(detectMakefileTargets(tmpDir), []);
  });

  test('detects basic targets and maps to make commands', () => {
    writeMakefile([
      'build:',
      '\tgo build ./...',
      '',
      'test:',
      '\tgo test ./...',
      '',
      'clean:',
      '\trm -rf dist/',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 3);
    assert.strictEqual(results[0].id, 'makefile-build');
    assert.strictEqual(results[0].label, 'build');
    assert.strictEqual(results[0].command, 'make build');
    assert.strictEqual(results[0].source, 'Makefile');
    assert.strictEqual(results[1].command, 'make test');
    assert.strictEqual(results[2].command, 'make clean');
  });

  test('filters to .PHONY targets when declared', () => {
    writeMakefile([
      '.PHONY: build test',
      '',
      'build:',
      '\tgo build',
      '',
      'test:',
      '\tgo test',
      '',
      'internal-target:',
      '\techo internal',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 2);
    assert.ok(results.some(r => r.label === 'build'));
    assert.ok(results.some(r => r.label === 'test'));
    assert.ok(!results.some(r => r.label === 'internal-target'));
  });

  test('collects .PHONY spread over multiple lines', () => {
    writeMakefile([
      '.PHONY: build',
      '.PHONY: test lint',
      '',
      'build:',
      '\tgo build',
      'test:',
      '\tgo test',
      'lint:',
      '\tgolangci-lint run',
      'hidden:',
      '\techo hidden',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 3);
    assert.ok(!results.some(r => r.label === 'hidden'));
  });

  test('skips targets starting with dot (special targets)', () => {
    writeMakefile([
      '.DEFAULT_GOAL := build',
      '.PHONY: build',
      '',
      'build:',
      '\techo building',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.ok(!results.some(r => r.label.startsWith('.')));
  });

  test('skips pattern rules containing %', () => {
    writeMakefile([
      '%.o: %.c',
      '\tcc -c $<',
      '',
      'build:',
      '\tcc -o app main.o',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.ok(!results.some(r => r.label.includes('%')));
    assert.ok(results.some(r => r.label === 'build'));
  });

  test('skips variable assignments that contain := or =', () => {
    writeMakefile([
      'CC := gcc',
      'CFLAGS = -Wall',
      '',
      'build:',
      '\t$(CC) main.c -o app',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, 'build');
  });

  test('deduplicates targets defined more than once', () => {
    writeMakefile([
      'build:',
      '\techo first',
      'build:',
      '\techo second',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.filter(r => r.label === 'build').length, 1);
  });

  test('detects makefile (lowercase) as fallback', () => {
    writeMakefile('build:\n\techo hi\n', 'makefile');
    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, 'build');
  });

  test('detects GNUmakefile as fallback', () => {
    writeMakefile('test:\n\techo test\n', 'GNUmakefile');
    const results = detectMakefileTargets(tmpDir);
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].label, 'test');
  });

  test('targets with hyphens and underscores are detected', () => {
    writeMakefile([
      'run-dev:',
      '\tnpm run dev',
      'run_prod:',
      '\tnpm run prod',
    ].join('\n'));

    const results = detectMakefileTargets(tmpDir);
    assert.ok(results.some(r => r.label === 'run-dev'));
    assert.ok(results.some(r => r.label === 'run_prod'));
  });
});
