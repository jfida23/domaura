# Livit implementation evidence

Change: `ingest-livit-lugano-rentals`. Commands run on Windows with the existing
Node 24.22.1 installation added to the process PATH. This is execution evidence,
separate from the planned checklist.

## Baseline and configuration

- `npm test`: 6 files, 45 tests passed before implementation.
- `npm run typecheck`: passed before implementation.
- Installed Cheerio and development dependency tsx with npm; audit reported
  zero vulnerabilities. npm reported deprecated transitive `whatwg-encoding`
  and an esbuild install-script notice; neither command failed.
- Dependency/script/typecheck/ignore-list setup is configuration-only work under
  AGENTS.md's pre-approved exception, validated by installation and the checks
  recorded below. Application behaviors use RED/GREEN/REFACTOR.

## Behavior slices

Evidence is added after observing each result; planned commands are not proof.

- Task 2.1, non-residential rental: `npm test -- src/domain/eligibility.test.ts`
  RED received `eligible` instead of `excluded`; GREEN 10/10 tests.
- Task 2.1, unknown/missing/unsupported housing classification: same command
  RED received `eligible` instead of `unverified` in all three cases.
  Simplifier review kept the existing early-return structure; no extra abstraction.
- Tasks 2.1/2.2: focused eligibility GREEN 14/14, including unknown classification
  and source-unavailable exclusion. The unavailable-listing RED received `eligible`
  instead of `excluded` using the same focused command.
- Task 2.2: `npm test -- src/ingestion/records.test.ts` first observed the explicit
  unimplemented-validator failure, then GREEN for original-language metadata.
  Invalid-data RED observed ten `expected function to throw` failures for cap,
  identity, classification, source, municipality, language, timestamp, rent,
  evidence and address. GREEN: records + eligibility 25/25; typecheck passed.
  Simplifier review retained small predicates and a single schema-error boundary.
- Task 3.1: `npm test -- src/ingestion/livit/candidates.test.ts` observed the
  missing manifest implementation, then GREEN for Italian-first identity dedup.
  Added invalid-input cases: RED nine missing rejections; GREEN candidates and
  records 21/21, typecheck passed. Simplifier review kept URL validation in one
  adapter helper; discovery performs no network traversal.

## Additional behavior evidence
- Task 3.2: `npm test -- src/ingestion/livit/parser.test.ts` RED observed
  unimplemented extraction, then three missing structure rejections and retained
  contact text. Each became GREEN after its slice. Related fields inside main
  subsequently RED returned unknown classification instead of residential;
  restricting rows to detail containers and excluding auxiliary regions fixed it.
- Task 3.3: `npm test -- src/ingestion/livit/rent.test.ts` RED observed unknown
  explicit costs, absent localized structure, a known conflicting amount and a
  guessed ambiguous amount. GREEN after explicit mappings and numeric rules.
- Task 3.4: `npm test -- src/ingestion/livit/balcony.test.ts` RED observed unknown
  for eight explicit positive/negative statements across four languages. GREEN
  after language-specific rules, with grouped/unsupported/conflicting prose
  regression cases retained. No translation or enrichment fetches.
- Tasks 3.2-3.5: simplifier review retained adapter-local dictionaries and focused
  helpers. `npm test -- src/ingestion/livit src/domain`: 8 files, 86 passed;
  `npm run typecheck`: passed. Fixtures contain fictional advert data and no
  contact/application information; the contact-removal test constructs fake text.
- Task 4.1: `npm test -- src/ingestion/http/access.test.ts` RED lacked policy
  enforcement; after the first GREEN, five added denial/robots/redirect scenarios
  resolved instead of rejecting. GREEN: 6/6 with terminal failure across locales.
- Task 4.2: `npm test -- src/ingestion/http/client.test.ts` RED observed zero
  spacing/accounting, absent retries/limits, unsafe redirect rejection and a
  hanging transport without timeout. Concurrency RED observed two active calls.
  GREEN: pacing, serialization, timeout, body ceiling, retry/deadline budgets.
  Official-service extension RED rejected a valid GeoAdmin route as Livit;
  separate allowed routes/accounting fixed it.
- Task 4.3: `npm test -- src/ingestion/http/cache.test.ts` RED: six explicit
  unimplemented-cache failures; GREEN includes 304/body fallback, independent
  change/check times, parser versions and exact-locale isolation.
