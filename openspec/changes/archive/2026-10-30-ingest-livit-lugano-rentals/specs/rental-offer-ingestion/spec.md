# rental-offer-ingestion Delta

## Purpose

Collect a small, reproducible set of real Livit rental listings for Lugano while preserving source evidence, uncertainty, acquisition limits, and observation freshness.

## ADDED Requirements

### Requirement: Bounded Livit candidate collection
The collector SHALL fetch only explicitly supplied Livit detail candidates with Lugano-related discovery evidence. It SHALL enforce separate candidate, request, and run-duration limits, reject invalid inputs before fetching, and report why collection stopped. It SHALL NOT crawl national listings or recursively follow related offers.

#### Scenario: Off-source or unsupported candidate
- **WHEN** a manifest contains an off-host URL, unsupported route, URL credentials, query, fragment, missing discovery evidence, or more candidates than the configured ceiling
- **THEN** collection rejects the manifest before making source requests and identifies the invalid input

#### Scenario: Candidate budget is not an accepted-listing target
- **WHEN** fetched candidates are excluded or unverified
- **THEN** they consume the configured acquisition budgets and do not cause those budgets to be extended to fill the dataset

#### Scenario: Request or duration limit reached
- **WHEN** a required request would exceed a configured request ceiling or run deadline
- **THEN** no further request is sent, the run reports the limit reached, and the last successful dataset is preserved

#### Scenario: Related listings on a detail page
- **WHEN** a fetched detail page links to listings absent from the supplied candidate manifest
- **THEN** the collector does not fetch those related listings

### Requirement: Source locale selection
The collector SHALL prefer an allowed Italian variant for each Lugano candidate and use at most one validated supported fallback when Italian is unavailable. It SHALL retain the actual fetched URL and one shared listing identity. Locale attempts SHALL consume existing request budgets. It SHALL NOT fetch extra variants to translate or fill uncertain fields, or switch locale to bypass an access denial or challenge.

#### Scenario: Italian variant available
- **WHEN** an allowed same-ID Italian variant is known and successfully collected
- **THEN** the collector uses that variant and does not fetch the listing's other language variants

#### Scenario: Preferred locale missing
- **WHEN** the Italian variant returns 404 or 410 and one validated allowed supported fallback is known
- **THEN** the collector can use that fallback within the same budgets, retains its actual source URL, and does not mark the listing unavailable solely because Italian is missing

#### Scenario: Only a supported non-Italian variant is known
- **WHEN** no validated allowed Italian variant is known but a supported candidate variant is supplied
- **THEN** the collector uses that variant without probing every language route

#### Scenario: Locale fallback cannot bypass limits or denial
- **WHEN** a locale request encounters an access denial, challenge, exhausted request budget, or run deadline
- **THEN** collection follows the normal stop/failure rules instead of trying another locale

#### Scenario: Cache remains specific to the fetched variant
- **WHEN** a later run uses a different locale URL for the same listing identifier
- **THEN** it retains one listing identity but does not reuse the previous locale's validators or response body for the new URL

### Requirement: Source access and bounded HTTP behavior
The collector SHALL check recorded source-use conditions and applicable route directives before live requests. It SHALL apply per-host pacing, bounded retries, timeouts, response-size limits, and conditional requests when usable. Access denial or a challenge SHALL stop collection without bypass attempts. Redirects and retries SHALL consume request budgets.

#### Scenario: Unresolved source access
- **WHEN** required source-use conditions or access to a requested route are unresolved or disallowed
- **THEN** the live run stops with the unmet condition and does not fetch that route or replace the accepted dataset

#### Scenario: Pace and retry budget
- **WHEN** a request is retried after a transient error or retryable rate limit
- **THEN** the retry respects the configured host interval and any stricter Retry-After value, consumes the same request budget, and stops when retry or deadline limits are exhausted

#### Scenario: Challenge or unsafe redirect
- **WHEN** a source returns an access challenge, access denial, or a redirect outside allowed source routes
- **THEN** collection stops without fetching the redirected target, switching to a browser, or bypassing the restriction

