# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

Ships as a Capacitor-wrapped app on iOS/Android plus a web landing page. One shared design language across all platforms by explicit decision — no per-OS (HIG vs. Material) divergence.

## Users

Four roles, two connected surfaces:

- **Parent** ("Min-ji," 34) — mother of a 5–7yo in an English Kindergarten/hagwon in Korea. Not fluent in English, tired after work. Uses the parent-facing app (`App.tsx` root, mobile-first).
- **Foreign Teacher (FT)** ("David," 28) — native-English instructor. Needs a fast way to log what happened in class and flag which kids need help, without writing Korean.
- **Korean Teacher (KT)** — bilingual staff member who liaises with parents; reviews the FT's log, corrects the Korean parent-facing version, sends it.
- **Director** — academy owner/admin; sets up classes, invites staff and parents, sees the whole campus at a glance.

FT/KT/Director each get their own dashboard (`NativeFtDashboard`, `NativeKtDashboard`, `NativeDirectorPortal`) rendered from one shared router (`src/pages/TeacherPage.tsx`), gated by role.

## Product Purpose

Take grading and Korean-language explanation of English homework off a tired parent's plate, then extend the same relief to the teachers and academies those kids attend. Tagline: "채점은 채키가, 칭찬은 엄마가" — "Grading by Chekki, Praise by Mom."

## Positioning

The academy product grades against the class's actual weekly answer key (teacher-uploaded, OCR'd into a `curriculums` doc) rather than an AI guess — materially more accurate than a standalone homework-scanning app, and it closes a loop competitors don't: a mistake made at home becomes visible to the teacher, and what happens in class becomes visible to the parent, through one connected pipeline.

## Operating Context

The core loop (see `docs/PRD.md` §4): teacher uploads the week's worksheet/answer key → parent scans homework at home → AI grades against that real answer key → parent gets instant EN+KO explanation → mistakes aggregate into a class-level "what's the class struggling with" view → teacher addresses it in class → FT logs the day (increasingly via voice) → AI drafts a Korean parent update → KT reviews and sends → back to the parent.

Access is director-issued invite only (email link, code as fallback) — no self-serve shared class codes.

## Capabilities and Constraints

- Backend is Vercel serverless on the Hobby plan, capped at 12 functions — `api/analyze.ts` is the single consolidated endpoint nearly every AI task funnels through (worksheet grading, voice-fill extraction, question-answering, refinement). This is a real infra constraint, not a style choice: it rules out persistent-connection features (e.g. true speech-to-speech, token-streamed chat responses, audio-amplitude-reactive voice UI) without a plan/infra change. As of 2026-08-17, `InsightsChatPanel` and `VoiceFillAssistant` stay single-shot request/response for this reason — deliberately deferred, not overlooked, next time either surface gets touched.
- Full Korean/English parity is required throughout — Korean is the primary language for roughly half the user base (parents), not a secondary fallback.
- No documented accessibility standard beyond that i18n parity requirement (confirmed: not yet established, no WCAG level held as a requirement).
- Camera-scan → first rendered result should land well under 5s on a normal connection; this path (`App.tsx` → `/api/analyze` → Gemini vision → structured JSON rendered as overlays) is the most mature, most heavily-hardened part of the codebase.
- Firestore rules scope every read to the caller's own school/class; anything security-sensitive (invite codes, class membership, role/plan changes) is a server-only Admin SDK write, never a client-trusted field.

## Brand Commitments

Korean tagline "채점은 채키가, 칭찬은 엄마가" ("Grading by Chekki, Praise by Mom") is an explicit, binding brand statement, not placeholder copy.

## Evidence on Hand

- `docs/PRD.md`, `docs/SCOPE.md`, `docs/DECISIONS.md` are the canonical, actively-maintained product record (PRD supersedes nine prior overlapping docs — trust code and these three over anything in `docs/archive/`).
- `docs/WHATS_NEW.md` documents shipped-but-unannounced features in parallel EN/KO copy (voice-fill daily log, KT review queue, bulk teacher invite, Insights chat).
- No validated success metrics yet (scan completion rate, retention, FT→KT turnaround, free→paid conversion are all stated in the PRD as unvalidated hypotheses, not settled numbers) — do not present them as proven in any surface copy.
- Landing-page testimonials were removed deliberately (`docs/DECISIONS.md` #013) for lacking real attribution — do not reintroduce testimonial-style social proof without a real, attributable source.

## Product Principles

1. The core loop (answer-key-grounded grading → parent explanation → mistake aggregation → teacher action → FT log → KT-reviewed parent send) is the product; anything not in service of it is scope creep (`docs/SCOPE.md` is authoritative on what was deliberately cut).
2. Korean is not a secondary language in any surface — copy, forms, and error states need real parity, not machine-translated afterthoughts.
3. Reliability of failure matters as much as reliability of success — swallowed/generic errors on `/api/analyze` or Firestore reads have been a recurring real bug class (`utils/describeError.ts`, `utils/validate.ts` exist to standardize this).
4. New teacher-facing features are validated against actual logged friction (see how voice-fill, the KT queue, and bulk invite were each scoped from a specific observed pain point in `DECISIONS.md`), not built speculatively.
5. Nothing AI-drafted reaches a parent without a human (KT) confirmation step in the loop — this is a standing product/trust constraint, not just today's implementation.
6. Never fabricate data to fill a UI pattern — a trend/sparkline, a stat, a chart stays absent rather than backed by invented numbers. Teachers and directors read these as real signal about real kids; a decorative placeholder that looks like data is a trust violation, not a style gap. (Confirmed 2026-08-17: `StatTile`'s optional sparkline shipped unused on the Enrolled Students card specifically because no real historical time-series exists yet — ship without it, don't invent one.)

## Accessibility & Inclusion

No specific accessibility standard or user-need is currently established as a requirement (confirmed during init — recorded as an open gap, not a decision to skip it). Korean/English parity (see Capabilities and Constraints) is the one confirmed inclusion requirement.
