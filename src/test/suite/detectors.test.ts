import * as assert from 'assert';
import { detectMakefileTargetsAsync } from '../../detectors/makefileDetector';
import { detectComposerJsonScriptsAsync } from '../../detectors/composerJsonDetector';
import { detectPackageJsonScriptsAsync } from '../../detectors/packageJsonDetector';

suite('detectors async', () => {
  test('detectMakefileTargetsAsync returns array', async () => {
    const result = await detectMakefileTargetsAsync('/nonexistent');
    assert.ok(Array.isArray(result));
  });

  test('detectComposerJsonScriptsAsync returns array', async () => {
    const result = await detectComposerJsonScriptsAsync('/nonexistent');
    assert.ok(Array.isArray(result));
  });

  test('detectPackageJsonScriptsAsync returns array', async () => {
    const result = await detectPackageJsonScriptsAsync('/nonexistent');
    assert.ok(Array.isArray(result));
  });
});
