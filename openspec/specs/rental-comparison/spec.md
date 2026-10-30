# rental-comparison Specification

## Purpose

Help users compare eligible rental offers against their housing criteria with clear explanations and explicit treatment of missing information.

## Requirements

### Requirement: Criterion evaluation
The system SHALL evaluate each eligible offer against each active criterion as satisfied, unmet, or unknown. Missing or incomparable information SHALL produce unknown rather than an assumed match or failure.

#### Scenario: Known feature
- **WHEN** an offer explicitly has a balcony and balcony presence is a criterion
- **THEN** that criterion is satisfied

#### Scenario: Known absence
- **WHEN** an offer explicitly has no balcony and balcony presence is a criterion
- **THEN** that criterion is unmet

#### Scenario: Missing feature information
- **WHEN** an offer does not establish whether it has a balcony
- **THEN** that criterion is unknown

#### Scenario: Inclusive maximum
- **WHEN** an offer's known monthly rent equals a maximum criterion for the same rent measure and currency
- **THEN** that criterion is satisfied

#### Scenario: Incomparable cost
- **WHEN** a total monthly housing cost criterion is compared with an offer that states only base rent and leaves additional charges unknown
- **THEN** that criterion is unknown

### Requirement: Requirement fit
The system SHALL distinguish offers satisfying all requirements, offers with at least one unmet requirement, and offers with no unmet requirements but at least one unknown requirement. Preference matches SHALL NOT compensate for an unmet or unknown requirement.

#### Scenario: All requirements satisfied
- **WHEN** an offer satisfies every active requirement
- **THEN** it is identified as meeting all requirements

#### Scenario: Requirement failure
- **WHEN** an offer has an unmet requirement and several satisfied preferences
- **THEN** it is identified as not meeting all requirements

#### Scenario: Uncertain requirement
- **WHEN** an offer has no unmet requirements but has an unknown requirement
- **THEN** it is identified as needing verification rather than meeting all requirements

#### Scenario: Preferences only
- **WHEN** the user has preferences but no requirements
- **THEN** the comparison states that no requirements were specified and displays preference results

### Requirement: Explainable comparison
The system SHALL present eligible offers against the same active criteria, showing each criterion's tier, outcome, and supporting offer value or missing-information explanation. It SHALL show separate satisfied, unmet, and unknown counts for preferences, without unequal weighting or an unexplained overall score.

#### Scenario: Compare two offers
- **WHEN** two eligible offers have different outcomes for a criterion
- **THEN** the user can inspect both outcomes and the evidence or information gap behind each

#### Scenario: Partial preference information
- **WHEN** an offer satisfies two preferences and has one unknown preference
- **THEN** its summary shows two satisfied, zero unmet, and one unknown preference

### Requirement: Recompute on criteria changes
The system SHALL update comparison results when a user adds, edits, removes, or changes the tier of a criterion.

#### Scenario: Preference becomes requirement
- **WHEN** an unmet balcony preference is changed to a requirement
- **THEN** the offer is identified as not meeting all requirements

### Requirement: Empty comparison states
The system SHALL explain when no eligible offers are available or no criteria have been supplied, without claiming an offer is the best match.

#### Scenario: No eligible offers
- **WHEN** the available offer set contains no verified in-scope rentals
- **THEN** the interface explains that no eligible offers are available for comparison

#### Scenario: No criteria
- **WHEN** the user has supplied no criteria
- **THEN** the interface prompts the user to define requirements or preferences before presenting fit results

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
