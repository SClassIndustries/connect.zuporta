// Generic local reminders only. Never include wellness records in OS notifications.
export const REMINDER_ID = 41001;
export const REMINDER_KEY = 'zuporta.reminder';
export const validTime = (time) => typeof time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(time);

export function createReminders({ notifications, platform, storage }) {
  const read = () => {
    try {
      const value = JSON.parse(storage.getItem(REMINDER_KEY));
      if (value && validTime(value.time)) return { enabled: value.enabled === true, time: value.time };
    } catch { /* Invalid or unavailable storage starts with reminders off. */ }
    return { enabled: false, time: '19:00' };
  };
  let preference = read();
  let queue = Promise.resolve();
  const serialize = (job) => {
    const next = queue.then(job);
    queue = next.catch(() => {});
    return next;
  };
  const persist = (value) => {
    storage.setItem(REMINDER_KEY, JSON.stringify(value));
    preference = value;
  };
  const cancel = () => notifications.cancel({ notifications: [{ id: REMINDER_ID }] });
  async function apply(enabled, time, prompt) {
    if (!validTime(time)) throw new Error('Choose a valid reminder time.');
    if (enabled) {
      let permission = await notifications.checkPermissions();
      if (prompt && permission.display.startsWith('prompt')) permission = await notifications.requestPermissions();
      if (permission.display !== 'granted') {
        if (!prompt) {
          await cancel();
          persist({ enabled: false, time });
        }
        throw new Error('Notifications are off. Allow notifications in your device settings, then enable the reminder here.');
      }
      if (platform === 'android') {
        await notifications.createChannel({ id: 'daily-check-in', name: 'Daily check-in',
          description: 'Optional daily reminder to open Zuporta+.', importance: 3, visibility: 0, vibration: false });
      }
    }
    // Reserve storage before changing the OS schedule; fail safely if it is unavailable.
    storage.setItem(REMINDER_KEY, JSON.stringify(preference));
    await cancel();
    persist({ enabled: false, time });
    if (!enabled) return { ...preference };
    try {
      const [hour, minute] = time.split(':').map(Number);
      await notifications.schedule({ notifications: [{
        id: REMINDER_ID, title: 'Zuporta+', body: 'Take a moment for yourself. Open Zuporta+ when you are ready.',
        channelId: 'daily-check-in', smallIcon: 'ic_stat_zuporta',
        schedule: { on: { hour, minute, second: 0 }, repeats: true, allowWhileIdle: false },
        isExactNotification: false,
      }] });
      persist({ enabled: true, time });
    } catch (error) {
      await cancel();
      throw error;
    }
    return { ...preference };
  }
  return {
    get: () => ({ ...preference }),
    set: (enabled, time) => serialize(() => apply(enabled, time, true)),
    // Reconcile after launch/resume (including time-zone changes), never request permission.
    reconcile: () => serialize(() => apply(preference.enabled, preference.time, false)),
  };
}
