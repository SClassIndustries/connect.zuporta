# Zuporta+ — App Store & Google Play readiness

This file is the single source of truth for getting Zuporta+ into the
Apple App Store and Google Play. A scheduled Codex session works
through it every 2 hours: it picks the first item that is not done
and not blocked, does the work, checks the box, and commits to
`jet/kind-maxwell-nzz6vr`. If an item is blocked on something only the
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

## Milestones

### M1 — Roadmap, legal pages, honest copy
- [x] Write this roadmap.
- [x] Draft `privacy.html` (privacy policy) and `terms.html` (terms of use), served from the same site.
- [x] Link both from Settings in the app and add them to the service worker shell.
- [x] Remove "prototype" wording from the in-app About card.
- [x] Remove the remaining user-visible "prototype" wording: `app.js` consent sheet, wellness view, modules panel, and booking/program/membership toasts. Retain clear sample-data and unavailable-feature disclosures.
- [ ] Hide or finish features the app itself says are not built (the modules panel lists unavailable service capabilities). Apple rejects apps with placeholder or demo features (2.1). Record any proposed feature removal under "Needs from the owner" first.
- [ ] The consent toggles "Contribute to wellness research" and "Help improve the models" record a choice but nothing is sent anywhere. Either remove them or build the real flow; store privacy answers must match the code.
- [ ] Owner reviews and approves the legal text. **BLOCKED — needs owner: approve the app-specific privacy policy and terms after the public company/contact details have been sourced from zuporta.com** (see Needs from the owner #1 and Public details to source below).

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
- [ ] Crisis resources verified against each provider's own website by a human.
- [ ] Final checklist against the current App Store Review Guidelines and Play Developer Policy.

### M8 — Submit
- [ ] Upload to TestFlight and Play internal testing.
- [ ] Submit for review on both stores. (Owner presses the final button.)

---

## Needs from the owner

Items the automated session cannot do. Each one unblocks the milestone named.

1. **Review the legal text** in `connect.zuporta.com/privacy.html` and `terms.html` after the public details below have been sourced. They are app-specific drafts written from what the code does; a lawyer or the business owner must approve them. Source the company and contact details from zuporta.com as the owner instructed; do not request those details again before checking that site. Published website terms do not establish approval of these app-specific drafts. (M1)
2. **Apple Developer Program** membership (US$99/year) under the business name, and the **Team ID**. (M2, M4, M6)
3. **Google Play Console** account (US$25 one-time), with identity verification completed. Organization accounts need a D-U-N-S number. (M4, M6)
4. **Signing secrets** added to the GitHub repo (Settings → Secrets and variables → Actions). The session will list exact names when M4 starts. Never paste keys into chat. (M4)
5. **Hosting access**: confirm where connect.zuporta.com is hosted (GoDaddy hosting or elsewhere) and how files get deployed from this repo, so `/.well-known/` files and the legal pages actually go live. (M1, M6)
6. **Allow access to the public source site**: review and save the environment network draft adding `zuporta.com` and `www.zuporta.com`, then publish the environment. The current proxy denies HTTPS access to zuporta.com with `403 Forbidden` before reaching the website. This blocks verification of public company, contact and support details; it does not mean those details are missing from the site. (M1, M5)
7. **Crisis numbers**: a human must verify each line in `assets/js/data.js` → `CRISIS` on the provider's own website for every country the app will be listed in. (M7)

### Public details to source

Owner instruction (2026-10-15): use https://zuporta.com/ for the public
company, contact, support and legal details. Retrieve these instead of
asking the owner to repeat information already published there.

- [ ] Read the site's linked legal and contact/support pages; record the exact source URLs and retrieval date, then use verified company legal name, postal address, appropriate contact email and support URL in the app drafts and store material. **BLOCKED — needs owner: apply the environment network changes in owner item #6**. The first retrieval attempt was denied by the environment proxy; no public details have been verified or copied yet.
- Keep bracketed placeholders for facts that cannot be verified. Do not infer a legal entity from branding, invent a support email, or copy website data-retention, account-deletion, minimum-age or jurisdiction provisions into the app policy without checking their scope and the app's behavior. Record any genuinely unresolved fact in the owner list after inspecting the source.

---

## Run log

- 2026-10-14 — Audit done, roadmap written, M1 work started (legal page drafts, Settings links, "prototype" wording removed).
- 2026-10-15 — M1: replaced all six user-visible "prototype" messages with accurate storage, sample-data and unavailable-feature copy; verified the consent sheet, wellness view, all seven module scope sheets and three toasts in Chromium (no runtime errors), plus JavaScript syntax and diff checks. Legal approval remains blocked on owner #1.
- 2026-10-15 — Recorded the owner's instruction to source public business/support/legal details from zuporta.com; replaced repeat requests for those details with a source-retrieval task. HTTPS retrieval was blocked by the environment proxy (403); saved the two site hostnames in the network draft. No public facts or legal approvals were inferred.
