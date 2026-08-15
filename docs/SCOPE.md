# Chekki AI — Scope

**Version:** 1.0
**Companion docs:** [`PRD.md`](./PRD.md) (what we're building and why), [`DECISIONS.md`](./DECISIONS.md) (open questions)

Purpose of this document: say plainly what's in, what's deliberately out, and what was cut — with the reasoning, so the next person doesn't have to rediscover it by reading commit history. Written after an August 2026 stabilization pass that found bugs spread across nearly every major feature, prompting a freeze on new features until the core loop was hardened and a deliberate audit of what didn't need to exist at all.

---

## In scope — the core loop

Everything in [`PRD.md` §4](./PRD.md#4-the-core-loop):

1. Scan → EN/KO explanation (parent app)
2. Teacher answer-key upload → grading context
3. Mistake flagging → teacher visibility
4. Syllabus/textbook upload (term-level scope, distinct from #2)
5. FT log → AI translation → KT review → parent send
6. Access: director invite links + self-serve class codes (both, for now — see `DECISIONS.md`)

Plus the three staff dashboards (Director/KT/FT) that serve #2–5, and the parent-app features that serve #1 directly:

- **Flashcards** — live, used feature, direct extension of the scan/review loop.
- **Mistake review & practice sheet** (`OdapNoteModal` — "오답," Korean for "wrong answer") — pulls flagged mistakes, lets the parent mark them mastered, generates a printable practice worksheet. This is the payoff of loop stage #3 on the parent side. Not to be confused with a generic "notes" feature — it's core, not creep.

---

## Out of scope — cut, with reasoning

Removed in the August 2026 stabilization pass. Code deleted or access removed; see git history (`chore: cut scope-creep features flagged in stabilization audit`) for the exact diff.

| Feature | What it was | Why cut |
|---|---|---|
| `NativeAcademyOnboarding.tsx` | — | Dead code. Zero imports anywhere. Not a product decision, just cleanup. |
| Legacy `mistakes` collection fallback | An extra Firestore read per student, per roster load, querying an old-schema collection | Compatibility shim for data that (as far as could be determined) no longer needs supporting; was adding an N+1 query to a hot path for no live benefit. |
| `ReportStudioPage.tsx` (`/insights`, `/report*`) | A marketing/demo page simulating the FT→KT report flow with fake data, for prospective directors to try before signing up | Duplicated the look of the real report flow closely enough to risk confusing debugging ("is this the real UI or the demo?"). Marketing value judged lower than the maintenance/confusion cost. |
| Academy logo/branding editor (`AcademyLogoModal.tsx`) | Let a director upload a custom logo shown on report cards | Functional, not broken — but tangential to the core loop. Cut the *editing* UI; a previously-set logo still displays wherever it was already shown. Cheap to reintroduce as a single entry point if it turns out to matter. |
| `FlyerModal.tsx` | Referral/share-flyer generator for parents | Growth/marketing feature, not core-loop. Not evaluated as bad — just deprioritized relative to loop stability. |
| `CommunityModal.tsx` ("Parent's Lounge") | Social-post-template generator with a feed of **hardcoded fake example posts** (fabricated names, like counts, comments) | Beyond being tangential, this one had an honesty problem — it presented mock content in a way that could read as a live community feed. Its own trigger button had already been silently removed at some point before this audit (state existed, nothing set it to open) — evidence it wasn't getting real usage anyway. |

---

## Explicitly not building right now

Carried forward from prior roadmap notes, not evaluated or committed to — listed here only so they aren't rediscovered as "new" ideas without knowing they were already considered:

- Gamified sticker/badge board beyond what may already exist in the scan flow
- "Clone my worksheet" (AI-regenerated practice sheet with new vocab, same structure)
- Scheduled/automated weekly report email or push digest (current report flow is FT/KT-initiated, not automatic)

If one of these gets prioritized, it belongs in a new `DECISIONS.md` entry with the reasoning, not a silent addition.

---

## Resolved: the dual access-path redundancy

A parent used to be able to reach a class two ways (self-serve 6-digit code, director-pushed invite link). This was resolved (`DECISIONS.md` #001): the shared class code is gone, invite-only is canonical. See `PRD.md` §4.6.
