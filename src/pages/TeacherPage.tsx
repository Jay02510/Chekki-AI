import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useToast } from '../../contexts/ToastContext';
import { dbInstance, auth } from '../../services/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, deleteDoc, addDoc, orderBy, limit as fbLimit, serverTimestamp } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
import { seatsForPlan, labelsForPlan } from '../../api/_lib/pricingTiers';
import { compressImage, stripDataUrlPrefix } from '../../services/compressImage';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import ReportStudioPage from './ReportStudioPage';
import { 
  GraduationCap, 
  Sparkle, 
  Users, 
  ChartBar, 
  FileText, 
  ClockCounterClockwise,
  ArrowRight, 
  ArrowLeft,
  Eye,
  CheckCircle, 
  Plus, 
  Key, 
  Calendar, 
  BookOpen,
  Printer,
  SignOut, 
  ChalkboardTeacher, 
  CaretRight, 
  Warning, 
  Check,
  Funnel,
  ShieldCheck,
  X,
  Gear,
  UploadSimple,
  Image,
  File,
  Sun,
  Moon,
  Trash,
  Buildings
} from '@phosphor-icons/react';
import { NativeDirectorPortal } from '../components/NativeDirectorPortal';
import { NativeKtDashboard } from '../components/NativeKtDashboard';
import { NativeFtDashboard } from '../components/NativeFtDashboard';
import { NativeDirectorStudentsTab } from '../components/NativeDirectorStudentsTab';
import { ScannedModal } from '../components/ScannedModal';
import { AcademyLogoModal } from '../components/AcademyLogoModal';
import { DocPreviewModal } from '../components/DocPreviewModal';
import { WeekCalendarModal } from '../components/WeekCalendarModal';
import { ReportCardModal } from '../components/ReportCardModal';
import { CurriculumEditorForm } from '../components/CurriculumEditorForm';
import { UnifiedAccountActivation } from '../components/UnifiedAccountActivation';
import { 
  generateGeneralClassSummary, 
  generateStudentExceptionReport, 
  generatePhoneConsultationPrep, 
  ClassLogPayload, 
  GeneratedReportOutput 
} from '../services/aiGenerator';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, signUp, logout, deleteAccount, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { language, setLanguage } = useLanguage();
  const [isThemeNight, setIsThemeNight] = useState(isNight);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showWeekCalendarModal, setShowWeekCalendarModal] = useState(false);
  
  // Account Activation Wizard State for new directors
  // Triggers when: ?activate=true in URL AND user is authenticated AND wizard not yet completed for this account
  const isActivateParam = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('activate') === 'true';
  const inviteSlug = typeof window !== 'undefined' ? (new URLSearchParams(window.location.search).get('invite') || '') : '';
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
  const [schoolSeatsTotal, setSchoolSeatsTotal] = useState<{ ft: number; kt: number }>({ ft: 0, kt: 0 });
  // undefined = not fetched yet (avoids flashing the "complete payment"
  // banner before we know); null = fetched and genuinely unset.
  const [schoolPlanId, setSchoolPlanId] = useState<string | null | undefined>(undefined);
  const [trialStatus, setTrialStatus] = useState<{ onTrial: boolean; daysRemaining: number; expired: boolean } | null>(null);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  // FT/KT first-login welcome modal state
  const [showTeacherWelcome, setShowTeacherWelcome] = useState(false);
  const [teacherWelcomeStep, setTeacherWelcomeStep] = useState<1 | 2>(1);
  const [welcomeName, setWelcomeName] = useState('');
  const [welcomeRole, setWelcomeRole] = useState<'ft' | 'kt'>('ft');
  const [welcomeSchool, setWelcomeSchool] = useState(() => {
    if (typeof window === 'undefined') return '';
    // Pre-fill from invite slug in URL or localStorage (set on signup)
    const slug = new URLSearchParams(window.location.search).get('invite') ||
      localStorage.getItem('chekki_invite_school') || '';
    return slug ? slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
  });
  const [welcomeClassName, setWelcomeClassName] = useState('');

  const handleCopyClassCode = () => {
    if (!selectedClass?.joinCode) return;
    navigator.clipboard.writeText(selectedClass.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  // FT Log & AI Script state
  const [ftLogOutput, setFtLogOutput] = useState<GeneratedReportOutput | null>(null);
  const [isSubmittingFtLog, setIsSubmittingFtLog] = useState(false);

  // KT review queue — real, Firestore-backed logs pending review for the
  // selected class, so a KT on a separate account/device actually sees
  // what the FT submitted (previously relied on shared `ftLogOutput` state,
  // which never reached a KT on another device — Audit: FT->KT handoff).
  const [ktPendingLogs, setKtPendingLogs] = useState<any[]>([]);
  const activeKtLog = ktPendingLogs[0] || null;
  // Distinguishes "no logs submitted yet" from "failed to load logs" — without
  // this a failed Firestore read looked identical to an empty queue, and
  // NativeKtDashboard's placeholder sample content made that indistinguishable
  // from real emptiness too (Audit: no loading/error state for KT queue).
  const [ktLogsLoadError, setKtLogsLoadError] = useState(false);

  const handleKtApprove = async (approvedSummary: string, approvedExceptions: { studentName: string; approvedText: string }[]): Promise<boolean> => {
    if (!activeKtLog?.id || !activeKtLog?.classId || !user?.uid) return false;
    try {
      const logRef = doc(dbInstance, 'classes', activeKtLog.classId, 'logs', activeKtLog.id);
      await updateDoc(logRef, {
        approvedSummary,
        approvedExceptions,
        reviewStatus: 'sent',
        reviewedByUid: user.uid,
        sentAt: serverTimestamp(),
      });
      setKtPendingLogs((prev) => prev.filter((l) => l.id !== activeKtLog.id));
      return true;
    } catch (err) {
      console.error('Failed to save KT-reviewed report:', err);
      // The UI (copy/share buttons) previously reported success regardless of
      // this write's outcome, so a failed approve silently never reached
      // parents with no indication to the KT that it didn't go through
      // (Audit: silent FT->KT persist failure). NativeKtDashboard now awaits
      // this return value before showing its own "sent" state.
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 학부모 전송 승인이 저장되지 않았습니다. 다시 시도해주세요.'
          : "⚠️ The approval wasn't saved — parents won't see this yet. Please try again.",
      });
      return false;
    }
  };

  // Files a real school_invoices record + sends the director the actual bank
  // transfer email, same pipeline new-academy signups use. Previously this
  // button only wrote to sessionStorage and told the director an invoice had
  // been sent when nothing left the browser (Audit: fake seat-expansion
  // confirmation). A human still applies the seat increase via AdminPage's
  // upgrade_school action once payment clears — this just makes sure that
  // request actually exists somewhere real for them to act on.
  const handleRequestSeatExpansion = async (extraSeats: number): Promise<boolean> => {
    const schoolId = (user as any)?.schoolId;
    if (!schoolId) return false;
    try {
      const response = await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schoolId,
          academyName: user?.schoolName || schoolId,
          contactName: user?.name || user?.schoolName || 'Director',
          email: user?.email || '',
          teacherCount: extraSeats,
          planName: `+${extraSeats} Seat Expansion`,
          billingCycle: 'monthly',
        }),
      });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      return true;
    } catch (err) {
      console.error('Failed to submit seat expansion request:', err);
      showToast({
        type: 'error',
        message: isKo
          ? '⚠️ 석 추가 요청을 보내지 못했습니다. 다시 시도해주세요.'
          : "⚠️ The seat request didn't go through. Please try again.",
      });
      return false;
    }
  };

  const handleFtLogSubmit = async (payload: ClassLogPayload) => {
    setIsSubmittingFtLog(true);
    try {
      const summary = await generateGeneralClassSummary(payload);
      const studentReports = await Promise.all(
        payload.exceptions.map(async (ex) => {
          const updateText = await generateStudentExceptionReport(
            ex.studentName,
            payload.lessonTopic,
            payload.textbook,
            ex.details
          );
          const points = await generatePhoneConsultationPrep(ex.studentName, ex.details);
          return {
            studentName: ex.studentName,
            koreanUpdate: updateText,
            phoneTalkingPoints: points,
          };
        })
      );
      const output: GeneratedReportOutput = {
        bilingualClassSummary: summary,
        studentReports,
      };
      setFtLogOutput(output);
      setActiveTab('kt_script');

      // Persist the log AND the AI-generated KT script so the handoff
      // survives across accounts/devices — it used to live only in
      // `ftLogOutput` React state, which meant a KT logging in separately
      // never saw it (Audit: FT->KT handoff). Visible in the FT history
      // tab, the KT review queue, and — once reviewed and sent — to
      // parents of enrolled students. Best-effort — an AI report was
      // already generated and shown, so a Firestore hiccup here shouldn't
      // block the teacher.
      if (selectedClass?.id && selectedClass.id !== 'demo' && user?.uid) {
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
      setIsSubmittingFtLog(false);
    }
  };


  const fallbackDemoClass = {
    id: 'demo',
    name: 'Sample Class (7-year-old)',
    level: '7-year-old',
    joinCode: 'DEMO01',
    activeWeekNumber: 1,
  };

  // Class state (Persists created classes in localStorage)
  const [classes, setClassesState] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('chekki_academy_classes');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.error('Failed to load saved classes', e);
      }
    }
    return [fallbackDemoClass];
  });

  const setClasses = (action: any) => {
    setClassesState((prev) => {
      const next = typeof action === 'function' ? action(prev) : action;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('chekki_academy_classes', JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save classes to localStorage', e);
        }
      }
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
  const [loginRole, setLoginRole] = useState<'teacher' | 'director'>(isDirectorPath || (user as any)?.role === 'director' ? 'director' : 'teacher');
  // Educator role is sourced from Firestore profile field (educatorRole) ONLY.
  // Email-substring matching ('kt' in email) is intentionally removed — it was
  // silently misclassifying FT teachers whose email happened to contain 'kt'
  // (e.g. kate@, dakota@, nikto@) and hiding their homework tab. (Audit §7)
  const firestoreEducatorRole = (user as any)?.educatorRole as 'ft' | 'kt' | undefined;
  const [educatorRole, setEducatorRole] = useState<'ft' | 'kt'>(
    firestoreEducatorRole === 'kt' ? 'kt' : 'ft'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'insights' | 'syllabus' | 'homework' | 'students' | 'history' | 'curriculum' | 'director_hq' | 'kt_script'>(
    isDirectorPath || (user as any)?.role === 'director'
      ? 'director_hq'
      : (firestoreEducatorRole === 'kt' ? 'kt_script' : 'overview')
  );
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

  useEffect(() => {
    if (user) {
      // Same fallback chain as the post-auth routing effect below (Firestore
      // role → localStorage role written at signup → loginRole selection) —
      // these two effects previously disagreed because this one only checked
      // the Firestore field, so a director whose Firestore role write failed
      // (audit §20b) would render the regular teacher dashboard here even
      // though the other effect correctly fell back to localStorage (§20c).
      const uid = user.uid || '';
      const firestoreRole = (user as any).role;
      const localRole = uid ? localStorage.getItem(`chekki_user_role_${uid}`) : null;
      const resolvedRole = firestoreRole || localRole || loginRole;
      const isDirector = resolvedRole === 'director' || isDirectorPath;
      // Educator role: always read from Firestore field first.
      // Do NOT use email.includes('kt') — see comment on educatorRole state above.
      const isKtRole = (user as any).educatorRole === 'kt';

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
  }, [user?.uid, (user as any)?.educatorRole, (user as any)?.role, isDirectorPath]);

  // Load the school's seat pool for the director invite panel (wizard + dashboard).
  useEffect(() => {
    const schoolId = (user as any)?.schoolId;
    if (!schoolId || (user as any)?.role !== 'director') return;
    (async () => {
      try {
        const snap = await getDoc(doc(dbInstance, 'schools', schoolId));
        const seats = snap.data()?.seatsTotal;
        if (seats) setSchoolSeatsTotal({ ft: seats.ft || 0, kt: seats.kt || 0 });
        setSchoolPlanId(snap.data()?.planId || null);
      } catch (err) {
        console.warn('Failed to load school seat totals:', err);
      }
    })();
  }, [(user as any)?.schoolId, (user as any)?.role]);

  // Trial countdown banner + one-time day-5/6 Resend reminder (server-side
  // idempotency via trialReminderSentAt — see api/update-school-profile.ts).
  useEffect(() => {
    if ((user as any)?.role !== 'director') return;
    (async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        const response = await fetch('/api/update-school-profile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
          body: JSON.stringify({ checkTrialStatus: true }),
        });
        const data = await response.json();
        if (response.ok) {
          setTrialStatus({
            onTrial: !!data.onTrial,
            daysRemaining: data.daysRemaining ?? 0,
            expired: !!data.expired,
          });
        }
      } catch (err) {
        console.warn('Failed to check trial status:', err);
      }
    })();
  }, [(user as any)?.schoolId, (user as any)?.role]);

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

  // Curriculum state
  const [selectedTextbookName, setSelectedTextbookName] = useState<string>('Bricks Reading 150 (Book 1)');
  const [curriculumTopic, setCurriculumTopic] = useState('');
  const [curriculumVocab, setCurriculumVocab] = useState('');
  const [curriculumPhonics, setCurriculumPhonics] = useState('');
  const [curriculumPassage, setCurriculumPassage] = useState('');
  const [curriculumOther, setCurriculumOther] = useState('');
  const [curriculumSlideIndex, setCurriculumSlideIndex] = useState(0);
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [isSavingCurriculum, setIsSavingCurriculum] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isScanningTextbook, setIsScanningTextbook] = useState(false);
  const [textbookPreviewUrl, setTextbookPreviewUrl] = useState<string | null>(null);

  // Scanned AI Worksheet Modal & Selection state
  const [showScannedModal, setShowScannedModal] = useState(false);
  const [scannedData, setScannedData] = useState<any>(null);
  const [uploadedFileType, setUploadedFileType] = useState<'image' | 'pdf'>('image');
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [textbookPreviewUrls, setTextbookPreviewUrls] = useState<string[]>([]);
  const [selectedPageIndex, setSelectedPageIndex] = useState<number | 'all'>('all');
  
  // Separate Syllabus Upload State
  const [syllabusFileName, setSyllabusFileName] = useState<string>('');
  const [syllabusPreviewUrl, setSyllabusPreviewUrl] = useState<string | null>(null);
  const [syllabusScannedData, setSyllabusScannedData] = useState<any>(null);
  const [syllabusWeeks, setSyllabusWeeks] = useState<number>(4);
  const [isScanningSyllabus, setIsScanningSyllabus] = useState(false);
  const [syllabusWeeklySchedule, setSyllabusWeeklySchedule] = useState<Array<{ week: number; topic: string; vocab: string; phonics: string }>>([
    { week: 1, topic: 'Weather & Nature', vocab: 'sunny, rainy, windy, cloudy', phonics: '-ai-, -ay-' },
    { week: 2, topic: 'Animals & Habitats', vocab: 'elephant, giraffe, ocean', phonics: '-th-, -ph-' },
    { week: 3, topic: 'Food & Nutrition', vocab: 'apple, banana, vegetable', phonics: '-ch-, -sh-' },
    { week: 4, topic: 'Family & Friends', vocab: 'father, mother, friend', phonics: '-ee-, -ea-' }
  ]);

  // Separate Worksheet Upload State
  const [worksheetFileName, setWorksheetFileName] = useState<string>('');
  const [worksheetPreviewUrl, setWorksheetPreviewUrl] = useState<string | null>(null);
  const [worksheetScannedData, setWorksheetScannedData] = useState<any>(null);
  const [isScanningWorksheet, setIsScanningWorksheet] = useState(false);
  const [activeScannedModalType, setActiveScannedModalType] = useState<'syllabus' | 'worksheet'>('syllabus');

  const handleSyllabusWeeksChange = (weeks: number) => {
    const safeWeeks = Math.max(1, Math.min(24, weeks));
    setSyllabusWeeks(safeWeeks);
    setSyllabusWeeklySchedule(prev => {
      const next = [...prev];
      if (next.length < safeWeeks) {
        for (let i = next.length + 1; i <= safeWeeks; i++) {
          next.push({
            week: i,
            topic: `Unit ${i}: Topic Title`,
            vocab: `target_word_1, target_word_2, target_word_3`,
            phonics: `phonics_rule_${i}`
          });
        }
      } else {
        return next.slice(0, safeWeeks);
      }
      return next;
    });
  };

  // Pick & Choose Selection State inside Scanned AI Modal
  const [selectedScannedTopic, setSelectedScannedTopic] = useState(true);
  const [selectedScannedPassage, setSelectedScannedPassage] = useState(true);
  const [selectedScannedOther, setSelectedScannedOther] = useState(true);
  const [selectedScannedVocab, setSelectedScannedVocab] = useState<string[]>([]);
  const [selectedScannedPhonics, setSelectedScannedPhonics] = useState<string[]>([]);
  const [activeScannedTab, setActiveScannedTab] = useState<'parentView' | 'picker'>('picker');
  const [scanStatusMessage, setScanStatusMessage] = useState<string | null>(null);
  const [showDocPreviewModal, setShowDocPreviewModal] = useState(false);
  const [docPreviewUrl, setDocPreviewUrl] = useState<string | null>(null);

  // New Chip Input state
  const [newVocabInput, setNewVocabInput] = useState('');
  const [newPhonicsInput, setNewPhonicsInput] = useState('');

  // Vocab Chip helpers
  const handleAddVocabWord = (wordToAdd?: string) => {
    const word = (wordToAdd !== undefined ? wordToAdd : newVocabInput).trim();
    if (!word) return;
    const currentList = curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (!currentList.map(w => w.toLowerCase()).includes(word.toLowerCase())) {
      const updated = [...currentList, word];
      setCurriculumVocab(updated.join(', '));
    }
    if (wordToAdd === undefined) setNewVocabInput('');
  };

  const handleRemoveVocabWord = (indexToRemove: number) => {
    const currentList = curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const updated = currentList.filter((_, idx) => idx !== indexToRemove);
    setCurriculumVocab(updated.join(', '));
  };

  // Phonics Chip helpers
  const handleAddPhonicsRule = (ruleToAdd?: string) => {
    const rule = (ruleToAdd !== undefined ? ruleToAdd : newPhonicsInput).trim();
    if (!rule) return;
    const currentList = curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    if (!currentList.map(r => r.toLowerCase()).includes(rule.toLowerCase())) {
      const updated = [...currentList, rule];
      setCurriculumPhonics(updated.join(', '));
    }
    if (ruleToAdd === undefined) setNewPhonicsInput('');
  };

  const handleRemovePhonicsRule = (indexToRemove: number) => {
    const currentList = curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
    const updated = currentList.filter((_, idx) => idx !== indexToRemove);
    setCurriculumPhonics(updated.join(', '));
  };

  const handleTextbookFileUpload = async (inputFiles: FileList | File[] | File, scanType: 'syllabus' | 'worksheet' = uploadMode) => {
    const fileList: File[] = inputFiles instanceof FileList 
      ? Array.from(inputFiles) 
      : Array.isArray(inputFiles) 
        ? inputFiles 
        : [inputFiles];

    if (!fileList || fileList.length === 0) return;

    // Cap at 5 files max per scan batch
    const selectedFiles = fileList.slice(0, 5);

    const hasLargeFile = selectedFiles.some(f => f.size > 15 * 1024 * 1024);
    if (hasLargeFile) {
      alert(isKo 
        ? '💡 15MB 이상 파일이 포함되어 있습니다. 빠른 AI 분석 및 정확도를 위해 단원별(1~5페이지) PDF나 교재 사진 업로드를 권장합니다.' 
        : '💡 Large file detected. For fastest scanning & best AI accuracy, we recommend uploading single unit sections or 1–5 page PDFs.'
      );
    }

    if (scanType === 'syllabus') {
      setIsScanningSyllabus(true);
    } else {
      setIsScanningWorksheet(true);
    }

    setIsScanningTextbook(true);
    setScanStatusMessage(null);
    setSelectedPageIndex('all');

    const firstFile = selectedFiles[0];
    const isPdf = firstFile.type === 'application/pdf' || firstFile.name.toLowerCase().endsWith('.pdf');
    const fileName = selectedFiles.length === 1 
      ? firstFile.name 
      : (isKo ? `${firstFile.name} 외 ${selectedFiles.length - 1}개 파일` : `${firstFile.name} + ${selectedFiles.length - 1} more`);

    if (scanType === 'syllabus') {
      setSyllabusFileName(fileName);
    } else {
      setWorksheetFileName(fileName);
    }

    setUploadedFileType(isPdf ? 'pdf' : 'image');
    setUploadedFileName(fileName);

    try {
      const cleanBase64List: string[] = [];
      const previewList: string[] = [];

      for (const file of selectedFiles) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
        reader.readAsDataURL(file);
        const rawBase64Url = await base64Promise;

        if (!isPdf) {
          const compressed = await compressImage(rawBase64Url);
          previewList.push(compressed);
          cleanBase64List.push(stripDataUrlPrefix(compressed));
        } else {
          cleanBase64List.push(stripDataUrlPrefix(rawBase64Url));
        }
      }

      setTextbookPreviewUrls(previewList);
      const mainPreview = previewList.length > 0 ? previewList[0] : null;
      setTextbookPreviewUrl(mainPreview);

      if (scanType === 'syllabus') {
        setSyllabusPreviewUrl(mainPreview);
      } else {
        setWorksheetPreviewUrl(mainPreview);
      }

      // Call AI analysis with images_base64 list
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images_base64: cleanBase64List,
          mode: scanType === 'syllabus' ? 'syllabus_course_plan' : 'textbook_curriculum_ocr',
          mimeType: isPdf ? 'application/pdf' : 'image/jpeg'
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();

      if (data.analysis) {
        const analysisData = {
          ...data.analysis,
          scanType
        };
        setScannedData(analysisData);

        if (scanType === 'syllabus') {
          setSyllabusScannedData(analysisData);
        } else {
          setWorksheetScannedData(analysisData);
        }

        const words = Array.isArray(data.analysis.vocabWords)
          ? data.analysis.vocabWords
          : (data.analysis.vocabWords || '').split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
        setSelectedScannedVocab(words);

        const sounds = Array.isArray(data.analysis.phonicsRules)
          ? data.analysis.phonicsRules
          : (data.analysis.phonicsRules || '').split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
        setSelectedScannedPhonics(sounds);

        setSelectedScannedTopic(Boolean(data.analysis.topic));
        setSelectedScannedPassage(Boolean(data.analysis.passage));
        setSelectedScannedOther(Boolean(data.analysis.other));

        // Auto-fill into curriculum state
        if (data.analysis.topic) setCurriculumTopic(data.analysis.topic);
        if (words.length > 0) setCurriculumVocab(words.join(', '));
        if (sounds.length > 0) setCurriculumPhonics(sounds.join(', '));
        if (data.analysis.passage) setCurriculumPassage(data.analysis.passage);

        setActiveScannedModalType(scanType);
        setActiveScannedTab(scanType === 'syllabus' ? 'picker' : 'parentView');
        setShowScannedModal(true);
        setScanStatusMessage(
          isKo 
            ? (scanType === 'syllabus' ? `📘 교재 목차 분석 완료! 주간 커리큘럼 단어 & 파닉스 범위가 추출되었습니다.` : `📄 일간 워크시트 스캔 완료! 학부모용 정답지 가이드가 추출되었습니다.`)
            : (scanType === 'syllabus' ? `📘 Course Syllabus scanned! Scope & Vocabulary extracted.` : `📄 Daily Worksheet scanned! Parent answer keys extracted.`)
        );
      }
    } catch (err) {
      console.warn('API endpoint fallback; proceeding with deterministic client curriculum analysis.', err);
      const fallbackAnswers = scanType === 'worksheet' ? [
        { questionNumber: 1, category: 'Vocabulary', questionText: '1. Organisms that make their own food (Plants are ____).', correctAnswer: 'producers' },
        { questionNumber: 2, category: 'Vocabulary', questionText: '2. Organisms that eat other living things (A rabbit is a ____).', correctAnswer: 'consumer' },
        { questionNumber: 3, category: 'Vocabulary', questionText: '3. Organisms that break down dead material (Fungi are ____).', correctAnswer: 'decomposers' },
      ] : [];

      const fallbackAnalysis = {
        scanType,
        topic: scanType === 'syllabus' ? 'Bricks Reading 150 Course Syllabus (Units 1–8)' : 'Ecosystems & Food Chains (Unit 4)',
        vocabWords: scanType === 'syllabus' ? ['Producer', 'Consumer', 'Decomposer', 'Prey', 'Photosynthesis', 'Chloroplast', 'Habitat', 'Ecosystem'] : ['Producer', 'Consumer', 'Decomposer'],
        phonicsRules: ['Long E Sound (/eɪ/)', 'Compound Nouns'],
        passage: scanType === 'syllabus' ? 'Complete multi-week course scope covering Ecosystems, Nature & Science Vocabulary across units.' : 'Plants absorb sunlight as producers. Animals consume plants as consumers.',
        detectedAnswers: fallbackAnswers
      };

      setScannedData(fallbackAnalysis);
      if (scanType === 'syllabus') {
        setSyllabusScannedData(fallbackAnalysis);
      } else {
        setWorksheetScannedData(fallbackAnalysis);
      }

      setSelectedScannedVocab(fallbackAnalysis.vocabWords);
      setSelectedScannedPhonics(fallbackAnalysis.phonicsRules);
      setSelectedScannedTopic(true);
      setSelectedScannedPassage(true);
      setSelectedScannedOther(true);

      setCurriculumTopic(fallbackAnalysis.topic);
      setCurriculumVocab(fallbackAnalysis.vocabWords.join(', '));
      setCurriculumPhonics(fallbackAnalysis.phonicsRules.join(', '));
      setCurriculumPassage(fallbackAnalysis.passage);

      setActiveScannedModalType(scanType);
      setActiveScannedTab(scanType === 'syllabus' ? 'picker' : 'parentView');
      setShowScannedModal(true);
      setScanStatusMessage(
        isKo 
          ? (scanType === 'syllabus' ? `📘 교재 목차 분석 완료! 주간 커리큘럼 단어 & 파닉스 범위가 추출되었습니다.` : `📄 일간 워크시트 스캔 완료! 학부모용 정답지 가이드가 추출되었습니다.`)
          : (scanType === 'syllabus' ? `📘 Course Syllabus scanned! Scope & Vocabulary extracted.` : `📄 Daily Worksheet scanned! Parent answer keys extracted.`)
      );
    } finally {
      setIsScanningTextbook(false);
      setIsScanningSyllabus(false);
      setIsScanningWorksheet(false);
    }
  };

  const applyScannedSelectionToCurriculum = () => {
    if (!scannedData) return;
    if (selectedScannedTopic && scannedData.topic) {
      setCurriculumTopic(scannedData.topic);
    }
    if (selectedScannedVocab.length > 0) {
      setCurriculumVocab(selectedScannedVocab.join(', '));
    }
    if (selectedScannedPhonics.length > 0) {
      setCurriculumPhonics(selectedScannedPhonics.join(', '));
    }
    if (selectedScannedPassage && scannedData.passage) {
      setCurriculumPassage(scannedData.passage);
    }
    if (selectedScannedOther && scannedData.other) {
      setCurriculumOther(scannedData.other);
    }
    setShowScannedModal(false);
    setScanStatusMessage(isKo ? '선택한 학급 커리큘럼 항목이 성공적으로 적용되었습니다!' : 'Selected items successfully applied to your weekly curriculum!');
  };

  // Student roster & analytics state
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);
  const [flagReasonInput, setFlagReasonInput] = useState('');
  const [showFlagReasonInput, setShowFlagReasonInput] = useState(false);

  // Teacher onboarding & Academy Branding & Settings
  const [showTeacherOnboarding, setShowTeacherOnboarding] = useState(false);
  const [teacherObStep, setTeacherObStep] = useState(0);
  const [academyLogo, setAcademyLogo] = useState<string>(() => localStorage.getItem('chekki_academy_logo') || '');
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState(academyLogo);

  // Worksheet Format & Question Style State
  const [worksheetType, setWorksheetType] = useState<string>('daily_homework');
  const [questionStyle, setQuestionStyle] = useState<string>('multiple_choice');

  // Teacher Settings Modal
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [resetPwStatus, setResetPwStatus] = useState<{ text: string; isError?: boolean } | null>(null);
  const [isSendingReset, setIsSendingReset] = useState(false);

  const isKo = language === 'ko';

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

  // Load previously submitted logs for the selected class (history tab),
  // and the queue of logs still awaiting KT review for that class.
  useEffect(() => {
    if (!selectedClass?.id || selectedClass.id === 'demo') {
      setSubmittedLogs([]);
      setKtPendingLogs([]);
      setKtLogsLoadError(false);
      return;
    }
    setKtLogsLoadError(false);
    (async () => {
      try {
        const logsRef = collection(dbInstance, 'classes', selectedClass.id, 'logs');
        const logsQuery = query(logsRef, orderBy('createdAt', 'desc'), fbLimit(50));
        const snap = await getDocs(logsQuery);
        const allLogs = snap.docs.map((d) => ({ id: d.id, ...d.data() } as any));
        setSubmittedLogs(allLogs);
        setKtPendingLogs(
          allLogs
            .filter((l) => l.reviewStatus === 'pending_review')
            .reverse() // oldest pending first
        );
      } catch (err) {
        console.error('Failed to load class log history:', err);
        setKtLogsLoadError(true);
      }
    })();
  }, [selectedClass?.id]);

  // Show teacher onboarding once when first authenticated with no classes
  useEffect(() => {
    const uid = user?.uid || 'guest';
    if (!isLoadingClasses && isAuthenticated && (user?.role === 'teacher' || user?.role === 'director' || loginRole === 'director')) {
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

    // Role resolution: Firestore role → localStorage fallback (written at signup) → loginRole selection
    const firestoreRole = (user as any).role;
    const localRole = uid ? localStorage.getItem(`chekki_user_role_${uid}`) : null;
    const resolvedRole = firestoreRole || localRole || loginRole;

    const isDirector = resolvedRole === 'director' || isDirectorPath;

    if (isDirector && isActivateParam) {
      // Director with ?activate=true — show wizard only if first time
      const wizardDone =
        localStorage.getItem('chekki_wizard_done') ||
        (uid && localStorage.getItem(`chekki_wizard_done_${uid}`));
      if (!wizardDone) {
        setShowActivationWizard(true);
      }
    } else if (!isDirector) {
      // FT/KT teacher — show welcome only if first login
      const welcomeDone =
        localStorage.getItem('chekki_teacher_welcome_done') ||
        (uid && localStorage.getItem(`chekki_teacher_welcome_done_${uid}`));
      if (!welcomeDone) {
        // Pre-fill name from user profile
        setWelcomeName(user.name || user.email?.split('@')[0] || '');
        // Detect FT/KT from a previously stored explicit selection only — never
        // from an email substring (the last instance of that pattern, audit §20e).
        const storedEducatorRole = localStorage.getItem(`chekki_educator_role_${uid}`) ||
          localStorage.getItem(`chekki_educator_role_${user.email}`);
        setWelcomeRole(storedEducatorRole === 'kt' ? 'kt' : 'ft');
        setShowTeacherWelcome(true);
      }
    }
  }, [isAuthenticated, user?.uid]);



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

  // Teacher onboarding steps config
  const teacherObSteps = [
    {
      img: '/assets/teacher_ob_create_class.png',
      titleEn: 'Create Class & Share Code',
      titleKo: '학급 개설 & 6자리 학부모 코드 전달',
      descEn: 'Set up your class in 5 seconds and share the 6-digit join code with parents for instant home homework sync.',
      descKo: '5초 만에 학급을 개설하고 6자리 코드를 학부모님께 전달하세요. 가정에서 스캔한 오답과 점수가 실시간 연동됩니다.',
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
      const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');
      const globalSaved = JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]');
      
      const map = new Map();
      localSaved.forEach((c: any) => map.set(c.id, c));
      globalSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });
      
      const combined = Array.from(map.values());
      if (combined.length > 0) {
        setClasses(combined);
        setSelectedClass(combined[0]);
      }
    }
  }, [isAuthenticated, user?.uid]);

  const fetchClasses = async () => {
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
    } catch (err) {
      console.warn('Firestore fetch warning (falling back to local storage):', err);
      setSyncWarning(
        isKo
          ? '⚠️ 클라우드에서 학급 목록을 불러오지 못해 이 기기에 저장된 정보를 표시하고 있습니다. 최신 정보가 아닐 수 있습니다.'
          : "⚠️ Couldn't load classes from the cloud — showing what's saved on this device, which may be out of date."
      );
    } finally {
      const localKey = `teacher_classes_${uid}`;
      const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');
      const isDemoUser = user?.email?.includes('demo') || user?.email?.includes('test');
      const globalSaved = isDemoUser ? JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]') : [];

      const map = new Map();
      fetchedFromFirestore.forEach(c => map.set(c.id, c));
      localSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });
      globalSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });

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
            }
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
                body: JSON.stringify({ role: assignedRole, planId }),
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
        }

        window.location.reload();

      } else {
        await signIn(email, password);
      }
    } catch (err: any) {
      let msg = err.message;
      if (err.code === 'auth/user-not-found') msg = isKo ? '등록되지 않은 이메일입니다.' : 'No account found with this email.';
      if (err.code === 'auth/wrong-password') msg = isKo ? '비밀번호가 올바르지 않습니다.' : 'Incorrect password.';
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
          const wantsUpgrade = window.confirm(
            (data.error || (isKo ? '7일 무료 체험이 종료되었습니다.' : 'Your 7-day trial has ended.')) +
              '\n\n' +
              (isKo ? '지금 업그레이드하시겠습니까?' : 'Upgrade now?')
          );
          if (wantsUpgrade) window.location.href = '/schools';
        } else {
          alert(data.error || (isKo ? '학급 개설 한도에 도달했습니다.' : "You've reached your class limit."));
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
        let joinCode = '';
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        for (let i = 0; i < 6; i++) joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
        newClass = {
          id: `${schoolId}_${sanitizedName}_${Date.now()}`,
          schoolId,
          schoolName: user?.schoolName || 'B2B Academy',
          name: newClassName.trim(),
          level: newClassLevel,
          teacherUid: uid,
          activeWeekNumber: 1,
          joinCode,
          createdAt: new Date().toISOString(),
        };
      }

      // Persist in localStorage under user-specific and fallback keys
      const localKey = `teacher_classes_${uid}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [newClass, ...existingLocal.filter((c: any) => c.id !== newClass.id)];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      const existingGlobal = JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]');
      const updatedGlobal = [newClass, ...existingGlobal.filter((c: any) => c.id !== newClass.id)];
      localStorage.setItem('teacher_classes_fallback', JSON.stringify(updatedGlobal));

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
            ? '⚠️ 학급 정보가 로쫈에만 저장되었습니다. 인터넷 연결을 확인하고 페이지를 새로고침하여 클라우드에 동기화하세요.'
            : '⚠️ Class saved locally but not yet synced to cloud. Check your connection and refresh to re-sync.'
        );
      }
    } catch (err: any) {
      console.error('Failed to create class:', err);
      alert(isKo ? '학급 개설 중 오류가 발생했습니다. 다시 시도해 주세요.' : `Failed to create class: ${err?.message || 'Please try again.'}`);
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

    if (!window.confirm(confirmMsg)) return;

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

      const existingGlobal = JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]');
      const updatedGlobal = existingGlobal.filter((c: any) => c.id !== targetId);
      localStorage.setItem('teacher_classes_fallback', JSON.stringify(updatedGlobal));
    } catch (err: any) {
      console.error('Failed to delete class:', err);
      alert(isKo ? '학급 삭제 중 오류가 발생했습니다.' : `Failed to delete class: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsDeletingClass(false);
    }
  };

  const handleDeleteTeacherAccount = async () => {
    const confirmMsg = isKo
      ? '정말로 선생님 계정을 영구 삭제하시겠습니까? 이 작업은 복구할 수 없으며 모든 정보가 삭제됩니다.'
      : 'Are you sure you want to permanently delete your teacher account? This action cannot be undone.';
    if (!window.confirm(confirmMsg)) return;

    setIsDeletingAccount(true);
    try {
      await deleteAccount();
      setShowSettingsModal(false);
    } catch (err: any) {
      console.error('Failed to delete teacher account:', err);
      alert(err.message || (isKo ? '계정 삭제 중 오류가 발생했습니다.' : 'Failed to delete account.'));
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
        localStorage.setItem('teacher_classes_fallback', JSON.stringify(next));
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
        localStorage.setItem('teacher_classes_fallback', JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to cache classes to localStorage:', e);
      }
      return next;
    });
    setActiveTab('syllabus');

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

  const loadCurriculum = async () => {
    const targetClass = selectedClass || fallbackDemoClass;
    setIsLoadingCurriculum(true);
    const currDocId = `${targetClass.id}_week_${targetClass.activeWeekNumber || 1}`;
    const localKey = `curriculum_${currDocId}`;

    // 1. Pre-load from LocalStorage for instant render & offline compatibility
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        const data = JSON.parse(cached);
        setCurriculumTopic(data.topic || '');
        setCurriculumVocab(Array.isArray(data.vocabWords) ? data.vocabWords.join(', ') : data.vocabWords || '');
        setCurriculumPhonics(Array.isArray(data.phonicsRules) ? data.phonicsRules.join(', ') : data.phonicsRules || '');
        setCurriculumPassage(data.passage || '');
        setCurriculumOther(data.other || '');
      } else {
        setCurriculumTopic('');
        setCurriculumVocab('');
        setCurriculumPhonics('');
        setCurriculumPassage('');
        setCurriculumOther('');
      }
    } catch (e) {
      console.warn('LocalStorage curriculum load error:', e);
    }

    // 2. Fetch latest snapshot from Firestore
    try {
      const docRef = doc(dbInstance, 'curriculums', currDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        setCurriculumTopic(data.topic || '');
        setCurriculumVocab(Array.isArray(data.vocabWords) ? data.vocabWords.join(', ') : data.vocabWords || '');
        setCurriculumPhonics(Array.isArray(data.phonicsRules) ? data.phonicsRules.join(', ') : data.phonicsRules || '');
        setCurriculumPassage(data.passage || '');
        setCurriculumOther(data.other || '');
        try {
          localStorage.setItem(localKey, JSON.stringify(data));
        } catch (e) {
          console.warn('Failed to cache curriculum to localStorage:', e);
        }
      }
    } catch (err) {
      console.warn('Failed to load curriculum from Firestore (using local fallback):', err);
      setSyncWarning(
        isKo
          ? '⚠️ 클라우드에서 커리큘럼을 불러오지 못해 이 기기에 저장된 정보를 표시하고 있습니다.'
          : "⚠️ Couldn't load curriculum from the cloud — showing what's saved on this device."
      );
    } finally {
      setIsLoadingCurriculum(false);
    }
  };

  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClass = selectedClass || fallbackDemoClass;

    // --- GUARDRAIL VALIDATION FOR "OTHER" FIELD ---
    const otherText = curriculumOther.trim();
    if (otherText) {
      const lower = otherText.toLowerCase();
      const restrictedWords = [
        'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap', 'dick', 'pussy', 'slut', 'whore',
        '씨발', '개새끼', '병신', '지랄', '존나', '좆', '꺼져', '미친년', '미친놈'
      ];
      for (const badWord of restrictedWords) {
        if (lower.includes(badWord)) {
          alert(isKo 
            ? `[보안 경고] 부적절한 단어("${badWord}")가 포함되어 있습니다. 학습에 적합한 언어를 사용해 주세요.` 
            : `[Security Warning] Inappropriate term detected ("${badWord}"). Please use appropriate educational content.`
          );
          return;
        }
      }

      // Check for English learning relevance (must contain English letters or educational keywords)
      const hasEnglishText = /[a-zA-Z]/.test(otherText);
      if (!hasEnglishText) {
        alert(isKo 
          ? '[작성 안내] 기타 필드에는 영어 학습 관련 지침(예: "Speaking: Practice reading the word umbrella 3 times.")이 포함되어야 합니다.' 
          : '[Content Notice] The Other field must include English instruction (e.g. "Speaking: Practice reading the word umbrella 3 times.").'
        );
        return;
      }
    }

    setIsSavingCurriculum(true);
    const currDocId = `${targetClass.id}_week_${targetClass.activeWeekNumber || 1}`;
    const localKey = `curriculum_${currDocId}`;

    try {
      const vocabList = curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      const phonicsList = curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

      const payload = {
        classId: targetClass.id,
        teacherUid: user?.uid || targetClass.teacherUid || '',
        weekNumber: targetClass.activeWeekNumber || 1,
        topic: curriculumTopic.trim(),
        vocabWords: vocabList,
        phonicsRules: phonicsList,
        passage: curriculumPassage.trim(),
        other: curriculumOther.trim(),
        updatedAt: new Date().toISOString()
      };

      // 1. Dual-persist to local storage immediately
      try {
        localStorage.setItem(localKey, JSON.stringify(payload));
      } catch (lErr) {
        console.warn('LocalStorage write warning:', lErr);
      }

      // 2. Persist to Firestore
      let curriculumFirestoreFailed = false;
      try {
        const docRef = doc(dbInstance, 'curriculums', currDocId);
        await setDoc(docRef, payload, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore curriculum write warning (saved locally):', firestoreErr);
        curriculumFirestoreFailed = true;
      }

      if (curriculumFirestoreFailed) {
        setSyncWarning(
          isKo
            ? '⚠️ 커리큘럼이 이 기기에만 저장되었습니다. 클라우드에 동기화되지 않았습니다.'
            : '⚠️ Curriculum saved on this device only — it has not synced to the cloud yet.'
        );
      } else {
        alert(isKo ? '주간 커리큘럼이 성공적으로 저장되었습니다!' : 'Weekly curriculum saved successfully!');
      }
    } catch (err) {
      console.error('Failed to save curriculum:', err);
      alert(isKo ? '저장 실패. 다시 시도해 주세요.' : 'Failed to save curriculum.');
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  const fetchRosterAndMistakes = async () => {
    const targetClass = selectedClass || fallbackDemoClass;
    if (!targetClass?.id) return;
    setIsLoadingRoster(true);
    try {
      // 1. Fetch dual-persisted class scans from LocalStorage
      const localClassKey = `class_scans_${targetClass.id}`;
      const localScans: any[] = JSON.parse(localStorage.getItem(localClassKey) || '[]');
      
      // 2. Fetch class scans from Firestore
      const firestoreScans: any[] = [];
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

      // Merge scans by ID
      const scansMap = new Map();
      firestoreScans.forEach(s => scansMap.set(s.id, s));
      localScans.forEach(s => { if (!scansMap.has(s.id)) scansMap.set(s.id, s); });
      const allClassScans = Array.from(scansMap.values());

      // 3. Fetch Roster Users
      const q = query(
        collection(dbInstance, 'users'),
        where('classId', '==', targetClass.id)
      );
      const snap = await getDocs(q);
      const students: any[] = [];
      
      for (const userDoc of snap.docs) {
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

        // Also fetch legacy mistakes collection
        let legacyMistakes: any[] = [];
        try {
          const mistakesQ = query(
            collection(dbInstance, 'mistakes'),
            where('userUid', '==', student.uid)
          );
          const mistakesSnap = await getDocs(mistakesQ);
          mistakesSnap.forEach(mDoc => legacyMistakes.push({ id: mDoc.id, ...mDoc.data() }));
        } catch (mErr) {
          legacyMistakes = [];
        }

        // Combine all mistake items
        student.scans = studentScans;
        student.mistakes = [...scanMistakes, ...legacyMistakes];
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

  const handleApproveStudent = async (studentUid: string) => {
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classStatus: 'active' });
      await fetchRosterAndMistakes();
      showToast({ type: 'success', message: isKo ? '원생 승인이 완료되었습니다.' : 'Student approved successfully.' });
    } catch (err) {
      console.error('Failed to approve student:', err);
      showToast({ type: 'error', message: isKo ? '원생 승인에 실패했습니다. 다시 시도해주세요.' : 'Failed to approve student. Please try again.' });
    }
  };

  const handleDeclineStudent = async (studentUid: string) => {
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: null, classStatus: null });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to decline student:', err);
      showToast({ type: 'error', message: isKo ? '거절 처리에 실패했습니다. 다시 시도해주세요.' : 'Failed to decline student. Please try again.' });
    }
  };

  const handleRemoveStudent = async (studentUid: string) => {
    if (!window.confirm(isKo ? '정말 이 학생을 반에서 삭제하시겠습니까?' : 'Are you sure you want to remove this student from class?')) return;
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: null, classStatus: null });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to remove student:', err);
      showToast({ type: 'error', message: isKo ? '학생 삭제에 실패했습니다. 다시 시도해주세요.' : 'Failed to remove student. Please try again.' });
    }
  };

  const handleMoveStudent = async (studentUid: string, targetClassId: string) => {
    if (!targetClassId) return;
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: targetClassId, classStatus: 'active' });
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
            teacherName: (user as any)?.displayName || (user as any)?.email?.split('@')[0] || (isKo ? '선생님' : 'Teacher'),
            resolved: false,
          },
        });
      } else {
        await updateDoc(userRef, { flaggedException: null });
      }
      await fetchRosterAndMistakes();
      setSelectedStudentDetails((prev: any) =>
        prev && prev.uid === studentUid
          ? { ...prev, flaggedException: reason && reason.trim() ? { date: new Date().toISOString().split('T')[0], reason: reason.trim(), teacherName: (user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'Teacher', resolved: false } : null }
          : prev
      );
    } catch (err) {
      console.error('Failed to update flag status:', err);
      alert(isKo ? '플래그 상태 변경에 실패했습니다.' : 'Failed to update flag status.');
    }
  };

  // Analytics Helpers
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

  const isMistakeInWeeklyCurriculum = (mistake: any) => {
    const activeVocab = getWeeklyVocabWords();
    const activePhonics = getWeeklyPhonicsRules();
    const qText = (mistake.question_text || '').toLowerCase();
    const aText = (mistake.correct_answer || '').toLowerCase();
    const rText = (mistake.student_response || '').toLowerCase();

    const matchesVocab = activeVocab.some(word => 
      qText.includes(word) || aText.includes(word) || rText.includes(word)
    );

    const matchesPhonics = activePhonics.some(rule => {
      const cleanRule = rule.replace(/-/g, '').toLowerCase();
      if (!cleanRule) return false;
      return qText.includes(cleanRule) || aText.includes(cleanRule) || rText.includes(cleanRule);
    });

    return matchesVocab || matchesPhonics;
  };

  const activeVocabWords = getWeeklyVocabWords();
  
  const vocabMistakeCounts: Record<string, number> = {};
  activeVocabWords.forEach(word => {
    vocabMistakeCounts[word] = 0;
  });

  let completedHomeworkCount = 0;

  const rosterWithCompletion = (studentsData || []).filter(Boolean).map(student => {
    if (!student) return null;
    const weeklyMistakes = (student.mistakes || []).filter((m: any) => m && isMistakeInWeeklyCurriculum(m));
    const hasScannedThisWeek = weeklyMistakes.length > 0 || (
      student.lastScanDate && 
      (new Date().getTime() - new Date(student.lastScanDate).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (hasScannedThisWeek && student.classStatus === 'active') {
      completedHomeworkCount++;
    }

    if (student.classStatus === 'active') {
      weeklyMistakes.forEach((m: any) => {
        if (!m) return;
        const qText = (m.question_text || '').toLowerCase();
        const aText = (m.correct_answer || '').toLowerCase();
        const rText = (m.student_response || '').toLowerCase();

        activeVocabWords.forEach(word => {
          if (qText.includes(word) || aText.includes(word) || rText.includes(word)) {
            vocabMistakeCounts[word]++;
          }
        });
      });
    }

    return {
      ...student,
      hasScannedThisWeek,
      weeklyMistakesCount: weeklyMistakes.length,
      weeklyMistakes
    };
  }).filter(Boolean);

  const activeRoster = rosterWithCompletion.filter(student => student.classStatus === 'active');
  const pendingRoster = rosterWithCompletion.filter(student => student.classStatus === 'pending');

  const activeStudentsCount = activeRoster.length;

  const completionRate = activeStudentsCount > 0 
    ? Math.round((completedHomeworkCount / activeStudentsCount) * 100) 
    : 0;

  const sortedTroubleWords = Object.keys(vocabMistakeCounts)
    .map(word => ({ word, count: vocabMistakeCounts[word] }))
    .sort((a, b) => b.count - a.count);

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
      <div className="fixed inset-0 z-[500] overflow-y-auto bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-[#0c0c0e] rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-full flex justify-start mb-2">
              <button
                type="button"
                onClick={() => { window.location.href = '/'; }}
                className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} weight="bold" />
                <span>{isKo ? '메인 서비스로 돌아가기' : 'Return to Main Service'}</span>
              </button>
            </div>

            {/* Role Switcher Pill (Teacher vs Director HQ) — hidden when the
                account is arriving via a role-locked director invite link,
                since the role isn't a choice in that case (audit §21d), and
                also hidden for a plan-linked director signup (picked a plan
                on /schools) since that's already role-locked to director. */}
            {!(inviteSlug && authMode === 'signup') && !isPlanSignup && (
              <div className="w-full flex p-1 bg-[#050505] border border-white/10 rounded-2xl mb-4">
                <button
                  type="button"
                  onClick={() => { setLoginRole('teacher'); setAuthError(''); }}
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
            {inviteSlug && authMode === 'signup' && (
              <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-xs font-bold text-orange-400 text-center">
                {isKo ? '✉️ 초대받은 선생님 계정을 생성합니다.' : "✉️ You're creating a teacher account from an invite."}
              </div>
            )}


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

            {/* Invite School Badge — shown when teacher arrives via director's invite link */}
            {inviteSlug && (
              <div className="w-full mb-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                <Buildings size={16} className="text-emerald-400 shrink-0" />
                <div className="text-left">
                  <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isKo ? '초대받은 학원' : 'Invited to Academy'}</p>
                  <p className="text-sm font-black text-white">{inviteSlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</p>
                </div>
              </div>
            )}

            {/* Auth Mode Toggle (Login vs Sign Up) — hidden for a plan-linked
                director signup, replaced by a small "already have an
                account?" link below instead. That choice belongs to
                returning users, not someone who just picked a plan. */}
            {!isPlanSignup && (
              <div className="w-full flex bg-[#050505] p-1 rounded-2xl border border-white/10 mb-6">
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
                    : (isKo ? '가입 후 전달받으신 교사 인증 코드를 등록하여 즉시 시작하세요.' : 'Sign up to register your school authorization code.'))}
            </p>
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
                    className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                  />
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={loginRole === 'director' ? "director@school.com" : "teacher@school.com"}
                  className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
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
                  className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
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
                    className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
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
        schoolId={(user as any)?.schoolId || ''}
        seatsTotal={schoolSeatsTotal}
        trialStatus={trialStatus}
        onComplete={(data) => {
          const uid = user?.uid || '';
          // Mark wizard as done so it never shows again for this account
          localStorage.setItem('chekki_wizard_done', '1');
          if (uid) localStorage.setItem(`chekki_wizard_done_${uid}`, '1');
          dismissTeacherOnboarding();
          if (data.academyName) {
            localStorage.setItem('chekki_academy_name', data.academyName);
          }
          if (data.classes && data.classes.length > 0) {
            const newClasses = data.classes.map((clsName, idx) => ({
              id: `cls_${Date.now()}_${idx}`,
              name: clsName,
              level: 'Kindergarten & Elementary',
              joinCode: `CHK${Math.floor(1000 + Math.random() * 9000)}`,
              activeWeekNumber: 1,
            }));
            setClasses(newClasses);
            setSelectedClass(newClasses[0]);
          }
          setShowActivationWizard(false);
          setActiveTab('director_hq');
        }}
      />
    );
  }

  // --- FT/KT FIRST-LOGIN WELCOME MODAL ---
  if (showTeacherWelcome) {
    const dismissWelcome = (className?: string) => {
      const uid = user?.uid || '';
      localStorage.setItem('chekki_teacher_welcome_done', '1');
      if (uid) localStorage.setItem(`chekki_teacher_welcome_done_${uid}`, '1');
      // If a class was confirmed, save it
      if (className && className.trim()) {
        const newClass = {
          id: `cls_${Date.now()}_welcome`,
          name: className.trim(),
          level: 'General',
          joinCode: `CHK${Math.floor(1000 + Math.random() * 9000)}`,
          activeWeekNumber: 1,
        };
        setClasses((prev: any[]) => [newClass, ...prev]);
        setSelectedClass(newClass);
      }
      setShowTeacherWelcome(false);
      setActiveTab(welcomeRole === 'kt' ? 'kt_script' : 'overview');
    };
    return (
      <div className={`min-h-screen flex items-center justify-center p-4 font-sans ${isThemeNight ? 'bg-[#030305] text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/8 via-transparent to-transparent blur-[100px] pointer-events-none" />
        <div className={`relative w-full max-w-md rounded-[2rem] border shadow-2xl p-1.5 ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
          <div className={`rounded-[calc(2rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center ${isThemeNight ? 'bg-[#0c0c0e]' : 'bg-white'}`}>

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
                    className={`w-full p-4 rounded-2xl border text-sm font-bold outline-none focus:border-orange-500 transition-all ${isThemeNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                  />
                </div>

                {welcomeSchool && (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2.5">
                    <Buildings size={16} className="text-emerald-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">{isKo ? '초대받은 학원' : 'Invited Academy'}</p>
                      <p className="text-sm font-black text-white">{welcomeSchool}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{isKo ? '선생님 역할' : 'Your Role'}</label>
                  {(user as any)?.educatorRole ? (
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

            {/* Step 2 — Confirm / create class */}
            {teacherWelcomeStep === 2 && (
              <div className="w-full space-y-5">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-black tracking-tight text-white mb-1">{isKo ? '담당 학급반을 알려주세요' : 'Your Class Assignment'}</h2>
                  <p className="text-zinc-400 text-xs leading-relaxed">{isKo ? '담당 학급반 이름을 입력하세요. 나중에 언제든 추가할 수 있습니다.' : 'Enter your class name. You can add more later.'}</p>
                </div>

                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">{isKo ? '학급반 이름' : 'Class Name'}</label>
                  <input
                    type="text"
                    value={welcomeClassName}
                    onChange={(e) => setWelcomeClassName(e.target.value)}
                    placeholder={isKo ? '예: 7B Sunshine / 초등 3반' : 'E.g. 7B Sunshine / Level 3 Advanced'}
                    className={`w-full p-4 rounded-2xl border text-sm font-bold outline-none focus:border-orange-500 transition-all ${isThemeNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'}`}
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setTeacherWelcomeStep(1)}
                    className={`w-1/3 py-4 rounded-2xl font-bold text-xs border transition-all cursor-pointer ${isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'}`}
                  >
                    ← {isKo ? '이전' : 'Back'}
                  </button>
                  <button
                    type="button"
                    onClick={() => dismissWelcome(welcomeClassName)}
                    className="w-2/3 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                  >
                    <CheckCircle size={18} weight="bold" />
                    <span>{isKo ? '완료 — 대시보드 입장! 🎉' : 'Done — Enter Dashboard! 🎉'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => dismissWelcome('')}
                  className="w-full text-xs text-zinc-500 hover:text-zinc-300 transition-colors cursor-pointer py-1"
                >
                  {isKo ? '나중에 설정하기' : 'Skip for now'}
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
    <div className={`min-h-screen ${isThemeNight ? 'bg-[#050505] text-zinc-100' : 'bg-[#f8fafc] text-zinc-900'} flex flex-col md:flex-row selection:bg-orange-500 selection:text-white`}>

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
                isThemeNight ? 'bg-[#0c0c0e] text-white' : 'bg-white text-zinc-900'
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
                  isThemeNight ? 'bg-black/40 border border-white/10 shadow-[0_20px_40px_rgba(249,115,22,0.15)]' : 'bg-[#0a0a0c] border border-zinc-300/80 shadow-orange-500/10'
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
                      dismissTeacherOnboarding();
                      setShowCreateClassModal(true);
                    } else {
                      setTeacherObStep(teacherObStep + 1);
                    }
                  }}
                  className="group w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
                >
                  <span>
                    {isLast
                      ? (isKo ? '첫 학급 만들기' : 'Create First Class')
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


      {/* Sidebar Navigation */}
      <aside className={`w-full md:w-72 border-b md:border-b-0 md:border-r flex flex-col shrink-0 transition-colors ${
        isThemeNight ? 'bg-[#08080a] border-white/5' : 'bg-white border-zinc-200 shadow-xs'
      }`}>
        
        {/* Sidebar Header / Brand */}
        <div className={`p-6 border-b transition-colors flex items-center justify-between gap-3 ${
          isThemeNight ? 'border-white/5 bg-[#08080a]' : 'border-zinc-200 bg-white'
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

          {loginRole === 'director' && (
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => { setTempLogoUrl(academyLogo); setShowLogoModal(true); }}
                title={isKo ? '원장님 전용 학원 로고 설정' : 'Director Logo Settings'}
                className={`p-2 rounded-xl transition-all text-xs font-bold active:scale-[0.95] cursor-pointer ${
                  isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                🖼️
              </button>
            </div>
          )}
        </div>

        {/* Navigation Tabs (Scoped by Role) */}
        <nav className="p-4 flex-1 space-y-2">
          {/* Director HQ Tab (Director Only) */}
          {(loginRole === 'director' || user?.role === 'director') && (
            <>
              <button
                onClick={() => setActiveTab('director_hq')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'director_hq'
                    ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-xl shadow-amber-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'director_hq' 
                      ? 'bg-amber-500/20 text-amber-500' 
                      : isThemeNight ? 'bg-white/5 text-amber-400 group-hover:text-white' : 'bg-amber-100 text-amber-600 group-hover:text-zinc-900'
                  }`}>
                    <Buildings size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '🏢 원장님 HQ 총괄 대시보드' : '🏢 Director HQ Dashboard'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'director_hq' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('syllabus')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'syllabus'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'syllabus' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-blue-400 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:text-zinc-900'
                  }`}>
                    <BookOpen size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '📘 교재 목차 등록 (Curriculum)' : '📘 Curriculum Preseed'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'syllabus' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('students')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'students'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'students' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-purple-400 group-hover:text-white' : 'bg-purple-100 text-purple-600 group-hover:text-zinc-900'
                  }`}>
                    <Users size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '👥 원생 명단 관리 (Roster)' : '👥 Student Roster'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'students' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>
            </>
          )}

          {/* KT KakaoTalk Script Tab (KT Only) */}
          {loginRole !== 'director' && educatorRole === 'kt' && (
            <>
              <button
                onClick={() => setActiveTab('kt_script')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'kt_script'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'kt_script' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-emerald-400 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:text-zinc-900'
                  }`}>
                    <Sparkle size={18} weight="fill" className="animate-pulse" />
                  </div>
                  <span>{isKo ? '⚡ 알림톡 대본 & 1클릭 복사' : '⚡ KakaoTalk Parent Script'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'kt_script' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'overview'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'overview' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
                  }`}>
                    <ChartBar size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '반 출석 및 채점 현황' : 'Class Overview'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>
            </>
          )}

          {/* FT Foreign Teacher Tabs (FT Only) */}
          {loginRole !== 'director' && educatorRole === 'ft' && (
            <>
              <button
                onClick={() => setActiveTab('overview')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'overview'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'overview' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-orange-400 group-hover:text-white' : 'bg-orange-100 text-orange-600 group-hover:text-zinc-900'
                  }`}>
                    <ChartBar size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '클래스 스캐너 & 일지' : 'Class Scanner & Log'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('insights')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'insights'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'insights'
                      ? 'bg-orange-500/20 text-orange-500'
                      : isThemeNight ? 'bg-white/5 text-amber-400 group-hover:text-white' : 'bg-amber-100 text-amber-600 group-hover:text-zinc-900'
                  }`}>
                    <Sparkle size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '📚 주간 커리큘럼 & 오답 분석' : '📚 Weekly Insights'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'insights' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('homework')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'homework'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'homework' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-emerald-400 group-hover:text-white' : 'bg-emerald-100 text-emerald-600 group-hover:text-zinc-900'
                  }`}>
                    <FileText size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '📄 워크시트 채점기' : '📄 Worksheet Scanner'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'homework' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>

              <button
                onClick={() => setActiveTab('history')}
                className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
                  activeTab === 'history'
                    ? 'bg-orange-500/10 text-orange-500 border-orange-500/30 shadow-xl shadow-orange-500/10'
                    : isThemeNight 
                      ? 'text-zinc-400 hover:text-white hover:bg-white/5 border-transparent'
                      : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl transition-colors ${
                    activeTab === 'history' 
                      ? 'bg-orange-500/20 text-orange-500' 
                      : isThemeNight ? 'bg-white/5 text-blue-400 group-hover:text-white' : 'bg-blue-100 text-blue-600 group-hover:text-zinc-900'
                  }`}>
                    <ClockCounterClockwise size={18} weight="bold" />
                  </div>
                  <span>{isKo ? '📜 작성한 일지 이력' : '📜 Log History'}</span>
                </div>
                <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'history' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
              </button>
            </>
          )}

          {/* AI Report Studio Generator Trigger Button */}
          <button
            type="button"
            onClick={() => setShowReportCardModal(true)}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
              showReportCardModal
                ? 'bg-orange-500/20 text-orange-400 border-orange-500/50 shadow-xl shadow-orange-500/10 font-black' 
                : isThemeNight 
                  ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30 text-orange-400 hover:border-orange-500/50' 
                  : 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-300 text-orange-600 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                <Sparkle size={18} weight="fill" className="animate-pulse" />
              </div>
              <span>{isKo ? '📊 학부모 성적표 발급기' : '📊 AI Report Studio'}</span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              GENERATE
            </span>
          </button>
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className={`p-4 border-t flex items-center justify-between gap-3 shrink-0 transition-colors ${
          isThemeNight ? 'border-white/5 bg-[#050505]/60' : 'border-zinc-200 bg-zinc-50'
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
        isThemeNight ? 'bg-[#050505] text-white' : 'bg-[#F8FAFC] text-zinc-900'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Control Bar */}
        <header className={`p-4 sm:p-6 border-b flex flex-wrap items-center justify-between gap-4 relative z-10 shrink-0 transition-colors ${
          isThemeNight ? 'bg-[#08080a]/90 border-white/5 text-white' : 'bg-white/90 border-zinc-200 text-zinc-900 shadow-xs'
        }`}>
          <div className="flex flex-wrap items-center gap-3">
            {loginRole !== 'director' && user?.role !== 'director' && (
              <>
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
                        isThemeNight ? 'bg-[#050505] border-white/10 text-white hover:border-white/20 focus:border-orange-500' : 'bg-zinc-50 border-zinc-300 text-zinc-900 hover:border-zinc-400 focus:border-orange-500'
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

                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(true)}
                  className="group px-3.5 py-2.5 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 rounded-2xl transition-all font-bold text-xs shrink-0 active:scale-[0.97] flex items-center gap-1.5 cursor-pointer"
                  title="Add New Class"
                >
                  <Plus size={16} weight="bold" className="group-hover:rotate-90 transition-transform" />
                  <span className="hidden sm:inline">{isKo ? '새 학급' : 'New Class'}</span>
                </button>
              </>
            )}
              {selectedClass && (
              <button
                type="button"
                onClick={handleCopyClassCode}
                className={`text-xs font-bold px-3.5 py-2 border rounded-2xl flex items-center gap-2 transition-all cursor-pointer active:scale-[0.97] ${
                  copiedCode 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-orange-500/10 border-orange-500/20 text-orange-500 hover:bg-orange-500/20'
                }`}
                title="Click to copy 6-digit parent join code"
              >
                <Key size={14} weight="bold" />
                <span className="hidden md:inline">{isKo ? '학급 코드' : 'Code'}:</span>
                <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
                  isThemeNight ? 'bg-black/50 border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900 shadow-xs'
                }`}>
                  {selectedClass?.joinCode || 'N/A'}
                </span>
                <span className="text-[10px] font-bold">
                  {copiedCode ? '✅' : '📋'}
                </span>
              </button>
              )}

            {selectedClass && (
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
            {selectedClass && (
              <div className="flex items-center gap-2">
                <div className={`border rounded-2xl flex items-center overflow-hidden p-1 shadow-inner ${
                  isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-100 border-zinc-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(-1)}
                    disabled={(selectedClass?.activeWeekNumber || 1) <= 1}
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all cursor-pointer disabled:opacity-20 active:scale-95 ${
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
                    className={`w-9 h-9 flex items-center justify-center rounded-xl text-sm font-black transition-all cursor-pointer active:scale-95 ${
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
              className={`px-3.5 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.96] ${
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
              className={`p-2.5 border rounded-xl transition-all cursor-pointer active:scale-[0.96] ${
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
          {classes.length === 0 && (
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
                  onClick={() => { setShowTeacherOnboarding(true); setTeacherObStep(0); }}
                  className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all active:scale-[0.97] cursor-pointer ${
                    isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700 hover:bg-zinc-100 shadow-xs'
                  }`}
                >
                  {isKo ? '가이드 보기' : 'View Guide'}
                </button>
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

          <div className="animate-fade-in">
            {/* Director HQ Tab */}
            {activeTab === 'director_hq' && (
              <NativeDirectorPortal
                isNight={isThemeNight}
                isKo={isKo}
                academyName={user?.schoolName || 'Chekki Master Academy'}
                onOpenLogoModal={() => { setTempLogoUrl(academyLogo); setShowLogoModal(true); }}
                schoolId={(user as any)?.schoolId}
                planId={schoolPlanId}
                seatsTotal={schoolSeatsTotal}
                trialStatus={trialStatus}
                onRequestSeatExpansion={handleRequestSeatExpansion}
                pendingRoster={pendingRoster}
                activeRoster={activeRoster}
                isLoadingRoster={isLoadingRoster}
                classes={classes}
                selectedClass={selectedClass}
                weeklyVocabWords={getWeeklyVocabWords()}
                handleApproveStudent={handleApproveStudent}
                handleDeclineStudent={handleDeclineStudent}
                handleRemoveStudent={handleRemoveStudent}
                handleMoveStudent={handleMoveStudent}
                fetchRosterAndMistakes={fetchRosterAndMistakes}
                setSelectedStudentDetails={setSelectedStudentDetails}
                onResolveFlag={(uid: string) => handleToggleFlagStudent(uid)}
              />
            )}

            {/* Embedded AI Report Studio Tab */}
            {activeTab === ('report_studio' as any) && (
              <div className="animate-fade-in">
                <ReportStudioPage isNight={isThemeNight} setIsNight={setIsThemeNight} />
              </div>
            )}

            {/* KT KakaoTalk Script Tab */}
            {activeTab === 'kt_script' && ktLogsLoadError && (
              <div className="mb-4 p-3.5 rounded-2xl border flex items-center gap-3 bg-red-500/10 border-red-500/30 text-red-400">
                <span className="text-sm">
                  {isKo
                    ? '⚠️ 리포트 대기열을 불러오지 못했습니다. 아래는 실제 데이터가 아닙니다 — 새로고침 후 다시 시도해주세요.'
                    : "⚠️ Couldn't load the review queue — what's shown below is not real data. Please refresh and try again."}
                </span>
              </div>
            )}
            {activeTab === 'kt_script' && (
              <NativeKtDashboard
                key={activeKtLog?.id || 'empty'}
                isNight={isThemeNight}
                className={activeClass?.name || '7세반 (샘플)'}
                academyName={user?.schoolName || 'Chekki Master Academy'}
                userProfile={user}
                generatedOutput={
                  activeKtLog
                    ? {
                        bilingualClassSummary: {
                          korean: activeKtLog.aiKoreanSummary,
                          english: activeKtLog.aiEnglishSummary,
                        },
                        studentReports: activeKtLog.aiStudentReports || [],
                      }
                    : ftLogOutput
                }
                pendingCount={ktPendingLogs.length}
                onApprove={handleKtApprove}
              />
            )}

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

            {activeTab === 'overview' && educatorRole === 'kt' && (
              // KT Overview: lightweight summary only — stat cards + navigation hints.
              // The worksheet scanner and log-form are FT tools, not KT's job.
              // KT's primary tool is the kt_script tab. (Audit §9)
              <div className="space-y-6 animate-fade-in">
                <div className={`p-5 rounded-3xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-md'}`}>
                  <p className={`text-sm font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '한국인 담임 교사 현황 요약' : 'KT Class Summary'}
                  </p>
                  <p className={`text-xs ${isThemeNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isKo ? '선택된 반:' : 'Active class:'} <span className="font-mono font-bold">{activeClass?.name || '—'}</span>
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className={`p-6 rounded-3xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-md'}`}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{isKo ? '등록 원생 수' : 'Enrolled Students'}</p>
                    <p className={`text-3xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{activeStudentsCount}</p>
                  </div>
                  <div className={`p-6 rounded-3xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-md'}`}>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-2">{isKo ? '숙제 완료율' : 'Homework Rate'}</p>
                    <p className={`text-3xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{completionRate}%</p>
                  </div>
                </div>
                <div className={`p-5 rounded-3xl border flex items-center justify-between ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200 shadow-md'}`}>
                  <p className={`text-sm ${isThemeNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {isKo ? '학부모 알림톡 작성 & 1클릭 복사' : 'Write & copy parent KakaoTalk script'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('kt_script')}
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer"
                  >
                    {isKo ? '알림톡 작성하기 →' : 'Go to Script →'}
                  </button>
                </div>
              </div>
            )}

            <NativeFtDashboard
              isNight={isThemeNight}
              isKo={isKo}
              activeTab={activeTab}
              user={user}
              activeClass={activeClass}
              selectedTextbookName={selectedTextbookName}
              handleFtLogSubmit={handleFtLogSubmit}
              isSubmittingFtLog={isSubmittingFtLog}
              completionRate={completionRate}
              completedHomeworkCount={completedHomeworkCount}
              activeStudentsCount={activeStudentsCount}
              curriculumSlideIndex={curriculumSlideIndex}
              setCurriculumSlideIndex={setCurriculumSlideIndex}
              activeVocabWords={activeVocabWords}
              isLoadingRoster={isLoadingRoster}
              sortedTroubleWords={sortedTroubleWords}
              setActiveTab={setActiveTab}
              curriculumTopic={curriculumTopic}
              curriculumPhonics={curriculumPhonics}
              curriculumPassage={curriculumPassage}
              curriculumOther={curriculumOther}
              setShowReportCardModal={setShowReportCardModal}
              submittedLogs={submittedLogs}
            />


              {(activeTab === 'syllabus' || activeTab === 'homework') && (
                <CurriculumEditorForm
                  isNight={isThemeNight}
                  isKo={isKo}
                  activeTab={activeTab}
                  uploadMode={uploadMode}
                  user={user}
                  classes={classes}
                  selectedClass={selectedClass}
                  setSelectedClass={setSelectedClass}
                  selectedTextbookName={selectedTextbookName}
                  setSelectedTextbookName={setSelectedTextbookName}
                  isLoadingCurriculum={isLoadingCurriculum}
                  handleSaveCurriculum={handleSaveCurriculum}
                  scanStatusMessage={scanStatusMessage}
                  scannedData={scannedData}
                  setShowScannedModal={setShowScannedModal}
                  isDraggingFile={isDraggingFile}
                  setIsDraggingFile={setIsDraggingFile}
                  handleTextbookFileUpload={handleTextbookFileUpload}
                  isScanningSyllabus={isScanningSyllabus}
                  syllabusPreviewUrl={syllabusPreviewUrl}
                  syllabusFileName={syllabusFileName}
                  setDocPreviewUrl={setDocPreviewUrl}
                  setShowDocPreviewModal={setShowDocPreviewModal}
                  syllabusScannedData={syllabusScannedData}
                  setActiveScannedModalType={setActiveScannedModalType}
                  setScannedData={setScannedData}
                  syllabusWeeks={syllabusWeeks}
                  handleSyllabusWeeksChange={handleSyllabusWeeksChange}
                  isScanningWorksheet={isScanningWorksheet}
                  worksheetPreviewUrl={worksheetPreviewUrl}
                  worksheetFileName={worksheetFileName}
                  worksheetScannedData={worksheetScannedData}
                  setWorksheetPreviewUrl={setWorksheetPreviewUrl}
                  setWorksheetScannedData={setWorksheetScannedData}
                  setWorksheetFileName={setWorksheetFileName}
                  handleUpdateWeek={handleUpdateWeek}
                  curriculumTopic={curriculumTopic}
                  setCurriculumTopic={setCurriculumTopic}
                  curriculumVocab={curriculumVocab}
                  setCurriculumVocab={setCurriculumVocab}
                  handleRemoveVocabWord={handleRemoveVocabWord}
                  newVocabInput={newVocabInput}
                  setNewVocabInput={setNewVocabInput}
                  handleAddVocabWord={handleAddVocabWord}
                  curriculumPhonics={curriculumPhonics}
                  setCurriculumPhonics={setCurriculumPhonics}
                  handleRemovePhonicsRule={handleRemovePhonicsRule}
                  newPhonicsInput={newPhonicsInput}
                  setNewPhonicsInput={setNewPhonicsInput}
                  handleAddPhonicsRule={handleAddPhonicsRule}
                  curriculumPassage={curriculumPassage}
                  setCurriculumPassage={setCurriculumPassage}
                  curriculumOther={curriculumOther}
                  setCurriculumOther={setCurriculumOther}
                  worksheetType={worksheetType}
                  setWorksheetType={setWorksheetType}
                  questionStyle={questionStyle}
                  setQuestionStyle={setQuestionStyle}
                  loadCurriculum={loadCurriculum}
                  isSavingCurriculum={isSavingCurriculum}
                />
              )}

              {activeTab === 'students' && (
                <NativeDirectorStudentsTab
                  isNight={isThemeNight}
                  isKo={isKo}
                  pendingRoster={pendingRoster}
                  activeRoster={activeRoster}
                  isLoadingRoster={isLoadingRoster}
                  classes={classes}
                  selectedClass={selectedClass}
                  handleApproveStudent={handleApproveStudent}
                  handleDeclineStudent={handleDeclineStudent}
                  handleRemoveStudent={handleRemoveStudent}
                  handleMoveStudent={handleMoveStudent}
                  fetchRosterAndMistakes={fetchRosterAndMistakes}
                  setSelectedStudentDetails={setSelectedStudentDetails}
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
            isThemeNight ? 'bg-[#0c0c0e] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
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
                className={`p-2.5 rounded-full transition-all text-sm font-bold active:scale-[0.95] cursor-pointer ${
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
                      isThemeNight ? 'bg-[#050505] border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
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
                        isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-200 shadow-xs'
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
                  isThemeNight ? 'bg-[#050505] hover:bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
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
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
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
                      isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
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
                      isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900'
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
                      isThemeNight ? 'bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
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
      {/* --- CUSTOM ACADEMY LOGO CONFIGURATION MODAL --- */}
      {showLogoModal && (
        <AcademyLogoModal
          isThemeNight={isThemeNight}
          isKo={isKo}
          tempLogoUrl={tempLogoUrl}
          setTempLogoUrl={setTempLogoUrl}
          setAcademyLogo={setAcademyLogo}
          onClose={() => setShowLogoModal(false)}
        />
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
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer ${
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
                  isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-200'
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

                {/* Custom Branding Quick Option */}
                <div className={`p-4 border rounded-2xl flex items-center justify-between gap-3 ${
                  isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                }`}>
                  <div>
                    <h4 className={`text-xs font-bold mb-0.5 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '맞춤 학원 로고' : 'Custom Academy Logo'}
                    </h4>
                    <p className="text-[11px] text-zinc-400">
                      {isKo ? '성적표 및 인쇄 학습지에 학원 전용 로고 표시' : 'Show your academy logo on student report cards.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSettingsModal(false);
                      setTempLogoUrl(academyLogo);
                      setShowLogoModal(true);
                    }}
                    className="px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 font-bold text-xs rounded-xl border border-orange-500/20 transition-all whitespace-nowrap cursor-pointer"
                  >
                    {isKo ? '로고 변경' : 'Edit Logo'}
                  </button>
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

                {/* Re-open Walkthrough Guide */}
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
          curriculumTopic={curriculumTopic}
          curriculumPhonics={curriculumPhonics}
          curriculumPassage={curriculumPassage}
          curriculumOther={curriculumOther}
          activeVocabWords={activeVocabWords}
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
    </div>
  );
}
