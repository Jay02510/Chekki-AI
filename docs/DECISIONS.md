# Chekki AI — Decisions Log

**Companion docs:** [`PRD.md`](./PRD.md), [`SCOPE.md`](./SCOPE.md)

Lightweight decision records — context, decision, status, consequences. Newest first. Add an entry whenever a non-obvious product or architecture call gets made, especially ones that trade something off; the reasoning is worth more than the decision itself once time has passed and the "why" isn't obvious from the code anymore.

---

## 020 — Pre-pilot security audit: fix login enumeration + runbook now, defer key rotation and admin MFA

**Date:** 2026-08-21
**Status:** Accepted (partially deferred)

**Context:** Ran a 10-category security audit ahead of starting school-director outreach. Two items came back MISSING with real launch-relevance: (1) `LoginModal.tsx` returned distinct error strings for "no account with this email" vs "wrong password," letting an untargeted login attempt enumerate registered emails one guess at a time; (2) `git log -p --all` contains at least 4 real API keys committed in the past (Gemini key confirmed live-looking, three more flagged), and `api/admin.ts` gates impersonation/deletion/school creation behind one shared static passcode with no MFA or per-admin identity.

**Decision:** Fixed the login-enumeration issue immediately — `auth/user-not-found` and `auth/wrong-password` now both surface the same generic "Invalid email or password" message for untargeted login attempts (the invite-flow case, where the app already knows this is the user's own invited email, keeps its specific messaging since that's not an enumeration vector). Added `docs/SECURITY_RUNBOOK.md` with concrete rotation steps for API keys, the admin passcode, and Firebase Auth compromise.

Explicitly deferred both remaining items, on the operator's call:
- **API key rotation**: a prior rotation attempt broke the live App Store build. Deferring until that failure mode is understood and a rotation can be done without repeating it — tracked as the runbook's "known open issue."
- **Admin passcode → per-admin MFA**: only one admin (the operator) currently exists, so the "leaked shared secret = any of several people" blast radius the checklist item is designed against doesn't apply yet. Revisit when a second admin/ops person is added.

**Consequences:** The enumeration fix and runbook ship now, closing the two items that were pure upside with no real cost. The two deferred items remain real open risk (a leaked historical key is still live until rotated) — `docs/SECURITY_RUNBOOK.md` documents them explicitly so they aren't silently forgotten once school outreach starts and the pressure to revisit them drops.

---

## 019 — Loop diagram: 4-node honest loops + shortened headline/payoff copy

**Date:** 2026-08-19
**Status:** Resolved

**Context:** The `/schools` landing page's "Two loops, always turning" diagram (`SchoolLoopDiagram.tsx`) originally drew each loop as 3 nodes in a closed triangle. Review surfaced two problems: (1) each loop was missing its actual closing step — the teacher loop skipped "teach to the gap" between mistakes surfacing and the next week's upload, and the parent loop skipped "parent reads it" after KT sends, so the diagram implied the loop closed on an action neither role actually took; (2) drawing all edges identically implied the closing connection was as causal as the others, when it's really just the cadence restarting (reading a report doesn't cause tomorrow's log entry). Separately, while iterating reference images in Gemini, the headline/payoff copy got tightened to something punchier than the original code copy.

**Decision:** Both loops now render 4 nodes in a diamond layout. The first 3 connecting edges stay solid (real cause → effect); the closing edge (node 4 back to node 1) is dashed, dimmer, and carries its own "Every week"/"Every day" cadence label instead of sharing one generic center label — visually distinguishing "this caused that" from "this cycle restarts on schedule." Copy shortened: teacher headline "Upload homework. Track mistakes." (was "Upload homework. See what's stuck."), teacher payoff "Walk into the class prepared." (was the longer "...already knowing which students need help, and with what."); parent headline "Stay up to date. Stay in the loop." (was "Class happens. The update follows."), parent payoff "Stay informed about how your child's day went." (was "...— in Korean, same day.").

