import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Check, Plus } from '@phosphor-icons/react';
import { staffUi, msgTone } from './staffUi';

interface SchoolTeacher {
  uid: string;
  name?: string;
  email?: string;
  educatorRole?: 'ft' | 'kt';
}

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  schoolId: string;
  classes: any[];
  // Real refetch of the parent's `classes` state (TeacherPage's
  // fetchClasses). Without this, a successful assign/remove only updated
  // the local mirror below — the next time the parent's `classes` prop
  // changed for any unrelated reason, the sync effect overwrote that mirror
  // back to the stale pre-assignment data, silently reverting an assignment
  // that had actually succeeded server-side (audit: director sees the
  // assignment tick go green then disappear).
  onAssignmentChanged?: () => void;
}

/**
 * Director-facing teacher→class assignment + removal. Both writes go
 * through api/create-teacher-invite.ts's action dispatch (assign/remove —
 * folded in from their own endpoint files to stay under Vercel's 12-function
 * Hobby limit) via Admin SDK — firestore.rules explicitly forbids a client
 * from changing a class's teacherUid/assignedTeacherUids or another user's
 * role/schoolId directly, so this panel is a thin UI over that endpoint, not
 * a second place those checks are implemented.
 */
export const TeacherRosterPanel: React.FC<Props> = ({ isNight = true, isKo = false, schoolId, classes, onAssignmentChanged }) => {
  const [teachers, setTeachers] = useState<SchoolTeacher[]>([]);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{ teacherUid: string; label: string } | null>(null);
  // classes prop comes from a one-time getDocs() fetch in the parent, not a
  // live listener, and the parent has no callback to refetch after a toggle.
  // Mirror it into local state so a successful assign/remove can update the
  // button state immediately instead of silently doing nothing until reload.
  const [localClasses, setLocalClasses] = useState<any[]>(classes);
  useEffect(() => {
    setLocalClasses(classes);
  }, [classes]);

  useEffect(() => {
    if (!schoolId) return;
    const q = query(collection(dbInstance, 'users'), where('schoolId', '==', schoolId), where('role', '==', 'teacher'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setTeachers(snap.docs.map((d) => ({ uid: d.id, ...(d.data() as any) })));
      },
      (err) => console.warn('Failed to load school teachers:', err)
    );
    return () => unsub();
  }, [schoolId]);

  const callEndpoint = async (path: string, body: unknown) => {
    const idToken = await auth.currentUser?.getIdToken();
    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(body),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || 'Request failed');
    return data;
  };

  const handleToggleAssignment = async (classId: string, teacherUid: string, isAssigned: boolean) => {
    const key = `${classId}_${teacherUid}`;
    setBusyKey(key);
    setMessage(null);
    try {
      await callEndpoint('/api/create-teacher-invite', { action: 'assign', classId, teacherUid, assignAction: isAssigned ? 'remove' : 'add' });
      setLocalClasses((prev) =>
        prev.map((c: any) => {
          if (c.id !== classId) return c;
          const current = new Set(c.assignedTeacherUids || []);
          if (isAssigned) current.delete(teacherUid); else current.add(teacherUid);
          return { ...c, assignedTeacherUids: Array.from(current) };
        })
      );
      // Refresh the parent's real classes state so the next `classes` prop
      // sync reflects this assignment instead of overwriting it back out.
      onAssignmentChanged?.();
    } catch (err: any) {
      setMessage({ text: err.message || (isKo ? '배정을 변경하지 못했습니다.' : 'Failed to update assignment.'), type: 'error' });
    } finally {
      setBusyKey(null);
    }
  };

  const handleRemoveTeacher = (teacherUid: string, label: string) => {
    setRemoveConfirm({ teacherUid, label });
  };

  const performRemoveTeacher = async (teacherUid: string, label: string) => {
    setBusyKey(teacherUid);
    setMessage(null);
    try {
      await callEndpoint('/api/create-teacher-invite', { action: 'remove', teacherUid });
      setMessage({ text: isKo ? `${label} 선생님을 삭제했습니다.` : `${label} removed.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || (isKo ? '선생님을 삭제하지 못했습니다.' : 'Failed to remove teacher.'), type: 'error' });
    } finally {
      setBusyKey(null);
    }
  };

  if (teachers.length === 0) {
    return (
      <section className="text-left text-ink">
        <h3 className={`${staffUi.h3} mb-2`}>{isKo ? '우리 학원 선생님' : 'Your teachers'}</h3>
        <p className={staffUi.notice}>
          {isKo
            ? '아직 초대를 수락한 선생님이 없습니다. 수락하면 여기에서 학급을 배정할 수 있습니다.'
            : "No teachers have accepted an invite yet. Once one does, they'll appear here for class assignment."}
        </p>
      </section>
    );
  }

  return (
    <section className="text-left text-ink">
      <h3 className={staffUi.h3}>{isKo ? '우리 학원 선생님' : 'Your teachers'}</h3>
      <p className={`${staffUi.sub} mb-2`}>{isKo ? '학급을 눌러 배정하거나 해제하세요.' : 'Tap a class to assign or unassign it.'}</p>
      {message && <p className={`mb-2 ${msgTone(message.type)}`} role="status">{message.text}</p>}
      <ul className={staffUi.rows}>
      {teachers.map((t) => {
        const label = t.name || t.email || t.uid;
        const assignedClassIds = new Set(localClasses.filter((c: any) => (c.assignedTeacherUids || []).includes(t.uid)).map((c: any) => c.id));
        return (
          <li key={t.uid} className="space-y-3 py-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[16px] font-bold">{label}</p>
                <p className="text-[13px] text-ink-3">
                  {t.educatorRole === 'kt' ? (isKo ? '한국인 선생님 (KT)' : 'Korean teacher (KT)') : (isKo ? '원어민 선생님 (FT)' : 'Foreign teacher (FT)')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTeacher(t.uid, label)}
                disabled={busyKey === t.uid}
                className={`${staffUi.dangerText} min-h-11 px-1`}
              >
                {busyKey === t.uid ? (isKo ? '삭제 중…' : 'Removing…') : (isKo ? '삭제' : 'Remove')}
              </button>
            </div>

            {localClasses.length === 0 ? (
              <p className="text-[14px] text-ink-3">{isKo ? '배정할 학급이 없습니다.' : 'No classes to assign yet.'}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {localClasses.map((c: any) => {
                  const isAssigned = assignedClassIds.has(c.id);
                  const key = `${c.id}_${t.uid}`;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleAssignment(c.id, t.uid, isAssigned)}
                      disabled={busyKey === key}
                      aria-pressed={isAssigned}
                      className={`btn-press inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-md px-3 text-[14px] font-bold disabled:opacity-50 ${
                        isAssigned ? 'bg-line-soft text-ink' : 'text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3'
                      }`}
                    >
                      {isAssigned ? <Check size={16} weight="bold" className="text-line-ink" aria-hidden="true" /> : <Plus size={16} weight="bold" className="text-ink-3" aria-hidden="true" />}
                      {c.name || c.id}
                    </button>
                  );
                })}
              </div>
            )}
          </li>
        );
      })}
      </ul>

      {removeConfirm && (
        <ConfirmDialog
          title={
            isKo
              ? `${removeConfirm.label} 선생님을 학원에서 삭제할까요? 모든 학급 접근 권한이 즉시 사라집니다.`
              : `Remove ${removeConfirm.label} from this school? They'll lose access to all classes immediately.`
          }
          confirmText={isKo ? '삭제' : 'Remove'}
          variant="destructive"
          isNight={isNight}
          onConfirm={() => {
            const { teacherUid, label } = removeConfirm;
            setRemoveConfirm(null);
            void performRemoveTeacher(teacherUid, label);
          }}
          onCancel={() => setRemoveConfirm(null)}
        />
      )}
    </section>
  );
};
