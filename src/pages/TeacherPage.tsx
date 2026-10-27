import React, { useState, useEffect, useRef } from 'react';
import * as Sentry from '@sentry/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { dbInstance, auth } from '../../services/database';
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  orderBy,
  limit as fbLimit,
} from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useResolvedRole } from '../../hooks/useResolvedRole';
import { useKtReviewQueue } from '../../hooks/useKtReviewQueue';
import { useTeacherTabs } from '../../hooks/useTeacherTabs';
import { useRosterAnalytics } from '../../hooks/useRosterAnalytics';
import { useNotifications } from '../../hooks/useNotifications';
import { DirectorSidebarNav } from '../components/DirectorSidebarNav';
import { KtSidebarNav } from '../components/KtSidebarNav';
import { TeacherMobileTabBar } from '../components/TeacherMobileTabBar';
import { FtSidebarNav } from '../components/FtSidebarNav';
import { DirectorTabContent } from '../components/DirectorTabContent';
import { NotificationBell } from '../components/NotificationBell';
import { KtTabContent } from '../components/KtTabContent';
import { FtTabContent } from '../components/FtTabContent';
import { useDirectorPortalState } from '../../hooks/useDirectorPortalState';
import { useCurriculumEditorState } from '../../hooks/useCurriculumEditorState';
import { useClassLogSubmission } from '../../hooks/useClassLogSubmission';
import { useClassRoster, type ConfirmDialogState } from '../../hooks/useClassRoster';
import { TeacherAuthView } from '../components/TeacherAuthView';
import { TeacherWelcomeModal } from '../components/TeacherWelcomeModal';
import { StudentDetailsDrawer } from '../components/StudentDetailsDrawer';
import { CreateClassModal } from '../components/CreateClassModal';
import { TeacherSettingsModal } from '../components/TeacherSettingsModal';
import {
  ArrowRight,
  Plus,
  Minus,
  SignOut,
  ChalkboardTeacher,
  X,
  Gear,
  Sun,
  Moon,
  CaretDown,
} from '@phosphor-icons/react';
import { FeedbackModal } from '../../components/FeedbackModal';
import { ScannedModal } from '../components/ScannedModal';
import { DocPreviewModal } from '../components/DocPreviewModal';
import { WeekCalendarModal } from '../components/WeekCalendarModal';
import { ReportCardModal } from '../components/ReportCardModal';
import { UnifiedAccountActivation } from '../components/UnifiedAccountActivation';
import { ConfirmDialog } from '../../components/ConfirmDialog';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, logout, deleteAccount, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const isKo = language === 'ko';
  const [isThemeNight, setIsThemeNight] = useState(isNight);
  // Scopes the 16px-field rule in index.css (no iOS focus zoom) to Schools.
  useEffect(() => {
    document.body.classList.add('schools-ui');
    return () => document.body.classList.remove('schools-ui');
  }, []);
  // Warm tokens (text-ink, bg-surface...) follow this page's own theme
  // toggle, not the device theme on html.
  useEffect(() => {
    document.body.classList.toggle('dark', isThemeNight);
    document.body.classList.toggle('theme-light', !isThemeNight);
    return () => document.body.classList.remove('dark', 'theme-light');
  }, [isThemeNight]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);
  const [showWeekCalendarModal, setShowWeekCalendarModal] = useState(false);
  
  // Account Activation Wizard State for new directors
  // Triggers when: ?activate=true in URL AND user is authenticated AND wizard not yet completed for this account
  const isActivateParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('activate') === 'true';
  const inviteSlug = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('invite') || '') : '';
  const [showInviteSessionNotice, setShowInviteSessionNotice] = useState(true);
  // Plan carried in the URL from the /schools plan modal (?plan=school_pro),
  // not just sessionStorage — sessionStorage alone breaks if this link is
  // opened in a new tab or the page is refreshed mid-signup. Mirrored into
  // sessionStorage below so the existing signUp()/wizard reads keep working.
  const urlPlanId = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('plan') : null;
  const [activationPlanId] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    if (urlPlanId) {
      sessionStorage.setItem('chekki_selected_plan', urlPlanId);
      return urlPlanId;
    }
    return sessionStorage.getItem('chekki_selected_plan');
  });


  const [showActivationWizard, setShowActivationWizard] = useState(false);
  const { schoolSeatsTotal, schoolPlanId, trialStatus, handleRequestSeatExpansion, handleRequestPlanChange } = useDirectorPortalState(user, showToast, isKo);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // FT/KT first-login welcome, set by the post-auth effect below for a new
  // teacher (see TeacherWelcomeModal).
  const [teacherWelcome, setTeacherWelcome] = useState<{ name: string; role: 'ft' | 'kt' } | null>(null);




  // id used to be the bare literal 'demo', which meant curriculum saved
  // while previewing with no real class yet (curriculums/demo_week_1) was
  // ONE SHARED Firestore document for every account on the entire app —
  // any director who scanned a syllabus before creating their first class
  // leaked that content into every other new director's empty-state
  // preview (Audit: brand-new academy shows another school's curriculum).
  // Scoping the id per-uid gives each account its own private doc.
  const fallbackDemoClass = {
    id: `demo_${user?.uid || 'guest'}`,
    isDemo: true,
    name: 'Sample Class (7-year-old)',
    level: '7-year-old',
    joinCode: 'DEMO01',
    activeWeekNumber: 1,
  };

  // Class state. This used to seed from and persist to a single unscoped
  // 'chekki_academy_classes' localStorage key shared by every account in
  // this browser — the very first render (before auth/Firestore resolve)
  // could briefly show a PREVIOUS account's class list on this device
  // (Audit: cross-account class-list flash on login). Real persistence and
  // instant-paint already happen correctly via the per-uid
  // `teacher_classes_${uid}` key (see the initial-load effect and
  // fetchClasses below), so this now always starts from the safe demo
  // placeholder instead of reading anyone's cached data at mount.
  const [classes, setClassesState] = useState<any[]>(() => [fallbackDemoClass]);

  const setClasses = (action: any) => {
    setClassesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      return next;
    });
  };

  // Real, non-placeholder classes only — the class-switcher and any count
  // shown to the user should never include fallbackDemoClass.
  const realClasses = classes.filter((c: any) => !c.isDemo);

  const [selectedClass, setSelectedClass] = useState<any>(() => classes[0] || fallbackDemoClass);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('7-year-old');
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  // Sync warning: set when Firestore writes fail silently (Fix 8 — Audit §13b)
  const [syncWarning, setSyncWarning] = useState<string | null>(null);

  // Role selection & Tab navigation
  const isDirectorPath = typeof window !== 'undefined' && (
    window.location.pathname.includes('director') || 
    new URLSearchParams(window.location.search).get('role') === 'director'
  );
  // Signup always ends in window.location.reload() (see handleAuthSubmit),
  // so on the very first render after a director signs up, `user?.role`
  // hasn't come back from Firestore yet — this initializer used to default
  // to 'teacher' in that window, flashing the FT dashboard before the
  // isDirector effect below corrected it moments later. useResolvedRole's
  // fallback chain already covers this via the `chekki_user_role_${uid}`
  // localStorage value signup writes right before reloading (see
  // handleAuthSubmit) — checking it here too closes the same gap for the
  // very first render, before that effect has had a chance to run.
  const [loginRole, setLoginRole] = useState<'teacher' | 'director'>(() => {
    if (isDirectorPath || user?.role === 'director') return 'director';
    const cachedUid = user?.uid || auth.currentUser?.uid;
    if (cachedUid && localStorage.getItem(`chekki_user_role_${cachedUid}`) === 'director') return 'director';
    return 'teacher';
  });

  // Educator role is sourced from Firestore profile field (educatorRole) ONLY.
  // Email-substring matching ('kt' in email) is intentionally removed — it was
  // silently misclassifying FT teachers whose email happened to contain 'kt'
  // (e.g. kate@, dakota@, nikto@) and hiding their homework tab. (Audit §7)
  const firestoreEducatorRole = user?.educatorRole as 'ft' | 'kt' | undefined;
  // Same flash this file already fixed for loginRole above (see the comment
  // at line ~312): on the very first render `user?.educatorRole` may not
  // have arrived from Firestore yet, and this initializer unconditionally
  // defaulted to 'ft' in that window — flashing the FT dashboard for KT
  // accounts before the correction effect below replaced it a render later.
  // Falls back to the same `chekki_educator_role_${uid}` cache the sync-repair
  // effect further down already writes, closing the gap for first paint too.
  const [educatorRole, setEducatorRole] = useState<'ft' | 'kt'>(() => {
    if (firestoreEducatorRole === 'kt') return 'kt';
    if (firestoreEducatorRole === 'ft') return 'ft';
    const cachedUid = user?.uid || auth.currentUser?.uid;
    const cached =
      (cachedUid && localStorage.getItem(`chekki_educator_role_${cachedUid}`)) ||
      (user?.email && localStorage.getItem(`chekki_educator_role_${user.email}`));
    return cached === 'kt' ? 'kt' : 'ft';
  });
  const isDirectorUser = isDirectorPath || user?.role === 'director';
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications(
    isDirectorUser ? user?.uid : null
  );
  // activeTab/setActiveTab are declared further below, via useTeacherTabs —
  // it needs confirmDiscardKtDraft from useKtReviewQueue, which itself needs
  // state declared between here and there (curriculumEditor, studentsData),
  // so the hook call and the effects that use activeTab are grouped together
  // right after useKtReviewQueue instead of here.
  const [uploadMode, setUploadMode] = useState<'syllabus' | 'worksheet'>('syllabus');
  const [submittedLogs, setSubmittedLogs] = useState<any[]>([]);

  // Retries a role write that failed server-side at signup (see the
  // set-initial-role call above) so the account doesn't stay
  // localStorage-only on this device forever, silently losing its role on
  // any other device/browser.
  useEffect(() => {
    if (!user?.uid) return;
    const uid = user.uid;
    const pendingRole = localStorage.getItem(`chekki_pending_role_sync_${uid}`);
    if (!pendingRole) return;

    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/set-initial-role', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          // The signup attempt already sent the verification email; retries
          // on later visits shouldn't send another each time.
          body: JSON.stringify({ role: pendingRole, skipVerificationEmail: true }),
        });
        if (response.ok) {
          localStorage.removeItem(`chekki_pending_role_sync_${uid}`);
        }
      } catch (err) {
        console.warn('Pending role sync retry failed, will retry on next visit:', err);
      }
    })();
  }, [user?.uid]);

  // Deliberately NOT falling back to isDirectorPath inside useResolvedRole:
  // isDirectorPath just checks whether the URL contains "director" (e.g.
  // /director-hq), which any authenticated teacher can end up on. Falling
  // back to it once a real user is signed in let the URL override their
  // actual Firestore role, showing a real KT/FT account the full Director HQ
  // shell. A brand-new director already resolves correctly via loginRole
  // (set at signup) or localStorage (written at signup), so that fallback
  // was only ever needed pre-auth (see the activeTab/loginRole useState
  // defaults, which legitimately use isDirectorPath as a loading-state guess).
  const { isDirector: resolvedIsDirector, isKt: resolvedIsKt } = useResolvedRole(user, loginRole);

  // Curriculum/scan editor state — extracted into a hook (Phase 1 of the
  // TeacherPage split, see buzzing-nibbling-hearth plan).
  const curriculumEditor = useCurriculumEditorState(
    selectedClass,
    fallbackDemoClass,
    user,
    showToast,
    isKo,
    uploadMode,
    setUploadMode,
    setSyncWarning,
  );
  const {
    selectedTextbookName,
    curriculumTopic, curriculumVocab, curriculumPhonics, curriculumPassage, curriculumOther,
    curriculumAnswerKey,
    scannedData, showScannedModal, setShowScannedModal, setScannedData,
    activeScannedModalType,
    selectedScannedTopic, setSelectedScannedTopic, selectedScannedVocab, setSelectedScannedVocab,
    selectedPageIndex, setSelectedPageIndex,
    textbookPreviewUrl, docPreviewUrl, syllabusPreviewUrl, worksheetPreviewUrl,
    uploadedFileName,
    showDocPreviewModal, setShowDocPreviewModal,
    handleTextbookFileUpload, applyScannedSelectionToCurriculum,
    loadCurriculum, handleSaveCurriculum, handleGenerateWorksheet,
  } = curriculumEditor;

  // Student roster & analytics state
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);
  const {
    studentsData,
    isLoadingRoster,
    fetchRosterAndMistakes,
    handleApproveStudent,
    handleDeclineStudent,
    handleRemoveStudent,
    handleMoveStudent,
    handleToggleFlagStudent,
  } = useClassRoster(selectedClass, fallbackDemoClass, user, classes, showToast, isKo, setSyncWarning, setConfirmDialog, setSelectedStudentDetails);

  // Roster & weekly-completion analytics — extracted into a hook (Phase 3
  // of the buzzing-nibbling-hearth TeacherPage split, see the hook's own
  // comment for why it's not scoped "FT-only" despite the plan's name).
  const {
    getWeeklyVocabWords,
    getWeeklyPhonicsRules,
    activeVocabWords,
    activeRoster,
    pendingRoster,
    completionRate,
    sortedTroubleWords,
    ftDashboardRoster,
    invitedOnlyRosterRows,
  } = useRosterAnalytics(studentsData, curriculumVocab, curriculumPhonics, selectedClass);

  const {
    ktPendingLogs, setKtPendingLogs,
    setKtDraftDirty,
    ktLogsLoadError,
    confirmDiscardKtDraft,
    approveClassLog,
    discardClassLog,
  } = useKtReviewQueue(educatorRole, classes, user, showToast, isKo);

  // Tab state (Phase 5 of the buzzing-nibbling-hearth TeacherPage split) —
  // declared here rather than up with the rest of the per-role state because
  // it needs confirmDiscardKtDraft/setKtDraftDirty from useKtReviewQueue above.
  const { activeTab, setActiveTab } = useTeacherTabs(isDirectorUser, educatorRole, confirmDiscardKtDraft, setKtDraftDirty);
  const handleLogSubmit = useClassLogSubmission(user, selectedClass, educatorRole, setSubmittedLogs, setKtPendingLogs, showToast, isKo);

  useEffect(() => {
    if (user) {
      const isDirector = resolvedIsDirector;
      const isKtRole = resolvedIsKt;

      if (isDirector) {
        setLoginRole('director');
        setActiveTab('director_hq');
      } else if (isKtRole) {
        setLoginRole('teacher');
        setEducatorRole('kt');
        setActiveTab('kt_script');
      } else {
        setLoginRole('teacher');
        setEducatorRole('ft');
        if (activeTab === 'director_hq' || activeTab === 'kt_script') {
          setActiveTab('overview');
        }
      }
    }
  }, [user?.uid, user?.educatorRole, user?.role]);

  // Handle Teacher Invite Link URL Params (FT vs KT Role Routing)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const inviteRole = params.get('role');
      if (inviteRole === 'kt') {
        setEducatorRole('kt');
        setActiveTab('kt_script');
      } else if (inviteRole === 'ft') {
        setEducatorRole('ft');
        setActiveTab('overview');
      }
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'syllabus') {
      setUploadMode('syllabus');
    } else if (activeTab === 'homework') {
      setUploadMode('worksheet');
    }
  }, [activeTab]);

  // Teacher onboarding & Academy Branding & Settings
  const [showTeacherOnboarding, setShowTeacherOnboarding] = useState(false);
  const [teacherObStep, setTeacherObStep] = useState(0);
  // Was seeded from an unscoped 'chekki_academy_logo' localStorage key and
  // only ever overwritten (never cleared) when the Firestore fetch below
  // found no logo — so one director's logo leaked onto a different
  // director's dashboard on the same browser (e.g. admin impersonating
  // school A, then school B: B saw A's logo) until B happened to have a
  // logo of their own to overwrite it. Firestore is the only source now.
  const [academyLogo, setAcademyLogo] = useState<string>('');
  const displayedAcademyName = user?.schoolName || 'Chekki Master Academy';

  // Load the school's saved logo from Firestore — the only source of truth.
  // Runs for every role, not just director, since FT/KT teachers also see
  // the academy logo in the header and on report cards. Always sets state
  // (even to '') so switching accounts/schools in the same browser can't
  // leave a previous school's logo on screen.
  useEffect(() => {
    const schoolId = user?.schoolId;
    if (!schoolId) {
      setAcademyLogo('');
      return;
    }
    (async () => {
      try {
        const snap = await getDoc(doc(dbInstance, 'schools', schoolId));
        const logoUrl = snap.data()?.logoUrl;
        setAcademyLogo(typeof logoUrl === 'string' ? logoUrl : '');
      } catch (err) {
        console.warn('Failed to load academy logo from school profile:', err);
        setAcademyLogo('');
      }
    })();
  }, [user?.schoolId]);

  // Worksheet Format & Question Style State
  const [worksheetType, setWorksheetType] = useState<string>('daily_homework');
  const [questionStyle, setQuestionStyle] = useState<string>('multiple_choice');

  // Teacher Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Load classes if authenticated and role is teacher or director
  useEffect(() => {
    if (isAuthenticated && (user?.role === 'teacher' || user?.role === 'director' || loginRole === 'director')) {
      fetchClasses();
    }
  }, [isAuthenticated, user, loginRole]);

  // Load previously submitted logs for the selected class (history tab).
  // For a KT, the review queue itself is populated by the separate
  // cross-class effect below instead — a student can be enrolled in more
  // than one of the KT's classes, so a queue scoped to whichever class
  // happens to be selected would hide that student's other same-day logs
  // from consolidation entirely.
  useEffect(() => {
    if (!selectedClass?.id || selectedClass.isDemo) {
      setSubmittedLogs([]);
      return;
    }
    (async () => {
      try {
        const logsRef = collection(dbInstance, 'classes', selectedClass.id, 'logs');
        const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), fbLimit(50));
        const snap = await getDocs(logsQuery);
        const allLogs = snap.docs.map((d) => ({ id: d.id, classId: selectedClass.id, ...d.data() } as any));
        setSubmittedLogs(allLogs);
      } catch (err) {
        console.error('Failed to load class log history:', err);
      }
    })();
  }, [selectedClass?.id]);

  // Show teacher onboarding once when first authenticated with no classes.
  // Directors get their own dedicated activation wizard (see the effect below) —
  // showing this generic tour to them too produced two stacked onboarding
  // overlays on a fresh director signup, so this tour is FT/KT-only.
  //
  // This tour's final step is a self-serve "Create First Class" button —
  // separate from (and missed by) the fix that stopped the OTHER
  // welcome-screen from offering that to invited teachers. A director now
  // assigns the class at invite time, so an invited FT/KT with zero
  // classes is just waiting on that assignment, not missing a class they
  // need to create themselves — this tour must not auto-show for them
  // (audit: KT stuck on "Add Class" popup, could never reach the
  // dashboard, because this second onboarding flow still offered to let
  // them create their own disconnected class).
  useEffect(() => {
    const uid = user?.uid || 'guest';
    const isInvitedWaitingOnAssignment = !!user?.schoolId;
    if (!isLoadingClasses && isAuthenticated && user?.role === 'teacher' && !isInvitedWaitingOnAssignment) {
      if (classes.length === 0) {
        const obDone =
          localStorage.getItem('chekki_teacher_ob_done') ||
          localStorage.getItem(`chekki_teacher_ob_done_${uid}`) ||
          localStorage.getItem(`teacher_ob_done_${uid}`);
        if (!obDone) {
          setShowTeacherOnboarding(true);
        }
      } else {
        setShowTeacherOnboarding(false);
      }
    }
  }, [isAuthenticated, user, classes, isLoadingClasses]);

  // --- Post-auth routing: director wizard vs FT/KT welcome ---
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const uid = user.uid || '';
    const isDirector = resolvedIsDirector;

    if (isDirector && isActivateParam) {
      // Director with ?activate=true — show wizard only if first time.
      // Unscoped 'chekki_wizard_done' used to be checked here too — once
      // ANY director finished the wizard on a device, a second, different
      // director signing up on that same device never saw it again (audit:
      // multi-account-same-device suppression, same shape as the earlier
      // unscoped-localStorage class/curriculum leaks).
      const wizardDone = uid && localStorage.getItem(`chekki_wizard_done_${uid}`);
      if (!wizardDone) {
        setShowActivationWizard(true);
      }
    } else if (!isDirector) {
      // FT/KT teacher — show welcome only if first login. Wait for the real
      // Firestore class fetch before deciding: an account that already has
      // classes (e.g. a fresh browser/device on an existing account) must
      // never replay this, even if this device's localStorage flag was
      // never set — the classes themselves are the source of truth.
      if (isLoadingClasses) return;
      const welcomeDone =
        (uid && localStorage.getItem(`chekki_teacher_welcome_done_${uid}`)) ||
        classes.length > 0;
      if (!welcomeDone) {
        // Detect FT/KT from a previously stored explicit selection, falling
        // back to the resolved Firestore role — never from an email
        // substring (the last instance of that pattern, audit §20e). The
        // localStorage-only version left this screen stuck on the FT
        // default for any KT account that never went through invite
        // redemption on this device (e.g. seeded directly in Firestore).
        const storedEducatorRole = localStorage.getItem(`chekki_educator_role_${uid}`) ||
          localStorage.getItem(`chekki_educator_role_${user.email}`);
        setTeacherWelcome({
          // Pre-fill name from user profile
          name: user.name || user.email?.split('@')[0] || '',
          role: storedEducatorRole === 'kt' || user.educatorRole === 'kt' ? 'kt' : 'ft',
        });
      }
    }
  }, [isAuthenticated, user?.uid, isLoadingClasses, classes]);



  const dismissTeacherOnboarding = () => {
    const uid = user?.uid || 'guest';
    localStorage.setItem('chekki_teacher_ob_done', '1');
    localStorage.setItem(`chekki_teacher_ob_done_${uid}`, '1');
    localStorage.setItem(`teacher_ob_done_${uid}`, 'true');
    setShowTeacherOnboarding(false);
  };

  const teacherOnboardingDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showTeacherOnboarding,
    onClose: dismissTeacherOnboarding,
  });
  // Mobile off-canvas nav drawer — on md+ the sidebar is always a static
  // column and this state is simply never set true, so it's a no-op there.
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const sidebarDialogRef = useDialogA11y<HTMLElement>({
    isOpen: isSidebarOpen,
    onClose: () => setIsSidebarOpen(false),
  });

  // Teacher onboarding steps config
  const teacherObSteps = [
    {
      img: '/assets/teacher_ob_create_class.png',
      titleEn: 'Your Class & Parent Join Code',
      titleKo: '담당 학급 & 6자리 학부모 코드',
      descEn: "Your director sets up your class and assigns you to it — share the 6-digit join code they give you with parents for instant home homework sync.",
      descKo: '원장님이 학급을 개설하고 선생님을 배정합니다. 전달받은 6자리 코드를 학부모님께 공유하면 가정에서 스캔한 오답과 점수가 실시간 연동됩니다.',
    },
    {
      img: '/assets/teacher_ob_seed_curriculum.png',
      titleEn: 'Zero-Typing Curriculum Upload',
      titleKo: '3초 교재 AI 자동 등록 (0타이핑 정답지)',
      descEn: 'Drop your textbook photo or PDF. Chekki AI automatically extracts target vocabulary and answer keys in seconds.',
      descKo: '교재 사진이나 PDF 한 장만 드롭하면 끝. Chekki AI가 주간 어휘와 정답지를 3초 만에 자동 생성합니다.',
    },
    {
      img: '/assets/teacher_ob_share_code.png',
      titleEn: 'Zero-Prep Insights & 1-Click Reports',
      titleKo: '실시간 취약점 분석 & 1초 학부모 성장 리포트',
      descEn: 'View auto-synced home mistake patterns before class starts, and export encouraging 1-click progress reports without manual writing.',
      descKo: '가정 스캔 오답(빨간 테두리 항목)을 수업 전 미리 확인하고, 작성 부담 없이 1초 만에 학부모 성장 리포트를 발송하세요.',
    },
  ];

  // Initial load from localStorage so saved classes appear instantly on mount
  useEffect(() => {
    if (isAuthenticated) {
      const uid = user?.uid || 'guest';
      const localKey = `teacher_classes_${uid}`;
      // A global, un-scoped 'teacher_classes_fallback' key used to be merged
      // in here (and written on every class create/delete/week-change) as
      // an offline safety net — but being unscoped meant it leaked class
      // rosters and names between completely unrelated accounts sharing a
      // browser (Audit: cross-account data leak — one director's classes
      // appeared on another's fresh dashboard). Removed; per-uid caching
      // below plus the real Firestore fetch already cover the offline case.
      const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');
      if (localSaved.length > 0) {
        setClasses(localSaved);
        setSelectedClass(localSaved[0]);
      }
    }
  }, [isAuthenticated, user?.uid]);

  // fetchClasses runs from a `[isAuthenticated, user, loginRole]` effect
  // that re-fires on every `user` reference change — during the onboarding
  // wizard (UnifiedAccountActivation), `user` changes several times in
  // quick succession (academy name persist, logo, role settle), each
  // kicking off its own fetchClasses call. The wizard's own onComplete
  // handler optimistically setClasses()'s the classes it just created via
  // the real API — but an earlier, slower fetchClasses call (e.g. one still
  // working through its permission-denied retry backoff) could resolve
  // *after* that optimistic update and unconditionally overwrite it,
  // including with an empty list (audit: classes created in onboarding
  // wizard don't show up — a stale fetchClasses response, not a data-write
  // bug, silently reverted the just-created classes back to nothing).
  const fetchClassesRequestIdRef = useRef(0);

  const fetchClasses = async (retryCount = 0, requestId = ++fetchClassesRequestIdRef.current) => {
    const uid = user?.uid || 'guest';
    const maxRetries = 3;
    setIsLoadingClasses(true);
    const fetchedFromFirestore: any[] = [];
    let hardFailure: any = null;
    if (user?.uid) {
      // Two independent queries merged by id: `teacherUid` (original
      // single-owner field, still set on every class) and
      // `assignedTeacherUids` (director-assigned co-teachers). Classes
      // created before assignedTeacherUids existed only match the first
      // query — merging keeps them showing up exactly as before.
      //
      // A director additionally gets a third, schoolId-scoped query.
      // Without it, a director only ever saw classes tied to their OWN uid
      // (created by them, or where they're personally listed in
      // assignedTeacherUids) — but a director administers the whole
      // school, and firestore.rules already grants them read access to
      // every class in it via isSchoolDirectorOfClass(). A class created
      // under a different account (an earlier test/dogfood session, a
      // prior onboarding attempt, a teacher who's since been removed)
      // still counts against the school's seat limit
      // (api/create-class.ts's schoolId-scoped count) but was completely
      // invisible — and undeletable — from the director's own dashboard
      // (audit: "2 classes added" per the seat-limit error, 0 shown,
      // nothing to delete).
      const queries = [
        getDocs(query(collection(dbInstance, 'classes'), where('teacherUid', '==', user.uid))),
        getDocs(query(collection(dbInstance, 'classes'), where('assignedTeacherUids', 'array-contains', user.uid))),
      ];
      if (isDirectorUser && user.schoolId) {
        queries.push(getDocs(query(collection(dbInstance, 'classes'), where('schoolId', '==', user.schoolId))));
      }

      // Run with allSettled, not Promise.all — Promise.all's fail-fast
      // behavior meant a permission error on EITHER query discarded a
      // successful result from the OTHER one too, so a teacher who owns
      // classes directly (teacherUid) could see none of them just because
      // the separate assignedTeacherUids query happened to fail (audit:
      // co-taught classes intermittently wiped out a teacher's own classes
      // from the list, not just failing to add the co-taught ones).
      const results = await Promise.allSettled(queries);

      const seen = new Set<string>();
      const mergeSnap = (snap: any) => {
        snap.docs.forEach((doc: any) => {
          if (seen.has(doc.id)) return;
          seen.add(doc.id);
          fetchedFromFirestore.push({ id: doc.id, ...doc.data() });
        });
      };
      results.forEach((result) => {
        if (result.status === 'fulfilled') mergeSnap(result.value);
        else hardFailure = hardFailure || result.reason;
      });
    }

    if (hardFailure) {
      const err = hardFailure;
      // Same transient-permission-denied-right-after-signup pattern
      // StudentInvitePanel/useNotifications already retry for (firestore.rules
      // re-reads the caller's own user doc on every query; that read can
      // momentarily deny before a brand-new session settles). A single fixed
      // 1.5s retry wasn't always enough for a slower session settle, which
      // left teachers permanently stuck on "couldn't load classes" even
      // after a director had genuinely assigned them one (audit: assigned
      // class never reflects for the teacher, no self-heal). Retry with
      // backoff instead of once.
      if (err?.code === 'permission-denied' && retryCount < maxRetries) {
        setTimeout(() => {
          // Force a fresh ID token before retrying — firestore.rules now
          // reads request.auth.token.role/schoolId (custom claims), and the
          // SDK's cached token can still be missing/stale claims for a
          // director/teacher whose account was backfilled or had its role
          // synced after this session's token was minted.
          auth.currentUser?.getIdToken(true).finally(() => fetchClasses(retryCount + 1, requestId));
        }, 1000 * 2 ** retryCount);
        return;
      }
      // A newer fetchClasses call (or the onboarding wizard's own optimistic
      // update) has already started/committed since this one began — don't
      // let a stale, slower attempt's failure stomp over it.
      if (requestId !== fetchClassesRequestIdRef.current) return;
      console.warn('Firestore fetch warning (falling back to local storage):', err?.code, err);
      // This catch previously only console.warn'd — a caught error never
      // reaches Sentry automatically, so a real class-fetch failure here
      // (as opposed to the already-handled transient permission-denied
      // right after signup) left zero record of what actually went wrong,
      // no error code, nothing to diagnose from later. errorCode is its own
      // tag (not just buried in extra) so Sentry issues can be grouped/
      // filtered by it directly.
      Sentry.captureException(err, {
        tags: { area: 'fetchClasses', errorCode: err?.code || 'unknown' },
        extra: { uid, role: user?.role, educatorRole, schoolId: user?.schoolId, retryCount },
      });
      setSyncWarning(
        isKo
          ? '클라우드에서 학급 목록을 불러오지 못해 이 기기에 저장된 정보를 표시하고 있습니다. 최신 정보가 아닐 수 있습니다.'
          : "Couldn't load classes from the cloud — showing what's saved on this device, which may be out of date."
      );
    }

    // Same staleness guard as the hardFailure branch above, for the success
    // path — a slower-but-successful fetch could otherwise still overwrite
    // a newer call's (or the onboarding wizard's) more current result.
    if (requestId !== fetchClassesRequestIdRef.current) {
      setIsLoadingClasses(false);
      return;
    }

    const localKey = `teacher_classes_${uid}`;
    const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');

    const map = new Map();
    fetchedFromFirestore.forEach(c => map.set(c.id, c));
    localSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });

    const combined = Array.from(map.values());
    setClasses(combined);
    if (combined.length > 0) {
      setSelectedClass((prev: any) => (prev && combined.some((c: any) => c.id === prev.id)) ? prev : combined[0]);
    } else {
      // Never set to null — always keep fallbackDemoClass so JSX never crashes reading .joinCode etc.
      setSelectedClass((prev: any) => prev ?? fallbackDemoClass);
    }
    setIsLoadingClasses(false);
  };


  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.uid || 'guest';

    setIsCreatingClass(true);
    let firestoreFailed = false;
    try {
      // Seat-limit enforcement now happens server-side in api/create-class.ts
      // (audit §2/§10/§18) — it counts existing classes against
      // schools/{schoolId}.seatsTotal via the Admin SDK and firestore.rules
      // denies direct client creates entirely, so this can't be bypassed by
      // editing localStorage or calling the Firestore SDK directly the way
      // the old client-only check could be.
      const idToken = await auth.currentUser?.getIdToken();
      const response = await fetch('/api/create-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ name: newClassName.trim(), level: newClassLevel }),
      });
      const data = await response.json();

      let newClass: any;
      if (response.ok) {
        newClass = data.class;
      } else if (response.status === 400) {
        // Real seat-limit/trial-expiry rejection — surface it and stop, don't
        // fall back to a local-only class that the server has explicitly
        // refused. For trial expiry specifically, the upgrade path is one
        // click away instead of a dead-end alert (server soft-locks this
        // action but a director had no way to act on it from here before).
        if (data.trialExpired) {
          setConfirmDialog({
            title: (data.error || (isKo ? '7일 무료 체험이 종료되었습니다.' : 'Your 7-day trial has ended.')) +
              '\n\n' +
              (isKo ? '지금 업그레이드하시겠습니까?' : 'Upgrade now?'),
            confirmText: isKo ? '업그레이드' : 'Upgrade',
            cancelText: isKo ? '취소' : 'Cancel',
            onConfirm: () => {
              setConfirmDialog(null);
              window.location.href = '/schools';
            },
          });
        } else {
          showToast({ type: 'error', message: data.error || (isKo ? '학급 개설 한도에 도달했습니다.' : "You've reached your class limit.") });
        }
        return;
      } else {
        // Server unreachable for some other reason — keep the teacher moving
        // with a local-only class, same as the old Firestore-write-failure
        // fallback, but now flagged clearly as unsynced rather than silently
        // treated as created.
        console.warn('create-class API failed, saving locally only:', data.error);
        firestoreFailed = true;
        const schoolId = user?.schoolId || `school_${uid.slice(0, 8)}`;
        const sanitizedName = newClassName.trim().replace(/\s+/g, '-');
        newClass = {
          id: `${schoolId}_${sanitizedName}_${Date.now()}`,
          schoolId,
          schoolName: user?.schoolName || 'B2B Academy',
          name: newClassName.trim(),
          level: newClassLevel,
          teacherUid: uid,
          activeWeekNumber: 1,
          createdAt: new Date().toISOString(),
        };
      }

      // Persist in localStorage under the user-specific key only — see the
      // initial-load effect above for why the old global fallback key is gone.
      const localKey = `teacher_classes_${uid}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [newClass, ...existingLocal.filter((c: any) => c.id !== newClass.id)];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      localStorage.setItem('chekki_teacher_ob_done', '1');
      localStorage.setItem(`chekki_teacher_ob_done_${uid}`, '1');
      localStorage.setItem(`teacher_ob_done_${uid}`, 'true');
      setShowTeacherOnboarding(false);

      setClasses((prev: any[]) => {
        const exists = prev.some((c: any) => c.id === newClass.id);
        return exists ? prev : [newClass, ...prev];
      });
      setSelectedClass(newClass);

      setNewClassName('');
      setShowCreateClassModal(false);

      if (firestoreFailed) {
        // Show a persistent sync-warning so the teacher knows the class is
        // only saved locally and needs to retry when connection is restored.
        setSyncWarning(
          isKo
            ? '학급 정보가 로컬에만 저장되었습니다. 인터넷 연결을 확인하고 페이지를 새로고침하여 클라우드에 동기화하세요.'
            : 'Class saved locally but not yet synced to cloud. Check your connection and refresh to re-sync.'
        );
      }
    } catch (err: any) {
      console.error('Failed to create class:', err);
      showToast({ type: 'error', message: isKo ? '학급 개설 중 오류가 발생했습니다. 다시 시도해 주세요.' : `Failed to create class: ${err?.message || 'Please try again.'}` });
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleDeleteClass = async (classIdToDelete?: string) => {
    const targetId = classIdToDelete || selectedClass?.id;
    if (!targetId) return;

    const classToDelete = classes.find((c: any) => c.id === targetId);
    if (!classToDelete) return;

    const confirmMsg = isKo
      ? `'${classToDelete.name}' 학급을 정말 삭제하시겠습니까? 삭제된 학급 정보는 복구할 수 없습니다.`
      : `Are you sure you want to delete class '${classToDelete.name}'? This action cannot be undone.`;

    setConfirmDialog({
      title: confirmMsg,
      confirmText: isKo ? '삭제' : 'Delete',
      cancelText: isKo ? '취소' : 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteClass(targetId);
      },
    });
  };

  const performDeleteClass = async (targetId: string) => {
    setIsDeletingClass(true);
    const uid = user?.uid || 'guest';

    try {
      if (user?.uid) {
        try {
          // Direct client deleteDoc() used to be gated by firestore.rules'
          // `teacherUid == request.auth.uid` — any class this director
          // didn't personally create (an earlier test class, one created
          // under a now-removed account) permission-denied silently here,
          // vanished from local state only, and kept counting against the
          // school's seat-based class limit server-side forever. Server-
          // side action authorizes by school membership instead.
          const idToken = await auth.currentUser?.getIdToken();
          const response = await fetch('/api/create-class', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
            body: JSON.stringify({ action: 'delete_class', classId: targetId }),
          });
          if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw new Error(data.error || 'Failed to delete class');
          }
        } catch (fsErr) {
          console.warn('Class delete warning:', fsErr);
          setSyncWarning(
            isKo
              ? '학급이 이 기기에서만 삭제되었습니다. 클라우드에서 삭제되지 않아 다른 기기나 학부모 화면에는 계속 표시될 수 있습니다.'
              : 'Class removed on this device only — the cloud delete failed, so it may still appear elsewhere until you retry with a connection.'
          );
        }
      }

      const updatedClasses = classes.filter((c: any) => c.id !== targetId);
      setClasses(updatedClasses);

      if (selectedClass?.id === targetId) {
        setSelectedClass(updatedClasses.length > 0 ? updatedClasses[0] : null);
      }

      const localKey = `teacher_classes_${uid}`;
      localStorage.setItem(localKey, JSON.stringify(updatedClasses));
    } catch (err: any) {
      console.error('Failed to delete class:', err);
      showToast({ type: 'error', message: isKo ? '학급 삭제 중 오류가 발생했습니다.' : `Failed to delete class: ${err?.message || 'Please try again.'}` });
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleDeleteTeacherAccount = async () => {
    const confirmMsg = isKo
      ? '정말로 선생님 계정을 영구 삭제하시겠습니까? 이 작업은 복구할 수 없으며 모든 정보가 삭제됩니다.'
      : 'Are you sure you want to permanently delete your teacher account? This action cannot be undone.';
    setConfirmDialog({
      title: confirmMsg,
      confirmText: isKo ? '삭제' : 'Delete',
      cancelText: isKo ? '취소' : 'Cancel',
      variant: 'destructive',
      onConfirm: () => {
        setConfirmDialog(null);
        void performDeleteTeacherAccount();
      },
    });
  };

  const performDeleteTeacherAccount = async () => {
    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowSettingsModal(false);
    } catch (err: any) {
      console.error('Failed to delete teacher account:', err);
      showToast({ type: 'error', message: err.message || (isKo ? '계정 삭제 중 오류가 발생했습니다.' : 'Failed to delete account.') });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleUpdateWeek = async (delta: number) => {
    if (!selectedClass) return;
    const newWeek = Math.max(1, (selectedClass.activeWeekNumber || 1) + delta);
    const updated = { ...selectedClass, activeWeekNumber: newWeek };
    setSelectedClass(updated);
    setClasses((prev: any[]) => {
      const next = prev.map((c: any) => c.id === updated.id ? updated : c);
      const uid = user?.uid || 'guest';
      try {
        localStorage.setItem(`teacher_classes_${uid}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to cache classes to localStorage:', e);
      }
      return next;
    });

    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: newWeek });
    } catch (err) {
      console.warn('Firestore active week update warning (updated locally):', err);
      setSyncWarning(
        isKo
          ? '주차 변경이 이 기기에만 저장되었습니다. 다른 기기에는 반영되지 않을 수 있습니다.'
          : 'Week change saved on this device only — it may not appear on other devices until this syncs.'
      );
    }
  };

  const handleSelectWeek = async (targetWeekNum: number) => {
    if (!selectedClass) return;
    const updated = { ...selectedClass, activeWeekNumber: targetWeekNum };
    setSelectedClass(updated);
    setClasses((prev: any[]) => {
      const next = prev.map((c: any) => c.id === updated.id ? updated : c);
      const uid = user?.uid || 'guest';
      try {
        localStorage.setItem(`teacher_classes_${uid}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to cache classes to localStorage:', e);
      }
      return next;
    });
    // Directors don't have a syllabus-edit tab (§5: curriculum uploads are
    // teacher-only) — only redirect FT/KT into the syllabus editor.
    if (!(loginRole === 'director' || user?.role === 'director')) {
      // Demo build: Syllabus tab hidden (see nav below) — land on Homework instead.
      setActiveTab('homework');
    }

    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: targetWeekNum });
    } catch (err) {
      console.warn('Firestore target week update warning (updated locally):', err);
      setSyncWarning(
        isKo
          ? '주차 변경이 이 기기에만 저장되었습니다. 다른 기기에는 반영되지 않을 수 있습니다.'
          : 'Week change saved on this device only — it may not appear on other devices until this syncs.'
      );
    }
  };

  // Load curriculum whenever selected class or week changes
  useEffect(() => {
    loadCurriculum();
    fetchRosterAndMistakes();
  }, [selectedClass?.id, selectedClass?.activeWeekNumber]);

  // --- RENDER AUTH (LOGIN / SIGN UP) VIEW ---
  if (!isAuthenticated) {
    return (
      <TeacherAuthView
        loginRole={loginRole}
        setLoginRole={setLoginRole}
        inviteSlug={inviteSlug}
        activationPlanId={activationPlanId}
        isActivateParam={isActivateParam}
      />
    );
  }

  // Parent docs carry no `role`, so resolveTeacherRole fell through to the
  // URL hint (?role=director from the /schools trial CTA) and a parent who
  // signed in here got the Director shell. Staff = a server-assigned role,
  // or the role this device wrote at staff signup/invite (pre-reload).
  const localStaffRole = localStorage.getItem(`chekki_user_role_${user?.uid}`);
  const isStaffAccount =
    ['teacher', 'director', 'admin'].includes(user?.role || '') ||
    localStaffRole === 'teacher' || localStaffRole === 'director';
  if (!isStaffAccount) {
    return (
      <div className="fixed inset-0 z-[500] overflow-y-auto bg-ground text-ink-2 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md bg-surface rounded-lg p-8 sm:p-10 flex flex-col items-center text-center ring-1 ring-inset ring-rule">
          <div className="w-16 h-16 mb-5">
            <ChekkiMascot className="w-full h-full" mood="happy" />
          </div>
          <h1 className="text-xl font-bold text-ink mb-2">
            {isKo ? '학부모 계정으로 로그인되어 있어요' : "You're signed in as a parent"}
          </h1>
          <p className="text-sm text-ink-3 mb-6">
            {isKo
              ? `${user?.email || ''} 계정은 학부모용이에요. 이 화면은 학원 선생님·원장님 전용이에요.`
              : `${user?.email || ''} is a parent account. This page is for academy teachers and directors.`}
          </p>
          <a
            href="/app"
            className="w-full min-h-12 inline-flex items-center justify-center rounded-md bg-line text-on-line font-bold mb-3"
          >
            {isKo ? '숙제 확인하러 가기' : 'Go check homework'}
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="w-full min-h-12 rounded-md text-sm font-bold text-ink-2 ring-1 ring-inset ring-rule hover:ring-ink-3 cursor-pointer"
          >
            {isKo ? '로그아웃하고 다른 계정으로 로그인' : 'Sign out and use a staff account'}
          </button>
        </div>
      </div>
    );
  }

  const activeClass = selectedClass || fallbackDemoClass;
  const isKtInbox = !isDirectorUser && educatorRole === 'kt' && activeTab === 'kt_script';
  // Class picker and week only change what these tabs show; on billing,
  // teacher seats and the KT inbox (all classes) they were dead controls.
  const showClassControls = !isKtInbox && activeTab !== 'billing' && activeTab !== 'teacher_assignment';


  if (showActivationWizard) {
    return (
      <UnifiedAccountActivation
        isNight={isThemeNight}
        isKo={isKo}
        schoolId={user?.schoolId || ''}
        seatsTotal={schoolSeatsTotal}
        trialStatus={trialStatus}
        onComplete={async (data) => {
          const uid = user?.uid || '';
          // Mark wizard as done so it never shows again for this account
          if (uid) localStorage.setItem(`chekki_wizard_done_${uid}`, '1');
          dismissTeacherOnboarding();
          if (data.academyName) {
            localStorage.setItem('chekki_academy_name', data.academyName);
          }
          if (data.logoUrl) {
            setAcademyLogo(data.logoUrl);
          }
          if (data.classes && data.classes.length > 0) {
            // Create each class through the real server-authoritative path
            // (api/create-class.ts) instead of fabricating local-only class
            // objects with fake `CHK####` join codes — those never existed in
            // Firestore, so no parent could ever join with them, and the
            // classes vanished the next time fetchClasses() ran.
            const idToken = await auth.currentUser?.getIdToken();
            const createdClasses: any[] = [];
            const failedNames: string[] = [];
            for (const clsName of data.classes) {
              try {
                const response = await fetch('/api/create-class', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                  body: JSON.stringify({ name: clsName, level: 'Kindergarten & Elementary' }),
                });
                const resData = await response.json();
                if (response.ok) {
                  createdClasses.push(resData.class);
                } else {
                  failedNames.push(clsName);
                }
              } catch {
                failedNames.push(clsName);
              }
            }
            if (createdClasses.length > 0) {
              setClasses((prev: any[]) => [...createdClasses, ...prev]);
              setSelectedClass(createdClasses[0]);
              // Also seed the localStorage cache fetchClasses merges from —
              // belt-and-suspenders alongside the requestId staleness guard
              // there, so even a legitimately *newer* fetchClasses call that
              // hits a transient failure still finds these classes instead
              // of showing an empty dashboard right after they were created.
              try {
                if (uid) {
                  const localKey = `teacher_classes_${uid}`;
                  const existing = JSON.parse(localStorage.getItem(localKey) || '[]');
                  const map = new Map(existing.map((c: any) => [c.id, c]));
                  createdClasses.forEach((c) => map.set(c.id, c));
                  localStorage.setItem(localKey, JSON.stringify(Array.from(map.values())));
                }
              } catch {
                // localStorage can throw in private/incognito modes — not
                // worth failing the whole onboarding flow over a cache write.
              }
            }
            if (failedNames.length > 0) {
              showToast({
                type: 'error',
                message: isKo
                  ? `일부 학급을 개설하지 못했습니다: ${failedNames.join(', ')}. 대시보드에서 다시 시도해 주세요.`
                  : `Couldn't create: ${failedNames.join(', ')}. Please add them from the dashboard.`,
              });
            }
          }
          setShowActivationWizard(false);
          setActiveTab('director_hq');
        }}
     />
    );
  }

  // --- FT/KT FIRST-LOGIN WELCOME MODAL ---
  if (teacherWelcome) {
    return (
      <TeacherWelcomeModal
        isKo={isKo}
        initialName={teacherWelcome.name}
        initialRole={teacherWelcome.role}
        roleLocked={!!user?.educatorRole}
        onDone={(role) => {
          const uid = user?.uid || '';
          if (uid) localStorage.setItem(`chekki_teacher_welcome_done_${uid}`, '1');
          setTeacherWelcome(null);
          setActiveTab(role === 'kt' ? 'kt_script' : 'overview');
        }}
      />
    );
  }


  // --- RENDER CORE DASHBOARD LAYOUT SHELL ---
  return (
    <div className={`min-h-dvh bg-ground text-ink flex flex-col md:flex-row selection:bg-line selection:text-on-line`}>

      {/* Teacher Onboarding Modal */}
      {showTeacherOnboarding && (() => {
        const step = teacherObSteps[teacherObStep];
        const isLast = teacherObStep === teacherObSteps.length - 1;
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-[#2b211a]/55" onClick={dismissTeacherOnboarding} />
            <div
              ref={teacherOnboardingDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-onboarding-title"
              tabIndex={-1}
              className={`relative w-full max-w-[420px] p-1 border rounded-lg ${
              'bg-surface border-rule'
            }`}>
              <div className={`rounded-lg p-8 flex flex-col items-center text-center ${
                'bg-surface text-ink'
              }`}>
                <button
                  onClick={dismissTeacherOnboarding}
                  className={`absolute top-5 right-5 text-[12px] font-bold px-3 py-1.5 rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] cursor-pointer ${
                    'text-ink-2 hover:text-ink bg-sunken hover:bg-sunken'
                  }`}
                >
                  {isKo ? '건너뛰기' : 'Skip'}
                </button>

                <div className={`w-44 h-44 mb-6 rounded-lg overflow-hidden p-2 flex items-center justify-center ${
                  'bg-surface border border-rule'
                }`}>
                  <img src={step.img} alt="" className="w-full h-full object-contain" />
                </div>

                <h3 id="teacher-onboarding-title" className={`text-2xl font-extrabold tracking-tight mb-3 text-ink`}>
                  {isKo ? step.titleKo : step.titleEn}
                </h3>
                <p className={`text-sm leading-relaxed max-w-[300px] mb-8 text-ink-2`}>
                  {isKo ? step.descKo : step.descEn}
                </p>

                <div className="flex items-center gap-2 mb-8">
                  {teacherObSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-[color,background-color,border-color,box-shadow,transform] duration-300 ${i === teacherObStep ? 'w-8 bg-line' : 'w-1.5 bg-sunken'}`}
                   />
                  ))}
                </div>

                <button
                  onClick={() => {
                    if (isLast) {
                      // Classes are director-created and teacher-assigned only —
                      // one auth/onboarding flow, no self-serve class creation
                      // for FT/KT (was: opened the create-class modal here).
                      dismissTeacherOnboarding();
                    } else {
                      setTeacherObStep(teacherObStep + 1);
                    }
                  }}
                  className="group w-full py-4 bg-line hover:bg-line text-on-line font-extrabold text-sm rounded-lg transition-[color,background-color,border-color,box-shadow,transform] duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
                >
                  <span>
                    {isLast
                      ? (isKo ? '시작하기' : 'Got it')
                      : (isKo ? '다음 단계' : 'Next Step')}
                  </span>
                  <ArrowRight size={16} weight="bold" aria-hidden="true" className="group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Mobile-only backdrop for the off-canvas drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[350] bg-[#2b211a]/55 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
       />
      )}

      {/* Sidebar Navigation — static column on md+, off-canvas drawer below md */}
      <aside
        ref={sidebarDialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isKo ? '탐색 메뉴' : 'Navigation menu'}
        tabIndex={-1}
        className={`fixed inset-y-0 left-0 z-[360] w-[85vw] max-w-sm transform transition-[transform,visibility,background-color] duration-300 ease-out md:static md:z-auto md:w-72 md:h-dvh md:sticky md:top-0 md:translate-x-0 md:transform-none border-b md:border-b-0 md:border-r flex flex-col shrink-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full max-md:invisible'
        } bg-surface border-rule`}
      >

        {/* Sidebar Header / Brand */}
        <div className={`p-6 border-b transition-colors flex items-center justify-between gap-3 shrink-0 ${
          'border-rule bg-surface'
        }`}>
          <div className="flex items-center gap-3.5 min-w-0">
            {academyLogo ? (
              <img
                src={academyLogo}
                alt="Academy Logo"
                className="w-10 h-10 rounded-lg object-cover border border-rule bg-sunken"
             />
            ) : (
              <div className="w-10 h-10 bg-line-soft border border-rule rounded-lg flex items-center justify-center text-line-ink shrink-0">
                <ChalkboardTeacher size={20} weight="bold" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className={`text-sm font-extrabold tracking-tight truncate text-ink`}>
                {user?.schoolName || 'B2B Academy'}
              </h1>
              <p className="text-[12px] text-ink-3 font-medium truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={isKo ? '메뉴 닫기' : 'Close menu'}
            className={`md:hidden p-2 rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer shrink-0 ${
              'text-ink-2 hover:text-ink hover:bg-sunken'
            }`}
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Navigation Tabs (Scoped by Role) */}
        <nav
          className="p-4 flex-1 space-y-2 overflow-y-auto"
          onClick={(e) => {
            if ((e.target as HTMLElement).closest('button')) setIsSidebarOpen(false);
          }}
        >
          {/* Nav per role — DirectorSidebarNav/KtSidebarNav/FtSidebarNav
              (Phase 6 of the buzzing-nibbling-hearth TeacherPage split). */}
          {(loginRole === 'director' || user?.role === 'director') && (
            <DirectorSidebarNav isKo={isKo} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {loginRole !== 'director' && educatorRole === 'kt' && (
            <KtSidebarNav
              isKo={isKo}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showReportCardModal={showReportCardModal}
              setShowReportCardModal={setShowReportCardModal}
           />
          )}

          {loginRole !== 'director' && educatorRole === 'ft' && (
            <FtSidebarNav isKo={isKo} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 transition-colors ${
          'border-rule bg-surface'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-md bg-line-soft border border-rule text-line-ink flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate text-ink`}>{user?.name}</p>
              <p className="text-[12px] text-ink-3 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {/* Language/theme live in the header on sm+; on phones they'd
                push the header to a second row, so they sit here instead. */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className={`sm:hidden p-2 rounded-md text-xs font-bold transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                'text-ink-2 hover:text-ink hover:bg-sunken'
              }`}
              aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              {language === 'ko' ? 'EN' : '한'}
            </button>
            <button
              type="button"
              onClick={() => setIsThemeNight(!isThemeNight)}
              className={`sm:hidden p-2 rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                'text-ink-2 hover:bg-sunken'
              }`}
              aria-label={isThemeNight ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isThemeNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className={`p-2 rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                'text-ink-2 hover:text-ink hover:bg-sunken'
              }`}
              title={isKo ? '교사 설정' : 'Teacher settings'}
              aria-label={isKo ? '교사 설정' : 'Teacher settings'}
            >
              <Gear size={16} weight="bold" />
            </button>
            <button
              onClick={logout}
              className={`p-2 rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.95] cursor-pointer ${
                'text-ink-3 hover:text-wrong hover:bg-wrong-soft'
              }`}
              title={isKo ? '로그아웃' : 'Log out'}
              aria-label={isKo ? '로그아웃' : 'Log out'}
            >
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </aside>

      <TeacherMobileTabBar
        isNight={isThemeNight}
        isKo={isKo}
        educatorRole={isDirectorUser ? 'director' : educatorRole}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        pendingCount={ktPendingLogs.length}
        onMore={() => setIsSidebarOpen(true)}
     />

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 relative overflow-y-auto transition-colors ${
        'bg-ground text-ink'
      }`}>
        
        {/* Top Header Control Bar */}
        {/* The KT inbox spans every class, so the class switcher does nothing
            there; on phones the header would be empty, so it hides too. */}
        <header className={`p-3 sm:p-6 border-b flex flex-wrap items-center justify-between gap-2 sm:gap-4 relative z-20 shrink-0 transition-colors ${isKtInbox ? 'max-md:hidden' : ''} ${
          'bg-surface border-rule text-ink'
        }`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">

            {/* Class switcher — this used to be hidden for directors
                entirely, which was fine while the Curriculum Preseed tab's
                own "Target Class" selector gave them a second way to switch.
                Now that curriculum uploading is teacher-only (§5), that was
                the director's ONLY way to change which class the dashboard
                (week nav, roster, overview stats) is showing — with it
                gone, a director with more than one class had no way to
                switch between them at all. */}
            <div className={`relative min-w-0 flex-1 sm:flex-none sm:max-w-xs ${showClassControls ? '' : 'hidden'}`}>
              {/* isDemo is a client-only placeholder so the rest of the page
                  can safely read selectedClass.joinCode etc before real
                  classes load — it should never appear as a switchable
                  option (audit: "Sample Class" sits in the dropdown next to
                  real classes, or is the only option shown while the real
                  fetch is still in flight, looking like classes are missing). */}
              {realClasses.length > 0 ? (
                <>
                  {/* appearance-none strips the native dropdown arrow with
                      nothing added in its place — a director/teacher
                      assigned multiple classes had no visual sign this was
                      a selector at all, not just a label showing the
                      current class (audit: "no option to switch classes",
                      when the switcher already existed and worked). */}
                  <select
                    aria-label={isKo ? '반 선택' : 'Choose class'}
                    value={selectedClass?.id || ''}
                    onChange={(e) => {
                      const found = realClasses.find(c => c.id === e.target.value);
                      if (found) setSelectedClass(found);
                    }}
                    className={`w-full min-h-11 truncate font-bold text-sm px-4 py-2.5 rounded-lg border outline-none cursor-pointer pr-9 appearance-none transition-colors ${
                      'bg-surface border-rule text-ink hover:border-rule focus:border-line'
                    }`}
                  >
                    {realClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} ({cls.level})
                      </option>
                    ))}
                  </select>
                  <CaretDown
                    size={14}
                    weight="bold"
                    className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-3`}
                 />
                </>
              ) : isLoadingClasses ? (
                <div className="text-ink-3 text-sm font-semibold p-2 animate-pulse">
                  {isKo ? '학급 불러오는 중…' : 'Loading classes…'}
                </div>
              ) : (
                <div className="text-ink-3 text-sm font-semibold p-2">
                  {isKo ? '학급을 먼저 등록해 주세요.' : 'Create a class to get started.'}
                </div>
              )}
            </div>

            {/* New/Delete class live in the Classes tab (onNewClassClick /
                onDeleteClass) — the toolbar copies put a delete button on
                every director screen and wrapped the toolbar to 3 rows on
                phones. */}
          </div>

          {/* Right Controls: Active Week Counter + Language Switcher + Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* The active week is class-wide (every teacher and parent sees
                it), so only directors can change it. Teachers get a label. */}
            {showClassControls && selectedClass && !selectedClass.isDemo && !isDirectorUser && (
              <span className="hidden min-h-11 items-center whitespace-nowrap rounded-md px-3.5 text-[14px] font-extrabold text-ink ring-1 ring-inset ring-rule sm:inline-flex">
                {isKo ? `학기 ${selectedClass?.activeWeekNumber || 1}주차` : <><span className="hidden sm:inline">Term w</span><span className="sm:hidden">W</span>eek {selectedClass?.activeWeekNumber || 1}</>}
              </span>
            )}
            {showClassControls && selectedClass && !selectedClass.isDemo && isDirectorUser && (
              <div className="flex items-center gap-2">
                <div className="flex items-center overflow-hidden rounded-md ring-1 ring-inset ring-rule">
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(-1)}
                    disabled={(selectedClass?.activeWeekNumber || 1) <= 1}
                    className="hidden h-11 w-11 cursor-pointer items-center justify-center text-ink-2 hover:bg-sunken hover:text-ink disabled:cursor-not-allowed disabled:opacity-30 sm:flex"
                    title={isKo ? '이전 주차' : 'Previous week'}
                    aria-label={isKo ? '이전 주차' : 'Previous week'}
                  >
                    <Minus size={16} weight="bold" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeekCalendarModal(true)}
                    className="min-h-11 min-w-[4.5rem] cursor-pointer whitespace-nowrap px-3 text-center text-[14px] font-extrabold text-ink hover:bg-sunken"
                    title={isKo ? '클릭하여 학기 주차별 커리큘럼 업로드 캘린더 열기' : 'Click to view semester calendar'}
                  >
                    {/* Phones drop the −/+ buttons; this opens the calendar to change week. */}
                    {isKo ? `학기 ${selectedClass?.activeWeekNumber || 1}주차` : <><span className="hidden sm:inline">Term w</span><span className="sm:hidden">W</span>eek {selectedClass?.activeWeekNumber || 1}</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(1)}
                    className="hidden h-11 w-11 cursor-pointer items-center justify-center text-ink-2 hover:bg-sunken hover:text-ink sm:flex"
                    title={isKo ? '다음 주차' : 'Next week'}
                    aria-label={isKo ? '다음 주차' : 'Next week'}
                  >
                    <Plus size={16} weight="bold" />
                  </button>
                </div>
              </div>
            )}



            {/* Notification Bell (director only — teacher invite accepted,
                student join requests, plan/payment upgrades) */}
            {isDirectorUser && (
              <NotificationBell
                isNight={isThemeNight}
                isKo={isKo}
                notifications={notifications}
                unreadCount={unreadCount}
                onMarkRead={markRead}
                onMarkAllRead={markAllRead}
             />
            )}

            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className="btn-press hidden min-h-11 cursor-pointer items-center rounded-md px-3.5 text-[14px] font-bold text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3 sm:flex"
              title="Switch Language / 언어 변경"
              aria-label={language === 'ko' ? 'Switch to English' : '한국어로 전환'}
            >
              <span className="whitespace-nowrap">{language === 'ko' ? 'EN' : '한국어'}</span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={() => setIsThemeNight(!isThemeNight)}
              aria-label={isThemeNight ? 'Switch to light mode' : 'Switch to dark mode'}
              className="btn-press hidden min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-md text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3 sm:flex"
              title={isThemeNight ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isThemeNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
          </div>
        </header>

        {/* Tab Content Rendering Container */}
        <section className={`p-3 sm:p-6 md:p-8 flex-1 relative z-10 pb-24 md:pb-8`}>
          {/* Someone opened a teacher/director invite link while already
              signed into a different account in this browser — invites are
              only redeemed by the unauthenticated signup form (see
              `if (!isAuthenticated)` above), so this landed on the existing
              session's own dashboard with the invite silently ignored
              (Audit: invite link "just takes you back to the director
              dashboard" — same-browser session, not a broken role lock).
              This banner used to key off inviteSlug alone with no actual
              mismatch check, so it also flashed for the account that had
              JUST correctly redeemed this very invite (the `?invite=` param
              is now stripped right after signup, but this check is a
              backstop for any link that stuck around from before that
              fix). */}
          {inviteSlug && showInviteSessionNotice && !(user?.uid && localStorage.getItem(`chekki_invite_school_${user.uid}`) === inviteSlug) && (
            <div className={`p-4 rounded-lg border mb-6 flex flex-wrap items-center justify-between gap-3 transition-[color,background-color,border-color,box-shadow,transform] ${
              'bg-line-soft border-rule text-line-ink'
            }`}>
              <p className="text-xs font-semibold flex-1 min-w-[240px]">
                {isKo
                  ? `이 초대 링크는 새 계정 생성용입니다. 현재 ${user?.email || ''} 계정으로 로그인되어 있어 초대가 적용되지 않았습니다. 초대를 수락하려면 먼저 로그아웃하세요.`
                  : `This invite link is for creating a new account. You're signed in as ${user?.email || 'another user'} in this browser, so the invite wasn't applied. Log out first to accept it.`}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => logout()}
                  className="px-3 py-1.5 bg-line hover:bg-line text-on-line text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer"
                >
                  {isKo ? '로그아웃' : 'Log out'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteSessionNotice(false)}
                  className="px-3 py-1.5 bg-sunken hover:bg-sunken text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] cursor-pointer"
                >
                  {isKo ? '닫기' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}
          {classes.length === 0 && (loginRole === 'director' || user?.role === 'director') && (
            <div className={`p-5 rounded-lg border mb-6 flex flex-wrap items-center justify-between gap-4 transition-[color,background-color,border-color,box-shadow,transform] ${
              'bg-line-soft border-rule text-line-ink'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-lg bg-line text-on-line flex items-center justify-center font-bold text-base shrink-0">
                  
                </div>
                <div>
                  <h4 className="text-sm font-extrabold tracking-tight">
                    {isKo ? '대시보드 미리보기 모드' : 'Dashboard Preview Mode'}
                  </h4>
                  <p className={`text-xs mt-0.5 text-line-ink`}>
                    {isKo
                      ? '등록된 학급이 없어도 대시보드, 커리큘럼 관리, 원생 활동 화면을 둘러보실 수 있습니다.'
                      : 'You can explore the dashboard, curriculum manager, and student views before creating a class.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(true)}
                  className="px-5 py-2 bg-line hover:bg-line text-on-line text-xs font-bold rounded-md transition-[color,background-color,border-color,box-shadow,transform] active:scale-[0.97] shrink-0 cursor-pointer"
                >
                  + {isKo ? '새 학급반 만들기' : 'Create Class Now'}
                </button>
              </div>
            </div>
          )}
          {classes.length === 0 && (!selectedClass || selectedClass.isDemo) && !(loginRole === 'director' || user?.role === 'director') && (
            <div className={`p-5 rounded-lg border mb-6 flex items-center gap-3.5 transition-[color,background-color,border-color,box-shadow,transform] ${
              'bg-line-soft border-rule text-line-ink'
            }`}>
              <div className="w-10 h-10 rounded-lg bg-line text-on-line flex items-center justify-center font-bold text-base shrink-0">
                
              </div>
              <div>
                <h4 className="text-sm font-extrabold tracking-tight">
                  {isKo ? '학급 배정 대기 중' : 'Waiting on a class assignment'}
                </h4>
                <p className={`text-xs mt-0.5 text-line-ink`}>
                  {isKo
                    ? '학교에 가입되었지만 아직 학급이 배정되지 않았습니다. 원장님께 대시보드에서 배정을 요청해 주세요 (Teacher Assignments).'
                    : "You've joined the school but haven't been assigned to a class yet — ask your director to assign you one from their dashboard (Teacher Assignments)."}
                </p>
              </div>
            </div>
          )}

          <div className="animate-fade-in">
            {/* Sync Warning Banner — shown when a Firestore write failed silently (Fix 8) */}
            {syncWarning && (
              <div className={`mb-4 p-3.5 rounded-lg border flex items-center justify-between gap-3 ${
                'bg-line-soft border-rule'
              }`}>
                <p className="text-xs font-bold text-line-ink flex-1">{syncWarning}</p>
                <button
                  type="button"
                  onClick={() => setSyncWarning(null)}
                  className="text-line-ink hover:text-line-ink text-xs font-bold cursor-pointer shrink-0"
                >
                  
                </button>
              </div>
            )}

            {/* Per-role tab content — DirectorTabContent/KtTabContent/
                FtTabContent (Phase 6 of the buzzing-nibbling-hearth
                TeacherPage split). */}
            {isDirectorUser ? (
              <DirectorTabContent
                isNight={isThemeNight}
                isKo={isKo}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                academyName={displayedAcademyName}
                academyLogo={academyLogo}
                schoolId={user?.schoolId || undefined}
                planId={schoolPlanId}
                seatsTotal={schoolSeatsTotal}
                trialStatus={trialStatus}
                onRequestSeatExpansion={handleRequestSeatExpansion}
                onRequestPlanChange={handleRequestPlanChange}
                pendingRoster={pendingRoster}
                activeRoster={activeRoster}
                classes={classes}
                onClassesChanged={() => fetchClasses()}
                selectedClass={selectedClass}
                weeklyVocabWords={getWeeklyVocabWords()}
                weeklyPhonicsRules={getWeeklyPhonicsRules()}
                curriculumTopic={curriculumTopic}
                curriculumPassage={curriculumPassage}
                onResolveFlag={(uid: string) => handleToggleFlagStudent(uid)}
                isLoadingRoster={isLoadingRoster}
                handleApproveStudent={handleApproveStudent}
                handleDeclineStudent={handleDeclineStudent}
                handleRemoveStudent={handleRemoveStudent}
                handleMoveStudent={handleMoveStudent}
                fetchRosterAndMistakes={fetchRosterAndMistakes}
                setSelectedStudentDetails={setSelectedStudentDetails}
                onNewClassClick={() => setShowCreateClassModal(true)}
                onDeleteClass={(classId: string) => handleDeleteClass(classId)}
                onSelectClass={(classId: string) => {
                  const found = realClasses.find((c: any) => c.id === classId);
                  if (found) setSelectedClass(found);
                }}
             />
            ) : educatorRole === 'kt' ? (
              <KtTabContent
                isNight={isThemeNight}
                isKo={isKo}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                ktLogsLoadError={ktLogsLoadError}
                ktPendingLogs={ktPendingLogs}
                confirmDiscardKtDraft={confirmDiscardKtDraft}
                setKtDraftDirty={setKtDraftDirty}
                approveClassLog={approveClassLog}
                discardClassLog={discardClassLog}
                activeClass={activeClass}
                academyName={displayedAcademyName}
                user={user}
                handleLogSubmit={handleLogSubmit}
                selectedTextbookName={selectedTextbookName}
                ftDashboardRoster={ftDashboardRoster}
                sortedTroubleWords={sortedTroubleWords}
                uploadMode={uploadMode}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                curriculumEditor={curriculumEditor}
                pendingRoster={pendingRoster}
                activeRoster={activeRoster}
                invitedOnlyRosterRows={invitedOnlyRosterRows}
                isLoadingRoster={isLoadingRoster}
                handleApproveStudent={handleApproveStudent}
                handleDeclineStudent={handleDeclineStudent}
                fetchRosterAndMistakes={fetchRosterAndMistakes}
                setSelectedStudentDetails={setSelectedStudentDetails}
             />
            ) : (
              <FtTabContent
                isNight={isThemeNight}
                isKo={isKo}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                user={user}
                activeClass={activeClass}
                selectedTextbookName={selectedTextbookName}
                ftDashboardRoster={ftDashboardRoster}
                handleLogSubmit={handleLogSubmit}
                activeVocabWords={activeVocabWords}
                sortedTroubleWords={sortedTroubleWords}
                curriculumTopic={curriculumTopic}
                submittedLogs={submittedLogs}
                uploadMode={uploadMode}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                curriculumEditor={curriculumEditor}
             />
            )}

            </div>
        </section>
      </main>

      {/* --- STUDENT MISTAKE DETAILS SLIDE-OVER DRAWER --- */}
      {selectedStudentDetails && (
        <StudentDetailsDrawer
          student={selectedStudentDetails}
          isKo={isKo}
          onClose={() => setSelectedStudentDetails(null)}
          handleToggleFlagStudent={handleToggleFlagStudent}
          onPrintReport={() => setShowReportCardModal(true)}
        />
      )}

      {/* --- CLASS CREATION MODAL --- */}
      {showCreateClassModal && (
        <CreateClassModal
          isKo={isKo}
          setShowCreateClassModal={setShowCreateClassModal}
          handleCreateClass={handleCreateClass}
          newClassName={newClassName}
          setNewClassName={setNewClassName}
          newClassLevel={newClassLevel}
          setNewClassLevel={setNewClassLevel}
          isCreatingClass={isCreatingClass}
        />
      )}
      {/* --- TEACHER SETTINGS MODAL --- */}
      {showSettingsModal && (
        <TeacherSettingsModal
          isKo={isKo}
          user={user}
          loginRole={loginRole}
          educatorRole={educatorRole}
          setShowSettingsModal={setShowSettingsModal}
          setTeacherObStep={setTeacherObStep}
          setShowTeacherOnboarding={setShowTeacherOnboarding}
          setShowFeedbackModal={setShowFeedbackModal}
          handleDeleteTeacherAccount={handleDeleteTeacherAccount}
          isDeletingAccount={isDeletingAccount}
          logout={logout}
        />
      )}

      {showFeedbackModal && (
        <FeedbackModal isNight={isThemeNight} onClose={() => setShowFeedbackModal(false)} />
      )}

      {/* --- WEEKLY CALENDAR & UPLOAD HISTORY MODAL --- */}
      {showWeekCalendarModal && (
        <WeekCalendarModal
          isThemeNight={isThemeNight}
          isKo={isKo}
          selectedClass={selectedClass}
          curriculumTopic={curriculumTopic}
          curriculumVocab={curriculumVocab}
          curriculumPhonics={curriculumPhonics}
          onSelectWeek={handleSelectWeek}
          onClose={() => setShowWeekCalendarModal(false)}
       />
      )}

      {/* --- ACADEMY BRANDED STUDENT GROWTH REPORT CARD MODAL --- */}
      {showReportCardModal && (
        <ReportCardModal
          isKo={isKo}
          activeRoster={activeRoster}
          selectedStudentDetails={selectedStudentDetails}
          setSelectedStudentDetails={setSelectedStudentDetails}
          selectedClass={selectedClass}
          academyLogo={academyLogo}
          schoolName={user?.schoolName}
          onClose={() => setShowReportCardModal(false)}
       />
      )}

      {/* --- SCANNED AI WORKSHEET & PICK-AND-CHOOSE MODAL --- */}
      {showScannedModal && (
        <ScannedModal
          isThemeNight={isThemeNight}
          isKo={isKo}
          activeScannedModalType={activeScannedModalType}
          scannedData={scannedData}
          setScannedData={setScannedData}
          selectedPageIndex={selectedPageIndex}
          setSelectedPageIndex={setSelectedPageIndex}
          selectedScannedTopic={selectedScannedTopic}
          setSelectedScannedTopic={setSelectedScannedTopic}
          selectedScannedVocab={selectedScannedVocab}
          setSelectedScannedVocab={setSelectedScannedVocab}
          textbookPreviewUrl={textbookPreviewUrl}
          docPreviewUrl={docPreviewUrl}
          syllabusPreviewUrl={syllabusPreviewUrl}
          worksheetPreviewUrl={worksheetPreviewUrl}
          onClose={() => setShowScannedModal(false)}
          onViewScannedDocument={() => setShowDocPreviewModal(true)}
          onApplyToCurriculum={applyScannedSelectionToCurriculum}
       />
      )}

      {/* --- SCANNED DOCUMENT IMAGE / PDF PREVIEW MODAL --- */}
      {showDocPreviewModal && (
        <DocPreviewModal
          isThemeNight={isThemeNight}
          isKo={isKo}
          uploadedFileName={uploadedFileName}
          textbookPreviewUrl={textbookPreviewUrl}
          onClose={() => setShowDocPreviewModal(false)}
       />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          variant={confirmDialog.variant}
          isNight={isThemeNight}
          onConfirm={confirmDialog.onConfirm}
          onCancel={() => setConfirmDialog(null)}
       />
      )}
    </div>
  );
}
