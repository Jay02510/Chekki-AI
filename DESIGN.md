---
name: Chekki AI
description: Grading by Chekki, praise by Mom. A warm kitchen-table app for a tired parent reading homework results with a child beside her.
colors:
  ground: "#fbf6ee"
  surface: "#ffffff"
  sunken: "#f5ecdf"
  sign: "#3a2c22"
  on-sign: "#fff8f0"
  on-sign-2: "#dccab8"
  ink: "#2b211a"
  ink-2: "#5b4b3f"
  ink-3: "#76665a"
  rule: "#ebdfcf"
  line: "#ef7c1c"
  line-ink: "#a84d06"
  line-soft: "#fdebd8"
  wrong: "#d4462a"
  wrong-soft: "#fce6df"
  right: "#1f8a4c"
  right-soft: "#e1f3e6"
  tile: "rgba(239, 124, 28, 0.10)"
  ground-dark: "#17120f"
  surface-dark: "#221b16"
  sunken-dark: "#110d0b"
  sign-dark: "#2e241d"
  on-sign-2-dark: "#cdb9a6"
  ink-dark: "#f7efe6"
  ink-2-dark: "#d3c4b5"
  ink-3-dark: "#a8988a"
  rule-dark: "#3a2f27"
  line-dark: "#f28a35"
  line-ink-dark: "#f6a560"
  line-soft-dark: "#3d2716"
  wrong-dark: "#ff7a66"
  wrong-soft-dark: "#3d1f19"
  right-dark: "#4cd48a"
  right-soft-dark: "#15301f"
  tile-dark: "rgba(242, 138, 53, 0.10)"
  ink-on-line: "#2b211a"
  scrim: "rgba(43, 33, 26, 0.55)"
typography:
  display:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "28px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "17px"
    fontWeight: 800
    lineHeight: 1.375
  body:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "15px"
    fontWeight: 500
    lineHeight: 1.625
  input:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: 1.5
  label:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "'Pretendard Variable', Pretendard, -apple-system, 'Apple SD Gothic Neo', sans-serif"
    fontSize: "13px"
    fontWeight: 600
    lineHeight: 1.3
rounded:
  sm: "4px"
  md: "14px"
  lg: "20px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "20px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.line}"
    textColor: "{colors.ink-on-line}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "48px"
  button-outline:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 24px"
    height: "48px"
  button-sign:
    backgroundColor: "{colors.sign}"
    textColor: "{colors.on-sign}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-destructive:
    backgroundColor: "{colors.wrong}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    height: "48px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "16px 20px"
  note:
    backgroundColor: "{colors.line-soft}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "12px 16px"
  input-text:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink}"
    typography: "{typography.input}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "48px"
  segmented-toggle:
    backgroundColor: "{colors.sunken}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "2px"
  sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
  roundel:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "32px"
---

# Design System: Chekki AI (parent app)

Scope: the parent app (`app.html` → `App.tsx`, `components/`) the marketing landing page (`index.html` → `src/Landing.tsx`), and the parent pages that render through the landing bundle (`/subscribe`, `/privacy`, `/terms`, `/refund`, `/youth`, `/support`). `/faq` (`src/pages/FaqPage.tsx`) and the academy landing `/schools` (`src/pages/SchoolsLandingPage.tsx`) are covered too. The staff dashboards (`src/pages/TeacherPage.tsx`, `src/components/`) still use the older dark look and are **not** covered here.

## Overview

**Creative North Star: "The Kitchen Table"**

The reader is Min-ji: a tired parent, often reading in her second language, with a 5 to 7 year old next to her looking at the same screen. Every screen should feel like homework spread out on a warm table under a lamp: cream paper, cocoa ink, one orange pencil line, and Chekki the mascot keeping things light.

Three jobs, in order:

1. **One obvious next action.** Each screen has one big orange button. Everything else is quieter.
2. **Korean first, little reading.** Short sentences in plain 해요체. Korean leads when the app is in Korean; English sits small underneath only where it helps.
3. **Never scold in front of the child.** Wrong answers are "같이 볼 문제", not red crosses. A pronunciation miss is a gentle orange note, not an error.

This replaced the earlier "Seoul Metro" direction (charcoal station signs, platform tiles) on 2026-10-07 after parent testing said it felt official, not mom-and-child. What survived: the orange line, numbered roundels, Pretendard, and the Korean-over-English pairing.

**Key characteristics**

- Cream ground with a soft orange "lamp" glow at the top of full-screen states (`.tile-ground`).
- White cards with a 1px inset Rule ring, 14px corners. Flat; no resting shadows.
- One accent: Chekki orange. Text on orange is always cocoa ink, never white.
- Red and green are signals only (wrong/right, error/success).
- Modals are bottom sheets on phones and centred cards from `sm` up.
- Light and dark follow the device, with a manual override in Settings. Both are first-class.

