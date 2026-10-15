import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coachProfileUrl, COACHES_URL, fetchPros, cachedPros, toPro } from '../connect.zuporta.com/assets/js/zuporta-api.js';

const id = '01ARZ3NDEKTSV4RRFFQ69G5FAV';
const coach = (changes = {}) => ({ id, name: 'Synthetic Coach', specialities: ['Stress'], online: true, ...changes });
const memory = new Map();
globalThis.localStorage = { getItem: (key) => memory.get(key) ?? null, setItem: (key, value) => memory.set(key, value) };

test('profile links use platform ULIDs; invalid cached IDs cannot become external or relative destinations', () => {
  assert.equal(coachProfileUrl(id), `${COACHES_URL}/${id}`);
  for (const invalid of [null, undefined, 42, '', '..', '../login', 'https://evil.invalid', 'a/b', '<script>']) {
    assert.equal(coachProfileUrl(invalid), COACHES_URL);
  }
});
test('coach mapping preserves provided facts without inventing credentials or availability for busy coaches', () => {
  const pro = toPro(coach({ is_busy: true, price_15_min: 25, average_rating: 0 }));
  assert.equal(pro.title, 'Coach');
  assert.equal(pro.availability, 'today');
  assert.equal(pro.slot, 'Currently busy');
  assert.equal(pro.price, '$25');
  assert.equal(pro.rating, null);
  assert.equal(pro.photo, null);
});
test('directory pagination deduplicates coaches, excludes inactive/restricted entries and keeps last good data on failure', async () => {
  memory.clear();
  let calls = 0;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: {
    items: ++calls === 1 ? [coach(), coach({ id: 'inactive', is_active: false }), coach({ id: 'restricted', is_restricted: true })]
      : [coach(), coach({ id: 'second-coach', online: false })], has_more_pages: calls < 2,
  } }) });
  const pros = await fetchPros({ force: true });
  assert.equal(calls, 2);
  assert.equal(pros.length, 2);
  assert.equal(pros[0].id, id);
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.deepEqual(await fetchPros({ force: true }), pros);
});
test('fresh cached directory avoids network; malformed/empty responses never fabricate coaches', async () => {
  globalThis.fetch = async () => assert.fail('fresh cache must avoid a network call');
  assert.equal((await fetchPros()).length, 2);
  memory.clear();
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: { items: [], has_more_pages: false } }) });
  assert.equal(await fetchPros({ force: true }), null);
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ unexpected: [] }) });
  assert.equal(await fetchPros({ force: true }), null);
});

test('stale offline profiles do not claim that a coach is still online', () => {
  memory.clear();
  memory.set('zuporta.coaches.cache', JSON.stringify({ at: Date.now() - 120000, pros: [{ id, availability: 'now', slot: 'Available now' }] }));
  assert.equal(cachedPros()[0].availability, 'schedule');
  assert.equal(cachedPros()[0].slot, 'Check availability on Zuporta');
});

test('the directory follows a third page instead of silently stopping after two', async () => {
  memory.clear(); let page = 0;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ data: {
    items: [coach({ id: 'page-' + (++page) })], has_more_pages: page < 3,
  } }) });
  assert.equal((await fetchPros({ force: true })).length, 3);
  assert.equal(page, 3);
});
