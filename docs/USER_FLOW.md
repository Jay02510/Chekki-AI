# 🗺️ Chekki AI - User Flow Diagram & App Flow

**Document Version:** 2.0  
**Status:** Approved / Active  
**Author:** Product & UX Design Team  
**Target Audience:** Product Managers, UX Designers, Frontend Engineers, QA Testers  

---

## 1. High-Level Application State Diagram

The Chekki AI interface operates on a state-machine driven single-page architecture with four core views (`onboarding`, `camera`, `analyzing`, and `workspace`).

```mermaid
stateDiagram-v2
    [*] --> Onboarding: First Time User / Guest
    [*] --> Camera: Authenticated User

    state Onboarding {
        SelectRole: Select Role (Parent / Teacher)
        ChildProfile: Input Child Age & English Level
        SchoolCode: Redeem School Activation Code (Optional)
        SelectRole --> ChildProfile
        ChildProfile --> SchoolCode
    }

    Onboarding --> Camera: Setup Complete

    state Camera {
        LivePreview: Viewfinder with Frame Guide
        FlashToggle: Toggle Flash / Grid
        PhotoCapture: Tap Capture Button
        FileUpload: Pick from Gallery
        LivePreview --> PhotoCapture
        LivePreview --> FileUpload
    }

    Camera --> Analyzing: Image Captured

    state Analyzing {
        CloudUpload: Upload Image to Cloudinary
        AIProcessing: Gemini 3 Vision Inference
        OverlayPrep: Calculate Bounding Box Offsets
        CloudUpload --> AIProcessing
        AIProcessing --> OverlayPrep
    }

    Analyzing --> Workspace: Analysis Success
    Analyzing --> Camera: Processing Error (Retry)

    state Workspace {
        OverlayMode: Image View with Ink Bounding Boxes
        SplitMode: Split Screen List View
        DetailDrawer: Korean Parent Guidance Script & Audio
        MistakeSave: Auto-Save Mistakes to Vault
        
        OverlayMode --> DetailDrawer: Tap Box
        SplitMode --> DetailDrawer: Tap Row
        DetailDrawer --> MistakeSave: Review Item
    }

    Workspace --> Camera: Scan New Worksheet
    Workspace --> PracticeGenerator: Tap "Generate Practice Sheet"
```

---

## 2. Detailed User Trajectories

### 2.1 Trajectory A: Primary Magic Scan & Korean Parent Coaching Loop

This is the central daily loop for Korean parents helping their children with evening English homework.

```mermaid
sequenceDiagram
    autonumber
    actor Parent as Parent (Min-ji)
    participant App as Chekki Mobile App
    participant Cloud as Vercel / Gemini 3 API
    participant DB as Firestore DB

    Parent->>App: Opens App -> Arrives at Camera View
    App->>App: Checks Daily Scan Quota (e.g., Free 2/2)
    Parent->>App: Snaps photo of English worksheet
    App->>App: Transitions to 'analyzing' state (Shimmer animation)
    App->>Cloud: POST /api/analyze (Image + User Token)
    Cloud->>Cloud: Gemini 3 Vision extracts items & bounds
    Cloud-->>App: Returns Structured JSON (Items, Scripts, Bboxes)
    App->>DB: Increments scansUsedToday count
    App->>App: Renders 'workspace' with Skeuomorphic Highlights
    Parent->>App: Taps Red Highlighted Box (Incorrect Answer)
    App->>App: Opens Korean Guidance Drawer
    App->>Parent: Displays "엄마가 이렇게 말해보세요:" + Speech Script
    Parent->>App: Taps "🔊 Pronunciation" Button
    App->>Parent: Plays Native English Audio Prompt
    Parent->>App: Reads Korean script to child & praises effort!
```

---

### 2.2 Trajectory B: Weakness Drill & AI Practice Sheet Generation

For parents or teachers who want to turn recurring mistakes into custom printable exercises.

```mermaid
flowchart TD
    A[User opens Profile / Analytics] --> B[Tap 'Mistake Vault']
    B --> C{View Saved Incorrect Items}
    C -->|Filter by Topic| D[Select: e.g., 'Short Vowel Phonics']
    D --> E[Tap '🪄 Generate AI Practice Sheet']
    E --> F{Check Subscription Tier}
    F -->|Free Explorer| G[Show Pro Paywall Modal]
    F -->|Chekki Pro| H[Trigger Gemini 3 Practice Generator]
    H --> I[Format Worksheet Layout & Answer Key]
    I --> J[Preview Digital Sheet in App]
    J --> K1[Print directly via AirPrint / Mobile Print]
    J --> K2[Export Clean PDF to Files / KakaoTalk]
```

