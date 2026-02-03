
# 🎓 Chekki AI: Project Oversight & Strategic Architecture

**Tagline:** "채점은 채키가, 칭찬은 엄마가" (Grading by Chekki, Praise by Mom)
**Vision:** Transforming the "Homework Battle" into a "Bonding Moment" using high-fidelity Educational AI.

---

## 1. Executive Summary (The Marketing Hook)
Chekki AI is a specialized educational companion for Korean parents whose children attend English Kindergarten (EK). It solves the "Double Stress" of EK homework: the difficulty of the English content itself and the emotional friction of correction. Chekki doesn't just provide answers; it provides the *words* and *methods* for a parent to teach with confidence and love.

---

## 2. Technical Architecture (The "Engine")

### A. The Hybrid AI Routing Strategy
Chekki uses a proprietary "Parallel Hybrid Execution" model to balance extreme speed with deep reasoning:
1.  **Fast Path (Gemini 3 Flash):** Handles the initial worksheet summary, title extraction, and UI layout.
2.  **Deep Path (Gemini 3 Pro):** Executes rigorous item extraction, handwriting analysis, and pedagogical content generation.
3.  **Optimization:** Both models fire simultaneously on the server side (`api/analyze.ts`) using `Promise.all`. This cuts user-perceived latency by 50% compared to sequential processing.

### B. "Thinking Budget" Tuning
*   **Item Extraction:** Set to a strict **20,000 token thinking budget**. This allows the AI to "double-check" its OCR against the pedagogical context (e.g., ensuring a "B" isn't confused with an "8" in a phonics exercise) without inducing long wait times.

---

## 3. Core Functional Pillars (Feature Breakdown)

### I. Vision & Overlay (The "Magic" Moment)
*   **Skeuomorphic Markers:** Answers appear directly on the digital worksheet with a high-end "Ink" aesthetic.
*   **Interactive Magnifier:** Tapping an answer centers the view on that specific exercise, bridging the gap between physical paper and digital data.

### II. The "Mom's Script" (Pedagogical UI)
*   **Emotional Intelligence:** Every answer includes a `teaching_script_ko`. This isn't a dry explanation; it's a warm, scripted sentence like *"Wow, you found the 'Apple'! Can we say it together one more time?"*
*   **Dual-Language Guides:** Parents get the grammar rule in Korean and the solution steps in English.

### III. The Pronunciation Coach (Interactive Audio)
*   **STT Validation:** Uses the Web Speech API to let the child speak. Chekki "stamps" the digital page with a star and a "Dopamine Sound" (Haptic Vibration) when they pronounce it correctly.
*   **Native TTS:** High-quality English text-to-speech for every answer.

---

## 4. Monetization & Growth Moat

### A. Korean PG (Payment Gateway) Strategy
*   **Primary:** Toss Payments or PortOne. Essential for handling Korean credit cards (Samsung, Shinhan) and local wallet apps (KakaoPay, NaverPay).
*   **Compliance:** Displaying the Mail Order Business Number (통신판매업) and Representative name is mandatory for consumer trust in the Korean market.

### B. Marketing Playbook (Instagram/LinkedIn)
*   **LinkedIn (Professional Growth):** Focus on the "Thinking Budget" moat and B2B school partnerships. Target school owners to offer "Chekki School Licenses."
*   **Instagram (Consumer Viral):** Focus on "Parenting Relief." Use reels showing the contrast between a "Homework War" and a "Chekki Bonding Moment." 
*   **Influencer Strategy:** Partner with "Mom-fluencers" in high-density education zones (Daechi, Mok-dong, Haeundae) for high-conversion organic growth.

---

## 5. Strategic Q&A for Stakeholders (Deep-Dive)

### A. User Reality & Demographics
*   **Target Age Range:** Exactly **5–7 years old (Korean Age)**. This is the peak period for "The Big 3" years of English Kindergarten where the transition from phonics to complex sentence structure occurs.
*   **Worksheet Sources:** Content is optimized for the curriculum of top-tier EK chains (e.g., **Poly, GATE, PSA, ECC**). It focuses heavily on phonics logic and early "Short Answer" sentence writing.

### B. Founder’s Vision (The "Why")
*   **The Origin Story:** Born from observational empathy. The founder spent months in Gangnam and Bundang cafes, watching tired moms struggle to correct worksheets while their children grew frustrated. 
*   **The Philosophy:** "I saw that the problem wasn't a lack of English knowledge; it was a lack of emotional energy at 8:00 PM. Chekki was built to give that energy back to parents, turning a 'Homework War' into a 'Success Story' every single night."
