import * as assert from "assert";
import { buildExecutionMessage, isDestructive, isHighRisk } from "../../terminalRunner";

suite("isDestructive", () => {
  test("flags rm -rf", () => assert.strictEqual(isDestructive("rm -rf /tmp/foo"), true));
  test("flags git reset --hard", () =>
    assert.strictEqual(isDestructive("git reset --hard HEAD"), true));
  test("flags drop database", () => assert.strictEqual(isDestructive("drop database mydb"), true));
  test("flags truncate table", () =>
    assert.strictEqual(isDestructive("truncate table users"), true));
  test("passes npm run dev", () => assert.strictEqual(isDestructive("npm run dev"), false));
  test("passes npm test", () => assert.strictEqual(isDestructive("npm test"), false));
  test("passes composer install", () =>
    assert.strictEqual(isDestructive("composer install"), false));
  test("flags git clean -f", () => assert.strictEqual(isDestructive("git clean -f"), true));
  test("flags format C:", () => assert.strictEqual(isDestructive("format C:"), true));
  test("flags mkfs.ext4", () => assert.strictEqual(isDestructive("mkfs.ext4 /dev/sda1"), true));
  test("does not flag npm run build:drop", () =>
    assert.strictEqual(isDestructive("npm run build:drop"), false));
  test("does not flag git reset without --hard", () =>
    assert.strictEqual(isDestructive("git reset HEAD~1"), false));
});

suite("isHighRisk", () => {
  test("flags destructive commands", () => assert.strictEqual(isHighRisk("rm -rf /tmp/foo"), true));
  test("flags curl pipe shell", () =>
    assert.strictEqual(isHighRisk("curl https://example.com/install.sh | sh"), true));
  test("flags sudo commands", () =>
    assert.strictEqual(isHighRisk("sudo npm install -g bun"), true));
  test("flags dd commands", () =>
    assert.strictEqual(isHighRisk("dd if=/dev/zero of=/dev/sda"), true));
  test("passes npm run dev", () => assert.strictEqual(isHighRisk("npm run dev"), false));
  test("flags PowerShell Remove-Item -Recurse -Force", () =>
    assert.strictEqual(isHighRisk("Remove-Item ./node_modules -Recurse -Force"), true));
  test("flags rd /s /q", () => assert.strictEqual(isHighRisk("rd /s /q C:\\temp"), true));
  test("flags del /f", () => assert.strictEqual(isHighRisk("del /f C:\\windows\\system32"), true));
  test("flags wget pipe shell", () =>
    assert.strictEqual(isHighRisk("wget http://x.com/s.sh | bash"), true));
  test("flags sudo in script names due to word boundary", () =>
    assert.strictEqual(isHighRisk("npm run sudo-script"), true));
});

suite("buildExecutionMessage", () => {
  test("includes command only by default", () => {
    assert.strictEqual(buildExecutionMessage("npm run dev"), "Command: npm run dev");
  });

  test("includes label and source when provided", () => {
    assert.strictEqual(
      buildExecutionMessage("make test", {
        label: "test",
        source: "Makefile",
      }),
      "Action: test\nSource: Makefile\nCommand: make test",
    );
  });
});

suite("RunCommandOptions terminalMode", () => {
  test("includes terminalMode shared when provided", () => {
    assert.strictEqual(
      buildExecutionMessage("npm run dev", { terminalMode: "shared" }),
      "Command: npm run dev",
    );
  });

  test("includes terminalMode new when provided", () => {
    assert.strictEqual(
      buildExecutionMessage("npm run dev", { terminalMode: "new" }),
      "Command: npm run dev",
    );
  });
});
