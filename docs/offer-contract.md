# Offers and evidence

Offers explicitly classify residential use with evidence. Parking, offices and
storage are non-residential; missing or unsupported residential declarations
remain unverified. Transaction and geographic eligibility remain separate checks.

Collected source records retain their opaque Livit ID, actual fetched locale URL,
parser version, original title/description, and observation times. Original-text
languages can be unknown and are independent of the page locale. Known values
can carry an evidence language. Official address verification retains the matched
address, record URL, EGID/feature ID, municipality identifier, data date, and
verification time. Source unavailability excludes a listing; failed checks retain
the previous evidence with its real age rather than asserting a new observation.

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

Official municipal evidence uses the GeoAdmin GWR layer and exact street, house
number and postcode matching. It records the feature ID, EGID, resource URL,
returned address, BFS municipality code/name, export date and lookup timestamp.
Code 5192 establishes Lugano; neighbouring codes establish outside scope. Fuzzy,
ambiguous and conflicting evidence remains unknown. Successful evidence expires
after seven days and an address change invalidates it; a Livit 304 cannot renew
it. Attribution: Swiss Federal Statistical Office / GWR, via GeoAdmin. This is
location verification, without inferring rent, unit attributes or availability.
