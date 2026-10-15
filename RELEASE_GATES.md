# Zuporta+ release gates — US launch

Owner requirements recorded 2026-10-15. These gates apply to the exact
signed build and store metadata proposed for release. No App Store or
Google Play submission for review or production rollout is authorized until every
applicable gate passes. A checked implementation task is not release
approval. Keep all changes on `jet/kind-maxwell-nzz6vr`; do not merge PR #1.

## Required evidence

| Gate | Pass condition | Required evidence |
| --- | --- | --- |
| Build | Android release bundle and iOS archive validate successfully | Green CI links, commit SHA, version/build numbers and artifact checksums |
| Static analysis | Android Lint, relevant Kotlin/Java checks, Xcode analyzer and SwiftLint, plus web lint pass without unexplained failures | Current CI reports for the release commit; mark inapplicable tools with a reason, never as passed |
| Unit/integration | Relevant business logic and native/web integration tests execute and pass | Test counts and current runner results, with skipped tests distinguished |
| Core journey on physical devices | Guided activity, mood check-in, Baseline, history/deletion, permissions, links, offline/reconnect and reminders pass on at least three physical devices | Include a low-end Android, an older supported iPhone, and a third device spanning screen size/OS; record model, OS, build, results and logs; emulator or desktop-browser runs do not satisfy this gate |
| Stability | No unresolved observed crashes or ANRs; measured crash-free sessions at least 99.5%, with no release regression | Configured Crashlytics or Sentry, Android Vitals where available, and a dated report naming build, observation window, session denominator, crash-free rate and ANR findings; missing telemetry/sample evidence means pending |
| Cold start | Under 2 seconds on mid-range physical devices | Android Studio Profiler/adb and Xcode Instruments traces for representative supported hardware; define the measurement boundary, record repeated cold launches and the observed distribution; no desktop-browser timing substitutes |
| Production backend | Correct production HTTPS endpoints, valid certificates and working error/offline recovery | Requests and end-to-end evidence from the actual native origins; no production backend pointing at localhost, remote dev server, test account data or bundled credentials; Capacitor’s internal on-device origin is not a backend endpoint |
| Content | No lorem ipsum, test images, debug menus, console logs, fictional personal data or unfinished screens in the shipped UI | Audit the packaged web assets and native binary, including fallback paths and bookmarked routes; archived source hidden from the release UI is not an exposed feature |
| Privacy/permissions | Live app policy URL and store privacy forms match every SDK, actual collection, retention and deletion path | Approved policy; reachable URL; Apple privacy manifests including required-reason APIs; permission-purpose strings only for used features; contextual prompts; SDK inventory and completed Apple/Play answers |
| Payments | Digital purchases, if offered, follow StoreKit on iOS and Play billing requirements; configured products and Restore Purchases work | Sandbox purchase/restore/cancel tests and current official policy review; if no digital goods are offered, document and verify that fact; do not expose dead purchase controls |
| Reviewer access | Reviewers can exercise all offered features | Clear instructions and working review credentials supplied securely if any required sign-in/payment path needs them; no credentials in Git |
| Metadata parity | Screenshots, descriptions, age/content ratings, What's New, supported devices and app behavior agree | A dated listing-to-build audit; US-only store availability; no claim that has not been demonstrated in the build |
| Store policy | Current official Apple/Google rules checked, not just third-party summaries | Official-source URLs, verification dates and resolved findings; web Lighthouse results alone cannot satisfy store compliance |

## Release decision

The required order is:

**build → lint/static analysis → unit/integration tests → core E2E on real
devices → monitoring shows no regressions → privacy/listing/store audits →
owner submission approval.**

GitHub Actions must keep production submission/rollout separate from ordinary
branch validation. Signing secrets being present does not satisfy the gates.
Authorized TestFlight/internal testing can collect QA and monitoring evidence
when accounts and signing are available; it is not approval for production
release. The owner presses the final submission button after the gates pass.

Lighthouse CI 90+ is an additional internal web-performance target. It does
not establish native startup time, crash-free sessions or store compliance.

## Scope and open prerequisites

- Launch market: United States only. Support: `support@zuporta.com`
  (confirmed by owner and published website).
- The owner removed the requirement for a human to verify crisis resources
  for every launch country. Verify the US resources against their official
  providers; do not treat the waiver as verification of a phone number.
- Native projects and CI can be built without production signing. Distribution,
  real-device evidence and release monitoring still need the appropriate
  accounts, app bindings and devices. Track exact missing requirements in
  `STORE_READINESS.md`, and continue independent implementation work.
- No crash-free percentage, physical-device result, cold-start result or
  monitoring deployment has been established by the current Chromium web
  regression checks.
