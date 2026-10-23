# Offers and evidence

`src/domain/model.ts` separates transaction classification, geographic evidence,
typed housing attributes, criteria, and evaluation results. Unknown knowledge
carries a reason; known knowledge carries a value and evidence. `false` means a
confirmed absence, not missing data. Offer IDs are stable and source references
are nullable. Criteria have exactly one tier and a typed condition. Evaluations
carry the criterion, outcome, and explanation; summaries keep requirements and
preference counts separate.

Every record in `src/domain/fixtures.ts` is invented and has `synthetic: true`.
The UI labels each record Synthetic example. The examples cover three eligible
rentals (including unknown attributes), a sale, an outside-municipality rental,
an unclassified offer, and a rental with an imprecise location. Fixture inside
and outside states are declarations for testing, never proof about real places.

Only explicit rentals with inside status, sufficient evidence, and an accepted
evidence basis enter comparison. Area labels and absent evidence cannot establish
eligibility. Unverified locations appear separately. A future real-data adapter
must normalize provider fields into this contract, preserve source references,
document source access and freshness, and establish municipal membership through
a reliable municipality identifier or coordinates checked against an authoritative
boundary. It must document identifier mapping or boundary version, provenance,
and how uncertainty is retained. A provider marketing label alone is insufficient.
Synthetic declarations must never be used to verify a real location. Selecting
and implementing that adapter requires a subsequent scoped change.
