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

## Where the app is today (audit, 2026-10-14)

- A static Progressive Web App in `connect.zuporta.com/`, live at
  https://connect.zuporta.com. Manifest, icons, maskable icons, service
  worker and offline shell are already in place.
- All wellness data stays in `localStorage` on the device. The only
  network call is the public coach list from `api.zuporta.com`.
  Sign-in and payment live on zuporta.com, not in this app.
- The in-app "assistant" is rule-based and runs on the device. No
  third-party AI service is called.
- Crisis resources already exist (`assets/js/data.js` → `CRISIS`).
- There is **no native wrapper**, so there is nothing a store can
  accept yet.

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
- [ ] Owner reviews and approves the legal text. **BLOCKED — needs owner: approve the app-specific privacy policy and terms, provide the unpublished legal entity/full mailing address and actual HTTP-log retention, and resolve the published age-policy conflict** (see Needs from the owner #1 and Public details to source below).

### M2 — Native wrapper (Capacitor)
- [ ] Add `package.json`, `capacitor.config.json` (app id `com.zuporta.plus`, web dir `connect.zuporta.com`).
- [ ] Generate `android/` and `ios/` projects and commit them.
- [ ] App icons and splash screens generated from `assets/img/icon-512.png` for both platforms.
- [ ] Set Android `targetSdkVersion` to the level Play currently requires (API 35 at minimum; check the Play target-API page at the time).
- [ ] iOS `Info.plist`: display name, portrait lock, no unused permission strings.

### M3 — Native features (passes Apple 4.2)
- [ ] Daily check-in reminder with `@capacitor/local-notifications` (opt-in, user picks the time, off by default).
- [ ] Haptic feedback on breathing exercise steps with `@capacitor/haptics`.
- [ ] Native share sheet for sharing a coping exercise with `@capacitor/share`.
- [ ] Status bar and safe-area handling; Android back button closes sheets before leaving the app.
- [ ] External links (zuporta.com sign-in, booking) open in the system browser / in-app browser, never inside the app's web view.

### M4 — Build pipeline (GitHub Actions)
- [ ] `android.yml`: build a debug APK on every push, and a signed release AAB when the signing secrets exist.
- [ ] `ios.yml`: build on a macOS runner; archive and upload to TestFlight when the signing secrets exist.
- [ ] Lint/format check for the web code.

### M5 — Store listing material
- [ ] Store copy: title, subtitle/short description, full description, keywords, in `store/listing.md`.
- [ ] Screenshots at the required sizes (iPhone 6.9", iPad 13" if iPad is supported, Android phone) and the Play feature graphic (1024×500).
- [ ] Apple App Privacy answers and Google Play Data safety answers, in `store/privacy-answers.md`, matching what the code actually does.
- [ ] App Review notes for Apple (how to reach every feature, why coach payments are outside IAP, crisis-resource handling).
- [ ] Content rating questionnaire answers (IARC / Apple age rating).

### M6 — Domain verification (GoDaddy)
- [ ] `/.well-known/assetlinks.json` (Android App Links) — needs the release signing SHA-256 from Play Console.
- [ ] `/.well-known/apple-app-site-association` (iOS Universal Links) — needs the Apple Team ID.
- [ ] Confirm the hosting serves both with `Content-Type: application/json` and no redirect.

### M7 — Pre-submission QA
- [ ] Accessibility pass (labels, contrast, dynamic type, screen reader).
- [ ] Offline and airplane-mode test on both platforms.
- [ ] Verify the US crisis resources against the providers' official websites. Owner waived human verification across launch countries; launch is US-only.
- [ ] Final checklist against the current App Store Review Guidelines and Play Developer Policy.
- [ ] Satisfy every applicable requirement in `RELEASE_GATES.md`: physical-device core E2E on at least three devices, cold start under 2 seconds on mid-range hardware, crash-free sessions at least 99.5% with no unresolved crashes/ANRs or telemetry regressions, production backend checks, privacy manifests/forms/permissions and exact store metadata parity. Browser-only evidence is insufficient.

### M8 — Submit
- [ ] Upload to TestFlight and Play internal testing when accounts/signing are available, to collect the required device and monitoring evidence. This does not authorize production submission or rollout.
- [ ] Submit for review on both stores. (Owner presses the final button.)

---

## Needs from the owner

Items the automated session cannot do. Each one unblocks the milestone named.

1. **Finalize and approve the app legal drafts** in `connect.zuporta.com/privacy.html` and `terms.html`. Public contacts and California governing law have been sourced from zuporta.com (see `store/public-details.md`). The inspected pages do not supply a registered legal entity name or full mailing address; provide or identify those. Confirm actual app/API HTTP-log retention and the approval date. Resolve the site's age conflict: terms require 18+, while the privacy policy describes ages 13–17 with guardian consent; this app has no guardian-consent flow. Keep the remaining bracketed fields until resolved. (M1)
2. **Apple Developer Program** membership (US$99/year) under the business name, and the **Team ID**. (M2, M4, M6)
3. **Google Play Console** account (US$25 one-time), with identity verification completed. Organization accounts need a D-U-N-S number. (M4, M6)
4. **Signing secrets** added to the GitHub repo (Settings → Secrets and variables → Actions). The session will list exact names when M4 starts. Never paste keys into chat. (M4)
5. **Hosting access**: confirm where connect.zuporta.com is hosted (GoDaddy hosting or elsewhere) and how files get deployed from this repo, so `/.well-known/` files and the legal pages actually go live. (M1, M6)
6. **Official policy/development documentation access**: the network draft now includes `capacitorjs.com`, `developer.apple.com`, `support.google.com` and `developer.android.com`, preserving access to `zuporta.com` and `www.zuporta.com`. Review/save and publish the environment to retain those additions. Initial requests for official Capacitor/Apple/Play pages were denied by the proxy; retry after the change applies. Zuporta source access now works and is no longer a blocker. (M2, M7)
7. **Release monitoring and physical-device evidence**: provide the app-specific Sentry or Firebase/Crashlytics project binding and secure build-upload authorization, access to Android Vitals when available, and a physical test fleet/lab covering at least three devices (low-end Android, older supported iPhone, plus a third screen size/OS). These are needed for measured crash-free-session/ANR evidence, native startup profiling and real-device E2E; do not substitute Chromium/emulator results. No Sentry DSN/project or Firebase app binding is currently established in the repository. (M7)
8. **Release scope (recorded before hiding unfinished features)**: the release UI now hides the Caregiver Load, Career Decision Sprint, Night-Shift Reset, Parent Bridge, Nurse Guidance and Support Navigation service flows; multi-day programs; membership purchase actions; sample coach profiles/history and fabricated wellness summaries; pilot-only panels and unmeasured state dimensions; and research/model/professional-sharing switches without an implemented data flow. Their source and existing local records are retained. The working local assistant, mood check-ins, real guided-session history, live coach links and Personal Baseline remain available. Owner decision needed only if any hidden service must return before launch; restoring it requires its missing content/integration and validation. (M1)

### Public details to source

Owner instruction (2026-10-15): use https://zuporta.com/ for the public
company, contact, support and legal details. Retrieve these instead of
asking the owner to repeat information already published there.

- [x] Read the homepage and linked privacy/terms pages, record exact source URLs and retrieval date in `store/public-details.md`, and fill verified contacts, account deletion instructions, location and governing law into the app drafts. No registered entity or full postal address was present on the inspected pages; unresolved facts and the published age conflict are tracked in owner item #1.
- Keep bracketed placeholders for facts that cannot be verified. Do not infer a legal entity from branding, invent a support email, or copy website data-retention, account-deletion, minimum-age or jurisdiction provisions into the app policy without checking their scope and the app's behavior. Record any genuinely unresolved fact in the owner list after inspecting the source.

---

## Run log

- 2026-10-14 — Audit done, roadmap written, M1 work started (legal page drafts, Settings links, "prototype" wording removed).
- 2026-10-15 — M1: replaced all six user-visible "prototype" messages with accurate storage, sample-data and unavailable-feature copy; verified the consent sheet, wellness view, all seven module scope sheets and three toasts in Chromium (no runtime errors), plus JavaScript syntax and diff checks. Legal approval remains blocked on owner #1.
- 2026-10-15 — Recorded the owner's instruction to source public business/support/legal details from zuporta.com; replaced repeat requests for those details with a source-retrieval task. HTTPS retrieval was blocked by the environment proxy (403); saved the two site hostnames in the network draft. No public facts or legal approvals were inferred.

- 2026-10-15 — M1 implementation: hid unfinished release surfaces after recording scope, replaced sample summaries/history with device records, completed Baseline support navigation, collected explicit after ratings, migrated inactive consent choices and implemented on-device suggestions. Verified website contacts/law and documented remaining legal gaps; added repeatable browser regression checks including offline reload and deletion. M1 now has only owner-dependent legal work.

- 2026-10-15 — Owner confirmed support@zuporta.com and US-only launch, waived multi-country human crisis-resource verification, and required evidence-based release gates. Added `RELEASE_GATES.md`; production store submission/rollout remain held until build/static analysis/tests, physical-device E2E, monitoring, startup, backend, privacy and listing audits pass.
