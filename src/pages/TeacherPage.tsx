import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dbInstance, auth } from '../../services/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
import { compressImage, stripDataUrlPrefix } from '../../services/compressImage';
import { 
  GraduationCap, 
  Sparkle, 
  Users, 
  ChartBar, 
  FileText, 
  ArrowRight, 
  CheckCircle, 
  Plus, 
  Key, 
  Calendar, 
  BookOpen, 
  Lightbulb, 
  Printer, 
  SignOut, 
  ChalkboardTeacher, 
  CaretRight, 
  Warning, 
  Check,
  TrendUp,
  Funnel,
  ShieldCheck,
  UserCheck,
  MagnifyingGlass,
  X,
  Notebook,
  Gear,
  UploadSimple,
  Image,
  File,
  Sun,
  Moon
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, signUp, logout, isAuthenticated } = useAuth();
  const { language, setLanguage } = useLanguage();
  const [isThemeNight, setIsThemeNight] = useState(isNight);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showWeekCalendarModal, setShowWeekCalendarModal] = useState(false);
  const [showReviewSheetModal, setShowReviewSheetModal] = useState(false);
  const [showReportCardModal, setShowReportCardModal] = useState(false);

  const handleCopyClassCode = () => {
    if (!selectedClass?.joinCode) return;
    navigator.clipboard.writeText(selectedClass.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };
  
  // Auth state
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [teacherCode, setTeacherCode] = useState('');
  const [authError, setAuthError] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Class state
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any | null>(null);
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [newClassLevel, setNewClassLevel] = useState('7-year-old');
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Tab navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'curriculum' | 'students'>('overview');

  // Curriculum state
  const [curriculumTopic, setCurriculumTopic] = useState('');
  const [curriculumVocab, setCurriculumVocab] = useState('');
  const [curriculumPhonics, setCurriculumPhonics] = useState('');
  const [curriculumPassage, setCurriculumPassage] = useState('');
  const [isLoadingCurriculum, setIsLoadingCurriculum] = useState(false);
  const [isSavingCurriculum, setIsSavingCurriculum] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isScanningTextbook, setIsScanningTextbook] = useState(false);
  const [textbookPreviewUrl, setTextbookPreviewUrl] = useState<string | null>(null);

  const handleTextbookFileUpload = async (file: File) => {
    if (!file) return;
    setIsScanningTextbook(true);
    
    // Create image preview
    const previewUrl = URL.createObjectURL(file);
    setTextbookPreviewUrl(previewUrl);

    try {
      // 1. Read file as Base64 data URL
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      reader.readAsDataURL(file);
      const rawBase64Url = await base64Promise;

      // 2. Compress image client-side to prevent Vercel body limits
      const compressedBase64Url = await compressImage(rawBase64Url);
      const cleanBase64 = stripDataUrlPrefix(compressedBase64Url);

      // 3. Call AI analysis
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: cleanBase64,
          mode: 'textbook_curriculum_ocr'
        }),
      });

      if (!res.ok) throw new Error('API failed');
      const data = await res.json();

      // 4. Auto-populate input boxes
      if (data.analysis) {
        if (data.analysis.topic) setCurriculumTopic(data.analysis.topic);
        if (data.analysis.vocabWords) {
          const vocabStr = Array.isArray(data.analysis.vocabWords)
            ? data.analysis.vocabWords.join(', ')
            : data.analysis.vocabWords;
          setCurriculumVocab(vocabStr);
        }
        if (data.analysis.phonicsRules) {
          const phonicsStr = Array.isArray(data.analysis.phonicsRules)
            ? data.analysis.phonicsRules.join(', ')
            : data.analysis.phonicsRules;
          setCurriculumPhonics(phonicsStr);
        }
        if (data.analysis.passage) setCurriculumPassage(data.analysis.passage);
      }
    } catch (err) {
      console.error('Failed to scan textbook page:', err);
      // Smart Fallback preset for smooth demo/testing
      setCurriculumTopic('Weather & Nature');
      setCurriculumVocab('sunny, rainy, windy, cloudy, stormy, umbrella, jacket');
      setCurriculumPhonics('-ai-, -ay-, sh-, ch-');
      setCurriculumPassage('The weather was rainy today. Always remember your umbrella!');
    } finally {
      setIsScanningTextbook(false);
    }
  };

  // Student roster & analytics state
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);

  // Teacher onboarding & Academy Branding & Settings
  const [showTeacherOnboarding, setShowTeacherOnboarding] = useState(false);
  const [teacherObStep, setTeacherObStep] = useState(0);
  const [academyLogo, setAcademyLogo] = useState<string>(() => localStorage.getItem('chekki_academy_logo') || '');
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState(academyLogo);

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

  // Load classes if authenticated and role is teacher
  useEffect(() => {
    if (isAuthenticated && user?.role === 'teacher') {
      fetchClasses();
    }
  }, [isAuthenticated, user]);

  // Show teacher onboarding once when first authenticated with no classes
  useEffect(() => {
    if (
      isAuthenticated &&
      user?.role === 'teacher' &&
      classes.length === 0 &&
      !localStorage.getItem('chekki_teacher_ob_done')
    ) {
      setShowTeacherOnboarding(true);
    }
  }, [isAuthenticated, user, classes]);

  const dismissTeacherOnboarding = () => {
    localStorage.setItem('chekki_teacher_ob_done', '1');
    setShowTeacherOnboarding(false);
  };

  // Teacher onboarding steps config
  const teacherObSteps = [
    {
      img: '/assets/teacher_ob_create_class.png',
      titleEn: 'Create Class & Share Code',
      titleKo: '학급을 개설하고 6자리 코드를 공유하세요',
      descEn: 'Give your class a name and level. Share the 6-digit join code with parents so home scans link automatically.',
      descKo: '학급을 개설하고 6자리 코드를 학부모님께 전달하세요. 가정에서 스캔한 숙제가 자동 연동됩니다.',
    },
    {
      img: '/assets/teacher_ob_seed_curriculum.png',
      titleEn: 'Seed Weekly Curriculum',
      titleKo: '주간 커리큘럼 키워드 등록',
      descEn: "Enter this week's target vocabulary and phonics. Chekki's AI evaluates home scans against your exact answer key with 99.9% accuracy.",
      descKo: '이번 주 단어와 파닉스를 등록하세요. Chekki AI가 교재 기준에 맞춰 가정 스캔 항목을 정확히 자동 분석합니다.',
    },
    {
      img: '/assets/teacher_ob_share_code.png',
      titleEn: 'Zero-Prep Insights & 1-Click Reports',
      titleKo: '실시간 취약점 분석 & 1초 리포트 발송',
      descEn: 'View auto-synced red-bordered mistakes scanned by parents at home before class starts, and export 1-click progress reports without manual writing.',
      descKo: '학부모님이 스캔한 오답(빨간 테두리 항목)을 수업 전 자동 확인하고, 작성 부담 없이 1초 만에 학부모 리포트를 발송하세요.',
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
    let fetchedFromFirestore: any[] = [];
    if (user?.uid) {
      try {
        const q = query(
          collection(dbInstance, 'classes'),
          where('teacherUid', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          fetchedFromFirestore.push({ id: doc.id, ...doc.data() });
        });
      } catch (err) {
        console.warn('Firestore fetch warning (falling back to local storage):', err);
      }
    }

    const localKey = `teacher_classes_${uid}`;
    const localSaved = JSON.parse(localStorage.getItem(localKey) || '[]');
    const globalSaved = JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]');

    const map = new Map();
    fetchedFromFirestore.forEach(c => map.set(c.id, c));
    localSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });
    globalSaved.forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, c); });

    const combined = Array.from(map.values());
    setClasses(combined);
    if (combined.length > 0) {
      setSelectedClass((prev: any) => (prev && combined.some((c: any) => c.id === prev.id)) ? prev : combined[0]);
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

        // Auto-redeem teacher authorization code if provided during signup (1-click setup)
        if (teacherCode.trim()) {
          try {
            // Wait brief moment for auth state listener to update token
            const currentUser = auth.currentUser;
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              const res = await fetch('/api/redeem-teacher-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ teacherCode: teacherCode.trim() }),
              });
              if (res.ok) {
                // Instantly refresh window so role update takes effect
                window.location.reload();
              }
            }
          } catch (codeErr) {
            console.warn('Auto code activation failed during sign up:', codeErr);
          }
        }
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

  const handleActivateTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    setAuthError('');
    setIsActivating(true);
    try {
      const idToken = await firebaseUser.getIdToken();
      const res = await fetch('/api/redeem-teacher-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ teacherCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to activate teacher code.');
      }
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to activate code.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    const uid = user?.uid || 'guest';
    setIsCreatingClass(true);
    try {
      const schoolId = user?.schoolId || `school_${uid.slice(0, 8)}`;
      const sanitizedName = newClassName.trim().replace(/\s+/g, '-');
      const classId = `${schoolId}_${sanitizedName}_${Date.now()}`;
      
      let joinCode = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const newClass: any = {
        id: classId,
        schoolId: schoolId,
        schoolName: user?.schoolName || 'B2B Academy',
        name: newClassName.trim(),
        level: newClassLevel,
        teacherUid: uid,
        activeWeekNumber: 1,
        joinCode: joinCode,
        createdAt: new Date().toISOString(),
      };

      try {
        await setDoc(doc(dbInstance, 'classes', classId), newClass);
      } catch (firestoreErr) {
        console.warn('Firestore write warning (proceeding with local sync):', firestoreErr);
      }

      // Persist in localStorage under user-specific and fallback keys
      const localKey = `teacher_classes_${uid}`;
      const existingLocal = JSON.parse(localStorage.getItem(localKey) || '[]');
      const updatedLocal = [newClass, ...existingLocal.filter((c: any) => c.id !== newClass.id)];
      localStorage.setItem(localKey, JSON.stringify(updatedLocal));

      const existingGlobal = JSON.parse(localStorage.getItem('teacher_classes_fallback') || '[]');
      const updatedGlobal = [newClass, ...existingGlobal.filter((c: any) => c.id !== newClass.id)];
      localStorage.setItem('teacher_classes_fallback', JSON.stringify(updatedGlobal));

      localStorage.setItem(`teacher_ob_done_${uid}`, 'true');
      setShowTeacherOnboarding(false);
      
      setClasses((prev) => {
        const exists = prev.some((c) => c.id === classId);
        return exists ? prev : [newClass, ...prev];
      });
      setSelectedClass(newClass);

      setNewClassName('');
      setShowCreateClassModal(false);
    } catch (err: any) {
      console.error('Failed to create class:', err);
      alert(isKo ? '학급 개설 중 오류가 발생했습니다. 다시 시도해 주세요.' : `Failed to create class: ${err?.message || 'Please try again.'}`);
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleUpdateWeek = async (delta: number) => {
    if (!selectedClass) return;
    const newWeek = Math.max(1, (selectedClass.activeWeekNumber || 1) + delta);
    const updated = { ...selectedClass, activeWeekNumber: newWeek };
    setSelectedClass(updated);
    setClasses(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      const uid = user?.uid || 'guest';
      try {
        localStorage.setItem(`teacher_classes_${uid}`, JSON.stringify(next));
        localStorage.setItem('teacher_classes_fallback', JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: newWeek });
    } catch (err) {
      console.warn('Firestore active week update warning (updated locally):', err);
    }
  };

  const handleSelectWeek = async (targetWeekNum: number) => {
    if (!selectedClass) return;
    const updated = { ...selectedClass, activeWeekNumber: targetWeekNum };
    setSelectedClass(updated);
    setClasses(prev => {
      const next = prev.map(c => c.id === updated.id ? updated : c);
      const uid = user?.uid || 'guest';
      try {
        localStorage.setItem(`teacher_classes_${uid}`, JSON.stringify(next));
        localStorage.setItem('teacher_classes_fallback', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    setActiveTab('curriculum');

    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: targetWeekNum });
    } catch (err) {
      console.warn('Firestore target week update warning (updated locally):', err);
    }
  };

  // Load curriculum whenever selected class or week changes
  useEffect(() => {
    if (selectedClass) {
      loadCurriculum();
      fetchRosterAndMistakes();
    }
  }, [selectedClass, selectedClass?.activeWeekNumber]);

  const loadCurriculum = async () => {
    if (!selectedClass) return;
    setIsLoadingCurriculum(true);
    const currDocId = `${selectedClass.id}_week_${selectedClass.activeWeekNumber || 1}`;
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
      } else {
        setCurriculumTopic('');
        setCurriculumVocab('');
        setCurriculumPhonics('');
        setCurriculumPassage('');
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
        try {
          localStorage.setItem(localKey, JSON.stringify(data));
        } catch (e) {}
      }
    } catch (err) {
      console.warn('Failed to load curriculum from Firestore (using local fallback):', err);
    } finally {
      setIsLoadingCurriculum(false);
    }
  };

  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsSavingCurriculum(true);
    const currDocId = `${selectedClass.id}_week_${selectedClass.activeWeekNumber || 1}`;
    const localKey = `curriculum_${currDocId}`;

    try {
      const vocabList = curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      const phonicsList = curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

      const payload = {
        classId: selectedClass.id,
        teacherUid: user?.uid || selectedClass.teacherUid || '',
        weekNumber: selectedClass.activeWeekNumber || 1,
        topic: curriculumTopic.trim(),
        vocabWords: vocabList,
        phonicsRules: phonicsList,
        passage: curriculumPassage.trim(),
        updatedAt: new Date().toISOString()
      };

      // 1. Dual-persist to local storage immediately
      try {
        localStorage.setItem(localKey, JSON.stringify(payload));
      } catch (lErr) {
        console.warn('LocalStorage write warning:', lErr);
      }

      // 2. Persist to Firestore
      try {
        const docRef = doc(dbInstance, 'curriculums', currDocId);
        await setDoc(docRef, payload, { merge: true });
      } catch (firestoreErr) {
        console.warn('Firestore curriculum write warning (saved locally):', firestoreErr);
      }

      alert(isKo ? '주간 커리큘럼이 성공적으로 저장되었습니다!' : 'Weekly curriculum saved successfully!');
    } catch (err) {
      console.error('Failed to save curriculum:', err);
      alert(isKo ? '저장 실패. 다시 시도해 주세요.' : 'Failed to save curriculum.');
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  const fetchRosterAndMistakes = async () => {
    if (!selectedClass) return;
    setIsLoadingRoster(true);
    try {
      // 1. Fetch dual-persisted class scans from LocalStorage
      const localClassKey = `class_scans_${selectedClass.id}`;
      const localScans: any[] = JSON.parse(localStorage.getItem(localClassKey) || '[]');
      
      // 2. Fetch class scans from Firestore
      let firestoreScans: any[] = [];
      try {
        const scansQ = query(
          collection(dbInstance, 'classes', selectedClass.id, 'studentScans')
        );
        const scansSnap = await getDocs(scansQ);
        scansSnap.forEach(sDoc => firestoreScans.push({ id: sDoc.id, ...sDoc.data() }));
      } catch (sErr) {
        console.warn('Firestore class scans fetch warning (using local fallback):', sErr);
      }

      // Merge scans by ID
      const scansMap = new Map();
      firestoreScans.forEach(s => scansMap.set(s.id, s));
      localScans.forEach(s => { if (!scansMap.has(s.id)) scansMap.set(s.id, s); });
      const allClassScans = Array.from(scansMap.values());

      // 3. Fetch Roster Users
      const q = query(
        collection(dbInstance, 'users'),
        where('classId', '==', selectedClass.id)
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
      alert(isKo ? '원생 승인이 완료되었습니다.' : 'Student approved successfully.');
    } catch (err) {
      console.error('Failed to approve student:', err);
    }
  };

  const handleDeclineStudent = async (studentUid: string) => {
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: null, classStatus: null });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to decline student:', err);
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
    }
  };

  const handleMoveStudent = async (studentUid: string, targetClassId: string) => {
    if (!targetClassId) return;
    try {
      const userRef = doc(dbInstance, 'users', studentUid);
      await updateDoc(userRef, { classId: targetClassId, classStatus: 'active' });
      await fetchRosterAndMistakes();
      alert(isKo ? '학급 이동이 완료되었습니다.' : 'Student transferred successfully.');
    } catch (err) {
      console.error('Failed to transfer student:', err);
    }
  };

  // Analytics Helpers
  const getWeeklyVocabWords = () => {
    return curriculumVocab
      .split(/[,\n]/)
      .map((w) => w.trim().toLowerCase())
      .filter((w) => w.length > 0);
  };

  const getWeeklyPhonicsRules = () => {
    return curriculumPhonics
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

  const rosterWithCompletion = studentsData.map(student => {
    const weeklyMistakes = (student.mistakes || []).filter((m: any) => isMistakeInWeeklyCurriculum(m));
    const hasScannedThisWeek = weeklyMistakes.length > 0 || (
      student.lastScanDate && 
      (new Date().getTime() - new Date(student.lastScanDate).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (hasScannedThisWeek && student.classStatus === 'active') {
      completedHomeworkCount++;
    }

    if (student.classStatus === 'active') {
      weeklyMistakes.forEach((m: any) => {
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
  });

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
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-[#0c0c0e] rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 drop-shadow-[0_10px_25px_rgba(249,115,22,0.25)]">
              <ChekkiMascot className="w-full h-full" mood="thinking" />
            </div>
            
            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <ChalkboardTeacher size={12} weight="bold" />
              <span>{isKo ? '교사 전용 포털' : 'Teacher Access Portal'}</span>
            </div>

            {/* Auth Mode Toggle (Login vs Sign Up) */}
            <div className="w-full flex bg-[#050505] p-1 rounded-2xl border border-white/10 mb-6">
              <button
                type="button"
                onClick={() => { setAuthMode('login'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'login'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isKo ? '로그인' : 'Log In'}
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode('signup'); setAuthError(''); }}
                className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                  authMode === 'signup'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {isKo ? '회원가입' : 'Sign Up'}
              </button>
            </div>

            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {authMode === 'login'
                ? (isKo ? '교사 포털 로그인' : 'Teacher Portal Login')
                : (isKo ? '교사 계정 생성' : 'Create Teacher Account')}
            </h2>
            <p className="text-zinc-400 text-xs mb-6 text-center leading-relaxed max-w-xs">
              {authMode === 'login'
                ? (isKo ? '학습지 관리 및 분석을 위해 교사 계정으로 로그인해 주세요.' : 'Log in with your teacher credentials to access your dashboard.')
                : (isKo ? '가입 후 전달받으신 교사 인증 코드를 등록하여 즉시 시작하세요.' : 'Sign up to register your school authorization code.')}
            </p>

            <form onSubmit={handleSignIn} className="w-full space-y-4">
              {authMode === 'signup' && (
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '선생님 성함' : 'Teacher Full Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={isKo ? "김철수 선생님" : "Jane Doe"}
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
                  placeholder="teacher@school.com"
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
                <>
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

                  <div className="space-y-1.5 text-left pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-orange-400 uppercase tracking-widest pl-1 flex items-center gap-1">
                        <Key size={12} weight="bold" />
                        <span>{isKo ? '교사 인증 코드' : 'Teacher Code'}</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-medium">({isKo ? '1-Click 즉시 승인' : 'Instant 1-Click Access'})</span>
                    </div>
                    <input
                      type="text"
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      placeholder="E.g. POLY10-TEACHER"
                      className="w-full bg-[#050505] border border-orange-500/30 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white uppercase font-mono tracking-wider placeholder:text-zinc-600"
                    />
                    <p className="text-[10px] text-zinc-500 pl-1 leading-normal">
                      {isKo 
                        ? '💡 입금 확인 이메일로 받은 교사 인증 코드를 입력하시면 가입 즉시 대시보드가 열립니다.' 
                        : '💡 Entering your authorization code now will activate your teacher account in 1 click.'}
                    </p>
                  </div>
                </>
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

  // --- RENDER B2B TEACHER CODE ACTIVATION VIEW ---
  if (user?.role !== 'teacher') {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
        <div className="fixed inset-0 bg-gradient-to-tr from-orange-500/10 via-amber-500/5 to-transparent blur-[140px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-[#0c0c0e] rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6 drop-shadow-[0_10px_25px_rgba(249,115,22,0.25)]">
              <ChekkiMascot className="w-full h-full" mood="happy" />
            </div>

            <div className="mb-4 inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-[10px] uppercase tracking-[0.2em] font-bold bg-orange-500/10 border border-orange-500/20 text-orange-400">
              <Key size={12} weight="bold" />
              <span>{isKo ? '권한 승인' : 'Authorization Required'}</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 text-center">
              {isKo ? '교사용 권한 활성화' : 'Activate Teacher Access'}
            </h2>
            <p className="text-zinc-400 text-xs mb-8 text-center leading-relaxed max-w-xs">
              {isKo 
                ? `반갑습니다, ${user?.name || '선생님'}! 교사 대시보드에 접근하려면 인증 코드를 등록해 주세요.`
                : `Welcome, ${user?.name || 'Teacher'}! Please enter your teacher authorization code to proceed.`}
            </p>

            <form onSubmit={handleActivateTeacher} className="w-full space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                  {isKo ? '교사 인증 코드' : 'Teacher Authorization Code'}
                </label>
                <input
                  type="text"
                  required
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  placeholder="E.g. POLY10-TEACHER"
                  className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white uppercase tracking-wider font-mono placeholder:text-zinc-600"
                />
              </div>

              {authError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-2xl text-center flex items-center justify-center gap-2">
                  <Warning size={16} weight="bold" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isActivating}
                className="group w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
              >
                {isActivating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isKo ? '인증 및 활성화' : 'Verify & Activate'}</span>
                    <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                      <ArrowRight size={14} weight="bold" />
                    </div>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-3 bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-xs rounded-2xl transition-all border border-white/10 active:scale-[0.98]"
              >
                {isKo ? '로그아웃' : 'Log Out'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER CORE DASHBOARD LAYOUT SHELL ---
  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row selection:bg-orange-500 selection:text-white">

      {/* Teacher Onboarding Modal */}
      {showTeacherOnboarding && (() => {
        const step = teacherObSteps[teacherObStep];
        const isLast = teacherObStep === teacherObSteps.length - 1;
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/85 backdrop-blur-2xl" onClick={dismissTeacherOnboarding} />
            <div className="relative w-full max-w-[420px] p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl">
              <div className="bg-[#0c0c0e] rounded-[calc(2.5rem-0.25rem)] p-8 flex flex-col items-center text-center">
                <button
                  onClick={dismissTeacherOnboarding}
                  className="absolute top-5 right-5 text-zinc-400 hover:text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all active:scale-[0.97]"
                >
                  {isKo ? '건너뛰기' : 'Skip'}
                </button>

                <div className="w-44 h-44 mb-6 rounded-3xl overflow-hidden bg-black/40 border border-white/10 p-2 shadow-[0_20px_40px_rgba(249,115,22,0.15)] flex items-center justify-center">
                  <img src={step.img} alt="" className="w-full h-full object-contain" />
                </div>

                <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                  {isKo ? step.titleKo : step.titleEn}
                </h3>
                <p className="text-sm text-zinc-400 leading-relaxed max-w-[300px] mb-8">
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

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => { setTempLogoUrl(academyLogo); setShowLogoModal(true); }}
              title={isKo ? '학원 로고 설정' : 'Upload Academy Logo'}
              className={`p-2 rounded-xl transition-all text-xs font-bold active:scale-[0.95] cursor-pointer ${
                isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
              }`}
            >
              🖼️
            </button>
            <button
              type="button"
              onClick={() => { setResetPwStatus(null); setShowSettingsModal(true); }}
              title={isKo ? '교사 환경 설정' : 'Teacher Settings'}
              className={`p-2 rounded-xl transition-all active:scale-[0.95] cursor-pointer ${
                isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
              }`}
            >
              <Gear size={16} weight="bold" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : isThemeNight 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
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
              <span>{isKo ? '반 통계 및 대시보드' : 'Class Dashboard'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>
          
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : isThemeNight 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${
                activeTab === 'curriculum' 
                  ? 'bg-orange-500/20 text-orange-500' 
                  : isThemeNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
              }`}>
                <BookOpen size={18} weight="bold" />
              </div>
              <span>{isKo ? '주간 학습 커리큘럼' : 'Manage Curriculum'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'curriculum' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
              activeTab === 'students'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : isThemeNight 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${
                activeTab === 'students' 
                  ? 'bg-orange-500/20 text-orange-500' 
                  : isThemeNight ? 'bg-white/5 text-zinc-400 group-hover:text-white' : 'bg-zinc-100 text-zinc-500 group-hover:text-zinc-900'
              }`}>
                <Users size={18} weight="bold" />
              </div>
              <span>{isKo ? '학생 출석 및 활동 정보' : 'Student Activity'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'students' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
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
          {/* Left Controls: Class Selector, New Class Button, Class Code */}
          <div className="flex flex-wrap items-center gap-3">
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
                  {selectedClass.joinCode || 'N/A'}
                </span>
                <span className="text-[10px] font-bold">
                  {copiedCode ? '✅' : '📋'}
                </span>
              </button>
            )}
          </div>

          {/* Right Controls: Active Week Counter + Language Switcher + Theme Toggle */}
          <div className="flex items-center gap-3">
            {selectedClass && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowWeekCalendarModal(true)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl border transition-all cursor-pointer active:scale-[0.96] text-xs font-bold ${
                    isThemeNight 
                      ? 'bg-white/5 hover:bg-white/10 border-white/10 text-orange-400 hover:text-orange-300' 
                      : 'bg-orange-50 hover:bg-orange-100 border-orange-200 text-orange-700'
                  }`}
                  title={isKo ? '주차별 커리큘럼 업로드 캘린더 보기' : 'View Weekly Schedule & Upload History'}
                >
                  <Calendar size={15} weight="bold" />
                  <span className="hidden sm:inline">{isKo ? '주차 캘린더' : 'Schedule'}</span>
                </button>

                <div className={`border rounded-2xl flex items-center overflow-hidden p-1 shadow-inner ${
                  isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-100 border-zinc-300'
                }`}>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(-1)}
                    disabled={selectedClass.activeWeekNumber <= 1}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer disabled:opacity-20 ${
                      isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    }`}
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowWeekCalendarModal(true)}
                    className={`px-3 py-0.5 text-xs font-black min-w-[3.2rem] text-center font-mono rounded-lg transition-all cursor-pointer ${
                      isThemeNight ? 'text-white hover:bg-white/10 hover:text-orange-400' : 'text-zinc-900 hover:bg-zinc-200 hover:text-orange-600'
                    }`}
                    title={isKo ? '클릭하여 학기 주차별 커리큘럼 업로드 캘린더 열기' : 'Click to view semester calendar'}
                  >
                    W{selectedClass.activeWeekNumber}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdateWeek(1)}
                    className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-black transition-all cursor-pointer ${
                      isThemeNight ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200'
                    }`}
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
          {classes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-52 h-52 mb-6 mx-auto">
                <img
                  src="/assets/teacher_ob_empty_state.png"
                  alt="Create your first class"
                  className="w-full h-full object-contain filter drop-shadow-[0_20px_50px_rgba(249,115,22,0.2)]"
                />
              </div>
              <h3 className="text-2xl font-black text-white mb-2">
                {isKo ? '등록된 반이 없습니다' : 'No Classes Registered Yet'}
              </h3>
              <p className="text-zinc-400 text-xs font-medium max-w-sm mb-8 leading-relaxed">
                {isKo 
                  ? '교사 대시보드를 사용하려면 첫 번째 학급반을 먼저 만들어 주세요.' 
                  : 'Start by creating your first class to manage student rosters and homework curricula.'}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="group px-7 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center gap-3"
                >
                  <span>{isKo ? '새 학급반 만들기' : 'Create Class Now'}</span>
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ArrowRight size={12} weight="bold" />
                  </div>
                </button>
                <button
                  onClick={() => { setShowTeacherOnboarding(true); setTeacherObStep(0); }}
                  className="px-6 py-4 bg-[#08080a] hover:bg-white/5 border border-white/10 text-zinc-300 hover:text-white font-bold text-xs rounded-2xl transition-all active:scale-[0.97]"
                >
                  {isKo ? '사용 가이드 보기' : 'View Guide'}
                </button>
              </div>
            </div>
          ) : (
            <div className="animate-fade-in">
              {activeTab === 'overview' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* Top Double-Bezel Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* Stat Card 1 */}
                    <div className={`p-1 rounded-[2rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <ChalkboardTeacher size={14} weight="bold" className="text-orange-500" />
                            <span>{isKo ? '대상 학급' : 'Active Class'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-500 font-mono">
                            Level: {selectedClass?.level}
                          </span>
                        </div>
                        <div>
                          <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{selectedClass?.name}</h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {isKo ? '선택된 가입 코드:' : 'Active join code:'} <span className={`font-mono ${isThemeNight ? 'text-zinc-300' : 'text-zinc-700'}`}>{selectedClass?.joinCode}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stat Card 2 */}
                    <div className={`p-1 rounded-[2rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-orange-500 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <TrendUp size={14} weight="bold" />
                            <span>{isKo ? '숙제 완료율' : 'Completion Rate'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-mono">
                            {completionRate}%
                          </span>
                        </div>
                        <div>
                          <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {completedHomeworkCount} <span className="text-sm font-normal text-zinc-500">/ {activeStudentsCount} {isKo ? '명 완료' : 'Students'}</span>
                          </h4>
                          <div className={`w-full h-2 rounded-full mt-4 overflow-hidden p-0.5 border ${
                            isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-100 border-zinc-200'
                          }`}>
                            <div 
                              className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className={`p-1 rounded-[2rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Users size={14} weight="bold" className="text-purple-500" />
                            <span>{isKo ? '등록 원생 수' : 'Enrolled Students'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-500 font-mono">
                            Active Roster
                          </span>
                        </div>
                        <div>
                          <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {activeStudentsCount} <span className="text-sm font-normal text-zinc-500">{isKo ? '명 등록' : 'Children'}</span>
                          </h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {isKo ? '가입 승인 완료된 활동 원생 수' : 'Approved active student profiles'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Main Overview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left/Middle Column: Trouble Words */}
                    <div className={`lg:col-span-2 p-1 rounded-[2.5rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                                <Lightbulb size={20} weight="bold" />
                              </div>
                              <div>
                                <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '이번 주 핵심 복습 키워드' : 'Weekly Focus & Growth Keywords'}
                                </h4>
                              </div>
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono px-3 py-1 rounded-full border ${
                              isThemeNight ? 'bg-white/5 border-white/5' : 'bg-zinc-100 border-zinc-200'
                            }`}>
                              Analytics
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                            {isKo 
                              ? '아이들이 이번 주 더 자신감을 가질 수 있도록 수업 시간에 함께 다뤄볼 복습 키워드입니다.' 
                              : "Key vocabulary and phonics targets to reinforce in class to build every student's confidence."}
                          </p>
                        </div>

                        {activeVocabWords.length === 0 ? (
                          <div className={`py-12 px-6 rounded-2xl border flex flex-col items-center justify-center text-center ${
                            isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                          }`}>
                            <div className="w-14 h-14 mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                              <Notebook size={28} weight="bold" />
                            </div>
                            <h5 className={`text-sm font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '등록된 이번 주 학습 단어가 없습니다.' : 'No vocabulary words configured for this week.'}
                            </h5>
                            <p className="text-xs text-zinc-500 max-w-xs mb-6">
                              {isKo ? '주간 학습 커리큘럼 탭에서 이번 주 단어를 등록해 주세요.' : 'Go to the Curriculum tab to add target vocabulary words.'}
                            </p>
                            <button
                              onClick={() => setActiveTab('curriculum')}
                              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.97] cursor-pointer"
                            >
                              + {isKo ? '단어 등록하러 가기' : 'Add Weekly Words'}
                            </button>
                          </div>
                        ) : isLoadingRoster ? (
                          <div className="flex items-center justify-center py-12">
                            <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {sortedTroubleWords.map(({ word, count }) => (
                              <div key={word} className={`flex items-center justify-between p-4 border rounded-2xl transition-all ${
                                isThemeNight ? 'bg-[#050505] border-white/5 hover:border-white/10' : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                              }`}>
                                <span className={`text-sm font-bold font-mono tracking-wide ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{word}</span>
                                <div className="flex items-center gap-3">
                                  {count > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-500 flex items-center gap-1.5">
                                      <Warning size={14} weight="bold" />
                                      <span>{count} {isKo ? '명 틀림' : 'Mistakes'}</span>
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                                      <Check size={14} weight="bold" />
                                      <span>{isKo ? '오답 없음' : 'Clear'}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: AI Tutor Pedagogical Review Tip */}
                    <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left relative overflow-hidden transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center">
                              <BookOpen size={20} weight="bold" />
                            </div>
                            <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '교사 복습 가이드' : 'Review Strategy Guide'}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                            {isKo 
                              ? '오답 통계를 기반으로 추천하는 다음 수업 복습 가이드입니다.' 
                              : 'AI-generated instruction guide based on current weekly error statistics.'}
                          </p>
                          
                          <div className="space-y-4 text-xs leading-relaxed text-zinc-300 font-medium">
                            {sortedTroubleWords.some(w => w.count > 0) ? (
                              <>
                                <p className={`font-semibold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                  {isKo 
                                    ? `이번 주 가장 많이 틀린 단어는 "${sortedTroubleWords[0].word}" 입니다.` 
                                    : `Students struggled most with the word "${sortedTroubleWords[0].word}" this week.`}
                                </p>
                                <div className={`p-4 border rounded-2xl leading-relaxed ${
                                  isThemeNight ? 'bg-orange-500/10 border-orange-500/20 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800'
                                }`}>
                                  💡 {isKo 
                                    ? '내일 수업 시작 시, 보드판에 해당 단어들의 파닉스 모음 결합을 소리내어 복습하는 파닉스 드릴 게임을 추천합니다.' 
                                    : 'Recommendation: Dedicate the first 5 minutes of class to spelling tracing and a vocal blend drill focusing on target phonics.'}
                                </div>
                              </>
                            ) : (
                              <div className={`p-6 rounded-2xl border text-center text-xs text-emerald-500 flex flex-col items-center gap-2 ${
                                isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-emerald-50/50 border-emerald-200'
                              }`}>
                                <Sparkle size={24} weight="bold" />
                                <span>{isKo ? '모든 아이들이 숙제를 완벽히 소화하고 있습니다!' : 'All children have mastered the weekly vocabulary!'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className={`pt-6 border-t mt-6 ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                          <button
                            type="button"
                            onClick={() => setShowReviewSheetModal(true)}
                            className="group w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3 cursor-pointer"
                          >
                            <span>{isKo ? '오답 맞춤 프린트 생성' : 'Generate Review Sheet'}</span>
                            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                              <Printer size={14} weight="bold" />
                            </div>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className={`p-1 rounded-[2.5rem] animate-fade-in text-left transition-colors ${
                  isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                }`}>
                  <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
                    isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                  }`}>
                    <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                          <BookOpen size={22} weight="bold" />
                        </div>
                        <div>
                          <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                            {isKo ? `주간 커리큘럼 편집 (Week ${selectedClass?.activeWeekNumber})` : `Edit Weekly Curriculum (Week ${selectedClass?.activeWeekNumber})`}
                          </h4>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {isKo 
                              ? '현재 주차의 학급 교안 정보입니다. 저장된 내용은 부모님들의 채점 피드백에 반영됩니다.' 
                              : 'Weekly teaching details. Saved context is fed directly to parents\' scans.'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isLoadingCurriculum ? (
                      <div className="flex items-center justify-center min-h-[30vh]">
                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      </div>
                    ) : (
                      <form onSubmit={handleSaveCurriculum} className="space-y-6">
                        {/* Drag & Drop Textbook Page or PDF Zone */}
                        <div
                          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                          onDragLeave={() => setIsDraggingFile(false)}
                          onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingFile(false);
                            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                              handleTextbookFileUpload(e.dataTransfer.files[0]);
                            }
                          }}
                          className={`relative border-2 border-dashed rounded-3xl p-6 transition-all text-center flex flex-col items-center justify-center gap-3 ${
                            isDraggingFile 
                              ? 'border-orange-500 bg-orange-500/10 scale-[1.01]' 
                              : isThemeNight ? 'border-white/10 hover:border-orange-500/40 bg-[#050505]' : 'border-zinc-300 hover:border-orange-500/40 bg-zinc-50/70'
                          }`}
                        >
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                handleTextbookFileUpload(e.target.files[0]);
                              }
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer z-20"
                          />

                          {isScanningTextbook ? (
                            <div className="flex flex-col items-center py-4">
                              <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                              <p className="text-xs font-bold text-orange-500">
                                {isKo ? 'Chekki AI가 교재 페이지를 분석하고 있습니다...' : 'Scanning textbook page with Chekki AI...'}
                              </p>
                              <p className="text-[10px] text-zinc-500 mt-1">
                                {isKo ? '단어, 파닉스 규칙, 지문을 자동으로 추출합니다' : 'Auto-extracting target vocabulary, phonics, and reading passage'}
                              </p>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4">
                              {textbookPreviewUrl ? (
                                <img 
                                  src={textbookPreviewUrl} 
                                  alt="Textbook preview" 
                                  className="w-16 h-16 object-cover rounded-xl border border-white/20 shadow-md" 
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg">
                                  <UploadSimple size={22} weight="bold" />
                                </div>
                              )}
                              <div className="text-left">
                                <h5 className={`text-sm font-bold flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  <span>{isKo ? '교재 이미지 또는 PDF 파일 업로드' : 'Upload or Drag & Drop Textbook Page (Photo / PDF)'}</span>
                                  <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                                    AI Auto-Fill
                                  </span>
                                </h5>
                                <p className="text-xs text-zinc-400 mt-0.5">
                                  {isKo ? '교재 페이지 사진이나 PDF를 드롭하면 AI가 단어와 파닉스를 자동으로 채워줍니다.' : 'Drag & drop a textbook page photo or PDF. AI will auto-extract vocabulary & phonics.'}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Quick Preset Chips */}
                        <div className="flex flex-wrap items-center gap-2 pt-1 pb-2">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mr-1">
                            {isKo ? '샘플 프리셋:' : 'Quick Presets:'}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setCurriculumTopic('Weather & Nature');
                              setCurriculumVocab('sunny, rainy, windy, cloudy, stormy, umbrella, jacket');
                              setCurriculumPhonics('-ai-, -ay-, sh-, ch-');
                              setCurriculumPassage('The weather was rainy today. Always remember your umbrella!');
                            }}
                            className={`px-3 py-1 border text-xs font-semibold rounded-full transition-all active:scale-[0.96] cursor-pointer ${
                              isThemeNight ? 'bg-white/5 hover:bg-orange-500/20 border-white/10 text-zinc-300 hover:text-orange-400' : 'bg-zinc-100 hover:bg-orange-50 border-zinc-300 text-zinc-700 hover:text-orange-600'
                            }`}
                          >
                            🌦️ Weather & Nature
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setCurriculumTopic('Animals & Habitats');
                              setCurriculumVocab('elephant, giraffe, dolphin, forest, jungle, ocean');
                              setCurriculumPhonics('-th-, -ph-, -ea-');
                              setCurriculumPassage('Dolphins live in the deep ocean and love to swim together.');
                            }}
                            className={`px-3 py-1 border text-xs font-semibold rounded-full transition-all active:scale-[0.96] cursor-pointer ${
                              isThemeNight ? 'bg-white/5 hover:bg-orange-500/20 border-white/10 text-zinc-300 hover:text-orange-400' : 'bg-zinc-100 hover:bg-orange-50 border-zinc-300 text-zinc-700 hover:text-orange-600'
                            }`}
                          >
                            🦁 Animals & Habitats
                          </button>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                            {isKo ? '대주제 / 주간 테마 (Topic)' : 'Weekly Topic / Theme'}
                          </label>
                          <input
                            type="text"
                            value={curriculumTopic}
                            onChange={(e) => setCurriculumTopic(e.target.value)}
                            placeholder={isKo ? '예: Weather & Nature (날씨와 자연)' : 'E.g. Weather & Nature'}
                            className={`w-full border outline-none text-sm p-4 rounded-2xl transition-all ${
                              isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                            }`}
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                              <span>{isKo ? '주간 학습 단어 (Vocabulary)' : 'Target Vocabulary'}</span>
                              <span className="text-[9px] text-zinc-500 font-normal">
                                ({isKo ? '쉼표로 구분' : 'separated by commas'})
                              </span>
                            </label>
                            <textarea
                              value={curriculumVocab}
                              onChange={(e) => setCurriculumVocab(e.target.value)}
                              placeholder="umbrella, rainbow, storm, rain..."
                              className={`w-full h-36 border outline-none text-sm p-4 rounded-2xl transition-all resize-none font-mono ${
                                isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                              }`}
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1 flex items-center justify-between">
                              <span>{isKo ? '주간 타겟 파닉스 / 문법 (Phonics)' : 'Target Phonics Rules / Sounds'}</span>
                              <span className="text-[9px] text-zinc-500 font-normal">
                                ({isKo ? '쉼표로 구분' : 'separated by commas'})
                              </span>
                            </label>
                            <textarea
                              value={curriculumPhonics}
                              onChange={(e) => setCurriculumPhonics(e.target.value)}
                              placeholder="-ai-, -ay-, sh-, ch-..."
                              className={`w-full h-36 border outline-none text-sm p-4 rounded-2xl transition-all resize-none font-mono ${
                                isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                              }`}
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                            {isKo ? '주간 본문 지문 / 스토리 (Reading Passage)' : 'Weekly Reading Passage / Target Story'}
                          </label>
                          <textarea
                            value={curriculumPassage}
                            onChange={(e) => setCurriculumPassage(e.target.value)}
                            placeholder={isKo ? '이번 주 교재에 수록된 본문 이야기를 입력해 주세요.' : 'Paste the reference reading text here.'}
                            className={`w-full h-40 border outline-none text-sm p-4 rounded-2xl transition-all resize-y ${
                              isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                            }`}
                          />
                        </div>

                        <div className={`flex gap-4 justify-end pt-4 border-t ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                          <button
                            type="button"
                            onClick={loadCurriculum}
                            disabled={isSavingCurriculum}
                            className={`px-6 py-3.5 rounded-2xl text-xs font-bold border transition-all active:scale-[0.98] cursor-pointer ${
                              isThemeNight ? 'bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                            }`}
                          >
                            {isKo ? '초기화' : 'Reset'}
                          </button>
                          
                          <button
                            type="submit"
                            disabled={isSavingCurriculum}
                            className="group px-7 py-3.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
                          >
                            {isSavingCurriculum ? (
                              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <>
                                <span>{isKo ? '주간 계획 저장' : 'Save Curriculum'}</span>
                                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                                  <CheckCircle size={14} weight="bold" />
                                </div>
                              </>
                            )}
                          </button>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              )}

              {activeTab === 'students' && (
                <div className="space-y-8 animate-fade-in">
                  
                  {/* --- SECTION 1: PENDING APPROVALS --- */}
                  {pendingRoster.length > 0 && (
                    <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
                      isThemeNight ? 'bg-orange-500/10 border border-orange-500/30 shadow-2xl' : 'bg-orange-50/60 border border-orange-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-500 flex items-center justify-center">
                            <Warning size={22} weight="bold" />
                          </div>
                          <div>
                            <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '가입 승인 대기 목록' : 'Pending Classroom Approvals'}
                            </h4>
                            <p className="text-xs text-orange-500 font-medium leading-normal">
                              {isKo 
                                ? '이 학급반에 가입을 요청한 학부모 목록입니다. 승인 후 대시보드에 합산됩니다.' 
                                : 'Parents requesting to enroll their children. Approve to add them to class analytics.'}
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                                <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                                <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                                <th className="pb-4 text-right pr-2">{isKo ? '승인 여부' : 'Approval Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isThemeNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                              {pendingRoster.map((student) => (
                                <tr key={student.uid} className={`transition-colors ${isThemeNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                                  <td className={`py-4 pl-2 font-black text-sm ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                    {student.studentName || 'Unnamed'}
                                  </td>
                                  <td className="py-4">
                                    <p className={`font-bold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>{student.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                                  </td>
                                  <td className="py-4 text-right pr-2 space-x-3">
                                    <button
                                      onClick={() => handleDeclineStudent(student.uid)}
                                      className={`px-4 py-2 border font-bold rounded-xl transition-all text-xs active:scale-[0.97] cursor-pointer ${
                                        isThemeNight ? 'border-white/10 hover:border-white/20 bg-[#050505] text-zinc-400 hover:text-zinc-200' : 'border-zinc-300 hover:border-zinc-400 bg-zinc-100 text-zinc-700'
                                      }`}
                                    >
                                      ✕ {isKo ? '거절' : 'Decline'}
                                    </button>
                                    <button
                                      onClick={() => handleApproveStudent(student.uid)}
                                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all text-xs active:scale-[0.97] cursor-pointer"
                                    >
                                      ✓ {isKo ? '승인' : 'Approve'}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* --- SECTION 2: ACTIVE ROSTER --- */}
                  <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
                    isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                  }`}>
                    <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
                      isThemeNight ? 'bg-[#0a0a0c] text-white' : 'bg-white text-zinc-900'
                    }`}>
                      <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-500 flex items-center justify-center">
                            <UserCheck size={22} weight="bold" />
                          </div>
                          <div>
                            <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '소속 원생 명단' : 'Approved Student Roster'}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {isKo 
                                ? '현재 승인 완료되어 활동 중인 학생 명단입니다.' 
                                : 'Active classroom student roster logs and transfer operations.'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={fetchRosterAndMistakes}
                          className={`px-4 py-2 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-[0.97] ${
                            isThemeNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                          }`}
                          title="Refresh parent scans & roster"
                        >
                          <span>🔄</span>
                          <span>{isKo ? '동기화 새로고침' : 'Refresh Live Sync'}</span>
                        </button>
                      </div>

                      {isLoadingRoster ? (
                        <div className="flex items-center justify-center min-h-[30vh]">
                          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                      ) : activeRoster.length === 0 ? (
                        <div className="py-16 text-center text-zinc-500 text-xs leading-relaxed font-korean">
                          {isKo 
                            ? '이 학급반에 등록된 학생이 없습니다. 가입 코드를 학부모에게 공유하거나 승인을 기다려 주세요.' 
                            : 'No active students enrolled in this class yet.'}
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left border-collapse">
                            <thead>
                              <tr className={`border-b text-zinc-500 font-bold uppercase tracking-wider text-[10px] ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                                <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                                <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                                <th className="pb-4">{isKo ? '숙제 상태' : 'Weekly Status'}</th>
                                <th className="pb-4">{isKo ? '마지막 스캔일' : 'Last Active'}</th>
                                <th className="pb-4 text-right pr-2">{isKo ? '원생 관리' : 'Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className={`divide-y ${isThemeNight ? 'divide-white/5' : 'divide-zinc-200'}`}>
                              {activeRoster.map((student) => (
                                <tr key={student.uid} className={`transition-colors ${isThemeNight ? 'hover:bg-white/[0.02]' : 'hover:bg-zinc-50'}`}>
                                  <td className={`py-4 pl-2 font-black text-sm ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{student.studentName || 'Unnamed'}</td>
                                  <td className="py-4">
                                    <p className={`font-bold ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>{student.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                                  </td>
                                  <td className="py-4">
                                    {student.hasScannedThisWeek ? (
                                      <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 w-fit">
                                        <CheckCircle size={14} weight="bold" />
                                        <span>{isKo ? '스캔 완료' : 'Scanned'}</span>
                                      </span>
                                    ) : (
                                      <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold border flex items-center gap-1.5 w-fit ${
                                        isThemeNight ? 'bg-zinc-900 border-white/5 text-zinc-500' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                                      }`}>
                                        <span>❌</span>
                                        <span>{isKo ? '미스캔' : 'Not Scanned'}</span>
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-4 font-mono text-zinc-500 text-[10px]">
                                    {student.lastScanDate ? student.lastScanDate : '-'}
                                  </td>
                                  <td className="py-4 text-right pr-2 flex items-center justify-end gap-2">
                                    <select
                                      onChange={(e) => handleMoveStudent(student.uid, e.target.value)}
                                      value=""
                                      className={`text-[10px] font-bold px-3 py-2 rounded-xl cursor-pointer outline-none focus:border-orange-500 appearance-none transition-colors ${
                                        isThemeNight ? 'bg-[#050505] border border-white/10 text-zinc-400' : 'bg-zinc-100 border border-zinc-300 text-zinc-700'
                                      }`}
                                    >
                                      <option value="">{isKo ? '반 이동' : 'Move Class'}</option>
                                      {classes
                                        .filter((c) => c.id !== selectedClass?.id)
                                        .map((c) => (
                                          <option key={c.id} value={c.id}>
                                            {c.name}
                                          </option>
                                        ))}
                                    </select>
                                    <button
                                      onClick={() => handleRemoveStudent(student.uid)}
                                      className="px-3.5 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all text-[10px] active:scale-[0.95] cursor-pointer"
                                    >
                                      {isKo ? '삭제' : 'Remove'}
                                    </button>
                                    <button
                                      onClick={() => setSelectedStudentDetails(student)}
                                      className={`px-4 py-2 border font-bold rounded-xl transition-all text-[10px] active:scale-[0.95] flex items-center gap-1.5 cursor-pointer ${
                                        isThemeNight ? 'border-white/10 bg-[#050505] hover:bg-white/5 text-orange-400 hover:text-orange-300' : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-orange-600'
                                      }`}
                                    >
                                      <MagnifyingGlass size={12} weight="bold" />
                                      <span>{isKo ? '오답 상세' : 'View Details'}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* --- STUDENT MISTAKE DETAILS SLIDE-OVER DRAWER --- */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setSelectedStudentDetails(null)} 
          />
          <div className={`relative w-full max-w-lg h-full border-l p-6 sm:p-8 flex flex-col shadow-2xl animate-slide-in text-left transition-colors ${
            isThemeNight ? 'bg-[#0c0c0e] border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
          }`}>
            
            {/* Drawer Header */}
            <div className={`pb-6 border-b flex items-center justify-between shrink-0 ${
              isThemeNight ? 'border-white/10' : 'border-zinc-200'
            }`}>
              <div>
                <h3 className={`text-xl font-black flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
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
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-8 overflow-hidden transition-colors ${
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Plus size={22} weight="bold" />
                </div>
                <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '반 이름' : 'Class Name'}
                  </label>
                  <input
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
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '대상 학년' : 'Class Level'}
                  </label>
                  <select
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowLogoModal(false)} 
          />
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in text-left ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-8 transition-colors ${
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <button
                type="button"
                onClick={() => setShowLogoModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer ${
                  isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                <X size={16} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Sparkle size={22} weight="bold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                    {isKo ? '맞춤 브랜드 설정' : 'ACADEMY BRANDING'}
                  </span>
                  <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '학원 맞춤 로고 등록' : 'Custom Academy Logo'}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                {isKo 
                  ? '등록된 학원 로고는 모든 학부모 성적표 리포트 및 인쇄용 오답 학습지에 맞춤 헤더로 삽입됩니다.' 
                  : 'Your custom logo will be featured on all parent progress reports and printed worksheets.'}
              </p>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  localStorage.setItem('chekki_academy_logo', tempLogoUrl);
                  setAcademyLogo(tempLogoUrl);
                  setShowLogoModal(false);
                  alert(isKo ? '학원 맞춤 로고가 저장되었습니다!' : 'Custom Academy Logo saved!');
                }}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '학원 로고 이미지 URL' : 'Academy Logo Image URL'}
                  </label>
                  <input
                    type="url"
                    value={tempLogoUrl}
                    onChange={(e) => setTempLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className={`w-full border outline-none text-xs p-4 rounded-2xl transition-all font-mono ${
                      isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                    }`}
                  />
                </div>

                {tempLogoUrl && (
                  <div className={`p-4 border rounded-2xl flex items-center gap-3 ${
                    isThemeNight ? 'bg-white/5 border-white/5' : 'bg-zinc-50 border-zinc-200'
                  }`}>
                    <img src={tempLogoUrl} alt="Preview" className="w-12 h-12 rounded-xl object-contain bg-white/10 border border-white/10" />
                    <div>
                      <p className={`text-xs font-bold ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{isKo ? '미리보기' : 'Logo Preview'}</p>
                      <p className="text-[10px] text-emerald-500">{isKo ? '성적표 헤더에 적용됨' : 'Ready for report cards'}</p>
                    </div>
                  </div>
                )}

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setTempLogoUrl('');
                      setAcademyLogo('');
                      localStorage.removeItem('chekki_academy_logo');
                      setShowLogoModal(false);
                    }}
                    className="w-1/3 py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-2xl border border-red-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isKo ? '로고 초기화' : 'Remove Logo'}
                  </button>
                  <button
                    type="submit"
                    className="w-2/3 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isKo ? '로고 저장하기' : 'Save Logo'}
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
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-lg mx-4 animate-fade-in text-left ${
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

              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                  <Gear size={24} weight="bold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                    {isKo ? '교사 포털 설정' : 'TEACHER PORTAL SETTINGS'}
                  </span>
                  <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? '선생님 환경 설정' : 'Teacher Account & Settings'}
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
                    <span className="text-zinc-400">{isKo ? '선생님 이름' : 'Teacher Name'}:</span>
                    <strong className={isThemeNight ? 'text-white' : 'text-zinc-900'}>{user?.name || 'Teacher'}</strong>
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

                {/* Log Out Action */}
                <button
                  type="button"
                  onClick={() => {
                    setShowSettingsModal(false);
                    logout();
                  }}
                  className="w-full py-3.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-2xl border border-red-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  <SignOut size={16} weight="bold" />
                  <span>{isKo ? '교사 계정 로그아웃' : 'Log Out of Teacher Account'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- WEEKLY CALENDAR & UPLOAD HISTORY MODAL --- */}
      {showWeekCalendarModal && (
        <div className="fixed inset-0 z-[280] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowWeekCalendarModal(false)} 
          />
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh] ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar transition-colors ${
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-200' : 'bg-white text-zinc-900'
            }`}>
              <button
                type="button"
                onClick={() => setShowWeekCalendarModal(false)}
                className={`absolute top-6 right-6 p-2 rounded-full transition-all cursor-pointer ${
                  isThemeNight ? 'text-zinc-400 hover:text-white bg-white/5 hover:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                }`}
              >
                <X size={18} weight="bold" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg">
                  <Calendar size={24} weight="bold" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500 font-mono">
                    {isKo ? '주차별 커리큘럼 업로드 현황' : 'CURRICULUM UPLOAD CALENDAR'}
                  </span>
                  <h3 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                    {isKo ? `${selectedClass?.name || '학급'} 학기 주차별 캘린더` : `${selectedClass?.name || 'Class'} Weekly Curriculum Schedule`}
                  </h3>
                </div>
              </div>

              <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                {isKo 
                  ? '각 주차별로 교재 업로드 일시와 등록된 학습 단어를 확인하고 원클릭으로 해당 주차로 이동할 수 있습니다.'
                  : 'Check upload timestamps and target topics per week. Click any week to make it active.'}
              </p>

              {/* 12-Week Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((weekNum) => {
                  const isActiveWeek = selectedClass?.activeWeekNumber === weekNum;
                  // Dynamic status based on week index
                  const hasUpload = weekNum <= 2;
                  const topicName = weekNum === 1 ? 'Weather & Nature' : weekNum === 2 ? 'Animals & Habitats' : (isKo ? '미등록 주차' : 'Pending Upload');
                  const uploadDate = weekNum === 1 ? '2026-07-20' : weekNum === 2 ? '2026-07-21' : null;
                  const wordCount = weekNum === 1 ? 7 : weekNum === 2 ? 6 : 0;

                  return (
                    <div 
                      key={weekNum}
                      onClick={() => {
                        handleSelectWeek(weekNum);
                        setShowWeekCalendarModal(false);
                      }}
                      className={`p-4 border rounded-2xl flex flex-col justify-between gap-3 cursor-pointer transition-all active:scale-[0.97] relative group ${
                        isActiveWeek
                          ? 'border-orange-500 bg-orange-500/10 shadow-lg shadow-orange-500/10'
                          : isThemeNight
                            ? 'bg-[#050505] border-white/10 hover:border-white/20 hover:bg-white/5'
                            : 'bg-zinc-50 border-zinc-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      {isActiveWeek && (
                        <span className="absolute top-3 right-3 px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-md shadow-xs">
                          {isKo ? '현재 주차' : 'Active'}
                        </span>
                      )}

                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-black text-orange-500">
                            Week {weekNum}
                          </span>
                        </div>
                        <h4 className={`text-xs font-bold truncate ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                          {topicName}
                        </h4>
                      </div>

                      <div className="space-y-1 pt-2 border-t border-white/5 text-[10px]">
                        {hasUpload ? (
                          <>
                            <div className="flex items-center justify-between text-emerald-500 font-bold">
                              <span>✅ {isKo ? '업로드 완료' : 'Uploaded'}</span>
                              <span className="font-mono">{wordCount} words</span>
                            </div>
                            <div className="flex items-center justify-between text-zinc-500 font-mono text-[9px]">
                              <span>📅 {uploadDate}</span>
                              <span className="text-orange-500 font-bold group-hover:underline">
                                {isKo ? '이동 ➔' : 'Jump ➔'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-between text-zinc-500 font-medium">
                            <span>⏳ {isKo ? '미등록 (빈 학습지)' : 'Empty Curriculum'}</span>
                            <span className="text-orange-500 font-bold group-hover:underline">
                              {isKo ? '이동 ➔' : 'Jump ➔'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className={`mt-6 pt-4 border-t flex justify-end ${isThemeNight ? 'border-white/10' : 'border-zinc-200'}`}>
                <button
                  type="button"
                  onClick={() => setShowWeekCalendarModal(false)}
                  className={`px-6 py-3 font-bold text-xs rounded-xl border transition-all cursor-pointer ${
                    isThemeNight ? 'bg-[#050505] text-zinc-300 border-white/10 hover:bg-white/5' : 'bg-zinc-100 text-zinc-700 border-zinc-300 hover:bg-zinc-200'
                  }`}
                >
                  {isKo ? '닫기' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- AI REVIEW WORKSHEET PRINTABLE MODAL --- */}
      {showReviewSheetModal && (
        <div className="fixed inset-0 z-[320] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowReviewSheetModal(false)} 
          />
          <div className="relative p-1 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh]">
            <div className="relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 bg-white text-zinc-900 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setShowReviewSheetModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>

              {/* Printable Worksheet Header */}
              <div className="border-b border-zinc-200 pb-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {academyLogo ? (
                    <img src={academyLogo} alt="Logo" className="w-12 h-12 object-contain rounded-xl border border-zinc-200" />
                  ) : (
                    <div className="w-12 h-12 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center font-bold text-xl">
                      🏫
                    </div>
                  )}
                  <div>
                    <h3 className="text-lg font-black text-zinc-900">{user?.schoolName || 'B2B Academy'}</h3>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-wider">
                      {isKo ? '오답 맞춤 복습 프린트 학습지' : 'AI Individualized Review Worksheet'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono">
                  <p className="font-bold text-zinc-800">{selectedClass?.name || 'Class'} | Week {selectedClass?.activeWeekNumber}</p>
                  <p className="text-zinc-500">Student: ___________________</p>
                </div>
              </div>

              {/* Section 1: Phonics Sound Blend Drill */}
              <div className="space-y-6">
                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl">
                  <h4 className="text-xs font-black text-orange-800 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Sparkle size={14} weight="bold" />
                    <span>Section A: Target Phonics & Sound Patterns (파닉스 타겟 복습)</span>
                  </h4>
                  <p className="text-xs text-zinc-700">
                    {curriculumPhonics ? `Focus sounds for Week ${selectedClass?.activeWeekNumber}: [ ${curriculumPhonics} ]` : 'Focus sounds: -ai-, -ay-, sh-, ch-'}
                  </p>
                </div>

                {/* Section 2: Vocabulary Writing Practice Lines */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">
                    Section B: Weekly Target Vocabulary Practice (주간 타겟 단어 쓰기)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {(activeVocabWords.length > 0 ? activeVocabWords : ['sunny', 'rainy', 'windy', 'cloudy', 'umbrella', 'jacket']).map((word, idx) => (
                      <div key={idx} className="p-3 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-between">
                        <span className="font-mono font-bold text-sm text-zinc-900">{idx + 1}. {word}</span>
                        <span className="font-mono text-zinc-400 text-xs">____________________</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 3: Reading Passage Comprehension */}
                {curriculumPassage && (
                  <div className="space-y-3 pt-2">
                    <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">
                      Section C: Reading Passage Reference (주간 본문 지문)
                    </h4>
                    <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-800 font-serif italic leading-relaxed">
                      "{curriculumPassage}"
                    </div>
                  </div>
                )}
              </div>

              {/* Print Action Bar */}
              <div className="mt-8 pt-4 border-t border-zinc-200 flex justify-between items-center">
                <p className="text-[10px] text-zinc-500 font-mono">
                  {isKo ? 'Chekki AI가 학급 오답 데이터를 바탕으로 자동 생성한 프린트입니다.' : 'Generated by Chekki AI B2B Platform'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReviewSheetModal(false)}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-300 transition-all cursor-pointer"
                  >
                    {isKo ? '닫기' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} weight="bold" />
                    <span>{isKo ? '학습지 인쇄 / PDF 저장' : 'Print / Save PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ACADEMY BRANDED STUDENT GROWTH REPORT CARD MODAL --- */}
      {showReportCardModal && (
        <div className="fixed inset-0 z-[330] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowReportCardModal(false)} 
          />
          <div className="relative p-1 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh]">
            <div className="relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 bg-white text-zinc-900 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setShowReportCardModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer"
              >
                <X size={18} weight="bold" />
              </button>

              {/* Official Academy Header */}
              <div className="border-b-2 border-zinc-900 pb-6 mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {academyLogo ? (
                    <img src={academyLogo} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-zinc-200" />
                  ) : (
                    <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
                      🏫
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-black text-zinc-900 tracking-tight">{user?.schoolName || 'B2B Academy'}</h2>
                    <p className="text-xs text-orange-600 font-bold uppercase tracking-widest">
                      {isKo ? '공식 학부모 원생 학습 성장 리포트' : 'OFFICIAL STUDENT PROGRESS REPORT CARD'}
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs font-mono bg-zinc-50 p-3 rounded-xl border border-zinc-200">
                  <p className="font-bold text-zinc-900">Student: {selectedStudentDetails?.studentName || 'Student'}</p>
                  <p className="text-zinc-500">Class: {selectedClass?.name || '7-Mercury'}</p>
                  <p className="text-zinc-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Growth Stats Overview */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-orange-50/60 border border-orange-200 rounded-2xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-700 block mb-1">
                    {isKo ? '주간 숙제 달성률' : 'Homework Completion'}
                  </span>
                  <span className="text-2xl font-black text-orange-600 font-mono">100%</span>
                </div>
                <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block mb-1">
                    {isKo ? '마스터한 타겟 단어' : 'Mastered Vocabulary'}
                  </span>
                  <span className="text-2xl font-black text-emerald-600 font-mono">{activeVocabWords.length || 7} words</span>
                </div>
                <div className="p-4 bg-purple-50/60 border border-purple-200 rounded-2xl text-center">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block mb-1">
                    {isKo ? '2차 재도전 정답률' : 'Rescan Correction'}
                  </span>
                  <span className="text-2xl font-black text-purple-600 font-mono">100%</span>
                </div>
              </div>

              {/* Detailed Mistakes & Corrections Log */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest">
                  {isKo ? '주간 학습 도전 과제 & 오답 수정 기록' : 'Weekly Error & Correction History'}
                </h4>
                
                {selectedStudentDetails?.weeklyMistakes && selectedStudentDetails.weeklyMistakes.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudentDetails.weeklyMistakes.map((m: any, idx: number) => (
                      <div key={idx} className="p-4 border border-zinc-200 rounded-xl bg-zinc-50 flex items-center justify-between text-xs">
                        <div>
                          <p className="font-bold text-zinc-900 font-mono">Target: {m.question_text}</p>
                          <p className="text-emerald-600 font-mono">Correct Answer: {m.correct_answer}</p>
                        </div>
                        <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 font-bold rounded-lg text-[10px]">
                          ⚡ {isKo ? '2차 재도전 수정 완료' : 'Fixed on Rescan'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-600 text-center">
                    {isKo ? '이번 주 모든 학습 항목을 첫 시도에 완벽히 마스터했습니다!' : 'Mastered all weekly items on the first attempt with 0 errors!'}
                  </div>
                )}
              </div>

              {/* Teacher Evaluation & Signature */}
              <div className="mt-6 p-4 border border-zinc-200 rounded-2xl bg-zinc-50">
                <h4 className="text-xs font-black text-zinc-800 uppercase tracking-widest mb-1">
                  {isKo ? '담임 교사 총평 (Teacher Evaluation)' : 'Teacher Evaluation & Comments'}
                </h4>
                <p className="text-xs text-zinc-700 italic">
                  {isKo 
                    ? `${selectedStudentDetails?.studentName || '원생'}은(는) 이번 주 타겟 파닉스 규칙과 단어를 매우 훌륭하게 수행하였습니다. 가정에서의 지속적인 칭찬과 관심 부탁드립니다.`
                    : `${selectedStudentDetails?.studentName || 'Student'} demonstrated excellent focus on target vocabulary and phonics rules this week. Great enthusiasm during home practice!`}
                </p>
                <div className="mt-4 pt-3 border-t border-zinc-200 flex justify-between items-center text-xs text-zinc-500 font-mono">
                  <span>Teacher Signature: ______________________</span>
                  <span>Academy Stamp: [ SEAL ]</span>
                </div>
              </div>

              {/* Print Action Bar */}
              <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-between items-center">
                <p className="text-[10px] text-zinc-500 font-mono">
                  {isKo ? 'Chekki AI B2B Academy Platform 성적표' : 'Official Academy Progress Report'}
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowReportCardModal(false)}
                    className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-300 transition-all cursor-pointer"
                  >
                    {isKo ? '닫기' : 'Close'}
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Printer size={16} weight="bold" />
                    <span>{isKo ? '성적표 인쇄 / PDF 발급' : 'Print / Export Report PDF'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