- Task 5.1: `npm test -- src/ingestion/geography.test.ts` RED: unimplemented
  official verification; GREEN 12/12. Corrected a test table's nested-array
  argument shape (Vitest spreads array rows); acceptance assertions unchanged.
  Official API read-only review confirmed the two-step response fields.
- Task 5.2: `npm test -- src/ingestion/geography-cache.test.ts` RED returned
  undefined instead of reusable fresh evidence. GREEN includes expiry/address
  invalidation without date renewal. Simplifier review kept narrow cache and
  verifier boundaries. Combined geography, HTTP and eligibility: 53 tests passed.
  A subsequent `rg` check found no challenge markers in the private reviewed HTML
  (exit 1 means no matches; the preceding test command passed).
- Tasks 4/5 simplifier review kept centralized request accounting and independent
  HTML/municipal caches. Documentation-only updates use the approved exception.
- Tasks 3.1/6.1: `npm test -- src/ingestion/collection.test.ts` RED: eight
  unimplemented-collection failures. GREEN covers 0/7/20/21, stable identity,
  deterministic acquisition, optional unknowns, retained-first refresh, released
  slots, Italian preference and a single fallback. Four explicit withdrawal
  heading tests subsequently RED failed structural parsing; GREEN after a narrow
  listing-wide heading check. Exclusion replacement and fewer-than-cap ordinary
  unverified outcomes passed as regressions.
- Task 6.2: `npm test -- src/ingestion/store.test.ts` RED: three missing SQLite
  operations; GREEN persistence/restart, observation outcomes, two HTML versions,
  seven-day expiry and two run records. Candidate retention RED hit the explicit
  unimplemented candidate store; GREEN also confirms unchanged checks do not
  renew raw HTML age. SQLite tests use isolated temporary directories.
- Task 6.3: `npm test -- src/ingestion/publication.test.ts` RED: nine missing
  atomic-publication failures. GREEN exercises each mandatory-stage exception,
  successful empty collection, interruption cleanup and cap validation. Previous
  files remain byte-for-byte intact. A later typecheck caught inferred UUID
  template typing; an explicit string parameter fixed it without behavior change.
- Task 7.1: `npm test -- src/ingestion/cli.test.ts` RED: missing command behavior,
  including subprocess exit 1 instead of 0. GREEN 3/3 covers full fixture run,
  restart refresh, entry point, input/access failure and envelope/status IDs.
  Simplifier review replaced duplicate source-ID splitting with the adapter's
  validated URL helper; regression `npm test -- src/ingestion`: 14 files,
  121 passed. `npm run typecheck` passed.
- Task 6.4/7.1 actual offline command:
  `npm run collect:livit -- --offline --data-dir .local-data/offline --output-dir .local-data/offline/export`
  succeeded: 1 accepted, 0 excluded/unverified/unavailable; candidates-exhausted;
  Livit 2 (detail 1), GeoAdmin 2 attempts. Documentation/configuration exception
  applies to commands/ignore patterns, not application logic. Simplifier review
  retained explicit storage/publication/adapter boundaries.
- Task 7.2: `npm test -- src/ui/dataset.test.tsx` RED: five cases remained
  loading instead of ready/empty/missing/invalid. Before UI implementation,
  `npm run test:e2e -- tests/collection.spec.ts --project=desktop` RED: all four
  scenarios lacked the required loading/empty/unavailable states. GREEN after
  validated loading integration: component/App 10/10 and browser 4/4. Existing
  fixture assertions were preserved with explicit `initialMode=demo` metadata.
  Simplifier review retained a single loader hook and cancellation boundary.
- Task 7.3: `npm test -- src/ui/App.test.tsx` RED: four missing source link,
  unknown-attribute, stale and failed-refresh displays. Loader status RED with
  `npm test -- src/ui/dataset.test.tsx -t "failure status"` remained ready rather
  than applying matching failure status. A test-only inline fetcher initially
  retriggered its own effect; corrected to a stable fixture before recording RED.
  Before implementation, focused browser source-language/failed-refresh tests
  failed on absent Livit links and failure context. GREEN component/comparison
  25/25 and the six collected browser scenarios. One browser attempt timed out
  on an incorrect label locator; corrected to the existing accessible combobox
  role without changing assertions or production behavior.
