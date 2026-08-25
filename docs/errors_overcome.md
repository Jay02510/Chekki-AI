# Chekki AI - Portfolio Portfolio Copy-Paste Blocks

Below are three real incidents, diagnostics, and resolutions based on actual bugs and issues resolved during the development of **Chekki AI**. You can copy and paste these directly into your portfolio sections.

---

## Option 1: Social Authentication Race Condition (React State & Firestore Sync)

Use this if you want to showcase your understanding of state management, race conditions, and user session flows.

- **Column 1: SILENT INCIDENT**
  During beta testing, users signing up via social providers (Apple or Kakao) experienced a frustrating issue where they were redirected to the home screen after auth completion but were immediately shown as unauthenticated or kicked back to the login screen.
- **Column 2: DEEP DIAGNOSTIC PATH**
  The Firebase `onAuthStateChanged` listener was firing instantly upon OAuth redirection. It immediately queried Firestore for the user's custom profile before the signup handler had finished writing the new profile record. Finding no profile, the listener set the React state `userProfile` to `null`, creating a race condition that overwrote the profile context just as the signup flow was finishing.
- **Column 3: PRODUCTION RESOLUTION**
  Introduced a synchronization ref (`isSigningUpRef`) to lock the auth state listener during active account creation. If a signup is in progress, the global listener defers state resolution, allowing the signup handler to write the profile to Firestore first and then trigger a single, atomic state update once the record is secure.

---

## Option 2: Apple Sign-In Configuration & Verification Failures on Physical iOS Devices

Use this if you want to showcase mobile development (Capacitor/iOS), OAuth flows, and hardware-specific debugging.

- **Column 1: SILENT INCIDENT**
  While Apple Sign-In worked seamlessly in simulators, it failed silently or threw cryptic native validation errors on physical iOS devices, preventing beta testers from registering or accessing their accounts on their phones.
- **Column 2: DEEP DIAGNOSTIC PATH**
  Two critical integration mismatches were identified: first, the mobile plugin sent an Apple client ID (`com.chekki.ai.ios`) that mismatched the primary iOS application bundle identifier (`com.chekkiai.app`). Second, Apple's physical device security requirements rejected Firebase Auth requests due to a static state token (`12345`) and the absence of a cryptographically secure, SHA-256 hashed nonce.
- **Column 3: PRODUCTION RESOLUTION**
  Aligned the client ID configuration across all Capacitor and native Xcode settings. Implemented a utility to generate cryptographically secure nonces, passing the SHA-256 hashed nonce to Apple and the raw nonce to Firebase Auth, securing verification on physical hardware.

---

## Option 3: Vercel Serverless Key Parsing & Model Fallback Crashes

Use this if you want to showcase backend infrastructure, environment variable formatting, and LLM orchestration.

- **Column 1: SILENT INCIDENT**
  When deployed to Vercel, the worksheet analysis backend occasionally crashed with `500 Server Error` under load, halting grading functions for all active parents, despite working flawlessly in local development.
- **Column 2: DEEP DIAGNOSTIC PATH**
  Debugging the cloud logs revealed two distinct failures: Vercel environment variable parsing stripped double quotes and escaped newlines (`\n`) from the Firebase Service Account key, corrupting credential initialization. Simultaneously, transient API rate limits on Gemini models triggered a fallback to a deprecated model ID (`gemini-1.5-pro`), causing cascade errors.
- **Column 3: PRODUCTION RESOLUTION**
  Rewrote key loading to sanitize PEM keys, replacing stringified `\n` characters with raw byte newlines dynamically. Updated the LLM fallback router to use the stable GA model (`gemini-2.0-flash-001`) and implemented a timeout race to prevent serverless execution hangs.

---

## Option 4: Firestore Security Rules Silently Denying List Queries (Cross-Document Reads)

Use this if you want to showcase root-cause diagnosis under pressure, Firestore internals, and building your own verification tooling instead of guessing.

- **Column 1: SILENT INCIDENT**
  Directors and teachers could not see their own classes, students, or roster — a core-loop-breaking production incident. Two prior fixes (a client-side staleness guard, a missing scoped query) were shipped based on sound reasoning about the client code, and neither resolved it. The Firestore security rules looked correct on inspection; nothing in the rule text explained the failure.
- **Column 2: DEEP DIAGNOSTIC PATH**
  Rather than re-reading rule text a third time, built a disposable server-side diagnostic: minted a real Firebase Auth custom token for the affected account and replayed the exact client-SDK queries with security rules actually enforced. The result isolated the failure precisely — a single-document `get()` on a known record succeeded under a rule, while a `list` query using the identical rule failed `permission-denied`. Root cause: Firestore denies an entire list query outright when its security rule depends on a `get()`/`exists()` call to a document unrelated to the query's own filter (here, a rule that read the *caller's own* profile document to check their role) — even though the same rule evaluates fine for a single-document read. This is an easy-to-miss Firestore limitation because it only manifests under `list`, not `get`.
- **Column 3: PRODUCTION RESOLUTION**
  Moved the role/schoolId checks from a Firestore `get()` lookup onto Firebase Auth custom claims, read directly off the caller's ID token — eliminating the cross-document read entirely. Fixed the two shared helper functions at their source so the fix propagated to eleven other rule blocks in one change, then audited every remaining client-side list query against the rules file by hand to catch the same pattern elsewhere (found and fixed three more affected collections). Added a forced ID-token refresh on session load so already-signed-in users pick up new claims without re-logging in, and a batched (not sequential, to avoid a serverless timeout) backfill for every pre-existing account.
