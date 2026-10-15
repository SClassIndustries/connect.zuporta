# Zuporta+ release-candidate validation

Validated 2026-10-15 UTC (2026-10-16 Asia/Manila). Application code commit:
`46c8a21580648c4a1955402a4aac35c448d60d7c` on
`jet/kind-maxwell-nzz6vr`. Later handoff/documentation commits do not change
the application packaged in these artifacts. PR #1 remains unmerged.

## Continuous integration

All three checks completed successfully for this code commit:

| Check | Evidence |
| --- | --- |
| Web and business logic | https://github.com/SClassIndustries/connect.zuporta/actions/runs/38793488824 |
| Android artifacts | https://github.com/SClassIndustries/connect.zuporta/actions/runs/38793488827 |
| iPhone artifacts | https://github.com/SClassIndustries/connect.zuporta/actions/runs/38793488870 |

The workflows compile and validate on code changes. Signed artifact jobs
require an explicit manual run and protected signing settings. No job
uploads to a store or promotes the website.

## Scope of the checks

- 28 Node tests pass, including assistant routing, public coach URL
  validation/pagination/cache, reminder permission/error/race handling,
  native adapter behavior, deep-link validation, diagnostic consent and
  filtering, and generated-bundle consistency.
- Twelve browser release scenarios and seven mocked-native scenarios pass.
  Browser viewport/name/keyboard checks cover 320, 390 and 768px widths.
- Release-edge browser checks exercise all three nested web entry links
  and the compiled Sentry JavaScript SDK against a synthetic native bridge:
  no initialization before consent, restrictive options, filtered event
  envelopes and closing on opt-out. The shipped adapter was also checked
  against a synthetic bridge with HTTPS blocked: it supplied the owner DSN
  for US project `4512261792006144` only after consent and closed on opt-out.
  The supplied DSN is now the build default; no Actions variable is required.
  No real Sentry event delivery is claimed.
- ESLint, package/source hygiene and dependency audit pass. The npm audit
  reported zero known vulnerabilities at validation time.
- Android debug APK and unsigned release AAB compile. Release/debug lint
  reports zero errors and 15 warnings: IntentFilterUniqueDataAttributes (1),
  UnusedResources (7), MonochromeLauncherIcon (2), IconDipSize (2),
  IconDuplicatesConfig (2) and IconLocation (1). The warnings remain visible
  in the CI reports for review; they are not reported as zero warnings.
- The four 64-bit native libraries in the Android bundle pass the ELF
  load-segment alignment check for 16 KB pages. Runtime device compatibility
  and the final Play Console checks remain separate.
- A disposable test keystore exercised Android release signing; jarsigner
  verified that test AAB. The test key was discarded. It is not a production
  upload key, and the handoff AAB below is unsigned.
- macOS CI using Xcode 26+ completes an unsigned iPhone archive, static
  analyzer and configured SwiftLint checks. Real Apple certificate/profile
  signing and signed IPA export await owner credentials.

These checks do not substitute for OS notifications, hardware haptics,
native share sheets, physical accessibility testing, real crash/session
metrics, authenticated booking/payment or clinical/content review.

## Local Android handoff artifacts

Both artifacts were rebuilt from the code commit above. All 25 packaged
web files match the source byte-for-byte; website-only `.well-known` files
are not APK assets. The debug APK uses development signing. Use test data:
switching to the store-signed app may require uninstalling it, which erases
its local records. It cannot be uploaded as the production Play release.

| Artifact | Bytes | SHA-256 | Signing |
| --- | ---: | --- | --- |
| app-debug.apk | 9800204 | `d0f183dc30285e42dfc3f3f22a0b85a12754ef4b4f547fe4302aa1bfd19a8961` | Development-signed, Android QA only |
| app-release.aab | 5497370 | `3f8bea33f5bd6ccf956b28b72e4a9e82378e74bf9320de7be7ac69164a56a949` | Unsigned, validation only |

CI artifacts include their own manifests and may have different hashes due
to build numbers/toolchain metadata. Always match QA evidence to the exact
downloaded artifact rather than copying these local hashes to another build.

## Protected web preview

https://zuporta-ai-coaches-ljh2wm1jk-eld-e0424773.vercel.app

Vercel deployment `dpl_FkqZbzQcXPwYiK8jetYwFv57VqRA` is READY, with no
production target, and references the earlier QA code commit
`68e6fe98848e3230097b83d7f6e3371a6bdad1a6`, before the owner DSN was supplied.
The DSN follow-up changes the native build default; PWA diagnostics remain
disabled. Authorized
fetches of the root, `/open/coaches` and Apple association return HTTP 200.
The association is served as `application/json` and names
`9G5XD8GWXZ.com.zuporta.plus`. Vercel protection is retained. This does not
establish signed-device link handling or publish the unfinished legal drafts.

## Remaining release requirements

See `signing-setup.md`, `qa-checklist.md` and `../RELEASE_GATES.md`.
Real upload/distribution credentials, live Sentry delivery/operational
settings, signed builds, physical-device results, startup/stability evidence,
approved policy facts, public associations and final console forms remain
owner-dependent. No TestFlight/Play upload, production deployment, legal
approval or store approval is claimed.