- Task 7.4: component RED could not find Demo examples; corrected browser
  locator then observed its RED waiting for the missing Demo examples button.
  GREEN preserves criteria, keeps injected real offers out of demo, and removes
  examples when returning to collected mode. Existing comparison acceptance
  now explicitly chooses demo, preserving all assertions.
- Tasks 7.3/7.4 simplifier review extracted source presentation into OfferDetails
  and retained one criteria owner across modes. `npm test -- src/ui`: 18 passed;
  `npm run test:e2e`: 16 passed across desktop/mobile. Node's NO_COLOR versus
  FORCE_COLOR warnings were observed; browser tests themselves passed.
- Task 7.5: long-text browser RED (`npm run test:e2e -- tests/collection.spec.ts --grep "long original|age alone"`)
  observed desktop horizontal overflow and a mobile interaction blocked by the
  expanded layout. GREEN after wrapping original text: 4/4 focused, then
  `npm run test:e2e`: 20/20 desktop/mobile. Unknown rent, undetermined language,
  age-only staleness and old-status isolation are covered. Source presentation
  and README usage were checked in both collected and demo modes.
- Final review within tasks 2/6: a reappearing identity RED reset firstObservedAt
  (`npm test -- src/ingestion/collection.test.ts -t reappears`); GREEN after
  consulting persisted observations. Collection/store/CLI regression: 21 passed.
  Contract RED (`npm test -- src/ingestion/records.test.ts`) accepted eight
  inconsistent locale/URL/time/cost/type cases; GREEN after shared URL validation
  and provenance checks. Corrected the original mixed-language test to change the
  actual route with page locale; its original Italian text assertion is intact.
  Stale browser fixtures likewise now retain content-change dates no later than
  their successful check dates, as valid records require.
- Task 3.4 final review: `npm test -- src/ingestion/livit/balcony.test.ts` RED
  observed two false-positive Italian negations, two unsupported explicit
  negatives and two mistaken known results for conflict/uncertain wording.
  GREEN after testing negatives before positive passages and keeping unsupported
  negation unknown; adapter/comparison regression: 58 passed.
- Simplifier review extracted bounded body reading from timed transport, removed
  duplicate source/official URL validation, and retained separate locale/cache/
  geography boundaries. HTTP/CLI regression: 28 passed; combined ingestion/UI:
  148 passed before the additional balcony cases. One typecheck caught unsupported
  Testing Library `exact` options; removed those options while retaining exact
  string role names and assertions. No acceptance scope was removed.
- Task 7.6: workflow YAML parsed with the already installed OpenSpec YAML library;
  the explicit offline-collector step was verified alongside existing test/build/
  browser/OpenSpec jobs. A first node -e invocation failed due to PowerShell quote
  handling; rerunning the exact parser code from a temporary local script passed.
  CI itself has not been run remotely. Configuration-only exception applies.

## Bounded live acceptance (task 8.2)

- Ran `npm run collect:livit -- --manifest .local-data/livit-manifest.json`
  against the four individually reviewed Lugano leads using the recorded private
  policy and current robots checks. Success: **1 accepted, 0 excluded, 0
  unverified, 3 unavailable**, stop **candidates-exhausted**. Livit 7 attempts
  including 6 details; GeoAdmin 2. No padding or discovery expansion.
- Repeated the same command. Success with the same counts and source identity;
  Livit 7 including 6 details; GeoAdmin 0 because the exact-address evidence was
  still fresh. The listing remains one advert even though its original description
  discusses several homes. Unavailable source pages do not establish that a
  property was rented.
- Verified residential/rental classification, actual Italian source URL, exact
  Piazza Cioccaro 2 / 6900 address, official municipality 5192 with feature/EGID
  and export/verification dates, recent source check and explicit unknown balcony
  explanation. Original description is Italian; title language is undetermined.
  No contact/media fields are in the normalized export.
- Inspected the resulting local UI with a standalone Playwright check and viewed
  desktop/mobile screenshots. One collected card, matching source URL, original
  description, rent comparison and unknown-balcony verification state were
  present; no page errors or horizontal overflow. Screenshots and the check
  summary stay private under `.local-data/`. The first attempt to start a second
  Vite server found port 5173 occupied; the existing project server was reused.

## Final verification (task 8.1)

