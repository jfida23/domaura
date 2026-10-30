# Tasks

## 1. Contact text redaction

- [x] 1.1 For `rental-offer-ingestion` / Contact details anywhere in description, add a focused parser regression for `091 123 45 67` inside nested non-paragraph markup, run it first and record the expected RED failure, implement element-independent email and Swiss phone filtering, then run the focused parser tests, apply the code-simplifier review, and run the full application test suite.
- [x] 1.2 For `rental-offer-ingestion` / Contact details anywhere in description, verify a paragraph containing both listing details and contact text retains the non-contact words while removing email/phone matches; run the focused parser test before implementation and record RED, then verify focused and full application test suites.
- [x] 1.3 For `rental-offer-ingestion` / Contact details split across inline elements, add a focused parser regression for a phone number split across adjacent text nodes, run it first and record RED, then redact contacts after reconstructing description text and verify focused and full application test suites.
