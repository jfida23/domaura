# Design

## Context

See proposal.md for motivation and scope. The application is React/TypeScript on Vite, with a source-independent comparison core, synthetic fixtures, Vitest/Testing Library, and Playwright. There is no collector, database, data loader, or server. `App` accepts offers but defaults to fixtures and hardcodes synthetic-data copy. `Offer` distinguishes transaction and municipal evidence but has no residential classification, source observation timestamps, or availability lifecycle.

Read-only investigation on 2026-10-28 established:

- Livit's public sitemap index advertised two child sitemaps containing 1,816 distinct German detail URLs. These cover mixed categories, not 1,816 available homes. Four spot-checked details returned content in HTML; one conditional request returned 304. These observations do not establish completeness, identifier stability, or ongoing access rights.
- Detail URLs contain either hashed IDs or dotted references; alternate-language links share the URL ID. Some pages describe several units together. A search-indexed Cassarate URL returned 404.
- Net rent, charges, and gross rent have separate labels. Balcony features can be grouped with outdoor seating; description evidence can be more specific.
- Livit's robots file excludes search routes and query URLs and states a 10-second crawl delay; its copyright notice limits downloads/copies to private noncommercial use. Published sitemap child query URLs do not resolve that access ambiguity.
- GeoAdmin address search resolved Piazza Cioccaro 2, 6900 Lugano to an official building record whose `ggdenr` is 5192. This provides an implementable municipal verification route without downloading national boundaries.

