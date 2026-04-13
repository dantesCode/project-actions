import * as assert from 'assert';
import { groupSuggestionsBySource, SuggestedAction } from '../../suggestedActionsProvider';

suite('groupSuggestionsBySource', () => {
  test('returns empty info item when no suggestions', () => {
    const result = groupSuggestionsBySource([]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].label, 'No scripts detected');
  });

  test('groups suggestions by source with children', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'p1', label: 'dev', command: 'npm run dev', source: 'package.json' },
      { id: 'p2', label: 'build', command: 'npm run build', source: 'package.json' },
      { id: 'c1', label: 'test', command: 'composer test', source: 'composer.json' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    // Should have: 2 parent items (composer.json, package.json)
    assert.strictEqual(result.length, 2);
    
    // First item should be composer.json (alphabetically first)
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[0].label, 'composer.json');
    assert.ok(result[0].children, 'should have children');
    assert.strictEqual(result[0].children!.length, 1);
    assert.strictEqual(result[0].children![0].suggestion.label, 'test');
    
    // Second item should be package.json
    assert.strictEqual(result[1].contextValue, 'sourceGroup');
    assert.strictEqual(result[1].label, 'package.json');
    assert.ok(result[1].children, 'should have children');
    assert.strictEqual(result[1].children!.length, 2);
  });

  test('single source shows parent with child', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'm1', label: 'install', command: 'make install', source: 'Makefile' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    // Should have: 1 parent item with 1 child
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[0].label, 'Makefile');
    assert.ok(result[0].children);
    assert.strictEqual(result[0].children!.length, 1);
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
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[1].label, 'composer.json');
    assert.strictEqual(result[1].contextValue, 'sourceGroup');
    assert.strictEqual(result[2].label, 'package.json');
    assert.strictEqual(result[2].contextValue, 'sourceGroup');
  });
});