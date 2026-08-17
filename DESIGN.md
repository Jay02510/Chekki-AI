---
name: Chekki AI
description: Grading by Chekki, praise by Mom — instant AI homework grading and a teacher/parent report loop for Korean English academies
colors:
  brand-orange: "#f97316"
  brand-dark: "#050505"
  brand-dark-elevated: "#0f0814"
  brand-dark-elevated-alt: "#0a0714"
  brand-card: "#0f1014"
typography:
  display:
    fontFamily: "'Space Grotesk', sans-serif"
    fontWeight: 900
    letterSpacing: "-0.02em"
  body:
    fontFamily: "'Plus Jakarta Sans', ui-sans-serif, system-ui, sans-serif"
    fontWeight: 500
  korean:
    fontFamily: "'Noto Sans KR', sans-serif"
  hand:
    fontFamily: "'Patrick Hand', cursive"
rounded:
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
  full: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.brand-orange}"
    textColor: "#ffffff"
    rounded: "{rounded.full}"
  button-primary-hover:
    backgroundColor: "#ea580c"
---

# Design System: Chekki AI

## Overview

**Creative North Star: "The Warm Console"**

Chekki AI reads as an instrument panel, not a form: near-black surfaces (`#050505`) with a single warm-orange accent, the way a piece of serious hardware has exactly one indicator light. The product exists to take the stress out of a nightly ritual — a Korean parent grading English homework they can't fully read themselves — so the interface stays calm and dark rather than loud or playful, and lets the orange accent do the work of saying "here, this matters" without competing with it anywhere else on screen.

Nearly every elevated surface — modals, cards, panels — uses a distinctive double-bezel construction: an outer rounded shell in a translucent hairline border, with an inner surface inset by a consistent margin and its own slightly smaller radius. Combined with soft, large-blur ambient shadows and a 1px inset highlight along the top edge, this reads as a physical panel with real depth, not a flat rectangle with a shadow bolted on.

This session (2026-08-17) also closed out a real drift problem: an undocumented second gradient system (orange→pink→purple/indigo) had crept into the splash screen, loading screen, camera hero, and landing headline independently. That's now retired — orange is the only accent, confirmed as the intended direction going forward, not a stopgap.

**Key Characteristics:**
- Near-black instrument-panel base, warmed by exactly one accent color
- Double-bezel construction on nearly every card and modal
- Soft, large-blur ambient shadows over hard drop-shadows
- Full Korean/English parity in every component, never a fallback language
- `font-display` (Space Grotesk, weight 900) reserved for headlines; body copy stays in Plus Jakarta Sans

## Colors

One accent, used deliberately and sparingly, against a near-black base.

### Primary
- **Brand Orange** (`#f97316`): The single accent. CTAs, active/selected states, focus rings, the one thing on any given screen that says "act here." Used consistently for the primary action across both the parent app and the staff dashboard.

### Neutral
- **Brand Dark** (`#050505`): The base surface for every dark-mode screen and modal shell. Was previously typed as ~10 near-identical hex variants (`#030305`, `#0a0a0c`, `#0c0c0e`, `#08080c`, `#111111`, `#060608`, `#090a10`, `#08080a`) scattered by copy-paste drift — consolidated into this single token during this session's audit.
- **Brand Card** (`#0f1014`): A slightly lifted dark surface, distinct from Brand Dark, for card containers that need to read as one step above the page.
- **Brand Dark Elevated** (`#0f0814`) / **Brand Dark Elevated Alt** (`#0a0714`): Deliberate hover-elevated tints for interactive dark cards (bento tiles, landing feature cards), each paired with a matching accent-colored border on hover. Not interchangeable with Brand Dark — these exist specifically for the hover moment.
- **Zinc scale** (Tailwind default, extended with `zinc-850` `#1f2937`, `zinc-900` `#18181b`, `zinc-950` `#09090b`): body text, borders, and dividers on dark surfaces; standard Tailwind zinc/slate scale on light surfaces.

### Reserved (not part of the everyday palette)
- **Brand Purple** (`#7f77dd`) / **Brand Pink** (`#ec4899`): Defined as tokens but intentionally not in active rotation as of this session — confirmed direction is orange as the only accent. Available if a specific, deliberate need arises (e.g. a distinct role/status color), not for decorative gradients or a second "brand" identity.

### Named Rules
**The One Accent Rule.** Brand Orange is the only accent color on any given screen. No gradients combining orange with purple, pink, or indigo — that pattern was identified and removed as unintentional drift this session, not a rejected-but-valid alternative.

## Typography

