# Style lock — Chekki AI

Established: 2026-08-26. Source: ported from existing `DESIGN.md` ("The Warm Console") + `landing.css` @theme tokens — this project was NOT a cold start, so no palette was generated. This lock formalizes what already shipped.

## Palette

Dark mode (default):
- Background: `#050505` (`--color-brand-dark`) — page base
- Surface: `#0f1014` (`--color-brand-card`) — cards/panels
- Primary/Accent: `#f97316` (`--color-brand-orange`) — the one accent: CTAs, active states, focus
- Text primary: `#f4f4f5` (zinc-100)
- Text muted: `#a1a1aa` (zinc-400)
- Button label color on Primary: **black** (`text-black`, as actually shipped) — verified below, not assumed white
- Elevated hover tints: `#0f0814` / `#0a0714` (hover-only, not interchangeable with Brand Dark)

Light mode (companion, same tokens re-verified independently, not carried over from dark):
- Background: `#f8fafc` (slate-50)
- Surface: `#ffffff`
- Primary: `#f97316`; Accent (text use): `#ea580c` (`--color-brand`, used for CTA/hover text in this mode)
- Text primary: `#18181b` (zinc-900)
- Text muted: `#52525b` (zinc-600)
- Border: `#e4e4e7` (zinc-200)
- Button label on Primary: black (same as dark)

Reserved, not in rotation: `--color-brand-purple` (`#7f77dd`), `--color-brand-pink` (`#ec4899`). Never combined with orange in a gradient (DESIGN.md's One Accent Rule).

## Color contract

Run 2026-08-26 via `scripts/check_contrast.py --matrix` against the real tokens above (this had never actually been run before this pass).

**Dark mode** (`text=f4f4f5 muted=a1a1aa bg=050505 surface=0f1014 primary=f97316 accent=f97316 border=ffffff on-primary=000000`):
- Text-safe (>=4.5): text/bg 18.54, text/surface 17.30, muted/bg 7.95, muted/surface 7.42, primary/on-primary 7.49 (black label on orange fill — confirms the shipped `text-black` choice is correct), bg/primary 7.27, surface/primary 6.78
- UI-safe (>=3.0, <4.5): none needed beyond the above
- Decorative (<3.0, must not carry text/state alone): **text/primary 2.55** — orange text used directly on a card/surface background reads fine (bg/primary and surface/primary both clear 6.5+), but orange text is only safe *on the page/card background*, not layered on other non-bg/surface tones. `primary/border` 2.80 — the orange focus/hover border against a white-10 hairline is decorative-only, consistent with it being a hover accent, not the sole state indicator (buttons/text carry the real signal).

**Light mode** (`text=18181b muted=52525b bg=f8fafc surface=ffffff primary=f97316 accent=ea580c border=e4e4e7 on-primary=000000`):
- Text-safe (>=4.5): text/bg 16.93, text/surface 17.72, muted/surface 7.73, muted/bg 7.39, primary/on-primary 7.49, text/accent 4.98 (orange-600 text on white/light bg — safe for the `text-orange-600` headline accents used in light mode)
- UI-safe (>=3.0, <4.5): surface/accent 3.56, bg/accent 3.40 — accent as an icon/border/large-text treatment on background is fine, but per the floor table doesn't clear full body-text-on-fill on its own without checking the exact pairing used (text/accent above does clear, since it's orange-600 not orange-500)
- Decorative (<3.0): surface/primary 2.80, bg/primary 2.68 — `primary` (orange-500, the *fill* token) as a hairline/border in light mode is decorative-only; this is why the page correctly uses the darker `accent` (`#ea580c`) for light-mode text/links instead of `primary`, and reserves `primary` for solid fills where `on-primary` (black) carries the real contrast.

Net: every actual pairing shipped in the file (orange CTA fill + black label, orange text on dark/light bg, zinc text on brand-dark/card) passes AA. No changes needed to existing color usage.

## Typography — resolved 2026-08-26