---

### 2.3 Trajectory C: School Code & Organization Onboarding Flow

For students and parents receiving institution-sponsored Pro access from their hagwon or English Kindergarten.

```mermaid
flowchart TD
    A[Parent receives physical card / SMS with Code e.g. 'POLY10'] --> B[Open Chekki App]
    B --> C[Navigate to Profile / Settings]
    C --> D[Tap 'Redeem School Code']
    D --> E[Enter Code 'POLY10']
    E --> F[API Validates Code & License Seat Counter]
    F -->|Invalid / Expired| G[Display Korean Error: '유효하지 않은 학교 코드입니다']
    F -->|Valid| H[Update User Document: plan='pro', schoolId='poly_daechi']
    H --> I[Show Celebration Modal: '폴리아카데미 프로 멤버십이 활성화되었습니다! 🎉']
    I --> J[Unlock Unlimited Scans & Pro Badges]
```

---

### 2.4 Trajectory D: Paywall & In-App Purchase Flow

```mermaid
flowchart TD
    A[User reaches daily 2-scan limit OR Taps Pro Feature] --> B[Present Chekki Pro Paywall Modal]
    B --> C[Highlight Pro Benefits: Unlimited Scans, Gemini 3 Pro Deep Reasoning, Voice Coach]
    C --> D{Select Billing Cycle}
    D --> E1[Monthly Pass: ₩14,900/mo]
    D --> E2[Annual Pass: ₩119,000/yr (Save 33%)]
    E1 --> F[Tap 'Subscribe Now']
    E2 --> F
    F --> G[Trigger Native Apple IAP / Google Play Billing Prompt]
    G -->|User Cancels| H[Dismiss Modal -> Return to Free State]
    G -->|Purchase Confirmed| I[Verify Receipt via Backend API]
    I --> J[Update Firestore Subscription Record]
    J --> K[Instant UI Upgrade to Pro Tier]
```

---

### 2.5 Trajectory E: Teacher Curriculum Pre-Seeding Flow

```mermaid
flowchart TD
    A[Teacher logs into Hagwon Portal] --> B[Select Class: e.g. 'Poly 6A']
    B --> C[Tap 'Pre-Seed Weekly Curriculum']
    C --> D[Input Unit Topic, Passage Text & Target Vocab]
    D --> E[Save to Firestore: 'curriculums/{curriculumId}']
    E --> F[When Student Scans Homework]
    F --> G[API fetches Active Class Curriculum Context]
    G --> H[Injects Context into Gemini 3 System Prompt]
    H --> I[OCR Accuracy & Answer Verification Reaches 100%]
```

---

### 2.6 Trajectory F: Automated Weekly/Monthly Parent Report Flow

```mermaid
flowchart TD
    A[End of Week / Month Trigger] --> B[System aggregates student scans & mistakes]
    B --> C[Calculate Phonics & Vocab Mastery Percentages]
    C --> D[Identify Top 3 Weakness Review Words]
    D --> E[Fetch Teacher Evaluation Note]
    E --> F[Generate Personalized 'Mom's Praise Script']
    F --> G[Render Growth Report Layout]
    G --> H1[Push Notification to Parent Mobile App]
    H1 --> I1[Parent opens interactive report in App]
    G --> H2[Export High-Res PDF / KakaoTalk Card]
    H2 --> I2[Send directly to Parent KakaoTalk Chat]
```

---

## 3. Screen Navigation Map

| View Name | Primary Function | Key Interactive Components | Transition Targets |
| :--- | :--- | :--- | :--- |
| **`onboarding`** | Initial setup & profiling | Role Selector, Child Age Slider, School Code Input | `camera` |
| **`camera`** | Photo capture & selection | Viewfinder, Shutter Button, Gallery Picker, Flash Toggle | `analyzing`, `profile` |
| **`analyzing`** | Loading & status feedback | Animated Scanner Beam, Encouraging Korean Microcopy | `workspace`, `camera` |
| **`workspace`** | Interactive review interface | Image Overlay Canvas, Toggle (Overlay/Split), Detail Drawer, TTS Audio Button | `camera`, `mistake_vault`, `paywall` |
| **`mistake_vault`** | Historical review & drills | Filter Chips, Mistake Cards, AI Practice Generator Trigger | `workspace`, `practice_preview` |
| **`paywall`** | Subscription conversion | Feature Comparison Table, Plan Cards, Apple/Google Buy Buttons | Returns to previous screen |
