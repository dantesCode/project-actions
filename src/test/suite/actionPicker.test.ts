import * as assert from 'assert';
import { openActionPicker } from '../../actionPicker';

suite('actionPicker', () => {
  test('module loads', () => {
    assert.ok(openActionPicker !== undefined);
  });
});