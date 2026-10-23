# Lugano comparison implementation evidence

Change: `lugano-rental-comparison`, spec-driven. Verification performed locally
on Windows with Node 24.22.1 and npm 11.19.1. No live listings, external location
verification, persistence, or deployment is included.

## Test-first slices

The following commands were actually run before implementing the associated
behavior. Skeleton functions returned neutral results; UI skeletons rendered
headings. Failures below were observed assertions or missing user-facing controls,
not missing imports or broken test environments. Each command was rerun GREEN,
and the full Vitest suite was run after implementation/refactor review.

| Tasks / scenarios | Actual RED command | Observed expected failure | GREEN |
| --- | --- | --- | --- |
| 2.1: rental-offer-scope, all five scenarios plus insufficient evidence | `npm test -- src/domain/eligibility.test.ts` | 4 failed, 3 passed: inside rental returned excluded; uncertain locations returned excluded rather than unverified | 7 passed initially |
| 3.1, 3.3: valid numeric and feature criteria, incomplete/invalid values | `npm test -- src/domain/criteria.test.ts` | 8 failed, 5 passed: valid criteria rejected; invalid rent had no actionable numeric correction | 13 passed |
| 4.1: known feature, known absence, missing feature, inclusive maximum, incomparable cost | `npm test -- src/domain/comparison.test.ts` | 10 failed: known outcomes stayed unknown and evidence/missing-data explanations were absent | 10 passed |
| 4.2: requirement success/failure/uncertainty, preferences only, equal treatment, partial counts | `npm test -- src/domain/summary.test.ts` | 7 failed: fit stayed none and preference counts stayed zero | 7 passed |
| 1.3, 2.2, 4.4: synthetic labels, isolated unknown geography, no criteria, no eligible offers | `npm test -- src/ui/App.test.tsx` | 3 failed: eligible region and empty-state explanations were absent | 3 passed initially |
| 3.2–3.3: add/edit/remove/change tier, preserve invalid values and correct them | `npm test -- src/ui/CriteriaEditor.test.tsx` | 2 failed: criterion input and Add criterion control absent | 2 passed |
| 4.3–4.4, 5.1: integrated fixture journey with shared outcomes, all four mutations and empty state | `npm test -- src/ui/App.test.tsx` | 1 failed, 3 passed: App had no criterion editor; journey could not begin | 4 passed |
| 2.1 evidence boundary: real offers cannot use synthetic declarations | `npm test -- src/domain/eligibility.test.ts` | 1 failed, 8 passed: real offer with a synthetic declaration incorrectly eligible | 9 passed |

## Acceptance coverage

- **rental-offer-scope:** `eligibility.test.ts` covers purchase, unknown transaction,
  inside/outside municipality, imprecise location, marketing labels, and missing
  evidence. `App.test.tsx` checks exclusion and separate unverified presentation.
- **housing-criteria:** `criteria.test.ts` covers validation and the two typed
  conditions; `CriteriaEditor.test.tsx` exercises all criterion mutations,
  correction, units, and exactly two tiers. `summary.test.ts` checks reordered
  preferences without unequal contributions.
- **rental-comparison:** `comparison.test.ts` covers all criterion-evaluation
  scenarios, including exact threshold and mismatched measure/currency/period.
  `summary.test.ts` covers all requirement-fit scenarios, precedence, and the
  two-satisfied/one-unknown preference example. `App.test.tsx` checks evidence,
  shared criteria, recomputation, and both empty states.
- `tests/comparison.spec.ts` exercises the running app in desktop and mobile
  Chromium: criteria entry, geographic separation, evidence, unknown attributes,
  preference counts, and preference-to-requirement recomputation. It checks for
  horizontal overflow and browser page errors, and saves screenshots. These are
  browser regression checks for behavior already driven by the RED slices above.

## Refactor and non-behavior validation

The Code Simplifier skill was read and applied after relevant tests passed.
Domain evaluation, criterion validation, editing, and presentation remain separate.
The UI shares its criterion labels and tier definitions. Reviews found no further
useful simplification. One redundant DOM-attribute assertion was removed from the
editor test; its user-visible tier assertion remains. All valid acceptance tests
were retained.

