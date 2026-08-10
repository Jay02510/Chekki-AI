---
name: Chekki AI
description: 영어 숙제 채점 & 티칭 - 채점은 채키가, 칭찬은 부모님이.
colors:
  primary: '#F97316'
  brand-dark: '#050505'
  brand-card: '#0F1014'
  accent-purple: '#a855f7'
  accent-pink: '#EC4899'
  success: '#10b981'
  error: '#ef4444'
  warning: '#f59e0b'
  landing-bg: '#0c1a2e'
  landing-accent: '#E8820C'
  landing-teacher: '#2D6A4F'
  neutral-text: '#FDFAF5'
typography:
  display:
    fontFamily: 'Space Grotesk, sans-serif'
    fontSize: 'clamp(2rem, 5vw, 3.5rem)'
    fontWeight: 700
    lineHeight: 1.1
  body:
    fontFamily: 'Nunito, Noto Sans KR, sans-serif'
    fontSize: '16px'
    lineHeight: 1.6
  handwritten:
    fontFamily: 'Patrick Hand, cursive'
    fontSize: '1.25rem'
rounded:
  sm: '8px'
  md: '16px'
  lg: '24px'
  modal: '2.5rem'
spacing:
  xs: '4px'
  sm: '8px'
  md: '16px'
  lg: '24px'
  xl: '32px'
components:
  button-primary:
    backgroundColor: '{colors.primary}'
    textColor: '#FFFFFF'
    rounded: '{rounded.lg}'
    padding: '14px 28px'
  button-primary-hover:
    backgroundColor: '#EA580C'
  button-secondary:
    backgroundColor: '{colors.brand-card}'
    textColor: '{colors.neutral-text}'
    rounded: '{rounded.lg}'
    padding: '14px 28px'
  button-destructive:
    backgroundColor: '{colors.error}'
    textColor: '#FFFFFF'
    rounded: '{rounded.lg}'
    padding: '16px 24px'
  card-container:
    backgroundColor: '{colors.brand-card}'
    rounded: '{rounded.md}'
    padding: '24px'
  modal-bezel:
    backgroundColor: 'rgba(255,255,255,0.05)'
    rounded: '{rounded.modal}'
    padding: '6px'
  toast:
    backgroundColor: '{colors.brand-dark}'
    textColor: '{colors.neutral-text}'
    rounded: '9999px'
    padding: '12px 20px'
---

# Design System: Chekki AI

## 1. Overview

**Creative North Star: "The Playful Homework Helper"**

Chekki AI features a warm, tactile notebook feel set against high-contrast dark surfaces. It combines professional, precise AI scanning capabilities with hand-drawn visual cues (circles, stars, highlights) that mimic pencil-and-paper learning. The interface is split into two primary environments: a pitch-dark, highly functional web/mobile application (product register) and a rich, deep-navy marketing homepage (brand register).

This system rejects corporate SaaS uniformity (such as light gray card grids and raw Inter typography) in favor of rounded shapes, friendly display fonts, and emotional visual feedback.

**Key Characteristics:**

- **Tactile Comfort**: Rounded buttons, prominent borders, and soft cards.
- **Skeuomorphic Overlays**: Highlights and correct/incorrect marks appear to be hand-drawn directly on scanned sheets.
- **Cognitive Clarity**: Low-stress information hierarchy built to be navigated easily by tired parents and young kids.

---

## 2. Colors

The color palette uses high-contrast dark neutrals punctuated by a warm, friendly orange and energetic reward colors (purple and pink).

### Primary

