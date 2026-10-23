import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { App } from './App';
import userEvent from '@testing-library/user-event';

afterEach(cleanup);

describe('rental-offer-scope presentation', () => {
  it('separates eligible synthetic rentals, unverified location and excluded offers', () => {
    render(<App />);
    const eligible = screen.getByRole('region', { name: 'Eligible comparison' });
    expect(within(eligible).getAllByRole('article')).toHaveLength(3);
    expect(within(eligible).getByRole('heading', { name: 'Garden apartment' })).toBeTruthy();
    expect(within(eligible).queryByText('Lugano area apartment')).toBeNull();
    const unverified = screen.getByRole('region', { name: 'Location unverified' });
    expect(within(unverified).getByText('Lugano area apartment')).toBeTruthy();
    expect(unverified.textContent).toContain('municipal membership is unknown');
    expect(within(screen.getByRole('region', { name: 'Excluded offers' })).getAllByRole('article')).toHaveLength(3);
    for (const article of screen.getAllByRole('article')) expect(article.textContent).toContain('Synthetic example');
    expect(eligible.textContent).toContain('no real address verified');
  });
  it('asks for criteria before showing fit results', () => {
    render(<App />);
    expect(screen.getByText(/define requirements or preferences before/i)).toBeTruthy();
    expect(screen.queryByText('Meets all requirements')).toBeNull();
  });
  it('explains when no verified in-scope rentals are available', () => {
    render(<App offers={[]} />);
    expect(screen.getByText(/no eligible offers are available for comparison/i)).toBeTruthy();
  });
});

describe('fixture-backed acceptance journey', () => {
  it('recomputes shared outcomes after adding, editing, changing tier and removing criteria', async () => {
    const user = userEvent.setup();
    render(<App />);
    const eligible = screen.getByRole('region', { name: 'Eligible comparison' });
    const [garden, courtyard, hillside] = within(eligible).getAllByRole('article');
    await user.selectOptions(screen.getByLabelText('Criterion'), 'rent');
    await user.type(screen.getByLabelText('Maximum amount (CHF / month)'), '1800');
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    expect(within(garden).getByText('Meets all requirements')).toBeTruthy();
    expect(within(courtyard).getByText('Meets all requirements')).toBeTruthy();
    expect(within(hillside).getByText('Needs verification')).toBeTruthy();
    expect(garden.textContent).toContain('1800 CHF / month (base-rent)');
    expect(hillside.textContent).toContain('Monthly base rent not supplied');
    await user.selectOptions(screen.getByLabelText('Criterion'), 'balcony');
    await user.selectOptions(screen.getByLabelText('New criterion tier'), 'preference');
    await user.click(screen.getByRole('button', { name: 'Add criterion' }));
    expect(garden.textContent).toContain('Preferences: 1 satisfied · 0 unmet · 0 unknown');
    expect(courtyard.textContent).toContain('Preferences: 0 satisfied · 1 unmet · 0 unknown');
    expect(hillside.textContent).toContain('Preferences: 0 satisfied · 0 unmet · 1 unknown');
    expect(courtyard.textContent).toContain('Balcony absent');
    expect(hillside.textContent).toContain('Balcony presence not supplied');
    for (const article of [garden, courtyard, hillside]) {
      expect(within(article).getByRole('table').textContent).toContain('Maximum monthly base rent ≤ 1800 CHF / month');
      expect(within(article).getByRole('table').textContent).toContain('Balcony present');
      expect(article.textContent).toContain('Nice to have');
    }
    const editor = screen.getByRole('region', { name: 'Your criteria' });
    const [rentItem, balconyItem] = within(editor).getAllByRole('listitem');
    await user.click(within(rentItem).getByRole('button', { name: 'Edit' }));
    await user.clear(screen.getByLabelText('Maximum amount (CHF / month)'));
    await user.type(screen.getByLabelText('Maximum amount (CHF / month)'), '1500');
    await user.click(screen.getByRole('button', { name: 'Save criterion' }));
    expect(within(garden).getByText('Does not meet all requirements')).toBeTruthy();
    expect(within(courtyard).getByText('Meets all requirements')).toBeTruthy();
    await user.selectOptions(within(balconyItem).getByLabelText('Tier'), 'requirement');
    expect(within(courtyard).getByText('Does not meet all requirements')).toBeTruthy();
    expect(courtyard.textContent).toContain('Preferences: 0 satisfied · 0 unmet · 0 unknown');
    await user.click(within(rentItem).getByRole('button', { name: 'Remove' }));
    expect(within(garden).getByText('Meets all requirements')).toBeTruthy();
    expect(within(courtyard).getByText('Does not meet all requirements')).toBeTruthy();
    expect(within(hillside).getByText('Needs verification')).toBeTruthy();
    await user.selectOptions(within(balconyItem).getByLabelText('Tier'), 'preference');
    expect(within(courtyard).getByText('No requirements specified')).toBeTruthy();
    expect(courtyard.textContent).toContain('Preferences: 0 satisfied · 1 unmet · 0 unknown');
    await user.click(within(balconyItem).getByRole('button', { name: 'Remove' }));
    expect(screen.getByText(/define requirements or preferences before/i)).toBeTruthy();
    expect(within(eligible).queryByRole('table')).toBeNull();
  });
});
