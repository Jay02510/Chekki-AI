import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { dbInstance } from '../services/database';

// Weekly-curriculum-vs-mistakes roster analytics. Originally scoped as
// "FT dashboard state" (Phase 3 of the buzzing-nibbling-hearth TeacherPage
// split plan), but every value here turned out to also feed the director's
// students tab (NativeDirectorPortal's pendingRoster/activeRoster/
// weeklyVocabWords/weeklyPhonicsRules props) and the KT overview
// (FtStatCards) — not FT-exclusive the way Phase 1/2's buckets were, so
// this is named for what it actually is instead of which role "owns" it.
export function useRosterAnalytics(
  studentsData: any[],
  curriculumVocab: string,
  curriculumPhonics: string,
  selectedClass: { id?: string; isDemo?: boolean } | null | undefined
) {
  const getWeeklyVocabWords = () => {
    const raw = typeof curriculumVocab === 'string' ? curriculumVocab : '';
    return raw
      .split(/[,\n]/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);
  };

  const getWeeklyPhonicsRules = () => {
    const raw = typeof curriculumPhonics === 'string' ? curriculumPhonics : '';
    return raw
      .split(/[,\n]/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  const isMistakeInWeeklyCurriculum = (mistake: any) => {
    const activeVocab = getWeeklyVocabWords();
    const activePhonics = getWeeklyPhonicsRules();
    const qText = (mistake.question_text || '').toLowerCase();
    const aText = (mistake.correct_answer || '').toLowerCase();
    const rText = (mistake.student_response || '').toLowerCase();

    const matchesVocab = activeVocab.some((word) =>
      qText.includes(word) || aText.includes(word) || rText.includes(word)
    );

    const matchesPhonics = activePhonics.some((rule) => {
      const cleanRule = rule.replace(/-/g, '').toLowerCase();
      if (!cleanRule) return false;
      return qText.includes(cleanRule) || aText.includes(cleanRule) || rText.includes(cleanRule);
    });

    return matchesVocab || matchesPhonics;
  };

  const activeVocabWords = getWeeklyVocabWords();

  const vocabMistakeCounts: Record<string, number> = {};
  activeVocabWords.forEach((word) => {
    vocabMistakeCounts[word] = 0;
  });

  let completedHomeworkCount = 0;

  const rosterWithCompletion = (studentsData || []).filter(Boolean).map((student) => {
    if (!student) return null;
    const weeklyMistakes = (student.mistakes || []).filter((m: any) => m && isMistakeInWeeklyCurriculum(m));
    const hasScannedThisWeek = weeklyMistakes.length > 0 || (
      student.lastScanDate &&
      (new Date().getTime() - new Date(student.lastScanDate).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (hasScannedThisWeek && student.classStatus === 'active') {
      completedHomeworkCount++;
    }

    if (student.classStatus === 'active') {
      weeklyMistakes.forEach((m: any) => {
        if (!m) return;
        const qText = (m.question_text || '').toLowerCase();
        const aText = (m.correct_answer || '').toLowerCase();
        const rText = (m.student_response || '').toLowerCase();

        activeVocabWords.forEach((word) => {
          if (qText.includes(word) || aText.includes(word) || rText.includes(word)) {
            vocabMistakeCounts[word]++;
          }
        });
      });
    }

    return {
      ...student,
      hasScannedThisWeek,
      weeklyMistakesCount: weeklyMistakes.length,
      weeklyMistakes,
    };
  }).filter(Boolean);

  const activeRoster = rosterWithCompletion.filter((student) => student.classStatus === 'active');
  const pendingRoster = rosterWithCompletion.filter((student) => student.classStatus === 'pending');

  const activeStudentsCount = activeRoster.length;

  const completionRate = activeStudentsCount > 0
    ? Math.round((completedHomeworkCount / activeStudentsCount) * 100)
    : 0;

  // Feeds NativeFtDashboard, which is React.memo'd — an inline .map() here
  // would rebuild a new array reference every render regardless of whether
  // vocabMistakeCounts actually changed, defeating that memo (audit #6).
  const sortedTroubleWords = useMemo(
    () =>
      Object.keys(vocabMistakeCounts)
        .map((word) => ({ word, count: vocabMistakeCounts[word] }))
        .sort((a, b) => b.count - a.count),
    [vocabMistakeCounts]
  );

  // Students invited into this class but whose parent hasn't redeemed the
  // invite yet — no `users/{uid}` doc exists for them (see api/redeem.ts),
  // so they'd otherwise be invisible to the FT/KT log form's student picker
  // even though the classroom loop (daily notes) doesn't actually depend on
  // the parent having joined the app. Same query pattern as
  // StudentInvitePanel.tsx. Keyed with a `pending:` prefix so it can never
  // collide with a real Firebase Auth uid.
  const [pendingStudentsForRoster, setPendingStudentsForRoster] = useState<{ uid: string; name: string }[]>([]);
  useEffect(() => {
    if (!selectedClass?.id || selectedClass.isDemo) {
      setPendingStudentsForRoster([]);
      return;
    }
    const q = query(collection(dbInstance, 'pendingStudents'), where('classId', '==', selectedClass.id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setPendingStudentsForRoster(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() } as any))
            .filter((d) => d?.status === 'invited' && d?.name)
            .map((d) => ({ uid: `pending:${d.id}`, name: d.name as string }))
        );
      },
      (err) => console.warn('Failed to load pending students for roster:', err)
    );
    return () => unsub();
  }, [selectedClass?.id, selectedClass?.isDemo]);

  // Same reasoning — NativeFtDashboard's roster prop. Carries uid alongside
  // name so exception flags and consolidation can join on a stable key
  // instead of matching free-text names across classes/logs. Merges in
  // not-yet-redeemed students (pendingStudentsForRoster) so the classroom
  // log loop isn't gated on parent-app adoption.
  const ftDashboardRoster = useMemo(
    () => [
      ...(studentsData || [])
        .filter((s: any) => s?.classStatus === 'active' && s?.name && s?.uid)
        .map((s: any) => ({ uid: s.uid as string, name: s.name as string, isPending: false })),
      // isPending is a display-only flag — the stored `name` stays clean
      // (no "(pending)" text baked in) since this same name ends up saved
      // onto the exception/log and eventually a parent-facing report; only
      // the picker's rendered label should show the pending marker.
      ...pendingStudentsForRoster.map((s) => ({ uid: s.uid, name: s.name, isPending: true })),
    ],
    [studentsData, pendingStudentsForRoster]
  );

  return {
    getWeeklyVocabWords,
    getWeeklyPhonicsRules,
    isMistakeInWeeklyCurriculum,
    activeVocabWords,
    activeRoster,
    pendingRoster,
    activeStudentsCount,
    completionRate,
    completedHomeworkCount,
    sortedTroubleWords,
    ftDashboardRoster,
  };
}
