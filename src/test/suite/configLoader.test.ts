import * as assert from "assert";
import * as vscode from "vscode";
import { loadConfig, loadConfigAsync } from "../../configLoader";

suite("configLoader", () => {
  test("loadConfigAsync returns a ValidationResult", async () => {
    const result = await loadConfigAsync();
    assert.ok(typeof result.valid === "boolean", "result should have valid boolean");
  });

  test("loadConfigAsync does not block (returns a Promise)", () => {
    const result = loadConfigAsync();
    assert.ok(result instanceof Promise, "loadConfigAsync should return a Promise");
  });
});
