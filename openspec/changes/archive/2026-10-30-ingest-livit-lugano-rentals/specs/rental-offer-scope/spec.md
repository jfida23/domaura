# rental-offer-scope Delta

## MODIFIED Requirements

### Requirement: Rental housing only
The system SHALL include only offers explicitly classified as both residential housing and rentals in the eligible comparison set. Missing residential classification SHALL remain unverified; known non-residential property SHALL be excluded even when its transaction type is rental.

#### Scenario: Purchase offer
- **WHEN** an offer is identified as a property for sale
- **THEN** it is excluded from the eligible rental comparison set

#### Scenario: Unknown transaction type
- **WHEN** an offer has no established rental or sale classification
- **THEN** it is not presented as an eligible rental

#### Scenario: Non-residential rental
- **WHEN** an offer advertises parking, an office, storage, or another established non-residential property
- **THEN** it is excluded even if it is a rental located within Lugano municipality

#### Scenario: Uncertain residential classification
- **WHEN** an offer's rental transaction is established but its residential use is not
- **THEN** it is identified as classification unverified and does not enter eligible comparison

#### Scenario: Classified residential rental
- **WHEN** an offer is explicitly classified as residential housing and a rental, its location is verified inside Lugano municipality, and it is not source-unavailable
- **THEN** it is eligible for criteria comparison even if optional rent or balcony information is unknown

## ADDED Requirements

### Requirement: Real listing availability context
The system SHALL exclude real listings established as source-unavailable from eligible comparison. It SHALL preserve the distinction between successful source observation and actual property availability, and SHALL retain freshness context when previous observations are shown after a failed refresh. Source removal SHALL NOT be presented as proof that a property was let.

#### Scenario: Withdrawn source listing
- **WHEN** bounded locale selection establishes source unavailability without a successful permitted fallback, or explicit listing-wide withdrawal is observed, and that outcome is included in a successful dataset publication
- **THEN** the listing is excluded from eligible comparison and its reason is source-unavailable rather than rented

#### Scenario: Previous observation after refresh failure
- **WHEN** a previously eligible real listing is retained because a refresh failed
- **THEN** it can remain available for comparison with its previous evidence and a visible stale or failed-refresh indication, without claiming newly verified availability
