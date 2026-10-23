# Proposal

## Why

People choosing a rental home need to compare offers against their own needs, rather than price alone. Domaura needs an initial product contract focused on rentals in Lugano municipality before selecting data sources and an implementation stack.

## What Changes

- Limit the initial offer set to rental housing verified within Lugano municipality.
- Let users define housing criteria in two tiers: Requirements (Must have) and Preferences (Nice to have), without preference weights.
- Compare offers against each criterion and explain satisfied, unmet, and unknown results.
- Preserve uncertainty instead of treating missing listing information as a confirmed match or failure.
- Establish the initial behavior and implementation plan; data sourcing and technology selection remain open decisions.

## Capabilities

### New Capabilities

- `rental-offer-scope`: Rental-only offer eligibility within Lugano municipality and explicit handling of uncertain location.
- `housing-criteria`: User-defined requirements and equally treated preferences.
- `rental-comparison`: Per-offer criterion evaluation and understandable comparison results.

### Modified Capabilities

None; the project has no existing capability specs.

## Impact

The repository currently contains setup and documentation only. Future implementation will introduce an application, an offer data model, criteria entry, geographic eligibility checks, and a comparison interface. No existing API or behavior is changed. Data access, municipal boundary evidence, hosting, and framework dependencies must be resolved before the affected implementation work proceeds.

Property purchases, surrounding municipalities, weighted preferences, market valuations, accounts, alerts, and automated listing collection are outside this change's initial scope.