## Colors

All colours live as `--m-*` variables in `tokens.css` and swap together under `html.dark`. Use the Tailwind utilities (`bg-ground`, `text-ink-2`, `ring-rule`, ...), never raw hex, with one exception: ink on orange is written `text-[#2b211a]` because it must stay dark in both themes.

### Primary

- **Chekki Orange** (`line`): the primary button, focus outline, caret, selection, progress fills, the active roundel, selected chip rings.
- **Orange Ink** (`line-ink`): orange that is dark enough for text. Links, small labels ("Premium", "같이 볼 문제"), counts, icons inside Orange Wash circles.
- **Orange Wash** (`line-soft`): notes, praise, selected options, suggestion chips, icon circles, the user's own chat bubbles.

### Signals (reserved)

- **Wrong** (`wrong`, `wrong-soft`): wrong-answer marks on the result screen, real errors (`role="alert"`), destructive actions (leave class, delete account). Nothing else.
- **Right** (`right` / `correct`, `right-soft`): right-answer marks, success notices ("연결됐어요"). Nothing else.

`text-right` is also Tailwind's `text-align: right`, so green text is written **`text-correct`**. `--color-right` only exists in the app bundle (`index.css`); the landing bundle deliberately does not define it so staff pages keep `text-right` as alignment.

### Neutrals

- **Ground** (`ground`): page background and the Settings sheet body.
- **Surface** (`surface`): cards, sheets, outline buttons, menus.
- **Sunken** (`sunken`): inputs, segmented-control tracks, info boxes inside cards, Chekki's chat bubbles.
- **Cocoa** (`sign`, `on-sign`, `on-sign-2`): the dark panel used by onboarding, toasts, the mobile app banner, the selected thumb of a segmented control, and secondary solid buttons.
- **Ink 1/2/3** (`ink`, `ink-2`, `ink-3`): headings and body, supporting text, captions and placeholders. Ink 3 is still readable; never fade text further with opacity.
- **Rule** (`rule`): 1px rings and dividers.
- **Scrim**: modal backdrops are `bg-[#2b211a]/55`. No blur.

### Named rules

**The One Pencil Rule.** Orange is the only accent. No purple, pink, blue, emerald or gradients.

**The Ink-on-Orange Rule.** Text and icons on `bg-line` are `text-[#2b211a]` in both themes.

**The No-Scolding Rule.** Red never appears on anything the child did in a practice or review mode. Use Orange Wash and a kind sentence instead.

## Typography

One family: **Pretendard Variable**, self-hosted, Korean and Latin together. `word-break: keep-all` everywhere (`break-keep`) so Korean wraps at word boundaries. Legacy aliases (`font-display`, `font-korean`, `font-hand`, `font-serif`) all resolve to Pretendard; don't add new ones.

| Role | Size / weight | Use |
| --- | --- | --- |
| Display | 28px (34px `sm+`) / 800, -0.02em | Page titles (Help, Flashcards done) |
| Headline | 20 to 22px / 800, -0.02em | Sheet and modal titles |
| Title | 17px / 800 | Card titles, dialog questions |
| Body | 15px / 500, 1.625 | Paragraphs, button labels |
| Input | **16px** / 500 | Every text input and textarea (stops iOS zoom) |
| Label | 14px / 600 | Field labels, secondary buttons, links |
| Caption | 13px / 600 to 700 | Section headers above cards, badges |

Rules:

- Nothing parent-facing below 12px. The old 9 to 11px uppercase tracking labels are gone; don't bring them back.
- No `uppercase` and no wide letter-spacing on Korean or English UI text.
- Numbers that change or line up use `.num` (tabular figures).

## Layout

- Phone first. Single column, 16px side gutter (`px-4`), content max `max-w-2xl` for reading pages.
- Section rhythm: a caption-size section title (`text-[13px] font-bold text-ink-3 mb-2.5`) above a card; 28px between sections.
- Tap targets are at least 44px (`min-h-11`); primary and outline buttons are 48px (`min-h-12`); the flashcard and practice buttons are 56px (`min-h-14`) because a child may press them.
- Respect safe areas on sheets and full-screen views (`env(safe-area-inset-*)`).

## Elevation

Flat at rest. Separation comes from tone (white on cream, sunken inside white) and 1px inset rings. Only layers that float get a shadow: `shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)]` for sheets and modals, `0 16px 40px -16px rgba(0,0,0,0.5)` for toasts. No glass, no backdrop blur, no glows, no "double bezel" frames.

## Shapes

