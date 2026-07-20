# Design System: Chekki

## 1. Visual Theme & Atmosphere

A cinematic, offset-asymmetric interface with fluid GSAP choreography. The atmosphere is an "Art Gallery" approach to educational tech—dark, premium, and sophisticated. It eschews the typical primary-colored "school" aesthetic in favor of a deep, high-agency cockpit feel that speaks to parents and modern educators. Variance is high (Offset Asymmetric), density is balanced, and motion is Cinematic.

## 2. Color Palette & Roles

- **Midnight Canvas** (#020617 / Slate 950) — Primary background surface, anchoring the cinematic dark mode.
- **Deep Slate** (#0F172A / Slate 900) — Secondary surface for Bento cards and floating elements.
- **Brand Orange** (#EA580C) — The single primary accent. Used for CTAs, active states, and focus rings. (High contrast, energetic, not neon).
- **Muted Steel** (#94A3B8 / Slate 400) — Secondary text, descriptions, and metadata.
- **Pure White** (#FFFFFF) — Primary Display text and highest-contrast elements.
- **Whisper Border** (rgba(255,255,255,0.05)) — Structural 1px lines separating sections.

## 3. Typography Rules

- **Display:** Plus Jakarta Sans — Track-tight, controlled scale. Hierarchy is driven by weight (font-bold to font-black) and opacity, not just massive size.
- **Body:** Plus Jakarta Sans — Relaxed leading (leading-relaxed), 65ch max-width, neutral secondary color (Muted Steel).
- **Banned:** Inter, generic system fonts for premium contexts. No Times New Roman or Garamond.

## 4. Component Stylings

- **Buttons:** Flat, no outer glow. Tactile `scale-[0.97]` on active state with a snappy `160ms ease-out` transition.
- **Cards (Bento):** Generously rounded corners (`rounded-[2rem]`). Deep background tinting instead of heavy outer shadows. High-density grids use `grid-flow-dense` to ensure zero empty spaces.
- **Media / Images:** Embedded seamlessly. Hovering over cards containing media triggers a slow, weighty scale effect (`duration-700 ease-out hover:scale-105`).
- **Nav:** Floating glass pill (`backdrop-blur-xl`) detached from the top edge.

## 5. Layout Principles

- **AIDA Structure:** Pages must flow through Attention (Hero), Interest (Bento), Desire (Interactive/GSAP), and Action (Footer CTA).
- **Hero:** Strictly Asymmetric. Centered text walls are banned. Max 2-3 lines for the H1 (`clamp(3rem,5.5vw,6rem)`).
- **Spacing:** Massive, cinematic vertical padding between sections (`py-32` to `py-48`).
- **Grid:** CSS Grid over Flexbox for structure. The "3 equal cards horizontally" is banned.

## 6. Motion & Interaction

- **GSAP ScrollTrigger:** Elements fade and scale in as they enter the viewport. Staggered cascade reveals (`stagger: 0.2`) for grouped elements.
- **Scrubbing Reveals:** Text opacity tied directly to the user's scroll position for a weighty, interactive feel.
- **Easings:** `cubic-bezier(0.23, 1, 0.32, 1)` for snappy UI, and `power4.out` / `power3.out` for GSAP entrances. No linear easing.

## 7. Anti-Patterns (Banned)

- NO emojis anywhere in the code or UI.
- NO `Inter` font.
- NO pure black (`#000000`).
- NO neon/outer glow shadows.
- NO centered Hero sections with 6-line text wrapping.
- NO cheap meta-labels ("SECTION 01", "ABOUT US").
- NO generic placeholder names ("John Doe", "Acme").
- NO filler UI text: "Scroll to explore", "Swipe down", bouncing chevrons.
