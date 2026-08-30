import React, { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { auth, dbInstance } from '../../services/database';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface SchoolTeacher {
  uid: string;
  name?: string;
  email?: string;
  educatorRole?: 'ft' | 'kt';
}

interface Props {
  isNight?: boolean;
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
export const TeacherRosterPanel: React.FC<Props> = ({ isNight = true, schoolId, classes, onAssignmentChanged }) => {
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
      setMessage({ text: err.message || 'Failed to update assignment.', type: 'error' });
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
      setMessage({ text: `${label} removed.`, type: 'success' });
    } catch (err: any) {
      setMessage({ text: err.message || 'Failed to remove teacher.', type: 'error' });
    } finally {
      setBusyKey(null);
    }
  };

  if (teachers.length === 0) {
    return (
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 text-xs text-zinc-400 font-bold">
        No teachers have accepted an invite yet. Once one does, they&apos;ll appear here for class assignment.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {message && (
        <p className={`text-xs font-bold ${message.type === 'error' ? 'text-rose-400' : 'text-emerald-400'}`}>{message.text}</p>
      )}
      {teachers.map((t) => {
        const label = t.name || t.email || t.uid;
        const assignedClassIds = new Set(localClasses.filter((c: any) => (c.assignedTeacherUids || []).includes(t.uid)).map((c: any) => c.id));
        return (
          <div key={t.uid} className={`p-4 rounded-2xl border space-y-3 ${isNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="min-w-0">
                <h5 className={`font-bold text-sm truncate ${isNight ? 'text-white' : 'text-zinc-900'}`}>{label}</h5>
                <span className={`text-[10px] font-mono font-bold ${t.educatorRole === 'kt' ? 'text-blue-400' : 'text-orange-400'}`}>
                  {t.educatorRole === 'kt' ? 'Korean Teacher (KT)' : 'Foreign Teacher (FT)'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveTeacher(t.uid, label)}
                disabled={busyKey === t.uid}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] font-bold border border-rose-500/30 disabled:opacity-40 cursor-pointer transition-colors"
              >
                {busyKey === t.uid ? 'Removing…' : 'Remove'}
              </button>
            </div>

            {localClasses.length === 0 ? (
              <p className="text-[11px] text-zinc-400">No classes to assign yet.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {localClasses.map((c: any) => {
                  const isAssigned = assignedClassIds.has(c.id);
                  const key = `${c.id}_${t.uid}`;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleToggleAssignment(c.id, t.uid, isAssigned)}
                      disabled={busyKey === key}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-[background-color,border-color,opacity] cursor-pointer disabled:opacity-40 ${
                        isAssigned
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                          : isNight
                          ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                          : 'bg-white border-zinc-300 text-zinc-600'
                      }`}
                    >
                      {isAssigned ? '✓ ' : '+ '}
                      {c.name || c.id}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {removeConfirm && (
        <ConfirmDialog
          title={`Remove ${removeConfirm.label} from this school? They'll lose access to all classes immediately.`}
          confirmText="Remove"
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
    </div>
  );
};
