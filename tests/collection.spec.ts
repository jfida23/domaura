import { expect, test } from '@playwright/test';
import { exampleDataset } from '../src/ingestion/test-support';
test('collected data loading never substitutes examples', async ({ page }) => {
  let release!: () => void; const waiting = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/data/livit-lugano.json', async route => { await waiting; await route.fulfill({ json: exampleDataset([]) }); });
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/');
  await expect(page.getByText('Loading collected listings…', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0); release();
  await expect(page.getByText('No eligible collected offers are available.', { exact: true })).toBeVisible();
});
test('successful empty collection is distinct from missing or invalid data', async ({ page }) => {
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: exampleDataset([]) }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/');
  await expect(page.getByText('No eligible collected offers are available.', { exact: true })).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});
for (const kind of ['missing', 'invalid']) test(`collected data ${kind} does not become demo results`, async ({ page }) => {
  await page.route('**/data/livit-lugano.json', route => kind === 'missing' ? route.fulfill({ status: 404 }) : route.fulfill({ json: { offers: [] } }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/');
  await expect(page.getByText(/Collected data is unavailable/)).toBeVisible();
  await expect(page.getByRole('article')).toHaveCount(0);
});
function currentDataset() {
  const data = exampleDataset(); const now = new Date().toISOString(); data.generatedAt = now;
  const source = data.offers[0].source!;
  source.firstObservedAt = source.lastCheckedAt = source.lastAttemptAt = source.contentChangedAt = now;
  data.offers[0].geography.verification!.verifiedAt = now;
  return data;
}
test('original source languages and provenance stay visible in the English comparison', async ({ page }) => {
  const data = currentDataset(); const offer = data.offers[0];
  offer.source!.pageLocale = 'de'; offer.source!.url = offer.source!.url.replace('/it/locatario/obietto/', '/de/mieten/objekt/'); offer.sourceReference = offer.source!.url; offer.source!.title.language = null;
  const external: string[] = []; page.on('request', request => { if (/livit\.ch|geo\.admin\.ch|translat/i.test(request.url())) external.push(request.url()); });
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: data }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'View on Livit' })).toHaveAttribute('href', offer.source!.url);
  await expect(page.getByText('Page locale: German', { exact: true })).toBeVisible();
  await expect(page.getByText('Title language: undetermined', { exact: true })).toBeVisible();
  await page.getByText('Original description', { exact: true }).click();
  await expect(page.getByText('Description language: Italian', { exact: true })).toBeVisible();
  await expect(page.getByText(offer.source!.description.text, { exact: true })).toHaveAttribute('lang', 'it');
  await expect(page.getByText(/Availability and advertised features are not independently verified/)).toBeVisible();
  await page.getByRole('combobox', { name: 'Criterion', exact: true }).selectOption('rent'); await page.getByLabel('Maximum amount (CHF / month)').fill('1800'); await page.getByRole('button', { name: 'Add criterion' }).click();
  await expect(page.getByText('Meets all requirements', { exact: true })).toBeVisible(); expect(external).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('failed refresh retains previous data and stale check timestamps', async ({ page }) => {
  const data = currentDataset(); const checkedAt = new Date(Date.now() - 25 * 60 * 60_000).toISOString();
  data.offers[0].source!.lastCheckedAt = checkedAt; data.offers[0].source!.firstObservedAt = checkedAt; data.offers[0].source!.contentChangedAt = checkedAt;
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: data }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ json: { datasetId: data.id, attemptedAt: new Date().toISOString(), state: 'failed', message: 'Service outage' } }));
  await page.goto('/');
  await expect(page.getByText(/Last refresh failed/)).toBeVisible();
  await expect(page.getByText(/Stale observation/)).toBeVisible();
  await expect(page.locator('time').first()).toHaveAttribute('datetime', checkedAt);
  await expect(page.getByRole('heading', { name: data.offers[0].title })).toBeVisible();
});
test('demo selection is explicit and both mode switches preserve active criteria', async ({ page }) => {
  const data = currentDataset();
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: data }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/'); await expect(page.getByRole('article')).toHaveCount(1);
  await page.getByRole('combobox', { name: 'Criterion', exact: true }).selectOption('rent'); await page.getByLabel('Maximum amount (CHF / month)').fill('1800'); await page.getByRole('button', { name: 'Add criterion' }).click();
  await page.getByRole('button', { name: 'Demo examples', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Garden apartment' })).toBeVisible();
  await expect(page.getByRole('heading', { name: data.offers[0].title })).toHaveCount(0);
  await expect(page.getByText(/Every offer is invented/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'Your criteria' }).getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: 'Collected listings', exact: true }).click();
  await expect(page.getByRole('heading', { name: data.offers[0].title })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Garden apartment' })).toHaveCount(0);
  await expect(page.getByText('Meets all requirements', { exact: true })).toBeVisible();
});
test('long original text and unknown criteria remain usable without horizontal overflow', async ({ page }) => {
  const data = currentDataset(); const offer = data.offers[0];
  offer.title = 'Appartamento ' + 'a'.repeat(160); offer.source!.title.text = offer.title;
  offer.source!.description = { text: 'Residence ' + 'b'.repeat(160), language: null };
  offer.rent = { status: 'unknown', reason: 'Exact monthly net rent not supplied.' }; offer.balcony = { status: 'unknown', reason: 'Grouped outdoor feature only.' };
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: data }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ status: 404 }));
  await page.goto('/'); await page.getByText('Original description', { exact: true }).click();
  await expect(page.getByText('Description language: undetermined', { exact: true })).toBeVisible();
  await page.getByRole('combobox', { name: 'Criterion', exact: true }).selectOption('rent'); await page.getByLabel('Maximum amount (CHF / month)').fill('1800'); await page.getByRole('button', { name: 'Add criterion' }).click();
  await expect(page.getByText('Needs verification', { exact: true })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Exact monthly net rent not supplied.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
test('age alone is stale and an old failure status cannot taint a newer dataset', async ({ page }) => {
  const data = currentDataset(); const checkedAt = new Date(Date.now() - 25 * 60 * 60_000).toISOString(); data.offers[0].source!.lastCheckedAt = checkedAt; data.offers[0].source!.firstObservedAt = checkedAt; data.offers[0].source!.contentChangedAt = checkedAt;
  await page.route('**/data/livit-lugano.json', route => route.fulfill({ json: data }));
  await page.route('**/data/collection-status.json', route => route.fulfill({ json: { datasetId: 'older-dataset', attemptedAt: new Date().toISOString(), state: 'failed', message: 'Old failure' } }));
  const statusLoaded = page.waitForResponse('**/data/collection-status.json'); await page.goto('/'); await statusLoaded;
  await expect(page.getByText(/last checked more than 24 hours ago/)).toBeVisible(); await expect(page.getByText(/Last refresh failed/)).toHaveCount(0);
});
