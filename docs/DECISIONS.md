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

## 001 — Deprecate the shared class code; director invite is the only access path

**Date:** 2026-08-15
**Status:** Resolved

**Context:** A parent could join a class two ways: a self-serve 6-digit class code (entered manually, shared class-wide), or a director-generated invite link (single-use, tied to one specific parent). Both were fully live. Several bugs fixed earlier in this session lived exactly at the seam between the two (login modal not knowing which case it's in, invite panel not reflecting redemption state clearly). On inspection, the shared class code was already gated behind a director-created allowlist entry (a prior audit fix) — so it wasn't actually open self-serve access, just a second, more confusing way to redeem something that already required an invite to exist first.

**Decision:** Removed the shared class-code path entirely. `api/redeem.ts` now only accepts a single-use, per-parent invite code (`pendingStudents.inviteCode`); the `classes.joinCode` branch, its allowlist-gate logic, and the "Code: XXXXXX" display on the director dashboard are gone. `api/create-class.ts` no longer generates a `joinCode` on new classes. Parent-facing copy (onboarding modal, settings, camera banner, landing/schools/FAQ pages) reworded from "enter your class code" to "enter your invite code" / "tap your invite link."

**Consequences:** One access path instead of two — closes the seam that was producing bugs. `redeem.ts`'s `redeemClassCode` function is meaningfully simpler (one lookup instead of two branches). Directors lose the "just hand out this code" low-tech option; every parent now needs an actual invite pushed to their email (`StudentInvitePanel`) before they can join, no exceptions. Existing `classes` docs may still carry a stale `joinCode` field — harmless, nothing reads it anymore. If this turns out to be too much friction for directors who preferred handing out a physical code/QR at orientation, revisit — but the option to do so is gone from the code now, not just de-emphasized.
