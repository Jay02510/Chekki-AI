// Groups a KT's pending logs (one doc per class-day submission) into one
// consolidated draft per student per day — a student enrolled in two
// classes with two different FTs currently produces two entirely separate
// logs; this assembles everything touching them that day into a single
// review unit instead of leaving the KT to notice and merge them by hand.
//
// Grouping keys on studentUid (see ClassLogPayload.enrolledStudentUids /
// exceptions[].studentUid), not name-matching — a roster typo or duplicate
// name across classes must not silently merge or split the wrong kids.

export interface PendingLog {
  id: string;
  classId: string;
  className?: string;
  date?: string;
  createdAt?: any;
  aiKoreanSummary?: string;
  aiEnglishSummary?: string;
  aiStudentReports?: Array<{
    studentName: string;
    studentUid?: string | null;
    koreanUpdate: string;
    phoneTalkingPoints?: string[];
    category?: 'praise' | 'attention';
  }>;
  enrolledStudentUids?: string[];
  // Students already individually approved on this log doc — a log covers
  // the WHOLE class-day, not one student, so approving David must not also
  // remove John from the queue before a KT ever reviewed him (confirmed
  // live: approving one student silently flipped the shared doc to 'sent'
  // and dropped every other student sharing it). Filtering already-reviewed
  // uids out of this log's targets keeps the doc's other students visible
  // until each has actually been approved.
  reviewedStudentUids?: string[];
}

export interface StudentDayEntry {
  classId: string;
  logId: string;
  className: string;
  generalParagraph: string;
  exceptionParagraph?: string;
  exceptionCategory?: 'praise' | 'attention';
}

export interface ConsolidatedStudentDay {
  // Real roster identity when every constituent log resolved one — a
  // student pulled in only via an unmatched custom-typed exception name has
  // no stable uid and is grouped by that name instead (still surfaced, just
  // not joined across other classes without a shared key).
  studentUid: string | null;
  studentName: string;
  date: string;
  academyName: string;
  sourceLogIds: string[];
  sourceClassIds: string[];
  entries: StudentDayEntry[];
}

/**
 * Groups today's pending logs by student. A log's general-class paragraph
 * attaches to every student enrolled in that class (enrolledStudentUids);
 * its per-student exception paragraphs attach only to the flagged student.
 * Logs/exceptions with no resolvable studentUid fall back to a name-keyed
 * group of their own (`custom:${name}`) rather than being dropped.
 */
export function consolidateStudentReports(
  logs: PendingLog[],
  academyName: string,
  // uid -> display name, from the roster (not the log docs) — a log only
  // carries names for students it flagged (aiStudentReports); an enrolled-
  // but-not-flagged student has no name anywhere in the log itself, only
  // their uid in enrolledStudentUids. Without this map that student's card
  // would show the raw uid string instead of a real name.
  studentNamesByUid: Record<string, string> = {}
): ConsolidatedStudentDay[] {
  const groups = new Map<string, ConsolidatedStudentDay>();

  const getGroup = (uid: string | null, name: string, date: string): ConsolidatedStudentDay => {
    const key = uid ? `uid:${uid}` : `custom:${name.trim().toLowerCase()}:${date}`;
    let g = groups.get(key);
    if (!g) {
      g = { studentUid: uid, studentName: name, date, academyName, sourceLogIds: [], sourceClassIds: [], entries: [] };
      groups.set(key, g);
    }
    return g;
  };

  for (const log of logs) {
    const date = log.date || (log.createdAt?.toDate ? log.createdAt.toDate().toISOString().slice(0, 10) : '');
    const className = log.className || log.classId;
    const generalParagraph = (log.aiKoreanSummary || '').trim();
    const exceptionsByStudent = new Map<string, NonNullable<PendingLog['aiStudentReports']>[number]>();
    for (const ex of log.aiStudentReports || []) {
      const key = ex.studentUid || `custom:${ex.studentName.trim().toLowerCase()}`;
      exceptionsByStudent.set(key, ex);
    }

    // Attach the general paragraph to every enrolled student (falls back to
    // just the flagged students if the log predates enrolledStudentUids).
    const targets: Array<{ uid: string | null; name: string }> =
      log.enrolledStudentUids && log.enrolledStudentUids.length > 0
        ? log.enrolledStudentUids.map((uid) => {
            const match = [...exceptionsByStudent.values()].find((e) => e.studentUid === uid);
            return { uid, name: match?.studentName || studentNamesByUid[uid] || uid };
          })
        : (log.aiStudentReports || []).map((e) => ({ uid: e.studentUid ?? null, name: e.studentName }));

    // enrolledStudentUids only covers the roster-approved class — an
    // exception typed for a walk-in/trial student (free-typed name, no
    // roster match, studentUid: null) previously had no target at all once
    // a class had a normal non-empty roster, silently dropping that note
    // from the KT's consolidated queue with no error (audit: non-roster
    // exceptions dropped from consolidation).
    if (log.enrolledStudentUids && log.enrolledStudentUids.length > 0) {
      const coveredUids = new Set(targets.map((t) => t.uid).filter(Boolean));
      for (const ex of log.aiStudentReports || []) {
        if (ex.studentUid && coveredUids.has(ex.studentUid)) continue;
        targets.push({ uid: ex.studentUid ?? null, name: ex.studentName });
        if (ex.studentUid) coveredUids.add(ex.studentUid);
      }
    }

    if (targets.length === 0) continue;

    const reviewedUids = log.reviewedStudentUids || [];
    for (const target of targets) {
      if (target.uid && reviewedUids.includes(target.uid)) continue;
      const group = getGroup(target.uid, target.name, date);
      const exception = target.uid
        ? exceptionsByStudent.get(target.uid)
        : exceptionsByStudent.get(`custom:${target.name.trim().toLowerCase()}`);
      group.sourceLogIds.push(log.id);
      if (!group.sourceClassIds.includes(log.classId)) group.sourceClassIds.push(log.classId);
      group.entries.push({
        classId: log.classId,
        logId: log.id,
        className,
        generalParagraph,
        exceptionParagraph: exception?.koreanUpdate,
        exceptionCategory: exception?.category,
      });
    }
  }

  return [...groups.values()];
}

/** Assembles one consolidated group into the KT-editable draft text: one
 * shared intro line, then each entry's paragraph(s) stacked below it,
 * separated by blank lines so it's easy to read and edit. */
export function formatConsolidatedDraft(group: ConsolidatedStudentDay, isKo: boolean): string {
  const intro = isKo
    ? `${group.academyName} — ${group.date} — ${group.studentName} 학생 일일 리포트`
    : `${group.academyName} — ${group.date} — Daily Report for ${group.studentName}`;
  const paragraphs = group.entries.flatMap((e) => {
    const parts = [e.generalParagraph].filter(Boolean);
    if (e.exceptionParagraph) parts.push(e.exceptionParagraph);
    return parts;
  });
  return [intro, ...paragraphs].filter(Boolean).join('\n\n');
}
