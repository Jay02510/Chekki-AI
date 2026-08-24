import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Sentry from '@sentry/react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { dbInstance, auth } from '../../services/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, deleteDoc, addDoc, orderBy, limit as fbLimit, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
import { seatsForPlan, labelsForPlan } from '../../api/_lib/pricingTiers';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { useResolvedRole } from '../../hooks/useResolvedRole';
import { useKtReviewQueue } from '../../hooks/useKtReviewQueue';
import { useTeacherTabs } from '../../hooks/useTeacherTabs';
import { useRosterAnalytics } from '../../hooks/useRosterAnalytics';
import { DirectorSidebarNav } from '../components/DirectorSidebarNav';
import { KtSidebarNav } from '../components/KtSidebarNav';
import { FtSidebarNav } from '../components/FtSidebarNav';
import { DirectorTabContent } from '../components/DirectorTabContent';
import { KtTabContent } from '../components/KtTabContent';
import { FtTabContent } from '../components/FtTabContent';
import { useDirectorPortalState } from '../../hooks/useDirectorPortalState';
import { useCurriculumEditorState } from '../../hooks/useCurriculumEditorState';
import { 
  GraduationCap,
  Sparkle,
  ArrowRight,
  ArrowLeft,
  Eye,
  CheckCircle,
  Plus,
  Calendar,
  Printer,
  SignOut,
  ChalkboardTeacher,
  Warning,
  Check,
  Funnel,
  ShieldCheck,
  X,
  List,
  Gear,
  UploadSimple,
  Image,
  File,
  Sun,
  Moon,
  Trash,
  Buildings
} from '@phosphor-icons/react';
import { FeedbackModal } from '../../components/FeedbackModal';
import { ScannedModal } from '../components/ScannedModal';
import { DocPreviewModal } from '../components/DocPreviewModal';
import { WeekCalendarModal } from '../components/WeekCalendarModal';
import { ReportCardModal } from '../components/ReportCardModal';
import { UnifiedAccountActivation } from '../components/UnifiedAccountActivation';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import {
  generateGeneralClassSummary,
  generateStudentExceptionReport,
  ClassLogPayload,
} from '../services/aiGenerator';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, signUp, logout, deleteAccount, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const isKo = language === 'ko';
  const [isThemeNight, setIsThemeNight] = useState(isNight);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    onConfirm: () => void;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
  } | null>(null);
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

  // FT/KT first-login welcome modal state
  const [showTeacherWelcome, setShowTeacherWelcome] = useState(false);
  const [teacherWelcomeStep, setTeacherWelcomeStep] = useState<1 | 2>(1);
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeRole, setWelcomeRole] = useState<'ft' | 'kt'>('ft');
  const [welcomeSchool, setWelcomeSchool] = useState(() => {
    if (typeof window === 'undefined') return '';
    // The real school name returned by /api/redeem-invite on signup — this
    // used to title-case the raw invite ID slug itself (e.g. "inv_mssre11q")
    // as a fallback "school name", which is what actually rendered here
    // (Audit: invite welcome modal shows garbage, not the real school name).
    return localStorage.getItem('chekki_invite_school_name') || '';
  });
  const [welcomeInviterName, setWelcomeInviterName] = useState(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem('chekki_invite_by') || '';
  });

  // Auth state - Defaults to 'signup' if coming from setup CTA or invite link
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('activate') === 'true' || params.get('invite') || params.get('signup') === 'true') {
        return 'signup';
      }
    }
    return 'login';
  });
  const [name, setName] = useState('');
  const [academyNameInput, setAcademyNameInput] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Log-submit in-flight flag — shared by FT and KT, both submit through the
  // same handleLogSubmit handler (KT via the kt_log tab's NativeTeacherLogForm).
  const [isSubmittingLog, setIsSubmittingLog] = useState(false);

  const handleLogSubmit = async (payload: ClassLogPayload) => {
    setIsSubmittingLog(true);
    try {
      const summary = await generateGeneralClassSummary({ ...payload, authorRole: educatorRole });
      const studentReports = await Promise.all(
        payload.exceptions.map(async (ex) => {
          const updateText = await generateStudentExceptionReport(
            ex.studentName,
            payload.lessonTopic,
            payload.textbook,
            ex.details
          );
          // No per-exception phoneTalkingPoints call here anymore — the old
          // same-day phone-consult drawer that displayed it was removed in
          // favor of ReportCardModal's weekly consolidated talking points
          // (strictly more context, same purpose), so generating this per
          // submission was a wasted AI call with nothing left to read it.
          return {
            studentName: ex.studentName,
            studentUid: ex.studentUid ?? null,
            koreanUpdate: updateText,
            phoneTalkingPoints: [],
            category: ex.type,
          };
        })
      );
      // Stay on the FT's own dashboard after submit — the kt_script tab
      // is the KT's review workspace, not an FT-facing "success" screen.
      // FT gets a toast confirmation below instead of being bounced there.

      // Persist the log AND the AI-generated KT script so the handoff
      // survives across accounts/devices — it used to live only in
      // `ftLogOutput` React state, which meant a KT logging in separately
      // never saw it (Audit: FT->KT handoff). Visible in the FT history
      // tab, the KT review queue, and — once reviewed and sent — to
      // parents of enrolled students. Best-effort — an AI report was
      // already generated and shown, so a Firestore hiccup here shouldn't
      // block the teacher.
      if (selectedClass?.id && !selectedClass.isDemo && user?.uid) {
        try {
          const logsRef = collection(dbInstance, 'classes', selectedClass.id, 'logs');
          const docRef = await addDoc(logsRef, {
            ...payload,
            classId: selectedClass.id,
            teacherUid: user.uid,
            createdAt: serverTimestamp(),
            aiKoreanSummary: summary.korean,
            aiEnglishSummary: summary.english,
            aiStudentReports: studentReports,
            reviewStatus: 'pending_review',
          });
          const newLog = { id: docRef.id, ...payload };
          setSubmittedLogs((prev) => [newLog, ...prev]);
          setKtPendingLogs((prev) => [...prev, {
            id: docRef.id,
            classId: selectedClass.id,
            aiKoreanSummary: summary.korean,
            aiEnglishSummary: summary.english,
            aiStudentReports: studentReports,
          }]);
          showToast({
            type: 'success',
            message: educatorRole === 'kt'
              ? (isKo ? '✅ 일지가 저장되었습니다. 알림톡 대본 탭에서 검토 후 발송하세요.' : '✅ Log saved — review and send it from the Parent Script tab.')
              : (isKo ? '✅ 한국인 교사에게 검토 요청을 보냈습니다!' : '✅ Sent to your KT for review!'),
          });

          // No per-submission email to the KT here — a daily digest cron
          // (api/create-teacher-invite.ts action=send_pending_digests)
          // batches every pending_review log into one summary email instead
          // of firing one email per FT submission (20 kids => 20 emails).
          // This log is already visible in the KT's review queue above.
        } catch (persistErr) {
          console.error('Failed to save class log to Firestore:', persistErr);
          // Previously silent: the UI still switched to the "success" kt_script
          // tab even when this write failed, so the log never reached a KT on
          // another device with no indication anything went wrong (Audit:
          // silent FT->KT persist failure).
          showToast({
            type: 'error',
            message: isKo
              ? '⚠️ 일지가 클라우드에 저장되지 않았습니다. 다른 기기의 한국인 교사에게 전달되지 않을 수 있습니다.'
              : "⚠️ This log wasn't saved to the cloud — it may not reach your co-teacher on another device.",
          });
        }
      } else {
        // No real class yet (demo/placeholder class, or classes still
        // loading) — the AI preview above is real, but there's nothing to
        // send to a KT. Without this the button looked broken: the form
        // just sat there with no toast and no visible change.
        showToast({
          type: 'error',
          message: isKo
            ? '아직 등록된 학급이 없어 저장되지 않았습니다. 원장님께 학급 등록을 요청하세요.'
            : "This is a preview only — you're not assigned to a real class yet, so nothing was sent. Ask your director to add you to a class.",
        });
      }
    } catch (err) {
      console.error('Failed to generate AI report from FT log:', err);
      showToast({
        type: 'error',
        message: isKo
          ? '일지 생성에 실패했습니다. 다시 제출해주세요.'
          : "Couldn't generate the report from your log. Please try submitting again.",
      });
    } finally {
      setIsSubmittingLog(false);
    }
  };


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

  // Direct teacher self-signup is disabled (see the Auth Mode Toggle render
  // guard further down) — teacher accounts only exist via a director's
  // invite link now. Without this, a bare /teacher?signup=true visit could
  // still land in 'signup' mode for a teacher with the toggle hidden and no
  // way back to Log In.
  useEffect(() => {
    if (loginRole === 'teacher' && !inviteSlug && authMode === 'signup') {
      setAuthMode('login');
    }
  }, [loginRole, inviteSlug, authMode]);
  // Educator role is sourced from Firestore profile field (educatorRole) ONLY.
  // Email-substring matching ('kt' in email) is intentionally removed — it was
  // silently misclassifying FT teachers whose email happened to contain 'kt'
  // (e.g. kate@, dakota@, nikto@) and hiding their homework tab. (Audit §7)
  const firestoreEducatorRole = user?.educatorRole as 'ft' | 'kt' | undefined;
  const [educatorRole, setEducatorRole] = useState<'ft' | 'kt'>(
    firestoreEducatorRole === 'kt' ? 'kt' : 'ft'
  );
  const isDirectorUser = isDirectorPath || user?.role === 'director';
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
          body: JSON.stringify({ role: pendingRole }),
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
    curriculumAnswerKey, curriculumSlideIndex, setCurriculumSlideIndex,
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
  const [studentsData, setStudentsData] = useState<any[]>([]);

  // Roster uid -> display name, for consolidation: a log doc only carries a
  // name for students it flagged that day (aiStudentReports); an enrolled-
  // but-not-flagged student has no name anywhere in the log itself, only
  // their uid in enrolledStudentUids, so this resolves it from the roster
  // instead of falling back to the raw uid string.
  const studentNamesByUid = useMemo(
    () => Object.fromEntries((studentsData || []).filter((s: any) => s?.uid && s?.name).map((s: any) => [s.uid, s.name])),
    [studentsData]
  );
  const {
    ktPendingLogs, setKtPendingLogs,
    activeKtLogId, setActiveKtLogId,
    ktDraftDirty, setKtDraftDirty,
    justCopiedLogId,
    ktLogsLoadError, setKtLogsLoadError,
    confirmDiscardKtDraft,
    ktConsolidatedGroups,
    activeKtGroup,
    ktQueueLogs,
    groupKey,
    handleKtApprove,
    formatConsolidatedDraft,
  } = useKtReviewQueue(educatorRole, classes, selectedClass, user, showToast, isKo, studentNamesByUid);

  // Tab state (Phase 5 of the buzzing-nibbling-hearth TeacherPage split) —
  // declared here rather than up with the rest of the per-role state because
  // it needs confirmDiscardKtDraft/setKtDraftDirty from useKtReviewQueue above.
  const { activeTab, setActiveTab } = useTeacherTabs(isDirectorUser, educatorRole, confirmDiscardKtDraft, setKtDraftDirty);

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
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [showFlagReasonInput, setShowFlagReasonInput] = useState(false);

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
  const [resetPwStatus, setResetPwStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const handleSendResetPassword = async () => {
    if (!user?.email) return;
    setIsSendingReset(true);
    setResetPwStatus(null);
    try {
      await sendPasswordResetEmail(auth, user.email);
      setResetPwStatus({
        text: isKo
          ? `비밀번호 재설정 링크가 ${user.email}로 발송되었습니다.`
          : `Password reset email sent to ${user.email}.`,
      });
    } catch (err: any) {
      setResetPwStatus({
        text: err.message || (isKo ? '비밀번호 재설정 이메일 발송 실패' : 'Failed to send password reset email'),
        isError: true,
      });
    } finally {
      setIsSendingReset(false);
    }
  };

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
      if (educatorRole !== 'kt') {
        setKtPendingLogs([]);
        setActiveKtLogId(null);
      }
      setKtLogsLoadError(false);
      return;
    }
    setKtLogsLoadError(false);
    if (educatorRole !== 'kt') setActiveKtLogId(null);
    (async () => {
      try {
        const logsRef = collection(dbInstance, 'classes', selectedClass.id, 'logs');
        const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), fbLimit(50));
        const snap = await getDocs(logsQuery);
        const allLogs = snap.docs.map((d) => ({ id: d.id, classId: selectedClass.id, ...d.data() } as any));
        setSubmittedLogs(allLogs);
        if (educatorRole !== 'kt') {
          setKtPendingLogs(
            allLogs
              .filter((l) => l.reviewStatus === 'pending_review')
              .reverse() // oldest pending first
          );
        }
      } catch (err) {
        console.error('Failed to load class log history:', err);
        setKtLogsLoadError(true);
      }
    })();
  }, [selectedClass?.id, educatorRole]);

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
        // Pre-fill name from user profile
        setWelcomeName(user.name || user.email?.split('@')[0] || '');
        // Detect FT/KT from a previously stored explicit selection, falling
        // back to the resolved Firestore role — never from an email
        // substring (the last instance of that pattern, audit §20e). The
        // localStorage-only version left this screen stuck on the FT
        // default for any KT account that never went through invite
        // redemption on this device (e.g. seeded directly in Firestore).
        const storedEducatorRole = localStorage.getItem(`chekki_educator_role_${uid}`) ||
          localStorage.getItem(`chekki_educator_role_${user.email}`);
        setWelcomeRole(storedEducatorRole === 'kt' || user.educatorRole === 'kt' ? 'kt' : 'ft');
        setShowTeacherWelcome(true);
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
  const studentDrawerDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: !!selectedStudentDetails,
    onClose: () => setSelectedStudentDetails(null),
  });
  const createClassDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showCreateClassModal,
    onClose: () => setShowCreateClassModal(false),
  });
  const settingsDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showSettingsModal,
    onClose: () => setShowSettingsModal(false),
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

  const fetchClasses = async (isRetry = false) => {
    const uid = user?.uid || 'guest';
    setIsLoadingClasses(true);
    const fetchedFromFirestore: any[] = [];
    try {
      if (user?.uid) {
        // Two queries merged by id: `teacherUid` (original single-owner
        // field, still set on every class) and `assignedTeacherUids`
        // (director-assigned co-teachers). Classes created before
        // assignedTeacherUids existed only match the first query — merging
        // keeps them showing up exactly as before.
        const ownedQuery = query(collection(dbInstance, 'classes'), where('teacherUid', '==', user.uid));
        const assignedQuery = query(collection(dbInstance, 'classes'), where('assignedTeacherUids', 'array-contains', user.uid));
        const [ownedSnap, assignedSnap] = await Promise.all([getDocs(ownedQuery), getDocs(assignedQuery)]);
        const seen = new Set<string>();
        [...ownedSnap.docs, ...assignedSnap.docs].forEach((doc) => {
          if (seen.has(doc.id)) return;
          seen.add(doc.id);
          fetchedFromFirestore.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (err: any) {
      // Same transient-permission-denied-right-after-signup pattern
      // StudentInvitePanel already retries once for (firestore.rules
      // re-reads the caller's own user doc on every query; that read can
      // momentarily deny before a brand-new session settles) — this fetch
      // had no retry at all, so a fresh signup could get stuck showing
      // "couldn't load classes" and a stale local cache forever, with no
      // self-heal (Audit: director class list empty, contradicting a
      // synced-looking selected class from local cache).
      if (err?.code === 'permission-denied' && !isRetry) {
        setTimeout(() => fetchClasses(true), 1500);
        return;
      }
      console.warn('Firestore fetch warning (falling back to local storage):', err);
      // This catch previously only console.warn'd — a caught error never
      // reaches Sentry automatically, so a real class-fetch failure here
      // (as opposed to the already-handled transient permission-denied
      // right after signup) left zero record of what actually went wrong,
      // no error code, nothing to diagnose from later.
      Sentry.captureException(err, {
        tags: { area: 'fetchClasses' },
        extra: { uid, role: user?.role, educatorRole, schoolId: user?.schoolId, isRetry },
      });
      setSyncWarning(
        isKo
          ? '⚠️ 클라우드에서 학급 목록을 불러오지 못해 이 기기에 저장된 정보를 표시하고 있습니다. 최신 정보가 아닐 수 있습니다.'
          : "⚠️ Couldn't load classes from the cloud — showing what's saved on this device, which may be out of date."
      );
    } finally {
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
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsSigningIn(true);
    try {
      if (authMode === 'signup') {
        if (!name.trim()) {
          throw new Error(isKo ? '선생님 이름을 입력해 주세요.' : 'Please enter your name.');
        }
        if (password.length < 6) {
          throw new Error(isKo ? '비밀번호는 최소 6자 이상이어야 합니다.' : 'Password must be at least 6 characters.');
        }
        if (password !== confirmPassword) {
          throw new Error(isKo ? '비밀번호가 일치하지 않습니다.' : 'Passwords do not match.');
        }

        await signUp(name, email, password);

        const newUid = auth.currentUser?.uid || '';

        if (inviteSlug) {
          // Arrived via a role-locked director invite (audit §21d) — role and
          // educatorRole are decided by the invite document, not the signup
          // form's Teacher/Director toggle. Redeeming is server-side via the
          // Admin SDK, same reasoning as set-initial-role below.
          try {
            const idToken = await auth.currentUser?.getIdToken();
            const response = await fetch('/api/redeem-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
              body: JSON.stringify({ inviteId: inviteSlug }),
            });
            const data = await response.json();
            if (!response.ok) {
              throw new Error(data.error || 'Failed to redeem invite');
            }
            if (newUid) {
              localStorage.setItem(`chekki_user_role_${newUid}`, 'teacher');
              localStorage.setItem(`chekki_educator_role_${newUid}`, data.educatorRole);
              if (data.schoolName) localStorage.setItem(`chekki_invite_school_name_${newUid}`, data.schoolName);
              if (data.invitedByName) localStorage.setItem(`chekki_invite_by_${newUid}`, data.invitedByName);
            }
            // Un-uid-keyed mirrors — read by the welcome-screen initializer,
            // which runs on the reload right below before Firebase auth has
            // necessarily restored `newUid` synchronously.
            if (data.schoolName) localStorage.setItem('chekki_invite_school_name', data.schoolName);
            if (data.invitedByName) localStorage.setItem('chekki_invite_by', data.invitedByName);
          } catch (inviteErr: any) {
            throw new Error(
              isKo
                ? `초대 링크를 사용할 수 없습니다: ${inviteErr.message}`
                : `This invite link couldn't be used: ${inviteErr.message}`
            );
          }
        } else {
          // Assign the role server-side — firestore.rules blocks clients from
          // writing their own `role` field, so a direct client updateDoc() call
          // silently fails (audit §20b). /api/set-initial-role uses the Admin
          // SDK and only allows a one-time assignment on a fresh account.
          const assignedRole = loginRole === 'director' ? 'director' : 'teacher';
          if (newUid) {
            try {
              const idToken = await auth.currentUser?.getIdToken();
              const planId = typeof window !== 'undefined' ? sessionStorage.getItem('chekki_selected_plan') || undefined : undefined;
              const response = await fetch('/api/set-initial-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
                body: JSON.stringify({
                  role: assignedRole,
                  planId,
                  // The signup form never sent this, so every new director's
                  // school silently fell back to the server's "New Academy"
                  // placeholder with no way to rename it afterward (Audit:
                  // dashboard shows "New Academy", no academy-name step).
                  academyName: assignedRole === 'director' ? academyNameInput.trim() || undefined : undefined,
                }),
              });
              if (!response.ok) {
                console.warn('Server-side role assignment failed, using localStorage fallback:', await response.text());
                // Retried automatically by the pendingRoleSync effect below
                // on this device — the role otherwise only lives in
                // localStorage and silently vanishes on any other
                // device/browser.
                localStorage.setItem(`chekki_pending_role_sync_${newUid}`, assignedRole);
              }
            } catch (roleErr) {
              console.warn('Role write failed, using localStorage fallback:', roleErr);
              localStorage.setItem(`chekki_pending_role_sync_${newUid}`, assignedRole);
            }
            localStorage.setItem(`chekki_user_role_${newUid}`, assignedRole);
          }
        }

        // Persist invite school if teacher arrived via invite link
        if (inviteSlug) {
          const uid = auth.currentUser?.uid || '';
          if (uid) localStorage.setItem(`chekki_invite_school_${uid}`, inviteSlug);
          localStorage.setItem('chekki_invite_school', inviteSlug);

          // The `?invite=` param never got cleared after a successful
          // redemption, so it stuck around through the reload below and
          // every reload after that — the "you're signed in as a different
          // account, invite wasn't applied" banner is gated on nothing but
          // that param being present (see showInviteSessionNotice), so it
          // kept flashing on the account that had JUST correctly redeemed
          // the invite (audit: session-mismatch banner shows for the right
          // account too, not just a genuine mismatch).
          const url = new URL(window.location.href);
          url.searchParams.delete('invite');
          window.history.replaceState({}, '', url.toString());
        }

        window.location.reload();

      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = isKo ? '등록되지 않은 이메일입니다.' : 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = isKo ? '비밀번호가 올바르지 않습니다.' : 'Incorrect password.';
      // Newer Firebase Auth SDK versions collapse both wrong-password and
      // user-not-found into this single code — without this branch, the
      // raw "Firebase: Error (auth/invalid-credential)." SDK string leaked
      // straight to the login screen (Audit: unfriendly error on login).
      if (err.code === 'auth/invalid-credential') msg = isKo ? '이메일 또는 비밀번호가 올바르지 않습니다.' : 'Incorrect email or password.';
      if (err.code === 'auth/email-already-in-use') msg = isKo ? '이미 가입된 이메일입니다. 로그인해 주세요.' : 'Email already registered. Please log in.';
      setAuthError(msg || (authMode === 'signup' ? 'Sign up failed.' : 'Login failed. Please check your credentials.'));
    } finally {
      setIsSigningIn(false);
    }
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
            ? '⚠️ 학급 정보가 로컬에만 저장되었습니다. 인터넷 연결을 확인하고 페이지를 새로고침하여 클라우드에 동기화하세요.'
            : '⚠️ Class saved locally but not yet synced to cloud. Check your connection and refresh to re-sync.'
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
          await deleteDoc(doc(dbInstance, 'classes', targetId));
        } catch (fsErr) {
          console.warn('Firestore delete class warning:', fsErr);
          setSyncWarning(
            isKo
              ? '⚠️ 학급이 이 기기에서만 삭제되었습니다. 클라우드에서 삭제되지 않아 다른 기기나 학부모 화면에는 계속 표시될 수 있습니다.'
              : '⚠️ Class removed on this device only — the cloud delete failed, so it may still appear elsewhere until you retry with a connection.'
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
          ? '⚠️ 주차 변경이 이 기기에만 저장되었습니다. 다른 기기에는 반영되지 않을 수 있습니다.'
          : '⚠️ Week change saved on this device only — it may not appear on other devices until this syncs.'
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
          ? '⚠️ 주차 변경이 이 기기에만 저장되었습니다. 다른 기기에는 반영되지 않을 수 있습니다.'
          : '⚠️ Week change saved on this device only — it may not appear on other devices until this syncs.'
      );
    }
  };

  // Load curriculum whenever selected class or week changes
  useEffect(() => {
    loadCurriculum();
    fetchRosterAndMistakes();
  }, [selectedClass?.id, selectedClass?.activeWeekNumber]);

  const fetchRosterAndMistakes = async () => {
    const targetClass = selectedClass || fallbackDemoClass;
    if (!targetClass?.id) return;
    setIsLoadingRoster(true);
    try {
      // 1. Fetch dual-persisted class scans from LocalStorage
      const localClassKey = `class_scans_${targetClass.id}`;
      const localScans: any[] = JSON.parse(localStorage.getItem(localClassKey) || '[]');

      // 2. Fetch class scans + roster from Firestore — skip for the demo/
      // no-class placeholder, its docs are never created server-side so
      // this would only ever produce a permission-denied console error.
      const firestoreScans: any[] = [];
      let rosterDocs: any[] = [];
      if (!targetClass.isDemo) {
        try {
          const scansQ = query(
            collection(dbInstance, 'classes', targetClass.id, 'studentScans')
          );
          const scansSnap = await getDocs(scansQ);
          scansSnap.forEach(sDoc => firestoreScans.push({ id: sDoc.id, ...sDoc.data() }));
        } catch (sErr) {
          console.warn('Firestore class scans fetch warning (using local fallback):', sErr);
          setSyncWarning(
            isKo
              ? '⚠️ 클라우드에서 채점 기록을 불러오지 못해 이 기기에 저장된 정보만 표시하고 있습니다.'
              : "⚠️ Couldn't load scan history from the cloud — showing only what's saved on this device."
          );
        }

        const q = query(
          collection(dbInstance, 'users'),
          where('classId', '==', targetClass.id)
        );
        const snap = await getDocs(q);
        rosterDocs = snap.docs;
      }

      // Merge scans by ID
      const scansMap = new Map();
      firestoreScans.forEach(s => scansMap.set(s.id, s));
      localScans.forEach(s => { if (!scansMap.has(s.id)) scansMap.set(s.id, s); });
      const allClassScans = Array.from(scansMap.values());

      // 3. Build roster from fetched users
      const students: any[] = [];

      for (const userDoc of rosterDocs) {
        const student: any = { uid: userDoc.id, ...userDoc.data() };
        
        // Match scans for this student
        const studentScans = allClassScans.filter(s => s.studentUid === student.uid || s.studentName === student.name);
        
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

      // If no student roster users exist yet, map student scans directly so guest scans display
      if (students.length === 0 && allClassScans.length > 0) {
        const guestMap = new Map();
        allClassScans.forEach(s => {
          const sUid = s.studentUid || 'guest_student';
          if (!guestMap.has(sUid)) {
            guestMap.set(sUid, {
              uid: sUid,
              name: s.studentName || 'Home Student',
              classStatus: 'active',
              lastScanDate: s.scannedAt,
              scans: [s],
              mistakes: s.redBorderedMistakes || [],
            });
          } else {
            const existing = guestMap.get(sUid);
            existing.scans.push(s);
            existing.mistakes = [...existing.mistakes, ...(s.redBorderedMistakes || [])];
          }
        });
        setStudentsData(Array.from(guestMap.values()));
      } else {
        setStudentsData(students);
      }
    } catch (err) {
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
            date: new Date().toISOString().split('T')[0],
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
          ? { ...prev, flaggedException: reason && reason.trim() ? { date: new Date().toISOString().split('T')[0], reason: reason.trim(), teacherName: user?.name || user?.email?.split('@')[0] || 'Teacher', resolved: false } : null }
          : prev
      );
    } catch (err) {
      console.error('Failed to update flag status:', err);
      showToast({ type: 'error', message: isKo ? '플래그 상태 변경에 실패했습니다.' : 'Failed to update flag status.' });
    }
  };

  // Roster & weekly-completion analytics — extracted into a hook (Phase 3
  // of the buzzing-nibbling-hearth TeacherPage split, see the hook's own
  // comment for why it's not scoped "FT-only" despite the plan's name).
  const {
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
  } = useRosterAnalytics(studentsData, curriculumVocab, curriculumPhonics, selectedClass);

  // --- RENDER AUTH (LOGIN / SIGN UP) VIEW ---
  if (!isAuthenticated) {
    // A director arriving fresh off picking a plan on /schools (?plan=... in
    // the URL, carried into activationPlanId above) gets a dedicated signup
    // screen instead of the shared Login/SignUp toggle — see caveman review:
    // "no Login vs Sign Up choice for someone who just picked a plan."
    const isPlanSignup = !!(activationPlanId && isActivateParam && loginRole === 'director' && authMode === 'signup' && !inviteSlug);
    const planSeats = seatsForPlan(activationPlanId);
    const planLabel = labelsForPlan(activationPlanId);
    return (
      <div className="fixed inset-0 z-[500] overflow-y-auto bg-brand-dark text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-brand-dark rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-full flex justify-between items-center mb-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>{isKo ? '메인 서비스로 돌아가기' : 'Return to Main Service'}</span>
              </button>
              {/* The only language switcher lived in the post-auth header
                  (below), leaving every pre-auth screen — login, signup,
                  and specifically an invited FT/KT arriving straight at an
                  invite link with no prior page to set language on — stuck
                  in whatever language the app happened to load in, with no
                  way to change it before creating their account. */}
              <button
                type="button"
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="inline-flex items-center gap-1 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Switch Language / 언어 변경"
              >
                <span>🌐</span>
                <span>{language === 'ko' ? '한국어' : 'EN'}</span>
              </button>
            </div>

            {/* Role Switcher Pill (Teacher vs Director HQ) — hidden when the
                account is arriving via a role-locked director invite link,
                since the role isn't a choice in that case (audit §21d), and
                also hidden for a plan-linked director signup (picked a plan
                on /schools) since that's already role-locked to director. */}
            {!(inviteSlug && authMode === 'signup') && !isPlanSignup && (
              <div className="w-full flex p-1 bg-brand-dark border border-white/10 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => { setLoginRole('teacher'); setAuthError(''); if (!inviteSlug) setAuthMode('login'); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginRole === 'teacher'
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <ChalkboardTeacher size={14} weight="bold" />
                  <span>{isKo ? '교사 로그인' : 'Teacher Access'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginRole('director'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    loginRole === 'director'
                      ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Buildings size={14} weight="bold" />
                  <span>{isKo ? '원장님 HQ 로그인' : 'Director Admin'}</span>
                </button>
              </div>
            )}
            {/* Invited signup gets ONE badge, not three stacked banners that
                all said the same thing (audit: "Teacher Access Portal" pill +
                "Joining via invite link" card + "creating account from an
                invite" banner all rendered together, looking cluttered). */}
            {inviteSlug && authMode === 'signup' ? (
              <div className="w-full mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                <Buildings size={16} className="text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isKo ? '초대받은 선생님 계정 생성' : "You're creating a teacher account from an invite"}</p>
                  <p className="text-xs font-bold text-white">{isKo ? '가입 후 학원명이 표시됩니다' : "You'll see your academy's name once you sign up."}</p>
                </div>
              </div>
            ) : (
              <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] font-bold ${
                loginRole === 'director'
                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                  : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
              }`}>
                {loginRole === 'director' ? <Buildings size={12} weight="bold" /> : <ChalkboardTeacher size={12} weight="bold" />}
                <span>
                  {loginRole === 'director'
                    ? (isKo ? '원장님 전용 HQ 관리자 포털' : 'Director HQ Admin Access')
                    : (isKo ? '교사 전용 포털' : 'Teacher Access Portal')}
                </span>
              </div>
            )}

            {/* Auth Mode Toggle (Login vs Sign Up) — hidden for a plan-linked
                director signup, replaced by a small "already have an
                account?" link below instead. That choice belongs to
                returning users, not someone who just picked a plan.
                Also hidden for teacher-without-invite: this used to offer a
                self-serve "Sign Up" that promised joining a school "via
                their authorization code," but no code field was ever wired
                up in this form — the account it created had no schoolId, no
                educatorRole, and no class, a permanent dead end. Teacher
                accounts are only ever created via a director's invite link
                now (audit §21); direct teacher signup below is disabled. */}
            {!isPlanSignup && !(loginRole === 'teacher' && !inviteSlug) && !inviteSlug && (
              <div className="w-full flex bg-brand-dark p-1 rounded-2xl border border-white/10 mb-6">
                <button
                  type="button"
                  onClick={() => { setAuthMode('login'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'login'
                      ? (loginRole === 'director' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20')
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isKo ? '로그인' : 'Log In'}
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    authMode === 'signup'
                      ? (loginRole === 'director' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-orange-500 text-white shadow-lg shadow-orange-500/20')
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {isKo ? '회원가입' : 'Sign Up'}
                </button>
              </div>
            )}

            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {isPlanSignup
                ? (isKo
                    ? `${planLabel.nameKo} 원장님 계정 생성 — FT ${planSeats.ft}석, KT ${planSeats.kt}석`
                    : `Create your Director account for ${planLabel.nameEn} — ${planSeats.ft} FT seats, ${planSeats.kt} KT seats`)
                : authMode === 'login'
                ? (loginRole === 'director' ? (isKo ? '원장님 HQ 로그인' : 'Director HQ Login') : (isKo ? '교사 포털 로그인' : 'Teacher Portal Login'))
                : (loginRole === 'director' ? (isKo ? '원장님 계정 생성' : 'Create Director Account') : (isKo ? '교사 계정 생성' : 'Create Teacher Account'))}
            </h2>
            <p className={`text-zinc-400 text-xs text-center leading-relaxed max-w-xs ${isPlanSignup ? 'mb-2' : 'mb-6'}`}>
              {isPlanSignup
                ? (activationPlanId === 'trial'
                    ? (isKo ? '신용카드 등록 없이 7일 무료 체험이 바로 시작됩니다.' : 'Free for 7 days, no payment required now.')
                    : (isKo ? '가입 즉시 원장님 전용 대시보드가 개설됩니다. 결제는 대시보드에서 별도로 안내드립니다.' : 'Your Director dashboard activates immediately after signup — billing is handled separately from your dashboard.'))
                : authMode === 'login'
                ? (loginRole === 'director'
                    ? (isKo ? '캠퍼스 전체 커리큘럼, 일간 숙제 제출률 및 보고서 총괄 대시보드로 이동합니다.' : 'Log in to view campus curriculum streams, homework status, and student reports.')
                    : (isKo ? '학습지 관리 및 분석을 위해 교사 계정으로 로그인해 주세요.' : 'Log in with your teacher credentials to access your dashboard.'))
                : (loginRole === 'director'
                    ? (isKo ? '학원명을 등록하고 즉시 원장님 전용 대시보드를 개설하세요.' : 'Register your academy and activate your Director HQ Dashboard.')
                    : inviteSlug
                    ? (isKo ? '아래 정보를 입력해 계정을 만드세요.' : 'Fill in your details below to create your account.')
                    : (isKo ? '가입 후 전달받으신 교사 인증 코드를 등록하여 즉시 시작하세요.' : 'Sign up to register your school authorization code.'))}
            </p>
            {!isPlanSignup && loginRole === 'teacher' && !inviteSlug && (
              <p className="text-[10px] text-zinc-500 text-center max-w-xs -mt-4 mb-6 leading-relaxed">
                {isKo
                  ? '교사 계정은 원장님의 초대 링크로만 생성됩니다. 초대 링크가 없다면 원장님께 요청해 주세요.'
                  : "Teacher accounts are only created via your director's invite link. Ask them to send you one."}
              </p>
            )}
            {isPlanSignup && (
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer mb-6 underline underline-offset-2"
              >
                {isKo ? '이미 계정이 있으신가요? 로그인' : 'Already have an account? Log in'}
              </button>
            )}

            <form onSubmit={handleSignIn} className="w-full space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {loginRole === 'director' ? (isKo ? '원장님 성함' : 'Director Name') : (isKo ? '선생님 성함' : 'Teacher Full Name')}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={loginRole === 'director' ? (isKo ? "김원장 원장님" : "Director Jane Smith") : (isKo ? "김철수 선생님" : "Jane Doe")}
                    className="w-full bg-brand-dark border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                  />
                </div>
              )}

              {authMode === 'signup' && loginRole === 'director' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '학원명' : 'Academy Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={academyNameInput}
                    onChange={(e) => setAcademyNameInput(e.target.value)}
                    placeholder={isKo ? '예: 첵키 잉글리시 아카데미' : 'e.g. Chekki English Academy'}
                    className="w-full bg-brand-dark border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  {inviteSlug && authMode === 'signup' ? (isKo ? '이메일 확인' : 'Confirm your email') : 'Email'}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginRole === 'director' ? "director@school.com" : "teacher@school.com"}
                  className="w-full bg-brand-dark border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-dark border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                />
              </div>

              {authMode === 'signup' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '비밀번호 확인' : 'Confirm Password'}
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-brand-dark border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                  />
                </div>
              )}


              {authError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl text-center flex items-center justify-center gap-2">
                  <Warning size={16} weight="bold" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="group w-full py-4 mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
              >
                {isSigningIn ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>
                      {authMode === 'login'
                        ? (isKo ? '로그인' : 'Log In')
                        : (isKo ? '1-Click 교사 가입 및 시작' : '1-Click Sign Up & Start')}
                    </span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }


  const activeClass = selectedClass || fallbackDemoClass;


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
  if (showTeacherWelcome) {
    // Classes are director-created and teacher-assigned only (single flow,
    // no FT/KT self-serve creation) — this just records the welcome as seen
    // and drops the teacher onto their dashboard to wait for assignment.
    const dismissWelcome = () => {
      const uid = user?.uid || '';
      if (uid) localStorage.setItem(`chekki_teacher_welcome_done_${uid}`, '1');
      setShowTeacherWelcome(false);
      setActiveTab(welcomeRole === 'kt' ? 'kt_script' : 'overview');
    };
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${isThemeNight ? 'bg-brand-dark text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/8 via-transparent to-transparent blur-[100px] pointer-events-none" />
        <div className={`relative w-full max-w-md rounded-[2rem] border shadow-2xl p-1.5 ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
          <div className={`rounded-[calc(2rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center ${isThemeNight ? 'bg-brand-dark' : 'bg-white'}`}>

            {/* Mascot + Badge */}
            <div className="w-16 h-16 mb-5 drop-shadow-[0_8px_20px_rgba(249,115,22,0.25)]">
              <ChekkiMascot className="w-full h-full" mood="happy" />
            </div>
            <div className={`mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] font-bold ${
              welcomeRole === 'kt'
                ? 'bg-blue-500/10 border border-blue-500/20 text-blue-400'
                : 'bg-orange-500/10 border border-orange-500/20 text-orange-400'
            }`}>
              <ChalkboardTeacher size={12} weight="bold" />
              <span>{welcomeRole === 'kt' ? (isKo ? 'KT 한국인 선생님 환영' : 'Korean Teacher (KT) Access') : (isKo ? 'FT 원어민 선생님 환영' : 'Foreign Teacher (FT) Access')}</span>
            </div>

            {/* Step 1 — Confirm name & role */}
            {teacherWelcomeStep === 1 && (
              <div className="w-full space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">{isKo ? '선생님, 환영합니다! 👋' : 'Welcome, Teacher! 👋'}</h2>
                  <p className="text-zinc-400 text-xs leading-relaxed">{isKo ? '아래 정보를 확인하고 시작해 주세요.' : 'Confirm your details to get started.'}</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{isKo ? '선생님 성함' : 'Your Name'}</label>
                  <input
                    type="text"
                    value={welcomeName}
                    onChange={(e) => setWelcomeName(e.target.value)}
                    placeholder={isKo ? '홍길동 선생님' : 'Jane Doe'}
                    className={`w-full p-4 rounded-2xl border text-sm font-bold outline-none focus:border-orange-500 transition-all ${isThemeNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                  />
                </div>

                {welcomeSchool && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                    <Buildings size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isKo ? '초대받은 학원' : 'Invited Academy'}</p>
                      <p className="text-sm font-black text-white">{welcomeSchool}</p>
                      {welcomeInviterName && (
                        <p className="text-[11px] text-emerald-300/80 mt-0.5">
                          {isKo ? `${welcomeInviterName} 원장님이 초대함` : `Invited by ${welcomeInviterName}`}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{isKo ? '선생님 역할' : 'Your Role'}</label>
                  {user?.educatorRole ? (
                    // Role was already decided by the director's invite (audit
                    // §21d) — this is a read-only confirmation, not a choice.
                    <div className={`w-full py-3 rounded-xl text-xs font-black border text-center ${
                      welcomeRole === 'kt' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                    }`}>
                      {welcomeRole === 'kt' ? (isKo ? '🇰🇷 KT 한국어 선생님 (초대로 지정됨)' : '🇰🇷 Korean Teacher — set by your invite') : (isKo ? '🌍 FT 원어민 선생님 (초대로 지정됨)' : '🌍 Foreign Teacher — set by your invite')}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      {(['ft', 'kt'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setWelcomeRole(r)}
                          className={`flex-1 py-3 rounded-xl text-xs font-black border transition-all cursor-pointer ${
                            welcomeRole === r
                              ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-600'
                          }`}
                        >
                          {r === 'ft' ? (isKo ? '🌍 FT 원어민' : '🌍 Foreign Teacher') : (isKo ? '🇰🇷 KT 한국어' : '🇰🇷 Korean Teacher')}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setTeacherWelcomeStep(2)}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <span>{isKo ? '다음: 학급 확인 →' : 'Next: Class Setup →'}</span>
                </button>
              </div>
            )}

            {/* Step 2 — single flow: the director creates classes and
                assigns teachers to them (Teacher Assignments); a teacher
                never creates their own class here. This used to branch on
                welcomeSchool and let anyone without it type a class name,
                which created a standalone class disconnected from the
                director's real roster (audit: teacher ends up on a
                different class than the one the director set up) — one
                path now, regardless of how the account was created. */}
            {teacherWelcomeStep === 2 && (
              <div className="w-full space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">{isKo ? '거의 다 됐어요!' : "You're all set!"}</h2>
                  <p className="text-zinc-400 text-xs leading-relaxed">
                    {isKo
                      ? '원장님이 담당 학급을 배정하면 대시보드에 표시됩니다.'
                      : 'Your director will assign you to a class — it\'ll show up on your dashboard once they do.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => dismissWelcome()}
                  className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <CheckCircle size={18} weight="bold" />
                  <span>{isKo ? '완료 — 대시보드 입장! 🎉' : 'Done — Enter Dashboard! 🎉'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }


  // --- RENDER CORE DASHBOARD LAYOUT SHELL ---
  return (
    <div className={`min-h-screen ${isThemeNight ? 'bg-brand-dark text-zinc-100' : 'bg-slate-50 text-zinc-900'} flex flex-col md:flex-row selection:bg-orange-500 selection:text-white`}>

      {/* Teacher Onboarding Modal */}
      {showTeacherOnboarding && (() => {
        const step = teacherObSteps[teacherObStep];
        const isLast = teacherObStep === teacherObSteps.length - 1;
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={dismissTeacherOnboarding} />
            <div
              ref={teacherOnboardingDialogRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="teacher-onboarding-title"
              tabIndex={-1}
              className={`relative w-full max-w-[420px] p-1 border rounded-[2.5rem] shadow-2xl ${
              isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
            }`}>
              <div className={`rounded-[calc(2.5rem-0.25rem)] p-8 flex flex-col items-center text-center ${
                isThemeNight ? 'bg-brand-dark text-white' : 'bg-white text-zinc-900'
              }`}>
                <button
                  onClick={dismissTeacherOnboarding}
                  className={`absolute top-5 right-5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all active:scale-[0.97] cursor-pointer ${
                    isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                  }`}
                >
                  {isKo ? '건너뛰기' : 'Skip'}
                </button>

                <div className={`w-44 h-44 mb-6 rounded-3xl overflow-hidden p-2 flex items-center justify-center shadow-xl ${
                  isThemeNight ? 'bg-black/40 border border-white/10 shadow-[0_20px_40px_rgba(249,115,22,0.15)]' : 'bg-brand-dark border border-zinc-300/80 shadow-orange-500/10'
                }`}>
                  <img src={step.img} alt="" className="w-full h-full object-contain" />
                </div>

                <h3 id="teacher-onboarding-title" className={`text-2xl font-black tracking-tight mb-3 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? step.titleKo : step.titleEn}
                </h3>
                <p className={`text-sm leading-relaxed max-w-[300px] mb-8 ${isThemeNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {isKo ? step.descKo : step.descEn}
                </p>

                <div className="flex items-center gap-2 mb-8">
                  {teacherObSteps.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === teacherObStep ? 'w-8 bg-orange-500' : 'w-1.5 bg-white/20'}`}
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
                  className="group w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
                >
                  <span>
                    {isLast
                      ? (isKo ? '시작하기' : 'Got it')
                      : (isKo ? '다음 단계' : 'Next Step')}
                  </span>
                  <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={14} weight="bold" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        );
      })()}


      {/* Mobile-only backdrop for the off-canvas drawer */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-[350] bg-black/60 backdrop-blur-sm md:hidden"
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
        className={`fixed inset-y-0 left-0 z-[360] w-[85vw] max-w-sm transform transition-transform duration-300 ease-out md:static md:z-auto md:w-72 md:h-screen md:sticky md:top-0 md:translate-x-0 md:transform-none border-b md:border-b-0 md:border-r flex flex-col shrink-0 transition-colors ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${isThemeNight ? 'bg-brand-dark border-white/5' : 'bg-white border-zinc-200 shadow-xs'}`}
      >

        {/* Sidebar Header / Brand */}
        <div className={`p-6 border-b transition-colors flex items-center justify-between gap-3 shrink-0 ${
          isThemeNight ? 'border-white/5 bg-brand-dark' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center gap-3.5 min-w-0">
            {academyLogo ? (
              <img
                src={academyLogo}
                alt="Academy Logo"
                className="w-10 h-10 rounded-2xl object-cover border border-white/10 shadow-md bg-white/5"
              />
            ) : (
              <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-500 shadow-lg shrink-0">
                <ChalkboardTeacher size={20} weight="bold" />
              </div>
            )}
            <div className="min-w-0">
              <h1 className={`text-sm font-black tracking-tight truncate ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                {user?.schoolName || 'B2B Academy'}
              </h1>
              <p className="text-[10px] text-zinc-500 font-medium truncate mt-0.5">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            aria-label={isKo ? '메뉴 닫기' : 'Close menu'}
            className={`md:hidden p-2 rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0 ${
              isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
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
            <DirectorSidebarNav isNight={isThemeNight} isKo={isKo} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}

          {loginRole !== 'director' && educatorRole === 'kt' && (
            <KtSidebarNav
              isNight={isThemeNight}
              isKo={isKo}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showReportCardModal={showReportCardModal}
              setShowReportCardModal={setShowReportCardModal}
            />
          )}

          {loginRole !== 'director' && educatorRole === 'ft' && (
            <FtSidebarNav isNight={isThemeNight} isKo={isKo} activeTab={activeTab} setActiveTab={setActiveTab} />
          )}
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 transition-colors ${
          isThemeNight ? 'border-white/5 bg-brand-dark/60' : 'border-zinc-200 bg-zinc-50'
        }`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-500 flex items-center justify-center font-bold text-xs shrink-0">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-bold truncate ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{user?.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={() => { setResetPwStatus(null); setShowSettingsModal(true); }}
              className={`p-2 rounded-xl transition-all active:scale-[0.95] cursor-pointer ${
                isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title={isKo ? '교사 설정' : 'Teacher Settings'}
            >
              <Gear size={16} weight="bold" />
            </button>
            <button
              onClick={logout}
              className={`p-2 rounded-xl transition-all active:scale-[0.95] cursor-pointer ${
                isThemeNight ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-zinc-500 hover:text-red-600 hover:bg-red-50'
              }`}
              title={isKo ? '로그아웃' : 'Log Out'}
            >
              <SignOut size={16} weight="bold" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col min-w-0 relative overflow-y-auto transition-colors ${
        isThemeNight ? 'bg-brand-dark text-white' : 'bg-slate-50 text-zinc-900'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Control Bar */}
        <header className={`p-4 sm:p-6 border-b flex flex-wrap items-center justify-between gap-4 relative z-10 shrink-0 transition-colors ${
          isThemeNight ? 'bg-brand-dark/90 border-white/5 text-white' : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-xs'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              aria-label={isKo ? '메뉴 열기' : 'Open menu'}
              className={`md:hidden p-2.5 rounded-xl transition-all active:scale-[0.95] cursor-pointer shrink-0 border ${
                isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <List size={20} weight="bold" />
            </button>

            {/* Class switcher — this used to be hidden for directors
                entirely, which was fine while the Curriculum Preseed tab's
                own "Target Class" selector gave them a second way to switch.
                Now that curriculum uploading is teacher-only (§5), that was
                the director's ONLY way to change which class the dashboard
                (week nav, roster, overview stats) is showing — with it
                gone, a director with more than one class had no way to
                switch between them at all. */}
            <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
              <ChalkboardTeacher size={20} weight="bold" />
            </div>

            <div className="relative">
              {classes.length > 0 ? (
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => {
                    const found = classes.find(c => c.id === e.target.value);
                    if (found) setSelectedClass(found);
                  }}
                  className={`font-bold text-sm px-4 py-2.5 rounded-2xl border outline-none cursor-pointer pr-9 appearance-none transition-colors ${
                    isThemeNight ? 'bg-brand-dark border-white/10 text-white hover:border-white/20 focus:border-orange-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 hover:border-zinc-400 focus:border-orange-500'
                  }`}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.level})
                    </option>
                  ))}
                </select>
              ) : (
                <div className="text-zinc-500 text-sm font-semibold p-2">
                  {isKo ? '학급을 먼저 등록해 주세요.' : 'Create a class to get started.'}
                </div>
              )}
            </div>

            {/* Create/Delete are gated to whoever actually owns the class
                doc server-side (firestore.rules: teacherUid == requester or
                admin — in practice the director who created it). Showing
                these to FT/KT used to mean the button existed but silently
                failed the permission check on click, surfacing as a
                misleading "removed on this device only" sync warning
                instead of a clear "you can't do that" (Audit: delete-class
                button visible to whoever can't actually delete). */}
            {(loginRole === 'director' || user?.role === 'director') && (
              <button
                type="button"
                onClick={() => setShowCreateClassModal(true)}
                className="group px-3.5 py-2.5 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-2xl transition-all font-bold text-xs shrink-0 active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
                title={isKo ? '새 학급 추가' : 'Add New Class'}
              >
                <Plus size={16} weight="bold" className="group-hover:rotate-90 transition-transform" />
                <span className="hidden sm:inline">{isKo ? '새 학급' : 'New Class'}</span>
              </button>
            )}
            {selectedClass && !selectedClass.isDemo && (loginRole === 'director' || user?.role === 'director') && (
              <button
                type="button"
                onClick={() => handleDeleteClass(selectedClass.id)}
                disabled={isDeletingClass}
                className={`text-xs font-bold px-3 py-2 border rounded-2xl flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.97] disabled:opacity-50 ${
                  isThemeNight 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20' 
                    : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                }`}
                title={isKo ? '현재 선택된 학급 삭제' : 'Delete selected class'}
              >
                <Trash size={14} weight="bold" />
                <span className="hidden lg:inline">{isKo ? '학급 삭제' : 'Delete'}</span>
              </button>
            )}
          </div>

          {/* Right Controls: Active Week Counter + Language Switcher + Theme Toggle */}
          <div className="flex items-center gap-3">
            {selectedClass && !selectedClass.isDemo && (
              <div className="flex items-center gap-2">
                <div className={`border rounded-2xl flex items-center overflow-hidden p-1 shadow-inner ${
                  isThemeNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-100 border-zinc-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(-1)}
                    disabled={(selectedClass?.activeWeekNumber || 1) <= 1}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-black transition-all cursor-pointer disabled:opacity-20 active:scale-95 ${
                      isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    }`}
                    title={isKo ? '이전 주차' : 'Previous week'}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeekCalendarModal(true)}
                    className={`px-3 py-1 text-xs font-black min-w-[3.4rem] text-center font-mono rounded-lg transition-all cursor-pointer ${
                      isThemeNight ? 'text-white hover:bg-white/10 hover:text-orange-400' : 'text-zinc-900 hover:bg-zinc-200 hover:text-orange-600'
                    }`}
                    title={isKo ? '클릭하여 학기 주차별 커리큘럼 업로드 캘린더 열기' : 'Click to view semester calendar'}
                  >
                    W{selectedClass?.activeWeekNumber || 1}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(1)}
                    className={`w-11 h-11 flex items-center justify-center rounded-xl text-sm font-black transition-all cursor-pointer active:scale-95 ${
                      isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    }`}
                    title={isKo ? '다음 주차' : 'Next week'}
                  >
                    +
                  </button>
                </div>
              </div>
            )}



            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
              className={`px-3.5 py-2 min-h-11 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.96] ${
                isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200'
              }`}
              title="Switch Language / 언어 변경"
            >
              <span>🌐</span>
              <span>{language === 'ko' ? '한국어' : 'EN'}</span>
            </button>

            {/* Theme Toggle (Light / Dark) */}
            <button
              type="button"
              onClick={() => setIsThemeNight(!isThemeNight)}
              aria-label={isThemeNight ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`min-w-11 min-h-11 flex items-center justify-center border rounded-xl transition-all cursor-pointer active:scale-[0.96] ${
                isThemeNight ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-indigo-600 hover:bg-zinc-200'
              }`}
              title={isThemeNight ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isThemeNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
            </button>
          </div>
        </header>

        {/* Tab Content Rendering Container */}
        <section className="p-6 md:p-8 flex-1 relative z-10">
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
            <div className={`p-4 rounded-2xl border mb-6 flex flex-wrap items-center justify-between gap-3 transition-all ${
              isThemeNight ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
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
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {isKo ? '로그아웃' : 'Log out'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowInviteSessionNotice(false)}
                  className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-xs font-bold rounded-xl transition-all cursor-pointer"
                >
                  {isKo ? '닫기' : 'Dismiss'}
                </button>
              </div>
            </div>
          )}
          {classes.length === 0 && (loginRole === 'director' || user?.role === 'director') && (
            <div className={`p-5 rounded-3xl border mb-6 flex flex-wrap items-center justify-between gap-4 transition-all shadow-sm ${
              isThemeNight
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                : 'bg-orange-50/90 border-orange-200 text-orange-950 shadow-orange-500/5'
            }`}>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-lg shadow-orange-500/30">
                  ✨
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-tight">
                    {isKo ? '대시보드 미리보기 모드' : 'Dashboard Preview Mode'}
                  </h4>
                  <p className={`text-xs mt-0.5 ${isThemeNight ? 'text-orange-300/80' : 'text-orange-800'}`}>
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
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] shrink-0 cursor-pointer"
                >
                  + {isKo ? '새 학급반 만들기' : 'Create Class Now'}
                </button>
              </div>
            </div>
          )}
          {classes.length === 0 && (!selectedClass || selectedClass.isDemo) && !(loginRole === 'director' || user?.role === 'director') && (
            <div className={`p-5 rounded-3xl border mb-6 flex items-center gap-3.5 transition-all shadow-sm ${
              isThemeNight
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-200'
                : 'bg-orange-50/90 border-orange-200 text-orange-950 shadow-orange-500/5'
            }`}>
              <div className="w-10 h-10 rounded-2xl bg-orange-500 text-white flex items-center justify-center font-bold text-base shrink-0 shadow-lg shadow-orange-500/30">
                ⏳
              </div>
              <div>
                <h4 className="text-sm font-black tracking-tight">
                  {isKo ? '학급 배정 대기 중' : 'Waiting on a class assignment'}
                </h4>
                <p className={`text-xs mt-0.5 ${isThemeNight ? 'text-orange-300/80' : 'text-orange-800'}`}>
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
              <div className={`mb-4 p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
                isThemeNight ? 'bg-amber-500/10 border-amber-500/30' : 'bg-amber-50 border-amber-300'
              }`}>
                <p className="text-xs font-bold text-amber-500 flex-1">{syncWarning}</p>
                <button
                  type="button"
                  onClick={() => setSyncWarning(null)}
                  className="text-amber-400 hover:text-amber-200 text-xs font-bold cursor-pointer shrink-0"
                >
                  ✕
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
              />
            ) : educatorRole === 'kt' ? (
              <KtTabContent
                isNight={isThemeNight}
                isKo={isKo}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                ktLogsLoadError={ktLogsLoadError}
                ktPendingLogs={ktPendingLogs}
                ktQueueLogs={ktQueueLogs}
                activeKtGroup={activeKtGroup}
                justCopiedLogId={justCopiedLogId}
                activeKtLogId={activeKtLogId}
                confirmDiscardKtDraft={confirmDiscardKtDraft}
                setKtDraftDirty={setKtDraftDirty}
                setActiveKtLogId={setActiveKtLogId}
                groupKey={groupKey}
                formatConsolidatedDraft={formatConsolidatedDraft}
                activeClass={activeClass}
                academyName={displayedAcademyName}
                user={user}
                ktConsolidatedGroups={ktConsolidatedGroups}
                handleKtApprove={handleKtApprove}
                completionRate={completionRate}
                completedHomeworkCount={completedHomeworkCount}
                activeStudentsCount={activeStudentsCount}
                handleLogSubmit={handleLogSubmit}
                isSubmittingLog={isSubmittingLog}
                selectedTextbookName={selectedTextbookName}
                ftDashboardRoster={ftDashboardRoster}
                uploadMode={uploadMode}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                handleUpdateWeek={handleUpdateWeek}
                curriculumEditor={curriculumEditor}
                pendingRoster={pendingRoster}
                activeRoster={activeRoster}
                isLoadingRoster={isLoadingRoster}
                handleApproveStudent={handleApproveStudent}
                handleDeclineStudent={handleDeclineStudent}
                handleRemoveStudent={handleRemoveStudent}
                handleMoveStudent={handleMoveStudent}
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
                isSubmittingLog={isSubmittingLog}
                completionRate={completionRate}
                completedHomeworkCount={completedHomeworkCount}
                activeStudentsCount={activeStudentsCount}
                curriculumSlideIndex={curriculumSlideIndex}
                setCurriculumSlideIndex={setCurriculumSlideIndex}
                activeVocabWords={activeVocabWords}
                isLoadingRoster={isLoadingRoster}
                sortedTroubleWords={sortedTroubleWords}
                curriculumTopic={curriculumTopic}
                curriculumPhonics={curriculumPhonics}
                curriculumPassage={curriculumPassage}
                curriculumOther={curriculumOther}
                submittedLogs={submittedLogs}
                uploadMode={uploadMode}
                classes={classes}
                selectedClass={selectedClass}
                setSelectedClass={setSelectedClass}
                handleUpdateWeek={handleUpdateWeek}
                curriculumEditor={curriculumEditor}
              />
            )}

            </div>
        </section>
      </main>

      {/* --- STUDENT MISTAKE DETAILS SLIDE-OVER DRAWER --- */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setSelectedStudentDetails(null)} 
          />
          <div
            ref={studentDrawerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="student-drawer-title"
            tabIndex={-1}
            className={`relative w-full max-w-lg h-full border-l p-6 sm:p-8 flex flex-col shadow-2xl animate-slide-in text-left transition-colors ${
            isThemeNight ? 'bg-brand-dark border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>

            {/* Drawer Header */}
            <div className={`pb-6 border-b flex items-center justify-between shrink-0 ${
              isThemeNight ? 'border-white/10' : 'border-zinc-200'
            }`}>
              <div>
                <h3 id="student-drawer-title" className={`text-xl font-black flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  <span>👦 {selectedStudentDetails.studentName || 'Unnamed'}</span>
                  <span className="text-xs font-normal text-zinc-400">{isKo ? '원생 학습 성장 기록' : "'s Growth & Practice Log"}</span>
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {selectedStudentDetails.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedStudentDetails(null)}
                aria-label={isKo ? '닫기' : 'Close'}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all text-sm font-bold active:scale-[0.95] cursor-pointer ${
                  isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
                }`}
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Flag for Director/Counselor */}
            <div className={`mt-4 p-4 rounded-2xl border shrink-0 ${
              selectedStudentDetails.flaggedException
                ? 'bg-amber-500/10 border-amber-500/30'
                : isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              {selectedStudentDetails.flaggedException ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">
                      {isKo ? '⚠️ 원장님께 플래그됨' : '⚠️ Flagged for Director'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFlagStudent(selectedStudentDetails.uid)}
                      className="text-[10px] font-bold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {isKo ? '플래그 해제' : 'Unflag'}
                    </button>
                  </div>
                  <p className="text-xs text-zinc-300">{selectedStudentDetails.flaggedException.reason}</p>
                  <p className="text-[10px] text-zinc-500 font-mono">
                    {selectedStudentDetails.flaggedException.teacherName} · {selectedStudentDetails.flaggedException.date}
                  </p>
                </div>
              ) : showFlagReasonInput ? (
                <div className="space-y-2">
                  <textarea
                    value={flagReasonInput}
                    onChange={(e) => setFlagReasonInput(e.target.value)}
                    placeholder={isKo ? '플래그 사유를 입력하세요 (학습/행동 이슈 등)' : 'Reason for flagging (academic or behavioral issue)...'}
                    className={`w-full h-20 p-3 rounded-xl border text-xs outline-none resize-none ${
                      isThemeNight ? 'bg-brand-dark border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!flagReasonInput.trim()) return;
                        handleToggleFlagStudent(selectedStudentDetails.uid, flagReasonInput);
                        setFlagReasonInput('');
                        setShowFlagReasonInput(false);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      {isKo ? '플래그 제출' : 'Submit Flag'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowFlagReasonInput(false); setFlagReasonInput(''); }}
                      className="px-4 py-2 text-xs font-bold text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {isKo ? '취소' : 'Cancel'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowFlagReasonInput(true)}
                  className={`text-xs font-bold flex items-center gap-1.5 cursor-pointer ${isThemeNight ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-zinc-900'}`}
                >
                  <Warning size={14} weight="bold" />
                  <span>{isKo ? '원장님께 플래그하기' : 'Flag for Director'}</span>
                </button>
              )}
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">
                  {isKo ? '이번 주 도전 복습 포인트' : "This week's focus practice items"}
                </span>

                {selectedStudentDetails.weeklyMistakes.length === 0 ? (
                  <div className="py-16 text-center text-emerald-500 text-xs flex flex-col items-center gap-2">
                    <Sparkle size={24} weight="bold" />
                    <span>{isKo ? '모든 항목을 완벽하게 학습했습니다!' : 'Mastered all items this week! Excellent progress.'}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudentDetails.weeklyMistakes.map((m: any, idx: number) => (
                      <div key={m.uniqueId || idx} className={`p-5 border rounded-2xl flex flex-col gap-3 ${
                        isThemeNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200 shadow-xs'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-500 font-bold rounded-lg text-[9px] uppercase tracking-wider font-mono">
                              {m.type || 'Phonics'}
                            </span>
                            {m.isResolved || m.attemptNumber > 1 ? (
                              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 font-bold rounded-md text-[9px] uppercase font-mono">
                                ⚡ {isKo ? '2차 재도전 수정 완료' : 'Fixed on Rescan'}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-500 font-bold rounded-md text-[9px] uppercase font-mono">
                                📋 {isKo ? '1차 스캔 기록' : '1st Scan Attempt'}
                              </span>
                            )}
                          </div>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {m.dateAdded ? m.dateAdded.split('T')[0] : ''}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                              Question / Word
                            </span>
                            <p className={`font-bold font-mono ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{m.question_text}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                Target Answer
                              </span>
                              <p className="font-bold text-emerald-500 font-mono">{m.correct_answer}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                Student Answer
                              </span>
                              <p className="font-bold text-red-500 font-mono">{m.student_response || '(Blank)'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Footer */}
            <div className={`pt-6 border-t shrink-0 flex gap-3 ${isThemeNight ? 'border-white/10' : 'border-zinc-200'}`}>
              <button
                type="button"
                onClick={() => setShowReportCardModal(true)}
                className="w-1/2 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>{isKo ? '맞춤 로고 성적표 인쇄' : 'Print Branded Report'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedStudentDetails(null)}
                className={`w-1/2 py-4 font-bold text-xs rounded-2xl transition-all border active:scale-[0.98] cursor-pointer ${
                  isThemeNight ? 'bg-brand-dark hover:bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}
              >
                {isKo ? '닫기' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- CLASS CREATION MODAL --- */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowCreateClassModal(false)} 
          />
          <div
            ref={createClassDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-class-title"
            tabIndex={-1}
            className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-8 overflow-hidden transition-colors ${
              isThemeNight ? 'bg-brand-dark text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Plus size={22} weight="bold" />
                </div>
                <h3 id="create-class-title" className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                  {isKo ? '새 학급반 추가' : 'Add New Class'}
                </h3>
              </div>
              
              <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                {isKo 
                  ? '관리할 학급의 이름과 대상 학년을 설정해 학급을 개설하세요.'
                  : 'Specify the class details to expand your school roster.'}
              </p>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-2 text-left">
                  <label htmlFor="new-class-name" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '반 이름' : 'Class Name'}
                  </label>
                  <input
                    id="new-class-name"
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="E.g. 7-Mercury"
                    className={`w-full border outline-none text-sm p-4 rounded-2xl transition-all ${
                      isThemeNight ? 'bg-brand-dark border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label htmlFor="new-class-level" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '대상 학년' : 'Class Level'}
                  </label>
                  <select
                    id="new-class-level"
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className={`w-full border outline-none text-sm p-4 rounded-2xl transition-all cursor-pointer ${
                      isThemeNight ? 'bg-brand-dark border-white/10 focus:border-orange-500 text-white' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900'
                    }`}
                  >
                    <option value="5-year-old">{isKo ? '5세반' : '5-year-old'}</option>
                    <option value="6-year-old">{isKo ? '6세반' : '6-year-old'}</option>
                    <option value="7-year-old">{isKo ? '7세반' : '7-year-old'}</option>
                    <option value="Elementary Grade 1">{isKo ? '초등 1학년' : 'Elementary Grade 1'}</option>
                    <option value="Elementary Grade 2">{isKo ? '초등 2학년' : 'Elementary Grade 2'}</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateClassModal(false)}
                    className={`flex-1 py-4 font-bold text-xs rounded-2xl border transition-all active:scale-[0.98] cursor-pointer ${
                      isThemeNight ? 'bg-brand-dark hover:bg-white/5 text-zinc-400 hover:text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    }`}
                  >
                    {isKo ? '취소' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClass}
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isCreatingClass ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{isKo ? '개설하기' : 'Create Class'}</span>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* --- TEACHER SETTINGS MODAL --- */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-[260] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowSettingsModal(false)} 
          />
          <div
            ref={settingsDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="settings-modal-title"
            tabIndex={-1}
            className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-lg mx-4 animate-fade-in text-left ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-8 transition-colors ${
              isThemeNight ? 'bg-brand-dark text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                aria-label={isKo ? '닫기' : 'Close'}
                className={`absolute top-6 right-6 min-w-11 min-h-11 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                <X size={16} weight="bold" />
              </button>

              <div id="settings-modal-title" className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Gear size={24} weight="bold" />
                </div>
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-widest block font-mono ${
                    loginRole === 'director' || user?.role === 'director' ? 'text-amber-400' : 'text-orange-500'
                  }`}>
                    {loginRole === 'director' || user?.role === 'director' 
                      ? (isKo ? '🏢 원장님 HQ 전용 설정' : '🏢 DIRECTOR HQ SETTINGS')
                      : (educatorRole === 'kt' 
                          ? (isKo ? '👩‍🏫 한국인 교사 계정 설정' : '👩‍🏫 KOREAN TEACHER (KT) SETTINGS')
                          : (isKo ? '👨‍🏫 원어민 교사 계정 설정' : '👨‍🏫 FOREIGN TEACHER (FT) SETTINGS'))}
                  </span>
                  <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {loginRole === 'director' || user?.role === 'director'
                      ? (isKo ? '원장님 HQ 환경 설정' : 'Director HQ Account & Settings')
                      : (educatorRole === 'kt'
                          ? (isKo ? '한국인 선생님 환경 설정' : 'Korean Teacher Account & Settings')
                          : (isKo ? '원어민 선생님 환경 설정' : 'Foreign Teacher Account & Settings'))}
                  </h3>
                </div>
              </div>

              <div className="space-y-6">
                {/* Profile Info */}
                <div className={`p-4 border rounded-2xl space-y-2 ${
                  isThemeNight ? 'bg-brand-dark border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 block font-mono">
                    {isKo ? '계정 프로필 정보' : 'ACCOUNT PROFILE'}
                  </span>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">
                      {loginRole === 'director' || user?.role === 'director' 
                        ? (isKo ? '원장님 성함' : 'Director Name') 
                        : (isKo ? '선생님 성함' : 'Teacher Name')}:
                    </span>
                    <strong className={isThemeNight ? 'text-white' : 'text-zinc-900'}>{user?.name || 'Director Admin'}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{isKo ? '이메일 주소' : 'Email Address'}:</span>
                    <strong className={`font-mono ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{user?.email}</strong>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">{isKo ? '소속 학원' : 'Assigned School'}:</span>
                    <strong className="text-orange-500">{user?.schoolName || 'B2B Academy'}</strong>
                  </div>
                </div>

                {/* Password Reset */}
                <div className={`p-4 border rounded-2xl space-y-3 ${
                  isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className={`text-xs font-bold mb-0.5 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? '비밀번호 재설정' : 'Password & Security'}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {isKo ? '이메일로 비밀번호 재설정 링크를 받습니다.' : 'Receive a password reset link via email.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={isSendingReset}
                      onClick={handleSendResetPassword}
                      className={`px-3.5 py-2 disabled:opacity-50 font-bold text-xs rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                        isThemeNight ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      {isSendingReset ? (isKo ? '발송 중...' : 'Sending...') : (isKo ? '재설정 이메일 발송' : 'Reset Password')}
                    </button>
                  </div>
                  {resetPwStatus && (
                    <p className={`text-xs p-2.5 rounded-xl font-medium ${resetPwStatus.isError ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'}`}>
                      {resetPwStatus.text}
                    </p>
                  )}
                </div>

                {/* Re-open Walkthrough Guide — the tour's content is FT/KT-
                    specific (waiting on a director's class assignment), so
                    hide this for directors rather than show them a guide
                    written about a role they don't have (Audit: director's
                    settings surfaced the FT/KT-worded tour). */}
                {loginRole !== 'director' && user?.role !== 'director' && (
                  <div className={`flex items-center justify-between p-4 border rounded-2xl ${
                    isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <div>
                      <h4 className={`text-xs font-bold mb-0.5 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? '교사 온보딩 가이드 다시보기' : 'Onboarding Walkthrough'}
                      </h4>
                      <p className="text-[11px] text-zinc-400">
                        {isKo ? '학급 개설 및 학부모 6자리 코드 연결 가이드' : 'Review 3-step teacher tutorial guide.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowSettingsModal(false);
                        setTeacherObStep(0);
                        setShowTeacherOnboarding(true);
                      }}
                      className={`px-3.5 py-2 font-bold text-xs rounded-xl border transition-all whitespace-nowrap cursor-pointer ${
                        isThemeNight ? 'bg-white/10 hover:bg-white/15 text-white border-white/10' : 'bg-zinc-200 hover:bg-zinc-300 text-zinc-800 border-zinc-300'
                      }`}
                    >
                      {isKo ? '가이드 열기' : 'Open Tutorial'}
                    </button>
                  </div>
                )}

                {/* Report a Bug / Send Feedback — staff dashboard had no path to
                    reach us at all; only the parent-facing app did. */}
                <div className={`flex items-center justify-between p-4 border rounded-2xl ${
                  isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold mb-0.5 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '버그 신고 / 의견 보내기' : 'Report a Bug / Send Feedback'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {isKo ? '문제를 발견하셨나요? 팀에게 바로 알려주세요.' : 'Found something broken? Let us know directly.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setShowFeedbackModal(true);
                    }}
                    className="px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold text-xs rounded-xl border border-orange-500/20 transition-all whitespace-nowrap cursor-pointer"
                  >
                    {isKo ? '보내기' : 'Send'}
                  </button>
                </div>

                {/* Account Actions: Delete Account & Log Out */}
                <div className="pt-2 flex flex-col gap-2.5">
                  <button
                    type="button"
                    onClick={handleDeleteTeacherAccount}
                    disabled={isDeletingAccount}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] disabled:opacity-50"
                  >
                    <Trash size={16} weight="bold" />
                    <span>{isDeletingAccount ? (isKo ? '계정 삭제 중...' : 'Deleting Account...') : (isKo ? '선생님 계정 영구 삭제' : 'Permanently Delete Account')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      logout();
                    }}
                    className={`w-full py-3 font-bold text-xs rounded-2xl border transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98] ${
                      isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-300 border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                    }`}
                  >
                    <SignOut size={16} weight="bold" />
                    <span>{isKo ? '교사 계정 로그아웃' : 'Log Out of Teacher Account'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
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
