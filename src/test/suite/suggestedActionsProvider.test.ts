import * as assert from 'assert';
import { groupSuggestionsBySource, SuggestedAction } from '../../suggestedActionsProvider';

suite('groupSuggestionsBySource', () => {
  test('returns empty item when no suggestions', () => {
    const result = groupSuggestionsBySource([]);
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].label, 'No scripts detected');
  });

  test('groups by source with children', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'p1', label: 'dev', command: 'npm run dev', source: 'package.json' },
      { id: 'p2', label: 'build', command: 'npm run build', source: 'package.json' },
      { id: 'c1', label: 'test', command: 'composer test', source: 'composer.json' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    assert.strictEqual(result.length, 2);
    
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[0].label, 'composer.json');
    assert.ok(result[0].children);
    assert.strictEqual(result[0].children!.length, 1);
    assert.strictEqual(result[0].children![0].suggestion.label, 'test');
    
    assert.strictEqual(result[1].contextValue, 'sourceGroup');
    assert.strictEqual(result[1].label, 'package.json');
    assert.ok(result[1].children);
    assert.strictEqual(result[1].children!.length, 2);
  });

  test('single source with child', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'm1', label: 'install', command: 'make install', source: 'Makefile' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[0].label, 'Makefile');
    assert.ok(result[0].children);
    assert.strictEqual(result[0].children!.length, 1);
  });

  test('multiple sources sorted', () => {
    const suggestions: SuggestedAction[] = [
      { id: 'c1', label: 'install', command: 'composer install', source: 'composer.json' },
      { id: 'p1', label: 'dev', command: 'npm run dev', source: 'package.json' },
      { id: 'm1', label: 'build', command: 'make build', source: 'Makefile' },
    ];
    const result = groupSuggestionsBySource(suggestions);
    
    assert.strictEqual(result[0].label, 'Makefile');
    assert.strictEqual(result[0].contextValue, 'sourceGroup');
    assert.strictEqual(result[1].label, 'composer.json');
    assert.strictEqual(result[1].contextValue, 'sourceGroup');
    assert.strictEqual(result[2].label, 'package.json');
    assert.strictEqual(result[2].contextValue, 'sourceGroup');
  });
});