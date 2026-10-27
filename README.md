# Chekki AI (채키)

AI homework grading for Korean English academies (hagwons) and the parents of their students.

A parent photographs a finished English worksheet. Chekki reads the child's handwriting, grades it against the class's real answer key, and explains each mistake in both Korean and English. For academies, those mistakes roll up into a class view for teachers, and the teacher's class log becomes a Korean parent report that a Korean teacher reviews before it is sent.

- Website: [chekkiai.com](https://www.chekkiai.com) · Academies: [chekkiai.com/schools](https://www.chekkiai.com/schools)
- [App Store](https://apps.apple.com/us/app/chekkiai/id6759361725) · [Google Play](https://play.google.com/store/apps/details?id=com.chekkiai.app)

## The problem

Many Korean parents pay for English academies but cannot check English homework themselves, and the teachers who can check it do not see the homework done at home. Generic AI chatbots guess the answer, so they mark correct work wrong when the academy's textbook expects a specific answer. Chekki grades against the teacher's own answer key and connects home and classroom in one loop.

## What is deployed

| Surface | Users | Where |
| --- | --- | --- |
| Parent app | Parents (Korean-first) | iOS and Android (Capacitor), and the web at `/app` |
| Schools dashboards | Directors, foreign teachers, Korean teachers | Web only, `/teacher` (also inside the native app, by role) |
| Landing pages | Parents, academy owners | `/`, `/schools`, `/faq` (Korean and English) |
| Textbook QR audio pages | Students using the printed book | `/e1/...`, static and separate from the app |
| Privacy policy | Everyone | `/privacy`, a static page that needs no JavaScript |

## Architecture

```
Capacitor app / browser (React 19 + Vite + Tailwind)
   │  Firebase Auth (Google, Apple, Kakao sign-in)
   │  Firestore (rules in firestore.rules)
   ▼
Vercel serverless functions in api/  (Seoul region, icn1)
   ├─ analyze.ts       every AI task: grading, worksheets, Q&A, voice log fill, parent reports
   ├─ redeem.ts, create-class.ts, create-teacher-invite.ts, set-initial-role.ts   school onboarding
   ├─ subscription-*.ts   Apple / RevenueCat entitlement checks and webhooks
   └─ admin.ts          admin tools behind a passcode
   ▼
Google Gemini API (gemini-2.5-flash; gemini-2.5-pro for harder tasks)
```

Some design choices worth knowing:

- **One AI endpoint.** Vercel's Hobby plan allows 12 functions, so nearly every AI task goes through `api/analyze.ts`. Requests are single request/response; there is no streaming.
- **Graded against the answer key.** Teachers upload the week's worksheet and answer key into a `curriculums` document, and grading for enrolled students uses it as ground truth.
- **Photos are not stored.** Worksheet photos go to Gemini and are dropped. Only the grading result is cached (keyed by a hash of the photo) for 30 days.
- **One codebase, two builds.** `index.html` is the landing site and `app.html` is the app. `npm run build:mobile` swaps them so the native app opens straight into the app.

More detail: [docs/README.md](docs/README.md) (PRD, scope, decisions, database schema, technical design).

## Running it locally

Requires Node 24 (the version CI uses).

```bash
npm install            # also applies patches/ via patch-package
cp .env.example .env   # fill in the values below
npm run dev            # http://localhost:3000
```

The minimum to grade a worksheet locally is `API_KEY` (Gemini) and `FIREBASE_SERVICE_ACCOUNT`. Every other variable in [.env.example](.env.example) (RevenueCat, Apple IAP, Resend, Sentry, Upstash) is optional; that feature switches off when its variable is missing. Admin actions fail closed without `ADMIN_PASSCODE`.

Native builds:

```bash
npm run mobile         # web build + cap sync, then open android/ or ios/ in the IDE
```

## Tests and CI

```bash
npm test               # Vitest unit tests in tests/
npm run test:rules     # Firestore security-rules tests against the emulator (needs firebase-tools)
npm run lint
npx tsc --noEmit
```

GitHub Actions ([.github/workflows/ci.yml](.github/workflows/ci.yml)) runs typecheck, unit tests, rules tests, Playwright end-to-end tests (emulators, mocked Gemini), lint (errors block, warnings are reported) and a production build on every push and pull request to `main`.

Unit tests cover the logic where a bug costs money or exposes data: seat limits, pricing tiers and invoices, join codes, roster validation, Apple receipt validation, AI JSON parsing, the curriculum grading guardrail, and parent-report rules.

## Security and privacy

- **Firestore rules** ([firestore.rules](firestore.rules)) scope reads and writes by role and school; for example, a foreign teacher cannot approve their own parent report. The rules have their own emulator test suite.
- **Server-side checks.** User-facing `api/` functions verify the caller's Firebase ID token; Apple webhooks are signature-checked. CORS is restricted, and admin actions fail closed when configuration is missing.
- **Rate limiting** with Upstash sliding windows on the AI and admin endpoints.
- **Sign-in tokens.** Kakao tokens are checked against this app's ID, and Apple purchases are verified server-side.
- **Data handling.** See the [privacy policy](https://www.chekkiai.com/privacy) and [docs/PLAY_DATA_SAFETY_2026-10.md](docs/PLAY_DATA_SAFETY_2026-10.md) for what is collected, where it goes and how long it is kept. Account deletion is in the app (Settings → Delete Account). Schools can request a full export or deletion of their data.
- Incident and key-rotation steps: [docs/SECURITY_RUNBOOK.md](docs/SECURITY_RUNBOOK.md).

## Deploying

The `main` branch deploys to Vercel (`vercel.json` holds rewrites, headers and the CSP). Firestore rules and indexes deploy separately with `firebase deploy --only firestore`. iOS and Android releases are built from `ios/` and `android/` after `npm run mobile`.
