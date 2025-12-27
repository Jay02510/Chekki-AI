# 💰 Chekki AI - Monetization & Paywall Roadmap

This document summarizes the updates made to transition Chekki AI from a Beta-only tool to a production-ready application with tiered subscriptions. Use this as a guide for localizing the app into other languages (e.g., French).

## 1. Subscription Tiers (Free vs. Pro)

| Feature | Free Explorer | Chekki Pro |
| :--- | :--- | :--- |
| **Daily Scans** | 3 Scans / Day | Unlimited |
| **AI Model** | Gemini 3 Flash | Gemini 3 Pro (Deep Reasoning) |
| **Answer Key** | Basic | Advanced + Contextual |
| **Audio** | Restricted | Native Pronunciation (TTS) |
| **Speaking** | Restricted | Pronunciation Coach (STT) |
| **Generation** | Restricted | 🪄 AI Practice Sheet Generator |
| **Badges** | Standard | Pro Exclusive |

## 2. Technical Implementation Details

### A. Usage Tracking & Billing
- **State Management:** `AuthContext.tsx` now tracks `scansUsed` and `plan` status.
- **Paywall Trigger:** Logic in `incrementScan` checks if a free user has reached their limit before allowing a new analysis.
- **Subscription Metadata:** `UserProfile` type in `types.ts` now includes `subscriptionStartedAt`, `nextBillingDate`, and `isCanceled` to support billing cycles.

### B. Backend API (`/api/analyze.ts`)
- **Model Switching:** The backend now receives `userPlan` in the request body.
- **Pro Logic:** If `userPlan === 'pro'`, the system defaults to `gemini-3-pro-preview` with an increased `thinkingBudget` for higher accuracy.
- **Free Logic:** Free users use `gemini-3-flash-preview` for speed and cost-efficiency.

### C. Access Code System
- **CHEKKIBETA:** A hardcoded validation list in `AuthContext.tsx` allows legacy users to bypass the paywall.
- **Redemption UI:** Integrated directly into the `PaywallModal` to reduce friction for early testers.

## 3. UI/UX Components

### 1. `PaywallModal.tsx`
- **Visuals:** High-conversion pricing cards with vertical feature checklists.
- **Interactions:** "Most Popular" badge for Pro, and an expandable "Beta Code" input field.

### 2. `BillingModal.tsx`
- **Functionality:** Provides a self-service dashboard for users to view their next billing date, see invoice history, and manage (cancel/resume) their plan.
- **Feedback:** Uses state-driven UI to show "Active" vs "Canceled" status.

### 3. `Header.tsx` Update
- Added a visual distinction for Pro users (PRO badge in the user menu).
- Persistent "Upgrade" buttons for free users.

## 4. Translation Guide for French Version

When updating the French version, ensure the following terms are localized consistently:
- **Free Explorer** -> *Explorateur Gratuit*
- **Chekki Pro** -> *Chekki Pro*
- **Unlimited Scans** -> *Scans Illimités*
- **Deep Reasoning Mode** -> *Mode Raisonnement Approfondi*
- **Mom's Script** -> *Le Script de Maman*
- **Practice Sheet** -> *Feuille d'Exercices*
