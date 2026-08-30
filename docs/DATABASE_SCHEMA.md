# 🗄️ Chekki AI - Database Schema Document

**Document Version:** 2.0  
**Status:** Approved / Active  
**Database Engine:** Google Cloud Firestore (NoSQL Document Store)  
**Target Audience:** Backend Engineers, Database Administrators, Security Auditors  

---

## 1. Entity Relationship Diagram (ERD)

The diagram below maps the Firestore document hierarchy, subcollections, and reference pointers across Chekki AI.

```mermaid
erDiagram
    USERS ||--o{ MISTAKES : "owns"
    USERS ||--o| SUBSCRIPTIONS : "has"
    USERS }|--o| SCHOOLS : "belongs to"
    USERS }|--o| CLASSES : "enrolled in / teaches"
    CLASSES ||--o{ STUDENT_SCANS : "contains"
    CLASSES ||--o{ CURRICULUMS : "references"
    
    USERS {
        string uid PK
        string email
        string plan "free | pro"
        number scansUsedToday
        number maxScansPerDay
        string schoolId FK
        string classId FK
        string role "parent | teacher | admin"
    }

    SUBSCRIPTIONS {
        string user_id PK
        string subscription_status "active | expired | none"
        string subscription_platform "apple | google | school_code"
        timestamp subscription_expiry_date
    }

    MISTAKES {
        string id PK
        string userId FK
        string question_text
        string correct_answer
        string student_response
        string korean_guide
        timestamp created_at
    }

    SCHOOLS {
        string schoolId PK
        string schoolName
        number totalSeats
        number usedSeats
        string licenseKey
    }

    CLASSES {
        string classId PK
        string className
        string teacherUid FK
        string schoolId FK
    }

    STUDENT_SCANS {
        string scanId PK
        string studentUid FK
        string worksheetTitle
        number score
        timestamp scannedAt
    }
```

---

## 2. Comprehensive Collection Specifications

### 2.1 Collection: `users/{userId}`
Stores user identity, role, subscription tier, and daily scan quota tracking.

| Field Name | Type | Required | Description & Constraints |
| :--- | :--- | :--- | :--- |
| `name` | `string` | Yes | Full name of parent or teacher. |
| `email` | `string` | Yes | Authenticated email address. |
| `plan` | `string` | Yes | Billing tier: `'free'` or `'pro'`. |
| `role` | `string` | No | User role: `'parent' \| 'teacher' \| 'admin'`. Default: `'parent'`. |
| `scansUsedToday` | `number` | Yes | Scans performed on current UTC date. Resets daily. |
| `maxScansPerDay` | `number` | Yes | Limit cap: `2` for Free, `9999` for Pro. |
| `lastScanDate` | `string` | Yes | ISO date string (`YYYY-MM-DD`) of last scan. |
| `questionsUsedToday`| `number` | Yes | Daily limit tracker for AI Q&A prompts. |
| `maxQuestionsPerDay`| `number` | Yes | Cap for questions (Free: 5, Pro: 9999). |
| `lastQuestionDate` | `string` | Yes | ISO date string of last question prompt. |
| `schoolId` | `string \| null`| No | Foreign key linking user to a `schools` document. |
| `schoolName` | `string \| null`| No | Cache of institutional name for rapid UI display. |
| `classId` | `string \| null`| No | Foreign key linking parent/student to a `classes` document. |
| `childAge` | `string` | No | Target age of learner (e.g., `"6"`). |
| `childEnglishLevel`| `string` | No | Learner level (e.g., `"Beginner"`, `"Phonics"`). |
| `subscriptionStartedAt`| `timestamp`| No | Timestamp when Pro plan was unlocked. |
| `subscriptionPlatform` | `string` | No | Source platform (`'apple'`, `'google'`, `'school_code'`). |

---

### 2.2 Collection: `subscriptions/{userId}`
Managed exclusively by backend Admin SDK (Vercel API Gateway). Stores payment receipt tokens and verification metadata.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `user_id` | `string (PK)` | Matches Firebase Auth `uid`. |
| `subscription_status` | `string` | `'active' \| 'expired' \| 'cancelled' \| 'none'`. |
| `subscription_platform`| `string` | `'apple' \| 'google' \| 'web' \| 'school_code' \| 'admin_upgrade'`. |
| `subscription_expiry_date`| `string \| null`| ISO timestamp of next billing / expiration date. |
| `apple_receipt` | `string \| null`| Encrypted Apple IAP transaction receipt token. |
| `google_purchase_token` | `string \| null`| Android Google Play Purchase Token. |
| `updated_at` | `timestamp` | Server updated timestamp. |

---