- Locked installation: copied package/lock files to a new isolated local directory
  and ran `npm ci --prefix <temporary-directory> --no-audit --no-fund`: 129 packages
  installed. npm reported the known whatwg-encoding deprecation and esbuild
  allowScripts notice; no install error occurred. Actual CLI subprocess and
  offline pipeline checks also passed.
- `npm test`: **21 files, 198 tests passed**. The first final attempt ran alongside
  build and browser workers and exceeded the CLI subprocess test's incidental
  five-second framework default (7.4-second startup under contention). Corrected
  that integration-test infrastructure to an explicit 15-second child-process
  bound / 20-second test timeout, without changing assertions, acceptance
  scenarios or the fake-clock production deadline checks. The full suite then
  passed on its own. This was an observed intermediate failure, not an omitted
  check or a baseline application defect.
- `npm run typecheck`: passed. `npm run build`: passed, including its typecheck.
- `npm run test:e2e`: **20 passed**, desktop and mobile Chromium, after the final
  production changes. Actual local-data UI inspection additionally passed as
  recorded above. Browser fixture acceptance makes no translation, Livit or
  GeoAdmin requests; the explicit collector fixture command uses no network.
- `openspec validate --all --strict --no-interactive`: **4 items passed, 0 failed**.
- `git diff --check`: passed. Git reported platform line-ending conversion notices;
  Playwright reported NO_COLOR/FORCE_COLOR warnings. No lint tool is configured.
  Workflow YAML parsing and offline setup passed locally; remote GitHub Actions
  has not been executed in this session.
- All RED/GREEN observations, corrected test-fixture issues, configuration-only
  exceptions and simplifier refinements are recorded above. Tests do not claim
  acquisition completeness or availability beyond the observed local runs.
- Automatic approval review rejected shell cleanup of the temporary installation
  and three separate private research HTML files, stating blocked by policy.
  These ignored local artifacts remain. The collector's SQLite HTML retention
  and pruning are separately covered by the passing store tests; the manual
  research files are outside that cache. No source data was added to Git.

## Exact-twenty follow-up (2026-10-28/29)

This section supersedes the earlier completion counts. The historical one-entry
runs did not satisfy the revised archive requirement.

- Input review: the user's 22 links contained 21 distinct source IDs, including
  the already accepted Cioccaro advert. `700f00d476e8c809e5ef31673e9a9648`
  occurred twice. Replaced the exhausted original leads in the private manifest
  with these individually supplied candidates; preserved the old manifest locally.
- Explicit run provenance, task 8.4: `npm test -- src/ingestion/cli.test.ts`
  initially failed two assertions because persisted run modes were undefined,
  rather than `offline` / `live`. Added the mode at run persistence; CLI/store
  regressions then passed (7 tests), together with typechecking. Historical
  records without a mode cannot satisfy archive acceptance.
- Access-check correction: the first new live attempt stopped with `Source
  challenge detected` after 3 Livit requests (2 details) and preserved the prior
  export. The response was an ordinary listing page with a contact-form
  reCAPTCHA, not an interstitial. RED: `npm test --
  src/ingestion/http/access.test.ts` failed two expected cases: normal contact
  CAPTCHA markup was rejected, and a blocking human-verification title was
  accepted. Scoped challenge text checks to page titles/headings (or plain-text
  responses), retained Cloudflare challenge markers and terminal 401/403 checks.
  GREEN: HTTP/CLI regressions passed (32 tests). No challenge was bypassed.
- The next bounded live run accepted 15, excluded 1, left 5 unverified and found
  0 unavailable; stop `candidates-exhausted`. Livit 22 / details 21, GeoAdmin 23.
- Address parsing: two source rows include a named building after a slash:
  `Via Massagno 32 / Belinda` and `Via Massagno 34 / Collina`. RED:
  `npm test -- src/ingestion/livit/parser.test.ts` failed the two expected
  address extractions and a negative case involving two actual street addresses.
  Parser version 2 separates a nonnumeric building name while rejecting that
  ambiguous two-address form. GREEN: adapter/collection/CLI regressions passed
  (6 files, 68 tests). Official street/number/postcode matching remains exact.
