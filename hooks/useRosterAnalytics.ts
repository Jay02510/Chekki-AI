import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { dbInstance } from '../services/database';
import { countMissedWords, isThisKstWeek, missLabel } from '../src/utils/weeklyMistakes';

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

  const activeVocabWords = getWeeklyVocabWords();

  // Feeds NativeFtDashboard, which is React.memo'd, so memoized on its inputs.
  // "This week" = the KST calendar week, and every miss counts, not just
  // ones matching the vocab list (see src/utils/weeklyMistakes.ts).
  const { sortedTroubleWords, completedHomeworkCount, rosterWithCompletion } = useMemo(() => {
    let completed = 0;
    const classMisses: any[] = [];

    const roster = (studentsData || []).filter(Boolean).map((student) => {
      const weeklyMistakes = (student.mistakes || []).filter((m: any) => m && isThisKstWeek(m.scannedAt));
      const hasScannedThisWeek = (student.scans || []).some((s: any) => isThisKstWeek(s?.scannedAt)) || isThisKstWeek(student.lastScanDate);

      if (student.classStatus === 'active') {
        if (hasScannedThisWeek) completed++;
        classMisses.push(...weeklyMistakes);
      }

      return {
        ...student,
        hasScannedThisWeek,
        weeklyMistakesCount: weeklyMistakes.length,
        weeklyMistakes,
        missedWords: [...new Set(weeklyMistakes.map((m: any) => missLabel(m, activeVocabWords)).filter(Boolean))] as string[],
      };
    });

    return { sortedTroubleWords: countMissedWords(classMisses, activeVocabWords), completedHomeworkCount: completed, rosterWithCompletion: roster };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentsData, curriculumVocab]);

  const activeRoster = rosterWithCompletion.filter((student) => student.classStatus === 'active');
  const pendingRoster = rosterWithCompletion.filter((student) => student.classStatus === 'pending');

  const activeStudentsCount = activeRoster.length;

  const completionRate = activeStudentsCount > 0
    ? Math.round((completedHomeworkCount / activeStudentsCount) * 100)
    : 0;


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
      // scannedThisWeek/weeklyMistakes feed the FT's per-student list.
      ...rosterWithCompletion
        .filter((s: any) => s?.classStatus === 'active' && s?.name && s?.uid)
        .map((s: any) => ({
          uid: s.uid as string,
          name: s.name as string,
          isPending: false,
          scannedThisWeek: !!s.hasScannedThisWeek,
          weeklyMistakes: s.weeklyMistakesCount as number,
          missedWords: s.missedWords as string[],
        })),
      // isPending is a display-only flag — the stored `name` stays clean
      // (no "(pending)" text baked in) since this same name ends up saved
      // onto the exception/log and eventually a parent-facing report; only
      // the picker's rendered label should show the pending marker.
      ...pendingStudentsForRoster.map((s) => ({ uid: s.uid, name: s.name, isPending: true })),
    ],
    [rosterWithCompletion, pendingStudentsForRoster]
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