Sources: [Livit sitemap](https://www.livit.ch/sitemap.xml), [robots](https://www.livit.ch/robots.txt), [notice](https://www.livit.ch/de/information/impressum), [Lugano example](https://www.livit.ch/de/mieten/objekt/8c86d566c42e19d1e1dac37ac0ed5f2a), [GeoAdmin search contract](https://docs.geo.admin.ch/access-data/search.html), [official example building](https://api3.geo.admin.ch/rest/services/ech/MapServer/ch.bfs.gebaeude_wohnungs_register/11140513_0?returnGeometry=false), [Node 24 SQLite](https://nodejs.org/download/release/latest-v24.x/docs/api/sqlite.html).

## Goals / Non-Goals

**Goals:** independently test source parsing, bounded orchestration, municipal evidence, persistence, and presentation; collect and successfully refresh at least 10 qualifying Livit listings for archive acceptance; keep acquisition reproducible and uncertainty observable.

**Non-Goals:** a general crawler platform, browser/proxy infrastructure, hosted API, national discovery, cross-source entity matching, new criteria, automatic translation, UI localization, or automated interpretation of unrestricted descriptions.

## Decisions

### 1. Separate the local collector from the browser

Use Node.js 24 and TypeScript under `src/ingestion`, with a small CLI entry under `scripts`. The collector owns network and filesystem operations. Source adapters expose discovery input validation, canonical identity, extraction, and parser version; shared orchestration owns budgets, verification, and publication. Only the Livit adapter is registered. Inject HTTP, clock, wait, and storage at their boundaries for deterministic tests.

Use Cheerio for structural HTML parsing; select labelled listing fields within the detail content, not page-wide text or contact/related-offer sections. Keep source-specific selectors and vocabulary in the adapter. Node's built-in `fetch` and `node:sqlite` avoid a browser runtime and database service. Run the TypeScript CLI through the development dependency `tsx` so the existing extensionless domain imports work consistently outside Vite. Vitest ingestion tests run in the Node environment; existing UI tests keep jsdom. Include collector and CLI files in typechecking and CI.

Alternative: fetch Livit in React. Rejected because source requests, credentials if ever needed, throttling, and storage must not depend on browser sessions. A browser-rendering fallback is deferred until evidence requires it.

### 2. Bootstrap with a bounded Lugano candidate manifest

Proposed default: a local manifest containing at most 40 candidate detail identities, each with a Livit URL and Lugano-related discovery evidence. A seed is a lead, never municipal proof. Validate HTTPS, exact allowed host, supported detail routes, absence of credentials/query/fragment, and source IDs before network access. Normalize language variants to one source identity; prefer an allowed Italian variant and use at most one validated supported fallback when needed, as defined in Source language policy below. Do not assume a dot reference and a hash identify the same offer.

The initial manifest can be assembled from individually reviewed public links; collection and refresh are automated. Automatic search-engine discovery, national sitemap crawling, and recursive related-offer traversal are outside this bootstrap. This is an explicit implementation assumption for the agreed bounded-discovery scope, not a claim that Livit already exposes a permitted Lugano-only feed.

The initial four-lead manifest produced one accepted advert and three unavailable candidates. That result is preliminary pipeline evidence and does not satisfy archive acceptance. On 2026-10-30 the user reduced the archive minimum to 10 and stopped further research. Retain the existing 17 accepted identities in the reviewed manifest; refresh them without discovering additional candidates. The existing 40-identity manifest bound still applies. Use separately recorded, bounded manual runs as needed; do not reset budgets inside one run or append more than 20 accepted listings. Any new automated discovery route requires a documented design and access review before implementation. If sufficient qualifying supply cannot be established, leave this change open and report the remaining count.

Refresh retained accepted candidates first, then remaining manifest candidates in deterministic source-ID order, stopping new detail collection when 20 accepted slots are occupied. Refresh existing entries even when the cap is full. After confirmed unavailability or exclusion releases a slot, consider further manifest candidates within the same budgets. A global exported-dataset cap prevents accumulation past 20 across runs. Selection is an acquisition order, not a housing recommendation.

Alternative: crawl all 1,816 details to find Lugano. Rejected as inconsistent with the requested initial scope. An agreed geographically filtered discovery route can replace the manifest later without changing extraction or evaluation.

### 3. Enforce budgets and access conditions before fetching

Proposed local defaults are 40 distinct candidate IDs, 40 detail-request attempts including retries, 60 Livit HTTP attempts overall, 80 GeoAdmin HTTP attempts overall, and a 20-minute run deadline. These are independent ceilings; geocoding can require search plus feature lookup for each candidate. Stop when any relevant ceiling is reached, report the stop reason, and preserve the last successful dataset rather than relaxing the scope. Include redirects/retries in request accounting and validate every redirect target before sending a request.

Use one Livit request at a time, at least 10 seconds between request starts, an identified user agent, 15-second request timeouts, and a 2 MiB response-size ceiling. Respect stricter current directives and Retry-After. Retry network errors and 5xx once with bounded backoff; a second 429 or a delay beyond the remaining budget stops the run. Stop on access-denied/challenge responses, without browser escalation. Never retry 404/410 as transient errors. A 304 needs a stored response body and parser version; without one, perform one budgeted unconditional request. Reparse cached HTML if the parser changes.

Before live collection, record the actual permitted use and routes in local source configuration and check applicable robots directives. The bootstrap avoids excluded search/query routes and off-host redirects; it does not treat an empty disallow list as a reuse licence. Unresolved access stops the live run with a clear reason. Offline development can proceed, but completion cannot claim successful live acquisition until that prerequisite and live acceptance are evidenced. Public publication requires a separately scoped decision.

### 4. Extend evidence without changing comparison semantics

Add mandatory property classification (`residential`, `non-residential`, `unknown`) with evidence. Apartments, houses, and explicitly residential rooms qualify; parking, offices, storage, and ambiguous mixed-use offers do not. Preserve explicit rental classification separately. Update synthetic fixtures and test builders with residential evidence so existing valid tests retain their meaning; keep nonresidential examples for regression coverage.

Persist a source envelope containing source key/ID, canonical URL, parser/schema versions, page locale, original title and description with independently established text languages, address, classification, rent breakdown, field evidence with text-language metadata, first observation, last successful content check, last attempt, outcome, and geographic evidence. Namespace IDs as `livit:<opaque-id>`. Identical source IDs across languages count once. Multiple listings at the same address remain separate; an advert for several units or a price range counts as one listing, never invented individual apartments.

Project explicit monthly net rent into the existing base-rent field. Preserve gross rent and charges separately; do not subtract charges to invent net rent, treat a starting price as an exact amount, convert currencies, or mistake parking rent for dwelling rent. Conflicting values become unknown with an explanation. Balcony is true only with explicit balcony evidence, false only with explicit absence, otherwise unknown; a grouped balcony/seating feature alone is insufficient. Use narrowly defined, tested source-language evidence rules; ambiguous descriptions remain unknown.

Missing optional rent/balcony values do not disqualify an otherwise verified residential rental. Missing source identity or structural detail fields, however, is a parse failure rather than an offer with every field unknown. Never render fetched HTML as executable UI markup.

### Source language policy

Keep three independent concerns: the fetched page's locale, the languages of the original title/description/evidence, and Domaura's interface language. Support Livit's Italian, German, French, and English page-label vocabularies through explicit dictionaries backed by saved-response tests. These dictionaries map source labels and validated numeric formats to the same language-independent domain fields. For example, a tested Italian net-rent label and German `Nettomiete` map to base rent; neither label changes its currency, period, or cost meaning. Unknown labels or ambiguous number formats never trigger guessed values.

For Lugano candidates, prefer Italian when a validated, allowed same-ID Italian route is known from the adapter's documented route mapping, manifest, or source alternate link. If it is unavailable with 404/410, or no allowed Italian variant is known, choose at most one supported fallback, preferring the already supplied/retained candidate URL. When only alternate links are available, use the first supported allowed variant in deterministic order German, French, English. Fetch one successful variant per source identity per run; do not fetch other variants to translate, enrich, or fill uncertain fields. All attempts, including the optional fallback, consume existing request/deadline budgets. Access denial, challenges, transient service failures, or budget exhaustion still stop according to the HTTP policy and are not reasons to try another locale.

Record the actual fetched variant as the canonical source link and cache validators by exact locale URL. Retain the shared source ID across locale changes, but never reuse one locale's ETag or response body for another. A missing preferred locale alone is not listing withdrawal when the permitted fallback succeeds. If no allowed known variant can be checked, distinguish unavailable evidence from failed access/transport checks rather than manufacturing a successful observation. This refines the availability rules below for localized variants.

Preserve original title, listing description, and supporting excerpts as safe plain text with their wording intact, excluding contact/application sections. Record `pageLocale` separately from each original text's language. A route or document-level `lang` identifies the wrapper, not every paragraph. A German page with Italian prose therefore retains German page locale and Italian evidence language when that language is established; otherwise text language is explicitly unknown. Use source-provided text-specific language metadata or narrowly tested language-specific evidence rules, without adding a language-detection service or inferring every text's language from the wrapper. Mixed or ambiguous text can remain language-unknown.

Parse structured labels in the page locale, then evaluate original evidence using the supported rules for its own language. A supported Italian balcony statement on a German page can establish balcony presence; unsupported or ambiguous prose remains unknown. Conflicting source evidence retains the existing conflict policy. Normalize only into canonical values for comparison; do not translate titles, descriptions, or excerpts, and do not call a translation service. The UI keeps its current English labels and generated explanations, shows original-language evidence/title/description with language metadata when established, and labels undetermined text language honestly. Full-description display can be collapsed; original wording and provenance remain available for inspection. This policy does not introduce multilingual application navigation.

Alternative: translate each listing to English before extraction. Rejected because translation can alter cost/feature meaning, obscure original evidence, and add network/cost dependencies. Fetching every locale is also unnecessary for the capped Lugano pilot.

### 5. Verify the complete address against the official building register

Use GeoAdmin SearchServer with `type=locations`, `origins=address`, and a full street/house-number/postcode query. Require a unique exact normalized address match; search rank/weight alone is insufficient. Follow the returned building-register resource link, allowing only the documented GeoAdmin host and layer route. Responses can expose links at the result or attribute level, as observed in the live response; cover that contract explicitly.

Cross-check official street, house number, and postcode against the listing. Read `ggdenr` from `ch.bfs.gebaeude_wohnungs_register`; 5192 means Lugano, another established municipality means outside. Store the official feature ID, EGID, URL, returned address, municipality code/name, export date when supplied, lookup time, and address-match evidence. Record `municipality-id` as the geography basis. Do not infer a municipality from the listing's locality, postcode, search string, neighbouring town, or map centroid. Missing/ambiguous results, conflicting address evidence, or lookup failure remain unknown.

Cache successful lookups by exact normalized address for up to seven days; an address change requires re-verification. A fresh Livit 304 does not extend expired municipal evidence. The register is used only to verify location, not to override listing rent, features, or individual dwelling identity.

Alternative: geocode then run polygon containment against swissBOUNDARIES3D. Deferred because an official exact-address municipality record avoids boundary-download and coordinate-conversion machinery for this small release while meeting the existing specification.

### 6. Persist locally and publish an atomic, capped snapshot

Use SQLite for run records, candidates, source snapshots, verification evidence, and listing observations. Local data stays outside version control. Store extracted fields and relevant source excerpts; retain fetched HTML locally for at most seven days, with a maximum of two versions per manifest candidate. Do not fetch images, attachments, or application forms, and omit contact fields from normalized exports and test fixtures. Retain only the latest completed-run diagnostics plus one previous run in ordinary local storage, bounded by the manifest; this is not a historical market archive.

Distinguish listing observations as present, unavailable, or check-failed. A 404/410 after the bounded locale-selection/fallback policy is exhausted, or explicit listing-wide withdrawal, removes the listing from the accepted set at the next successful publication, while retaining a short diagnostic record; it does not assert that the property was let. A missing Italian page with a successful allowed fallback is still a present source listing. Transient failures retain prior evidence and its timestamp. An offer is stale when last successfully checked over 24 hours ago or when its latest attempted refresh failed. Cached 304 success advances the content-check time, not the time of the last content change.

A run publishes only after all mandatory steps for its selected snapshot succeed. Mandatory access, transport, structural parse, verification-service, deadline, or budget failures produce a failed-run report and leave the last successful offer snapshot intact. Proven exclusions, 404/410, and genuine missing/ambiguous address evidence are ordinary candidate outcomes; a successful run can publish fewer than 20 or an explicit empty dataset. This prevents an outage masquerading as mass withdrawal. Individual unavailable observations from a failed run remain diagnostic until a later successful publication.

Successful publication and archive acceptance have separate checks: a truthful short or empty operational snapshot remains valid, while this change requires at least 10 qualifying live listings before archiving. Do not alter empty/error UI handling or weaken the existing 0/7/20/21 collection tests to turn a short result into an apparent acquisition success.

Write a versioned JSON dataset and run metadata to a temporary sibling, validate cap, identities, evidence, and schema, then atomically replace the published file. Never expose partial output. Proposed commands are `npm run collect:livit -- --manifest <path>` and an offline fixture equivalent for tests. Running the command is manual; an external scheduler is deferred.

### 7. Present real-data and demo modes explicitly

Serve the local export as `public/data/livit-lugano.json` in development and the local preview build, with a separate atomic collection-status file for the latest failed attempt. Give each published dataset an ID; status identifies the dataset it concerns and the attempt time, so an old failure cannot taint a newer successful export. Version control excludes real exports, manifests, and SQLite files; CI supplies sanitized fixture exports. The browser reads only these local JSON resources and validates the envelope before passing offers into comparison. Preview builds contain a snapshot taken at build time; rebuild to include a later collection.

Normal application startup loads collected mode, showing loading, successful empty, unavailable/malformed dataset, and retained-stale-data states distinctly. An explicit Demo action selects the existing synthetic examples. Preserve direct `App` offer injection for component tests, with explicit dataset-mode metadata; update valid regression tests to select their intended mode rather than deleting assertions.

Show Livit attribution, the actual fetched variant's canonical source link, last successful check, original-language text/evidence, and stale/failed-refresh context, using the English interface and source-language metadata defined above. Do not label municipal verification as verification of availability or of every advertised attribute. Keep uncertain/excluded candidates in bounded collector diagnostics; any exposed diagnostic view must label why they cannot enter comparison. Requirements, preferences, and evaluation arithmetic retain their existing behavior. A source snapshot with no eligible offers never silently falls back to invented offers.

### 8. Require at least ten qualifying listings before archiving

Archive acceptance requires a successful live collection with at least 10 distinct qualifying Livit residential rental adverts and a subsequent successful live refresh that also contains at least 10. The runtime cap remains 20; do not truncate an otherwise valid 17-entry dataset to satisfy the minimum. Replacements after confirmed withdrawal or exclusion can count if they independently qualify. Never count language variants separately or split a project advert into invented units. Missing optional rent/balcony values remain valid unknowns under the existing eligibility contract.

Add a read-only local command, `npm run verify:livit-archive`, that checks the latest published dataset, matching collection status, and persisted run evidence. Record live/offline execution mode explicitly for new runs so fixture outputs cannot be credited as live evidence. Require the two relevant successful live-run records to establish the collection/refresh sequence, with the latest dataset ID matching the latest successful live run and status. Reject a later failed attempt, an invalid or fewer-than-ten current dataset, synthetic entries, unavailable/failed source observations, or missing/inconsistent run evidence. Do not rely on an old qualifying snapshot when the latest result is short.

Validate freshness at the time of the readiness check: all accepted source checks must be no older than 24 hours, and exact-address GWR evidence must remain within its seven-day validity period. The command reports accepted count, shortfall, and reasons for failing readiness, and exits nonzero until every condition is met. It performs no source requests and does not modify the dataset. Offline tests exercise the gate but do not constitute the required live collection.

The archive workflow must run this readiness command and review the separate live evidence report before archiving this change. Passing OpenSpec syntax validation or completing offline implementation tasks does not satisfy the live count requirement. The command and its tests are implemented; current acquisition and readiness outcomes are recorded separately in `docs/livit-verification.md`.

## Risks / Trade-offs

- Incomplete seeds or fewer than 10 qualifying offers -> report the actual count and shortfall; leave live acceptance and archiving incomplete, and broaden neither source nor geography automatically.
- Access terms or directives prevent live use -> keep offline tests runnable, report the exact unmet prerequisite, and leave live acceptance incomplete.
- HTML templates drift -> fail structural validation, retain the previous dataset, and reproduce using sanitized snapshots.
- Municipal lookup ambiguity -> keep the candidate unverified; do not use a fuzzy match to fill the cap.
- Some price/feature descriptions cannot be interpreted reliably -> retain unknown values and source excerpts for user review.
- Small samples cannot establish ongoing source reliability or complete market coverage -> make source coverage and observation age explicit.
- Node 24 SQLite is a runtime-specific facility -> document the supported runtime and keep database operations behind a narrow storage boundary.

## Migration Plan

1. Add domain evidence and classification coverage while preserving synthetic acceptance behavior.
2. Implement collector slices and offline acceptance, document source-use conditions, then supply a bounded candidate manifest for a local live run.
3. Add atomic local export loading and explicit demo selection; update documentation and CI with deterministic fixture data.
4. Retain the existing reviewed manifest without further candidate research, update and test archive readiness, and obtain a live collection plus a subsequent successful live refresh of at least 10 qualifying listings. Validate the full suite, typecheck/build, browser acceptance, and OpenSpec; run the readiness check against the current live result before archiving. Fewer-than-10 outcomes or blocked live prerequisites leave acceptance incomplete.
5. Roll back by selecting demo mode and reverting collector integration. Retain or remove local data only through an explicit local maintenance action; no stored user criteria migration or hosted deployment is involved.
