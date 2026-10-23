# Tasks

## 1. Application foundation

- [x] 1.1 Select and document the shell's runtime and UI framework, scaffold the local application with separate domain and presentation modules, and verify the documented start command launches it.
- [x] 1.2 Define normalized offer, geographic evidence, criterion, and evaluation-result contracts with explicit unknown values; verify the contracts can represent every state in the three capability specs.
- [x] 1.3 Add clearly labelled synthetic fixtures for eligible rentals, sale offers, outside-municipality offers, and unknown location or attributes; document their synthetic status and verify no fixture is presented as a live listing.

## 2. Rental eligibility

- [x] 2.1 Implement rental-only and verified-inside-municipality eligibility; verify tests cover all rental-offer-scope scenarios, including unknown transaction type and a Lugano label without sufficient geographic evidence.
- [x] 2.2 Present unknown geographic eligibility separately from eligible comparison results; verify the fixture with imprecise location is labelled unverified and cannot appear as an eligible match.
- [x] 2.3 Document the fixture eligibility evidence contract and the evidence needed from a future real-data adapter; verify the documentation distinguishes declared synthetic status from verification of a real location.

## 3. Housing criteria

- [x] 3.1 Add a typed criterion catalogue with maximum monthly base rent in CHF and balcony presence as starter examples; verify numeric conditions and feature-presence conditions validate correctly and keep missing offer values unknown.
- [x] 3.2 Implement criterion addition, editing, removal, and tier changes with Must have and Nice to have labels; verify users can perform each operation without preference weights or additional tiers.
- [x] 3.3 Add input validation and correction messages preserving invalid input; verify tests cover incomplete criteria, invalid or negative rent amounts, and successful correction.
- [x] 3.4 Document starter criteria, units, and the distinction between base rent and total cost; verify displayed criterion labels agree with those definitions.

## 4. Offer comparison

- [x] 4.1 Implement satisfied, unmet, and unknown evaluations with inclusive maximum comparisons and explicit unit/cost-measure compatibility; verify tests cover known presence, known absence, missing data, exact thresholds, and incomparable costs from rental-comparison.
- [x] 4.2 Implement requirement-fit summaries and equal preference counts; verify unmet requirements take precedence over unknown requirements, preferences cannot compensate for either, zero requirements are explicit, and preference order does not affect results.
- [x] 4.3 Build the comparison view with shared criteria, per-offer outcomes, evidence or missing-data explanations, and separate preference counts; verify two synthetic offers can be compared without an unexplained overall score.
- [x] 4.4 Recompute displayed results after every criterion mutation and implement empty states; verify tier changes alter requirement fit and that no-offer and no-criteria scenarios display the specified explanations.
- [x] 4.5 Document how to read comparison outcomes and their limitations; verify examples cover a confirmed match, an unmet requirement, and a requirement needing verification.

## 5. End-to-end acceptance

- [x] 5.1 Exercise the local fixture-backed journey from creating requirements and preferences through comparing offers and changing a tier; verify eligibility, displayed evidence, unknown states, and updated summaries together.
- [x] 5.2 Run the implementation's documented verification commands and check acceptance coverage against all three delta specs; record results and ensure the README describes this as a demonstration shell rather than a live rental search service.
