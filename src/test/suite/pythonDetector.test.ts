import * as assert from "assert";
import * as path from "path";
import * as fs from "fs/promises";
import * as os from "os";
import { pythonDetector } from "../../detectors/pythonDetector";

suite("pythonDetector", () => {
  let tmpDir: string;

  setup(async () => {
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "python-test-"));
  });

  teardown(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  test("returns empty array when no python config exists", async () => {
    const result = await pythonDetector.detect(tmpDir);
    assert.deepStrictEqual(result, []);
  });

  test("detects pyproject.toml baseline actions", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\nrequires = [\"setuptools\"]\n\n[tool.pytest.ini_options]\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("pip install -e ."));
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("pytest"));
  });

  test("omits pytest when [tool.pytest] absent", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\nrequires = [\"setuptools\"]\n");
    const result = await pythonDetector.detect(tmpDir);
    assert.ok(!result.some((a) => a.id === "python-pytest"));
  });

  test("includes pytest when [tool.pytest] present", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[tool.pytest.ini_options]\ntestpaths = [\"tests\"]\n");
    const result = await pythonDetector.detect(tmpDir);
    assert.ok(result.some((a) => a.id === "python-pytest"));
  });

  test("includes tox when [tool.tox] present", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[tool.tox]\nlegacy_tox_ini = \"...\"\n");
    const result = await pythonDetector.detect(tmpDir);
    assert.ok(result.some((a) => a.id === "python-tox"));
  });

  test("includes nox when [tool.nox] present", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[tool.nox.sessions]\n");
    const result = await pythonDetector.detect(tmpDir);
    assert.ok(result.some((a) => a.id === "python-nox"));
  });

  test("skips pip-install-e when Makefile coexists", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\nrequires = [\"setuptools\"]\n");
    await fs.writeFile(path.join(tmpDir, "Makefile"), "install:\n\tpip install -e .\n");
    const result = await pythonDetector.detect(tmpDir);
    assert.ok(!result.some((a) => a.id === "python-pip-install"));
  });

  test("detects project.scripts from pyproject.toml", async () => {
    const content = `[project.scripts]
mycli = "mypackage.cli:main"
other = "other_pkg:run"`;
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), content);
    const result = await pythonDetector.detect(tmpDir);
    const scriptActions = result.filter((a) => a.id.startsWith("python-script-"));
    assert.deepStrictEqual(scriptActions.map((a) => a.label), ["mycli", "other"]);
    assert.deepStrictEqual(scriptActions.map((a) => a.command), ["python -m mypackage.cli", "python -m other_pkg"]);
    assert.deepStrictEqual(scriptActions.map((a) => a.source), ["pyproject.toml", "pyproject.toml"]);
  });

  test("detects setup.py actions", async () => {
    await fs.writeFile(path.join(tmpDir, "setup.py"), "from setuptools import setup; setup()\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("test"));
    assert.ok(labels.includes("install"));
  });

  test("parses setup.py entry_points scripts", async () => {
    const content = `from setuptools import setup
setup(
    name="myproject",
    entry_points={"console_scripts": ["mycli=mypackage.cli:main", "other=other_pkg:run"]}
)`;
    await fs.writeFile(path.join(tmpDir, "setup.py"), content);
    const result = await pythonDetector.detect(tmpDir);
    const scriptActions = result.filter((a) => a.id.startsWith("python-script-"));
    assert.deepStrictEqual(scriptActions.map((a) => a.label), ["mycli", "other"]);
    assert.deepStrictEqual(scriptActions.map((a) => a.command), ["python -m mypackage.cli", "python -m other_pkg"]);
  });

  test("detects setup.cfg actions", async () => {
    await fs.writeFile(path.join(tmpDir, "setup.cfg"), "[metadata]\nname = demo\n");
    const result = await pythonDetector.detect(tmpDir);
    const labels = result.map((a) => a.label);
    assert.ok(labels.includes("build"));
    assert.ok(labels.includes("pytest"));
  });

  test("parses setup.cfg entry_points console_scripts", async () => {
    const content = `[options.entry_points]
console_scripts =
    mycli = mypackage.cli:main
    other = other_pkg:run`;
    await fs.writeFile(path.join(tmpDir, "setup.cfg"), content);
    const result = await pythonDetector.detect(tmpDir);
    const scriptActions = result.filter((a) => a.id.startsWith("python-script-"));
    assert.deepStrictEqual(scriptActions.map((a) => a.label), ["mycli", "other"]);
    assert.deepStrictEqual(scriptActions.map((a) => a.command), ["python -m mypackage.cli", "python -m other_pkg"]);
  });

  test("sets correct id, command, and source", async () => {
    await fs.writeFile(path.join(tmpDir, "pyproject.toml"), "[build-system]\nrequires = [\"setuptools\"]\n");
    const result = await pythonDetector.detect(tmpDir);
    const action = result.find((a) => a.label === "build");
    assert.ok(action);
    assert.strictEqual(action!.id, "python-build");
    assert.strictEqual(action!.command, "python -m build");
    assert.strictEqual(action!.source, "pyproject.toml");
  });
});