- Repeated live collection with parser version 2: 17 accepted, 1 excluded,
  3 unverified, 0 unavailable; stop `candidates-exhausted`. Livit 22 / details
  21, GeoAdmin 7. The two Massagno-street buildings verified within municipality
  5192. The excluded Via Morella advert is in the neighbouring municipality;
  advertised `6900 Lugano` alone is insufficient. The remaining three adverts
  use `Via G. Salvadè` (two IDs) or `Via Bagutti`, whereas official evidence uses
  `Via Giorgio Salvadè` / `Via Giuseppe Bagutti`. Four separate read-only
  GeoAdmin research requests confirmed the mismatch; no initial expansion or
  fuzzy match was introduced to admit them.
- Archive gate, task 8.4: `npm test --
  src/ingestion/archive-readiness.test.ts` first failed 11 expected assertions
  against a non-ready stub. After the first GREEN, 15 additional cases failed
  because inconsistent run/status evidence and stale observations were still
  accepted. GREEN: all 26 cases passed after those checks were implemented.
  Coverage includes 0/1/19/20/21, duplicate/invalid/synthetic/outside entries,
  live/offline provenance, two ordered successful runs, latest short/failed
  attempts, matching IDs/status, and freshness at review time.
- Archive command: `npm test -- src/ingestion/archive-cli.test.ts` failed its
  four expected cases against the initial command/entry-point stubs, then passed
  after implementation. Tests exercise actual SQLite/JSON inputs, subprocess
  invocation, actionable nonzero shortfall output, missing inputs/invalid flags,
  and byte-for-byte preservation of the database and published files. Fixture
  records labelled live in these tests are simulated inputs, never acquisition
  evidence. Combined archive/CLI/store regressions passed (4 files, 37 tests).
- Offline exercise: `npm run collect:livit -- --offline --data-dir
  .local-data/offline --output-dir .local-data/offline/export` succeeded with one
  fictional accepted advert. The corresponding `verify:livit-archive` command
  exited 1 as required: 1/20, shortfall 19, and missing live-run evidence. The
  first immediate check also rejected the fixture clock's future generation
  timestamp. These commands use no external network.
- Simplifier review after GREEN covered run-mode persistence, challenge checks,
  parser changes, archive assessment/CLI and their tests. No further structural
  change was justified; the small pure assessment and read-only I/O command
  remain separate. Focused and full regression checks are recorded below.
- Documentation/configuration/input preparation use the repository's pre-approved
  non-behavior exception: updated README, collection guidance, parser-version
  notes and conditional archive workflow guidance. No artificial tests were
  added for manifest edits or prose.

### Follow-up verification

- `npm test`: 23 files, **235 tests passed**.
- `npm run build`: passed, including `npm run typecheck`.
- `npm run test:e2e`: **20 passed**, desktop/mobile Chromium. The existing
  NO_COLOR/FORCE_COLOR warnings remain informational.
- `openspec.cmd validate --all --strict --no-interactive`: 4 passed, 0 failed.
  The first invocation used the PowerShell `openspec.ps1` shim and was rejected
  by the local execution policy; the installed `.cmd` launcher succeeded.
- `git -c core.safecrlf=false diff --check`: passed. No lint command is configured.
  Remote CI has not been executed.
- Post-simplifier focused/regression rerun: 9 files, 91 tests passed; standalone
  `npm run typecheck` passed. Workflow and OpenSpec configuration YAML parsed
  successfully. The first temporary YAML-check script used a Windows path as
  an ESM import and failed with `ERR_UNSUPPORTED_ESM_URL_SCHEME`; correcting that
  import to a file URL fixed the local verification script.
- The readiness command against the 17-entry live export exited 1 with
  `NOT READY: 17/20`, shortfall 3, and the two-successful-twenty-run requirement.

### Final acquisition outcome: short by three

- Manually reviewed public Livit search results for replacement leads. Search
  snippets were discovery evidence only; they never substituted for live detail
  checks or municipal proof. Selected distinct advertised unit types and avoided
  counting repeated indexed versions of the same advert as additional homes.
- First replacement run, ID `ad6250e6-000a-4c52-a1d6-e3ae713a711d`, mode `live`,
  success: 17 accepted, 0 excluded, 0 unverified, 4 unavailable; stop
  `candidates-exhausted`. Livit 24 / details 23, GeoAdmin 0. The four reviewed
  candidates returned 404 on the permitted known variants.
