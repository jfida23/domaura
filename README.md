# Domaura

A web app for exploring the housing market in a local area.

The scope is intentionally broad. This repository is a starting point for
refining the product, understanding available data, and choosing an implementation.

## Direction

Help people understand and explore the housing market in an area of interest.
Potential areas to investigate include property discovery, location-based
comparisons, and market trends. These are possibilities, not committed features.

## Open decisions

- Target users and their main questions.
- Geographic coverage and the meaning of "local area".
- Sales, rentals, or both.
- Data sources, access rights, quality, and update frequency.
- Initial user experience and smallest useful release.
- Technology stack, hosting, and deployment.

## Repository status

Repository setup only. No application framework, dependencies, data integrations,
or deployment configuration have been selected yet.

There are no build, run, or test commands at this stage. Add them here when the
first application scaffold is introduced.

## Development workflow

Use OpenSpec to plan changes and the repository's vendored
[Superpowers TDD skill](.agents/skills/test-driven-development/SKILL.md) to
implement application behavior. [AGENTS.md](AGENTS.md) defines the policy:
write a focused test, observe its expected failure, implement enough to pass,
then refactor with tests green. Follow this cycle for existing OpenSpec tasks
as well as new ones.

Completion reports and PRs should identify the task or spec scenario, test,
RED command and observed failure, GREEN result, and final full-suite results.
Document configuration and documentation validation separately.

Validate planning artifacts with OpenSpec 1.14.3:

```sh
openspec validate --all --strict --no-interactive
```

[Repository validation](.github/workflows/validation.yml) runs that check in
GitHub Actions. It currently validates OpenSpec artifacts only. When the first
application is scaffolded, add its actual test commands here and a CI job that
runs the full suite and fails on missing tests or failures before adding domain
behavior.

After publishing to GitHub and running CI, configure branch protection to
require pull requests and `OpenSpec validation`, apply it to administrators,
and disable bypasses. Require the application test job as soon as it exists.
Local instructions guide test-first development; CI enforces its configured
checks but cannot establish the order in which tests and code were written.
