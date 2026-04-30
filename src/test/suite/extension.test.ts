import * as assert from "assert";
import * as vscode from "vscode";
import { activate, deactivate } from "../../extension";

suite("extension activation", () => {
  test("activate schedules refresh calls asynchronously", async () => {
    // This test verifies that the activate function completes synchronously
    // without throwing, and that deferred refreshes don't block activation.
    const mockContext = {
      subscriptions: [] as any[],
    } as vscode.ExtensionContext;

    // activate should not throw and should return quickly (synchronously)
    const start = Date.now();
    activate(mockContext);
    const duration = Date.now() - start;

    // Should complete quickly since refreshes are deferred
    assert.strictEqual(duration < 100, true, `activate took ${duration}ms, expected <100ms`);
    assert.strictEqual(
      mockContext.subscriptions.length > 0,
      true,
      "subscriptions should be populated",
    );
  });
});
