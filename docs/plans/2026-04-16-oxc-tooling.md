# Oxc Tooling Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Oxc-based linting and formatting to this repo, apply the new tooling across the codebase, and verify the existing build and test flows still pass.

**Architecture:** Use Oxc as the only new lint/format tool. Keep configuration minimal, centralize ignores in config files, expose developer-friendly package scripts in `package.json`, and validate the rollout with the existing `compile` and `test` commands.

**Tech Stack:** TypeScript, Bun scripts, Oxc/Oxlint/Oxfmt, Mocha, VS Code Extension API

---

### Task 1: Inspect current package and repo surface

**Files:**

- Modify: `package.json`
- Check: `tsconfig.json`
- Check: `src/**`
- Check: `src/test/suite/**`

**Step 1: Confirm current scripts and dependencies**

Read `package.json` and note existing script names so new scripts do not conflict.

**Step 2: Confirm generated/output directories**

Check current repo directories and note `out/`, `node_modules/`, and `.vscode-test/` as ignore candidates.

**Step 3: Record intended lint/format target surface**

Target source and repo-owned config files only; exclude generated output and dependencies.

**Step 4: Commit**

Do not commit yet unless explicitly requested.

### Task 2: Add Oxc dependency and scripts

**Files:**

- Modify: `package.json`

**Step 1: Add the dev dependency**

Add Oxc to `devDependencies`.

**Step 2: Add package scripts**

Add exact scripts for:

```json
{
  "lint": "oxlint .",
  "lint:fix": "oxlint --fix .",
  "format": "oxfmt --write .",
  "format:check": "oxfmt --check ."
}
```

Adjust command paths if Oxc expects a slightly different CLI shape in the installed version.

**Step 3: Install dependencies**

Run the package manager install step needed to update lockfiles consistently with the repo's existing package manager usage.

**Step 4: Verify scripts resolve**

Run the lint/format commands in check mode if possible to confirm the binaries are available.

### Task 3: Add minimal Oxc configuration

**Files:**

- Create: `.oxlintrc.json`
- Create: `.oxfmtrc.json`

**Step 1: Create lint config**

Create `.oxlintrc.json` with a schema reference and centralized ignore patterns.

Example shape:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "ignorePatterns": ["out/**", "node_modules/**", ".vscode-test/**"]
}
```

**Step 2: Create formatter config**

Create `.oxfmtrc.json` with a schema reference and only minimal defaults.

Example shape:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json"
}
```

Only add extra formatter options if the repo needs them after the first run.

**Step 3: Validate config file names and schema paths**

Confirm the installed tool recognizes the chosen file names and paths.

### Task 4: Apply formatting and lint autofixes

**Files:**

- Modify: repo-owned files touched by formatter/linter

**Step 1: Run formatter**

Run:

```bash
bun run format
```

Expected: repo files are rewritten to Oxc formatting conventions.

**Step 2: Run lint autofix**

Run:

```bash
bun run lint:fix
```

Expected: auto-fixable lint issues are resolved.

**Step 3: Inspect remaining lint issues**

Run:

```bash
bun run lint
```

Expected: either clean pass or a short list of manual fixes.

**Step 4: Make minimal manual edits if needed**

Only fix repo-owned files and keep changes aligned with existing patterns.

### Task 5: Validate build and test flows

**Files:**

- No intentional new files

**Step 1: Run compile**

Run:

```bash
bun run compile
```

Expected: PASS with no TypeScript errors.

**Step 2: Run tests**

Run:

```bash
bun run test
```

Expected: PASS with the existing suite succeeding after formatting/lint cleanup.

**Step 3: Re-run format/lint checks if needed**

Run:

```bash
bun run format:check
bun run lint
```

Expected: both pass cleanly.

### Task 6: Summarize rollout results

**Files:**

- No file creation required

**Step 1: Summarize changed files**

List the config and script changes plus any code files touched by formatter/linter.

**Step 2: Summarize command results**

Report results for:

- dependency install
- `bun run format`
- `bun run lint:fix`
- `bun run lint`
- `bun run format:check`
- `bun run compile`
- `bun run test`

**Step 3: Note any follow-up recommendations**

Possible follow-ups, only if still needed:

- add lint/format to CI
- document contributor commands in `README.md`
- add editor integration guidance

**Step 4: Commit**

Do not commit unless explicitly requested by the user.
