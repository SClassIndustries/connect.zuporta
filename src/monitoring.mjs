import { Capacitor } from '@capacitor/core';
import * as Sentry from '@sentry/capacitor';
import { init, globalHandlersIntegration } from '@sentry/browser';
import { createDiagnostics, scrubDiagnostic } from './diagnostics.mjs';

const dsn = __ZUPORTA_SENTRY_DSN__;
export const diagnostics = createDiagnostics({
  configured: Capacitor.isNativePlatform() && !!dsn,
  storage: { getItem: (key) => globalThis.localStorage.getItem(key), setItem: (key, value) => globalThis.localStorage.setItem(key, value) },
  sdk: {
    start: () => new Promise((resolve, reject) => {
      try {
        Sentry.init({ dsn, release: __ZUPORTA_RELEASE__, environment: 'production',
          enableNative: true, enableNativeNagger: false, enableNativeCrashHandling: true,
          enableAutoSessionTracking: true, enableAppHangTracking: true,
          enableCaptureFailedRequests: false, sendDefaultPii: false, maxBreadcrumbs: 0,
          tracesSampleRate: 0, enableAutoPerformanceTracing: false, enableLogs: false,
          defaultIntegrations: false, integrations: [globalHandlersIntegration()],
          beforeSend: scrubDiagnostic, beforeBreadcrumb: () => null,
        }, (options) => { init(options); resolve(); });
      } catch (error) { reject(error); }
    }),
    stop: () => Sentry.close(),
    check: () => Sentry.captureException(new Error('Diagnostic connection check')),
  },
});
