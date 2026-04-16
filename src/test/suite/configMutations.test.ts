import * as assert from "assert";
import {
  createGroupInConfig,
  moveActionInConfig,
  removeActionInConfig,
} from "../../configMutations";
import { ProjectActionsConfig } from "../../types";

suite("configMutations", () => {
  test("creates a category with a generated id", () => {
    const config: ProjectActionsConfig = {
      groups: [{ id: "general", label: "General", actions: [] }],
    };

    const result = createGroupInConfig(config, "Build & Release");

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.strictEqual(result.group.id, "build-release");
    assert.strictEqual(result.group.label, "Build & Release");
    assert.strictEqual(result.config.groups.length, 2);
  });

  test("rejects duplicate category labels", () => {
    const config: ProjectActionsConfig = {
      groups: [{ id: "deploy", label: "Deploy", actions: [] }],
    };

    const result = createGroupInConfig(config, "deploy");

    assert.strictEqual(result.ok, false);
  });

  test("appends an action when dropped on a category", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [
            { id: "dev", label: "Dev", command: "npm run dev" },
            { id: "test", label: "Test", command: "npm test" },
          ],
        },
        {
          id: "deploy",
          label: "Deploy",
          actions: [{ id: "ship", label: "Ship", command: "npm run ship" }],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", { targetGroupId: "deploy" });

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["test"],
    );
    assert.deepStrictEqual(
      result.config.groups[1].actions.map((action) => action.id),
      ["ship", "dev"],
    );
    assert.strictEqual(result.action.id, "dev");
  });

  test("inserts an action before the target action", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [
            { id: "dev", label: "Dev", command: "npm run dev" },
            { id: "lint", label: "Lint", command: "npm run lint" },
            { id: "test", label: "Test", command: "npm test" },
          ],
        },
      ],
    };

    const result = moveActionInConfig(config, "test", {
      targetGroupId: "general",
      beforeActionId: "lint",
    });

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["dev", "test", "lint"],
    );
    assert.strictEqual(result.action.id, "test");
  });

  test("treats dropping on the same action as a no-op", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", {
      targetGroupId: "general",
      beforeActionId: "dev",
    });

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.strictEqual(result.changed, false);
    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["dev"],
    );
  });

  test("treats dropping before the immediate next sibling in the same category as a no-op", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [
            { id: "dev", label: "Dev", command: "npm run dev" },
            { id: "test", label: "Test", command: "npm test" },
            { id: "lint", label: "Lint", command: "npm run lint" },
          ],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", {
      targetGroupId: "general",
      beforeActionId: "test",
    });

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.strictEqual(result.changed, false);
    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["dev", "test", "lint"],
    );
  });

  test("treats moving to the current category as a no-op", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [
            { id: "dev", label: "Dev", command: "npm run dev" },
            { id: "test", label: "Test", command: "npm test" },
          ],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", { targetGroupId: "general" });

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.strictEqual(result.changed, false);
    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["dev", "test"],
    );
  });

  test("rejects moving an action when the action id is duplicated across categories", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
        },
        {
          id: "deploy",
          label: "Deploy",
          actions: [{ id: "dev", label: "Deploy Dev", command: "npm run deploy:dev" }],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", { targetGroupId: "general" });

    assert.strictEqual(result.ok, false);
    if (result.ok) {
      return;
    }

    assert.strictEqual(
      result.error,
      'Action id "dev" is duplicated and ambiguous. Make action ids unique before editing.',
    );
  });

  test("rejects moving before a duplicated target action id in the destination category", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
        },
        {
          id: "deploy",
          label: "Deploy",
          actions: [
            { id: "ship", label: "Ship", command: "npm run ship" },
            { id: "ship", label: "Ship Duplicate", command: "npm run ship:again" },
          ],
        },
      ],
    };

    const result = moveActionInConfig(config, "dev", {
      targetGroupId: "deploy",
      beforeActionId: "ship",
    });

    assert.strictEqual(result.ok, false);
    if (result.ok) {
      return;
    }

    assert.strictEqual(
      result.error,
      'Action id "ship" is duplicated and ambiguous. Make action ids unique before editing.',
    );
  });

  test("rejects removing an action when the action id is duplicated across categories", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
        },
        {
          id: "deploy",
          label: "Deploy",
          actions: [{ id: "dev", label: "Deploy Dev", command: "npm run deploy:dev" }],
        },
      ],
    };

    const result = removeActionInConfig(config, "dev");

    assert.strictEqual(result.ok, false);
    if (result.ok) {
      return;
    }

    assert.strictEqual(
      result.error,
      'Action id "dev" is duplicated and ambiguous. Make action ids unique before editing.',
    );
  });

  test("removes an action when the action id is unique", () => {
    const config: ProjectActionsConfig = {
      groups: [
        {
          id: "general",
          label: "General",
          actions: [
            { id: "dev", label: "Dev", command: "npm run dev" },
            { id: "test", label: "Test", command: "npm test" },
          ],
        },
      ],
    };

    const result = removeActionInConfig(config, "dev");

    assert.strictEqual(result.ok, true);
    if (!result.ok) {
      return;
    }

    assert.strictEqual(result.action.id, "dev");
    assert.deepStrictEqual(
      result.config.groups[0].actions.map((action) => action.id),
      ["test"],
    );
  });
});
