# rental-offer-scope Specification

## Purpose

Keep the initial rental comparison focused on housing within Lugano municipality and make uncertain offer eligibility visible.

## Requirements

### Requirement: Rental housing only
The system SHALL include only housing offers explicitly identified as rentals in the eligible comparison set.

#### Scenario: Purchase offer
- **WHEN** an offer is identified as a property for sale
- **THEN** it is excluded from the eligible rental comparison set

#### Scenario: Unknown transaction type
- **WHEN** an offer has no established rental or sale classification
- **THEN** it is not presented as an eligible rental

### Requirement: Municipal scope
The system SHALL include only offers whose location is verified within Lugano municipality in the eligible comparison set. A Lugano area label alone SHALL NOT establish municipal eligibility.

#### Scenario: Inside the municipality
- **WHEN** a rental's location is verified within Lugano municipality
- **THEN** it is eligible for criteria comparison

#### Scenario: Outside the municipality
- **WHEN** a rental is located outside Lugano municipality
- **THEN** it is excluded even if advertised as being in the Lugano area

### Requirement: Uncertain location
The system SHALL distinguish offers with insufficient location evidence from verified eligible offers and identify their municipal eligibility as unknown wherever they are shown.

#### Scenario: Imprecise location
- **WHEN** a rental has insufficient information to establish municipal membership
- **THEN** it is marked as location unverified and is not included in the eligible comparison set
