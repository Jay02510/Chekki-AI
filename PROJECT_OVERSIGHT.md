
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
*   **Item Extraction:** Set to a strict **10,000 token thinking budget**. This allows the AI to "double-check" its OCR against the pedagogical context (e.g., ensuring a "B" isn't confused with an "8" in a phonics exercise) without inducing long wait times.

### C. Full Tech Stack
*   **Frontend:** React 19, Vite, Tailwind CSS (Mobile-First Ergonomics).
*   **Backend:** Vercel Edge Functions (Serverless Node.js).
*   **Database:** Firebase Firestore (Real-time sync for Review Notes).
*   **Auth:** Firebase Authentication.
*   **AI:** Google Gemini 3 Series (Flash & Pro).
*   **Storage:** Cloudinary (Highly optimized image delivery).

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

### IV. The O-dap Note (The Retention Loop)
*   **One-Tap Flagging:** Parents "flag" questions the child found difficult.
*   **Printable PDF:** Generates a custom, print-ready "Weekend Review Sheet" (PDF) with a dotted-line practice area and "Upside-down Answers" (Anti-cheat design).

---

## 4. UI/UX Philosophy (Design Excellence)

*   **Skeuomorphism vs. Flat:** We use a "Memo/Post-it" aesthetic for teaching guides to feel like a friendly tutor’s notes.
*   **Ergonomics:** Floating action buttons for one-handed use (essential for parents holding a child or a book).
*   **Night Mode:** Dynamic detection of Korean Standard Time (KST) to switch to a "Sleepy Chekki" theme after 10 PM, reducing blue light for late-night grading.

---

## 5. Monetization & Business Model

### A. Tiered Value Proposition
*   **Free Explorer:** 3 daily scans, basic answer key. (The "Hook").
*   **Chekki Pro:** Unlimited scans, Pro model (Deep Reasoning), Practice Sheet Generator, Native Audio. (The "Premium Habit").

### B. Market Positioning
Unlike generic OCR or translate apps, Chekki is **content-aware**. It understands the *format* of Kindergarten worksheets (Tracing, Matching, Coloring) and adjusts its guidance accordingly.

---

## 6. Future Roadmap (Investor Vision)

1.  **Sticker Board Gamification:** A digital album where kids collect 3D stickers for completing worksheets.
2.  **"Clone My Worksheet" (Pro+):** Generates a brand-new, unique worksheet image based on the child's specific weak points.
3.  **B2B English Academies:** A dashboard for English Kindergarten teachers to track homework completion rates across an entire class.

---

## 7. Promotional Keywords for Marketing
*   #영유숙제 (English Kindergarten Homework)
*   #엄마표영어 (Mom-led English)
*   #오답노트 (Mistake Note)
*   #AI튜터 (AI Tutor)
*   "채점은 1초, 칭찬은 평생" (Grading takes 1 second, praise lasts a lifetime).