#### Scenario: Unchanged content
- **WHEN** a conditional request returns 304 and a usable cached body exists
- **THEN** the collector reuses that content, records a successful check, and retains the actual content-change timestamp

#### Scenario: Cache missing after 304
- **WHEN** a source returns 304 but no usable cached content exists
- **THEN** the collector makes at most one budgeted unconditional fetch or reports a failed check without inventing content

### Requirement: Stable source identity and reproducible evidence
Each normalized listing SHALL retain its source identity, canonical detail URL, parser version, observation times, original title/description, and evidence for known values. Alternate-language copies of one source ID SHALL count once. A multi-unit advert SHALL remain one listing. Stored diagnostics and source excerpts SHALL be bounded and local; normalized exports SHALL omit contact fields and copied media.

#### Scenario: Language duplicates
- **WHEN** two candidate URLs are language variants of the same Livit source identifier
- **THEN** they produce one normalized listing and consume at most one accepted slot

#### Scenario: Two units at one address
- **WHEN** two Livit identifiers advertise different units at the same street address
- **THEN** the collector does not merge them solely because their addresses match

#### Scenario: Multi-unit advert
- **WHEN** one source advert describes multiple apartments or a starting-price range
- **THEN** it counts as one listing and does not generate invented individual offers or exact unit rents

#### Scenario: Evidence retained without contact export
- **WHEN** a detail page is normalized
- **THEN** its source URL, observation time, parser version, and supporting field excerpts are retained, while contact details, images, and application-form content are omitted from the exported record

### Requirement: Faithful rent and feature interpretation
The collector SHALL preserve net rent, additional charges, and gross rent as distinct measures, and expose only explicit exact values as known comparison values. Missing, conflicting, or ambiguous data SHALL remain unknown with a reason. Balcony presence or absence SHALL require explicit evidence; absence from a feature list SHALL NOT establish absence of a balcony.

#### Scenario: Separate monthly costs
- **WHEN** an advert explicitly states monthly net rent of CHF 1530, charges of CHF 150, and gross rent of CHF 1680
- **THEN** the comparison base rent is CHF 1530 per month and charges and gross rent retain their separate meanings

#### Scenario: Inclusive or starting rent only
- **WHEN** an advert supplies only an inclusive rent or a rent starting from a stated amount
- **THEN** the collector does not manufacture an exact base rent by subtraction or by treating the starting amount as an exact unit price

#### Scenario: Conflicting rent evidence
- **WHEN** the same rent measure has conflicting values in the labelled fields and description
- **THEN** that comparison value is unknown and the conflict is explained

#### Scenario: Balcony evidence
- **WHEN** a listing explicitly establishes balcony presence or explicitly establishes its absence
- **THEN** the balcony value records that known state with its supporting evidence

#### Scenario: Grouped or missing feature
- **WHEN** a listing says only balcony/seating, balcony/garden, or supplies no balcony information
- **THEN** balcony presence remains unknown unless separate explicit evidence resolves it

### Requirement: Language-aware field interpretation
The collector SHALL map supported Italian, German, French, and English page labels and validated number formats into the same domain fields without changing their meaning. It SHALL interpret original evidence independently of the page locale using supported language-specific rules. Unsupported or ambiguous wording SHALL remain unknown. Automatic translation SHALL NOT be used for extraction or as evidence.

#### Scenario: Equivalent localized fields
- **WHEN** supported Italian and German pages explicitly state equivalent net rents under their respective net-rent labels
- **THEN** both normalize to the same amount, currency, period, and base-rent meaning

#### Scenario: German wrapper with Italian listing prose
- **WHEN** a German page contains an Italian balcony statement recognized by a supported explicit-evidence rule
- **THEN** the collector records the balcony evidence from that Italian statement independently of the German field labels

#### Scenario: Unsupported prose or ambiguous number format
- **WHEN** a source passage or number cannot be interpreted by a supported unambiguous rule
- **THEN** the affected value remains unknown with a reason and no translation request or extra locale fetch is made to resolve it

