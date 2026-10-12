---
target: chekkiai.com role walkthrough (KT/FT/Director/parent)
total_score: 50
max_score: 80
na_heuristics: 
p0_count: 1
p1_count: 4
timestamp: 2026-10-12T06-02-57Z
slug: www-chekkiai-com
---
# Critique: chekkiai.com role walkthrough (KT, FT, Director, parent)

Method: dual-agent (A: design walkthrough on live site with test accounts, B: detect.mjs CLI + live overlay injection)

## Scores
Schools staff dashboards: 23/40. Parent app: 27/40.

| # | Heuristic | Staff | Parent | Key issue |
|---|---|---|---|---|
| 1 | System status | 2 | 3 | Director sees "Not logged yet" in red while 6 logs wait for KT; no report age anywhere |
| 2 | Real world | 3 | 3 | "Week 1" next to Unit 4/5/6; formal onboarding copy |
| 3 | Control/freedom | 2 | 3 | KT approve = one tap to parents, no preview, no undo |
| 4 | Consistency | 2 | 2 | Seats shown 3 ways; mistakes badge red in menu, orange in dashboard |
| 5 | Error prevention | 2 | 3 | Notes for unjoined parents silently dropped; duplicate logs reach queue |
| 6 | Recognition | 3 | 2 | Six identical "Test Chekki" queue rows; parent tools hidden behind avatar menu |
| 7 | Efficiency | 2 | 2 | No bulk approve; no past-scan list for parents |
| 8 | Minimalist | 3 | 3 | Class picker + week stepper on tabs where they do nothing |
| 9 | Error recovery | 2 | 3 | Staff sign-in has no forgot password |
| 10 | Help | 2 | 3 | Week, seats, "Synced" unexplained |

## Priority issues
1. [P0] KT approve: no parent preview, no undo, notes for unjoined parents silently dropped ("send to 1 family" with 2 notes written). Fix: inline "parent not joined, won't be delivered", Sent/Undo toast or preview confirm, sticky button active only after last note seen on phone.
2. [P1] Director dashboard blames FT ("Not logged yet / Missed 8 days" red) while KT queue holds 6 logs, oldest Aug 29; streak counts weekends (useLogCompliance.ts:98). Fix: "Waiting for KT: 6 (oldest 44 days)" row; skip non-class days; red only for real lateness.
3. [P1] Parent post-scan value hidden: mistakes/flashcards/Ask behind avatar > 대시보드, red badge, no past scans list. Fix: "다시 볼 문제 N · 카드 놀이" card on home, "지난 채점" list, orange badge.
4. [P1] Staff sign-in: no forgot password; placeholders look like filled values. Fix: reset link, real placeholder style.
5. [P1] FT can't see which kids need help; "1 of 1 scanned" ignores 3 unjoined students. Fix: per-student line under week, unjoined in denominator.
6. [P2] KT queue rows indistinguishable, no age, duplicates. Fix: date+topic first, age chip, flag duplicates.
7. [P2] Korean breaks mid-word in KT/FT textareas on phone. Fix: break-keep on field class.
8. [P3] Parent onboarding repeats per device, 합쇼체 + "완벽한" claim, zinc/double-bezel styling.

## Detector (B)
CLI 154 advisory findings, mostly font sizes off the DESIGN.md frontmatter scale (12px x76; 20px/34px are in DESIGN.md prose = doc fix). Real: sub-12px parent text (Header.tsx:195 PRO badge 10px, CropModal:322, FeedbackModal:269, LegalModal:77, WorksheetItemCard:119, WorksheetOverlay:334, metro:177), staff 10-11px (ProgressRing:70, StatTile:90, TeacherMobileTabBar:34), animate-bounce ScannedModal:243, text-wrong #d4462a on white 4.46:1, width-animated progress bars (metro:150, FlashcardsView:96, Dashboard:638), ~97ch voice prompt line. False positives: cream palette + lamp glow (DESIGN.md), gradient-text on teacher body (none computed), sidebar nested-cards, truncating email.

## Persona red flags
- Tired mom: 1 tap to camera logged out (great); logged in = extra full-screen modal; mistakes 3 actions deep; can't reopen yesterday; answer key roundel not tappable; EN mode report stays Korean; Ask placeholder cut off.
- FT: Textbook empty on new device; Korean-locale phone defaults Korean, EN toggle buried; 6 logs "In review" with no ETA.
- KT: approve irreversible; oldest-first with no age; Praise tag on text with mild concern.
- Director: "Students 1" vs 4; "3 teacher(s)" vs 2 listed; billing has no price/next charge; phone has no tab bar.

## Minor
Logged-out mascot cropped by header; green shield for "voice never saved"; star emoji in FT history; roster Remove is a red bordered button (should be text link); teacher(s)/student(s) pluralization; memo name mismatch in ParentClassLogs.

## Questions
1. Why does no screen show how old a pending report is when KT is the bottleneck?
2. Should a returning parent's home lead with "다시 볼 문제" instead of the scan button?
3. If nothing reaches a parent without KT, why doesn't the KT see the parent's view before sending?