### 2.3 Collection: `mistakes/{mistakeId}`
Auto-saved repository of student homework errors used for analytics and AI practice sheet generation.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `id` | `string (PK)` | Unique mistake document ID. |
| `userId` | `string` | Foreign Key pointing to `users/{userId}`. |
| `question_text` | `string` | Original English question text ($<1000$ chars). |
| `correct_answer` | `string` | Model verified correct answer. |
| `student_response` | `string` | Student's incorrect response detected via OCR. |
| `korean_guide` | `string` | Brief explanation of the error in Korean. |
| `teaching_script_ko` | `string` | Parent speech script ("what to say"). |
| `item_type` | `string` | Question category (`'fill_in'`, `'mcq'`, `'phonics'`, `'matching'`). |
| `created_at` | `timestamp` | Document creation timestamp. |

---

### 2.4 Collection: `schools/{schoolId}`
Maintains hagwon / EK organization profiles and active seat allocations.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `schoolId` | `string (PK)` | Unique institutional slug (e.g., `"poly_daechi"`). |
| `name` | `string` | Display name, set via `api/update-school-profile.ts` (director "Change School Name/Logo"). |
| `logoUrl` | `string` | Academy logo — base64 data URL or an external image URL. Rendered on parent report cards and the teacher header. |
| `ownerUid` | `string` | UID of the director who owns/administers this school. |
| `planId` | `string` | Current plan (e.g. `'trial'`, a paid tier id). Drives seat limits via `api/_lib/pricingTiers.ts`. |
| `seatsTotal` | `{ ft: number, kt: number }` | Total FT/KT teacher seats purchased for this plan. |
| `trialEndsAt` | `string (ISO)` | Trial expiry, present only while `planId === 'trial'`. Enforced as a soft-lock in `api/create-class.ts` / `api/create-teacher-invite.ts`. |
| `trialReminderSentAt` | `string (ISO)` | Set once a day-5/6 trial-ending Resend email has fired, so it's idempotent (see `api/update-school-profile.ts`). |
| `activationCodes` | `array<string>`| Active redemption codes assigned to school (e.g., `["POLY10", "POLY2026"]`). |
| `totalSeats` | `number` | Total paid seat licenses allocated (legacy code-redemption model). |
| `usedSeats` | `number` | Seats redeemed by student/parent accounts (legacy code-redemption model). |
| `created_at` | `timestamp` | School creation timestamp. |

---

### 2.5 Collection: `classes/{classId}` & Subcollection `studentScans`
Enables teachers to view homework performance across enrolled classroom students.

#### `classes/{classId}`
* `classId`: `string (PK)`
* `className`: `string` (e.g., `"Phonics K3 - Morning Class"`)
* `teacherUid`: `string` (FK pointing to `users/{userId}`)
* `schoolId`: `string` (FK)

#### Subcollection: `classes/{classId}/studentScans/{scanId}`
* `scanId`: `string (PK)`
* `studentUid`: `string` (FK)
* `studentName`: `string`
* `worksheetTitle`: `string`
* `totalItems`: `number`
* `correctCount`: `number`
* `scannedAt`: `timestamp`

---

### 2.6 Collection: `curriculums/{curriculumId}`
Stores pre-seeded Hagwon and English Kindergarten curriculum modules, reading passages, and vocabulary terms uploaded by teachers to pre-seed Gemini's context window.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `curriculumId` | `string (PK)` | Unique curriculum record ID (e.g., `"poly_6a_week4"`). |
| `classId` | `string` | Foreign key linking curriculum to `classes/{classId}`. |
| `teacherUid` | `string` | Foreign key linking to the instructor who pre-seeded the unit. |
| `topic` | `string` | Phonics rule / Unit topic (e.g., `"Silent 'e' Long Vowels"`). |
| `passage` | `string` | Full reading passage text for context pre-seeding ($\le 10,000$ chars). |
| `targetVocab` | `array<string>`| Expected target vocabulary list (e.g., `["umbrella", "neighborhood", "adventure"]`). |
| `other` | `string` | Additional pedagogical notes / instructions ($\le 10,000$ chars). |
| `created_at` | `timestamp` | Timestamp when pre-seeding record was saved. |

---

### 2.7 Collection: `feedback/{feedbackId}`
Bug reports and star ratings submitted from both the parent app and the staff (director/FT/KT) dashboards via the shared `FeedbackModal.tsx`. Write-only for regular users; only admins can read.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `userId` | `string` | FK to `users/{userId}` — the submitter (`request.auth.uid`). |
| `rating` | `number` | Star rating 1-5; omitted when submitted with a specific `context`. |
| `comment` | `string` | Free-text report ($<2000$ chars, enforced by rule). |
| `context` | `any` | Optional specific question/result the report was filed against. |
| `userEmail` | `string` | Cached for admin triage without a join. |
| `userName` | `string` | Cached display name. |
| `userRole` | `string` | `'parent' \| 'teacher' \| 'admin'` — lets admins tell which surface (parent app vs. staff dashboard) a report came from. |
| `timestamp` | `string (ISO)` | Client-set submission time. |

