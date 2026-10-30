# rental-comparison Delta

## ADDED Requirements

### Requirement: Collected offer provenance
The system SHALL show each collected offer's source attribution, canonical listing link, and last successful source-check time alongside its comparison evidence. It SHALL distinguish municipal verification from availability or attribute verification, and SHALL preserve unknown criterion outcomes when source information is missing or ambiguous.

#### Scenario: Inspect a real offer
- **WHEN** a user views a collected Livit listing
- **THEN** the user can open its canonical source page, identify Livit as its source, and see when the listing was last successfully checked

#### Scenario: Incomplete real attributes
- **WHEN** a geographically verified residential rental lacks an exact base rent or conclusive balcony evidence
- **THEN** the affected criterion outcomes remain unknown with the source information gap explained

#### Scenario: Municipal verification label
- **WHEN** an offer's location is verified through an official address record
- **THEN** the interface identifies the location evidence without claiming that the property remains available or that every advertised feature has been independently verified

### Requirement: English interface with original-language listing text
The system SHALL retain English interface labels and generated comparison explanations while presenting original source titles and evidence, and allowing inspection of the original description. It SHALL identify established source-text languages separately from page locale and label undetermined text language honestly. It SHALL NOT automatically translate source text or use translation as comparison evidence.

#### Scenario: Italian text in the English interface
- **WHEN** a collected listing has an Italian title, description, or evidence
- **THEN** the user sees English interface/comparison labels and can inspect that original Italian text with its established language identified

#### Scenario: German page with Italian evidence
- **WHEN** an offer was collected from a German page but its supporting passage is established as Italian
- **THEN** the interface identifies the passage as Italian rather than labelling it German because of the page locale

#### Scenario: Undetermined source-text language
- **WHEN** the source-text language was not established during collection
- **THEN** the interface preserves the original text with undetermined-language context and does not present it as an English translation

### Requirement: Collected dataset loading and failure states
The system SHALL distinguish collected-data loading, a successful empty dataset, an unavailable or invalid dataset, and retained data after a failed refresh. It SHALL show stale context for observations older than 24 hours or affected by a failed refresh, retain their actual evidence times, and SHALL NOT silently substitute synthetic offers.

#### Scenario: Dataset loading
- **WHEN** the local collected dataset is being loaded
- **THEN** the interface shows a loading state without presenting synthetic offers as collected results

#### Scenario: Successfully empty dataset
- **WHEN** the latest successful collection contains no eligible offers
- **THEN** the interface explains that no eligible collected offers are available and preserves the distinction from a collection failure

#### Scenario: Missing or invalid dataset
- **WHEN** no collected dataset is available or its schema or acceptance constraints are invalid
- **THEN** the interface explains that collected data is unavailable without inventing fit results or automatically switching to demo data

#### Scenario: Failed refresh with retained data
- **WHEN** the last successful dataset exists and a subsequent collection attempt failed
- **THEN** the interface retains that dataset, shows the failed-refresh context, and preserves each listing's last successful check time

#### Scenario: Stale observation
- **WHEN** a listing was last successfully checked more than 24 hours ago
- **THEN** the interface visibly identifies the observation as stale rather than presenting it as freshly checked

### Requirement: Explicit synthetic demonstration mode
The system SHALL keep synthetic examples in an explicitly selected demo mode, label them as invented, and separate them from collected-data results. Normal startup SHALL select collected-data mode. Switching dataset modes SHALL preserve the user's active housing criteria.

#### Scenario: Start with collected data
- **WHEN** the application starts normally
- **THEN** it loads collected-data mode and does not label real listings as synthetic examples

#### Scenario: Choose demo examples
- **WHEN** a user explicitly selects demo mode
- **THEN** the existing synthetic examples are shown with clear demo labels and the active criteria continue to apply

#### Scenario: Return to collected data
- **WHEN** a user leaves demo mode for collected-data mode
- **THEN** synthetic examples are removed from the comparison and the current criteria apply to the collected dataset
