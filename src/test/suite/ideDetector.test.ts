import * as assert from 'assert';
import { detectIde, invalidateCache } from '../../ideDetector';

suite('ideDetector cache', () => {
  teardown(() => {
    invalidateCache();
  });

  test('detectIde returns consistent result', () => {
    const result1 = detectIde();
    const result2 = detectIde();
    assert.deepStrictEqual(result1, result2);
  });

  test('detectIde returns same object on second call (cached)', () => {
    const result1 = detectIde();
    const result2 = detectIde();
    assert.strictEqual(result1, result2);
  });

  test('invalidateCache causes new object on next call', () => {
    const result1 = detectIde();
    invalidateCache();
    const result2 = detectIde();
    assert.notStrictEqual(result1, result2);
  });
});
