# 💰 Chekki AI - Monetization & Paywall Roadmap

This document summarizes the updates made to transition Chekki AI from a Beta-only tool to a production-ready application with tiered subscriptions.

## 1. Subscription Tiers (Free vs. Pro)

| Feature         | Free Explorer  | Chekki Pro                     |
| :-------------- | :------------- | :----------------------------- |
| **Daily Scans** | 3 Scans / Day  | Unlimited                      |
| **AI Model**    | Gemini 3 Flash | Gemini 3 Pro (Deep Reasoning)  |
| **Answer Key**  | Basic          | Advanced + Contextual          |
| **Audio**       | Restricted     | Native Pronunciation (TTS)     |
| **Speaking**    | Restricted     | Pronunciation Coach (STT)      |
| **Generation**  | Restricted     | 🪄 AI Practice Sheet Generator |
| **Badges**      | Standard       | Pro Exclusive                  |

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

- **CHEKKI40:** A transactional redemption system in `database.ts` allows exactly 40 users to unlock Pro features.
- **Cleanup:** Legacy code `CHEKKIBETA` has been removed to maintain strict usage limits.
- **Redemption UI:** Integrated directly into the `PaywallModal` and `SettingsModal` for easy onboarding.

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
