import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { benchmark } from "./lib/timing";
import { printTable } from "./lib/format";
import { detectors } from "../src/detectors/index";

function createFixtures(root: string) {
  fs.mkdirSync(root, { recursive: true });

  const pkgScripts: Record<string, string> = {};
  for (let i = 1; i <= 20; i++) {
    pkgScripts[`script-${i}`] = `echo ${i}`;
  }
  fs.writeFileSync(
    path.join(root, "package.json"),
    JSON.stringify({ name: "test", scripts: pkgScripts }, null, 2),
  );
  fs.writeFileSync(path.join(root, "bun.lock"), "");

  const composerScripts: Record<string, string> = {};
  for (let i = 1; i <= 10; i++) {
    composerScripts[`script-${i}`] = `echo ${i}`;
  }
  fs.writeFileSync(
    path.join(root, "composer.json"),
    JSON.stringify({ scripts: composerScripts }, null, 2),
  );

  const makeTargets: string[] = [];
  for (let i = 1; i <= 50; i++) {
    makeTargets.push(`target-${i}`);
  }
  const makefileLines: string[] = [
    `.PHONY: ${makeTargets.join(" ")}`,
    ...makeTargets.map((t) => `${t}:\n\techo ${t}`),
  ];
  fs.writeFileSync(path.join(root, "Makefile"), makefileLines.join("\n"));

  const rakeTasks: string[] = [];
  for (let i = 1; i <= 15; i++) {
    rakeTasks.push(`task :task-${i}`);
  }
  fs.writeFileSync(path.join(root, "Rakefile"), rakeTasks.join("\n"));

  const profiles: string[] = [];
  for (let i = 1; i <= 5; i++) {
    profiles.push(`<profile><id>profile-${i}</id></profile>`);
  }
  fs.writeFileSync(
    path.join(root, "pom.xml"),
    `<project>\n  <profiles>\n    ${profiles.join("\n    ")}\n  </profiles>\n</project>`,
  );

  const gradleTasks: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const q = i % 3 === 0 ? '"' : i % 3 === 1 ? "'" : "";
    gradleTasks.push(`task ${q}custom-${i}${q}`);
  }
  fs.writeFileSync(path.join(root, "build.gradle"), gradleTasks.join("\n"));

  const cargoLines: string[] = [
    "[package]",
    'name = "pkg"',
    'version = "0.1.0"',
    "",
    "[[bin]]",
    'name = "bin1"',
    "",
    "[[bin]]",
    'name = "bin2"',
    "",
    "[[example]]",
    'name = "ex1"',
    "",
    "[[example]]",
    'name = "ex2"',
    "",
    "[[test]]",
    'name = "t1"',
    "",
    "[[test]]",
    'name = "t2"',
    "",
    "[[bench]]",
    'name = "b1"',
    "",
    "[workspace]",
    'members = ["member-a", "member-b", "member-c"]',
  ];
  fs.writeFileSync(path.join(root, "Cargo.toml"), cargoLines.join("\n"));

  fs.writeFileSync(path.join(root, "go.mod"), "module example.com/test\ngo 1.21");
  for (const name of ["server", "worker", "cli"]) {
    const dir = path.join(root, "cmd", name);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "main.go"), "package main\n");
  }

  const pyprojectLines: string[] = [
    "[build-system]",
    'requires = ["setuptools"]',
    "",
    "[tool.pytest.ini_options]",
    'minversion = "7.0"',
    "",
    "[tool.tox]",
    'env_list = ["py311"]',
    "",
    "[project.scripts]",
    's1 = "m1:main"',
    's2 = "m2:main"',
    's3 = "m3:main"',
    's4 = "m4:main"',
    's5 = "m5:main"',
  ];
  fs.writeFileSync(path.join(root, "pyproject.toml"), pyprojectLines.join("\n"));
}

async function main() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "benchmark-detectors-"));
  createFixtures(root);

  const rows: {
    name: string;
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  }[] = [];
  for (const detector of detectors) {
    const stats = await benchmark(() => detector.detect(root), { warmup: 5, iterations: 100 });
    rows.push({ name: detector.id, ...stats });
  }

  const parallelStats = await benchmark(() => Promise.all(detectors.map((d) => d.detect(root))), {
    warmup: 5,
    iterations: 100,
  });
  rows.push({ name: "all-parallel", ...parallelStats });

  printTable(
    "Detector Performance (100 runs each, in µs)",
    ["name", "min", "max", "mean", "p50", "p95", "p99"],
    rows,
  );

  fs.rmSync(root, { recursive: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
