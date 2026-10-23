# Upstream source

- Project: [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
- Revision: `58267944f92187b7d6a1c822165c96c81c864806`
- Source: `plugins/code-simplifier/agents/code-simplifier.md`
- Plugin version: `1.0.0`
- Adapted: 2026-10-24
- Author: Anthropic
- License: Apache-2.0; the upstream license is included in `LICENSE`.

`SKILL.md` is a modified adaptation, not an unchanged upstream file. It replaces
the Claude agent frontmatter and model selection with Codex skill metadata,
uses AGENTS.md and repository conventions instead of CLAUDE.md and fixed stack
preferences, and integrates the review with OpenSpec's scope and the local TDD
REFACTOR step. It also permits a no-op review and requires passing coverage and
actual verification evidence. It runs in the current session without delegation.

To update, review a specific upstream revision and its license, reconcile its
instructions with AGENTS.md and OpenSpec/TDD, update this revision and adaptation
notes, and run the skill validator and repository validation. Do not overwrite
the local workflow safeguards with the upstream agent definition.
