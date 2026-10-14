import { Capacitor, SystemBars } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics } from '@capacitor/haptics';
import { Share } from '@capacitor/share';
import { Browser } from '@capacitor/browser';
import { createReminders, REMINDER_ID } from './reminders.mjs';

// Only public exercise content is accepted. No state, scores, names or conversation.
export function exerciseShare(activity) {
  return { title: activity.name, text: `${activity.name} — Zuporta+\n\n${activity.intro}\n\n`
    + activity.steps.map((step, index) => `${index + 1}. ${step.title}\n${step.body}`).join('\n\n') };
}

export function externalURL(href, origin) {
  try {
    // WKWebView custom-scheme origins can be opaque ("null"). Absolute links
    // must still open in Browser; that string is not a usable URL base.
    const url = origin && origin !== 'null' ? new URL(href, origin) : new URL(href);
    return url.protocol === 'https:' && url.origin !== origin && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}

export function createNativeFeatures({ platform, app, notifications, haptics, share, browser, bars, storage, web }) {
  const native = platform === 'android' || platform === 'ios';
  const reminders = native ? createReminders({ notifications, platform, storage }) : null;
  const hapticsEnabled = () => {
    try { return storage.getItem('zuporta.haptics') !== 'off'; } catch { return true; }
  };
  return {
    native, platform, reminders, hapticsEnabled,
    setHaptics(enabled) { storage.setItem('zuporta.haptics', enabled ? 'on' : 'off'); },
    async breatheStep() {
      if (!native || !hapticsEnabled()) return;
      try { await haptics.impact({ style: 'LIGHT' }); } catch { /* Haptics are optional hardware feedback. */ }
    },
    async shareExercise(activity) {
      const payload = exerciseShare(activity);
      try {
        if (native) await share.share({ ...payload, dialogTitle: 'Share exercise' });
        else if (web.share) await web.share(payload);
        else if (web.clipboard?.writeText) { await web.clipboard.writeText(payload.text); return 'copied'; }
        else return 'unavailable';
        return 'shared';
      } catch (error) {
        if (error.name === 'AbortError' || error.message === 'Share canceled') return 'cancelled';
        throw error;
      }
    },
    async setTheme(theme) {
      if (!native) return;
      try { await bars.setStyle({ style: theme === 'dark' ? 'DARK' : 'LIGHT' }); }
      catch { /* Keep the app usable if the system appearance API is unavailable. */ }
    },
    async openExternal(href) {
      const url = externalURL(href, web.origin);
      if (!native || !url) throw new Error('This link could not be opened.');
      await browser.open({ url });
    },
    async initialize({ onBack, onCheckIn, onActive, onError }) {
      if (!native) return;
      const listen = async (plugin, event, callback) => {
        try { await plugin.addListener(event, callback); }
        catch { onError('A device feature could not start. Please reopen the app and try again.'); }
      };
      if (platform === 'android') await listen(app, 'backButton', () => {
        if (!onBack()) app.minimizeApp().catch(() => onError('Could not return to the Home screen.'));
      });
      await listen(notifications, 'localNotificationActionPerformed', (event) => {
        if (event.notification?.id === REMINDER_ID && event.actionId === 'tap') onCheckIn();
      });
      await listen(app, 'appStateChange', async ({ isActive }) => {
        if (isActive) {
          try { await reminders.reconcile(); }
          catch { onError('Check your daily reminder in Settings; it could not be restored.'); }
        }
        onActive(isActive);
      });
      try { await reminders.reconcile(); }
      catch { onError('Check your daily reminder in Settings; it could not be restored.'); }
      onActive(true);
    },
  };
}

// Access may throw in restricted browser storage; show a recoverable error on save.
const storage = {
  getItem: (key) => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
};
export const device = createNativeFeatures({ platform: Capacitor.getPlatform(), app: App,
  notifications: LocalNotifications, haptics: Haptics, share: Share, browser: Browser, bars: SystemBars, storage,
  web: { origin: globalThis.location?.origin, share: globalThis.navigator?.share?.bind(globalThis.navigator),
    clipboard: globalThis.navigator?.clipboard } });
