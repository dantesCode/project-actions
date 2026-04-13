import * as assert from 'assert';
import { isDestructive } from '../../terminalRunner';

suite('isDestructive', () => {
  test('flags rm -rf', () => assert.strictEqual(isDestructive('rm -rf /tmp/foo'), true));
  test('flags git reset --hard', () => assert.strictEqual(isDestructive('git reset --hard HEAD'), true));
  test('flags drop database', () => assert.strictEqual(isDestructive('drop database mydb'), true));
  test('flags truncate table', () => assert.strictEqual(isDestructive('truncate table users'), true));
  test('passes npm run dev', () => assert.strictEqual(isDestructive('npm run dev'), false));
  test('passes npm test', () => assert.strictEqual(isDestructive('npm test'), false));
  test('passes composer install', () => assert.strictEqual(isDestructive('composer install'), false));
});
