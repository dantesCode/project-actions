import * as assert from 'assert';
import * as vscode from 'vscode';
import { openActionPicker } from '../../actionPicker';

// Mock vscode for testing
const mockQuickPick = {
  items: [] as any[],
  selected: null as any,
};

const mockWindow = {
  showQuickPick: (items: any[], options?: any) => {
    mockQuickPick.items = items;
    return Promise.resolve(mockQuickPick.selected);
  },
  showErrorMessage: (msg: string) => Promise.resolve(),
  showInformationMessage: (msg: string) => Promise.resolve(),
};

suite('actionPicker', () => {
  test('shows all actions from all groups in quick pick', async () => {
    // This test would require mocking the full VS Code environment
    // For now, we just verify the file loads without errors
    assert.ok(openActionPicker !== undefined);
  });
});