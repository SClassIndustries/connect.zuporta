# Release UI regression checks

Requires Python 3 and Chromium. Install the pinned browser driver with
`python3 -m pip install -r tests/requirements.txt`. On this cloud image,
Chromium is already available at `/usr/bin/chromium`; alternatively point
`ZUPORTA_CHROMIUM` at an installed Chromium executable.

From the repository root, start the app in a separate terminal:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory connect.zuporta.com
```

Then run:

```sh
python3 tests/release_ui.py
python3 tests/native_ui.py
python3 tests/release_edges.py
npm test
```

Set `ZUPORTA_TEST_ORIGIN` if using another local port. The checks use a
fresh mobile browser context, block the coach API for failure/offline
scenarios, and use an explicitly synthetic API response for the directory
success scenario. They never book a session or send messages to Zuporta.
The success fixture also checks the selected coach's profile URL, invalid-ID
directory fallback, external-link attributes, sign-in guidance and cached
offline reload. Website authentication and booking are not exercised.

The checks cover release route restrictions, empty states, mood history,
actual guided activity ratings, consent migration, personalization on/off,
retained hidden-module data, baseline change confirmation and real support
navigation, service worker offline reload, wellness-data deletion and
browser runtime errors. They validate the web app in Chromium; they do not
replace native iOS/Android device QA or prove live API availability.

`native_ui.py` loads the actual generated native SDK bundle against a mocked
Capacitor bridge. Its seven scenarios cover permission denial/opt-in, daily
time replacement/cancellation, permission revocation on resume, notification
navigation, sheet/drawer/back priority, external browsing/failure, system-bar
theme calls, instruction-only sharing/cancellation, breathing timer/haptic
cleanup and deletion scope. All native calls are mocked. Real-device delivery,
safe-area rendering, haptic hardware, browser sessions and share sheets remain
M7 requirements. Tests never send an OS notification or contact a recipient.

The Node tests use injected plugin/storage implementations to check failure
paths and scheduling races, iOS/Web behavior and the exact generated-bundle
contents. Run `npm run build:native` after intentional source/dependency edits;
do not loosen the bundle assertion to pass with stale shipped JavaScript.

`release_edges.py` tests the three `/open/` web entry routes and the actual
compiled Sentry JavaScript SDK through a synthetic native bridge. It checks
consent, restrictive options, event filtering and closing on opt-out without
sending events to a real Sentry project. It does not verify native crash
delivery, symbolication or crash-free-session statistics.
