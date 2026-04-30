import * as fs from "fs/promises";
import * as path from "path";
import { Detector, SuggestedAction } from "../types";

export const gradleDetector: Detector = {
  id: "gradle",
  fileGlobs: ["build.gradle", "build.gradle.kts"],

  async detect(workspaceRoot: string): Promise<SuggestedAction[]> {
    const candidates = ["build.gradle", "build.gradle.kts"];
    let content: string | undefined;
    let foundFile: string | undefined;

    for (const name of candidates) {
      const filePath = path.join(workspaceRoot, name);
      try {
        await fs.access(filePath);
        content = await fs.readFile(filePath, "utf-8");
        foundFile = name;
        break;
      } catch {
        continue;
      }
    }

    if (content === undefined) {
      return [];
    }

    const tasks = new Set<string>();

    // Common Gradle tasks
    tasks.add("build");
    tasks.add("test");
    tasks.add("clean");

    // Detect wrapper
    let gradleCmd = "gradle";
    try {
      await fs.access(path.join(workspaceRoot, "gradlew"));
      gradleCmd = "./gradlew";
    } catch {
      // use default gradle
    }

    // Groovy DSL: task name, task 'name', task "name"
    const groovyTaskRe = /^task\s+(?:['"])?([\w-]+)(?:['"])?/gm;
    let m: RegExpExecArray | null;
    while ((m = groovyTaskRe.exec(content)) !== null) {
      tasks.add(m[1]);
    }

    // Kotlin DSL: tasks.register("name") or tasks.register("name") { }
    const ktsTaskRe = /tasks\.register\s*\(\s*['"]([\w-]+)['"]\s*\)/g;
    while ((m = ktsTaskRe.exec(content)) !== null) {
      tasks.add(m[1]);
    }

    return Array.from(tasks).map((name) => ({
      id: `gradle-${name}`,
      label: name,
      command: `${gradleCmd} ${name}`,
      source: foundFile!,
    }));
  },
};
