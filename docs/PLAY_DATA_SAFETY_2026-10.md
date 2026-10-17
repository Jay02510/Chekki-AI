# Google Play data safety: what the app actually does (17 Oct 2026)

The current Play data-safety form says "No data collected / No data shared". That is wrong: the app collects account, learning, purchase and diagnostic data. This file maps each real data flow (traced in the code) to the answers to enter in Play Console → App content → Data safety.

Play's definitions that matter here:
- **Collected** = data leaves the device to us or to a service provider acting for us.
- **Shared** = data goes to a third party *other than* a service provider. Firebase, Gemini, Sentry, RevenueCat, Vercel and Upstash process data on our behalf, so they count as collection, not sharing.
- **Processed ephemerally** = held only in memory to serve the request, never stored.

## Data flows found in the code

| Data | Where it goes | Stored? | Code |
| --- | --- | --- | --- |
| Name, email, sign-in provider ID | Firebase Auth, Firestore `users` | Until account deletion | `contexts/AuthContext.tsx`, `api/kakao-auth.ts` |
| Worksheet photo | `api/analyze.ts` → Gemini API | Not stored (photo is hashed for the cache key only) | `api/analyze.ts` |
| Grading result (questions, student answers) | Firestore `image_analyses_cache` | 30 days via `expiresAt` TTL field | `api/analyze.ts:1858` |
| Mistake history | Firestore `users/{uid}/data/mistakes` | Until account deletion | `services/database.ts:205` |
| Class scan summaries, parent reports, class logs | Firestore `classes/{id}/…` | While the school uses the service | `firestore.rules`, `src/pages/TeacherPage.tsx` |
| Teacher voice-log audio | `api/analyze.ts` (`voice_log_fill`) → Gemini | Not stored | `src/components/VoiceFillAssistant.tsx` |
| Audio Practice Room speech | OS speech recognizer on device | Never reaches our servers | `@capgo/capacitor-speech-recognition` |
| Subscription status, purchase history | Apple / Google, RevenueCat | Yes | `services/revenueCatService.ts`, `api/subscription-*.ts` |
| IP address | Upstash and Firestore `ratelimits` (rate limiting) | Short-lived counters | `api/analyze.ts:854` |
| Crash / error reports | Sentry (only if `VITE_SENTRY_DSN` is set at build time) | Sentry retention | `src/lib/sentry.ts` |
| Usage analytics | Google Analytics for Firebase, **web only**; disabled in the native app | GA retention | `services/database.ts:93` |
| School contact emails | Resend | Resend logs | `api/_lib/email.ts` |

## Answers to enter in Play Console

**Does your app collect or share any of the required user data types?** Yes.
**Is all user data encrypted in transit?** Yes (HTTPS only).
**Do you provide a way for users to request that their data is deleted?** Yes. In-app: Settings → Delete Account. Web: `https://www.chekkiai.com/privacy#deletion`.

| Play data type | Collected | Shared | Ephemeral | Required? | Purposes |
| --- | --- | --- | --- | --- | --- |
| Personal info → Name | Yes | No | No | Required | App functionality, Account management |
| Personal info → Email address | Yes | No | No | Required | App functionality, Account management |
| Personal info → User IDs | Yes | No | No | Required | App functionality, Account management |
| Financial info → Purchase history | Yes | No | No | Optional (only subscribers) | App functionality |
| Photos and videos → Photos | Yes | No | **Yes** | Required for grading | App functionality |
| Audio → Voice or sound recordings | Yes (teacher voice log only) | No | **Yes** | Optional | App functionality |
| App activity → Other user-generated content (answers, reports, class logs) | Yes | No | No | Required | App functionality |
| App info and performance → Crash logs, Diagnostics | Yes *if Sentry DSN is in the Android build* | No | No | Required | Analytics (app stability) |

Not collected by the Android app: location, contacts, device IDs/advertising ID, web browsing, app interactions analytics (Firebase Analytics is off on native).

## Open items to check before submitting

1. **Firestore TTL policy.** The code writes `expiresAt` on `image_analyses_cache` and `idempotency_keys`, but deletion only happens if a TTL policy is turned on for that field in the Firebase console (Firestore → TTL). Confirm it exists for both collections; otherwise the "30 days" promise is false.
2. **Sentry in the Android build.** Check whether `VITE_SENTRY_DSN` was set when the current Play build was made. If not, drop the crash-logs row.
3. **Gemini API tier.** On Google's unpaid Gemini API tier, Google may use prompts (children's homework photos) to improve its products. Confirm the project is on a paid tier, or the privacy policy needs to say so.
4. **Families policy / children under 14.** If the Play target audience includes children, the Families policy applies, and under Korea's PIPA, collecting data from a child under 14 needs a legal guardian's consent. Students can sign in to classes themselves (`studentUid` in `studentScans`). Decide whether accounts are always created by a parent or school; if not, a guardian-consent step is needed.
5. **In-app privacy text is stale.** `components/LegalModal.tsx` (native app) still says original photos are stored and lists only Firebase and Gemini. Replace that section with a link to `https://www.chekkiai.com/privacy` at the next app release.
6. **Store links.** Set the Play privacy policy URL to `https://www.chekkiai.com/privacy` and the website to `https://www.chekkiai.com` (not `chekki-ai.vercel.app`).