The pre-approved AGENTS.md exception was used for scaffold/configuration, type
contracts, static synthetic data, styling, CI, and documentation. These were
validated through TypeScript, builds, documented start command and HTTP 200,
fixture consumers' behavior tests, desktop/mobile screenshot review, and OpenSpec
validation, rather than artificial failing tests for prose or configuration.

## Observed environment and verification issues

- `node` and `npm` initially were not on the shell PATH. The installed Node 24
  distribution was located and added to PATH for verification; no system settings
  were changed.
- Before domain code was added, `npm test` exited 1 with “No test files found,”
  confirming that the scaffold's test job fails on a missing suite.
- The first desktop/mobile Playwright run timed out at an exact `getByLabel`
  selector for a select control. The accessibility snapshot exposed the correct
  combobox name; the test was corrected to select that accessible role. Both
  browser projects then passed. Production behavior and acceptance scope were
  unchanged.
- That first browser run also emitted a NO_COLOR/FORCE_COLOR environment warning.
  Removing NO_COLOR for subsequent verification eliminated the warning.
- Git reported LF/CRLF normalization notices for the workflow and an existing
  config edit. These were notices, not whitespace-check failures.
- No pre-existing application suite existed. CI itself and remote branch
  protection have not been executed or changed. No lint tool is configured.

## Final verification

| Command / check | Result |
| --- | --- |
| `npm ci` | Pass; 99 packages installed, zero audit vulnerabilities |
| `npm test` | Pass; 45 tests in 6 files, none skipped |
| `npm run typecheck` | Pass; includes domain, UI, tests, Vite and Playwright configuration |
| `npm run build` | Pass; TypeScript and production Vite bundle |
| `npm run test:e2e` | Pass; 2 browser journeys, desktop and mobile Chromium; no page errors or horizontal overflow |
| Desktop/mobile screenshots | Reviewed; criteria, summaries, evidence, unverified and excluded sections render within the viewport |
| `openspec validate --all --strict --no-interactive` | Pass; 1 change, zero failures |
| `git diff --check` | Pass; only the normalization notices documented above |

The documented `npm run dev` command launched at http://127.0.0.1:5173 and
returned HTTP 200. The final browser run started its own local Vite server after
the clean install and shut it down on completion. CI is configured to repeat
tests, build, and browser acceptance; a remote CI run has not been observed.

## Human review

The user completed the guided local review and confirmed each step passed:

| Step | Reviewed behavior | Result |
| --- | --- | --- |
| 1 | Initial synthetic-data labels; three eligible rentals; separate unverified location and three excluded offers; no fit results without criteria | Passed |
| 2 | Maximum monthly base rent of 1800 CHF as Must have; inclusive threshold; Garden and Courtyard meet requirements, Hillside needs verification | Passed |
| 3 | Balcony as Nice to have; Garden satisfied, Courtyard unmet, Hillside unknown; separate preference counts and explanations | Passed |
| 4 | Promote balcony to Must have; immediate fit updates; Courtyard fails and preference counts return to zero | Passed |
| 5 | Edit rent limit to 1500 CHF; Garden fails on rent, Courtyard fails on balcony, Hillside needs verification; explanations distinguish failures | Passed |
| 6 | Reject -100 rent while retaining the input and active 1500 limit; correction to 1800 saves, clears the error, and restores Garden's fit | Passed |
| 7 | Remove rent, demote balcony to a preference, then remove balcony; fit, preference-only summary, and no-criteria prompt update correctly | Passed |
| 8 | Narrow-screen layout remains readable and usable; cards stack, evidence fits without horizontal scrolling, sections remain distinct, and criteria can be added | Passed |

The user reported no issues and authorized recording the review and archiving
the change. The no-eligible-offers state was covered by automated tests only;
it was not exercised in the human review. This is review of a synthetic local
demonstration, not verification of a live rental service.
