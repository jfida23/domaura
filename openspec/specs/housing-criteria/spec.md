# housing-criteria Specification

## Purpose

Let people express their housing needs as requirements and preferences that can be consistently applied when comparing rental offers.

## Requirements

### Requirement: Two criterion tiers
The system SHALL let users add, edit, and remove housing criteria and assign each criterion to exactly one tier: Requirement, labelled Must have, or Preference, labelled Nice to have. The system SHALL NOT offer preference weights or additional priority tiers.

#### Scenario: Define criteria
- **WHEN** a user adds a maximum monthly rent requirement and a balcony preference
- **THEN** both criteria are retained with their chosen tiers and values

#### Scenario: Change tier
- **WHEN** a user changes a balcony criterion from Nice to have to Must have
- **THEN** that criterion belongs only to the requirement tier

#### Scenario: Remove a criterion
- **WHEN** a user removes a criterion
- **THEN** it no longer participates in offer comparison

### Requirement: Explicit criterion meaning
The system SHALL display each criterion's attribute, comparison condition, and applicable value and unit so users can understand what an offer must satisfy.

#### Scenario: Numeric threshold
- **WHEN** a user defines a maximum rent criterion
- **THEN** its display identifies the rent measure, maximum amount, currency, and monthly period

#### Scenario: Housing feature
- **WHEN** a user defines a balcony criterion
- **THEN** its display identifies that balcony presence is desired

### Requirement: Valid criteria
The system SHALL reject incomplete criteria and values incompatible with the selected condition, explain the problem, and retain the user's input for correction.

#### Scenario: Invalid numeric value
- **WHEN** a user submits a maximum rent criterion without a valid non-negative amount
- **THEN** the criterion is not applied and a correction message is shown

### Requirement: Equal preference treatment
The system SHALL give every preference equal contribution to comparison summaries regardless of its entry order or attribute.

#### Scenario: Reordered preferences
- **WHEN** the same preferences are entered in a different order
- **THEN** the offer's comparison summary is unchanged
