# Privacy and content declaration worksheet

This is a source-backed draft for the exact Zuporta+ release. The account
owner submits the console forms after resolving retention/eligibility and
checking the configured SDKs. Do not select “no data collected” by default:
coach HTTP logs and optional Sentry reports need to be included.

## Actual data flows

| Data | Location and destination | User control |
| --- | --- | --- |
| Optional display name, wellness entries, mood/sleep scores, guide conversation, guided ratings, Personal Baseline, activity log | Local WebView/browser storage; no app/backend upload |
| Public coach directory | HTTPS GET from api.zuporta.com; server receives request metadata/IP; public profiles cached locally | Internet-dependent; local wellness entries are absent from requests |
| Reminder time/enabled state, haptics and personalization choice | Device storage; OS stores a generic notification schedule | Off/on or deletion scope described in Settings/privacy policy |
| Public exercise instructions | Device share sheet/selected recipient or browser clipboard | Sent only after explicit user action; no entries, scores, name or conversation included |
| Optional technical crash and hang reports, OS/device/app details, anonymous installation identifier, session counts | Sentry, only in native builds with SENTRY_DSN and explicit diagnostics opt-in | Off by default; switch off in Settings; already-sent records follow project retention |
| Coaching website accounts, sessions and payment details | Separate zuporta.com browser service and its processors | Website policy/account-deletion process; not copied into the local wellness app |

## Apple App Privacy draft

- No tracking or advertising SDK is configured; no ATT permission is needed
  for the implemented flows. The app does not sell data or link activity
  across other companies' apps for advertising.
- Local wellness content is not collected off-device by this app. Do not
  declare it as uploaded health data based solely on local storage.
- With configured optional Sentry monitoring, review **Diagnostics → Crash
  Data / Other Diagnostic Data** and **Identifiers → Device ID** for app
  functionality. The SDK may use an anonymous installation identifier;
  do not assume that makes all diagnostic data exempt from disclosure.
- No account ID/name is attached to Sentry by app code. Review whether the
  SDK/project's installation identifier, IP settings and retention qualify
  the final answer as “linked” or “not linked”; server settings matter.
- Coach API/server IP logging needs an operational answer. If retained or
  combined with other records, classify the resulting data accurately.
  Do not assert transient processing or zero retention without evidence.
- `PrivacyInfo.xcprivacy` is bundled with the app. Its conservative
  optional diagnostics declarations cover crash data, other diagnostics and
  device ID, for app functionality with no tracking. Required-reason API
  declarations from dependencies must remain in the built SDK resources;
  inspect the final archive's privacy report in Xcode.

## Google Play Data safety draft

- **Collected:** evaluate optional Crash logs, Diagnostics and Device or
  other IDs for Sentry; declare collection as optional when the release
  retains the tested opt-in behavior. Evaluate coach-server request logs/IP
  against the current definitions and actual backend retention.
- **Sharing:** a contracted service provider processing only on the
  developer's behalf may qualify for Google's service-provider exception;
  confirm the actual Sentry agreement/configuration. User-directed sharing
  of public instructions is a separate user action. Do not label all
  third-party transfers “not shared” without applying the current criteria.
- **Encryption in transit:** app network endpoints use HTTPS. Verify the
  final native origins, external sites and Sentry DSN with real devices.
- **Deletion:** local wellness deletion is in Settings. Native reminder and
  diagnostics switches are separate. Website accounts use the website's
  process; confirm it works before representing account deletion to users.
- **Permissions:** INTERNET, network state, notification opt-in and reboot
  restore; no location, contacts, camera, microphone, advertising ID or
  exact-alarm permission. Android build removes the notification plugin's
  unused WAKE_LOCK/SCHEDULE_EXACT_ALARM declarations.

## Health apps declaration

Declare the implemented general wellness/stress-support and self-management
features. The app offers no diagnosis, medical treatment, medication advice,
medical-device functionality, regulated clinical workflow, HealthKit or
Health Connect access. Follow the console's current categories. A coaching
website link does not make the companion a licensed clinical service.

## Content and age questionnaires

Complete Apple and IARC questionnaires from these behaviors:

- Rule-based private wellness guide; no generative AI service.
- No user-to-user messaging, public UGC feed or social profile in this app.
- External coaching site has its own account/session flows in the browser;
  disclose that access when answering browser/messaging questions.
- Wellness and crisis-support discussion; no graphic injury, sexual
  content, gambling, simulated gambling, weapons or advertising features.
- No parental-consent or child-account flow is implemented. Resolve the
  app's minimum age and target audience before finalizing either form.
- Questionnaire-generated rating and legal eligibility are distinct. Do not
  force an arbitrary store rating to stand in for the legal-age decision.

## Required owner facts

1. Actual API/hosting HTTP-log retention and whether IPs are stored or used
   for geolocation; associated processors and deletion practice.
2. Sentry project/DSN, retention, region, IP scrubbing and processor terms.
3. Minimum age and an approved consistent privacy policy/terms with date.
4. A functioning external account-deletion path if the linked coaching
   service's account flows are offered in the reviewed experience.
5. Any additional SDK, payment, website or data-flow changes introduced
   during QA. Rebuild/re-audit if these change what ships.