### Requirement: Original text and language provenance
The collector SHALL preserve original title, listing-description, and evidence wording as safe plain text, and record page locale separately from each text's independently established language. It SHALL record text language as unknown when it cannot establish it, and SHALL NOT inherit description or evidence language from the page wrapper. It SHALL NOT automatically translate retained text.

#### Scenario: Mixed page and text languages
- **WHEN** a German page contains an established Italian description or supporting excerpt
- **THEN** the record retains German page locale, Italian language for that text, and the original wording

#### Scenario: Text language not established
- **WHEN** the language of a title, description, or excerpt cannot be established independently
- **THEN** its original wording is retained with unknown text-language metadata rather than assigning the wrapper's language

### Requirement: Authoritative municipal verification
The collector SHALL establish municipal membership from an official building record matched uniquely to the listing's complete street address and postcode. It SHALL retain the match evidence, official feature reference, municipality identifier, lookup time, and available data date. Missing, ambiguous, conflicting, failed, or expired verification SHALL NOT establish eligibility.

#### Scenario: Verified Lugano address
- **WHEN** an exact address match resolves to an official record with municipality identifier 5192 for Lugano
- **THEN** municipal status is inside with the official record and address-match evidence

#### Scenario: Neighbouring municipality
- **WHEN** an advert marketed as Lugano resolves to an official record for Massagno, Paradiso, or another municipality
- **THEN** municipal status is outside regardless of its marketing locality or postcode

#### Scenario: Fuzzy or ambiguous address
- **WHEN** no unique exact street, house-number, and postcode match can be established
- **THEN** municipal status remains unknown and the candidate is excluded from the accepted dataset

#### Scenario: Changed address or expired evidence
- **WHEN** a listing's address changes or its municipal-verification evidence expires
- **THEN** a new successful verification is required before it can enter a newly published accepted dataset

### Requirement: Capped accepted dataset
The complete accepted dataset SHALL contain at most 20 distinct Livit listings classified as residential rentals, currently advertised at the last successful observation, and verified within Lugano municipality. Excluded, unavailable, and unverified candidates SHALL remain separate. The collector SHALL publish fewer listings when fewer qualify, without padding or relaxing these conditions.

#### Scenario: Twenty accepted listings
- **WHEN** 20 qualifying distinct listings occupy the accepted dataset
- **THEN** the collector stops fetching additional new candidates and the dataset never contains a twenty-first listing

#### Scenario: Cap across successive runs
- **WHEN** a later collection run encounters additional qualifying listings while 20 retained listings still qualify
- **THEN** the published dataset remains capped at 20 rather than appending another run's allowance

#### Scenario: Fewer qualifying listings
- **WHEN** a successfully completed bounded run finds only seven qualifying listings
- **THEN** the published dataset contains seven listings and reports the actual result and acquisition limits, while this change's minimum-ten archive acceptance remains incomplete

#### Scenario: Missing optional comparison fields
- **WHEN** a candidate is a verified Lugano residential rental but its rent or balcony information is unknown
- **THEN** it can count toward the cap with unknown criterion outcomes rather than fabricated attributes

#### Scenario: Refresh at capacity
- **WHEN** collection starts with 20 accepted listings
- **THEN** it still refreshes retained candidates within the budgets and only considers replacements after slots become available

### Requirement: At least ten listings for archive acceptance
This change SHALL remain unarchived until a live collection and a subsequent successful live refresh each publish at least 10 distinct qualifying Livit residential rental listings verified within Lugano municipality. Smaller successful collections SHALL leave live acceptance incomplete. Source, geographic, identity, and acquisition constraints SHALL remain in force while filling the dataset.

#### Scenario: Short live collection
- **WHEN** a successful live collection or its repeat refresh contains fewer than 10 qualifying listings, including 0, 1, or 9
- **THEN** the actual count and shortfall are reported and this change remains unarchived

