# Design

## Context

The Livit parser clones the listing's `.rich-text` description and currently removes matching content only from `p` and `li` elements. Its phone matcher requires a leading plus sign. The normalized offer stores the flattened description, so any missed contact text is exported.

## Goals / Non-Goals

**Goals:** Remove email addresses and supported telephone numbers from all description markup before producing the normalized description, while preserving unrelated description text.

**Non-Goals:** Change title or structured-field parsing, add contact storage, add a dependency, or infer contact information from external sources.

## Decisions

- Reconstruct the cloned description's text with block boundaries before sanitizing it. Matching the combined text catches contact details split across inline elements and preserves all surrounding words.
- Extend telephone recognition to Swiss local formats such as `091 123 45 67`, while retaining supported international formats and email detection. Keep the change scoped to description extraction.
- Add parser tests using real fixture parsing with contact strings in nested description markup; assert the exported description retains unrelated listing text and omits the contact details.

## Risks / Trade-offs

- [Risk] Broad telephone patterns can remove non-contact numeric text → constrain recognition to plausible phone-number digit counts and separator formats, and assert unrelated description text survives.
