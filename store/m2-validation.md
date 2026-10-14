# M2 validation — 2026-10-15

- Android `:app:assembleDebug :app:lintDebug`: **passed**.
- Android Lint: **0 errors, 14 warnings**. Remaining findings concern backup compatibility across Android versions, unused template/compatibility resources, themed icon support and generated splash-density conventions. Android backup is disabled with `allowBackup=false`, `fullBackupContent=false` and API 31+ cloud/device-transfer exclusions; device behavior still belongs in M7 QA. They are not suppressed; review them in M3/M7. This is not a clean production-release audit.
- Shipped JavaScript syntax and `git diff --check`: passed.
- Browser release regression: 12 scenarios passed, including history, explicit ratings, legacy preference migration, personalization, Baseline support navigation, offline reload and deletion. The success-path API is mocked; the failure path blocks the API.
- Compatibility regression also runs without `Object.hasOwn`, which is unavailable on the oldest iOS 15 versions. This is a targeted JavaScript check, not an iPhone test.
- Native icon/splash generation: repeatable across 69 resource files; iOS icon is 1024×1024 opaque RGB.
- iOS project generation/sync, display name, portrait orientation, permission strings and asset metadata: checked. Xcode compilation **not run** on Linux.
- Final debug APK package contents match the current web sources byte-for-byte and exclude archived service/demo sources.
- Final debug APK SHA-256: `acb1fe73cb6fb35479e9132385dc25ae724f3f10309f38b1f334849217eda7f8`.
- APK is `com.zuporta.plus`, version 1.0.0 (code 1), minimum API 24, target/compile API 36. API 36 matches the current official Play requirement; see `policy-sources.md`.
- Production npm dependency audit: 0 reported vulnerabilities. This result excludes development tooling and is not a full SDK security audit.

The debug APK is an ignored build output at
`android/app/build/outputs/apk/debug/app-debug.apk`. It is development-signed,
not a store release. No production store submission or rollout occurred.

## Pending release evidence

Native M3 features, CI/release builds, signing and accounts, approved legal
text, live production API verification, real-device E2E on three devices,
physical cold starts, monitoring/ANR evidence, privacy manifests/forms and
store metadata audits remain outstanding. No physical device was attached
to adb, the generated arithmetic/wrong-package test templates were removed and no native unit test suite ran, and no crash-free-session percentage
or cold-start time was established. See `../RELEASE_GATES.md` and the owner
requirements in `../STORE_READINESS.md`.
