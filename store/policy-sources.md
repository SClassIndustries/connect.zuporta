# Official policy sources checked

Checked 2026-10-15 (Asia/Manila). These checks cover the subjects below;
they are not a completed submission audit or an assurance of approval.

| Subject | Official source | Finding |
| --- | --- | --- |
| Play target API | https://support.google.com/googleplay/android-developer/answer/11926878 | Starting August 31, 2026, new mobile apps and updates must target Android 16 / API 36 or higher. The wrapper uses compile/target API 36; the earlier API 35 roadmap minimum is superseded. |
| Apple completeness (2.1) | https://developer.apple.com/app-store/review/guidelines/#app-completeness | Remove placeholder content, test on-device, provide fully functional URLs and review login access if needed. Draft legal placeholders still block release. |
| Apple functionality (4.2) | https://developer.apple.com/app-store/review/guidelines/#minimum-functionality | Utility/features must go beyond a repackaged website. M3 native features and actual device validation remain required; a successful wrapper build is insufficient. |
| Person-to-person payments (3.1.3(d)) | https://developer.apple.com/app-store/review/guidelines/#other-purchase-methods | Real-time services between two individuals may use other payment methods; one-to-few/one-to-many services require IAP. Confirm the actual booking service matches this scope before review. Digital goods/subscriptions require their own current billing-policy review and purchase/restore tests if offered. |
| Apple privacy policy (5.1.1) | https://developer.apple.com/app-store/review/guidelines/#data-collection-and-storage | Policy must be linked in metadata and in the app and describe actual collection/use, third parties, retention and deletion. Review again after adding any monitoring or native SDK. |

The Apple and Play pages were retrieved successfully using normal HTTPS
certificate verification. The Capacitor documentation site returned HTTP
403; the installed version's package definitions, CLI, generated templates
and README provided the implementation reference for M2. This does not
block generating/building the projects.

Before submission, repeat the full Apple/Play audit against the exact signed
build, US storefront, current SDK inventory, privacy forms and store copy.

## Identity handoff checked 2026-10-16 (Asia/Manila)

- Apple Team ID: https://developer.apple.com/help/glossary/team-id/ — a
  ten-character membership identifier found after signing in and opening
  Membership details. An email address or numeric store listing ID is not it.
- Google Play app updates: https://support.google.com/googleplay/android-developer/answer/9859350 — updating an existing listing requires its package identity, appropriate signing and a higher version code. The owner chose a separate app, so preserve the old `com.zuporta.app` listing and prepare separate store records for the new project.
