---
name: Chekki AI
description: 영어 숙제 채점 & 티칭 - 채점은 채키가, 칭찬은 부모님이.
colors:
  primary: '#F97316'
  brand-dark: '#050505'
  brand-card: '#0F1014'
  accent-purple: '#8B5CF6'
  accent-pink: '#EC4899'
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
  card-container:
    backgroundColor: '{colors.brand-card}'
    rounded: '{rounded.md}'
    padding: '24px'
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

- **Accent Purple** (#8B5CF6): Used for secondary tags, teacher tools, and structured guidelines.
- **Accent Pink** (#EC4899): Used for reward state indicators, dopamine hits, and badges.

### Neutral

- **Brand Dark** (#050505): The primary background color for the application shell.
- **Brand Card** (#0F1014): The container card background, providing subtle layer separation.
- **Neutral Text** (#FDFAF5): Warm off-white for body copy, avoiding harsh pure-white reading glare.

### Named Rules

**The 10% Pop Rule.** Bold, primary colors (Orange, Purple, Pink) should only cover ≤10% of any screen. The dark background handles the structural weight; colors are reserved for interactive and feedback actions.

---

## 3. Typography

**Display Font:** Space Grotesk (Vite app) / Fraunces (Landing page)
**Body Font:** Nunito / Noto Sans KR (Bilingual body copy)
**Handwritten Font:** Patrick Hand (Cursive scripts and sheet markings)

### Hierarchy

- **Display** (Bold (700), clamp(2rem, 5vw, 3.5rem), 1.1): Used for large hero text and major feature headers.
- **Headline** (Semi-Bold (600), 24px, 1.2): Section titles and modal headers.
- **Title** (Medium (500), 18px, 1.3): Product titles and card headers.
- **Body** (Regular (400), 16px, 1.6): Standard reading text and scripts. Maximum line length capped at 70ch.
- **Label** (Bold (700), 12px, tracking 0.1em, uppercase): Used for eyebrows, category tags, and active states.

### Named Rules

**The Handwriting Offset Rule.** Any text written in the handwritten font (`Patrick Hand`) should be slightly rotated (-1deg to 2deg) to feel authentically drawn on the paper.

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

---

## 6. Do's and Don'ts

### Do:

- **Do** wrap bilingual copy in containers that prevent alignment breakage between Korean and English line heights.
- **Do** use native browser zoom configurations by keeping the viewport tag free of `user-scalable=no`.
- **Do** tilt hand-drawn annotations to preserve the "Playful Homework Helper" feel.

### Don't:

- **Don't** use generic stark blue-to-purple CSS gradient text.
- **Don't** hide critical audience-specific entry points behind generic tab filters; stack them with clear anchors.
- **Don't** animate image cards on hover; use border/glow highlights on the parent container instead.
