# 🦅 Chekki AI - Product Requirements Document (PRD)

**Document Version:** 2.0  
**Status:** Approved / Active  
**Author:** Product & Engineering Team  
**Target Audience:** Engineering, Product, Design, QA, Business Development  

---

## 1. Executive Summary

**Chekki AI** is an AI-powered EdTech application designed to bridge physical learning materials with digital intelligence. Operating primarily in South Korea, Chekki AI empowers parents of children (aged 5–7) attending English Kindergarten (EK) and elementary hagwons (private academies) to instantly scan, evaluate, and coach their children on English homework—without needing fluent English skills themselves.

By transforming a routine paper worksheet into an interactive, digital workspace with real-time answer verification, contextual Korean parenting scripts, native voice coaching, and adaptive AI practice sheet generation, Chekki AI transforms daily "homework battles" into positive parent-child bonding moments.

---

## 2. Problem Statement & User Personas

### 2.1 Problem Statement
1. **Parent-Child Homework Friction:** Parents in high-density Korean education zones (e.g., Daechi, Mok-dong, Haeundae) experience high stress managing late-afternoon homework. Correcting mistakes in a second language often leads to emotional exhaustion and parent-child conflict.
2. **Language Barrier for Parents:** Many non-native English-speaking parents struggle to understand nuance in complex phonics, reading comprehension, or grammar worksheets, making them hesitant to help.
3. **Teacher Prep Load:** Hagwon and EK teachers spend excessive hours generating supplementary drill sheets and manually grading repetitive paper homework.

### 2.2 User Personas

#### Primary Persona: Korean EK Parent ("Min-ji", 34)
* **Demographics:** Mother of a 6-year-old child in an English Kindergarten (Seoul/Busan).
* **Goals:** Wants to ensure her child completes homework accurately while fostering confidence and a loving relationship.
* **Pain Points:** Low English fluency, exhausted after work, worried about giving incorrect explanations or scolding her child.
* **Key Needs:** Instant worksheet checking, Korean translation, exact words to say ("what to speak"), warmth and empathy.

#### Secondary Persona: Hagwon ESL Teacher ("David", 28)
* **Demographics:** Native English instructor at a Seoul Hagwon.
* **Goals:** Efficiently grade student assignments, track recurring student errors, and quickly generate customized extra practice sheets.
* **Pain Points:** Time wasted on repetitive grading, difficulty giving personalized feedback to 20+ students daily.

---

## 3. Product Vision & Value Propositions

### 3.1 Product Vision
To be the ultimate AI learning companion for physical workbooks worldwide, making early childhood education stress-free, engaging, and personalized.

### 3.2 Key Value Propositions
* **Bonding Over Correction:** Replaces red-ink grading with gentle, encouraging Korean parenting scripts.
* **Paper-to-Digital Bridge:** Keeps the tactile magic of paper worksheets by preserving photo alignment with digital highlight overlays rather than plain database tables.
* **Instant Multimodal Intelligence:** Powered by Google Gemini 3 (Flash & Pro), providing sub-3-second OCR and deep reasoning.
* **Adaptive Mastery Loop:** Automatically tracks weak points and generates tailored PDF practice sheets for offline or digital drill.

---

## 4. Feature Specifications

### 4.1 Feature 1: Magic Scan (Multimodal OCR & Answer Verification)
* **Description:** Real-time camera capture of physical worksheets with automatic boundary detection, lighting check, and AI analysis.
* **Requirements:**
  * Support image capture via camera or file upload (PNG/JPG/HEIC).
  * Send image payload to Gemini 3 API to return structured JSON containing:
    * `worksheet_summary`: Title, overview, score, legibility flag.
    * `items`: Bounding boxes `[ymin, xmin, ymax, xmax]`, questions, correct answers, student response, Korean teaching script (`teaching_script_ko`), and handwriting quality tips.
  * Render Interactive Skeuomorphic Overlays directly on top of the original image at matching coordinates.
  * Interactive Tapping: Tapping any highlighted bounding box opens the detail drawer with step-by-step guidance.

### 4.2 Feature 2: Korean Parenting Script Engine ("What to Say")
* **Description:** Translates technical corrections into warm, empathetic scripts for parents to read aloud to their child.
* **Requirements:**
  * For every incorrect item, present `teaching_script_ko` formatted as direct speech quotes (e.g., *"괜찮아! 'cat'에서 'c' 소리를 다시 들어볼까?"*).
  * Provide praise options for correct answers to reinforce child confidence.

### 4.3 Feature 3: AI Practice Sheet Generator (Pro Feature)
* **Description:** On-demand generation of custom practice worksheets targeting specific student weaknesses.
* **Requirements:**
  * Analyze student `mistakes` collection filtered by error types (Phonics, Vocabulary, Grammar).
  * Generate fresh, original exercises matching the curriculum standard.
  * Export clean printable PDF sheets formatted for home printing (A4/Letter).

