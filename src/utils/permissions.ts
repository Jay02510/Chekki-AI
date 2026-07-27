import { UserProfile } from '../../types';

export type UserRole = 'parent' | 'teacher' | 'admin' | 'director' | 'foreign_teacher' | 'korean_teacher';

export interface UserPermissions {
  canAccessTeacherLog: boolean;
  canAccessKtDashboard: boolean;
  canAccessDirectorAdmin: boolean;
  canEditReports: boolean;
  canManageSchoolRoster: boolean;
}

/**
 * Evaluates fine-grained user permissions based on user role and plan
 */
export function getPermissionsForUser(profile: UserProfile | null | undefined): UserPermissions {
  if (!profile) {
    // Default guest / unauthenticated permission (Demo Mode)
    return {
      canAccessTeacherLog: true,
      canAccessKtDashboard: true,
      canAccessDirectorAdmin: false,
      canEditReports: true,
      canManageSchoolRoster: false,
    };
  }

  const role = (profile.role || 'teacher') as UserRole;
  const isAdmin = role === 'admin' || role === 'director';

  return {
    canAccessTeacherLog: isAdmin || role === 'teacher' || role === 'foreign_teacher',
    canAccessKtDashboard: isAdmin || role === 'teacher' || role === 'korean_teacher',
    canAccessDirectorAdmin: isAdmin,
    canEditReports: isAdmin || role === 'teacher' || role === 'korean_teacher',
    canManageSchoolRoster: isAdmin,
  };
}
