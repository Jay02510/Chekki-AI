---
name: Chekki AI
description: Grading by Chekki, praise by Mom. Each week is one trip around the loop line, told in Seoul Metro station signage.
colors:
  line: "#ef7c1c"
  line-ink: "#a84d06"
  line-soft: "#fde9d7"
  wrong: "#d1242b"
  wrong-soft: "#fbe3e3"
  right: "#0a7a3e"
  right-soft: "#dcf1e4"
  sign: "#1e2226"
  on-sign: "#ffffff"
  on-sign-2: "#b4bac1"
  ground: "#f3f4f1"
  surface: "#ffffff"
  sunken: "#e9ebe7"
  ink: "#16191c"
  ink-2: "#474d55"
  ink-3: "#5f666e"
  rule: "#d6d9d4"
  tile-joint: "rgba(22, 25, 28, 0.055)"
  line-dark: "#f08a32"
  line-ink-dark: "#f6a560"
  line-soft-dark: "#3a2614"
  wrong-dark: "#ff6369"
  wrong-soft-dark: "#3a1a1c"
  right-dark: "#3fd07f"
  right-soft-dark: "#12301f"
  sign-dark: "#262b31"
  on-sign-2-dark: "#a9b0b8"
  ground-dark: "#101215"
  surface-dark: "#181b1f"
  sunken-dark: "#0b0c0e"
  ink-dark: "#f1f2ef"
  ink-2-dark: "#bcc1c7"
  ink-3-dark: "#959ba2"
  rule-dark: "#2d3238"
  tile-joint-dark: "rgba(255, 255, 255, 0.04)"
typography:
  sign-display:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "44px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  sign-display-mobile:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  door:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "36px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "26px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "17px"
    fontWeight: 700
    lineHeight: 1.375
  body:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.625
  label:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.25
  secondary-line:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0"
rounded:
  sm: "4px"
  md: "6px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
  tile: "48px"
components:
  button-door:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    typography: "{typography.door}"
    rounded: "{rounded.md}"
    padding: "32px"
    height: "232px"
  button-primary:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  button-sign:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.on-sign}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  station-sign:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.on-sign}"
    typography: "{typography.sign-display}"
    rounded: "{rounded.md}"
    padding: "32px 32px 40px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  note-line:
    backgroundColor: "{colors.line-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  input-text:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "12px"
  segmented-toggle:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px"
  roundel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "32px"
  roundel-stop:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "44px"
---

> **Warm pass (2026-10-07), supersedes the colour and signage parts below.** Parent testing said the metro look felt official, not mom-and-child. The parent app now uses the "kitchen table" palette in `index.css`: cream ground `#fbf6ee`, cocoa ink and sign `#2b211a` / `#3a2c22`, a softer coral for wrong answers `#d4462a`, a warm lamp glow instead of the floor tiles, and `rounded-md` = 14px. Charcoal station signs are gone from the parent screens: the home is a big transparent Chekki, one scan button, and three honest "why not a chatbot" cards for guests. Results open praise first, then the misses one at a time ("같이 볼 문제 1 / 2"), with "전체 보기" for the full list. The orange line, numbered roundels, Pretendard and the Korean-over-English pairing stay.


# Design System: Chekki AI

## Overview

**Creative North Star: "The Loop Line"**

Every parent screen is a Seoul Metro station. The family is always at a stop, the previous stop and the next one are named, and the week is one trip around a single orange line. Charcoal enamel sign panels carry the "you are here" moment; a pale platform-tile ground sits under everything; numbered roundels mark each step, and on the result route each question is a stop on a vertical rail.

