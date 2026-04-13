import * as assert from 'assert';
import { groupSuggestionsBySource, SuggestedAction } from '../../suggestedActionsProvider';

suite('groupSuggestionsBySource', () => {
  test('returns empty info item when no suggestions', () => {
    const result = groupSuggestionsBySource([]);
    assert.strictEqual(result.length, 1);
    // Empty item has empty command, no icon
    assert.strictEqual(result[0].label, 'No suggestions found');
  });

  test('groups suggestions by source', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'p1', label: 'dev', command: 'npm run dev', source: 'package.json' },
      { id: 'p2', label: 'build', command: 'npm run build', source: 'package.json' },
      { id: 'c1', label: 'test', command: 'composer test', source: 'composer.json' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    // Should have: 2 group headers + 3 items = 5 total
    assert.strictEqual(result.length, 5);
    
    // First item should be composer.json header (alphabetically first)
    assert.strictEqual(result[0].contextValue, 'group');
    assert.strictEqual(result[0].label, 'composer.json');
    
    // Next should be composer.json item
    assert.strictEqual(result[1].contextValue, 'suggestion');
    assert.strictEqual(result[1].label, 'test');
    
    // Then package.json header
    assert.strictEqual(result[2].contextValue, 'group');
    assert.strictEqual(result[2].label, 'package.json');
    
    // Last two should be package.json items
    assert.strictEqual(result[3].contextValue, 'suggestion');
    assert.strictEqual(result[3].label, 'dev');
    assert.strictEqual(result[4].contextValue, 'suggestion');
    assert.strictEqual(result[4].label, 'build');
  });

  test('single source shows header', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'm1', label: 'install', command: 'make install', source: 'Makefile' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    // Should have: 1 header + 1 item = 2 total
    assert.strictEqual(result.length, 2);
    assert.strictEqual(result[0].contextValue, 'group');
    assert.strictEqual(result[0].label, 'Makefile');
  });

  test('multiple sources in correct alphabetical order', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'c1', label: 'install', command: 'composer install', source: 'composer.json' },
      { id: 'p1', label: 'dev', command: 'npm run dev', source: 'package.json' },
      { id: 'm1', label: 'build', command: 'make build', source: 'Makefile' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    // Order should be: Makefile, composer.json, package.json (ASCII sort)
    assert.strictEqual(result[0].label, 'Makefile');
    assert.strictEqual(result[0].contextValue, 'group');
    assert.strictEqual(result[2].label, 'composer.json');
    assert.strictEqual(result[2].contextValue, 'group');
    assert.strictEqual(result[4].label, 'package.json');
    assert.strictEqual(result[4].contextValue, 'group');
  });
});