# Zuporta+ development

Use the existing checkout. Cloud tasks already run in isolated environments;
do not create a Git worktree unless explicitly requested. Store-readiness
work belongs on `jet/kind-maxwell-nzz6vr`; never push main or merge PR #1.

## Web and browser checks

The PWA is in `connect.zuporta.com/`. It uses vanilla ES modules and no
server-side database. A small native SDK adapter in `src/native.mjs` is bundled
locally with pinned esbuild into `assets/js/native.js`; no CDN is needed.
Node 24.19.0 is pinned in `.nvmrc` (Capacitor
requires Node 22+); Python 3 and Chromium support local web validation.

```sh
npm ci
python3 -m pip install -r tests/requirements.txt
npm start
```

Run `npm run build:native` after changing `src/` or native SDK dependencies.
The generated adapter is committed so a static web host can serve the PWA.
`npm run sync` (including the platform-specific variants) rebuilds it before
copying assets. `npm test` verifies logic and bundle/source consistency.

Use a local HTTP request, `npm run test:ui` and `npm run test:native-ui` in another terminal to verify
rendered interactions, persistence and offline behavior. See `tests/README.md`
for Chromium path overrides. API success in the regression suite uses an
explicitly synthetic response; it does not establish production API health.
Native integration scenarios use a mocked Capacitor bridge with the actual
SDK bundle, not real OS notifications, haptics, share sheets or device insets.

## Native wrapper

App identifier: `com.zuporta.plus`. Web directory: `connect.zuporta.com`.
Capacitor core, Android, iOS and CLI are pinned to 8.5.3 in the lockfile.
Android minimum API is 24; compile/target API is 36. iOS minimum is 15.0.
The initial native iOS target is iPhone in portrait orientation; the PWA
continues to work in tablet browsers. Native iPad support is not enabled.

After changing web assets or plugins, run:

```sh
npm run sync
```

Daily reminders are off by default and request permission only on enable.
Settings stores a device-local time; launch/resume reconciles a single daily
calendar notification, without an exact alarm or idle-mode exemption. Device
settings, Doze and timezone changes while the app is closed may delay delivery;
test reboot, timezone/DST and permission changes on hardware in M7. Reminder
and haptics preferences are separate from wellness-history deletion.

Core Capacitor SystemBars manages Android insets (`native` mode handles old
WebViews with padding and new ones through CSS safe-area values) and system
bar contrast on both platforms. The CSS consumes top/bottom/side insets; iOS
automatic scroll insets are disabled to avoid doubling them. Physical-device
cutout, keyboard, navigation mode and rotation checks remain required.

HTTPS account/booking links open Capacitor Browser (Custom Tabs / Safari view).
No app sign-in token or payment is handled in the local WebView. Phone, SMS and
email schemes retain Capacitor's OS handling; local legal pages stay local.

Generated web copies in native projects are ignored. Commit application
source and native project configuration, not build output or machine-specific
SDK paths. Regenerate icons/splashes only when intended:

```sh
npm run assets:native
```

This uses the existing `assets/img/icon-512.png`, scales it for native sizes,
flattens the iOS icon to opaque RGB, and generates light/dark splashes. It
does not rewrite the PWA manifest. Signing keys and profiles are ignored;
never put credentials in Git.

## Android on this Linux cloud machine

The base cloud image has a Java 21 runtime. Complete it with the matching
Debian JDK package using `python3 scripts/setup-java21.py` (APT signature and
package checksum verification remain enabled). The SDK helper installs
SDK 36/build tools 35.0.0, matching the Android Gradle plugin default,
using Google's published command-line-tool checksum and normal TLS checks.
Android CLI usage metrics are disabled during installation. SDK and caches
live outside the checkout.

```sh
python3 scripts/setup-java21.py
export JAVA_HOME=/workspace/zuporta-jdk/usr/lib/jvm/java-21-openjdk-amd64
export ANDROID_HOME=/workspace/android-sdk
export ANDROID_USER_HOME=/workspace/.android-user
export GRADLE_USER_HOME=/workspace/.gradle-cache
python3 scripts/setup-android-sdk.py
python3 scripts/configure-java-proxy.py
npm run sync:android
cd android
./gradlew :app:assembleDebug --max-workers=2 --no-daemon --console=plain
```

Android tools also use the standard `~/.android` directory; initialize it
with the cloud runtime’s normal filesystem permissions if absent. Do not
change `HOME` to work around access errors.

The Java proxy helper preserves existing settings and never writes proxy
credentials. Gradle 8.14.3's binary distribution has an official SHA-256 pin.
The SDK installer is Linux-specific; use Android Studio's SDK Manager on
other platforms. The unsigned-development workflow does not require a Play
Console account. A debug APK is not a signed store release or real-device QA.

## iOS on macOS

Use a supported Xcode version for Capacitor 8, install the pinned npm
packages, and run `npm run sync:ios`. Open `ios/App/App.xcodeproj` in Xcode.
The project uses Swift Package Manager with an exact Capacitor 8.5.3
reference. A Mac/Xcode is required to resolve/compile the iOS project and
run an iPhone simulator or physical device; Linux project generation and
plist checks do not establish an iOS build result.

Configure the real Apple team and distribution signing outside Git when
available. Store identities/signing, physical-device performance and E2E,
release monitoring and production submission are separate gates in
`RELEASE_GATES.md`. The owner supplies missing requirements through secure
settings and presses final submission only after the gates pass.
