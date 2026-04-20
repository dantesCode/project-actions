# Changelog

## [1.0.0] — 2026-04-20

### Fixed
- Suggested actions now auto-refresh when `package.json`, `composer.json`, or Makefiles are modified
- Config schema now validates for duplicate action IDs across groups on load
- Makefile detector now reports the correct source filename (`Makefile`/`makefile`/`GNUmakefile`)
- Editor title picker command properly registered in VS Code

## [0.6.0] — (prior release)
Initial release with curated and suggested project actions support.
