# Proposal

## Why

Domaura currently compares invented offers, so it cannot yet help evaluate actual rental options. A Livit-backed dataset will exercise the existing evidence-based comparison with real listings. This change requires at least 10 accepted residential rental listings verified within Lugano municipality before it can be archived; the runtime dataset remains capped at 20.

## What Changes

- Add a local TypeScript collection command with separate source-adapter, HTTP, normalization, geographic-verification, persistence, and export boundaries; implement Livit as the only source.
- Bootstrap discovery from a bounded manifest of Livit detail URLs supported by Lugano-related candidate evidence. Automate collection and refresh of those candidates without crawling the national listing catalogue or following arbitrary related listings.
- Accept at most 20 distinct residential rental listings verified within Lugano municipality across the complete exported dataset. Require at least 10 qualifying listings in a live collection and a subsequent successful live refresh for archive acceptance. Report smaller results honestly and keep this change open until the target is met.
- Retain the existing individually reviewed Lugano manifest and stop additional candidate research. Add an archive-readiness check that validates the latest dataset, freshness, source identities, and matching live-run evidence; offline fixtures cannot satisfy live acceptance.
- Preserve source URLs, observation times, explicit property classification, rent meaning, feature evidence, and missing-information reasons. Record refresh failures and unavailable listings without treating them as proof of letting.
- Prefer Italian source pages with one supported fallback when needed. Normalize supported field labels independently of description language; retain original titles, descriptions, and evidence with separate page/text language metadata. Keep the English interface and omit automatic translation.
- Load the local collected dataset in the app with source links and freshness information. Keep synthetic examples available through an explicit demo mode, without mixing them into real-data results.
- Keep this release local and manually triggered. Additional sources, national collection, automatic scheduling, public hosting, new housing criteria, ranking, and copying photos or contact directories are outside this change.

## Capabilities

### New Capabilities

- `rental-offer-ingestion`: Bounded source collection, language-aware evidence-preserving extraction, listing identity, geographic verification, local storage, and capped dataset publication.

### Modified Capabilities

- `rental-offer-scope`: Require established residential classification alongside rental classification, and prevent uncertain or unavailable real listings from entering the accepted comparison set.
- `rental-comparison`: Present collected listings with source and freshness context, English comparison labels with original-language evidence, explicit empty/error states, and a distinct synthetic demonstration mode.

## Impact

The implementation will extend `src/domain/model.ts` and eligibility coverage, introduce collector and data-loading modules, update `src/main.tsx` and `src/ui/App.tsx`, and retain the existing criteria and comparison rules. Proposed additions are an HTML parser and official GeoAdmin address/building-register lookups; persistence uses Node.js 24's built-in SQLite support. Package scripts, TypeScript/Vitest coverage, README, offer-contract documentation, browser acceptance, and CI will cover the collection path without live-network dependencies in CI.

Live acceptance requires at least 10 distinct qualifying Livit listings, documented source access conditions, authoritative municipal evidence, a successful repeat live refresh, and a passing archive-readiness check. Published sitemap discovery remains an investigated option, not permission to crawl excluded search/query routes. A smaller successful collection validates the pipeline but does not complete this change. If the target cannot be reached within permitted inputs and existing limits, report the shortfall and leave the change unarchived.
