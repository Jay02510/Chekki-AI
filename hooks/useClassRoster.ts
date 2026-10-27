import { useState, type Dispatch, type SetStateAction } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy, limit as fbLimit } from 'firebase/firestore';
import { dbInstance, auth } from '../services/database';
import { localDate } from '../src/utils/localDate';
import type { UserProfile } from '../types';
import type { useToast } from '../contexts/ToastContext';

export type ConfirmDialogState = {
  title: string;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
};

// The selected class's roster (enrolled + pending students with this week's
// mistakes) and the staff actions on it: approve, decline, remove, move and
// flag. Extracted from TeacherPage.tsx.
export function useClassRoster(
  selectedClass: any,
  fallbackDemoClass: any,
  user: UserProfile | null,
  classes: any[],
  showToast: ReturnType<typeof useToast>['showToast'],
  isKo: boolean,
  setSyncWarning: Dispatch<SetStateAction<string | null>>,
  setConfirmDialog: Dispatch<SetStateAction<ConfirmDialogState | null>>,
  setSelectedStudentDetails: Dispatch<any>
) {
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);


  const fetchRosterAndMistakes = async (retryCount = 0) => {
    const targetClass = selectedClass || fallbackDemoClass;
    if (!targetClass?.id) return;
    setIsLoadingRoster(true);
    try {
      // Class scans + roster from Firestore — skipped for the demo/no-class
      // placeholder, whose docs never exist server-side.
      const allClassScans: any[] = [];
      let rosterDocs: any[] = [];
      if (!targetClass.isDemo) {
        try {
          // Newest first, capped: this used to read the class's entire scan
          // history on every class/week switch, growing all term.
          const scansQ = query(
            collection(dbInstance, 'classes', targetClass.id, 'studentScans'),
            orderBy('scannedAt', 'desc'),
            fbLimit(500)
          );
          const scansSnap = await getDocs(scansQ);
          scansSnap.forEach(sDoc => allClassScans.push({ id: sDoc.id, ...sDoc.data() }));
        } catch (sErr) {
          console.warn('Firestore class scans fetch failed:', sErr);
          setSyncWarning(
            isKo
              ? '클라우드에서 채점 기록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'
              : "Couldn't load scan history from the cloud. Please try again shortly."
          );
        }

        const q = query(
          collection(dbInstance, 'users'),
          where('classId', '==', targetClass.id)
        );
        const snap = await getDocs(q);
        rosterDocs = snap.docs;
      }

      // 3. Build roster from fetched users
      const students: any[] = [];

      for (const userDoc of rosterDocs) {
        const student: any = { uid: userDoc.id, ...userDoc.data() };
        
        // Match scans for this student
        // By uid only — matching on name too mixed up two kids with the same name.
        const studentScans = allClassScans.filter(s => s.studentUid === student.uid);
        
        // Extract all red-bordered mistakes from scan records
        const scanMistakes: any[] = [];
        studentScans.forEach(scan => {
          if (Array.isArray(scan.redBorderedMistakes)) {
            scan.redBorderedMistakes.forEach((m: any) => {
              scanMistakes.push({
                ...m,
                scannedAt: scan.scannedAt,
                scanTitle: scan.titleEn || scan.titleKo,
                isRedBordered: true,
              });
            });
          }
        });

        // Combine all mistake items
        student.scans = studentScans;
        student.mistakes = scanMistakes;
        if (studentScans.length > 0) {
          student.lastScanDate = studentScans[0].scannedAt;
        }

        students.push(student);
      }

      setStudentsData(students);
    } catch (err: any) {
      // users/{userId}'s read rule now depends on request.auth.token.role/
      // schoolId (custom claims) — the SDK's cached ID token can still be
      // missing/stale claims right after a director/teacher's account was
      // backfilled or role-synced, even though the underlying Firestore
      // data is already correct (audit: a just-added student never appears
      // in the roster, no error surfaced, no retry attempted here at all).
      if (err?.code === 'permission-denied' && retryCount < 3) {
        const delay = 1000 * 2 ** retryCount;
        setTimeout(() => {
          auth.currentUser?.getIdToken(true).finally(() => fetchRosterAndMistakes(retryCount + 1));
        }, delay);
        return;
      }
      console.error('Failed to fetch roster:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Roster approve/decline/remove/move used to leave zero trace of who did
  // it or when — director asked "who approved this student" and there was
  // genuinely no answer anywhere. Best-effort: never blocks or fails the
  // roster action itself if the log write fails.
  const logActivity = async (type: string, targetLabel: string) => {
    const schoolId = user?.schoolId;
    if (!schoolId || !user?.uid) return;
    try {
      await addDoc(collection(dbInstance, 'activityLog'), {
        schoolId,
        type,
        targetLabel,
        actorUid: user.uid,
        actorName: user?.name || user?.email || 'Unknown',
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      console.warn('Failed to write activity log entry:', err);
    }
  };

  // Falls back to a generic label, never the raw UID — that UID gets written
  // permanently into activityLog.targetLabel and rendered straight to the
  // director in ActivityFeed; a student record with no name set (seed/test
  // data, or a student whose profile write hasn't landed yet) shouldn't leak
  // an internal Firebase identifier into that feed.
  const findStudentLabel = (studentUid: string) =>
    (studentsData || []).find((s: any) => s?.uid === studentUid)?.studentName || 'Unnamed Student';

  const handleApproveStudent = async (studentUid: string) => {
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classStatus: 'active' });
      void logActivity('student_approved', findStudentLabel(studentUid));
      await fetchRosterAndMistakes();
      showToast({ type: 'success', message: isKo ? '원생 승인이 완료되었습니다.' : 'Student approved successfully.' });
    } catch (err) {
      console.error('Failed to approve student:', err);
      showToast({ type: 'error', message: isKo ? '원생 승인에 실패했습니다. 다시 시도해주세요.' : 'Failed to approve student. Please try again.' });
    }
  };

  const handleDeclineStudent = async (studentUid: string) => {
    try {
      const label = findStudentLabel(studentUid);
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: null, classStatus: null });
      void logActivity('student_declined', label);
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to decline student:', err);
      showToast({ type: 'error', message: isKo ? '거절 처리에 실패했습니다. 다시 시도해주세요.' : 'Failed to decline student. Please try again.' });
    }
  };

  const handleRemoveStudent = async (studentUid: string) => {
    setConfirmDialog({
      title: isKo ? '정말 이 학생을 반에서 삭제하시겠습니까?' : 'Are you sure you want to remove this student from class?',
      confirmText: isKo ? '삭제' : 'Remove',
      cancelText: isKo ? '취소' : 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performRemoveStudent(studentUid);
      },
    });
  };

  const performRemoveStudent = async (studentUid: string) => {
    try {
      const label = findStudentLabel(studentUid);
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: null, classStatus: null });
      void logActivity('student_removed', label);
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to remove student:', err);
      showToast({ type: 'error', message: isKo ? '학생 삭제에 실패했습니다. 다시 시도해주세요.' : 'Failed to remove student. Please try again.' });
    }
  };

  const handleMoveStudent = async (studentUid: string, targetClassId: string) => {
    if (!targetClassId) return;
    try {
      const label = findStudentLabel(studentUid);
      const targetClassName = classes.find((c: any) => c.id === targetClassId)?.name || targetClassId;
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: targetClassId, classStatus: 'active' });
      void logActivity('student_moved', `${label} → ${targetClassName}`);
      await fetchRosterAndMistakes();
      showToast({ type: 'success', message: isKo ? '학급 이동이 완료되었습니다.' : 'Student transferred successfully.' });
    } catch (err) {
      console.error('Failed to transfer student:', err);
      showToast({ type: 'error', message: isKo ? '학급 이동에 실패했습니다. 다시 시도해주세요.' : 'Failed to transfer student. Please try again.' });
    }
  };

  // Backs the "Flagged Exceptions" tab in NativeDirectorPortal — previously
  // that tab read from local mock state nothing ever wrote to, because there
  // was no real way to flag a student anywhere in the app. This is that path:
  // written on users/{studentUid}, same write surface as approve/decline/
  // move (already permitted by firestore.rules for the class's teacher or
  // the school's director).
  const handleToggleFlagStudent = async (studentUid: string, reason?: string) => {
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      if (reason && reason.trim()) {
        await updateDoc(userRef, {
          flaggedException: {
            date: localDate(),
            reason: reason.trim(),
            teacherName: user?.name || user?.email?.split('@')[0] || (isKo ? '선생님' : 'Teacher'),
            resolved: false,
          },
        });
      } else {
        await updateDoc(userRef, { flaggedException: null });
      }
      await fetchRosterAndMistakes();
      setSelectedStudentDetails((prev: any) =>
        prev && prev.uid === studentUid
          ? { ...prev, flaggedException: reason && reason.trim() ? { date: localDate(), reason: reason.trim(), teacherName: user?.name || user?.email?.split('@')[0] || 'Teacher', resolved: false } : null }
          : prev
      );
    } catch (err) {
      console.error('Failed to update flag status:', err);
      showToast({ type: 'error', message: isKo ? '플래그 상태 변경에 실패했습니다.' : 'Failed to update flag status.' });
    }
  };

  return {
    studentsData,
    isLoadingRoster,
    fetchRosterAndMistakes,
    handleApproveStudent,
    handleDeclineStudent,
    handleRemoveStudent,
    handleMoveStudent,
    handleToggleFlagStudent,
  };
}