Was: DESIGN.md said Space Grotesk/Plus Jakarta Sans, `landing.css`/`index.css` actually ship Bricolage Grotesque/Onest site-wide. Resolved by editing DESIGN.md to match the live fonts (not migrating fonts — smaller blast radius, and Bricolage/Onest is what's already rendering everywhere, app included, not just the two landing pages).

Display: Bricolage Grotesque (900). Body: Onest (`font-sans`).

- Korean: Noto Sans KR (`font-korean`), confirmed loaded and used correctly with `break-keep` on Korean display/title text throughout this file.
- Hand: Patrick Hand — not used on this page (no handwriting-style content present); correctly absent.

## Shape language

- Corner radius: `rounded-3xl` for bento/pricing cards (DESIGN.md's own carve-out: "simpler single-radius rounded-2xl/3xl for lighter-weight list items" — these qualify, so left as single-radius, not forced into double-bezel). `rounded-[2.5rem]` outer + `rounded-[calc(2.5rem-0.25rem)]` inner on all 3 modals — correct double-bezel construction already in place, untouched.
- Shadow depth: soft/ambient only (`shadow-lg shadow-orange-500/25`, `shadow-2xl`) — no hard drop-shadows found.
- Border usage: hairline `border-white/10` (dark) / `border-zinc-200` (light) throughout.

## Density & spacing

- Section padding: hero `pt-28 md:pt-36 pb-12 md:pb-16`; standard sections `py-16 md:py-24` (bento) / `py-20` (pricing, CTA) — consistent tiering, left as-is.
- Card internal padding: `p-6 md:p-8` (bento), `p-5` (pricing) — left as-is, both above the space-6 floor.
- Section separation: fixed section padding, no alternating tint/divider — consistent choice across the page, left as-is.

## Structure

- Macrostructure: Feature Stack — Hero (split, mascot right) -> Core Loop Diagram (`SchoolLoopDiagram`, how it works) -> Bento Features (solution, painpoint/solution framing) -> Pricing -> Consultation CTA -> Footer. This shape was already well-formed for a director/teacher-audience marketing narrative; **not restructured** this pass — see decisions.log.
- Narrative arc: hook (headline) -> mechanism (loop diagram) -> problem/solution (bento, 4x painpoint->solution pairs) -> proof/commitment (pricing tiers, trial banner) -> close (1:1 consultation CTA) -> footer. No beats skipped, no reordering needed.
- Per-page: Nav = floating pill island (backdrop-blur, rounded-full) matching DESIGN.md's Navigation section exactly.

## Motion

- Feel: quick, restrained, no bounce/overshoot — `power3.out` throughout, matching DESIGN.md's Don't-use-spring-easing rule.
- Curves: GSAP `power3.out` for entrances (mirrors `src/Landing.tsx`'s existing hero pattern, not a new vocabulary); CSS `--ease-out: cubic-bezier(0.23, 1, 0.32, 1)` / `--ease-premium: cubic-bezier(0.32, 0.72, 0, 1)` for modal/toast transitions (untouched, already correct).
- Durations: hero text 1s stagger 0.12s; hero mascot 1.1s; bento card reveal 0.7s + 0.08s stagger per row; pricing card reveal 0.6s + 0.06s stagger; CTA section 0.7s.
- Screen tracks: both landing pages now use GSAP ScrollTrigger one-shot reveals (`toggleActions: 'play none none none'`) on hero, every bento/educator card, every pricing card, and the CTA/footer section — closes the "sections don't animate" gap found in the Step 2.5 read. `Landing.tsx`'s pass (2026-08-26) added `.edu-card`, `.pricing-card`, `.footer-cta` reveal targets plus a whole-section reveal on the imported `ChekkiAiBentoGrid` via its existing `#ai-bento` id (that component file itself was not edited).
- Reduced motion: gated by `useReducedMotion()` from `framer-motion` (already a project dependency) — entrance effect bails out entirely when the user has reduced-motion set, same guard `Landing.tsx` uses.
- Verified by: `scripts/audit_motion.py` — 0 findings (pass) on 2026-08-26.

## App shell chrome — director portal (recorded 2026-08-26, first pass touching shell components)

`DirectorSidebarNav.tsx` / `DirectorTabContent.tsx` / `NativeDirectorPortal.tsx` / `NativeDirectorStudentsTab.tsx` are app-shell/data-view surfaces (director dashboard behind TeacherPage's persistent nav), not marketing pages — Step 2.5's macrostructure/diversification step does not apply; `references/component-patterns.md`'s App shell section does. Mapping already shipped, verified correct against that section, left as-is:

- **Active nav item** (`DirectorSidebarNav.tsx`): filled pill treatment — `bg-orange-500/10 border-orange-500/30 text-orange-500` — same treatment on all 5 sidebar entries (director_hq/students/classes/teacher_assignment/log_compliance). One treatment, used consistently, per the pattern file's rule.
- **Hover on inactive nav items**: `hover:bg-white/5 hover:text-white` (dark) / `hover:bg-zinc-100` (light) — visibly lighter weight than the active fill, so current location stays unambiguous.
- **Content area** (`NativeDirectorPortal.tsx` root card): `bg-brand-dark` (Background token) — the quietest surface in the shell, correct per the pattern file.
- **Tab pills inside the portal** (Overview/Flagged/Billing): same active-fill-vs-hover contrast pattern as the sidebar, applied at a smaller scale — consistent, not a second visual language.
- No distinct topbar in this shell (director portal is embedded content within TeacherPage's own frame, not a separate chrome layer) — nothing to map there.

## App shell chrome — TeacherPage outer frame (recorded 2026-08-26, first pass touching this file)

`TeacherPage.tsx` is the top-level shell that owns the actual `<aside>` sidebar + `<header>` topbar + `<main>` content region all the director/KT/FT dashboards render inside (the section above only covered the embedded director-portal content, not this outer frame). Step 2.5 does not apply here either — this is the app shell, not a marketing page.

- **Sidebar background**: was `bg-brand-dark` in dark mode — identical to the content area, so sidebar and canvas had no visual separation. Changed to `bg-brand-card` (`#0f1014`, the locked Surface token) across the `<aside>` root, its header block, and its footer block, matching `references/component-patterns.md`'s "Sidebar background: usually Surface, one step off Background" rule. Light mode was already correct (`bg-white` sidebar vs `bg-slate-50` content) and untouched. No new color pairing introduced — `surface` was already cleared against `text`/`muted` in this file's Color contract above (surface/bg 6.78, muted/surface 7.42), so no re-run of `check_contrast.py` was needed.
- **Content area**: `bg-brand-dark` (Background token) in dark mode, `bg-slate-50` in light — correct, left as-is.
- **Topbar** (`<header>`): `bg-brand-dark/90` (dark) / `bg-white/90` (light) — shares the content area's Background token with a `border-b` hairline underneath, not a separate fill. Correct per the pattern file, left as-is.
- **Active nav item**: handled per-role inside `DirectorSidebarNav`/`KtSidebarNav`/`FtSidebarNav` (not this file) — already documented in the director-portal section above; KT/FT nav components use the same filled-pill treatment, verified consistent, not re-derived.
- Mobile off-canvas drawer (`<aside>` fixed/translate-x pattern below `md:`) reuses the same sidebar tokens; no separate mobile-only chrome mapping needed.

## App shell chrome — parent dashboard / grading-result core loop (recorded 2026-08-26, mechanical pass only)

`Dashboard.tsx` (parent home/dashboard), `SplitView.tsx` (the AI-grading result view — the product's core value moment), `WorksheetOverlay.tsx` (worksheet image + answer-bubble overlay), and `WorksheetItemCard.tsx` (per-question result card) are app shell / data view surfaces (parent-facing, behind no marketing nav), not marketing pages — Step 2.5 skipped, same as every other app-shell file in this project. This pass was scoped to mechanical className-token fixes only (transition-all -> named properties, one ease-in-out -> ease-out easing swap) — no palette, type, shape, or structural change was made or needed; existing token usage already conformed to the locked contract above.

- **Motion**: press/hover feedback only (`active:scale-[0.9x]`, named-property `transition-[...]`), consistent with every other app-shell file. No scroll-driven or entrance motion in this surface, correctly so.
- **Viewport height**: `SplitView.tsx` uses `lg:h-screen` on its two split panes (image pane, answer panel). Left as `h-screen`, **not** swapped to `dvh` — this project's Capacitor config sets `minWebViewVersion: 60`, and `dvh` needs Chromium ~108+; older Android WebViews in the field can't be verified to render it correctly from here. This is a deliberate exception to the `min-h-screen` -> `min-h-dvh` fix applied elsewhere in this project (SchoolsLandingPage.tsx, Landing.tsx, TeacherPage.tsx) — do not "fix" this to match that precedent without the user's explicit sign-off and real-device verification on an old WebView.
- **Native distribution note**: this app ships via Capacitor (iOS/Android, `com.chekkiai.app`) in addition to web. Visual changes here reach web immediately but need a Capacitor rebuild + app store submission (both stores' review) to reach existing native installs — see decisions.log's pending-review entry.

## Do not

- Don't reintroduce a gradient combining orange with purple/pink/indigo.
- Don't add testimonials (`docs/DECISIONS.md` #013).
- Don't fabricate stats/metrics anywhere on this page (Product Principle #6).
- Don't replace the real bento screenshots (`public/assets/schools/schools_bento_*.png`) with stock imagery/illustrations.
- Don't swap `h-screen`/`min-h-screen` to `dvh` in `SplitView.tsx` (or any other file) without explicit user sign-off — this project's Capacitor `minWebViewVersion: 60` can't be assumed to support `dvh`.