- The user then supplied `2078.01.0202` and `6429.04.0607` for duplicate review.
  The first is already among the accepted 17. The second is a distinct apartment
  advert at Via Chiosso 7C, 6948 Porza. Exact official record `191617392_3`,
  EGID `191617392`, confirms municipality **5214 (Porza)**, outside Lugano 5192.
  It was excluded without changing the geographic boundary.
- Latest run, ID `6635834b-f13a-4e4a-8fad-055119bc7a68`, mode `live`, started
  `2026-10-28T23:08:03.042Z` (29 October locally), success: **17 accepted,
  1 excluded, 0 unverified, 4 unavailable**, stop `candidates-exhausted`.
  Livit 27 / details 26, GeoAdmin 2. The four further indexed candidates also
  returned 404. Both runs stayed within all existing limits and pacing; there
  was no search-route crawl, national collection or related-offer traversal.
- Validated all 17 accepted offers, official municipality 5192/exact addresses,
  canonical source IDs, present observations and explicit unknown-field reasons.
  Compared saved source room counts, surfaces and floors alongside addresses:
  17 distinct unit fingerprints, including different floors for same-building
  adverts. A multi-unit advert remains one entry. Private review results are in
  `.local-data/live-verification.json`.
- Reinspected the latest dataset in the local UI on desktop/mobile: 17 cards,
  every source link matches the export, original description disclosure works,
  rent/balcony criteria show unknowns as needing verification, no page errors or
  horizontal overflow. Viewed the private screenshots. Fixture browser tests
  remain separate from this actual-data inspection.
- Final `npm run verify:livit-archive`: exit **1**, **17/20**, shortfall **3**;
  two successful twenty-entry live runs are still absent. No archive was made.
  Preserved the attempted manifests locally and reduced the active manifest to
  the 17 accepted identities, ready for additional reviewed candidates. All real
  input, SQLite, HTML and export files remain ignored by Git.
- Task 8.4 is complete. Tasks 8.2 and 8.3 remain incomplete because fresh
  qualifying supply has not reached 20. Task 8.1 remains open for final checks
  after that acquisition work, despite the passing implementation checks above.
  Three additional qualifying Lugano source adverts are needed; no eligibility
  or access constraint was relaxed to fill the count.
- One temporary manifest-preparation command used `ConvertTo-Json -AsArray`,
  unavailable in this PowerShell version. Replaced it with explicit array input
  to `ConvertTo-Json` before collection; this did not change application code.

### User decision: retain the current dataset (2026-10-29)

The user chose to keep the 17 verified listings for now and pause additional
acquisition. Confirmed that both the published dataset and active manifest
contain 17 identities. No source requests or application changes were made.
The change remains open; this decision does not waive the existing exactly-20
archive requirement. Resume acquisition and final acceptance only when requested.

### Research resumed at user request (2026-10-30)

The user requested three additional Livit listings. Resumed task 8.3 using
individually reviewed public references; no discovery code or application
behavior changed. Kept candidate probes in separate ignored SQLite/export
directories so unsuccessful research could not replace the saved 17-entry app
dataset. Every probe used the existing collector, current robots check, source
policy, serial pacing, one permitted fallback, and unchanged request limits.

| Probe | Candidate IDs (control identified below) | Accepted / unavailable | Livit / details / GeoAdmin |
| --- | --- | --- | --- |
| Cassarate | `3ea6acdacaabe41d5a8cdd150ffec08c`, `aacad0f307b3e926163d9e66f730a4f7`, `a5d2cf2776b306d79739f22ad163ca5d` | 0 / 3 | 7 / 6 / 0 |
| Other references | `1185.01.0601`, `6594.01.0051`, `7935.02.0302`, `d34de63c54cf225a3d82c1b9a51e8e0e` | 0 / 4 | 9 / 8 / 0 |
| Castel Davesco | `0622.08.0202`, `0622.02.0303`, `0622.06.0201` | 0 / 3 | 7 / 6 / 0 |
| Viganello and control | `0623.01.0202`, `0623.01.0503`, `7934.01.0601`; existing `7971.08.0401` | 1 existing / 3 | 8 / 7 / 2 |

