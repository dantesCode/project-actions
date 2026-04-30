# Multi-Language Detector Design

## Summary

Add 6 new language detectors (Ruby, Java, Kotlin, Rust, Go, Python) with a `Detector` interface + registry pattern and early file-existence checks for fast loading.

## Problem

Current detectors (package.json, composer.json, Makefile) are hardcoded with no shared abstraction. Adding 6 more would require manual wiring per detector. Every detector always runs (reads + parses), even if its target file doesn't exist — wasteful with 9 total detectors.

## Design

### Detector Interface

```ts
// src/detectors/types.ts
export interface Detector {
  id: string;                    // unique key, e.g. "package-json"
  fileGlobs: string[];           // files to watch, e.g. ["package.json"]
  detect(root: string): Promise<SuggestedAction[]>;
}
```

### Registry

```ts
// src/detectors/index.ts
import { packageJsonDetector } from "./packageJsonDetector";
import { composerJsonDetector } from "./composerJsonDetector";
import { makefileDetector } from "./makefileDetector";
import { rubyDetector } from "./rubyDetector";
import { javaDetector } from "./javaDetector";
import { kotlinDetector } from "./kotlinDetector";
import { cargoDetector } from "./cargoDetector";
import { goDetector } from "./goDetector";
import { pythonDetector } from "./pythonDetector";

export const detectors: Detector[] = [
  packageJsonDetector,
  composerJsonDetector,
  makefileDetector,
  rubyDetector,
  javaDetector,
  kotlinDetector,
  cargoDetector,
  goDetector,
  pythonDetector,
];
```

### Provider Changes

`suggestedActionsProvider.ts` replaces hardcoded imports/Promise.all with:

```ts
import { detectors } from "./detectors";

// In getChildren():
const suggestions: SuggestedAction[] = [];
const results = await Promise.all(
  detectors.map(d => d.detect(root))
);
for (const result of results) {
  suggestions.push(...result);
}
```

### Watcher Changes

`suggestedFilesWatcher.ts` builds glob from registry:

```ts
import { detectors } from "./detectors";
const glob = "{" + detectors.flatMap(d => d.fileGlobs).join(",") + "}";
```

### Early Existence Check

Each detector's `detect()` starts with:

```ts
async detect(root: string): Promise<SuggestedAction[]> {
  const filePath = path.join(root, "<target-file>");
  try {
    await fs.promises.access(filePath);
  } catch {
    return [];  // fast skip — no read, no parse
  }
  // ... read and parse
}
```

For detectors with multiple candidate files (Makefile, Java), check each candidate and use the first found.

### Existing Detectors — Refactor

Each existing detector module adds a `Detector` export alongside the existing named functions (backward compat during transition):

```ts
export const packageJsonDetector: Detector = {
  id: "package-json",
  fileGlobs: ["package.json"],
  async detect(root: string): Promise<SuggestedAction[]> { ... }
};
```

Remove sync functions and direct named-function exports. Update tests to use `detector.detect()`.

### New Detectors

| Detector | id | File(s) | What it detects | Command pattern |
|---|---|---|---|---|
| Ruby | `ruby` | `Rakefile` | Rake task targets | `rake <task>` |
| Java | `java` | `pom.xml`, `build.gradle` | Maven phases (from pom.xml), Gradle tasks (from build.gradle) | `mvn <phase>` or `gradle <task>` |
| Kotlin | `kotlin` | `build.gradle.kts` | Gradle tasks | `gradle <task>` |
| Rust | `cargo` | `Cargo.toml` | Standard cargo targets + `[package.metadata.scripts]` if present | `cargo <command>` |
| Go | `go` | `go.mod` | Standard go commands | `go <command>` |
| Python | `python` | `pyproject.toml`, `setup.py` | Scripts from `[tool.poetry.scripts]` or `[project.scripts]` | `<script>` |

#### Ruby (Rakefile)

- Parse Rakefile for task definitions: `task :name` and `task "name"` patterns
- Filter common prefixes (default, build, test, etc.)

#### Java (pom.xml + build.gradle)

- **pom.xml**: Extract standard Maven lifecycle phases (compile, test, package, install, etc.)
- **build.gradle**: Parse for task definitions; if unreadable (Groovy DSL is complex), provide standard tasks

#### Kotlin (build.gradle.kts)

- Same as Gradle approach; kts variant
- Only active if `build.gradle.kts` exists (no `build.gradle` fallback — that's the Java detector)

#### Rust (Cargo.toml)

- Standard cargo commands: build, test, run, check, clippy
- Optional: read `[package.metadata.scripts]` for custom scripts (like npm scripts)

#### Go (go.mod)

- Standard go commands: build, test, run, vet, fmt
- Module name from `go.mod`

#### Python (pyproject.toml / setup.py)

- **pyproject.toml**: Read `[project.scripts]` and `[tool.poetry.scripts]`
- Provide standard commands if tox/nox config detected

### File Structure

```
src/detectors/
  types.ts              # Detector interface
  index.ts              # registry array
  packageJsonDetector.ts
  composerJsonDetector.ts
  makefileDetector.ts
  rubyDetector.ts       # NEW
  javaDetector.ts       # NEW
  kotlinDetector.ts     # NEW
  cargoDetector.ts      # NEW
  goDetector.ts         # NEW
  pythonDetector.ts     # NEW
```

### Testing

- Each new detector gets its own test file in `src/test/suite/`
- Tests use sync file reads + temp fixtures (following existing pattern)
- Test existence check returns `[]` for missing files
- Test parsing returns correct `SuggestedAction[]` for sample files
- Registry integration test: verify `detectors` array length and all IDs unique

### Performance

- Early existence check skips ~6 detectors instantly on any given project (only 1-2 languages typically present)
- Existing 3 detectors also get the fast-skip treatment
- No caching needed at this scale — file existence check is sub-millisecond