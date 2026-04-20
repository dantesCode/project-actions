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

  test("passes when no duplicate IDs across groups", () => {
    const result = validateConfig({
      groups: [
        { id: "g1", label: "G1", actions: [{ id: "a1", label: "A1", command: "echo a" }] },
        { id: "g2", label: "G2", actions: [{ id: "b1", label: "B1", command: "echo b" }] },
      ],
    });
    assert.strictEqual(result.valid, true);
  });

  test("fails when same ID appears in two groups", () => {
    const result = validateConfig({
      groups: [
        { id: "g1", label: "G1", actions: [{ id: "shared", label: "A1", command: "echo a" }] },
        { id: "g2", label: "G2", actions: [{ id: "shared", label: "B1", command: "echo b" }] },
      ],
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("shared"));
    assert.ok(result.error.includes("g1") && result.error.includes("g2"));
  });

  test("fails when duplicate ID appears in three groups", () => {
    const result = validateConfig({
      groups: [
        { id: "g1", label: "G1", actions: [{ id: "dup", label: "One", command: "echo 1" }] },
        { id: "g2", label: "G2", actions: [{ id: "dup", label: "Two", command: "echo 2" }] },
        { id: "g3", label: "G3", actions: [{ id: "dup", label: "Three", command: "echo 3" }] },
      ],
    });
    assert.strictEqual(result.valid, false);
    assert.ok(result.error.includes("dup"));
    assert.ok(result.error.includes("g1") && result.error.includes("g2") && result.error.includes("g3"));
  });
});
