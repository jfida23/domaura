# rental-offer-ingestion Delta

## MODIFIED Requirements

### Requirement: Stable source identity and reproducible evidence
Each normalized listing SHALL retain its source identity, canonical detail URL, parser version, observation times, original title/description, and evidence for known values, with contact details removed from retained description text. Alternate-language copies of one source ID SHALL count once. A multi-unit advert SHALL remain one listing. Stored diagnostics and source excerpts SHALL be bounded and local; normalized exports SHALL omit contact fields and copied media.

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

#### Scenario: Contact details anywhere in description
- **WHEN** an email address or phone number such as `091 123 45 67` appears in description text inside any HTML element
- **THEN** contact details are omitted from the normalized description regardless of their element or telephone notation, while non-contact description text is retained

#### Scenario: Contact details split across inline elements
- **WHEN** a phone number or email address is split across adjacent inline HTML elements in the description
- **THEN** the contact detail is omitted from the normalized description while surrounding non-contact text is retained
