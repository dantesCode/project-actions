import * as assert from "assert";
import { SuggestedAction } from "../../types";

suite("SuggestedAction type", () => {
  test("allows optional description field", () => {
    const action: SuggestedAction = {
      id: "test",
      label: "test",
      command: "echo hi",
      source: "test",
      description: "Runs hello",
    };
    assert.strictEqual(action.description, "Runs hello");
  });

  test("description is optional", () => {
    const action: SuggestedAction = {
      id: "test",
      label: "test",
      command: "echo hi",
      source: "test",
    };
    assert.strictEqual(action.description, undefined);
  });
});
