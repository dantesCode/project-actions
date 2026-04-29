import * as assert from 'assert';
import { makefileDetector } from '../../detectors/makefileDetector';
import { composerJsonDetector } from '../../detectors/composerJsonDetector';
import { packageJsonDetector } from '../../detectors/packageJsonDetector';

suite('detectors async', () => {
  test('makefileDetector returns array', async () => {
    const result = await makefileDetector.detect('/nonexistent');
    assert.ok(Array.isArray(result));
  });

  test('composerJsonDetector returns array', async () => {
    const result = await composerJsonDetector.detect('/nonexistent');
    assert.ok(Array.isArray(result));
  });

  test('packageJsonDetector returns array', async () => {
    const result = await packageJsonDetector.detect('/nonexistent');
    assert.ok(Array.isArray(result));
  });
});
