import * as assert from 'assert';
import { validateConfig } from '../../configSchema';

suite('validateConfig', () => {
  test('accepts valid config', () => {
    const result = validateConfig({
      groups: [{ id: 'dev', label: 'Dev', actions: [{ id: 'start', label: 'Start', command: 'npm run dev' }] }]
    });
    assert.strictEqual(result.valid, true);
  });

  test('rejects missing groups', () => {
    const result = validateConfig({});
    assert.strictEqual(result.valid, false);
  });

  test('rejects group missing actions array', () => {
    const result = validateConfig({ groups: [{ id: 'dev', label: 'Dev' }] });
    assert.strictEqual(result.valid, false);
  });

  test('rejects action missing command', () => {
    const result = validateConfig({
      groups: [{ id: 'dev', label: 'Dev', actions: [{ id: 'start', label: 'Start' }] }]
    });
    assert.strictEqual(result.valid, false);
  });

  test('accepts empty groups array', () => {
    const result = validateConfig({ groups: [] });
    assert.strictEqual(result.valid, true);
  });
});
