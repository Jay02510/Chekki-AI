import { useMemo } from 'react';
import type { UserProfile } from '../types';

// TeacherPage.tsx used to re-derive this fallback chain (Firestore role ->
// localStorage role written at signup -> the caller's own best guess) in two
// separate effects. They drifted out of sync at least once in production
// (a director whose Firestore role write failed rendered the FT/KT dashboard
// in one effect while the other correctly fell back to localStorage) because
// only one of the two copies got updated when the chain was fixed. One
// computation, both call sites consume it.
export function resolveTeacherRole(
  user: Pick<UserProfile, 'uid' | 'role' | 'educatorRole'> | null | undefined,
  loginRoleFallback: 'teacher' | 'director'
) {
  const uid = user?.uid || '';
  const firestoreRole = user?.role;
  const localRole = uid ? localStorage.getItem(`chekki_user_role_${uid}`) : null;
  const resolvedRole = firestoreRole || localRole || loginRoleFallback;
  const isDirector = resolvedRole === 'director';
  const isKt = user?.educatorRole === 'kt';
  return { resolvedRole, isDirector, isKt };
}

export function useResolvedRole(
  user: Pick<UserProfile, 'uid' | 'role' | 'educatorRole'> | null | undefined,
  loginRoleFallback: 'teacher' | 'director'
) {
  return useMemo(
    () => resolveTeacherRole(user, loginRoleFallback),
    [user?.uid, user?.role, user?.educatorRole, loginRoleFallback]
  );
}
