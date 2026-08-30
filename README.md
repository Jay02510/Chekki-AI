<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1AvvkIjLuX1xEiE6c8yrhVJtt6g9Lrb4d

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Recent hardening updates

The current release includes the remaining audit remediation work for core product flows:

- Restricted CORS and tightened auth checks for the school/teacher redemption and subscription APIs.
- Added fail-closed admin handling so missing configuration does not silently allow privileged actions.
- Replaced the external QR dependency with a local SVG-based generator and hardened markdown rendering for AI-generated content.
- Added seat-limit protection for teacher class creation and verified the app still builds successfully.
- Deployed `firestore.rules` to the live Firebase project (was previously written but never pushed).
- Consolidated the four `redeem-*` serverless functions into one `api/redeem.ts` (with `vercel.json` rewrites preserving the old URLs for already-shipped native app builds) to stay under Vercel Hobby's 12-function cap.
- Added director roster/class CSV export (client-side, no new serverless function).
- Stood up CI (GitHub Actions: typecheck, test, lint (report-only), build on every push/PR to `main`) and a first unit test suite (Vitest) covering seat-limit math and CSV field escaping.
- Added Sentry error monitoring for both the frontend (`@sentry/react`, via `VITE_SENTRY_DSN`) and the Vercel API functions (`@sentry/node`, via `SENTRY_DSN`); no-ops until those env vars are set.
- Split `src/pages/TeacherPage.tsx` (was 4,678 lines, one component for all three staff roles) into role-scoped hooks and shell components — director/FT/KT each render from their own tab-content/sidebar-nav components off shared state hooks, cutting regression risk when one role's code changes.
- Added two director-only dashboard tools: a sortable/searchable/filterable Student Database grid (`@tanstack/react-table`) and a Log Compliance Tracker (per-class daily log submission rollup with miss-streak badges) — both read/aggregate over existing data, no new backend.
- Closed a Firestore rules gap where a foreign teacher could self-approve their own parent report and bypass Korean-teacher review entirely.
- Fixed Kakao login token verification to check the token was issued for this app specifically, not just any Kakao app.
- Added a director self-service flow to export or request deletion of a school's data, plus a schools-version privacy policy addendum.
- Fixed a misleading "please retake the photo" error shown during a genuine Gemini rate-limit/outage instead of a real scan failure.
- Pinned Vercel serverless functions to the Seoul region to cut cross-Pacific latency for Firestore round trips.
- Added a FAQ section to the schools landing page.
- Improved geo/local SEO signals (JSON-LD, hreflang, geo meta).