**Display Font:** Space Grotesk (weight 900, `font-display`)
**Body Font:** Plus Jakarta Sans (`font-sans`, the default)
**Korean Font:** Noto Sans KR (`font-korean`) — used wherever Korean text renders, never left to fall back to the Latin body font
**Hand Font:** Patrick Hand (`font-hand`) — reserved for handwriting-style content (e.g. displaying a student's answer as if handwritten)

**Character:** Space Grotesk at maximum weight gives headlines a blunt, confident, almost stamped quality — deliberately not delicate or editorial. Plus Jakarta Sans keeps body copy warm and legible at the smaller sizes a phone screen demands.

### Hierarchy
- **Display** (900, `text-4xl` to `text-8xl` depending on context, `tracking-tight`, `leading-tight` or tighter): Hero headlines and the camera/scan screen's primary state text. Always paired with `break-keep` so Korean line-wrapping never splits a word mid-character.
- **Title** (900/700, `text-lg`–`text-2xl`): Section and card headers.
- **Body** (500, `text-sm`–`text-base`): Standard UI copy, form labels, descriptions.
- **Label** (700–900, `text-[10px]`–`text-xs`, `uppercase`, `tracking-widest`): Status badges, eyebrow labels, metadata (dates, counts). Small and loud rather than small and quiet — these are meant to be scanned, not read.

### Named Rules
**The Break-Keep Rule.** Any Korean-bearing text at display or title size gets `break-keep` — Korean text wraps by word/syllable-block, not mid-character, and this is non-negotiable given roughly half the user base reads Korean as their primary language.

## Layout

Mobile-first throughout — the parent scan flow and most of the staff dashboard are used on a phone, in-app-browser-wrapped web, or a Capacitor-wrapped native shell sharing the same design language (confirmed: no per-OS/HIG-vs-Material divergence). Standard Tailwind breakpoints (`sm` 640 / `md` 768 / `lg` 1024 / `xl` 1280) gate responsive changes. Wide data tables (the admin dashboard) hide secondary columns below `md` rather than forcing horizontal scroll on a phone, keeping the primary identity/action columns visible at every width.

## Elevation & Depth

Glassy, ambient bezel — not flat, not hard drop-shadows. Every elevated surface (modal, card, panel) combines a soft, large-blur, low-opacity shadow for ambient lift with a 1px inset highlight along the top/inner edge for a lit-edge, physical-panel feel. Depth reads as "this panel is floating slightly above the dark base," never as a sharp-edged rectangle with a bolted-on shadow.

### Shadow Vocabulary
- **Ambient lift** (`shadow-[0_50px_100px_rgba(0,0,0,0.5)]`): The dominant modal/panel shadow — large blur radius, low opacity, no hard edge.
- **Inset highlight** (`shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]` on dark, `rgba(255,255,255,0.05)` variant for subtler surfaces): The lit top edge that makes the double-bezel read as a physical panel rather than a flat fill.
- **Accent glow** (e.g. `shadow-[0_20px_50px_rgba(249,115,22,0.15–0.3)]`): Reserved for the primary CTA and active/selected states — tinted to Brand Orange, never a generic black shadow, so the glow itself reinforces the one-accent rule.

### Named Rules
**The Tinted Glow Rule.** When a shadow signals emphasis (an active state, a primary CTA), it is tinted to Brand Orange, never left as a neutral black glow — a black glow reads as generic elevation, an orange one reads as "this is the important one."

## Shapes

**The Double-Bezel Rule.** The system's signature form: an outer container at one radius (commonly `rounded-[2rem]`) with a translucent hairline border, wrapping an inner surface inset by a small fixed margin (`p-1.5`) at a correspondingly smaller radius (`calc(2rem - 0.375rem)`). This appears across nearly every modal and elevated card and is the single most distinctive shape decision in the system — new modals/cards should default to this construction, not a plain single-radius card.

Beyond the bezel: generally soft and rounded (`rounded-xl`/`rounded-2xl`/`rounded-3xl` are the most common radii by a wide margin), with `rounded-full` reserved for pills, avatars, and icon-only buttons. Sharp/zero-radius corners do not appear anywhere in the system — softness is consistent, not situational.

## Components

Tactile and warm — buttons, cards, and inputs should feel roomy and inviting to touch, fitting a product parents and teachers use daily, often one-handed, on a phone.

### Buttons
- **Shape:** `rounded-full` for primary/pill actions; `rounded-xl`/`rounded-2xl` for secondary/inline actions.
- **Primary:** Brand Orange fill, white text, tinted accent-glow shadow on emphasis states.
- **Press feedback:** `active:scale-[0.97]` throughout — every pressable element gives immediate tactile feedback on tap, matching the "tactile and warm" component philosophy.
- **Secondary/Ghost:** Low-opacity Brand Orange fill (`bg-orange-500/10`) with matching border and text color, or neutral zinc fill for non-accent actions.

### Cards / Containers
- **Corner style:** Double-bezel construction (see Shapes) for anything that reads as a discrete panel; simpler single-radius `rounded-2xl`/`rounded-3xl` for lighter-weight list items.
- **Background:** Brand Dark or Brand Card, with the Elevated variants reserved specifically for hover states on interactive cards.
- **Border:** Hairline, low-opacity white borders on dark surfaces (`border-white/10`), zinc borders on light surfaces.

### Inputs / Fields
- **Style:** Dark fill (Brand Dark/zinc-950), hairline border, generous internal padding matching the "tactile" component character.
- **Focus:** Border shifts to Brand Orange with a matching focus ring — the one-accent rule extends to interaction states, not just static color.

### Navigation
Rounded pill-shaped nav containers (`rounded-full`) with backdrop blur, consistent with the glassy elevation philosophy — navigation reads as another floating panel, not a flat bar.

## Do's and Don'ts

### Do:
- **Do** use Brand Orange as the only accent color on any given screen — it is the single indicator light on the console, and its rarity is what makes it legible.
- **Do** build new modals/elevated cards with the double-bezel construction (outer shell + inset inner surface) rather than a plain single-radius card.
- **Do** tint emphasis shadows to Brand Orange rather than leaving them neutral black.
- **Do** apply `break-keep` to any Korean-bearing display/title text.
- **Do** give every pressable element `active:scale-[0.97]` press feedback.

### Don't:
- **Don't** combine Brand Orange with purple/pink/indigo in a gradient — that pattern was identified and removed as unintentional drift this session, not a stylistic option.
- **Don't** use bounce/spring easing (`cubic-bezier` overshoot curves) on routine, high-frequency interactions — reserve any bounce for genuinely rare, celebratory moments, and confirm there is one before reaching for it.
- **Don't** use hard, sharp-edged drop-shadows — the system's shadow vocabulary is exclusively soft and ambient.
- **Don't** introduce a new near-black hex value for a "one-off" dark surface — use Brand Dark; ~200 scattered duplicates of this exact mistake were consolidated this session.