- `rounded-md` = 14px: cards, buttons, inputs, notes.
- `rounded-lg` = 20px: sheets, modals, full flashcards.
- `rounded` = 4px: segmented thumbs and tiny tags.
- `rounded-full`: roundels, avatar, icon circles, pills.

## Components

### Sheet / modal

- Phone: bottom sheet (`items-end`, `rounded-t-lg`, full width). `sm+`: centred card (`sm:items-center sm:rounded-lg`, `sm:max-w-md` to `sm:max-w-xl`).
- Header row: headline left, 44px close button right (`X` from Phosphor, `text-ink-3`, `hover:bg-sunken`). Body scrolls; a sticky footer holds the one primary action.
- Every modal uses `useDialogA11y` (focus trap, Escape, focus return) and `useModalExit` (`.modal-enter` / `.modal-exit`). If closing would lose typed text, route Escape through the same "are you sure" path as the close button.
- Shared with staff pages: `ConfirmDialog` and `FeedbackModal` take a `warm` prop. Parent call sites pass `warm`; staff call sites don't, so their old look is untouched.

### Buttons

- **Primary**: `bg-line text-[#2b211a] min-h-12 rounded-md text-[15px] font-bold btn-press`. One per screen.
- **Outline**: `bg-surface ring-1 ring-inset ring-rule text-ink`, ring darkens to `ink-3` on hover.
- **Cocoa**: `bg-sign text-on-sign` for a strong secondary (sign up inside a notice, App Store button).
- **Destructive**: `bg-wrong text-white`. Only inside a confirm step. The entry point is a red underlined text link, not a big red button.
- **Quiet**: text button, `text-ink-2` or `text-ink-3`, still 44px tall.
- Disabled is `opacity-40` to `opacity-50`. Loading replaces the label with a small ink spinner.

### Choice chips and options

Full-width 48px rows: unselected `bg-surface ring-1 ring-rule text-ink-2`; selected `bg-line-soft ring-2 ring-line text-ink` with a filled orange radio dot. Use `aria-pressed`.

### Segmented toggle

`bg-sunken p-0.5 rounded-md` track; selected thumb `bg-sign text-on-sign` (`dark:bg-ink dark:text-ground`), 40px tall, 14px bold. Language toggles read "한국어 / English".

### Inputs

`bg-sunken ring-1 ring-inset ring-rule rounded-md min-h-12 px-4 text-[16px]`, placeholder `text-ink-3`, focus `ring-2 ring-line`. Always a visible `<label>` above, 14px semibold `ink-2`.

### Cards, notes, foldable cards

- Card: `bg-surface ring-1 ring-inset ring-rule rounded-md p-4 sm:p-5`.
- Note: `bg-line-soft rounded-md p-3 text-ink` for gentle notices (pending approval, trial ending, billing caveats).
- Success note: `bg-right-soft`. Error note: `bg-wrong-soft text-wrong`.
- `Fold` (`components/metro.tsx`): a native `<details>` card with an orange-wash icon circle, title, sub-line and caret. Use it for anything most parents won't need (privacy and device check in Settings, dashboard sections).

### Roundel

Numbered circle from `metro.tsx`: `current` is solid orange with ink number; `next` is white with an orange ring; `done` is solid cocoa; `wrong`/`right` rings for answers. Used for the Help steps and the loop strip.

### Chekki the mascot

Use the transparent images in `public/images/` (`chekki-wave`, `chekki-thumbs`, `chekki-analyzing`, `chekki-holding-laptop`) at 96 to 128px for empty, success and waiting states. Chekki replaces emoji icons and trophy icons. In chat, Chekki's avatar is a 36px orange-ringed circle.

### Chat (Ask Chekki)

Parent bubbles right-aligned in Orange Wash; Chekki bubbles left in Sunken with the avatar. Input is a single rounded field with an orange send button inside it. Suggestions wrap as orange-wash pills under the input; no hidden horizontal scroll.

### Child-facing practice (flashcards, speaking)

Full-screen on the cream ground. Big type (26 to 46px), one card, a thin orange progress line, two big buttons ("다시 볼래요" outline, "알았어요!" orange). Completion shows Chekki thumbs-up and "N개 중 M개 알았어요". A small warm-coloured confetti burst is allowed here only, and is skipped under reduced motion.

### Toasts and banners

Toasts: cocoa panel (or `wrong` for errors), white text, slide down under the app bar. The mobile-web app banner is a cocoa strip with an orange "받기" button and a 44px dismiss.

## Motion

- Entrances use the arrive ease `cubic-bezier(0.16, 1, 0.3, 1)`; sheets use `.modal-enter` / `.modal-exit`.
- Press feedback is `.btn-press` (scale 0.97).
- Allowed moments: the loop-strip marker arriving, the flashcard flip, the practice-complete confetti.
- Everything respects `prefers-reduced-motion` (global override in `index.css`).

