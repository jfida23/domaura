# Proposal

## Why

The installed Anthropic code-simplifier plugin provides a Claude agent definition, but the repository's Codex OpenSpec workflow has no instruction to load it. A local Codex skill will make simplification an explicit part of REFACTOR.

## What Changes

- Adapt the upstream instructions into a repository-local `code-simplifier` skill with license and pinned attribution.
- Require the skill during OpenSpec implementation's REFACTOR step through AGENTS.md and OpenSpec apply guidance.
- Document invocation and preserve existing test-first, scope, and completion rules.

## Capabilities

### New Capabilities

None. This is developer tooling and documentation; `skip_specs: true` applies.

### Modified Capabilities

None. Application requirements remain unchanged.

## Impact

Changes affect repository instructions, OpenSpec configuration, and a Markdown skill. No application logic, runtime dependencies, generated OpenSpec skills, or installed plugin cache will be changed. Validation uses the skill validator, OpenSpec validation, and instruction review under the pre-approved non-behavior exception.
