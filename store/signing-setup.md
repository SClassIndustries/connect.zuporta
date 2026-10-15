# Build and signing setup for manual store upload

Code stays on `jet/kind-maxwell-nzz6vr`; PR #1 must not be merged as part of
this handoff. Workflows never upload to a store or publish production.

## One-time GitHub setup

Open this repository → Settings → Environments → **mobile-signing**.
Restrict it to the reviewed release branch and require a reviewer for
signing access. Review the exact commit before permitting a signed job.
Unsigned validation jobs use no signing credentials.

Add these environment secrets; never paste their values into chat or Git:

| Secret | Contents |
| --- | --- |
| ANDROID_KEYSTORE_BASE64 | Base64 of the upload keystore for this new Play app |
| ANDROID_KEYSTORE_PASSWORD | Keystore password |
| ANDROID_KEY_ALIAS | Upload-key alias |
| ANDROID_KEY_PASSWORD | Password for that key |
| IOS_DISTRIBUTION_P12_BASE64 | Base64 export containing Apple Distribution certificate and private key |
| IOS_DISTRIBUTION_P12_PASSWORD | Password protecting that export |
| IOS_PROVISION_PROFILE_BASE64 | Base64 App Store distribution provisioning profile for com.zuporta.plus |

Apple Team ID **9G5XD8GWXZ** is already the workflow default. An environment
variable `APPLE_TEAM_ID` can override it only if ownership changes; update
the domain association at the same time. Enrollment ID is not used by these
builds. No App Store Connect API key is required for manual upload.

Create new app records for **Zuporta+**, not the existing Zuporta listings.
Enable Associated Domains for the new Apple App ID before generating its
distribution profile. Preserve the certificate/private key and Android
upload key in a secure owner-controlled backup.

## Optional Sentry configuration

The owner supplied the public US Sentry DSN on 2026-10-16. The native build
now defaults to that destination, project **4512261792006144**. No GitHub
variable is required. A nonempty repository Actions variable **SENTRY_DSN**
can override the default if the owner changes projects. This is an ingest
destination, not a Sentry auth/API token; no private Sentry token is embedded.
No Sentry account or project was created here.

Configuration does not enable collection. Testers must enable optional
diagnostics in Settings. Confirm the
diagnostic check arrives, verify native crashes/hangs using a controlled
test build, and check Sentry retention/PII settings. Upload produced dSYMs to
the matching Sentry release if symbolication is required. Count only the
actually monitored sessions when reporting stability.

## Generate files

1. Open Actions and the latest commit's **Web and business logic**, **Android
   artifacts** and **iPhone artifacts** results. Resolve failures before signing.
2. The Android validation artifact contains a debug APK for device QA, an
   **unsigned** AAB and lint reports. The unsigned AAB is not upload-ready.
   Use test data in the development-signed APK. Moving to store signing can
   require uninstalling it, which deletes its local records. Complete final
   QA again on the signed release candidate.
3. Under **Android artifacts → Run workflow**, choose the reviewed branch
   and set **signed** to true. After the signing environment review, download
   **zuporta-plus-play-upload**. Its `.aab` is the file for Play Console.
4. Under **iPhone artifacts → Run workflow**, use the same reviewed branch
   and **signed** true. Download **zuporta-plus-apple-upload**. Its `.ipa` is
   exported for manual App Store Connect upload using Transporter/Xcode.
5. Keep each artifact manifest/checksum with the commit, version/build and QA
   report. Build numbers use the workflow run number and must exceed any
   number already uploaded to that new app record.

Unsigned iPhone archives prove compilation; they cannot be installed via
TestFlight or uploaded as signed releases. The signed jobs validate the
provided signing inputs and stop on missing/expired/wrong-app profiles.

## Domain association

Apple association and native entitlement are prepared for
`9G5XD8GWXZ.com.zuporta.plus` on `connect.zuporta.com`.

After enrolling the new Android app in Play App Signing, copy the public
**app signing** certificate's SHA-256 fingerprint from App integrity. It is
different from the upload certificate. Set `PLAY_APP_SIGNING_SHA256` locally
and run `npm run links:android`; the script generates the correct
`/.well-known/assetlinks.json`. No bogus fingerprint is published by default.

Publish the resulting verified files with the finalized web app. Both
association URLs need HTTPS, JSON content type and no redirect. Test
`/open/check-in`, `/open/breathe` and `/open/coaches` on signed real devices;
without an installed verified app they open the equivalent web view.

## Upload order

First use Play internal testing and TestFlight to collect device QA,
startup and monitoring evidence. Complete `qa-checklist.md`, approved legal
pages, listing/privacy/age/health forms and `RELEASE_GATES.md`. The owner then
chooses submission/review and rollout in the consoles. No workflow performs
those actions automatically.