### 4.4 Feature 4: Native Pronunciation & Voice Coach (Pro Feature)
* **Description:** Native-speaker TTS audio playback and STT speech analysis.
* **Requirements:**
  * **TTS (Text-to-Speech):** High-fidelity audio playback for question prompts and correct answers using natural English voices.
  * **STT (Speech-to-Text) / Coaching:** Allow child to speak into the microphone, score pronunciation match, and provide gentle encouragement.

### 4.5 Feature 5: Gamified Engagement & Badges
* **Description:** Motivational system for young learners.
* **Requirements:**
  * Daily scan streak tracking.
  * Unlockable badges (e.g., "Phonics Explorer", "Star Scanner", "Master Reader").
  * Distinguish Standard vs Pro Exclusive Badges.

### 4.6 Feature 6: School & Organization Portal
* **Description:** Institutional tier for schools and hagwons.
* **Requirements:**
  * **School Code Redemption:** Transactional activation codes (e.g., `POLY10`, `GATE05`) to grant students institution-funded Pro access.
  * **Teacher Classroom View:** Teachers can set up classes, view aggregated student scan results, and identify group weak spots.

### 4.7 Feature 7: Teacher Curriculum Pre-Seeding Module
* **Description:** Allows hagwon teachers to pre-upload weekly textbook topics, passage texts, and target vocabulary to pre-seed the AI's context window.
* **Requirements:**
  * Support teacher pre-seeding of weekly units (e.g., *Poly 6A Week 4 Phonics & Reading*).
  * Automatically inject active class curriculum context into Gemini 3 prompt calls when a student from that class scans a sheet.
  * Elevate OCR recognition and answer verification accuracy to near 100% for specific school workbooks.

### 4.8 Feature 8: Automated Weekly/Monthly Parent Progress Report Generator
* **Description:** Generates beautifully structured, printable/shareable bilingual growth reports for parents and teachers.
* **Requirements:**
  * Aggregate home scan accuracy, phonics mastery percentages, and weekly vocabulary acquisition.
  * Highlight 3 specific review focus words/rules (e.g., *silent 'e' long vowels, consonant blends*).
  * Include custom **Teacher Evaluation Notes** input box for hagwon instructors.
  * Provide personalized **Mom's Praise Script** tailored to the child's monthly achievements.
  * Export as clean PDF or KakaoTalk shareable mobile card.

---

## 5. Monetization & Tiering Architecture

| Feature / Capability | Free Explorer Tier | Chekki Pro Tier | School / Enterprise Tier |
| :--- | :--- | :--- | :--- |
| **Daily Scans** | 2 Scans / Day | Unlimited (9,999/day) | Unlimited |
| **AI Model Engine** | Gemini 3 Flash | **Gemini 3 Pro** (Deep Reasoning) | Gemini 3 Pro |
| **Parent Guidance Script** | Basic | Advanced + Contextual | Advanced + Contextual |
| **Audio Pronunciation** | Restricted | Native TTS & STT Coach | Native TTS & STT Coach |
| **Practice Generator** | None | Unlimited Sheet Generation | Class Bulk Sheet Generation |
| **Curriculum Pre-Seeding**| Read Only | Standard Pre-Seeding | **Full School Pre-Seeding** |
| **Parent Growth Reports** | Basic Summary | Weekly Personal Report | **Automated Class Report Generator** |
| **Analytics Dashboard** | Personal History | Mistake Vault + Insights | Class-level Analytics |
| **Price Point** | Free | ₩14,900 / month ($9.99/mo) | Custom Contract Pricing |

---

## 6. Non-Functional Requirements

### 6.1 Performance & Latency
* Camera capture to initial overlay render: **< 3.5 seconds** (on LTE/5G).
* Client-side UI responsiveness: 60 FPS animation during drawer drag and image zoom.

### 6.2 Reliability & Availability
* Uptime Target: **99.9%** hosted on Vercel Edge and Firebase Cloud Functions.
* Graceful fallback when Gemini API encounters high load or rate limits.

### 6.3 Accessibility & Internationalization (i18n)
* **WCAG 1.4.4 (Pinch-to-Zoom):** Mobile viewport must permit multi-touch zooming and panning to read fine text on scanned paper.
* **Bicultural Typography:** Flawless dual rendering of Korean (`Noto Sans KR`) and English (`Space Grotesk`, `Nunito`).

### 6.4 Security & Compliance
* Full COPPA & Korean PII Compliance (Children's Privacy Protection).
* Strict Firestore Security Rules ensuring users access only their own scans and authorized class records.

---

## 7. Success Metrics & Key Performance Indicators (KPIs)

1. **Daily Active Users (DAU) & Monthly Active Users (MAU)**
2. **Scan Completion Rate:** % of scans that successfully produce a valid bounding box analysis (>98% target).
3. **Free-to-Pro Conversion Rate:** Target > 6% conversion driven by scan limits and practice generator value.
4. **Parent Satisfaction (CSAT):** >4.8 / 5.0 rating on "Parent Script Usefulness".
5. **7-Day & 30-Day Retention Rates.**
