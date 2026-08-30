# 🛡️ Chekki AI — Security, Compliance & Accuracy Fact Sheet

> **Audience**: Academy Directors, IT Administrators, & Parent Committee Leads  
> **Topic**: Data Security, Privacy Compliance, & Ground-Truth Grading Precision

---

## 1. Zero-Hallucination Ground-Truth Precision

| Feature | Generic AI Chatbots (ChatGPT / Claude) | Chekki AI Ground-Truth Engine |
| :--- | :--- | :--- |
| **Grading Basis** | Generates answers based on probability models (prone to hallucinations). | **100% Grounded** in your official academy textbook PDF / answer keys. |
| **Handwriting Detection** | Often mistakes printed multiple-choice letters for student writing. | Explicit multimodal vision model (`@google/genai`) trained to isolate human pencil marks from printed text. |
| **Bounding Box Precision** | N/A | Bounding boxes normalized (0–1000) for exact answer overlay placement on paper images. |

---

## 2. Data Privacy & Compliance Safeguards

### A. COPPA & Youth Data Protection
- Chekki AI complies with international **COPPA (Children’s Online Privacy Protection Act)** guidelines and Korean **Youth Protection Standards**.
- Student worksheet scan data is stored solely for learning analytics and is **never sold, monetized, or shared** with third-party advertisers.

### B. End-to-End Encryption & Storage Isolation
- All client-to-server traffic is encrypted via **HTTPS / TLS 1.3**.
- Database records are protected by granular Firestore Security Rules:
  - Students can only view their own scan history.
  - Teachers can only view scan data belonging to their verified `classId`.
  - Academy curriculum files (`classes/{classId}/curriculum`) are strictly accessible to authorized faculty.

### C. Rate Limiting & DDOS Protection
- Serverless API endpoints are protected by **Upstash Redis sliding-window rate limiters** (10 requests / 10s) and fallback memory limiters, preventing API abuse and storage exhaustion.

### D. Third-Party Sign-In Verification
- KakaoTalk sign-in tokens are verified against the specific app ID they were issued for, not just checked for general validity — preventing a token issued for an unrelated app from being used to authenticate against Chekki.

### E. School Data Export & Deletion
- Academy directors can request a full export of their school's data (rosters, class logs, curriculum) or request deletion, from the Billing panel in the director portal.
- Deletion requests are reviewed and processed by our team (not instant/automatic) to prevent accidental irreversible data loss — standard practice matching Google Workspace for Education and similar education platforms.

---

## 3. Frequently Asked Questions (FAQ for Directors)

### Q1: Is our academy's proprietary curriculum protected?
**Yes.** Your textbook uploads and vocabulary answer keys are encrypted and isolated under your school’s private Firestore tenant (`schools/{schoolId}`). Other schools cannot view or access your curriculum files.

### Q2: What happens when a teacher leaves the academy?
When a teacher account is deleted, their user UID is automatically removed from the school’s authorized user list via atomic Firestore transactions (`arrayRemove`), immediately freeing up their seat slot for a replacement teacher.

---

*Verified & Published by Chekki AI Security Engineering Team — August 2026*
