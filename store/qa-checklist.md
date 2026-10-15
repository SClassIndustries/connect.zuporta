# Owner QA and remaining release evidence

Use the **exact signed release candidate** and record its commit, version,
build number and artifact SHA-256. Passing automated checks does not fill
these physical-device results. Requirements are from `../RELEASE_GATES.md`.

## Device results

Complete the table for at least three physical devices, including a low-end
Android and an older supported iPhone. Simulator/browser checks are separate.

| Device and OS | Build | Core flow | Offline and reconnect | Notifications | Haptics and sharing | Links and navigation | Result and evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Low-end Android — fill | Fill | Pending | Pending | Pending | Pending | Pending | Pending |
| Older supported iPhone — fill | Fill | Pending | Pending | Pending | Pending | Pending | Pending |
| Third device — fill | Fill | Pending | Pending | Pending | Pending | Pending | Pending |

## Core journey

- [ ] Fresh install shows empty history and no invented people/results.
- [ ] Complete mood check-in, guided reset and an explicit after/helpfulness rating.
- [ ] Complete at least three Personal Baseline check-ins and verify the
  confirmation/support/follow-up path using your own entries.
- [ ] Close/reopen; records persist on that device. Delete local wellness
  history; records disappear and the stated retained preferences remain.
- [ ] Enable a daily reminder after the explanation; deny permission,
  re-enable, change the time, disable it, and test delivery with the screen
  locked, after reboot, across timezone/DST and under battery restrictions.
- [ ] Breathing haptics and the Off preference work; leaving/backgrounding
  an exercise stops timers and feedback.
- [ ] Share only the public exercise; cancel sharing and return safely.
- [ ] External coach profile/sign-in/booking opens outside the local app.
  Test signed-out redirect, signed-in return, real availability/prices,
  failed requests and cancellation. Use the existing website's authorized
  test process; do not charge a real card merely to fill this checklist.
- [ ] If website account creation is offered to reviewers, verify an
  effective deletion route and its policy fit.
- [ ] Offline cold opening and reconnect work. Live coach/booking features
  clearly require a connection; no stale availability promise is relied on.
- [ ] Android Back, iPhone gestures, keyboard, cutouts, home indicator,
  portrait layouts and text scaling remain usable.
- [ ] VoiceOver/TalkBack announce controls; contrast, focus order,
  reduced motion and external links are usable.
- [ ] Deep links open the intended screen on cold/warm launch and fall back
  to the web app when the native app is absent.
- [ ] Review wellness wording and crisis routing/resources. This rule-based
  software does not establish clinical safety or monitor emergencies.

## Performance and stability

- [ ] Measure cold starts on mid-range devices using adb/Android Studio and
  Xcode Instruments. Define the launch boundary, record repeated runs and
  the distribution, and check the owner's under-two-second target.
- [ ] Use the configured Sentry project, enable diagnostics on the QA builds, verify event
  delivery and native crash/hang reporting, and review Android Vitals where
  available. Record the observation window, monitored-session denominator,
  crash-free percentage and ANR findings. Owner target: at least 99.5%
  crash-free sessions with no unresolved crash/ANR regression.
- [ ] Do not report unmonitored users as crash-free. A zero-event dashboard
  with no verified session population does not pass the monitoring gate.
- [ ] Check web Lighthouse against the owner's 90+ target separately from
  native startup; neither measure substitutes for the other.

## Compliance and mandatory documents

- [ ] Resolve minimum age and the published age-policy conflict.
- [ ] Confirm actual app/API HTTP-log retention and Sentry retention/IP settings.
- [ ] Approve the app privacy policy and terms and fill their approval date.
- [ ] Publish reachable, finalized policy/support pages with no draft brackets.
- [ ] Reconcile Apple App Privacy and Google Data safety with the exact SDK
  configuration; inspect the archive privacy report/required-reason APIs.
- [ ] Complete Play Health apps declaration, target audience and content
  forms, and Apple's current age questionnaire.
- [ ] Verify app display name, territory, screenshots, descriptions,
  copyright, support and reviewer contact information against the build.
- [ ] Confirm the actual external payment service fits the current
  person-to-person exception; review again if products/services change.
- [ ] Supply limited reviewer website access securely if required.
- [ ] Add the Play app-signing fingerprint, publish associations and verify
  signed-device app links. Apple Team ID is already recorded.

## Final result

- Candidate commit/version/build and hashes: **fill**
- Failures and corrections: **fill**
- Device QA approver/date: **fill**
- Legal/compliance approver/date: **fill**
- Store upload and submission owner: **fill**

Only mark release approval after all applicable gates pass. Uploading to
internal testing/TestFlight for evidence is separate from production release.
