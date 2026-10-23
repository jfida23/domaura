# Design

## Context

See proposal.md for motivation and the three capability deltas for behavior. The repository has no application, dependencies, tests, data integration, or deployment configuration. This design establishes a small, source-independent comparison core. It is included because the initial domain model and handling of incomplete listing data need decisions before implementation.

## Goals / Non-Goals

**Goals:**
- Keep geographic eligibility, user criteria, and offer evaluation independently testable.
- Preserve the difference between false, absent, and unknown values.
- Allow the interface to explain every comparison result from the same evaluation output.

**Non-Goals:**
- Select a listing provider, establish a scraping pipeline, or infer legal access to listings.
- Implement market valuation, recommendation weights, or automatic ranking.
- Introduce accounts, server persistence, or production deployment as prerequisites for validating the comparison shell.

## Decisions

### Separate domain evaluation from source adapters and presentation

Normalize offers before comparison. Each offer needs a stable identifier, transaction type, municipal eligibility and its evidence, typed housing attributes, and explicit unknown values. Preserve source references when available; do not fabricate evidence. Criteria identify an attribute, condition, value/unit where applicable, and one of the two tiers. Evaluation returns outcomes and explanations without depending on UI components or provider fields.

Alternative: compare raw listing fields directly in the interface. Rejected because provider-specific conventions and missing fields could silently change matching behavior.

### Use explicit, typed criteria rather than unrestricted text interpretation

The initial shell can demonstrate maximum monthly base rent in CHF and balcony presence as numeric and feature examples. These are proposed starter criteria, not an exhaustive housing taxonomy. Use a criterion catalogue so additional attributes can be introduced without changing the two-tier model. Reject invalid numeric values; define inclusive maximum comparisons. Do not reinterpret base rent as total housing cost.

Alternative: accept arbitrary natural-language criteria and infer their meaning. Deferred because this would introduce ambiguity and inference behavior beyond the agreed shell.

### Evaluate requirements before presenting preference summaries

For every eligible offer, evaluate each criterion independently. Any unmet requirement yields a requirement failure; otherwise any unknown requirement yields needs verification; otherwise all requirements are satisfied. Handle zero requirements explicitly. Count satisfied, unmet, and unknown preferences separately, giving each equal contribution. Do not infer a ranked winner from these counts.

Alternative: combine everything into a numeric score. Rejected because preference matches could obscure mandatory failures or missing information.

### Isolate municipal verification

Represent location eligibility as verified inside, verified outside, or unknown, with supporting evidence. Only verified-inside rentals enter comparison. A provider's municipality identifier or a coordinate checked against an authoritative boundary could establish eligibility; a marketing label cannot. The evidence mechanism must be chosen and documented before real offers are classified. Synthetic fixtures can explicitly declare their status for domain validation without pretending to verify real addresses.

Alternative: accept every listing labelled Lugano. Rejected because an area label does not reliably express the agreed municipal boundary.

### Validate the shell with clearly labelled fixtures first

Proposed implementation staging: exercise criteria entry and comparison with synthetic offers covering in-scope, out-of-scope, and unknown data. Keep fixtures behind the same normalization contract intended for future sources and label demonstration data clearly. This validates the agreed behavior without assuming a provider is available. It is not a live rental search release.

Live listing acquisition requires a subsequent scoped decision about source access, coverage, freshness, and geographic evidence. Do not silently replace that decision with scraping. Runtime and framework selection can be made when implementation starts: they do not change this domain contract or the task structure below.

## Risks / Trade-offs

- Missing fields reduce confirmed matches -> retain unknown outcomes and show what needs checking.
- Fixture success does not prove live data availability -> keep demo and live release claims distinct; evaluate a provider before live integration.
- Municipality labels or boundaries can be ambiguous -> preserve evidence and classify insufficient evidence as unknown.
- Two tiers do not resolve every personal trade-off -> expose per-criterion results for user judgment instead of adding weights.
- Starter criteria cover only examples -> keep the catalogue extensible and review further criteria before expanding the product scope.

## Migration Plan

There is no existing application or stored user data to migrate. Implement and verify the comparison shell locally with labelled fixtures first. Update the README with actual run and verification commands when code exists. No production deployment is authorized or planned by these artifacts. Rollback of the initial implementation is removal or reversion of the new application files; retain these planning artifacts unless separately changed.

## Open Questions

- Which runtime and UI framework should implement the shell? Resolve at implementation kickoff; the domain contracts and acceptance scenarios are framework-independent.
- Which future listing source and geographic evidence mechanism can support real offers? Resolve before a separate live-data integration; the initial fixture-backed shell does not depend on it.
- Which additional housing criteria should follow the starter examples? Extend the catalogue through subsequent scoped decisions.
