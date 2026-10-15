# Zuporta+ — App Store & Google Play readiness

This file is the single source of truth for getting Zuporta+ into the
Apple App Store and Google Play. A scheduled Codex session works
through it every 2 hours. It starts with the first unchecked, unblocked
item, finishes and validates the work, checks the box, and commits to
`jet/kind-maxwell-nzz6vr`. During an active session with the owner, continue
through the milestone before pausing, skipping owner-dependent requirements. If an item is blocked on something only the
owner can do, it is marked
**BLOCKED** with the exact ask in "Needs from the owner" below, and the
session moves on to the next milestone.

Status legend: `[ ]` todo · `[~]` in progress · `[x]` done · `BLOCKED` waiting on owner

---

## Current owner handoff — 2026-10-16 (Asia/Manila)

The requested software/release preparation is implemented. The remaining
owner work is physical-device QA, signing/project configuration, unresolved
legal/compliance facts and store upload. None of those is represented as a
passed production-release gate.

- **Product:** Zuporta+, a separate app using `com.zuporta.plus`. Preserve
  existing Zuporta listings (`com.zuporta.app` and Apple ID `6753316016`).
- **Business:** Lyfemind Coaching Collective LLC, 2108 N St Suite N,
  Sacramento, California 95816, USA. Admin/account email `admin@zuporta.com`.
  Apple Team ID `9G5XD8GWXZ` supplied by the owner; Enrollment ID is not used
  by these builds. Existing support/privacy contacts remain sourced separately.
- **Implemented:** local wellness flows, native reminders/haptics/sharing,
  system bars/back/external browsing, selected-coach links, honest cached
  availability, cold/warm app links, optional consent-based Sentry and
  secret-isolated Android/iPhone artifact workflows. Workflows never submit
  to stores. Native SDK initialization waits for Sentry configuration and consent.
- **Release materials:** `store/listing.md`, `privacy-answers.md`,
  `review-notes.md`, `signing-setup.md`, `qa-checklist.md` and screenshot/
  feature-graphic drafts are prepared. Drafts still need the owner's facts
  and final signed-build/console parity check.
- **Hosting:** existing Vercel project `zuporta-ai-coaches` under
  `eld-e0424773`. The protected QA preview is
  https://zuporta-ai-coaches-ljh2wm1jk-eld-e0424773.vercel.app,
  app code commit `68e6fe98848e3230097b83d7f6e3371a6bdad1a6`.
  Its root, `/open/coaches` rewrite and Apple association return HTTP 200;
  the association has JSON content type. Production/domain mapping is unchanged.
- **Evidence:** see `store/release-validation.md` for final CI/build results,
  test scope and artifact hashes. Physical-device results, crash-free rates,
  native cold-start measurements and real signed distribution are separate.
- **Coach platform:** HTTPS public directory works with the expected schema.
  Individual profiles require website sign-in; the UI explains reopening a
  profile after sign-in. No administrator credentials or wellness entries
  are sent to the coaching site. Authenticated booking/payment remains QA.
- **Supplied source:** `Zuporta Source Code.php` was one Laravel migration
  for users/sessions/reset tokens with ULID IDs, not the complete backend.
  It was inspected and never executed/applied to a database. The public
  website corroborates the selected-coach URL pattern.

### Your release path

| Route | What to use | Remaining action |
| --- | --- | --- |
| Web/PWA QA | Protected Vercel preview above | Test phone/browser flows. Publish finalized policy/association files with the approved web release. |
| Android QA | Debug APK in the Android validation artifact | Install on the required physical devices and record results. |
| Google Play upload | Signed `.aab` from the manual Android workflow | Configure the new app's upload key, finish QA/forms and upload to the new Play record. |
| iPhone QA and upload | Signed `.ipa` from the manual iPhone workflow | Configure Apple distribution certificate/profile, use TestFlight for device QA, then upload/submit through the new App Store Connect record. |

The shared web assets are bundled into store apps. Publishing to Vercel does
not update installed store builds. A native code/content update normally
needs a new store build/version. Do not merge PR #1 or release production
until the applicable gates and owner approval are complete.

## Original audit (2026-10-14; superseded by milestone progress)

- A static Progressive Web App in `connect.zuporta.com/`, live at
  https://connect.zuporta.com. Manifest, icons, maskable icons, service
  worker and offline shell are already in place.
- All wellness data stays in `localStorage` on the device. The only
  network call is the public coach list from `api.zuporta.com`.
  Sign-in and payment live on zuporta.com, not in this app.
