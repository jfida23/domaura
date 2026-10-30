# Domaura

A web app for exploring the housing market in a local area.

The current shell focuses on comparing rental housing within Lugano municipality
against personal requirements and preferences, using a bounded local Livit
collection or explicitly selected synthetic examples.

## Direction

Help people understand and explore the housing market in an area of interest.
Potential areas to investigate include property discovery, location-based
comparisons, and market trends. These are possibilities, not committed features.

## Open decisions

- Additional sources, public reuse rights, and scheduled refreshes.
- Broader coverage for incomplete or ambiguous addresses.
- Additional criteria beyond the starter catalogue.
- Hosting and a separately scoped live-data release.

## Repository status

The Livit integration is a manually refreshed, private local pilot capped at 20
verified residential rental adverts in Lugano municipality. It is not a complete
market feed. Criteria live in browser memory and reset on reload. Public hosting
and redistribution are outside the recorded source-use conditions.

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

Normal startup selects **Collected listings**, loading the local export. It shows
loading, a successful empty collection and unavailable/invalid data distinctly.
Choose **Demo examples** explicitly to use the invented fixtures below. Switching
back preserves active criteria and removes the synthetic offers. No missing
collection is automatically replaced with examples.

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

## Collecting Livit locally

Read [source conditions and collection instructions](docs/livit-collection.md).
Prepare `.local-data/livit-manifest.json` with at most 40 reviewed detail URLs
and their `discoveryEvidence`, plus `.local-data/livit-policy.json` recording
the permitted private noncommercial use. Then run:

```sh
npm run collect:livit -- --manifest .local-data/livit-manifest.json
```

This refreshes retained accepted listings first and writes at most 20 verified
Lugano residential rentals to `public/data/livit-lugano.json`. Fewer or zero
qualifying adverts is a valid result. It keeps SQLite and short-lived HTML in
`.local-data/`; failed mandatory stages preserve the previous export and update
`public/data/collection-status.json`. All these local files are ignored by Git.
Run the same command to refresh; it does not start a scheduler.

This change can be archived only after a live collection and a repeat successful
live refresh each contain at least 10 distinct qualifying listings. The runtime
cap remains 20, so a valid larger snapshot is retained. After collection finishes,
check current readiness with:

```sh
npm run verify:livit-archive
```

The check reads the dataset, status and SQLite run records without modifying
them. It reports the shortfall and exits nonzero for fewer than 10, invalid
entries, stale evidence, failed refreshes or missing live-run provenance. A valid
collection below this minimum remains visible in the app while acceptance stays
incomplete. The reported denominator is the minimum of 10. Run verification after
the collector exits to avoid competing with SQLite writes. Offline fixture runs
cannot establish live archive readiness.

Exercise the entire pipeline without external requests using fictional data:

```sh
npm run collect:livit -- --offline --data-dir .local-data/offline --output-dir .local-data/offline/export
npm test -- src/ingestion/cli.test.ts
npm test -- src/ingestion
```

The offline export is separate from the application's real-data export. Source
text stays in its original language; the comparison interface remains English.
Use **Original description** on a collected card to inspect its wording and
language. Page locale and text language are shown separately, including
undetermined language. Source links identify the actual fetched variant. Check
times, observations older than 24 hours and failed refreshes are visible;
municipal evidence verifies location only, without confirming availability.
The development server reads the latest export; rebuild a preview after collecting
again because `npm run build` copies the current local snapshot.

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
