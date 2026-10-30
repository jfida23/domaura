# Local Livit collection

This pilot is for private, noncommercial local use. It is not a public listing
service or a complete view of the market. The accepted dataset is capped at 20
verified residential rental listings within Lugano municipality, including its
quarters. A run can legitimately collect fewer.

## Source conditions and inputs

Reviewed on 2026-10-28: [Livit's notice](https://www.livit.ch/de/information/impressum)
allows downloads/copies for private, noncommercial use and reserves other uses.
This records the published condition, not a grant to publish or redistribute.
The collector requires a local policy recording this use and review. Public or
commercial use needs a separately resolved source agreement.

[Robots directives](https://www.livit.ch/robots.txt) exclude search routes and
query URLs and state a ten-second crawl delay. Only supplied, validated detail
URLs are collected. No sitemap-query crawl, national search, related-offer
traversal, contact form, attachment, image, CAPTCHA bypass, browser escalation,
or proxy rotation is used. Current robots rules are checked before detail requests.

Local reviewed manifest and policy inputs belong in `.local-data/` (gitignored).
Each candidate needs its exact source URL and Lugano-related discovery evidence.
Discovery evidence is a lead, not proof of municipal membership. At most 40
distinct candidate IDs are accepted as input; canonical language variants count
once. There is no guarantee that 20 currently available listings qualify.

## Data contract and languages

Page locale and original text language are independent. Prefer Italian, with at
most one allowed supported fallback when Italian is missing. Preserve original
titles, listing descriptions, and evidence in plain text. Unknown text language
stays unknown. The application uses English navigation and comparison labels;
automatic translation and application localization are outside this release.

Supported structured-label dictionaries are Italian, German, French, and English.
Interpret explicit net rent, charges, and gross rent separately. Inclusive-only,
starting, contradictory, or ambiguous prices cannot become invented exact base
rents. A grouped balcony/seating feature is insufficient: absence from a feature
list is not evidence of absence. Source-specific extraction rules and their
sanitized, localized examples are verified by offline tests.

Municipal evidence comes from the official [GeoAdmin address and building
services](https://docs.geo.admin.ch/access-data/search.html). Match street, house
number, and postcode exactly; follow the official building-register resource and
retain its municipality ID, feature/EGID, data date, and lookup time. Lugano is
municipality 5192. Fuzzy matches and failed lookups do not prove eligibility.
Attribute values are not inferred from building data. Attribute and location
evidence remain separate from advertised or actual availability.

## Verification

Use Node.js 24 and the locked npm dependencies. Ingestion test files explicitly
select Vitest's Node environment; UI tests retain jsdom. Run `npm test` for the
full suite, or `npm test -- src/ingestion/records.test.ts` for a focused file.
The CLI entry and its imports are included in `npm run typecheck`.

See [execution evidence](livit-verification.md) for observed results. Collection
commands, retention, effective budgets, and UI usage are documented alongside
the slices that implement them.

## Extraction contract

Parser version `2` uses the labelled detail rows and the listing description,
excluding related offers, navigation, forms and contact paragraphs. The sanitized
fixture is fictional; localized and mixed-language variants are generated in the
offline tests. Supported labels are in `src/ingestion/livit/labels.ts`: Italian,
German, French and English category, address, net rent, charges and gross rent.
Only an unambiguous currency amount in a monthly source field becomes a cost.
Starting prices, ranges, conflicting values and ambiguous separators stay unknown.
No net rent is calculated by subtracting charges.

Explicit balcony presence/absence rules are in `features.ts`; grouped outdoor
features and unsupported wording remain unknown. Title, description and excerpts
retain original wording as plain text. Their language is established separately
from the page route by text-specific metadata or narrowly supported vocabulary;
otherwise it is undetermined. No translation service is used. The interface
remains English. Italian is preferred using the documented same-ID route mapping;
a known supported fallback is used only after Italian 404/410, never to bypass
access controls or enrich uncertain fields. Multi-unit adverts remain one ID.

Version 2 also separates a named building suffix (for example, house number
followed by `/ Belinda`) from the complete street address. A second street/house
address is not treated as a building name. The resulting street, number and
postcode still require exact official verification; abbreviated street names
that do not match the official record remain unverified.

## Network and cache limits

Default limits: 40 manifest IDs, 40 detail attempts, 60 total Livit attempts,
80 GeoAdmin attempts, 20 minutes. Retries and redirects consume attempts. Livit
requests are serialized with at least 10 seconds between starts (including the
robots request), or a stricter current crawl delay. Each attempt has a 15-second
timeout and 2 MiB body ceiling. Network/5xx gets one retry; 429 respects
Retry-After within the deadline and stops on recurrence. 404/410 is not retried.
Only same-identity, same-locale Livit redirects can be followed; unsafe targets,
access denial and challenges stop the run. There is no browser/proxy bypass.

A local policy JSON records `use: private-noncommercial`, `reviewedAt` (YYYY-MM-DD)
and `basisUrl: https://www.livit.ch/de/information/impressum`. This records the
permitted local use; it is not a licence for public redistribution. Current
robots directives are checked before detail requests. Missing policy/robots
access stops collection. Policy and manifests belong under `.local-data/`.

Validators and HTML are keyed by exact locale URL. A 304 updates check time,
keeps content-change time and is reparsed with the current parser version.
Without a stored body, one budgeted unconditional request is attempted; another
304 fails. An identical 200 body also preserves the content-change timestamp.

## Exact municipality verification

GeoAdmin SearchServer receives only the complete street, number and postcode,
with `type=locations` and `origins=address`. Exactly one matching official address
label is required. The linked `ch.bfs.gebaeude_wohnungs_register` resource may be
at result or attribute level; only the official HTTPS host and layer are allowed.
The returned street, number and postcode must match again. Code 5192 is Lugano;
another established code is outside. Missing, fuzzy, ambiguous or conflicting
evidence stays unknown, while a service outage fails the collection.

Retained evidence includes feature ID, EGID, official URL, address, municipality
code/name, export date and verification time. Successful exact-address evidence
can be reused for at most seven days, without renewing its original date. An
address change invalidates it. A fresh Livit check/304 cannot extend that window.
Official attribution: Swiss Federal Statistical Office, Federal Register of
Buildings and Dwellings (GWR), via the Swiss Confederation GeoAdmin API. The
register verifies location only; it supplies no advertised unit features or rent.

## Manual command, persistence and publication

Live: `npm run collect:livit -- --manifest .local-data/livit-manifest.json`.
Use `--policy <path>` to select the recorded policy (default
`.local-data/livit-policy.json`), `--data-dir <path>` for SQLite, or
`--output-dir <path>` for the dataset/status files. Defaults are `.local-data`
and `public/data`. The SQLite file is `livit.sqlite`. Close/restart the command
freely; observations, exact-URL validators and municipal evidence persist.

Offline: `npm run collect:livit -- --offline --data-dir .local-data/offline --output-dir .local-data/offline/export`.
This runs the same adapter, HTTP policies, SQLite, geography and publication with
fictional saved responses and a fake clock; unexpected fixture URLs fail. It
makes no external requests. The export is deliberately placed outside the UI's
real-data path. Do not use fixture outputs as real housing observations.

The manifest contains `{ "url": "https://www.livit.ch/it/locatario/obietto/<id>",
"discoveryEvidence": "Individually reviewed Lugano rental lead" }` entries.
The CLI accepts only Livit. It deduplicates identities and refreshes retained
accepted candidates first, then other candidates by source ID. Twenty accepted
slots stops new acquisition; exclusions/withdrawals can release slots. A lead
budget is not a promise of twenty qualifying homes. Original discovery and
bounded per-candidate outcomes are retained in SQLite diagnostics.

Normalized offers omit contact/media data; no attachments/images/forms are
fetched. Local raw HTML is limited to two versions per candidate and seven days;
expiry cleanup runs whenever the manual collector starts/finishes and expired
bodies cannot be reused. Unchanged 304 checks do not extend raw acquisition age.
Keep only latest and previous run diagnostics; candidate records remain bounded
to the current manifest plus retained accepted identities (maximum 40 total).
These local files, real manifests/policy and exports are ignored by Git.

404/410 after known fallback exhaustion, or a supported explicit listing-wide
withdrawal heading, means the source no longer advertises it. It never means
that the home was rented. Failed checks retain prior evidence and timestamps.
The complete export is validated, fsynced to a temporary sibling and replaced
atomically only on success. Failed access/transport/structure/service/budget/
deadline stages preserve the previous dataset byte-for-byte and publish a
separate failure status tied to that dataset ID. A genuine empty successful
collection replaces the old dataset with an explicit empty envelope.

## Archive acceptance

This change requires at least 10 distinct qualifying listings from a successful
live collection and a subsequent successful live refresh. Fewer entries remain
a truthful operational result but leave acceptance incomplete. Run
`npm run verify:livit-archive` against the latest local dataset before archiving.
The command reads the current export, matching status and SQLite diagnostics in
read-only mode, reports count/shortfall/issues, and exits nonzero until ready.
It accepts `--data-dir` and `--output-dir` for controlled local inputs. Run it only
after collection exits; concurrent read-only database verification can conflict
with SQLite writes. Counts above the minimum remain accepted up to the cap of 20.

New collector run records explicitly identify `live` or `offline` mode; older
unlabelled records cannot prove live acceptance. The latest two records must
establish two distinct successful live runs with 10–20 accepted listings and
consistent dataset/status identities and run times. A failed newer attempt or a later short
dataset prevents readiness. Each current listing must be present, checked within
24 hours, and supported by exact-address municipal evidence no older than seven
days at verification time. Synthetic entries and offline runs cannot satisfy
live acceptance. Fixture tests simulate these records only to test gate behavior.

The HTTP challenge check distinguishes public listing pages with ordinary
reCAPTCHA contact-form assets from a blocking challenge heading or access-denied
response. An actual denial/challenge still stops the run; there is no bypass.
