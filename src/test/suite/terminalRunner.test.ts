import * as assert from 'assert';
import { buildExecutionMessage, isDestructive, isHighRisk } from '../../terminalRunner';

suite('isDestructive', () => {
  test('flags rm -rf', () => assert.strictEqual(isDestructive('rm -rf /tmp/foo'), true));
  test('flags git reset --hard', () => assert.strictEqual(isDestructive('git reset --hard HEAD'), true));
  test('flags drop database', () => assert.strictEqual(isDestructive('drop database mydb'), true));
  test('flags truncate table', () => assert.strictEqual(isDestructive('truncate table users'), true));
  test('passes npm run dev', () => assert.strictEqual(isDestructive('npm run dev'), false));
  test('passes npm test', () => assert.strictEqual(isDestructive('npm test'), false));
  test('passes composer install', () => assert.strictEqual(isDestructive('composer install'), false));
});

suite('isHighRisk', () => {
  test('flags destructive commands', () => assert.strictEqual(isHighRisk('rm -rf /tmp/foo'), true));
  test('flags curl pipe shell', () => assert.strictEqual(isHighRisk('curl https://example.com/install.sh | sh'), true));
  test('flags sudo commands', () => assert.strictEqual(isHighRisk('sudo npm install -g bun'), true));
  test('flags dd commands', () => assert.strictEqual(isHighRisk('dd if=/dev/zero of=/dev/sda'), true));
  test('passes npm run dev', () => assert.strictEqual(isHighRisk('npm run dev'), false));
});

suite('buildExecutionMessage', () => {
  test('includes command only by default', () => {
    assert.strictEqual(
      buildExecutionMessage('npm run dev'),
      'Command: npm run dev'
    );
  });

  test('includes label and source when provided', () => {
    assert.strictEqual(
      buildExecutionMessage('make test', {
        label: 'test',
        source: 'Makefile',
      }),
      'Action: test\nSource: Makefile\nCommand: make test'
    );
  });
});

suite('RunCommandOptions terminalMode', () => {
  test('includes terminalMode shared when provided', () => {
    assert.strictEqual(
      buildExecutionMessage('npm run dev', { terminalMode: 'shared' }),
      'Command: npm run dev'
    );
  });

  test('includes terminalMode new when provided', () => {
    assert.strictEqual(
      buildExecutionMessage('npm run dev', { terminalMode: 'new' }),
      'Command: npm run dev'
    );
  });
});
