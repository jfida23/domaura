# Proposal

## Why

The Livit parser currently removes some contact text only from paragraph and list elements, and recognizes phone numbers only when they begin with `+`. Local Swiss numbers and contact details inside other description elements can remain in normalized exports. This review finding violates the existing contact-data omission contract and should be fixed before merging the PR.

## What Changes

- Ensure contact details are removed from all parsed listing-description text regardless of HTML element type.
- Recognize Swiss local and international telephone formats, as well as email addresses.
- Add regression coverage for local telephone numbers and nested `div`/`span` markup.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `rental-offer-ingestion`: Clarify that contact details embedded anywhere in a listing description are excluded from normalized exports.

## Impact

Update the Livit description sanitization in `src/ingestion/livit/parser.ts`, its parser tests, and the ingestion capability spec. No public API or dependency changes are expected.