#### Scenario: At least ten qualifying live listings and repeat refresh
- **WHEN** a live collection and a subsequent successful live refresh each publish at least 10 distinct qualifying listings and the latest snapshot satisfies archive-readiness checks
- **THEN** the listing-count acceptance condition is satisfied, subject to the remaining implementation and verification tasks

#### Scenario: No padding to reach ten
- **WHEN** candidate supply is insufficient or includes language duplicates, multi-unit adverts, out-of-municipality offers, uncertain classifications, or unavailable pages
- **THEN** only distinct qualifying source listings count, one multi-unit advert counts once, and neither fabricated entries nor relaxed eligibility or access limits can satisfy the target

### Requirement: Archive-readiness evidence
An archive-readiness check SHALL validate the latest local dataset against the minimum-ten acceptance condition and matching successful live-run evidence. It SHALL reject invalid, stale, failed-refresh, or offline-only evidence and report unmet conditions. Every listing SHALL have a successful source check no older than 24 hours and unexpired exact-address municipal evidence at review time.

#### Scenario: Invalid or excessive dataset
- **WHEN** the export is missing, malformed, contains more than 20 entries, or fails identity, residential-rental, source-observation, or Lugano-evidence validation
- **THEN** archive readiness fails and reports the unmet conditions

#### Scenario: Stale or failed latest refresh
- **WHEN** any accepted listing was last successfully checked more than 24 hours ago, its municipal evidence expired, or the latest refresh failed even though a retained snapshot still contains 20 entries
- **THEN** archive readiness fails until fresh successful live evidence meets all conditions

#### Scenario: Offline fixtures or mismatched run evidence
- **WHEN** the qualifying export comes only from offline fixtures or its dataset identity does not agree with the recorded successful live collection and refresh evidence
- **THEN** it cannot satisfy live acceptance or authorize archiving

#### Scenario: Latest dataset controls readiness
- **WHEN** a previous live snapshot contained at least 10 qualifying listings but the latest successful live snapshot contains fewer than 10
- **THEN** the current shortfall controls readiness and the earlier snapshot cannot be used to claim completion

### Requirement: Distinct availability and failure outcomes
The collector SHALL distinguish successful observation, confirmed source unavailability, and failed checks. Source unavailability SHALL NOT be described as proof that a property was let. A transient failure SHALL retain previous evidence and its age. Each run SHALL report outcomes and timestamps so stale evidence remains identifiable.

#### Scenario: Source no longer advertises the listing
- **WHEN** the bounded locale-selection policy establishes 404/410 unavailability without a successful permitted fallback, or the source provides explicit listing-wide withdrawal evidence
- **THEN** it is recorded as source-unavailable and removed from the next successfully published accepted dataset without claiming it was rented

#### Scenario: Transient refresh failure
- **WHEN** a retained listing cannot be checked because of a transport or service failure
- **THEN** its last successful evidence and timestamp remain intact and the latest attempt records a failure

#### Scenario: Old observation
- **WHEN** a retained listing was last successfully checked more than 24 hours ago or its latest refresh failed
- **THEN** exported freshness metadata identifies it as stale

### Requirement: Atomic dataset publication
The collector SHALL publish a schema-validated local dataset atomically after a successful bounded run. Mandatory access, transport, structural parsing, verification-service, budget, or deadline failures SHALL leave the last successful dataset intact and produce a separate failure status. Successful exclusions and unresolved candidate evidence SHALL be reported without being misrepresented as a pipeline outage.

#### Scenario: Mandatory stage fails
- **WHEN** required page structure is missing, a mandatory service fails, or a budget/deadline prevents successful completion
- **THEN** the previous dataset remains intact and the latest run reports the failure rather than publishing a partial or empty replacement

#### Scenario: Successful empty collection
- **WHEN** a run completes normally and every supplied candidate is unavailable, excluded, or unverified
- **THEN** it publishes an explicitly successful empty dataset with candidate outcome counts

#### Scenario: Interrupted publication
- **WHEN** writing or validating the next dataset fails before atomic replacement
- **THEN** readers continue to see the complete previous dataset rather than a partially written file