- The in-app "assistant" is rule-based and runs on the device. No
  third-party AI service is called.
- Crisis resources already exist (`assets/js/data.js` → `CRISIS`).
- Capacitor Android/iPhone projects now wrap the app, with native reminders,
  haptics, sharing, system bars/back navigation and external browsing (M2/M3).
  Android debug compilation is verified; iOS compilation, store signing and
  the release evidence gates remain outstanding. No store build has been submitted.

### Store-review risks found in the audit

| Risk | Store rule | Where |
|---|---|---|
| Settings → About says "This build is a prototype … no booking or payment is connected." Apple rejects apps that describe themselves as demos, betas or prototypes. | Apple 2.1, 2.2 | `assets/js/app.js` `viewSettings()` |
| No privacy policy or terms reachable from inside the app. Both stores require a privacy policy URL, and Apple requires it in the app too. | Apple 5.1.1(i), Play User Data policy | — |
| A plain website in a wrapper is rejected as "minimum functionality". The native build needs real native features (local reminder notifications, haptics, share sheet, offline). | Apple 4.2 | — |
| Health/wellness app: needs a clear "not medical care" disclaimer (present in the composer) and the Play Console Health apps declaration. | Apple 1.4.1, Play Health apps policy | `index.html` |
| Accounts are created on zuporta.com. If the app ever offers sign-up in-app, account deletion must also be offered in-app. | Apple 5.1.1(v), Play account deletion policy | `zuporta-api.js` |
| Booking human coaches is a person-to-person service, so it may be paid outside in-app purchase — but the listing and review notes must say so. | Apple 3.1.3(d) | — |

---

## Release constraints

US-only launch. Support: **support@zuporta.com** (owner-confirmed).
`RELEASE_GATES.md` records the mandatory build, static-analysis, tests,
physical-device E2E, monitoring, cold-start, backend, privacy, payments and
metadata gates. Do not submit for review or release to either store until the applicable
gates pass and the owner authorizes submission. Internal testing can collect
the required evidence when accounts and signing are available.

## Milestones

