# Oxc Tooling Design

## Goal

Add a fast, low-overhead linting and formatting workflow to this VS Code extension repo using Oxc, then apply the new formatter/linter once across the codebase.

## Context

- The repo currently has TypeScript build/test scripts but no dedicated lint or format tooling.
- The project already uses Bun for scripts and TypeScript compilation.
- Generated output lives in `out/` and must not become part of the lint/format target surface.
- Existing validation commands are `bun run compile` and `bun run test`.

## Requirements

- Install Oxc for both linting and formatting.
- Keep setup minimal and easy to maintain.
- Add package scripts for local developer use.
- Ignore generated and dependency directories.
- Run formatting and lint fixes across the repo now.
- Re-run compile and test afterward to confirm no regressions.

## Options Considered

### Option 1: Oxc only, minimal config

Use Oxc as the single lint/format tool with a small config and a few package scripts.

**Pros**

- Fast
- Small setup surface
- Good fit for a TypeScript repo with simple tooling needs

**Cons**

- Less plugin ecosystem than ESLint + Prettier
- Some teams may already be more familiar with ESLint conventions

### Option 2: Oxc with stricter custom rule tuning

Adopt Oxc but spend more time shaping rule behavior up front.

**Pros**

- Stronger enforcement from day one

**Cons**

- More churn during rollout
- Higher chance of bikeshedding before the team has used the defaults

### Option 3: ESLint + Prettier

Use the traditional JS/TS toolchain.

**Pros**

- Largest ecosystem
- Familiar to most contributors

**Cons**

- More dependencies and configuration
- Slower and heavier than needed for this repo's current scope

## Decision

Choose **Option 1: Oxc only, minimal config**.

This matches the repo's size and current needs. It gives fast linting and formatting without introducing a large maintenance burden.

## Proposed Changes

### Dependencies

- Add Oxc as a dev dependency in `package.json`.

### Package scripts

Add scripts for:

- `lint`
- `lint:fix`
- `format`
- `format:check`

These should target the repository source rather than generated output.

### Config files

Add minimal Oxc config files for linting and formatting.

Expected concerns:

- ignore `out/`
- ignore `node_modules/`
- ignore `.vscode-test/`
- keep defaults unless a repo-specific issue requires small overrides

### Rollout behavior

After config is added:

1. run formatter across the repo
2. run lint autofix where available
3. inspect any remaining issues
4. run `bun run compile`
5. run `bun run test`

## Testing Strategy

No new automated tests are needed for Oxc itself.

Validation is command-based:

- package scripts run successfully
- TypeScript compile still passes
- extension test suite still passes

## Risks

- Formatter output may touch many files at once.
- Some lint rules may require light code cleanup beyond formatting.
- Config path or script naming should stay clear and conventional for contributors.

## Non-Goals

- No CI workflow changes in this pass
- No editor settings or extension recommendations in this pass
- No migration to ESLint/Prettier

## Success Criteria

- Developers can run lint and format from `package.json` scripts.
- Generated output is excluded.
- Repo compiles and tests cleanly after applying fixes.
