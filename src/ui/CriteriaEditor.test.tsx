import { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Criterion } from '../domain/model';
import { CriteriaEditor } from './CriteriaEditor';

afterEach(cleanup);
function Harness() {
  const [criteria, setCriteria] = useState<Criterion[]>([]);
  return <CriteriaEditor criteria={criteria} onChange={setCriteria} />;
}

describe('housing-criteria editor', () => {
  it('adds, edits, changes tier and removes criteria', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.selectOptions(screen.getByLabelText('Criterion'), 'rent');
    await user.type(screen.getByLabelText('Maximum amount (CHF / month)'), '1800');
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    let item = screen.getByRole('listitem');
    expect(item.textContent).toContain('Maximum monthly base rent ≤ 1800 CHF / month');
    expect((within(item).getByLabelText('Tier') as HTMLSelectElement).value).toBe('requirement');
    await user.click(within(item).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Maximum amount (CHF / month)'));
    await user.type(screen.getByLabelText('Maximum amount (CHF / month)'), '1600');
    await user.click(screen.getByRole('button', { name: 'Save criterion' }));
    item = screen.getByRole('listitem');
    expect(item.textContent).toContain('1600 CHF / month');
    await user.selectOptions(within(item).getByLabelText('Tier'), 'preference');
    expect((within(item).getByLabelText('Tier') as HTMLSelectElement).value).toBe('preference');
    expect(within(item).getAllByRole('option').map(o => o.textContent)).toEqual(['Must have', 'Nice to have']);
    await user.click(within(item).getByRole('button', { name: 'Remove' }));
    expect(screen.queryByRole('listitem')).toBeNull();
    await user.selectOptions(screen.getByLabelText('Criterion'), 'balcony');
    await user.selectOptions(screen.getByLabelText('New criterion tier'), 'preference');
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    expect(screen.getByRole('listitem').textContent).toContain('Balcony present');
  });
  it('rejects incomplete and invalid input, preserves it, then accepts correction', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    expect(screen.getByRole('alert').textContent).toContain('Choose a criterion');
    await user.selectOptions(screen.getByLabelText('Criterion'), 'rent');
    for (const amount of ['', '-4', 'oops']) {
      const input = screen.getByLabelText('Maximum amount (CHF / month)') as HTMLInputElement;
      await user.clear(input);
      if (amount) await user.type(input, amount);
      await user.click(screen.getByRole('button', { name: 'Add criterion' }));
      expect(screen.getByRole('alert').textContent).toMatch(/non-negative/);
      expect(input.value).toBe(amount);
      expect(screen.queryByRole('listitem')).toBeNull();
    }
    await user.clear(screen.getByLabelText('Maximum amount (CHF / month)'));
    await user.type(screen.getByLabelText('Maximum amount (CHF / month)'), '0');
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('listitem').textContent).toContain('0 CHF / month');
  });
});
