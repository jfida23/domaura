---
name: code-simplifier
description: Simplify recently modified code for clarity, consistency, and maintainability while preserving behavior. Use during the REFACTOR step of OpenSpec implementation after relevant tests pass, or when explicitly asked to simplify code.
license: Apache-2.0
---

# Code Simplifier

Adapted from Anthropic's code-simplifier agent; see [UPSTREAM.md](UPSTREAM.md)
for the pinned source and adaptation details. Run this review in the current
Codex session; no Claude model or separate agent is required.

## Scope and prerequisites

- Read the applicable AGENTS.md instructions and follow repository conventions.
  For OpenSpec work, retain the selected change's requirements, acceptance
  scenarios, and task scope as the contract.
- Review code touched by the current task or behavior slice. Broaden scope only
  when the user requests it; preserve unrelated and user-authored changes.
- Start with passing relevant tests and regression coverage for the behavior
  being refactored. If coverage is missing, establish it first using the local
  TDD skill. If relevant tests fail, resolve or report the failure before
  simplifying; do not treat a failing baseline as GREEN.
- Do not require a code simplification pass for planning, documentation,
  configuration, or generated scaffolding alone. Use their appropriate checks.

## Simplification review

Look for concrete improvements to readability and maintenance:

- Reduce unnecessary nesting, redundant branches, duplicate logic, and
  abstractions that add no useful separation.
- Use names that explain intent and keep related logic together without
  combining distinct responsibilities.
- Prefer clear control flow to dense expressions or nested ternaries.
- Remove comments that only repeat the code; retain rationale and constraints.
- Follow the project's actual language, typing, import, component, and error
  handling conventions rather than imposing a new style or framework.

Preserve features, outputs, errors, side effects, public contracts, and edge
cases. Do not narrow an acceptance scenario, remove useful abstractions, weaken
valid tests, add dependencies, or expand scope merely to shorten the code.
If an improvement would change behavior, treat it as a behavior change under
OpenSpec and TDD, starting with RED before modifying production behavior.

Make only refinements with a clear benefit. A review that finds no useful
simplification is a valid no-op; do not manufacture edits.

## Verification and reporting

After edits, rerun the focused tests and relevant regression coverage. Resolve
any regression from the refactor while preserving unrelated work. Before
declaring implementation complete, run the full application suite and configured
lint, type, build, and acceptance checks required by AGENTS.md.

Briefly report significant refinements or that no simplification was needed,
the actual checks run, and any failures or unavailable checks. Keep the existing
RED/GREEN evidence for the behavior slice; a behavior-preserving REFACTOR does
not require an invented failing test.