## Landing page

`src/Landing.tsx`, same tokens and rules as the app. Order: hero (tagline, one orange "지금 무료로 채점해 보기" that opens `/app` as a guest, plus a card saying Chekki is designed for phones with an app link), three steps, why-not-a-chatbot, academy (free via invite, copy a message for the director, link to `/schools`), pricing (₩0 / ₩9,900 / ₩99,000), three FAQs, closing CTA, footer with business info. The app bar always shows the language and theme toggles, on every width. The theme follows the device until the visitor picks one; `useWarmTheme()` in `src/lib/theme.ts` saves the choice under `chekki_theme_override`, the same key the app reads. `/faq` uses the same hook. CTA clicks log `landing_start_scan` / `landing_get_app` via `src/lib/track.ts`.

## Schools landing

`src/pages/SchoolsLandingPage.tsx`, same tokens, set a little denser for directors and teachers (15 to 16px body, tables, two columns). The page is six questions a director actually asks. Each is a closed fold (`QFold`, a native `<details>` with a roundel, the question and a caret); opening it shows one bold sentence, a few checked points and a small proof card. Order: hero (headline, one orange "7일 무료로 시작하기" to `/teacher?activate=true&role=director&plan=…`, Chekki holding a laptop on the right), the question list titled "원장님들이 먼저 묻는 것": grading accuracy, FT log to KT-reviewed report, home homework reaching the teacher, what parents pay, pricing table, getting started, readiness check and teacher resources, cocoa closing panel (trial first, consultation second), footer.

- **Proof cards** are white cards with a 1px rule ring and a "예시 화면 / Sample" tag top right. Anything that looks like data on them is sample data and must carry that tag.
- **Pricing** reads prices and seats from `api/_lib/pricingTiers.ts`; never hand-copy numbers. Rows list seats and price only. Solo and Starter start the trial; School Pro and Enterprise open the consultation sheet.
- **Sticky question rail** (lg and up): sits under the list title and only appears while a question is open and being read, showing done / current / next. Rail links, the header "요금" link and `#q1`–`#q6` URLs open the matching fold and scroll to it. The page root uses `overflow-x-clip`, not `overflow-x-hidden`, or sticky elements stop sticking.
- **Questions and answers** live in `src/data/schoolsFaq.ts`; the page and the build-time prerender (crawlable text plus FAQPage JSON-LD for `/schools` and `/en/schools`) both read it, so edit copy there.
- **Grading-time calculator** after the questions: the director's own student count, sheets per week and minutes per sheet, giving hours of hand-grading per week. It shows their numbers back; it never claims a percentage saved.
- **Sticky trial bar** on phones: appears once the hero button scrolls away, hides while the closing panel, the menu or the consultation sheet is on screen.
- **Steps** are an orange line with roundels on it (vertical on phones, across from `sm`), not a row of cards.
- **Consultation** is a bottom sheet on phones and a centred card from `sm`, posting to `/api/request-school-invoice`.
- No response-time, refund-guarantee, "most popular", per-plan student-count or feature-gating claims unless the product backs them.

## Copy

- Korean in 해요체, short. "다시 설명 받기", not "새로운 추천 받기". "처음으로", not "결과 삭제 (처음으로)".
- Never claim what we can't back up: no "1초 채점", no "photos are never stored" (the privacy policy says images are kept). Grading speed claims stay vague ("바로").
- Errors say what to do next: "보내지 못했어요. 잠시 후 다시 시도해 주세요."

## Do's and Don'ts

### Do

- Start from tokens; check both themes.
- Keep one orange primary action per screen and make it 48px or taller.
- Put rarely needed things in a `Fold` or at the bottom.
- Use Chekki images for empty, waiting and success states.
- Give every icon-only button an `aria-label` in the current language.

### Don't

- Don't use `zinc`, `slate`, `indigo`, `purple`, `emerald`, `pink`, `brand-*` or `white/5`-style classes in parent screens. Quick check: `grep -nE '(zinc|indigo|purple|emerald|brand-|white/[0-9])' components/*.tsx`.
- Don't use `backdrop-blur`, glow shadows, gradient text, or nested "bezel" frames.
- Don't use `text-right` for colour; use `text-correct`.
- Don't put white text on orange.
- Don't add 9 to 11px uppercase labels, emoji as icons, or English-only strings.
- Don't show red on the child's practice attempts.

## Known gaps

- Staff dashboards (FT, KT, Director) are not on this system yet.
- The landing bundle's `font-sans` is Onest (for the staff pages). Parent pages on that bundle opt into Pretendard with `font-warm`; use it on any new parent page there.
