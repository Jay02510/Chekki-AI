# 🦅 Chekki AI - Ecosystem Overview

Welcome to the **Chekki AI Master Documentation**. This document provides a high-level overview of the entire Chekki ecosystem, from our core features to our underlying technology stack.

---

## 🎯 Our Vision

Chekki AI is designed to be the ultimate companion for students and teachers, transforming physical workbooks into interactive, AI-powered learning experiences.

---

## 🚀 Core Features

### 🪄 Magic Scan

Our primary interface. A high-speed, intelligent scanner that identifies worksheets, extracts text, and provides real-time feedback.

### 📝 AI Practice Sheet Generator (Pro)

Generate custom practice materials based on scanned content, tailored to the student's current progress.

### 🎙️ Native Pronunciation & Coaching (Pro)

Native-speaker text-to-speech (TTS) and speech-to-text (STT) for pronunciation analysis and coaching.

### 🏅 Gamified Progression

Standard and Pro-exclusive badges to keep students engaged and motivated.

---

## 💰 Monetization & Tiers

| Feature         | **Free Explorer** | **Chekki Pro**                    |
| :-------------- | :---------------- | :-------------------------------- |
| **Daily Scans** | 3 Scans / Day     | Unlimited (9999)                  |
| **AI Model**    | Gemini 3 Flash    | **Gemini 3 Pro** (Deep Reasoning) |
| **Answer Key**  | Basic             | Advanced + Contextual             |
| **Audio**       | Restricted        | Native Pronunciation (TTS)        |
| **Speaking**    | Restricted        | Pronunciation Coach (STT)         |
| **Generation**  | Restricted        | 🪄 Practice Sheet Generator       |
| **Access**      | Standard          | Pro Exclusive Badges              |

---

## 🛠️ Technology Stack

### 📱 Frontend

- **Framework**: React.js with TypeScript
- **Mobile Bridge**: Capacitor (iOS/Android)
- **Styling**: Vanilla CSS (Custom UI Components)
- **Language Support**: Multi-language support via `LanguageContext`.

### 🗄️ Backend & Infrastructure

- **Database**: Firebase Firestore (**dbInstance**)
- **Authentication**: Firebase Auth (**AuthContext**)
- **File Storage**: Cloudinary (Assets & Analysis Media)
- **Deployment**: Vercel (Web / API)

### 🧠 Artificial Intelligence

- **Models**: Google Gemini 3 (Flash & Pro Preview)
- **Multimodal**: Native image-to-text and reasoning capabilities.
- **Thinking Budget**: Enhanced "Deep Reasoning" budget for Pro users.

---

## 🔑 Access & Provisioning

Chekki supports both individual subscriptions and organizational access:

- **School Codes**: Transactional redemption system (e.g., `POLY10`, `GATE05`) to unlock Pro features for specific institutions.
- **App Store/Apple**: Native subscription management and restoration.
- **Admin Panel**: Internal dashboard for managing user profiles and scan limits.

---

## 🛣️ Active Roadmap

- [x] Transition from Beta to Tiered Subscriptions.
- [x] Implementation of App Store Paywall.
- [ ] Expansion of the "AI Practice Sheet Generator".
- [ ] Enhanced Teacher/Parent collaboration tools.

---

> [!NOTE]
> This document is updated automatically as new features are added to the Chekki ecosystem.
