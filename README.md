# Domaura

A web app for exploring the housing market in a local area.

The current shell focuses on comparing rental housing within Lugano municipality
against personal requirements and preferences, using synthetic data.

## Direction

Help people understand and explore the housing market in an area of interest.
Potential areas to investigate include property discovery, location-based
comparisons, and market trends. These are possibilities, not committed features.

## Open decisions

- Data sources, access rights, quality, and update frequency.
- Reliable municipal evidence for real offers.
- Additional criteria beyond the starter catalogue.
- Hosting and a separately scoped live-data release.

## Repository status

The Lugano rental comparison is a local demonstration shell using synthetic
offers, not a live rental search service. No source integration or deployment is
included. Criteria live in browser memory and reset on reload.

## Local application

Use Node.js 24 and npm. React and TypeScript provide the UI, Vite serves and
builds it, and Vitest with Testing Library runs domain and UI acceptance tests.
Domain contracts and evaluation live in `src/domain`; presentation lives in
`src/ui`. Install the locked dependencies and launch locally:

```sh
npm ci
npm run dev
```

Open the local URL printed by Vite (normally http://127.0.0.1:5173).

```sh
npm test                                  # full suite; missing tests fail
npm test -- src/domain/eligibility.test.ts # focused test file
npm run typecheck
npm run build
npx playwright install chromium           # once for browser acceptance
npm run test:e2e                          # desktop and mobile Chromium
```

`npm run test:watch` runs tests interactively. `npm run preview` serves the build.
CI's Application tests job runs the full suite, build, and browser acceptance; no lint tool is
configured. The OpenSpec validation job checks planning artifacts separately.

## Comparing the examples

Add **Maximum monthly base rent** as Must have and enter an inclusive maximum
in **CHF / month**. Base rent excludes additional charges and is not total housing
cost. Add **Balcony present** as Nice to have to express desired feature presence.
These starter examples form a typed catalogue, rather than natural-language
interpretation. You can edit, remove, or change each criterion's tier. Invalid
input stays in the form for correction and is not applied. There are exactly two
tiers and no preference weights.

With rent at most 1800 CHF/month and balcony as Must have, Garden apartment meets
all requirements; Courtyard studio has an unmet balcony requirement; Hillside
flat needs verification because its rent and balcony information are missing.
With balcony as Nice to have, Courtyard meets the rent requirement and shows one
unmet preference. Changing the tier updates fit immediately. Each eligible offer
uses the same active criteria and shows each outcome and its supporting evidence.

Unmet requirements take precedence over unknown requirements; preference matches
cannot compensate for either. Preference summaries count satisfied, unmet, and
unknown results equally without a ranking or combined score. Preferences alone
show “No requirements specified.” With no criteria, the UI asks for them before
showing fit; with no eligible offers, it explains why comparison is unavailable.

The comparison core compares only compatible cost measures, currencies, and
periods; it does not convert currencies or infer total costs from base rent.
Missing attributes remain unknown. Synthetic fixture evidence does not establish
availability, actual rents, municipal coverage, or real-world suitability.
See [offer contracts and evidence](docs/offer-contract.md) and the
[implementation evidence](docs/lugano-verification.md).

## Development workflow

Use OpenSpec to plan changes and the repository's vendored
[Superpowers TDD skill](.agents/skills/test-driven-development/SKILL.md) to
implement application behavior. [AGENTS.md](AGENTS.md) defines the policy:
write a focused test, observe its expected failure, implement enough to pass,
then refactor with tests green. Follow this cycle for existing OpenSpec tasks
as well as new ones.

During OpenSpec implementation's REFACTOR step, read and apply the repository's
[Code Simplifier skill](.agents/skills/code-simplifier/SKILL.md) after relevant
tests pass. AGENTS.md and OpenSpec apply guidance require this review for code
touched by each task, including existing tasks. It preserves behavior and
acceptance scope, permits a no-op review, and reruns focused and regression tests
after edits, followed by the required completion checks.

Start a new Codex session to discover the local skill; invoke it explicitly with
`$code-simplifier` when needed. This is an instruction-based workflow, not an
executable hook. The adaptation runs in Codex without relying on the installed
Claude agent plugin; its pinned source and license are recorded in
[UPSTREAM.md](.agents/skills/code-simplifier/UPSTREAM.md).

Completion reports and PRs should identify the task or spec scenario, test,
RED command and observed failure, GREEN result, and final full-suite results.
Document configuration and documentation validation separately.

Validate planning artifacts with OpenSpec 1.14.3:

```sh
openspec validate --all --strict --no-interactive
```

[Repository validation](.github/workflows/validation.yml) runs that check in
GitHub Actions alongside the Application tests job. Missing tests and failing
tests fail the application job.

After publishing to GitHub and running CI, configure branch protection to
require pull requests and `OpenSpec validation`, apply it to administrators,
and disable bypasses. Require the application test job as soon as it exists.
Local instructions guide test-first development; CI enforces its configured
checks but cannot establish the order in which tests and code were written.
