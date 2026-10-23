import { useState } from 'react';
import type { Criterion } from '../domain/model';
import { catalogue, tierLabels, validateCriterion, type CriterionDraft } from '../domain/criteria';
import { criterionLabel } from './labels';

const emptyDraft: CriterionDraft = { attribute: '', tier: 'requirement', amount: '' };

export function CriteriaEditor({ criteria, onChange }: { criteria: Criterion[]; onChange: (criteria: Criterion[]) => void }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  function reset() {
    setDraft(emptyDraft);
    setEditingId(null);
    setError('');
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const result = validateCriterion(draft, editingId ?? crypto.randomUUID());
    if (!result.ok) { setError(result.error); return; }
    onChange(editingId ? criteria.map(c => c.id === editingId ? result.criterion : c) : [...criteria, result.criterion]);
    reset();
  }

  function edit(criterion: Criterion) {
    setEditingId(criterion.id);
    setDraft({ attribute: criterion.attribute, tier: criterion.tier, amount: criterion.attribute === 'rent' ? String(criterion.value) : '' });
    setError('');
  }

  return <section aria-label="Your criteria" className="criteria-panel">
    <div className="section-heading"><h2>Your criteria</h2><span>{criteria.length} active</span></div>
    <p>Must have sets your requirements. Nice to have counts every preference equally.</p>
    <form onSubmit={submit} noValidate>
      <label>Criterion<select value={draft.attribute} onChange={e => setDraft({ ...draft, attribute: e.target.value })}>
        <option value="">Choose a criterion</option>
        {catalogue.map(c => <option key={c.attribute} value={c.attribute}>{c.label}</option>)}
      </select></label>
      {draft.attribute === 'rent' && <label>Maximum amount (CHF / month)<input inputMode="decimal" value={draft.amount} aria-invalid={Boolean(error)} aria-describedby={error ? 'criterion-error' : 'rent-help'} onChange={e => setDraft({ ...draft, amount: e.target.value })} /></label>}
      <label>New criterion tier<select value={draft.tier} onChange={e => setDraft({ ...draft, tier: e.target.value })}>
        {Object.entries(tierLabels).map(([tier, label]) => <option key={tier} value={tier}>{label}</option>)}
      </select></label>
      <button type="submit">{editingId ? 'Save criterion' : 'Add criterion'}</button>
      {editingId && <button type="button" className="secondary" onClick={reset}>Cancel edit</button>}
    </form>
    <p id="rent-help" className="muted">Base rent excludes additional charges. It is not total housing cost.</p>
    {error && <p role="alert" id="criterion-error">{error}</p>}
    <ul className="criteria-list">{criteria.map(criterion => <li key={criterion.id}>
      <strong>{criterionLabel(criterion)}</strong>
      <div className="criterion-actions"><label>Tier<select value={criterion.tier} onChange={e => onChange(criteria.map(c => c.id === criterion.id ? { ...c, tier: e.target.value as Criterion['tier'] } : c))}>
        {Object.entries(tierLabels).map(([tier, label]) => <option key={tier} value={tier}>{label}</option>)}
      </select></label>
      <button className="secondary" type="button" onClick={() => edit(criterion)}>Edit</button>
      <button className="secondary" type="button" onClick={() => { onChange(criteria.filter(c => c.id !== criterion.id)); if (editingId === criterion.id) reset(); }}>Remove</button></div>
    </li>)}</ul>
  </section>;
}
