# M3 validation — 2026-10-14 UTC / October 15 Asia/Manila

M3 implementation is complete. This is development validation, not a store
submission approval or proof of Apple's minimum-functionality acceptance.

## Behavior

- Daily reminders start off. Settings explains generic local notification
  content, asks permission only on enable, accepts a local time and supports
  editing/off. A stable ID replaces the previous calendar schedule; launch
  and resume reconcile it without permission prompts. Denial, revoked access,
  scheduling/storage failures and queued changes have explicit handling.
- Notifications contain no name, check-in, score, conversation or health
  entry. Tapping the daily notification opens Home. Delivery can be delayed
  by OS restrictions; exact alarm and idle exemptions are not requested.
- Light breathing feedback occurs at inhale/exhale transitions only while
  running. Stop, step changes, leaving the screen and backgrounding clear
  timers. Settings can disable haptics.
- Share exercise sends only the public title/introduction/steps to the
  platform share sheet; cancellation is normal. PWA sharing uses Web Share
  or copies instructions if that API is absent. Errors remain visible.
- Capacitor core SystemBars handles native Android insets and bar contrast
  on both platforms. CSS consumes top/bottom/side insets; mobile composer
  avoids double-counting the bottom tab bar. iOS uses no automatic scroll
  insets. Native builds hide the already-unnecessary PWA Install controls.
- Android back prioritizes sheet, drawer, Home, then minimize; it does not
  exit the process. Native HTTPS account/booking links open Browser, with
  a recoverable error if unavailable. Custom/opaque iOS origins are handled.

## Checks executed

| Check | Result / scope |
| --- | --- |
| Frozen `npm ci`, JDK/SDK/proxy helpers, `npm run sync` | Passed as a repeatable cloud setup script. No TLS/checksum verification disabled. |
| `npm test` | 14 passed; 0 failed/skipped. Injected plugin/storage tests include denial, races, failure/cancellation, data minimization, iOS/Web behavior and exact generated-bundle consistency. |
| `npm run test:ui` | 12 browser scenarios passed, including offline reload with the new bundled adapter cached by service worker v13. Coach API success is mocked. |
| `npm run test:native-ui` | 7 browser scenarios passed against the actual SDK bundle and a mocked Capacitor bridge. Includes visible failure states, back priority, theme calls, share payloads, permission revocation, timer lifecycle and deletion scope. |
| Android `:app:assembleDebug :app:lintDebug` | Passed with 0 lint errors and 14 warnings; no lint findings suppressed. |
| Android merged permissions | INTERNET, VIBRATE, RECEIVE_BOOT_COMPLETED, POST_NOTIFICATIONS and AndroidX's internal non-exported receiver permission. No SCHEDULE_EXACT_ALARM, USE_EXACT_ALARM or WAKE_LOCK. Reboot receiver restores the chosen reminder; vibration supports exercise haptics. |
| iOS sync/SPM/config checks | All five plugin paths resolve; core stays exactly 8.5.3; iPhone portrait/iOS 15+ retained; view-controller status-bar appearance enabled; no unused purpose strings added. Xcode compilation not run. |
| Production npm dependency audit | 0 reported vulnerabilities; excludes development tooling. |
| Shipped assets / APK / diff | Final artifact hash and byte-for-byte web-content checks recorded below; archives remain outside the package. |

Lint warnings are unused/generated compatibility resources (7), missing
monochrome launcher icon (2), splash density sizing (2), duplicate generated
configuration resources (2) and resource location (1). They remain visible
for the M7 quality pass.

## SDK/data inventory added in M3

Exact versions are locked: App 8.1.2, Browser 8.0.5, Haptics 8.0.2,
Local Notifications 8.3.1, Share 8.0.3; core/platforms/CLI remain 8.5.3.
esbuild 0.28.2 is build-only. The adapter is bundled locally (about 20 KB),
with no remote dependency fetch or new telemetry service. Native projects
register all five SDKs; SystemBars is already part of Capacitor core.

Reminder time/enabled state and haptics preference are stored separately on
the device. The OS also retains the notification schedule. Wellness-history
deletion keeps these preferences, as stated in Settings/privacy text; users
can disable the reminder independently. The privacy draft now covers local
notifications, haptics and explicit public-content sharing. Owner legal
approval and the final SDK/privacy-label/manifest audit remain outstanding.

## Unrun release checks

No physical device was used; no Android instrumentation or native unit
suite was run. Browser mock calls do not prove notification delivery,
actual haptic feel, share-sheet rendering, cutout/keyboard/gesture layouts,
reboot/timezone/DST behavior, browser cookie sessions or native CORS.
Exercise these on the M7 fleet, including screen-lock/Doze, permission and
channel changes, both Android navigation modes and an older iPhone.

Linux cannot compile or run the iOS target. Signed release builds, physical
cold start under 2 seconds, >=99.5% crash-free sessions with no unresolved
crashes/ANRs, Android Vitals and Sentry/Crashlytics evidence have not been
established. No production submission or deployment occurred. All gates in
`../RELEASE_GATES.md` remain mandatory.

The production coach API `/nurse?page=1` returned HTTPS 200 and the expected
JSON envelope from this cloud machine after the published network change.
This is a read-only endpoint reachability check, not native-origin backend
or account/booking/payment verification. The 988 homepage was reachable with
an identifying User-Agent; full resource review remains M7.

## Final debug artifact

Development-signed APK: `android/app/build/outputs/apk/debug/app-debug.apk`
(ignored build output). SHA-256: `d5aac4f4d87237ab1a4895f6ed6e56e2d2c111b715d19f766f725c1aef493e52`.
