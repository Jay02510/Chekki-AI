# Chekki AI - Portfolio Portfolio Copy-Paste Blocks

Below are three real incidents, diagnostics, and resolutions based on actual bugs and issues resolved during the development of **Chekki AI**. You can copy and paste these directly into your portfolio sections.

---

## Option 1: Social Authentication Race Condition (React State & Firestore Sync)
Use this if you want to showcase your understanding of state management, race conditions, and user session flows.

*   **Column 1: SILENT INCIDENT**
    During beta testing, users signing up via social providers (Apple or Kakao) experienced a frustrating issue where they were redirected to the home screen after auth completion but were immediately shown as unauthenticated or kicked back to the login screen.
*   **Column 2: DEEP DIAGNOSTIC PATH**
    The Firebase `onAuthStateChanged` listener was firing instantly upon OAuth redirection. It immediately queried Firestore for the user's custom profile before the signup handler had finished writing the new profile record. Finding no profile, the listener set the React state `userProfile` to `null`, creating a race condition that overwrote the profile context just as the signup flow was finishing.
*   **Column 3: PRODUCTION RESOLUTION**
    Introduced a synchronization ref (`isSigningUpRef`) to lock the auth state listener during active account creation. If a signup is in progress, the global listener defers state resolution, allowing the signup handler to write the profile to Firestore first and then trigger a single, atomic state update once the record is secure.

---

## Option 2: Apple Sign-In Configuration & Verification Failures on Physical iOS Devices
Use this if you want to showcase mobile development (Capacitor/iOS), OAuth flows, and hardware-specific debugging.

*   **Column 1: SILENT INCIDENT**
    While Apple Sign-In worked seamlessly in simulators, it failed silently or threw cryptic native validation errors on physical iOS devices, preventing beta testers from registering or accessing their accounts on their phones.
*   **Column 2: DEEP DIAGNOSTIC PATH**
    Two critical integration mismatches were identified: first, the mobile plugin sent an Apple client ID (`com.chekki.ai.ios`) that mismatched the primary iOS application bundle identifier (`com.chekkiai.app`). Second, Apple's physical device security requirements rejected Firebase Auth requests due to a static state token (`12345`) and the absence of a cryptographically secure, SHA-256 hashed nonce.
*   **Column 3: PRODUCTION RESOLUTION**
    Aligned the client ID configuration across all Capacitor and native Xcode settings. Implemented a utility to generate cryptographically secure nonces, passing the SHA-256 hashed nonce to Apple and the raw nonce to Firebase Auth, securing verification on physical hardware.

---

## Option 3: Vercel Serverless Key Parsing & Model Fallback Crashes
Use this if you want to showcase backend infrastructure, environment variable formatting, and LLM orchestration.

*   **Column 1: SILENT INCIDENT**
    When deployed to Vercel, the worksheet analysis backend occasionally crashed with `500 Server Error` under load, halting grading functions for all active parents, despite working flawlessly in local development.
*   **Column 2: DEEP DIAGNOSTIC PATH**
    Debugging the cloud logs revealed two distinct failures: Vercel environment variable parsing stripped double quotes and escaped newlines (`\n`) from the Firebase Service Account key, corrupting credential initialization. Simultaneously, transient API rate limits on Gemini models triggered a fallback to a deprecated model ID (`gemini-1.5-pro`), causing cascade errors.
*   **Column 3: PRODUCTION RESOLUTION**
    Rewrote key loading to sanitize PEM keys, replacing stringified `\n` characters with raw byte newlines dynamically. Updated the LLM fallback router to use the stable GA model (`gemini-2.0-flash-001`) and implemented a timeout race to prevent serverless execution hangs.
