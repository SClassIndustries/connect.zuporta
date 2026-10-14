import test from 'node:test';
import assert from 'node:assert/strict';
import { createReminders, REMINDER_ID, REMINDER_KEY } from '../src/reminders.mjs';
import { createNativeFeatures, exerciseShare, externalURL } from '../src/native.mjs';
import { readFile } from 'node:fs/promises';

function fixture(platform = 'android') {
  const values = new Map();
  const calls = [];
  const listeners = {};
  const f = { platform, permission: 'granted', requests: 0,
    storage: { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) }, values, calls,
    app: { addListener: async (event, callback) => { listeners[event] = callback; }, minimizeApp: async () => { calls.push('minimize'); } },
    notifications: { checkPermissions: async () => ({ display: f.permission }),
      requestPermissions: async () => { f.requests++; return { display: f.permission = f.requestResult || 'granted' }; },
      cancel: async (value) => { calls.push(['cancel', value]); },
      createChannel: async (value) => { calls.push(['channel', value]); },
      schedule: async (value) => { calls.push(['schedule', value]); if (f.failSchedule) throw new Error('schedule failed'); },
      addListener: async (event, callback) => { listeners[event] = callback; } },
    haptics: { impact: async (value) => { calls.push(['impact', value]); } },
    share: { share: async (value) => { calls.push(['share', value]); } },
    browser: { open: async (value) => { calls.push(['open', value]); } },
    bars: { setStyle: async (value) => { calls.push(['style', value]); } },
    web: { origin: 'https://localhost', clipboard: { writeText: async (value) => { calls.push(['copy', value]); } } },
    listeners,
  };
  return f;
}

test('reminders start off; launch never prompts or schedules for a fresh install', async () => {
  const f = fixture(); f.permission = 'prompt';
  const reminders = createReminders(f);
  assert.deepEqual(reminders.get(), { enabled: false, time: '19:00' });
  await reminders.reconcile();
  assert.equal(f.requests, 0);
  assert.equal(f.calls.filter(([method]) => method === 'schedule').length, 0);
});

test('enable requests consent, uses a stable daily local-time calendar and generic text', async () => {
  const f = fixture(); f.permission = 'prompt-with-rationale';
  const reminders = createReminders(f);
  await reminders.set(true, '08:35');
  assert.equal(f.requests, 1);
  const [{ notifications: [notification] }] = f.calls.filter(([method]) => method === 'schedule').map(([, value]) => value);
  assert.equal(notification.id, REMINDER_ID);
  assert.deepEqual(notification.schedule, { on: { hour: 8, minute: 35, second: 0 }, repeats: true, allowWhileIdle: false });
  assert.equal(notification.isExactNotification, false);
  assert.equal(notification.extra, undefined);
  assert.equal(notification.body, 'Take a moment for yourself. Open Zuporta+ when you are ready.');
  assert.deepEqual(JSON.parse(f.values.get(REMINDER_KEY)), { enabled: true, time: '08:35' });
});

test('denied permission never schedules or records enabled; invalid time never requests permission', async () => {
  const f = fixture(); f.permission = 'prompt'; f.requestResult = 'denied';
  const reminders = createReminders(f);
  await assert.rejects(reminders.set(true, '24:00'), /valid reminder time/);
  assert.equal(f.requests, 0);
  await assert.rejects(reminders.set(true, '10:00'), /Notifications are off/);
  assert.equal(reminders.get().enabled, false);
  assert.equal(f.calls.filter(([method]) => method === 'schedule').length, 0);
});

test('edits replace one reminder, resume restores it without prompting, off cancels it', async () => {
  const f = fixture(); const reminders = createReminders(f);
  await reminders.set(true, '09:20');
  await reminders.set(true, '21:10');
  await reminders.reconcile();
  await reminders.set(false, '21:10');
  assert.equal(f.requests, 0);
  assert.deepEqual(f.calls.filter(([method]) => method === 'schedule').map(([, v]) => v.notifications[0].schedule.on),
    [{ hour: 9, minute: 20, second: 0 }, { hour: 21, minute: 10, second: 0 }, { hour: 21, minute: 10, second: 0 }]);
  assert.deepEqual(f.calls.filter(([method]) => method === 'cancel').map(([, v]) => v),
    Array(4).fill({ notifications: [{ id: REMINDER_ID }] }));
  assert.equal(reminders.get().enabled, false);
});

test('scheduling failure leaves off and can be retried; queued off wins over enable', async () => {
  const f = fixture(); f.failSchedule = true;
  const reminders = createReminders(f);
  await assert.rejects(reminders.set(true, '10:00'), /schedule failed/);
  assert.equal(reminders.get().enabled, false);
  f.failSchedule = false;
  await Promise.all([reminders.set(true, '11:00'), reminders.set(false, '11:00')]);
  assert.equal(reminders.get().enabled, false);
});

test('OS permission revocation cancels pending reminder on resume without re-prompting', async () => {
  const f = fixture(); const reminders = createReminders(f);
  await reminders.set(true, '08:00');
  f.permission = 'denied';
  await assert.rejects(reminders.reconcile(), /Notifications are off/);
  assert.deepEqual(reminders.get(), { enabled: false, time: '08:00' });
  assert.equal(f.requests, 0);
});

test('corrupt settings fail closed; unavailable storage prevents creating an unmanageable reminder', async () => {
  const f = fixture(); f.values.set(REMINDER_KEY, '{oops');
  const reminders = createReminders(f);
  f.storage.setItem = () => { throw new Error('storage denied'); };
  await assert.rejects(reminders.set(true, '08:00'), /storage denied/);
  assert.equal(reminders.get().enabled, false);
  assert.equal(f.calls.filter(([method]) => method === 'schedule').length, 0);
});

