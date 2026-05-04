import * as assert from "assert";
import { openActionPicker } from "../../actionPicker";
import { ActionPlacement } from "../../types";

suite("actionPicker", () => {
  test("module loads", () => {
    assert.ok(openActionPicker !== undefined);
  });

  test("accepts optional placement argument", async () => {
    assert.strictEqual(typeof openActionPicker, "function");
    // No config in test workspace, so it returns after showing info message
    await openActionPicker("explorerContext" as ActionPlacement);
  });
});
