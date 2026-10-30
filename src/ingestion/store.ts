import type { Geography, Offer } from '../domain/model';
import type { CachedPage, Candidate, RunRecord } from './types';
import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { geographyTtlMs } from './geography-cache';
import { validateManifest } from './livit/candidates';
export class Store {
  private readonly db: DatabaseSync;
  private closed = false;
  constructor(path: string) {
    mkdirSync(dirname(path), { recursive: true }); this.db = new DatabaseSync(path);
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS records (kind TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, touched INTEGER NOT NULL, PRIMARY KEY(kind,key));
      CREATE TABLE IF NOT EXISTS snapshots (seq INTEGER PRIMARY KEY, id TEXT NOT NULL, url TEXT NOT NULL, value TEXT NOT NULL, created INTEGER NOT NULL);
      CREATE TABLE IF NOT EXISTS runs (seq INTEGER PRIMARY KEY, id TEXT UNIQUE NOT NULL, value TEXT NOT NULL);
    `);
  }
  close() { if (!this.closed) { this.db.close(); this.closed = true; } }
  private read<T>(kind: string, key: string): T | undefined {
    const row = this.db.prepare('SELECT value FROM records WHERE kind=? AND key=?').get(kind, key);
    return row ? JSON.parse(String(row.value)) as T : undefined;
  }
  private write(kind: string, key: string, value: unknown, at: string) {
    this.db.prepare('INSERT OR REPLACE INTO records(kind,key,value,touched) VALUES(?,?,?,?)').run(kind, key, JSON.stringify(value), Date.parse(at));
  }
  candidates(items: Candidate[]) {
    const validated = validateManifest(items.flatMap(item => item.urls.map(url => ({ url, discoveryEvidence: item.discoveryEvidence }))));
    this.db.exec('BEGIN');
    try {
      this.db.exec("DELETE FROM records WHERE kind='candidate'");
      for (const item of validated) this.write('candidate', item.id, item, new Date().toISOString());
      this.db.exec("DELETE FROM snapshots WHERE id NOT IN (SELECT key FROM records WHERE kind='candidate'); DELETE FROM records WHERE kind='observation' AND key NOT IN (SELECT key FROM records WHERE kind='candidate'); COMMIT");
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
  page(url: string, at: string): CachedPage | undefined {
    const row = this.db.prepare('SELECT value FROM snapshots WHERE url=? AND created>=? ORDER BY seq DESC LIMIT 1').get(url, Date.parse(at) - geographyTtlMs);
    return row ? JSON.parse(String(row.value)) as CachedPage : undefined;
  }
  savePage(id: string, page: CachedPage) {
    const row = this.db.prepare('SELECT seq,value FROM snapshots WHERE url=? ORDER BY seq DESC LIMIT 1').get(page.url);
    if (row && (JSON.parse(String(row.value)) as CachedPage).body === page.body) this.db.prepare('UPDATE snapshots SET value=? WHERE seq=?').run(JSON.stringify(page), row.seq);
    else this.db.prepare('INSERT INTO snapshots(id,url,value,created) VALUES(?,?,?,?)').run(id, page.url, JSON.stringify(page), Date.parse(page.checkedAt));
    this.db.prepare('DELETE FROM snapshots WHERE id=? AND seq NOT IN (SELECT seq FROM snapshots WHERE id=? ORDER BY seq DESC LIMIT 2)').run(id, id);
  }
  geography(key: string): Geography | undefined { return this.read('geography', key); }
  saveGeography(key: string, value: Geography, at: string) { this.write('geography', key, value, at); }
  observation(id: string): Offer | undefined { return this.read('observation', id); }
  observe(id: string, offer: Offer | undefined, outcome: 'present' | 'unavailable' | 'check-failed', at: string) {
    const previous = this.observation(id); const current = offer ?? previous;
    if (!current?.source) return;
    this.write('observation', id, { ...current, source: { ...current.source, firstObservedAt: previous?.source?.firstObservedAt ?? current.source.firstObservedAt, lastAttemptAt: at, observation: outcome } }, at);
  }
  saveRun(run: RunRecord) {
    this.db.prepare('INSERT OR REPLACE INTO runs(id,value) VALUES(?,?)').run(run.id, JSON.stringify(run));
    this.db.exec('DELETE FROM runs WHERE seq NOT IN (SELECT seq FROM runs ORDER BY seq DESC LIMIT 2)');
  }
  runs(): RunRecord[] { return this.db.prepare('SELECT value FROM runs ORDER BY seq DESC').all().map(row => JSON.parse(String(row.value)) as RunRecord); }
  prune(at: string) {
    const cutoff = Date.parse(at) - geographyTtlMs;
    this.db.prepare('DELETE FROM snapshots WHERE created<?').run(cutoff);
    this.db.prepare("DELETE FROM records WHERE kind='geography' AND touched<?").run(cutoff);
    for (const kind of ['geography', 'observation']) this.db.prepare('DELETE FROM records WHERE kind=? AND key NOT IN (SELECT key FROM records WHERE kind=? ORDER BY touched DESC LIMIT 40)').run(kind, kind);
  }
}