- **Brand Orange** (#F97316): The primary brand identifier. Used for core call-to-actions, focus rings, correct answer highlights, and positive validation.

### Secondary

- **Accent Purple** (#a855f7 — Tailwind `purple-500`): Used for role badges (KT/director surfaces), secondary tags, and structured guidelines.
- **Accent Pink** (#EC4899): Used for reward state indicators, dopamine hits, and rare marketing accents.

### Neutral

- **Brand Dark** (#050505): The primary background color for the application shell.
- **Brand Card** (#0F1014): The container card background, providing subtle layer separation.
- **Neutral Text** (#FDFAF5): Warm off-white for body copy, avoiding harsh pure-white reading glare.

### Semantic

- **Success** (#10b981 — `emerald-400`/`emerald-500`): Confirmations, toasts, correct-answer states. The single most-used non-brand color in the codebase.
- **Error** (#ef4444 — `red-400`/`red-500`): Failures, destructive-action confirms, validation.
- **Warning** (#f59e0b — `amber-400`/`amber-500`): Sync warnings, trial-expiry notices, caution badges.

### Named Rules

**The 10% Pop Rule.** Bold, primary colors (Orange, Purple, Pink) should only cover ≤10% of any screen. The dark background handles the structural weight; colors are reserved for interactive and feedback actions.

**The Semantic-Never-Decorative Rule.** Emerald, red, and amber are reserved for their semantic meaning (success/error/warning) and never used as arbitrary decorative accents — if a screen needs a fourth decorative color beyond orange/purple/pink, that is a sign the screen has too many competing accents, not a cue to reach for green.

---

## 3. Typography

**Display Font:** Space Grotesk (`--font-display`, loaded app-wide via Google Fonts)
**Body Font:** Nunito / Noto Sans KR (Bilingual body copy, `--font-sans` / `--font-korean`)
**Handwritten Font:** Patrick Hand (Cursive scripts and sheet markings, `--font-hand`)

### Hierarchy

- **Display** (Bold (700), clamp(2rem, 5vw, 3.5rem), 1.1): Used for large hero text and major feature headers.
- **Headline** (Semi-Bold (600), 24px, 1.2): Section titles and modal headers.
- **Title** (Medium (500), 18px, 1.3): Product titles and card headers.
- **Body** (Regular (400), 16px, 1.6): Standard reading text and scripts. Maximum line length capped at 70ch.
- **Label** (Bold (700), 12px, tracking 0.1em, uppercase): Used for eyebrows, category tags, and active states.

### Named Rules

**The Handwriting Offset Rule.** Any text written in the handwritten font (`Patrick Hand`) should be slightly rotated (-1deg to 2deg) to feel authentically drawn on the paper.

**Serif accent:** `font-serif` (Playfair Display, `--font-serif` in both `index.css` and `landing.css`) is a deliberate, rare accent — italic quote blocks and worksheet-styled surfaces (`NativeFtDashboard.tsx`, `ScannedModal.tsx`). It is not a hierarchy role on its own; don't reach for it outside that "handwritten paper" register.

---

## 4. Elevation

The application uses tonal layering instead of traditional dropping shadows. Depth is defined by backgrounds shifting from pure dark to dark gray.

### Shadow Vocabulary

- **Interactive Glow** (`box-shadow: 0 8px 32px rgba(249, 115, 22, 0.15)`): Used on hover for primary brand orange items to indicate focus.

### Named Rules

**The Tonal Depth Rule.** Depth is established by color value shifts (Background at #050505 → Cards/Modals at #0F1014 → Buttons at #1F2937). Do not drop heavy black shadows onto dark cards.

---

## 5. Components

### Buttons

- **Shape**: Generously rounded corners (24px radius).
- **Primary**: Brand Orange (#F97316) background, bold white text. Padding is 14px vertical, 28px horizontal.
- **Hover**: Shift background to a deeper rust orange (#EA580C) with a subtle scale transform (1.02).

### Cards / Containers

- **Shape**: Rounded corners (16px radius).
- **Background**: Brand Card (#0F1014).
- **Border**: Thin border (`1px solid rgba(253, 250, 245, 0.08)`).
- **Hover**: Border brightens to `rgba(253, 250, 245, 0.15)` with a 3px vertical shift.

### Inputs / Fields

- **Shape**: Rounded (100px for search, 16px for textareas).
- **Background**: Pure white (#FFFFFF) in light modals, or dark gray (#18181b) in dark screens.
- **Focus**: Thick outline border with the primary Brand Orange color.

### Modals (The Bezel Modal)

Every modal in the product — `ConfirmDialog`, `ScannedModal`, `AcademyLogoModal`, `DocPreviewModal`, `WeekCalendarModal`, `ReportCardModal`, and the rest — shares one construction: a `bg-black/80 backdrop-blur-md` full-screen scrim, then an outer wrapper (`p-1` to `p-1.5`, `border`, `rounded-[2.5rem]` or `rounded-[2rem]`) acting as a thin bezel, containing an inner surface (`rounded-[calc(2.5rem-0.25rem)]`, solid `#0c0c0e` dark / white light) that holds the actual content. Close buttons are icon-only (`X`, weight bold, size 18), sit at `min-w-11 min-h-11` (see touch-target rule below), and either float `absolute top-6 right-6` on sparse modals or sit inline in a header row when the modal has richer header content (title + secondary action).

**Named Rules**

**The Bezel Rule.** A modal is never a single flat rounded rectangle — it is always a thin outer bezel wrapping a solid inner card. This is what reads as "physical" rather than "web dialog."

### Feedback: Toast & ConfirmDialog

- **Toast** (`contexts/ToastContext.tsx`): bottom-center, `rounded-full`, `backdrop-blur-xl`, auto-dismiss (default 3s). Color signals type — `bg-zinc-900/90` info, `bg-emerald-500/90` success, `bg-red-500/90` error — each paired with an emoji (💡/✨/⚠️) since color alone shouldn't carry the meaning.
- **ConfirmDialog** (`components/ConfirmDialog.tsx`): the Bezel Modal shape at `max-w-sm`, centered icon badge (warning triangle for `destructive` variant, question mark otherwise), then title, then two full-width stacked buttons (confirm on top, cancel below). This is the only sanctioned confirmation pattern in the app — native `window.confirm()`/`alert()` are not used anywhere in the codebase.

---

## 6. Do's and Don'ts

### Do:

- **Do** wrap bilingual copy in containers that prevent alignment breakage between Korean and English line heights.
- **Do** use native browser zoom configurations by keeping the viewport tag free of `user-scalable=no`.
- **Do** tilt hand-drawn annotations to preserve the "Playful Homework Helper" feel.
- **Do** give every icon-only button and modal close control a minimum `44×44px` (`min-w-11 min-h-11`) touch target — the primary use case is a phone in a teacher's hand mid-class or a parent scanning homework one-handed. `24×24px` (WCAG AA minimum) is an accepted exception only for dense inline chip-delete controls where 44px would break the layout.
- **Do** route every confirmation and status message through `ConfirmDialog` / `useToast` — never `window.confirm()`, `confirm()`, or `alert()`.
- **Do** show both sides of a problem/solution card at once on marketing pages. Hover-only reveals never fire on touch, and touch is the primary device for this audience.

### Don't:

- **Don't** use generic stark blue-to-purple CSS gradient text.
- **Don't** hide critical audience-specific entry points behind generic tab filters; stack them with clear anchors.
- **Don't** animate image cards on hover; use border/glow highlights on the parent container instead.
- **Don't** use emerald/red/amber for anything other than success/error/warning — see the Semantic-Never-Decorative Rule.
- **Don't** use `font-serif` (Playfair Display) outside the rare "handwritten paper" register (worksheet surfaces, quote blocks) — it isn't part of the standard type hierarchy.
