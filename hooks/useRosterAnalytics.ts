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

  // Feeds NativeFtDashboard, which is React.memo'd. vocabMistakeCounts (and
  // everything derived from it) was previously rebuilt as a fresh object/
  // array on every render regardless of whether studentsData/curriculum
  // actually changed — the sortedTroubleWords useMemo below had a dep that
  // was itself always a new reference, so it never actually memoized
  // anything, defeating NativeFtDashboard's memo every render (audit #6).
  const {
    vocabMistakeCounts,
    completedHomeworkCount,
    rosterWithCompletion,
  } = useMemo(() => {
    const counts: Record<string, number> = {};
    activeVocabWords.forEach((word) => {
      counts[word] = 0;
    });

    let completed = 0;

    const roster = (studentsData || []).filter(Boolean).map((student) => {
      if (!student) return null;
      const weeklyMistakes = (student.mistakes || []).filter((m: any) => m && isMistakeInWeeklyCurriculum(m));
      const hasScannedThisWeek = weeklyMistakes.length > 0 || (
        student.lastScanDate &&
        (new Date().getTime() - new Date(student.lastScanDate).getTime()) < 7 * 24 * 60 * 60 * 1000
      );

      if (hasScannedThisWeek && student.classStatus === 'active') {
        completed++;
      }

      if (student.classStatus === 'active') {
        weeklyMistakes.forEach((m: any) => {
          if (!m) return;
          const qText = (m.question_text || '').toLowerCase();
          const aText = (m.correct_answer || '').toLowerCase();
          const rText = (m.student_response || '').toLowerCase();

          activeVocabWords.forEach((word) => {
            if (qText.includes(word) || aText.includes(word) || rText.includes(word)) {
              counts[word]++;
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

    return { vocabMistakeCounts: counts, completedHomeworkCount: completed, rosterWithCompletion: roster };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsData, curriculumVocab, curriculumPhonics]);

  const activeRoster = rosterWithCompletion.filter((student) => student.classStatus === 'active');
  const pendingRoster = rosterWithCompletion.filter((student) => student.classStatus === 'pending');

  const activeStudentsCount = activeRoster.length;

  const completionRate = activeStudentsCount > 0
    ? Math.round((completedHomeworkCount / activeStudentsCount) * 100)
    : 0;

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

  // Director's "Approved Student Roster" (NativeDirectorStudentsTab) used to
  // only ever see studentsData (real users/{uid} docs, i.e. a parent has
  // redeemed) — a student added by a director/KT with no parent email on
  // file (StudentInvitePanel's "Add Student", no redemption possible without
  // an email) was invisible there even though the FT/KT log form above
  // already treats them as a real, loggable class member. Same
  // pendingStudentsForRoster data, reshaped to the fields that table reads
  // (studentName/name/email/hasScannedThisWeek/lastScanDate/flaggedException
  // all intentionally absent/false — there's no parent account yet to carry
  // any of that). isInvitedOnly flags rows the table must not offer
  // Move/Remove/View Details on, since those write to a real users/{uid}
  // doc this entry doesn't have.
  const invitedOnlyRosterRows = pendingStudentsForRoster.map((s) => ({
    uid: s.uid,
    studentName: s.name,
    name: '',
    email: '',
    classStatus: 'active',
    hasScannedThisWeek: false,
    lastScanDate: null,
    flaggedException: null,
    isInvitedOnly: true,
  }));

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
    invitedOnlyRosterRows,
  };
}
