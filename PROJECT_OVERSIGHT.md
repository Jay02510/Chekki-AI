
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
*   **Item Extraction:** Set to a strict **12,000 token thinking budget**. This allows the AI to "double-check" its OCR against the pedagogical context (e.g., ensuring a "B" isn't confused with an "8" in a phonics exercise) without inducing long wait times.

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

## 4. Supplementary Deep-Dive for Slide Deck Formulation

### Q1: What is the specific "Pain Point" of the English Kindergarten (EK) market?
*   **The Problem:** EK curriculum in Korea (Gangnam, Seocho, Bundang) is notoriously rigorous. Parents often spend 1-2 hours nightly correcting homework.
*   **The Friction:** Many parents feel insecure about their own English pronunciation or grammar. This leads to "Homework Anxiety," where the parent becomes a "Correction Machine" rather than a supportive guide, damaging the child's interest in English.
*   **The Chekki Solution:** We automate the "Correction" so the parent can focus on "Connection." Chekki provides the script, the answer, and the encouragement.

### Q2: How does Chekki differentiate from Google Lens or Papago?
*   **Contextual Intelligence:** Generic OCR (Google Lens/Papago) only translates text. They often fail on "Fill-in-the-blank" or "Matching" exercises because they don't understand the *pedagogical goal*.
*   **Handwriting Expertise:** Children's handwriting is irregular. Chekki uses Gemini's multimodal reasoning to infer what a child *meant* to write based on the worksheet's theme (e.g., if the theme is "Fruits," Chekki knows a messy "A" is likely "Apple").
*   **Pedagogical Layer:** Chekki provides "Mom's Scripts" and "Teaching Tips"—something a translation app will never provide.

### Q3: What is the "Handwriting Gap" and how do we solve it?
*   **Technical Challenge:** Traditional OCR is built for printed documents. Children use pencils, vary their letter sizes, and often trail off the lines.
*   **The Solution:** We feed the *entire worksheet context* to the AI. Instead of reading letters in isolation, Chekki reads the question and the empty space together. It performs a "probabilistic match" between the handwriting and the expected curriculum answer key.

### Q4: What is the Business Moat (Defensibility)?
*   **Proprietary Data Loop:** As users flag errors via our `FeedbackModal`, we fine-tune our system instructions to handle specific Korean EK textbook styles (e.g., Poly, GATE, PSA styles).
*   **High Switching Costs:** Once a parent builds a 100-item "Review Note" (O-dap Note) for their child, Chekki becomes the child's personalized digital archive. Switching to another app means losing that customized learning history.

### Q5: What is the "GTM" (Go-To-Market) Strategy for the first 10,000 users?
*   **Naver Cafe Integration:** Partnering with "Mom Communities" (Mom-cafes) where EK homework is a daily topic of discussion.
*   **Influencer "Study-grams":** Targeted campaigns with Instagram "Study-gram" (공스타그램) influencers who show the "Magic Overlay" in action.
*   **The "Freemium" Viral Loop:** The generated PDF Practice Sheets include a Chekki QR code. When a parent shares a practice sheet with another mom at the playground, it acts as a high-conversion physical referral.

---

## 5. Marketing Vocabulary & Keywords
*   **Hyper-Specialization:** "Not just AI, but *Kid-Handwriting* AI."
*   **Emotional Benefit:** "Reduce Homework Conflict by 80%."
*   **Efficiency:** "From 1 Hour of Grading to 1 Minute of Review."
*   **Tagline:** "Grading takes a second; the high-five lasts all night." (채점은 1초, 하이파이브는 밤새도록)
