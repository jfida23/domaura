import type { Criterion, Offer } from '../domain/model';
import { compare } from '../domain/comparison';
import { tierLabels } from '../domain/criteria';
import { criterionLabel, fitLabels } from './labels';

export function OfferComparison({ offer, criteria }: { offer: Offer; criteria: Criterion[] }) {
  const result = compare(offer, criteria);
  return <div className="comparison-results">
    <p className={`fit ${result.fit}`}>{fitLabels[result.fit]}</p>
    <p className="preference-counts">Preferences: {result.preferences.satisfied} satisfied · {result.preferences.unmet} unmet · {result.preferences.unknown} unknown</p>
    <table>
      <caption className="sr-only">Criteria outcomes for {offer.title}</caption>
      <thead><tr><th scope="col">Criterion / tier</th><th scope="col">Outcome / evidence</th></tr></thead>
      <tbody>{result.evaluations.map(evaluation => <tr key={evaluation.criterion.id}>
        <th scope="row">{criterionLabel(evaluation.criterion)}<small>{tierLabels[evaluation.criterion.tier]}</small></th>
        <td><span className={`outcome ${evaluation.outcome}`}>{evaluation.outcome}</span><p>{evaluation.explanation}</p></td>
      </tr>)}</tbody>
    </table>
  </div>;
}
