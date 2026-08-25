# Chekki AI — Secret & Access Incident Runbook

If an API key, admin passcode, or other credential leaks (committed to git, pasted somewhere public, seen in a log), work through this in order. Don't wait to "figure out how bad it is" first — rotate, then investigate.

---

## 1. API keys (Gemini, Firebase, Kakao, Apple, etc.)

1. **Identify which key.** Check `.env` / Vercel project env vars for the name, and confirm which service issued it.
2. **Rotate in the issuing console** — generate a new key/secret there first, before touching this repo:
   - Gemini: Google Cloud Console → APIs & Services → Credentials.
   - Firebase Admin: Firebase Console → Project Settings → Service Accounts → generate new private key.
   - Kakao: Kakao Developers → App → App Keys.
   - Apple (subscription webhook secret): App Store Connect → shared secret.
3. **Update Vercel env vars** with the new value (Project Settings → Environment Variables), for every environment (Production, Preview, Development) the old key was set in.
4. **Redeploy** so the new value is live.
5. **Revoke the old key** in the issuing console — don't just stop using it, actually delete/disable it. A key that still validates is still a live risk even if the app no longer sends it.
6. **Confirm revocation** — retry a request with the old key and confirm it's rejected.

**Known open issue (2026-08-21):** `git log -p --all` contains at least 4 real API keys committed in the past (Gemini key `AIzaSyC6aAD6Mng6uC7dzi5t3GiqN6CpDsjycqg` confirmed, three more flagged by audit). Rotation is intentionally deferred — see `docs/DECISIONS.md` #020 for why and what to watch before doing it.

**Known open issue (2026-08-25):** The Firebase Admin service-account private key (`FIREBASE_SERVICE_ACCOUNT`) was printed in full to a local terminal session while diagnosing a production Firestore rules bug (`source .env` re-exported it as a shell variable, and the debug command echoed it). Not committed to git or posted anywhere external, but it did land in local shell/terminal scrollback — rotate per step 2 above (Firebase Console → Project Settings → Service Accounts → generate new private key) if that has not already been done, and confirm the old one is disabled, not just unused.

## 2. Admin passcode (`api/admin.ts` / `ADMIN_PASSCODE`)

1. Rotate the value in Vercel env vars, redeploy.
2. Since this passcode currently gates impersonation, account deletion, and school creation with no per-admin identity, treat *any* suspected exposure as equivalent to full admin compromise — check `adminAuditLog` in Firestore for actions taken in the suspected exposure window.
3. Longer-term fix (not yet done — single-admin operation currently makes this lower urgency): move from one shared passcode to per-admin Firebase accounts with a server-side admin-role check, so a leak doesn't grant blanket access and individual admin actions are attributable. Revisit when a second admin/ops person is added — see `docs/DECISIONS.md` #020.

## 3. Firebase Auth (user account compromise, not admin)

Firebase handles session invalidation automatically on password reset; no extra action needed beyond confirming the affected user actually completes a reset. For a suspected mass-compromise (e.g. a leaked export of user records), rotate the Firebase Admin service-account key (§1) since that's what would have made bulk access possible.

## 4. After any rotation

- Note what leaked, when, and what was rotated in this file's history (git blame) or a dated note in `docs/DECISIONS.md` if it's a new pattern, not just a repeat of a known one.
- If the leak came from a git commit, the key is still visible in history even after rotation — rotation neutralizes it, but don't treat history-scrubbing as necessary or worth the disruption it'd cause to a live app (see #020 for why a rewrite was rejected here).
