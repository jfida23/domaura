# Tasks

## 1. Codex skill

- [x] 1.1 Adapt the pinned Anthropic code-simplifier into a repository skill with license and upstream notes; validate with skill-creator's quick_validate.py and review scope, passing-test prerequisites, behavior preservation, and no-op handling.

## 2. Workflow integration

- [x] 2.1 Wire the skill into AGENTS.md and OpenSpec apply guidance and document automatic and explicit invocation in README.md; verify emitted apply guidance and resolve all referenced paths.

## 3. Integration validation

- [x] 3.1 Run strict all-artifact OpenSpec validation and git diff --check, review GREEN, failed-test, no-op, and documentation-only workflow cases, and record the non-behavior exception and actual results.

## Validation evidence

- Exception: instruction, documentation, and configuration changes only; AGENTS.md pre-approves appropriate validation instead of application RED/GREEN tests. No application runner, lint, type, or build checks exist yet.
- Skill metadata: direct `python quick_validate.py` could not run because `python` resolves to the Windows Store alias. `uv run --with pyyaml python C:/Users/Jacopo/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/code-simplifier` passed: `Skill is valid!`.
- Integration: `openspec instructions apply --change integrate-code-simplifier --json` emitted the new REFACTOR guidance. Referenced skill, upstream notes, and license paths exist. Copied license SHA-256 matches the installed upstream license.
- Instruction review (not agent execution): a GREEN slice reviews only touched code and reruns tests after edits; a failed baseline blocks simplification; a no-op review permits no edits; documentation-only work uses appropriate validation. A proposed behavior change must return to RED and respect OpenSpec scope.
- `openspec validate --all --strict --no-interactive` passed both changes (2 passed, 0 failed); the tooling change intentionally skips specs. `git diff --check` passed, with a Git LF-to-CRLF normalization warning for openspec/config.yaml.
- Runtime limitation: skill discovery and automatic use in a fresh Codex session have not been exercised; the emitted guidance and file structure were verified locally.