The reader is a tired parent with her child beside her, often reading in her second language. So the system is built like transit signage: big heavy Korean (or the user's language) first, the other language small underneath, one action the size of a platform door, and colour that carries meaning rather than decoration. Orange means "the line / go here". Red appears only on wrong answers, green only on right ones. Light and dark follow the device; both are first-class.

The world is flat. Tone blocks, 1px tile joints, ring outlines and a 6px line do all the structural work. It refuses the in-app marketing hero: no giant slogan headline, no floating mascot card, no glow, no glass.

**Key Characteristics:**
- Charcoal station sign with the orange line along its foot as the first thing on a screen.
- One orange line (6px), drawn as rails, sign feet and roundel rings.
- Bilingual pairs: primary line large and heavy, secondary line small and medium, hidden when identical.
- Pretendard only, at weights 500 to 800.
- Platform-tile ground (48px grid, 1px joints) behind full-screen states.
- Flat tone blocks; soft corners (6px); circles only for roundels and the mascot badge.
- Light and dark themes swap the same token names.

## Colors

A grey platform palette with one transit orange and two strictly reserved signal colours; every value has a light and a dark (`-dark`) twin under the same role.

### Primary
- **Line Orange** (`line` / `line-dark`): Chekki's line. The scan door, the primary action button, rails, the sign's 6px foot, the current-stop roundel fill, focus outline, caret and text selection. Text on orange is always ink (#16191c), never white.
- **Line Ink** (`line-ink` / `line-ink-dark`): orange dark enough to read as text. Links, inline counts, "next" labels, the PRO tag text.
- **Line Wash** (`line-soft` / `line-soft-dark`): quiet orange tone block for teacher-report notes, praise lines and the tutor-script panel.

### Secondary (signal colours, reserved)
- **Wrong Red** (`wrong`, `wrong-soft`): wrong-answer roundel rings and their gentle label, destructive menu items, error toasts, the record-in-progress state. Nothing else.
- **Right Green** (`right`, `right-soft`): right-answer roundel rings, "맞았어요 / Right", success panels. Nothing else.

### Neutral
- **Enamel Charcoal** (`sign` / `sign-dark`): station signs, result header sign, toasts, secondary solid buttons, the done-stop roundel in light mode.
- **Sign White** and **Sign Grey** (`on-sign`, `on-sign-2`): primary and secondary text on charcoal.
- **Platform Ground** (`ground`): page background; carries the tile pattern on full-screen states.
- **Panel White** (`surface`): cards, stops, outline buttons, menus.
- **Recess** (`sunken`): text inputs, the language/mode segmented control, tip panels, skeletons.
- **Ink 1 / 2 / 3** (`ink`, `ink-2`, `ink-3`): heading and body text, supporting text, captions and off-stop labels. Ink 3 stays at legible contrast on both grounds; it is not a decorative fade.
- **Rule** (`rule`): 1px inset rings on cards and buttons, dividers, the unlit part of the rail.
- **Tile Joint** (`tile-joint`): the 1px platform-tile lines only.

### Named Rules
**The One Line Rule.** There is one accent hue: orange. No second brand colour, no gradients of it, no tints beyond Line Wash.

**The Signal Reservation Rule.** Red means a wrong answer or a real error; green means a right answer or success. Neither is ever used for decoration, category, or emphasis.

**The Ink-on-Orange Rule.** Text and icons on Line Orange are charcoal ink (#16191c) in both themes, never white.

## Typography

**Display Font:** Pretendard Variable (with Pretendard, -apple-system, Apple SD Gothic Neo, Malgun Gothic, sans-serif)
**Body Font:** Pretendard Variable (same stack)

**Character:** One Korean-first grotesque at every size, the way station signage uses one family. Hierarchy comes from weight (800 for sign names, 700 for titles and buttons, 500 to 600 for text) and from the bilingual pairing, never from a second face. Legacy family aliases (display, hand, korean, serif) all resolve to Pretendard. Text uses `word-break: keep-all` so Korean breaks at word boundaries; numbers that line up use tabular figures.

### Hierarchy
- **Sign Display** (800, 44px desktop / 30px at 400px+ / 26px phone, 1.15, -0.02em): the current stop name on the station sign. One per screen.
- **Door** (800, 36px desktop / 28px phone, 1.15, -0.02em): the label on the platform-door scan button.
- **Headline** (800, 26px / 22px phone, 1.15, -0.02em): result header sign title, grading sign title (34px / 30px).
- **Title** (700, 15 to 17px, ~1.375): card titles, question text (16px semibold), tutor script (17px semibold), loading tip.
- **Body** (500, 15px, 1.625): paragraphs, teacher reports, inputs. Translations and supporting text at 14px in Ink 2.
- **Label** (600 to 700, 13px): stop labels, status labels ("아이와 같이 보기"), menu items, adjacent-stop names on the sign.
- **Secondary Line** (500, 11 to 12px under labels, 15 to 18px under sign names, 1.3): the other-language line, always smaller and lighter than its primary.

### Named Rules
**The Station Pair Rule.** Bilingual text is a pair: the user's language is the primary line (large, 700 to 800), the other language sits directly under it (small, 500, Ink 3 or Sign Grey). If the two are identical the secondary is dropped. Never set them side by side at equal size.

**The One Family Rule.** Pretendard only. No display face, no handwriting face, no monospace for flavour.

## Layout

Single column on phones, centred at up to 1024px (scan home, `max-w-5xl`) with an app bar up to 1280px. The scan home stacks: station sign, platform-door button (left, 1.5fr) beside one-word photo tips and a privacy line (right, 1fr) on desktop, then the loop strip spanning both columns; on phones the order is sign, door, privacy, loop strip, 3-up tips. The result route splits 50/50 at `lg` (worksheet image sticky on the left, route rail scrolling on the right) and stacks on smaller screens.

Spacing runs on a 4px base: 16px gaps between major blocks, 12px within stacks, 20 to 32px card padding (tighter on phones), 48px platform tiles. Tap targets are at least 44px (`min-h-11`), primary buttons 48px, the scan door 150px tall on phones and 232px on desktop.

**The Door-Sized Action Rule.** Each screen has one primary action, and it is big: the scan door fills its column. Secondary actions are outline or charcoal buttons at 44 to 48px.

## Elevation & Depth

Flat by default. Depth comes from tone (charcoal sign over grey ground, white panel over ground, recessed inputs) and from 1px inset rings in Rule. Nothing at rest casts a shadow. The only shadow in the system belongs to layers that genuinely float above content: the account menu, toasts and modals.

### Shadow Vocabulary
- **Floating layer** (`box-shadow: 0 16px 40px -12px rgba(0,0,0,0.35)`; toasts use `0 16px 40px -16px rgba(0,0,0,0.5)`): dropdown menus and fixed toasts only.

### Named Rules
**The Enamel Rule.** Surfaces are flat tone blocks. No glass, no backdrop blur, no glow, no gradient sheen. If a resting element needs separation, use a Rule ring or a tone step, not a shadow.

## Shapes

Softly squared panels (6px) for signs, cards, buttons, inputs and toasts; 4px for small chips, tags and segmented-control thumbs. Circles are reserved for roundels, the mascot badge (orange ring 3 to 6px) and the avatar. Lines are fully rounded bars: the 6px rail and the 6px sign foot. Rings are inset so outlines never shift layout. The platform tile is a flat square 48px grid of 1px joints, never dots or noise.

## Components

### Station Sign (signature)
The "you are here" panel. Charcoal block, 6px radius, 6px orange line along the bottom edge. Three columns on desktop: previous stop (left arrow, 13px semibold Sign Grey, secondary line under it), current stop centred with an optional mascot roundel badge, next stop (right arrow). On phones the current stop sits on top and prev/next share a row beneath. The current name uses Sign Display; its secondary line uses Sign Grey at 15 to 18px. Used on scan home, grading, and (as a simpler title sign) the result header.

### Roundel
A station ring: circle, border width max(3px, size/9), centred tabular number at 42% of size, weight 800. States: **current** solid orange with ink number; **done** solid charcoal (ink in dark mode); **next** white with orange ring; **off** white with Rule ring and Ink 3 number; **wrong** white with red ring; **right** white with green ring. 32px in the loop strip, 44px on the route rail.

### Loop Strip (signature motion)
The week's stops on a horizontal rail. Grey 6px rail across, orange fill up to the current stop, one roundel per stop with a label pair beneath (current in 800 Ink, done 600 Ink 2, off 500 Ink 3). A 28px orange marker with a 4px ground-coloured ring "arrives" at the current stop from the previous one on mount: 700ms, `cubic-bezier(0.16, 1, 0.3, 1)` (the arrive ease). This is the world's one motion moment.

### Route Rail
The result screen: a vertical 6px orange rail at the left, each question a stop with a 44px roundel and a white card. Wrong stops are ringed red and labelled "아이와 같이 보기 / Let's look together" in red; right stops are ringed green with a check and "맞았어요 / Right"; ungraded stops use Line Ink. The open stop's card takes a 2px orange inset ring.

### Grading (in transit)
Full-screen tile ground. A station sign shows the mascot badge (6px orange ring) and the stop name; below, a white panel draws a rail between a done roundel (Scan) and a next roundel (Explain) with an orange pill travelling between them (1.8s loop). No percentage bar. A rotating tip line sits under a Rule divider.

### Buttons
- **Shape:** softly squared (6px).
- **Platform door:** Line Orange block filling its column, 24 to 32px padding, a 56px ink circle holding the camera icon in orange, Door-size label pair in ink. Press scales to 0.99. Locked state turns white with a 2px Rule ring and a charcoal lock circle.
- **Primary:** Line Orange, ink text, 15px bold, 48px tall.
- **Sign (solid secondary):** charcoal, Sign White text, 14 to 15px bold, 40 to 44px tall. Used for sign-in, submit, unlock.
- **Outline:** white panel with a 1px inset Rule ring, ink text, ring darkens to Ink 3 on hover.
- **Focus:** every focusable element gets a 3px Line Orange outline at 2px offset.

### Segmented Toggle
Language (한 / EN) and mode (Tutor / Speed) switches: a recessed `sunken` track with 2px padding; the selected thumb is charcoal (or orange for mode) with bold 13px text, 36px tall.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** white panel; Line Wash for notes and praise; Recess for tips; Right Wash for success.
- **Shadow Strategy:** none (see Elevation).
- **Border:** 1px inset Rule ring.
- **Internal Padding:** 16 to 20px on phones, up to 32px on desktop. Lists inside cards divide with 1px Rule lines.

### Inputs / Fields
- **Style:** Recess background, 1px inset Rule ring, 6px radius, 15px ink text, Ink 3 placeholder.
- **Focus:** ring thickens to 2px Line Orange.
- **Disabled:** 60% opacity on the paired submit button.

### Navigation
A 56px app bar on the ground: mascot badge (36px, 3px orange ring) and wordmark left; home icon, language toggle and a charcoal sign-in button or charcoal initial avatar right. The account menu is a white panel with a Rule ring, the floating-layer shadow and a slide-down entry; its top action is an orange row, its sign-out row is red text.

### Toasts / Notices
Charcoal (or Wrong Red for errors) 6px panels fixed under the app bar, max 576px wide, white text, floating-layer shadow, slide-down entry.

## Do's and Don'ts

### Do:
- **Do** open each parent screen with a station sign that names where the family is, where they came from and what comes next.
- **Do** set every user-facing label as a Station Pair: primary language large and heavy, the other language small beneath, dropped when identical.
- **Do** keep one door-sized primary action per screen, in Line Orange with ink text.
- **Do** use roundels and the 6px orange rail for any sequence of steps or questions.
- **Do** keep red for wrong answers and errors and green for right answers and success, and phrase wrong answers gently ("아이와 같이 보기 / Let's look together").
- **Do** define every colour through the `--m-*` tokens so light and dark swap together; the theme follows `prefers-color-scheme` unless the user overrides it.
- **Do** keep tap targets at 44px or larger and the 3px orange focus outline intact.

### Don't:
- **Don't** build an in-app marketing hero: no giant slogan headline, no floating mascot card, no glow.
- **Don't** use glass, backdrop blur, gradients or glow shadows; surfaces are flat enamel and tile.
- **Don't** add a second accent colour or use red/green for anything but answer correctness and real status.
- **Don't** mark wrong answers with ✕ or the word "wrong".
- **Don't** add a fake percentage progress bar or confetti; the train arrival is the only motion moment, and grading is shown as a train in transit.
- **Don't** introduce another typeface; Pretendard carries every role.
- **Don't** set white text on Line Orange.
