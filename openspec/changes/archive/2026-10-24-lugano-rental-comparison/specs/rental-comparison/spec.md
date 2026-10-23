# Spec Delta

## Purpose

Help users compare eligible rental offers against their housing criteria with clear explanations and explicit treatment of missing information.

## ADDED Requirements

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
