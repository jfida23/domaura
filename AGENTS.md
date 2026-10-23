# Development workflow

Use OpenSpec for requirements, design, and implementation tasks. Use the
repository's `test-driven-development` skill for application features, bug fixes,
and behavior changes; read `.agents/skills/test-driven-development/SKILL.md` and
its referenced testing guidance before implementation. OpenSpec remains the
planning workflow; installing the TDD skill does not introduce another planner.

## Test-driven development

- Work in small behavior slices tied to an OpenSpec requirement and scenario
  when applicable. Test observable behavior rather than implementation details.
- RED: write a focused test and run it before changing production behavior.
  Confirm it fails for the expected missing behavior, rather than a broken
  environment, typo, or unrelated error. Record the command and failure.
- GREEN: implement only enough to pass, then run the focused test.
- REFACTOR: improve structure while keeping tests green. For behavior-preserving
  refactors, establish passing regression coverage before editing; a new failing
  test is needed only when behavior changes.
- During OpenSpec implementation's REFACTOR step, read and apply
  `.agents/skills/code-simplifier/SKILL.md` to code touched by the current task
  after relevant tests pass. Preserve behavior and acceptance scope, allow a
  no-op review, and rerun focused and regression tests after refinements. This
  instruction applies to existing tasks too; planning and documentation-only
  work use their appropriate validation.
- Run the full application test suite before declaring an implementation change
  complete, plus relevant configured lint, type, build, and acceptance checks.
  Report all observed failures, including pre-existing failures.
- Never weaken, skip, or delete a valid test simply to make implementation pass.
  Correct an erroneous test against the specification and explain the correction.
- If implementation was written before RED, revert only your own premature
  changes and restart the slice. Preserve user work and unrelated changes.
- Documentation, planning artifacts, configuration, and generated scaffolding
  use appropriate validation instead of artificial tests. These exceptions are
  pre-approved; they do not exempt application logic included in such a change.
  Record the exception and actual validation in the completion report. Get an
  explicit user exception before bypassing TDD for application behavior.

## OpenSpec integration and evidence

- Follow `openspec instructions` for the selected change. Apply TDD to existing
  implementation tasks even if their wording only says to verify after coding.
- Mark a behavior task complete only after its acceptance scenarios pass.
- In the completion report or PR, identify the task/scenario, test, actual RED
  command and expected failure observed, GREEN result, and final suite results.
  State any exception or check that could not run. Never invent execution evidence.
- Keep evidence concise in the report; the instructions themselves are not proof
  of execution. Do not claim that passing CI proves tests were written first.

## Commands and initial scaffold

Current repository validation:

```sh
openspec validate --all --strict --no-interactive
```

The repository has no application test runner yet. When scaffolding the first
application, choose the runner alongside the runtime, document actual focused
and full-suite commands in `README.md`, and add a CI job that runs the suite
before adding domain behavior. Configure CI so missing tests and test failures
fail that job. The OpenSpec validation job validates planning artifacts only.

The local TDD skill is vendored from Superpowers; see its `UPSTREAM.md` for the
pinned revision and update procedure. Keep its license and attribution intact.
