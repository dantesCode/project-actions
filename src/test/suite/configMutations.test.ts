import * as assert from "assert";
import {
  createGroupInConfig,
  moveActionInConfig,
  removeActionInConfig,
  removeGroupInConfig,
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

  suite("removeGroupInConfig", () => {
    test("removes a group when config has multiple groups", () => {
      const config: ProjectActionsConfig = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
          { id: "deploy", label: "Deploy", actions: [] },
          { id: "test", label: "Test", actions: [] },
        ],
      };

      const result = removeGroupInConfig(config, "deploy");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "deploy");
      assert.strictEqual(result.config.groups.length, 2);
      assert.deepStrictEqual(
        result.config.groups.map((g) => g.id),
        ["general", "test"],
      );
    });

    test("returns error when group not found", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = removeGroupInConfig(config, "nonexistent");

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Category not found in config.");
    });

    test("returns error when trying to remove the last group", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = removeGroupInConfig(config, "general");

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Cannot remove the last category.");
    });

    test("removes first group and preserves order of remaining", () => {
      const config: ProjectActionsConfig = {
        groups: [
          { id: "first", label: "First", actions: [] },
          { id: "second", label: "Second", actions: [] },
          { id: "third", label: "Third", actions: [] },
        ],
      };

      const result = removeGroupInConfig(config, "first");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.deepStrictEqual(
        result.config.groups.map((g) => g.id),
        ["second", "third"],
      );
    });

    test("removes group with actions inside it", () => {
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
            actions: [{ id: "ship", label: "Ship", command: "npm run ship" }],
          },
        ],
      };

      const result = removeGroupInConfig(config, "deploy");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.config.groups.length, 1);
      assert.strictEqual(result.config.groups[0].id, "general");
    });
  });

  suite("createGroupInConfig edge cases", () => {
    test("generates id from label with special characters", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = createGroupInConfig(config, "  Hello World!  ");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "hello-world");
      assert.strictEqual(result.group.label, "Hello World!");
    });

    test("generates fallback id for labels with only non-latin chars", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = createGroupInConfig(config, "日本語");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "category");
    });

    test("generates id preserving numbers in label", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = createGroupInConfig(config, "Build 2025");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "build-2025");
    });

    test("suffixes group id when duplicate exists", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General X", actions: [] }],
      };

      const result = createGroupInConfig(config, "General");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "general-2");
    });

    test("increments suffix when base and base-2 already exist", () => {
      const config: ProjectActionsConfig = {
        groups: [
          { id: "general", label: "General 1", actions: [] },
          { id: "general-2", label: "General 2", actions: [] },
        ],
      };

      const result = createGroupInConfig(config, "General");

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.group.id, "general-3");
    });

    test("rejects empty whitespace-only label", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = createGroupInConfig(config, "   ");

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Category name cannot be empty.");
    });

    test("rejects duplicate label case-insensitively", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "deploy", label: "Deploy", actions: [] }],
      };

      const result = createGroupInConfig(config, "DEPLOY");

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "A category with this name already exists.");
    });
  });

  suite("moveActionInConfig boundary cases", () => {
    test("moves action to first position in different group", () => {
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
            actions: [{ id: "ship", label: "Ship", command: "npm run ship" }],
          },
        ],
      };

      const result = moveActionInConfig(config, "dev", {
        targetGroupId: "deploy",
        beforeActionId: "ship",
      });

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.changed, true);
      assert.deepStrictEqual(
        result.config.groups[1].actions.map((a) => a.id),
        ["dev", "ship"],
      );
    });

    test("moves action within same group before an earlier action", () => {
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
        beforeActionId: "dev",
      });

      assert.strictEqual(result.ok, true);
      if (!result.ok) return;
      assert.strictEqual(result.changed, true);
      assert.deepStrictEqual(
        result.config.groups[0].actions.map((a) => a.id),
        ["test", "dev", "lint"],
      );
    });

    test("returns error when source action not found", () => {
      const config: ProjectActionsConfig = {
        groups: [{ id: "general", label: "General", actions: [] }],
      };

      const result = moveActionInConfig(config, "nonexistent", { targetGroupId: "general" });

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Action not found in config.");
    });

    test("returns error when target group not found", () => {
      const config: ProjectActionsConfig = {
        groups: [
          {
            id: "general",
            label: "General",
            actions: [{ id: "dev", label: "Dev", command: "npm run dev" }],
          },
        ],
      };

      const result = moveActionInConfig(config, "dev", { targetGroupId: "nonexistent" });

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Target category not found.");
    });

    test("returns error when beforeActionId not found in target group", () => {
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
            actions: [{ id: "ship", label: "Ship", command: "npm run ship" }],
          },
        ],
      };

      const result = moveActionInConfig(config, "dev", {
        targetGroupId: "deploy",
        beforeActionId: "nonexistent",
      });

      assert.strictEqual(result.ok, false);
      if (result.ok) return;
      assert.strictEqual(result.error, "Target action not found.");
    });
  });
});
