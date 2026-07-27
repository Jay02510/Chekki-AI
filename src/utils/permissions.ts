import { UserProfile } from '../../types';

export type UserRole = 'parent' | 'teacher' | 'admin' | 'director' | 'foreign_teacher' | 'korean_teacher';

export interface UserPermissions {
  canAccessTeacherLog: boolean;
  canAccessKtDashboard: boolean;
  canAccessDirectorAdmin: boolean;
  canEditReports: boolean;
  canManageSchoolRoster: boolean;
  hasCurriculumPreseeding: boolean; // Product B (School Pro) Feature
  productTier: 'standalone_studio' | 'school_pro' | 'enterprise';
}

/**
 * Evaluates fine-grained user permissions and product tier entitlement
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
      hasCurriculumPreseeding: true, // Enabled for interactive demo
      productTier: 'standalone_studio',
    };
  }

  const role = (profile.role || 'teacher') as UserRole;
  const isAdmin = role === 'admin' || role === 'director';
  const isProPlan = profile.plan === 'pro' || profile.schoolId != null;

  return {
    canAccessTeacherLog: isAdmin || role === 'teacher' || role === 'foreign_teacher',
    canAccessKtDashboard: isAdmin || role === 'teacher' || role === 'korean_teacher',
    canAccessDirectorAdmin: isAdmin,
    canEditReports: isAdmin || role === 'teacher' || role === 'korean_teacher',
    canManageSchoolRoster: isAdmin,
    hasCurriculumPreseeding: isAdmin || isProPlan,
    productTier: isProPlan ? 'school_pro' : 'standalone_studio',
  };
}