All four runs completed successfully with `candidates-exhausted`, zero excluded
and zero unverified. The 13 candidate identities returned 404 on the checked
Italian and supplied English/French variants. Some were newly found references;
others were indexed variants of previously unavailable leads. Dotted-reference
candidate URLs used the documented detail route and references explicitly
published in Livit-attributed third-party adverts; they were leads, never assumed
valid source identities. No source IDs were enumerated or guessed.

The existing control advert at Via Industria 24 returned 200 and verified as
Lugano 5192. It is already in the saved dataset and contributes no new listing.
There were **zero qualifying additions**, not one. These results show that the
researched URLs are unavailable; they do not establish that homes were rented
or that all Lugano inventory has been exhausted.

Manifests with per-candidate provenance and the probe exports/run records remain
private under `.local-data/`, using the `research-*-2026-10-30` names. Reconfirmed
the main export still has ID `6635834b-f13a-4e4a-8fad-055119bc7a68`, generated
28 October UTC / 29 October locally, and 17 entries. Neither that export nor its
status/manifest was refreshed or replaced by these probes; its original source
check ages remain visible. The isolated control check does not renew the main
dataset's freshness or satisfy its archive gate.

Useful alternative leads are on Livit's [Vicari–Tiglio project site](https://vicari-tiglio.ch/appartamenti):
[T4817](https://vicari-tiglio.ch/appartamenti/t4817-3-5locali),
[T4820](https://vicari-tiglio.ch/appartamenti/t4820-3-5locali), and
[T4821](https://vicari-tiglio.ch/appartamenti/t4821-4-5locali).
They describe distinct units at Via del Tiglio 48 (3.5 rooms/floor 1,
3.5 rooms/floor 2, and 4.5 rooms/floor 2), with Livit as contact. These are
research leads only: project pages are outside the current source-host/route
contract and have not undergone collector municipal/source acceptance. Supporting
that domain would require a separately agreed adapter/specification extension;
none was implemented or silently counted here.

Tasks 8.2/8.3 remain incomplete and no archive was made. This was input/research
and documentation work under the pre-approved non-behavior exception, with live
collector outcomes, unchanged-export identity/count, ignored-file checks,
OpenSpec validation and whitespace validation as the appropriate checks. No
application tests or RED/GREEN evidence are newly claimed for this research.

## Revised acceptance: minimum ten, research stopped (2026-10-30)

The user chose to accept 10 listings instead of 20 and stop research. Implemented
this as a minimum of 10, preserving the existing runtime cap of 20 and retaining
all collected data rather than arbitrarily truncating 17 valid entries. Updated
the existing proposal, design, ingestion specification and tasks coherently;
source/municipal requirements, freshness and successful repeat-refresh evidence
remain required. No project-domain adapter or additional discovery was added.

- Task 8.3: validated the existing manifest with the real `validateManifest`
  function: 17 unique identities, each with discovery provenance, exactly matching
  the saved accepted dataset. No new candidates were added. Only these identities
  are used for the live refresh. Saved the pre-refresh export privately before
  running collection.
- Task 8.4 RED: `npm test -- src/ingestion/archive-readiness.test.ts
  src/ingestion/archive-cli.test.ts` failed **10 assertions** for the expected old
  behavior: valid 10/17/19-entry snapshots were rejected, the reported target was
  still 20, and below-minimum shortfalls were wrong. Production behavior was
  changed only after observing these failures.
- GREEN: the same command passed **35 tests** after the gate required at least
  10 qualifying entries and two successful live runs each within 10–20, and
  clamped shortfall to zero above the minimum. Invalid, stale, offline, mismatched
  and failed evidence still fails. The nine-entry negative case replaces the
  former nineteen-entry negative case because the user intentionally revised
  that acceptance boundary; 19 now has explicit positive coverage. The 21-entry
  dataset and over-cap run-record rejections remain covered. The CLI integration
  uses 17 entries and verifies that read-only checking preserves every file byte.
- Read/applied the simplifier skill after GREEN: reviewed the small assessment
  change and revised tests; no further refactor was justified. Post-review
  archive/records/store/collector-CLI regressions passed **5 files, 61 tests**.
- `npm run typecheck`: passed. `npm test`: **23 files, 240 tests passed**.
  `npm run build`: passed, including typechecking. Browser/final live outcomes
  are recorded below after completion.
- Re-exercised the documented isolated offline collector: success, 1 fictional
  accepted listing, no network. Its archive check exited **1**, `1/10`, shortfall
  **9**, and rejected offline-run evidence. The immediate fake-clock check also
  rejected its not-yet-reached generated timestamp, as expected. This is fixture
  verification, not live acquisition evidence.
- Planning, README, collection guidance, conditional archive workflow and manifest
  validation use the pre-approved documentation/configuration exception. The
  application behavior change above followed TDD. Historical evidence elsewhere
  in this report retains the targets that applied when those checks ran.
- The first revised live run succeeded with **15 accepted, 0 excluded,
  0 unverified, 2 unavailable**, stop `candidates-exhausted`; Livit 20 / details
  19, GeoAdmin 0. Run `65380725-c339-4222-9aec-446d5b13c209`, mode `live`,
  started `2026-10-30T19:18:01.107Z`. `0622.08.0002` and `7971.07.0402` now
  returned 404 on both known variants; this is source unavailability, not proof
  of letting. Preserved the prior 17-entry export and manifest locally, and
  retained the 15 qualifying identities as the active refresh manifest.
- An intermediate repeat attempt, `081f2633-b47a-4292-a2cd-820d2266b212`, failed
  with **database is locked** after robots and one conditional detail check.
  I incorrectly ran read-only SQLite verification concurrently with collection.
  The last successful 15-entry export remained intact, failure status/run
  evidence was recorded, and the archive gate correctly refused readiness
  despite zero count shortfall. Stopped overlapping database checks and repeated
  collection sequentially; no database records or failure evidence were removed
  to obtain a passing gate. README/collection guidance now explain this ordering.
- Browser fixture acceptance passed **20 tests** on desktop/mobile Chromium.
  YAML parsing, strict OpenSpec validation (4 items) and whitespace checks passed.
  Playwright's existing NO_COLOR/FORCE_COLOR warnings were informational; no lint
  tool is configured and remote CI was not run.
- Final sequential live collection/refresh evidence, both `live` and `success`:
  `1412067f-c335-4157-9e85-0512fafc04db` started
  `2026-10-30T19:22:12.905Z`, generated `19:24:43.172Z`;
  `cdf177cc-cb9e-40ff-acff-c14065d08bf1` started
  `2026-10-30T19:24:45.628Z`, generated `19:27:15.870Z`.
  Each accepted **15**, with **0 excluded, 0 unverified, 0 unavailable**,
  stop **candidates-exhausted**, Livit **16 / details 15**, GeoAdmin **0**
  (still-valid municipal cache). Detail responses were 304 with saved bodies;
  successful source checks advanced while geographic evidence retained its own
  original verification date. No further candidate research occurred.
- After the collector exited, separately ran `.local-data/verify-live.ts`, the
  real `npm run verify:livit-archive`, retained-manifest validation and actual-data
  UI inspection. All 15 canonical identities/links, residential classifications,
  present observations, official municipality 5192/exact addresses and explicit
  unknown explanations validated; source room/floor/surface/address fingerprints
  were distinct. The active manifest matches these 15 identities exactly.
- Final archive command: exit **0**, **READY: 15/10 qualifying listings;
  shortfall: 0**. The current dataset/status and latest two successful live records
  agree. The old failed attempt was naturally superseded through the existing
  bounded two-record retention policy, not manual editing.
- Actual-data desktop/mobile inspection: **15 cards**, all source URLs match,
  original descriptions and comparison criteria work, unknown balcony evidence
  stays unknown, no page errors or horizontal overflow. Viewed the resulting
  private screenshots. Refreshed data and diagnostic exports remain ignored.
- Task 8.1 final checks after live acceptance: `npm test` **23 files / 240 tests
  passed**; `npm run build` passed, including `npm run typecheck`, and copied the
  current 15-entry export; `npm run test:e2e` **20 passed**; strict OpenSpec
  validation **4 passed / 0 failed**; workflow/configuration YAML parsing and
  `git -c core.safecrlf=false diff --check` passed. The earlier expected RED
  failures, isolated offline rejection and intermediate SQLite lock are disclosed
  above. No application check remains failing. No lint is configured; remote CI
  was not executed.
- Tasks 8.1–8.4 are complete under the user's revised minimum-ten requirement.
  Additional research is stopped. The implementation is ready for review/archive;
  no archive, commit or deployment was performed.
