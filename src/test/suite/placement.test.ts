import * as assert from "assert";
import { hasPlacement } from "../../placement";
import { Action } from "../../types";

suite("hasPlacement", () => {
  test("returns true when placements is undefined", () => {
    const action: Action = { id: "dev", label: "Dev", command: "npm run dev" };
    assert.strictEqual(hasPlacement(action, "sidebar"), true);
  });

  test("returns true when placements includes the given placement", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: ["sidebar"],
    };
    assert.strictEqual(hasPlacement(action, "sidebar"), true);
  });

  test("returns false when placements does not include the given placement", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: ["statusBar"],
    };
    assert.strictEqual(hasPlacement(action, "sidebar"), false);
  });

  test("returns true when placements includes multiple values including target", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: ["sidebar", "statusBar"],
    };
    assert.strictEqual(hasPlacement(action, "statusBar"), true);
  });

  test("returns false for editorTitle placement when only sidebar included", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: ["sidebar"],
    };
    assert.strictEqual(hasPlacement(action, "editorTitle"), false);
  });

  test("returns false for explorerContext placement when not included", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: ["sidebar", "statusBar", "editorTitle"],
    };
    assert.strictEqual(hasPlacement(action, "explorerContext"), false);
  });

  test("returns true for all placements when placements array is empty", () => {
    const action: Action = {
      id: "dev",
      label: "Dev",
      command: "npm run dev",
      placements: [],
    };
    assert.strictEqual(hasPlacement(action, "sidebar"), false);
  });
});