**Consequences:** The live component is the source of truth for this copy — no separate marketing doc holds it. A static reference image was also generated in Gemini (dark background) matching this version for use outside the live page (social/blog); a light-mode variant is a separate manual Gemini generation, not something this repo can produce (no image-gen tooling here).

---

## 018 — Director tools added strictly within the existing core loop; enrollment/tuition explicitly out of scope

**Date:** 2026-08-19
**Status:** Resolved

**Context:** Asked (acting as a school principal) what director-facing analytics/management tools were missing beyond the student roster. The first pass of candidates included enrollment funnel and tuition/payment tracking — both real director needs, but neither touches anything Chekki currently does (grading, curriculum, daily logs, KT parent reports). Redirected the scope to tools that extend data Chekki already collects.

**Decision:** Built two director-only views, both read/aggregate over existing data with no new Firestore collections: (1) **Student Database** (`StudentDatabaseGrid.tsx`) — an Airtable-style sortable/searchable/filterable grid over the same `activeRoster`/`pendingRoster` `NativeDirectorStudentsTab.tsx` already fetches, added via `@tanstack/react-table` (pinned to stable `^8.21.3`, not the `^9` default `npm install` resolves to — v9 is a lower-level API that doesn't match the widely-documented v8 hooks). (2) **Log Compliance Tracker** (`LogComplianceTracker.tsx` + `hooks/useLogCompliance.ts`) — per-class, per-day rollup of whether that class's assigned teacher submitted a log, with a miss-streak badge; queries each class's existing `classes/{id}/logs` subcollection by `date`, same subcollection-query shape `useKtReviewQueue.ts` already uses. `NativeDirectorStudentsTab.tsx`'s CSV export logic was extracted to `src/utils/csvExport.ts` so both the new grid and the existing roster tab share one implementation instead of two copies.

**Consequences:** Two new sidebar tabs (`student_database`, `log_compliance` added to `TabId`), director-only, gated the same way `students`/`director_hq` already are — no FT/KT surface touched. Enrollment funnel and tuition/payment status remain explicitly unbuilt; if either comes up again, treat it as a new, separate scoping conversation rather than folding it into these two views.

---

## 017 — Parent email is optional when adding a student; partially reopens Decision 001

**Date:** 2026-08-17
**Status:** Resolved

**Context:** `StudentInvitePanel.tsx` required a parent email just to add a student to a class at all — a leftover of Decision 001 (which correctly removed the shared, class-wide join code as a security seam) that also, as a side effect, made a parent's email a hard prerequisite for a student to exist in the system at all. This conflated two independent loops: the class-facing loop (FT/KT daily logging, exceptions, KT report consolidation) only ever needs a name + a stable ID to attach data to, never touches Firebase Auth; the parent-facing loop (scanning homework, receiving Korean reports) is the only one that actually needs an account, which needs an email to redeem. A director without a parent's email on hand — same-day enrollment, orientation before contact info is collected, etc. — couldn't add that student at all, not even to the class roster for logging purposes.

**Decision:** Made `parentEmail` optional on `pendingStudents` creation (`api/create-class.ts`'s `add_students` action, validated in `api/_lib/rosterValidation.ts`). A student added by name alone is immediately usable in FT/KT logging via the `pending:${id}` roster keying already built earlier in the session, and shows a distinct "Class roster only" status in `StudentInvitePanel.tsx` (vs. "Invited"/"Joined"). Redemption stays exactly as Decision 001 left it — email-invite only, no code ever surfaced to staff for manual/in-person sharing; an `inviteCode` still exists on every `pendingStudents` doc (unchanged internal plumbing for the emailed link), it's just never shown or handed out. `api/create-class.ts`'s `resend_student_invite` action doubles as "send the first invite," accepting an optional `parentEmail` so a director can add that email later and the same email-only flow takes over from there.

**Consequences:** Decision 001's model is otherwise untouched: one access path (email invite), no shared/guessable codes, nothing for staff to hand out. What's reopened is narrower still than the first pass at this decision — a director can register a student and start the class-facing loop before a parent email exists, but the parent-facing loop remains exactly "give an email, get a free signup" with no alternate path. Bulk Excel/CSV upload (`handleFileChange`) also no longer filters out rows missing an email column.

---

## 016 — KT review queue and bulk teacher invite: reused existing data shape, didn't restructure

**Date:** 2026-08-17
**Status:** Resolved

**Context:** Friction audit against actual code (not guessing) found two FT/KT/director pain points: `NativeKtDashboard.tsx` only ever rendered `ktPendingLogs[0]`, forcing a KT through pending reports strictly one at a time with no visibility into the queue behind it; and `TeacherInvitePanel.tsx` only accepted one email per submission, so a director staffing a new campus had to repeat the invite form once per hire.

**Decision:** For the KT queue: `ktPendingLogs` in `TeacherPage.tsx` was already a real Firestore-backed array — the fix was entirely in what gets passed to the dashboard (a new `activeKtLogId` selection state plus a `KtReviewQueue.tsx` chip strip), not in `NativeKtDashboard.tsx` itself, whose per-report local state already resets correctly via its existing `key`-remount pattern. For bulk invite: added a "paste multiple emails" textarea mode to `TeacherInvitePanel.tsx` that loops the existing single-invite `/api/create-teacher-invite` call sequentially (not `Promise.all`), since the backend re-reads the seat count per request rather than in a transaction — parallel calls near the seat cap could race past the limit.

**Consequences:** Both shipped without backend changes. On partial bulk-invite failure, the textarea is left containing only the failed emails so the director doesn't retype ones that already succeeded. The KT queue shows a transient "copied ✓" state on a chip for ~1.4s before the approved log actually drops out of the array, giving a visible confirmation trail instead of an instant vanish.

---

## 015 — Rejected a unified FT chatbot; two targeted integrations instead

**Date:** 2026-08-17
**Status:** Resolved

**Context:** After scoping voice-fill for the daily log (Decision 014), the question came up of whether a single context-aware chat agent should become the interface for all FT tasks — daily log, syllabus/homework upload, worksheet generation, and the read-only Insights dashboard.

**Decision:** No. Mapped the actual FT task surface (`TeacherPage.tsx`, `NativeFtDashboard.tsx`, `CurriculumEditorForm.tsx`): syllabus/homework upload is already a one-tap photo flow and worksheet generation is already a single button — both faster than any chat interaction could be, so wrapping them in conversation would add friction, not remove it. Voice only helps where the current UI is genuinely slower than talking, which is true for the daily log form and nowhere else on the FT side. Built two narrow, additive integrations instead: (1) the FT's already-scanned weekly curriculum (`curriculumTopic` state, already loaded by `TeacherPage.tsx`) now prefills the daily log's Lesson Topic field via the same `useEffect` prefill pattern already used for class name/textbook — voice-fill then naturally skips asking about it, no backend change needed; (2) a chat box (`InsightsChatPanel.tsx`) added to the read-only Insights tab, reusing the existing `ask_question` Gemini task and its client wrapper (`askChekkiQuestion` in `services/geminiService.ts`) rather than building new Q&A infrastructure.

**Consequences:** No new backend endpoints for either integration — both reuse data/infra that already existed. FT's camera-upload and one-tap flows are untouched. The Insights tab remains primarily the existing 5-slide dashboard; the chat box is additive, not a replacement.

---

## 014 — Voice-fill for the FT daily log: turn-based, not speech-to-speech; nothing commits without explicit confirmation

**Date:** 2026-08-16
**Status:** Resolved

**Context:** The FT daily log form (`NativeTeacherLogForm.tsx`) was identified as the single biggest friction point for Foreign Teachers — a multi-field form filled manually every class, every day. The founder has separately built a real-time speech-to-speech voice agent (Vodabi) and wanted to bring that experience here.

**Decision:** Scoped down to turn-based voice fill (record → transcribe + extract → confirm → repeat), not live speech-to-speech. The backend is Vercel serverless (Hobby plan, already at its 12-function cap — `api/analyze.ts` is the single consolidated endpoint every task funnels through), which can't hold a persistent connection open the way Gemini Live/OpenAI Realtime would need; that's a genuinely different infra class, not a config change. New `task: 'voice_log_fill'` branch added to `api/analyze.ts`, reusing the multi-turn conversational pattern and `responseSchema`-constrained JSON extraction already proven by the existing `ask_question` and `generate_worksheet` tasks. Client (`VoiceFillAssistant.tsx`) records via plain `MediaRecorder` (no native plugin needed — mic permissions were already declared in `Info.plist`/`AndroidManifest.xml` for an unrelated prior feature). Critically: each turn's result (transcript + extracted fields + any student exceptions) sits unapplied until the teacher explicitly taps "Use this" — nothing writes into the real form state automatically, closing the gap where a mis-transcription could silently reach the KT undetected.

**Consequences:** Real-world testing surfaced two follow-on issues, both fixed same-session: (1) the extraction prompt initially under-extracted when a teacher described multiple fields in one long utterance (only 2 of 5 stated fields captured) — fixed by rewriting the prompt to explicitly enumerate all fields to check plus a worked few-shot example, and lowering temperature from 0.4 to 0.15; (2) student-specific notes ("Min-jun struggled with pronunciation") were originally out of scope for voice and had no way to avoid being misfiled into the whole-class `generalComments` field — extended the schema with a separate `newExceptions` array and a one-time follow-up question, keeping named-student notes on the same `exceptions[]` pipeline the manual "+ Add A Student" modal already uses (KT review, phone-consultation prep), never mixed into the class-wide summary. Also added: `safetySettings` matching the harassment/hate-speech/sexual/dangerous-content thresholds already used elsewhere in the file (this call was missed when originally added), an explicit instruction to never carry profanity into extracted fields, a 25s client-side request timeout, and a dismissible "your voice is never saved" banner. Speed/friction-reduction itself is unverified — flagged for the pilot to measure time-to-submit against the manual form rather than assuming voice is faster.

---

## 013 — Landing pages: fixed stale claims, aligned speed messaging, removed unverified testimonials

**Date:** 2026-08-15
**Status:** Resolved

**Context:** An audit of `Landing.tsx`, `SchoolsLandingPage.tsx`, and `FaqPage.tsx` against PRD.md §2's three pain points found: (1) a real bug — `handleTeacherCountChange` assigned plan id `'report_studio'` (a leftover from the cut demo page) for academies with ≤3 teachers, which doesn't exist in `PRICING_TIERS` and silently fell back to the pricier `school_pro` plan; (2) two pricing-card bullets marketing the cut Report Studio page by name and a "Custom School Brand Header" as an active feature, though the logo editor was cut this session; (3) a live screenshot on the schools page (`schools_bento_join_code*.png`) still showing the removed 6-digit join-code screen; (4) grading-speed claims contradicting each other across pages (10-second vs. 3-second, for what looked like the same `/api/analyze` pipeline); (5) specific unbacked percentage claims (95%, 90%) presented as fact despite PRD §6 stating success metrics are "not yet validated against real usage data"; (6) two named, titled testimonials with specific numeric claims and no support anywhere in the docs — the same "mock content presented as real" pattern Decision 005/SCOPE.md flagged when cutting the Community feature.

**Decision:** Fixed the plan-id bug and the two stale feature bullets. Aligned all grading-speed copy to PRD §5's own stated target ("well under 5 seconds") instead of two conflicting specific numbers. Softened the two unbacked percentage claims to directional language. Removed the testimonials section entirely rather than just softening it, given the higher bar a named-person quote implies versus a percentage claim.

**Consequences:** The stale join-code screenshot (`schools_bento_join_code.png` / `_light.png`) was **not** fixed — replacing it requires a real screenshot of the current invite-link flow, which needs to be captured from the live app, not fabricated. Flagged here so it isn't lost. If real pilot testimonials become available, add them back with attribution that can actually be stood behind.

---

## 012 — Answer-key entries can now be deleted individually

**Date:** 2026-08-15
**Status:** Resolved

**Context:** Decision 009 persisted worksheet-scanned answer-key entries but shipped with no way to remove a wrong one — re-scanning was the only path, and the merge/dedupe logic in Decision 008 means a bad entry just sits there permanently once saved.

**Decision:** Added a delete button per entry in the "Saved Answer Key" list (`CurriculumEditorForm.tsx`), wired to a new `handleRemoveAnswerKeyEntry` handler in `TeacherPage.tsx` that filters the entry out of `curriculumAnswerKey` state. Same pattern as the existing vocab/phonics chip removal.

**Consequences:** Closes the gap flagged as a known limitation in Decision 009. No confirmation dialog — consistent with how vocab/phonics removal already works (low-stakes, easily re-added by rescanning).

---

## 011 — Class-creation limit stays coupled to combined FT+KT seat count

**Date:** 2026-08-15
**Status:** Resolved (accepted as-is)

**Context:** `maxClassesForSeats` (`api/_lib/seatLimits.ts`) caps a school's total classes at `ft_seats + kt_seats` from its plan (e.g. Starter = 2 FT + 1 KT = 3 classes total, school-wide). Teacher *invites* are correctly gated per-role and independently (`maxInvitesForRole`), but the class cap itself has no separate configuration — it's a straight sum of seats, even though a single teacher can be assigned multiple classes (per the confirmed end-to-end role flow). A school with few teachers running many small sections (common for hagwons splitting large groups by level) could hit the class ceiling well before hiring enough staff to justify a plan upgrade.

**Decision:** Keep the current 1:1 seat-sum-to-class-cap coupling. At this stage (early, few real paying academies), it's an acceptable proxy for account size rather than a precisely-tuned limit, and changing it is a pricing/business call, not just an engineering one. Confirmed intentional-for-now rather than fixed blind.

**Consequences:** If a real academy hits this ceiling with an obvious legitimate need (few teachers, many class sections), it's a pricing-tier problem, not a bug report — revisit `PLAN_SEATS` in `api/_lib/pricingTiers.ts` then, either via a per-seat multiplier or a separate `classesTotal` field decoupled from teacher headcount. No code changed this round.

---

## 010 — Director Overview aggregated to campus-wide, not per-selected-class

**Date:** 2026-08-15
**Status:** Resolved

**Context:** An end-to-end role-flow trace found the Director's "Overview" tab wasn't actually campus-wide despite that being the PRD's stated need — TOTAL ROSTER and FLAGGED EXCEPTIONS only reflected whichever single class was currently selected (`activeRoster`/`pendingRoster` are TeacherPage's per-selectedClass roster fetch). A director had to switch classes one at a time to find flags or roster counts elsewhere in their school. (Daily Log Review was already correctly campus-wide via its own separate aggregate-query effect — that one didn't need fixing.)

**Decision:** Added a second aggregation effect in `NativeDirectorPortal.tsx` (`campusRoster`) that queries every class in the director's `classes` list and sums active/pending counts and collects all flagged students school-wide, mirroring the pattern the existing `logReviewStats` effect already used. The Flagged Exceptions tab's resolve list now shows flags from every class, not just the selected one.

**Consequences:** One more Firestore round-trip per class on mount (same cost profile as the existing log-review stats query, which was already accepted). Resolving a flag optimistically updates local state rather than waiting on a full re-fetch, since the underlying `onResolveFlag` handler only refreshes TeacherPage's own selected-class roster, not this component's separate campus fetch.

---

## 009 — Worksheet answer key: persist it and use it in grading

**Date:** 2026-08-15
**Status:** Resolved

**Context:** Worksheet scans (`mode: 'textbook_curriculum_ocr'`) extract a real question/answer key (`detectedAnswers`) via the AI, but nothing ever saved it — `applyScannedSelectionToCurriculum` only applied topic/vocab/phonics/passage/other, and `handleSaveCurriculum`'s payload never included it. Grading only ever had loose vocab/phonics/passage as context, never a literal ground-truth answer to check against, undercutting one of the core loop's stated values ("grade against the teacher's real answer key instead of guessing").

**Decision:** Added `curriculumAnswerKey` state (question/answer pairs), persisted as `answerKey` on the `curriculums/{classId}_week_{n}` doc, populated automatically (merged, deduped by question text) whenever a worksheet scan with `detectedAnswers` is applied. `api/analyze.ts`'s `curriculumContext` now reads it back and injects it into the grading prompt with explicit priority instructions: match a scanned question against the key first, only fall back to AI judgment for questions not covered. Also surfaced read-only in `CurriculumEditorForm.tsx` so a teacher can see what's actually stored.

**Consequences:** Grading accuracy for questions covered by an uploaded worksheet's answer key should improve — it's no longer purely inferential. No answer-key editing UI (delete/correct an entry) — re-scanning is the only way to change it for now; add one if teachers report bad entries getting stuck.

---

## 008 — Syllabus and worksheet vocab/phonics merge instead of overwrite

**Date:** 2026-08-15
**Status:** Resolved

**Context:** Syllabus (term-level scope) and worksheet (this week's specific words) uploads both wrote into the same plain-text vocab/phonics fields on the weekly curriculum doc. Applying one after the other silently replaced whatever the other had contributed — no data separation, easy to lose a week's worksheet-specific vocab by later applying a syllabus scan, or vice versa.

**Decision:** Rather than a full schema split into separate `syllabus.*` / `worksheet.*` namespaces (larger change, more places to update, and topic/passage/other are legitimately single-current-value prose fields where "latest edit wins" is correct behavior), `applyScannedSelectionToCurriculum` now merges (dedupes and unions) newly-scanned vocab/phonics words into whatever's already in the field, instead of replacing it outright. The answer key (Decision 009) is a genuinely separate field specifically because it's structurally different (question/answer pairs, worksheet-only) — that part did get its own storage.

**Consequences:** Scanning a syllabus no longer erases a previously-applied worksheet's vocab, and vice versa. Vocab/phonics lists will grow across multiple scans within a week unless a teacher manually prunes them via the existing remove-word UI — acceptable since accumulation (a fuller list) is the safer failure mode compared to the previous silent data loss.

---

## 007 — KT report delivery stays manual copy-paste; dropped the KakaoTalk share-sheet button

**Date:** 2026-08-15
**Status:** Resolved

**Context:** `NativeKtDashboard.tsx` had two ways to get an approved report to a parent: a "Share KakaoTalk" button (`navigator.share()` — the OS share sheet, which can target KakaoTalk if installed) and a "1-Click Copy Script" clipboard button. The share path only worked meaningfully on mobile with KakaoTalk installed, fell back to clipboard anyway on desktop, and — more importantly — routes through whatever Kakao account is logged into the KT's personal device. There's no business/official-channel integration; it's the KT's own personal app.

**Decision:** Removed the Share KakaoTalk button and its handler. Manual copy-paste (the existing 1-Click Copy button) is the sole, permanent send mechanism for now, not a placeholder for a future integration.

**Consequences:** One less inconsistent code path (`navigator.share` support varies by platform/browser). Sending a report is now unambiguously "KT copies it, pastes it wherever they actually message the parent" — which is what was already happening in practice, since the share button's KakaoTalk target still required the KT's personal login either way. If a real KakaoTalk Business API integration (or similar) is ever prioritized, it should be scoped fresh rather than reviving this button — the old approach never had one.

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
