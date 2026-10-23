# Design

## Context

See proposal.md for motivation. The repository has no application runner yet. Its vendored OpenSpec apply skill consumes `operations.apply.guidance`; AGENTS.md already defines RED, GREEN, REFACTOR, and evidence requirements.

## Goals / Non-Goals

**Goals:** Provide a discoverable Codex skill and an explicit workflow instruction to read it during REFACTOR.

**Non-Goals:** Run a Claude model, introduce subagent delegation, modify generated OpenSpec skills, or add application behavior.

## Decisions

- Store the adaptation in `.agents/skills/code-simplifier/SKILL.md` so it travels with the repository. A user-global skill would not provide the same shared workflow.
- Adapt the Anthropic agent's readability and scope guidance, retaining the Apache-2.0 license and pinned source attribution. Remove Claude model selection and replace its stack-specific defaults with repository conventions.
- Require reading the skill in AGENTS.md and OpenSpec apply guidance. Keep generated OpenSpec skills intact so updates do not overwrite the integration. This is an instruction contract, not an executable hook.
- Perform simplification only after passing relevant coverage. Preserve OpenSpec acceptance behavior, scope, and valid tests; rerun focused tests after edits and the full configured checks before completion. A no-op review is valid.
- Validate Markdown skill metadata and OpenSpec artifacts, inspect emitted apply guidance, and review workflow cases. No artificial application tests are needed for instruction-only changes.

## Risks / Trade-offs

- Instructions can be overlooked by an agent → include the trigger both in repository policy and the apply guidance the CLI emits.
- Upstream instructions may evolve → pin the source revision and document the adaptation and update procedure.
- A simplification could alter behavior → preserve passing coverage and acceptance criteria; route any behavior change through RED first.

## Migration Plan

Add the local skill and guidance, then start a new Codex session for skill discovery. The current session can read the file directly. Roll back by removing the guidance and skill files together; the installed upstream plugin remains independent.