---

### 2.8 Collection: `adminAuditLog/{docId}`
Server-only persistent audit trail of every action taken through `api/admin.ts`, written on every request that passes the shared admin passcode check (successful or not gated further by action). No client read/write — deny by default.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `action` | `string` | The admin action invoked (e.g. `list`, `assign_teacher`). |
| `uid` | `string \| null` | Target user UID, if the action targeted one. |
| `email` | `string \| null` | Target user email, if applicable. |
| `schoolId` | `string \| null` | Target school, if applicable. |
| `ip` | `string` | Caller IP (`x-forwarded-for` or socket remote address). |
| `at` | `string (ISO)` | Server timestamp of the action. |

---

### 2.9 Collection: `invites/{inviteId}`
Teacher invite links generated by directors (`api/create-teacher-invite.ts`). Read directly by director dashboards (`TeacherInvitePanel.tsx`, `SchoolBillingPanel.tsx`) to show seat usage and pending invites; every write happens server-side only via Admin SDK (create on send, claim on redemption in `api/redeem.ts`).

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `schoolId` | `string` | FK to `schools/{schoolId}`. Read rule is scoped to callers whose `request.auth.token.schoolId` matches. |
| `role` | `string` | Invited role: `'ft' \| 'kt'`. |
| `email` | `string` | Invitee's email address. |
| `status` | `string` | `'pending' \| 'claimed'` (or similar redemption state). |
| `createdAt` | `timestamp` | Invite creation time. |

---

### 2.10 Collection: `pendingStudents/{pendingStudentId}`
Named student roster entries a director/KT adds to a class ahead of (or instead of) a parent account existing — `parentEmail` is optional (Decision 017). Read directly by director/teacher dashboards (`StudentInvitePanel.tsx`, `useRosterAnalytics.ts`) to show invited/joined/"class roster only" status; every write happens server-side via Admin SDK in `api/create-class.ts` (`add_students`, `resend_student_invite`) and `api/redeem.ts`.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `classId` | `string` | FK to `classes/{classId}`. |
| `schoolId` | `string` | FK to `schools/{schoolId}`. |
| `studentName` | `string` | Student's display name. |
| `parentEmail` | `string \| null` | Optional — a student can exist on the class roster with no parent email yet. |
| `inviteCode` | `string` | Single-use redemption code tied to the emailed invite link; never surfaced to staff. |
| `status` | `string` | e.g. `'pending' \| 'invited' \| 'joined'`. |
| `createdAt` | `timestamp` | Entry creation time. |

---

### 2.11 Collection: `activityLog/{logId}`
Director-visible activity feed (roster approve/decline/remove/move actions), read by `ActivityFeed.tsx`. Unlike `invites`/`pendingStudents`, entries are written directly from the client at the moment of the action, scoped so a caller can only log an action as themselves for their own school.

| Field Name | Type | Description |
| :--- | :--- | :--- |
| `actorUid` | `string` | Must equal `request.auth.uid` on create — a caller can't log an action as someone else. |
| `schoolId` | `string` | Must match the caller's own `users/{uid}.schoolId` on create. |
| `action` | `string` | The roster action taken (e.g. `'approve'`, `'decline'`, `'remove'`, `'move'`). |
| `classId` | `string` | FK to `classes/{classId}` the action applied to. |
| `studentName` | `string` | Cached name of the affected student, for display without a join. |
| `createdAt` | `timestamp` | When the action occurred. |

---

## 3. Server-Only Control Collections (Read/Write Blocked)

The following collections deny all client-side Firestore access and are accessed exclusively by serverless backend logic:

1. `ratelimits/{docId}`: IP & user rate limit token buckets.
2. `quiz_quotas/{docId}`: Daily AI quota state locks.
3. `idempotency_keys/{docId}`: Deduplication locks for API requests.
4. `school_invoices/{docId}`: B2B billing and invoicing history.

---

## 4. Required Composite Indexes

```json
{
  "indexes": [
    {
      "collectionGroup": "mistakes",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "created_at", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "studentScans",
      "queryScope": "COLLECTION_GROUP",
      "fields": [
        { "fieldPath": "studentUid", "order": "ASCENDING" },
        { "fieldPath": "scannedAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```
