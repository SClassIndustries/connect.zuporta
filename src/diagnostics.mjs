export const DIAGNOSTICS_KEY = 'zuporta.diagnostics';

// Whitelist only code locations. Never transmit arbitrary error text or app state.
export function scrubDiagnostic(event) {
  if (event.type && event.type !== 'error') return null;
  return {
    event_id: event.event_id, timestamp: event.timestamp, platform: event.platform,
    release: event.release, environment: event.environment, level: 'error',
    exception: { values: (event.exception?.values || []).map((error) => ({
      type: 'Error', value: 'Application error', mechanism: { type: 'generic', handled: error.mechanism?.handled !== false },
      stacktrace: { frames: (error.stacktrace?.frames || []).map((frame) => ({
        filename: String(frame.filename || '').split(/[?#]/)[0].split('/').pop(),
        lineno: frame.lineno, colno: frame.colno, in_app: frame.in_app,
      })) },
    })) },
  };
}

export function createDiagnostics({ configured, storage, sdk }) {
  let enabled = false; let started = false; let queue = Promise.resolve();
  try { enabled = configured && storage.getItem(DIAGNOSTICS_KEY) === 'on'; } catch { /* Off without readable consent. */ }
  const serialize = (job) => { const next = queue.then(job); queue = next.catch(() => {}); return next; };
  const start = async () => { if (!started) { await sdk.start(); started = true; } };
  return {
    configured, enabled: () => enabled,
    initialize: () => serialize(async () => { if (enabled) await start(); }),
    set: (value) => serialize(async () => {
      if (!configured) throw new Error('Diagnostics are not configured for this build.');
      if (value) {
        storage.setItem(DIAGNOSTICS_KEY, 'on');
        try { await start(); enabled = true; }
        catch (error) { storage.setItem(DIAGNOSTICS_KEY, 'off'); enabled = false; throw error; }
      } else {
        storage.setItem(DIAGNOSTICS_KEY, 'off'); enabled = false;
        if (started) { await sdk.stop(); started = false; }
      }
      return enabled;
    }),
    check: () => { if (!enabled || !started) throw new Error('Enable optional diagnostics first.'); sdk.check(); },
  };
}
