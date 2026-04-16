import * as assert from "assert";
import { parseDraggedActionId, resolveCuratedDropTarget } from "../../curatedTreeDragAndDrop";

suite("resolveCuratedDropTarget", () => {
  test("resolves category drops to append to the category", () => {
    const result = resolveCuratedDropTarget({
      contextValue: "group",
      groupId: "deploy",
    });

    assert.deepStrictEqual(result, { targetGroupId: "deploy" });
  });

  test("resolves action drops to insert before the target action", () => {
    const result = resolveCuratedDropTarget({
      contextValue: "curatedAction",
      groupId: "general",
      actionId: "test",
    });

    assert.deepStrictEqual(result, {
      targetGroupId: "general",
      beforeActionId: "test",
    });
  });

  test("ignores unsupported targets", () => {
    const result = resolveCuratedDropTarget({
      contextValue: "info",
    });

    assert.strictEqual(result, null);
  });

  test("ignores malformed drag payloads", () => {
    assert.strictEqual(parseDraggedActionId("not-json"), null);
    assert.strictEqual(parseDraggedActionId('{"foo":"bar"}'), null);
  });
});