test('native haptics honor preference; absent hardware failures never reject the exercise', async () => {
  const f = fixture(); const device = createNativeFeatures(f);
  await device.breatheStep(); device.setHaptics(false); await device.breatheStep();
  assert.deepEqual(f.calls, [['impact', { style: 'LIGHT' }]]);
  device.setHaptics(true); f.haptics.impact = async () => { throw new Error('no hardware'); };
  await device.breatheStep();
  const web = fixture('web'); await createNativeFeatures(web).breatheStep(); assert.deepEqual(web.calls, []);
});

const exercise = { name: 'Public exercise', intro: 'Instructions', steps: [{ title: 'Breathe', body: 'Slowly' }],
  answers: 'PRIVATE', before: 7, profile: { name: 'PRIVATE' }, conversation: 'PRIVATE' };
test('native share contains only public instructions; cancellation is a normal result', async () => {
  const f = fixture(); const device = createNativeFeatures(f);
  assert.equal(await device.shareExercise(exercise), 'shared');
  assert.deepEqual(f.calls[0], ['share', { ...exerciseShare(exercise), dialogTitle: 'Share exercise' }]);
  assert(!JSON.stringify(f.calls).includes('PRIVATE'));
  f.share.share = async () => { throw new Error('Share canceled'); };
  assert.equal(await device.shareExercise(exercise), 'cancelled');
});

test('browser sharing falls back to clipboard, treats cancel normally and propagates real failures', async () => {
  const f = fixture('web'); const device = createNativeFeatures(f);
  assert.equal(await device.shareExercise(exercise), 'copied');
  f.web.share = async () => { throw Object.assign(new Error(), { name: 'AbortError' }); };
  assert.equal(await device.shareExercise(exercise), 'cancelled');
  f.web.share = async () => { throw new Error('permission denied'); };
  await assert.rejects(device.shareExercise(exercise), /permission denied/);
  delete f.web.share; delete f.web.clipboard;
  assert.equal(await device.shareExercise(exercise), 'unavailable');
});

test('external browser accepts only external HTTPS; legal paths and OS schemes are not intercepted', async () => {
  const f = fixture(); const device = createNativeFeatures(f);
  for (const url of ['/privacy.html', 'https://localhost/terms.html', 'http://zuporta.com', 'javascript:alert(1)', 'mailto:support@zuporta.com', 'tel:988', 'https://name:password@zuporta.com']) {
    assert.equal(externalURL(url, f.web.origin), null);
    await assert.rejects(device.openExternal(url), /could not be opened/);
  }
  await device.openExternal('https://zuporta.com/signin');
  assert.deepEqual(f.calls, [['open', { url: 'https://zuporta.com/signin' }]]);
  for (const origin of ['null', 'capacitor://localhost']) {
    assert.equal(externalURL('https://zuporta.com/login', origin), 'https://zuporta.com/login');
    assert.equal(externalURL('privacy.html', origin), null);
  }
});

test('native listeners consume back before minimizing, ignore unrelated notifications and resync appearance', async () => {
  const f = fixture(); const device = createNativeFeatures(f);
  let consume = true, checkIns = 0;
  const active = [], errors = [];
  await device.initialize({ onBack: () => consume, onCheckIn: () => checkIns++, onActive: (v) => active.push(v), onError: (e) => errors.push(e) });
  f.listeners.backButton(); assert(!f.calls.includes('minimize'));
  consume = false; f.listeners.backButton(); assert(f.calls.includes('minimize'));
  f.listeners.localNotificationActionPerformed({ notification: { id: 3 }, actionId: 'tap' });
  f.listeners.localNotificationActionPerformed({ notification: { id: REMINDER_ID }, actionId: 'dismiss' });
  f.listeners.localNotificationActionPerformed({ notification: { id: REMINDER_ID }, actionId: 'tap' });
  assert.equal(checkIns, 1);
  await f.listeners.appStateChange({ isActive: false }); await f.listeners.appStateChange({ isActive: true });
  assert.deepEqual(active, [true, false, true]);
  await device.setTheme('dark'); await device.setTheme('light');
  assert.deepEqual(f.calls.filter(([method]) => method === 'style'), [['style', { style: 'DARK' }], ['style', { style: 'LIGHT' }]]);
  assert.deepEqual(errors, []);
});

test('iOS never installs an Android back handler or channel', async () => {
  const f = fixture('ios'); const device = createNativeFeatures(f);
  await device.initialize({ onBack: () => assert.fail(), onCheckIn() {}, onActive() {}, onError: (e) => assert.fail(e) });
  await device.reminders.set(true, '18:30');
  assert.equal(f.listeners.backButton, undefined);
  assert.equal(f.calls.filter(([method]) => method === 'channel').length, 0);
});

test('checked-in browser bundle matches the current source and pinned SDKs', async () => {
  const { build } = await import('esbuild');
  const result = await build({ entryPoints: ['src/native.mjs'], bundle: true, write: false, format: 'esm', platform: 'browser',
    target: ['ios15', 'chrome89'], minify: true, drop: ['console', 'debugger'], legalComments: 'inline',
    banner: { js: '// Generated by npm run build:native from src/native.mjs; do not edit directly.' } });
  assert.equal(await readFile('connect.zuporta.com/assets/js/native.js', 'utf8'), result.outputFiles[0].text);
});