### M1 — Roadmap, legal pages, honest copy
- [x] Write this roadmap.
- [x] Draft `privacy.html` (privacy policy) and `terms.html` (terms of use), served from the same site.
- [x] Link both from Settings in the app and add them to the service worker shell.
- [x] Remove "prototype" wording from the in-app About card.
- [x] Remove the remaining user-visible "prototype" wording: `app.js` consent sheet, wellness view, modules panel, and booking/program/membership toasts. Retain clear sample-data and unavailable-feature disclosures.
- [x] Hide unfinished service modules, programs and membership actions; remove sample professionals/history and fabricated summaries from release views. Keep Personal Baseline and finish its support actions. Restrict old routes and retain source/local records; release scope recorded in owner item #8 before changes.
- [x] Remove inactive research, model-training and professional-sharing controls and legacy stored choices. Implement the retained local personalization switch, align privacy copy, and clear the local activity log with wellness-history deletion.
- [ ] Owner reviews and approves the legal text. **BLOCKED — needs owner: approve the app-specific privacy policy and terms, provide actual HTTP-log/Sentry retention, and resolve the published age-policy conflict**. Legal entity, complete mailing address and admin contact are now supplied (see Needs from the owner #1).

### M2 — Native wrapper (Capacitor)
- [x] Add pinned Capacitor 8.5.3 dependencies, lockfile and `capacitor.config.json` (app id `com.zuporta.plus`, web dir `connect.zuporta.com`).
- [x] Generate and commit Android and iOS projects. Android debug compilation verified; iOS project generation/sync and configuration checks verified on Linux. Xcode compilation/device QA remain M4/M7 requirements.
- [x] Generate native icons and light/dark splash screens from `assets/img/icon-512.png` for both platforms; include a repeatable generator and an opaque 1024px iOS icon.
- [x] Set Android compile/target SDK to API 36. Verified the current official Play requirement (API 36 for new apps/updates since August 31, 2026); see `store/policy-sources.md`.
- [x] iOS display name Zuporta+, portrait orientation and no unused permission strings. Initial native iOS support is iPhone (iOS 15+); PWA tablet support remains.

### M3 — Native features and Apple 4.2 readiness
- [x] Daily check-in reminder with `@capacitor/local-notifications` (opt-in, user picks the time, off by default). Generic local text, inexact calendar schedule, permission/error handling and cancellation; no exact-alarm access.
- [x] Haptic feedback on breathing exercise steps with `@capacitor/haptics`; optional toggle and timer cleanup on stop, step change, background and navigation.
- [x] Native share sheet for sharing public coping-exercise instructions with `@capacitor/share`; no wellness entries included; browser share/clipboard fallback.
- [x] Status bar and safe-area handling through core SystemBars and CSS insets; Android back closes a sheet, then drawer, returns Home, then minimizes. Physical rendering/gestures remain M7 QA.
- [x] External HTTPS links (zuporta.com sign-in, booking) use Capacitor Browser (Custom Tabs / Safari view), outside the app's local web view; failure feedback included. Local legal links stay local; OS phone/SMS/email handling retained.

M3 implementation evidence: `store/m3-validation.md`. Android debug build/lint,
14 logic tests, 12 PWA scenarios and 7 browser scenarios with a mocked native
bridge pass. These are not physical-device or iOS build results, and do not
establish Apple 4.2 approval or satisfy the M7/release gates.

### M4 — Build pipeline (GitHub Actions)
- [x] `android.yml`: validate/build debug APK and unsigned release AAB on code changes; protected manual job generates a signed AAB after signing setup. No store upload.
- [x] `ios.yml`: Xcode 26+ macOS archive/analyzer/Swift checks; protected manual job exports a signed IPA after signing setup. Owner handles TestFlight/store upload.
- [x] Web/source lint with pinned ESLint and syntax/safety rules.
- [x] Meaningful assistant/coach/reminder/native-link/diagnostics tests, browser core journeys, mocked-native scenarios, real SDK consent/envelope checks, viewport/keyboard checks and package/16 KB library checks in CI. Physical devices remain separate.

### M5 — Store listing material
- [x] Store copy: title, subtitle/short description, full description, keywords, in `store/listing.md`.
- [x] Listing image drafts at the required sizes (iPhone 6.9", iPad 13" if iPad is supported, Android phone) and the Play feature graphic (1024×500).
- [x] Draft Apple App Privacy answers and Google Play Data safety answers, in `store/privacy-answers.md`, matching what the code actually does.
- [x] App Review notes for Apple (how to reach every feature, why coach payments are outside IAP, crisis-resource handling).
- [x] Content-rating/health questionnaire worksheet prepared; final legal age and console-generated ratings remain owner decisions.

### M6 — Domain verification on Vercel
- [x] Android App Links native routing and association generator (`npm run links:android`) implemented. **Owner setup pending:** supply the new Play app signing certificate SHA-256 and publish the generated file; no invented fingerprint is shipped.
- [x] Apple Universal Links association and entitlement implemented for owner Team ID `9G5XD8GWXZ`, with cold/warm action routing. Protected-preview JSON response verified; production publication and signed-device verification remain pending.
- [x] Vercel configuration serves association files as JSON with no application redirect; Apple file verified in preview. Confirm both URLs on the final public domain after publishing the actual Play certificate file.

### M7 — Pre-submission QA
- [x] Automated label, viewport and keyboard/modal checks at 320/390/768px. **Owner QA pending:** contrast, dynamic type, TalkBack/VoiceOver and actual native layouts.
- [x] Browser offline/reconnect and cached-profile checks; native assets bundled locally. **Owner QA pending:** airplane mode on both physical platforms.
- [ ] Verify the US crisis resources against the providers' official websites. Owner waived human verification across launch countries; launch is US-only.
- [ ] Final checklist against the current App Store Review Guidelines and Play Developer Policy.
- [ ] Physical-device core E2E on at least three devices, including low-end Android and an older supported iPhone. **BLOCKED — needs owner: the physical test fleet/lab in owner item #7**. Browser/emulator checks do not satisfy this gate.
- [ ] Profile cold starts under 2 seconds on mid-range physical devices using Android Studio/adb and Xcode Instruments. **BLOCKED — needs owner: physical device access in owner item #7**.
- [ ] Configure Sentry or Crashlytics, review Android Vitals, and establish at least 99.5% crash-free sessions with no unresolved crashes/ANRs or telemetry regressions. **BLOCKED — needs owner: app-specific monitoring bindings/access in owner item #7**. Record the build, observation window and session denominator.
- [ ] Production backend and error-state checks from actual native origins: correct HTTPS endpoints/certificates, offline/reconnect recovery, no development backend URLs or embedded credentials.
- [x] SDK/privacy implementation and draft worksheet prepared. **Owner compliance/QA pending:** live policy URL, Apple privacy manifests/required-reason APIs, Data Safety/privacy labels, permission-purpose strings and contextual prompts.
- [ ] Payment audit: if digital goods are offered, validate configured StoreKit/Play products and purchase/restore behavior; otherwise verify no digital purchase controls are exposed and review the person-to-person payment scope.
- [ ] Reviewer access/instructions and exact listing/screenshot/age-rating/What's New parity for the final build; apply every remaining gate in `RELEASE_GATES.md`.

### M8 — Submit
- [ ] Upload to TestFlight and Play internal testing when accounts/signing are available, to collect the required device and monitoring evidence. This does not authorize production submission or rollout.
- [ ] Submit for review on both stores. (Owner presses the final button.)

---

## Needs from the owner

Items the automated session cannot do. Each one unblocks the milestone named.

1. **Finalize and approve the app legal drafts** in `connect.zuporta.com/privacy.html` and `terms.html`. Entity **Lyfemind Coaching Collective LLC**, mailing address **2108 N St Suite N, Sacramento, California 95816, USA** and contact **admin@zuporta.com** are supplied. Confirm actual app/API HTTP-log retention, Sentry retention/IP settings and legal-text approval date. Resolve the site's age conflict: terms require 18+, while the privacy policy describes ages 13–17 with guardian consent; this app has no guardian-consent flow. Keep remaining bracketed fields until resolved. Published support/privacy contacts and California governing law remain sourced separately in `store/public-details.md`. (M1)
2. **Apple distribution setup**: owner supplied `admin@zuporta.com` and Team ID **9G5XD8GWXZ**. Confirm active membership/permissions and configure the distribution certificate/private key and App Store profile through GitHub's protected signing environment. Create a separate app record/identifier for this release; do not use existing listing `6753316016` as the new app's identity. Do not buy another membership solely because this is a second app. (M4, M6)
3. **Google Play account access**: owner supplied `admin@zuporta.com` under the verified-account heading. Actual console access/verification has not been authenticated here. Confirm permission to create the separate app, any console-required verification/testing, and its new Play App Signing/upload-key setup. Preserve existing package `com.zuporta.app`; current new-app package is `com.zuporta.plus`. (M4, M6)
4. **Signing secrets**: exact names and secure setup are in `store/signing-setup.md`. Add them to the protected `mobile-signing` environment; never chat/Git. The owner manually starts signed AAB/IPA jobs after reviewing the commit. (distribution)
5. **Hosting and protected preview confirmed; production publication pending**: connected Vercel project `zuporta-ai-coaches` under `eld-e0424773` serves `connect.zuporta.com`. Existing production is a CLI upload with no Git commit metadata. Root `vercel.json` uses the correct output directory; the exact code commit is verified in the protected preview above. Publish finalized policies/association files only with the approved web release. No additional hosting credentials need to be pasted into chat. (M1, M6)
6. **Environment network settings**: the current environment reports the restricted policy enforced and the Zuporta/documentation/crisis domains configured. As of 2026-10-16 the public coach directory request succeeds (200), superseding its previous proxy-403 blocker. Authenticated coach profiles, native WebView/backend checks and US crisis-provider verification remain separate; the 988 request was not rechecked in this handoff. (M7)
7. **Release monitoring and physical-device evidence**: Sentry integration is now implemented, off until a native build has the public `SENTRY_DSN` Actions variable and the user opts in. The owner says a Sentry account exists, but the app-specific project/DSN is not supplied.  Provide the app-specific Sentry project/DSN and any symbol-upload authorization, access to Android Vitals when available, and a physical test fleet/lab covering at least three devices (low-end Android, older supported iPhone, plus a third screen size/OS). These are needed for measured crash-free-session/ANR evidence, native startup profiling and real-device E2E; do not substitute Chromium/emulator results. No live Sentry delivery/session population has been established; the consent and SDK-envelope path is tested with a synthetic bridge. See `store/signing-setup.md`. (M7)
8. **Release scope (recorded before hiding unfinished features)**: the release UI now hides the Caregiver Load, Career Decision Sprint, Night-Shift Reset, Parent Bridge, Nurse Guidance and Support Navigation service flows; multi-day programs; membership purchase actions; sample coach profiles/history and fabricated wellness summaries; pilot-only panels and unmeasured state dimensions; and research/model/professional-sharing switches without an implemented data flow. To meet the owner's no-placeholder requirement, their source is archived outside the shipped web directory; existing local records remain retained. The working local assistant, mood check-ins, real guided-session history, live coach links and Personal Baseline remain available. For the US-only launch, remove the UK/Ireland crisis shortcut while retaining the US line and global directory. Owner decision needed only if any hidden service must return before launch; restoring it requires its missing content/integration and validation. (M1)

### Public details to source

Owner instruction (2026-10-15): use https://zuporta.com/ for the public
company, contact, support and legal details. Retrieve these instead of
asking the owner to repeat information already published there.

- [x] Read the homepage and linked privacy/terms pages, record exact source URLs and retrieval date in `store/public-details.md`, and fill verified contacts, account deletion instructions, location and governing law into the app drafts. The owner has since supplied the legal entity and complete postal address; remaining approval/retention/age facts are tracked in owner item #1.
- Keep bracketed placeholders for facts that cannot be verified. Do not infer a legal entity from branding, invent a support email, or copy website data-retention, account-deletion, minimum-age or jurisdiction provisions into the app policy without checking their scope and the app's behavior. Record any genuinely unresolved fact in the owner list after inspecting the source.

---

## Run log

- 2026-10-14 — Audit done, roadmap written, M1 work started (legal page drafts, Settings links, "prototype" wording removed).
- 2026-10-15 — M1: replaced all six user-visible "prototype" messages with accurate storage, sample-data and unavailable-feature copy; verified the consent sheet, wellness view, all seven module scope sheets and three toasts in Chromium (no runtime errors), plus JavaScript syntax and diff checks. Legal approval remains blocked on owner #1.
- 2026-10-15 — Recorded the owner's instruction to source public business/support/legal details from zuporta.com; replaced repeat requests for those details with a source-retrieval task. HTTPS retrieval was blocked by the environment proxy (403); saved the two site hostnames in the network draft. No public facts or legal approvals were inferred.

- 2026-10-15 — M1 implementation: hid unfinished release surfaces after recording scope, replaced sample summaries/history with device records, completed Baseline support navigation, collected explicit after ratings, migrated inactive consent choices and implemented on-device suggestions. Verified website contacts/law and documented remaining legal gaps; added repeatable browser regression checks including offline reload and deletion. M1 now has only owner-dependent legal work.

- 2026-10-15 — Owner confirmed support@zuporta.com and US-only launch, waived multi-country human crisis-resource verification, and required evidence-based release gates. Added `RELEASE_GATES.md`; production store submission/rollout remain held until build/static analysis/tests, physical-device E2E, monitoring, startup, backend, privacy and listing audits pass.

- 2026-10-15 — M2: added pinned Capacitor 8.5.3 wrapper/projects, generated branded native icons/splashes, configured API 36 and iPhone portrait support, and prepared checksum-verified Android SDK/JDK tooling. Android debug build passed; Android Lint passed with template/generated-resource warnings (no errors); web regressions, native config/assets and current official Play API requirement verified. Archived unfinished/demo sources outside shipped assets and refreshed PWA install screenshots. iOS compilation, physical-device testing, monitoring and release gates remain separate outstanding work.

- 2026-10-14 22:23 UTC (October 15 in Asia/Manila) — M3: implemented opt-in local daily reminders, breathing haptics/timer cleanup, public-exercise sharing, SystemBars/safe-area/back handling and external browser links. Added pinned SDKs and a reproducible local adapter bundle; removed exact-alarm/unused wake-lock permissions and aligned the privacy draft. Validated 14 logic tests, 12 PWA scenarios, 7 mocked-native browser scenarios and Android debug build/lint (0 errors, 14 warnings). Repeated cloud setup successfully and refreshed reusable instructions. Native hardware/iOS compilation and all release-evidence gates remain pending; no store submission.

- 2026-10-16 — Owner chose a separate app and supplied the legal entity, full Sacramento address and administrative/account email. Inspected the attached Laravel migration without executing it; verified live directory HTTPS/CORS responses and the public site's coach-profile route/auth requirement. Updated coach-card links with safe directory fallback and sign-in guidance, completed supplied legal fields, and prepared root static Vercel configuration. All 12 browser regression reports passed, including selected-profile links and cached reload; JavaScript syntax, JSON parsing, local HTTP routes and diff whitespace checks passed. Capacitor sync succeeded for Android and iOS. Signed-in booking, Vercel deployment, signed native builds, physical-device QA and store submissions were not performed.

- 2026-10-16 — Completed the remaining software and release-material preparation; see `store/release-validation.md` for exact evidence and `store/qa-checklist.md` for owner QA. Protected preview prepared; no production deployment, merge or store submission.
