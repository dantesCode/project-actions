import * as assert from "assert";
import { validateConfig } from "../../configSchema";

suite("validateConfig", () => {
  test("accepts valid config", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev" }],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("rejects missing groups", () => {
    const result = validateConfig({});
    assert.strictEqual(result.valid, false);
  });

  test("rejects group missing actions array", () => {
    const result = validateConfig({ groups: [{ id: "dev", label: "Dev" }] });
    assert.strictEqual(result.valid, false);
  });

  test("rejects action missing command", () => {
    const result = validateConfig({
      groups: [{ id: "dev", label: "Dev", actions: [{ id: "start", label: "Start" }] }],
    });
    assert.strictEqual(result.valid, false);
  });

  test("accepts empty groups array", () => {
    const result = validateConfig({ groups: [] });
    assert.strictEqual(result.valid, true);
  });

  test("accepts action with valid placements", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [
            {
              id: "start",
              label: "Start",
              command: "npm run dev",
              placements: ["sidebar", "statusBar"],
            },
          ],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("rejects action with invalid placement", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [
            { id: "start", label: "Start", command: "npm run dev", placements: ["invalid"] },
          ],
        },
      ],
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("invalid placement"));
  });

  test("rejects placements that is not an array", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev", placements: "sidebar" }],
        },
      ],
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("must be an array"));
  });

  test("accepts action without placements (optional)", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev" }],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("accepts terminalMode shared", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [
            { id: "start", label: "Start", command: "npm run dev", terminalMode: "shared" },
          ],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("accepts terminalMode new", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev", terminalMode: "new" }],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("accepts action without terminalMode (optional)", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev" }],
        },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("rejects invalid terminalMode", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev", terminalMode: "split" }],
        },
      ],
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("invalid terminalMode"));
  });

  test("rejects terminalMode that is not a string", () => {
    const result = validateConfig({
      groups: [
        {
          id: "dev",
          label: "Dev",
          actions: [{ id: "start", label: "Start", command: "npm run dev", terminalMode: 123 }],
        },
      ],
    });
    assert.strictEqual(result.valid, false);
  });
});
