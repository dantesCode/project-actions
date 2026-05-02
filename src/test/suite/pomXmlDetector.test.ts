import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { pomXmlDetector } from "../../detectors/pomXmlDetector";

suite("pomXmlDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "pom-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no pom.xml exists", async () => {
    const result = await pomXmlDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects standard Maven lifecycle phases", async () => {
    await fs.writeFile(
      path.join(tmpDir, "pom.xml"),
      '<?xml version="1.0"?><project><groupId>test</groupId><artifactId>test</artifactId></project>',
    );
    const result = await pomXmlDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("clean"));
    assert.ok(labels.includes("compile"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("package"));
    assert.ok(labels.includes("verify"));
    assert.ok(labels.includes("install"));
    assert.ok(labels.includes("deploy"));
  });

  test("uses mvnw wrapper when present", async () => {
    await fs.writeFile(
      path.join(tmpDir, "pom.xml"),
      '<?xml version="1.0"?><project><groupId>test</groupId><artifactId>test</artifactId></project>',
    );
    await fs.writeFile(path.join(tmpDir, "mvnw"), "#!/bin/sh");
    await fs.chmod(path.join(tmpDir, "mvnw"), 0o755);

    const result = await pomXmlDetector.detect(tmpDir);
    const compileAction = result.find((a) => a.label === "compile");
    assert.ok(compileAction);
    assert.ok(compileAction!.command.startsWith("./mvnw"));
  });

  test("detects Maven profiles from pom.xml", async () => {
    await fs.writeFile(
      path.join(tmpDir, "pom.xml"),
      [
        '<?xml version="1.0"?>',
        "<project>",
        "  <profiles>",
        "    <profile>",
        "      <id>development</id>",
        "      <activation><activeByDefault>true</activeByDefault></activation>",
        "    </profile>",
        "    <profile>",
        "      <id>production</id>",
        "    </profile>",
        "  </profiles>",
        "</project>",
      ].join("\n"),
    );
    const result = await pomXmlDetector.detect(tmpDir);
    const profileActions = result.filter((a) => a.id.startsWith("pom-xml-profile-"));
    assert.strictEqual(profileActions.length, 2);
    assert.ok(profileActions.find((a) => a.label === "profile:development"));
    assert.ok(profileActions.find((a) => a.label === "profile:production"));
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(
      path.join(tmpDir, "pom.xml"),
      '<?xml version="1.0"?><project><groupId>test</groupId><artifactId>test</artifactId></project>',
    );
    const result = await pomXmlDetector.detect(tmpDir);
    const installAction = result.find((a) => a.label === "install");
    assert.ok(installAction);
    assert.strictEqual(installAction!.id, "pom-xml-install");
    assert.strictEqual(installAction!.command, "mvn install");
    assert.strictEqual(installAction!.source, "pom.xml");
  });

  test("returns empty array for malformed pom.xml", async () => {
    const malformedDir = await fs.mkdtemp(path.join(os.tmpdir(), "pom-malformed-"));
    try {
      await fs.writeFile(path.join(malformedDir, "pom.xml"), "<project>< unclosed <tag>");
      const actions = await pomXmlDetector.detect(malformedDir);
      assert.ok(actions.length > 0, "returns default Maven phases for malformed pom.xml");
    } finally {
      await fs.rm(malformedDir, { recursive: true, force: true });
    }
  });
});
