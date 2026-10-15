import test from 'node:test';
import assert from 'node:assert/strict';
import { createDiagnostics, scrubDiagnostic, DIAGNOSTICS_KEY } from '../src/diagnostics.mjs';
import { launchAction } from '../src/links.mjs';

test('diagnostics require both project configuration and explicit local consent', async () => {
  const values = new Map(); const calls = [];
  const options = { configured: true, storage: { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) },
    sdk: { start: async () => calls.push('start'), stop: async () => calls.push('stop'), check: () => calls.push('check') } };
  const reports = createDiagnostics(options);
  await reports.initialize(); assert.deepEqual(calls, []);
  assert.throws(() => reports.check());
  await reports.set(true); assert.equal(reports.enabled(), true); reports.check();
  await reports.set(false); assert.equal(reports.enabled(), false);
  assert.deepEqual(calls, ['start', 'check', 'stop']);
  values.set(DIAGNOSTICS_KEY, 'on');
  const unconfigured = createDiagnostics({ ...options, configured: false });
  await unconfigured.initialize(); assert.equal(unconfigured.enabled(), false);
  await assert.rejects(unconfigured.set(true));
});
test('failed diagnostics initialization returns to off; queued disable waits for initialization', async () => {
  const values = new Map();
  const storage = { getItem: (k) => values.get(k), setItem: (k, v) => values.set(k, v) };
  const failing = createDiagnostics({ configured: true, storage, sdk: { start: async () => { throw new Error('failed'); } } });
  await assert.rejects(failing.set(true));
  assert.equal(values.get(DIAGNOSTICS_KEY), 'off'); assert.equal(failing.enabled(), false);
  const calls = [];
  const reports = createDiagnostics({ configured: true, storage, sdk: { start: async () => calls.push('start'), stop: async () => calls.push('stop') } });
  await Promise.all([reports.set(true), reports.set(false)]);
  assert.equal(reports.enabled(), false); assert.deepEqual(calls, ['start', 'stop']);
});
test('JavaScript diagnostics discard arbitrary messages, user data, requests, breadcrumbs, context and URL parameters', () => {
  const source = { user: { name: 'Private name' }, message: 'Private wellness entry', request: { url: 'https://private' },
    breadcrumbs: [{ message: 'Private conversation' }], extra: { wellness: 'private' }, contexts: { private: 'private' },
    exception: { values: [{ type: 'Private message', value: 'Private content', stacktrace: { frames: [{ filename: 'https://localhost/assets/js/app.js?private=yes', lineno: 4, vars: { private: true } }] } }] } };
  const result = scrubDiagnostic(source);
  const json = JSON.stringify(result);
  assert(!/Private|private|wellness|conversation|localhost|vars/.test(json));
  assert.equal(result.exception.values[0].stacktrace.frames[0].filename, 'app.js');
  assert.equal(scrubDiagnostic({ type: 'transaction' }), null);
});
test('universal link routing accepts only known actions on the owned HTTPS domain', () => {
  assert.equal(launchAction('https://connect.zuporta.com/open/breathe'), 'breathe');
  assert.equal(launchAction('https://connect.zuporta.com/open/check-in'), 'check-in');
  assert.equal(launchAction('https://connect.zuporta.com/open/coaches'), 'coaches');
  for (const value of ['https://zuporta.com/open/breathe', 'http://connect.zuporta.com/open/breathe', 'https://evil.invalid/open/breathe', 'https://connect.zuporta.com/open/unknown', 'not-a-url']) assert.equal(launchAction(value), null);
});
