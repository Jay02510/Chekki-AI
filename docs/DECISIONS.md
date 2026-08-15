# Chekki AI — Decisions Log

**Companion docs:** [`PRD.md`](./PRD.md), [`SCOPE.md`](./SCOPE.md)

Lightweight decision records — context, decision, status, consequences. Newest first. Add an entry whenever a non-obvious product or architecture call gets made, especially ones that trade something off; the reasoning is worth more than the decision itself once time has passed and the "why" isn't obvious from the code anymore.

---

## 006 — Consolidate documentation into PRD/Scope/Decisions

**Date:** 2026-08-15
**Status:** Resolved

**Context:** `docs/` had grown to 25 markdown files, several unedited since the project's original scaffolding (June 2026), overlapping in claimed authority (a "PRD," a "Master Specification," a "Project Oversight" doc, a "Product Overview" all separately claiming to describe the product). At least one — the Master Specification — actively described cut features (report studio, brand logo management) as core.

**Decision:** Replace the 9 overlapping product/strategy docs with three: `PRD.md` (what and why), `SCOPE.md` (in/out and why), `DECISIONS.md` (this file). Archived the old 9 to `docs/archive/` rather than deleting — preserved for history, explicitly not authoritative. Engineering docs (`DATABASE_SCHEMA.md`, `DESIGN.md`, `TDD.md`, etc.) and marketing/GTM docs left untouched — different job, not contradicting anything found.

**Consequences:** Anyone editing product docs going forward should treat these three as the whole surface, not add a fourth. If `docs/archive/` content turns out to still be needed for something (e.g. the Korean PG payment strategy notes in the old Project Oversight doc), pull the relevant piece into the live docs rather than reviving the whole file.

---

## 005 — Cut five scope-creep features from the parent/staff apps

**Date:** 2026-08-15
**Status:** Resolved

**Context:** A stabilization audit (prompted by bugs surfacing across nearly every major feature touched in one session) mapped the codebase against the founder's description of the intended core loop. Five features were found to be tangential: dead code, a demo page duplicating the real UI, a branding editor, a referral-flyer tool, and a "community" feature built on fake mock content.

**Decision:** Cut all five — see `SCOPE.md` for the itemized list and reasoning. Flashcards and the mistake-review/practice-sheet modal were considered in the same pass and explicitly *kept* — both are live features directly serving the core loop, not creep, despite surface-level resemblance to "extra stuff."

**Consequences:** ~2,240 lines removed. Reduces surface area for future bugs. The academy-logo *display* still works (a previously-set logo still renders); only the editing UI was removed, so if branding turns out to matter to directors, it's a small, contained feature to reintroduce.

---

## 004 — Invest in shared error-handling and validation helpers, not a full sweep

**Date:** 2026-08-15
**Status:** Resolved

**Context:** The same underlying failure (e.g. a dropped network call) was surfacing as three different broken UI states depending which hand-rolled catch block caught it: a silently-empty list, a generic banner, or a bare error code with no explanation. Separately, a non-string field from a Firestore doc reached `.trim()` with no validation at the read site and no error boundary to contain the crash, blanking an entire dashboard tab.

**Decision:** Build two reusable utilities (`utils/describeError.ts`, `utils/validate.ts`) and an `ErrorBoundary` component. Apply them at the specific sites that caused the bugs just found, as the reference pattern — **not** a retroactive migration of every existing catch block in the app. Adoption is opt-in as code gets touched going forward.

**Consequences:** New bugs of this shape should be cheaper to fix (reach for the shared helper, not invent a new pattern). Existing untouched catch blocks still have the old inconsistent behavior until someone touches that code again — this is a deliberate, bounded investment, not a completed migration.

---

## 003 — Default the invite login modal to Sign Up, not Sign In

**Date:** 2026-08-15
**Status:** Resolved

**Context:** A director-pushed invite almost always targets a parent with no existing account. The login modal defaulted to "Sign In" regardless, so most invited parents hit a confusing "no account found" failure before ever finding the Sign Up toggle.

**Decision:** When a pending invite/class code is present, default to Sign Up instead of Sign In. Added symmetric handling both directions (`auth/user-not-found` → flip to Sign Up; `auth/email-already-in-use` → flip to Sign In) so a wrong guess in either direction self-corrects instead of dead-ending.

**Consequences:** Should reduce first-time-parent login drop-off. Doesn't address the harder question below (003 is a UX mitigation, not a fix for having two access paths at all).

---

## 002 — Add a feedback/bug-report entry point to the staff dashboard

**Date:** 2026-08-15
**Status:** Resolved

**Context:** `FeedbackModal.tsx` existed and worked, but was only reachable from the parent-facing app. The director/FT/KT staff dashboard had no path to report a problem at all.

**Decision:** Reuse the existing component in the staff settings modal rather than build a second one. Tag submissions with `userRole` so admin can triage parent vs. staff reports in the same `feedback` collection. Removed a parent-specific success message ("You are doing an amazing job, Mom!") that didn't fit a teacher reporting a bug.

**Consequences:** Staff now have a way to report issues without emailing support directly. If report volume from each surface diverges a lot, may be worth splitting into separate collections or routing later — not needed yet.

---

## 001 — Open question: two parent access paths, no canonical one

**Date:** 2026-08-15
**Status:** Open — not yet decided

**Context:** A parent can join a class two ways: a self-serve 6-digit class code (entered manually, works for anyone who has it), or a director-generated invite link (pre-seeds an allowlist entry, tighter security, no typing required). Both are fully live. Several bugs fixed in this session lived exactly at the seam between the two (login modal not knowing which case it's in, invite panel not reflecting redemption state clearly).

**Options considered, not yet chosen between:**
- **Keep both indefinitely**, treat the redundancy as intentional (different parents prefer different paths — some get a physical code from the academy, some get an emailed link).
- **Designate the invite link as canonical**, keep the class code as a documented fallback for parents who lose the link or whose director prefers the low-tech option.
- **Deprecate the class code entirely**, push everyone through invite links, accept the loss of the walk-up "just type this code" simplicity that was the product's original access model.

**Why this isn't resolved yet:** it's a product call about who the target user actually is (a parent who wants zero friction vs. an academy that wants access control), not an engineering one. Needs the founder's input before either path gets deprecated.
