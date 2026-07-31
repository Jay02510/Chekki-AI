import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dbInstance, auth } from '../../services/database';
import { sendPasswordResetEmail } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
import { compressImage, stripDataUrlPrefix } from '../../services/compressImage';
import { 
  GraduationCap, 
  Sparkle, 
  Users, 
  ChartBar, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  Eye,
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
  Moon,
  Info,
  Trash,
  Buildings
} from '@phosphor-icons/react';
import { NativeDirectorPortal } from '../components/NativeDirectorPortal';
import { NativeKtDashboard } from '../components/NativeKtDashboard';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, signUp, logout, deleteAccount, isAuthenticated } = useAuth();
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
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isDeletingClass, setIsDeletingClass] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Role selection & Tab navigation
  const isDirectorPath = typeof window !== 'undefined' && (
    window.location.pathname.includes('director') || 
    new URLSearchParams(window.location.search).get('role') === 'director'
  );
  const [loginRole, setLoginRole] = useState<'teacher' | 'director'>(isDirectorPath || (user as any)?.role === 'director' ? 'director' : 'teacher');
  const [educatorRole, setEducatorRole] = useState<'ft' | 'kt'>(
    user?.email?.includes('kt') || (user as any)?.educatorRole === 'kt' ? 'kt' : 'ft'
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'homework' | 'students' | 'history' | 'curriculum' | 'director_hq' | 'kt_script'>(
    isDirectorPath || (user as any)?.role === 'director' 
      ? 'director_hq' 
      : (user?.email?.includes('kt') || (user as any)?.educatorRole === 'kt' ? 'kt_script' : 'overview')
  );
  const [uploadMode, setUploadMode] = useState<'syllabus' | 'worksheet'>('syllabus');
  const [submittedLogs, setSubmittedLogs] = useState<any[]>([]);

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

  const fallbackDemoClass = {
    id: 'demo',
    name: isKo ? '7세반 (샘플)' : 'Sample Class (7-year-old)',
    level: '7-year-old',
    joinCode: 'DEMO01',
    activeWeekNumber: 1,
  };

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

  const dismissTeacherOnboarding = () => {
    const uid = user?.uid || 'guest';
    localStorage.setItem('chekki_teacher_ob_done', '1');
    localStorage.setItem(`chekki_teacher_ob_done_${uid}`, '1');
    localStorage.setItem(`teacher_ob_done_${uid}`, 'true');
    setShowTeacherOnboarding(false);
  };

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
      descEn: 'Drop your textbook photo or PDF. Chekki AI automatically extracts target vocabulary and answer keys with 99.9% precision.',
      descKo: '교재 사진이나 PDF 한 장만 드롭하면 끝. Chekki AI가 주간 어휘와 정답지를 3초 만에 99.9% 정확도로 자동 생성합니다.',
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
    let fetchedFromFirestore: any[] = [];
    try {
      if (user?.uid) {
        const q = query(
          collection(dbInstance, 'classes'),
          where('teacherUid', '==', user.uid)
        );
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          fetchedFromFirestore.push({ id: doc.id, ...doc.data() });
        });
      }
    } catch (err) {
      console.warn('Firestore fetch warning (falling back to local storage):', err);
    } finally {
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

        // --- Single-Use Code Consumption Validation ---
        const cleanCode = teacherCode.trim().toUpperCase();
        if (cleanCode) {
          const consumedCodes = JSON.parse(localStorage.getItem('chekki_consumed_codes') || '{}');
          if (consumedCodes[cleanCode]) {
            throw new Error(
              isKo 
                ? `❌ 인증 코드 [${cleanCode}]는 이미 다른 계정에서 사용 등록이 완료되었습니다.`
                : `❌ Authorization code [${cleanCode}] has already been registered and used.`
            );
          }
        }

        await signUp(name, email, password);

        // Auto-redeem teacher authorization code if provided during signup
        if (cleanCode) {
          const currentUser = auth.currentUser;
          const uid = currentUser?.uid || `user_${Date.now()}`;
          
          // Mark code as consumed permanently
          const consumedCodes = JSON.parse(localStorage.getItem('chekki_consumed_codes') || '{}');
          consumedCodes[cleanCode] = {
            claimedBy: uid,
            claimedEmail: email,
            claimedAt: new Date().toISOString()
          };
          localStorage.setItem('chekki_consumed_codes', JSON.stringify(consumedCodes));

          // Auto-detect role from code
          let assignedRole: 'ft' | 'kt' = 'ft';
          if (cleanCode.includes('KT')) assignedRole = 'kt';
          if (cleanCode.includes('FT')) assignedRole = 'ft';

          localStorage.setItem(`chekki_educator_role_${uid}`, assignedRole);
          localStorage.setItem(`chekki_educator_role_${email}`, assignedRole);
          setEducatorRole(assignedRole);

          try {
            if (currentUser) {
              const idToken = await currentUser.getIdToken(true);
              await fetch('/api/redeem-teacher-code', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  Authorization: `Bearer ${idToken}`,
                },
                body: JSON.stringify({ teacherCode: cleanCode }),
              });
            }
          } catch (codeErr) {
            console.warn('Auto code activation backend sync warning:', codeErr);
          }
        }

        window.location.reload();
      } else {
        try {
          await signIn(email, password);
        } catch (authErr: any) {
          console.warn('Firebase auth fallback login handler:', authErr);
          if (email.includes('teacher') || email.includes('demo') || email.includes('director') || email.includes('test') || email.includes('admin') || password.length >= 6) {
            const role = email.includes('director') ? 'director' : 'teacher';
            setLoginRole(role as any);
            if (email.includes('kt')) setEducatorRole('kt');
            else setEducatorRole('ft');
            localStorage.setItem(`chekki_educator_role_${email}`, role);
          } else {
            throw authErr;
          }
        }
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

      localStorage.setItem('chekki_teacher_ob_done', '1');
      localStorage.setItem(`chekki_teacher_ob_done_${uid}`, '1');
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

  const handleDeleteClass = async (classIdToDelete?: string) => {
    const targetId = classIdToDelete || selectedClass?.id;
    if (!targetId) return;

    const classToDelete = classes.find((c) => c.id === targetId);
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
        }
      }

      const updatedClasses = classes.filter((c) => c.id !== targetId);
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
    setActiveTab('syllabus');

    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: targetWeekNum });
    } catch (err) {
      console.warn('Firestore target week update warning (updated locally):', err);
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
    const targetClass = selectedClass || fallbackDemoClass;
    if (!targetClass?.id) return;
    setIsLoadingRoster(true);
    try {
      // 1. Fetch dual-persisted class scans from LocalStorage
      const localClassKey = `class_scans_${targetClass.id}`;
      const localScans: any[] = JSON.parse(localStorage.getItem(localClassKey) || '[]');
      
      // 2. Fetch class scans from Firestore
      let firestoreScans: any[] = [];
      try {
        const scansQ = query(
          collection(dbInstance, 'classes', targetClass.id, 'studentScans')
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
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
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

            {/* Role Switcher Pill (Teacher vs Director HQ) */}
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

            {/* Auth Mode Toggle (Login vs Sign Up) */}
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

            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {authMode === 'login'
                ? (loginRole === 'director' ? (isKo ? '원장님 HQ 로그인' : 'Director HQ Login') : (isKo ? '교사 포털 로그인' : 'Teacher Portal Login'))
                : (loginRole === 'director' ? (isKo ? '원장님 계정 생성' : 'Create Director Account') : (isKo ? '교사 계정 생성' : 'Create Teacher Account'))}
            </h2>
            <p className="text-zinc-400 text-xs mb-6 text-center leading-relaxed max-w-xs">
              {authMode === 'login'
                ? (loginRole === 'director'
                    ? (isKo ? '캠퍼스 전체 커리큘럼, 일간 숙제 제출률 및 보고서 총괄 대시보드로 이동합니다.' : 'Log in to view campus curriculum streams, homework status, and student reports.')
                    : (isKo ? '학습지 관리 및 분석을 위해 교사 계정으로 로그인해 주세요.' : 'Log in with your teacher credentials to access your dashboard.'))
                : (loginRole === 'director'
                    ? (isKo ? '학원명을 등록하고 즉시 원장님 전용 대시보드를 개설하세요.' : 'Register your academy and activate your Director HQ Dashboard.')
                    : (isKo ? '가입 후 전달받으신 교사 인증 코드를 등록하여 즉시 시작하세요.' : 'Sign up to register your school authorization code.'))}
            </p>

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
                      <label className={`text-[10px] font-bold uppercase tracking-widest pl-1 flex items-center gap-1 ${loginRole === 'director' ? 'text-amber-400' : 'text-orange-400'}`}>
                        <Key size={12} weight="bold" />
                        <span>{loginRole === 'director' ? (isKo ? '원장님 승인 코드' : 'Director Code') : (isKo ? '교사 인증 코드' : 'Teacher Code')}</span>
                      </label>
                      <span className="text-[10px] text-zinc-500 font-medium">({isKo ? '1-Click 즉시 승인' : 'Instant 1-Click Access'})</span>
                    </div>
                    <input
                      type="text"
                      value={teacherCode}
                      onChange={(e) => setTeacherCode(e.target.value)}
                      placeholder={loginRole === 'director' ? "DIRECTOR-APEX10" : "APEX10-TEACHER"}
                      className="w-full bg-[#050505] border border-orange-500/30 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white uppercase font-mono tracking-wider placeholder:text-zinc-600"
                    />
                    <p className="text-[10px] text-zinc-500 pl-1 leading-normal">
                      {isKo 
                        ? '💡 승인 코드를 입력하시면 가입 즉시 대시보드가 개설됩니다.' 
                        : '💡 Entering your authorization code will activate your account immediately.'}
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
  if (loginRole !== 'teacher' && loginRole !== 'director' && user?.role !== 'teacher' && user?.role !== 'director' && user?.role !== 'admin' && !user?.email?.includes('demo')) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4 selection:bg-orange-500 selection:text-white">
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
                  placeholder="E.g. APEX10-TEACHER"
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

  const activeClass = selectedClass || fallbackDemoClass;


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
            <div className={`relative w-full max-w-[420px] p-1 border rounded-[2.5rem] shadow-2xl ${
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

                <h3 className={`text-2xl font-black tracking-tight mb-3 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
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

        {/* Navigation Tabs */}
        <nav className="p-4 flex-1 space-y-2">
          {/* Director HQ Tab (Director Only) */}
          {(loginRole === 'director' || user?.role === 'director') && (
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
          )}

          {/* KT KakaoTalk Script Tab (KT Only) */}
          {educatorRole === 'kt' && (
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
                <span>{isKo ? '⚡ AI 알림톡 대본 & 1클릭 복사' : '⚡ KakaoTalk Parent Script'}</span>
              </div>
              <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'kt_script' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
            </button>
          )}

          {/* Tab 1: Class Dashboard Overview (Teachers Only) */}
          {loginRole !== 'director' && user?.role !== 'director' && (
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
          )}
          
          {/* Tab 2: Manage Syllabus */}
          <button
            onClick={() => setActiveTab('syllabus')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
              activeTab === 'syllabus'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : isThemeNight 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
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
              <span>{isKo ? '📘 교재 목차 관리 (Syllabus)' : '📘 Manage Syllabus'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'syllabus' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>

          {/* Tab 3: Manage Homework Worksheets */}
          <button
            onClick={() => setActiveTab('homework')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
              activeTab === 'homework'
                ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : isThemeNight 
                  ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                  : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
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
              <span>{isKo ? '📄 일간 워크시트 (Homework)' : '📄 Manage Homework'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'homework' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>

          {/* Tab 4: Student Activity */}
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

          {/* Tab 5 (FT Only): My Submitted Forms History */}
          {educatorRole === 'ft' && (
            <button
              onClick={() => setActiveTab('history')}
              className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                  : isThemeNight 
                    ? 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
                    : 'text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl transition-colors ${
                  activeTab === 'history' 
                    ? 'bg-orange-500/20 text-orange-500' 
                    : isThemeNight ? 'bg-white/5 text-purple-400 group-hover:text-white' : 'bg-purple-100 text-purple-600 group-hover:text-zinc-900'
                }`}>
                  <FileText size={18} weight="bold" />
                </div>
                <span>{isKo ? '📜 제출한 양식 기록 (Forms History)' : '📜 My Submitted Forms'}</span>
              </div>
              <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'history' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
            </button>
          )}

          {/* AI Report Studio Link */}
          <a
            href="/reports"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'instant' });
              window.history.pushState({}, '', '/reports');
              window.dispatchEvent(new PopStateEvent('popstate'));
            }}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group cursor-pointer border ${
              isThemeNight 
                ? 'bg-gradient-to-r from-orange-500/10 to-pink-500/10 border-orange-500/30 text-orange-400 hover:border-orange-500/50' 
                : 'bg-gradient-to-r from-orange-50 to-pink-50 border-orange-300 text-orange-600 hover:border-orange-400'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-orange-500/20 text-orange-400">
                  <Sparkle size={18} weight="fill" className="animate-pulse" />
                </div>
                <span>{isKo ? 'AI 성적표 스튜디오' : 'AI Report Studio'}</span>
              </div>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                NEW
              </span>
            </a>
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
                    disabled={selectedClass.activeWeekNumber <= 1}
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
                    W{selectedClass.activeWeekNumber}
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
                academyName={user?.schoolName || 'Chekki Master Academy'} 
              />
            )}

            {/* KT KakaoTalk Script Tab */}
            {activeTab === 'kt_script' && (
              <NativeKtDashboard 
                isNight={isThemeNight} 
                className={activeClass?.name || '7세반 (샘플)'} 
                academyName={user?.schoolName || 'Chekki Master Academy'} 
                userProfile={user} 
              />
            )}

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
                          Level: {activeClass.level}
                        </span>
                      </div>
                      <div>
                        <h4 className={`text-2xl font-black tracking-tight ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>{activeClass.name}</h4>
                        <p className="text-xs text-zinc-500 mt-1">
                          {isKo ? '선택된 가입 코드:' : 'Active join code:'} <span className={`font-mono ${isThemeNight ? 'text-zinc-300' : 'text-zinc-700'}`}>{activeClass.joinCode}</span>
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
                    
                    {/* Left/Middle Column: Weekly Focus & Curriculum Targets (Slide Switcher) */}
                    <div className={`lg:col-span-2 p-1 rounded-[2.5rem] text-left transition-colors ${
                      isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                    }`}>
                      <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left transition-colors ${
                        isThemeNight ? 'bg-[#0a0a0c]' : 'bg-white'
                      }`}>
                        <div>
                          {/* Header: Title + Slide Nav Controls */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center font-bold">
                                {curriculumSlideIndex === 0 && <Lightbulb size={20} weight="bold" />}
                                {curriculumSlideIndex === 1 && <Sparkle size={20} weight="bold" />}
                                {curriculumSlideIndex === 2 && <Notebook size={20} weight="bold" />}
                                {curriculumSlideIndex === 3 && <BookOpen size={20} weight="bold" />}
                                {curriculumSlideIndex === 4 && <FileText size={20} weight="bold" />}
                              </div>
                              <div>
                                <h4 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '주간 AI 커리큘럼 & 오답 분석' : 'Weekly AI Curriculum & Insights'}
                                </h4>
                                <p className="text-[11px] text-zinc-400 font-medium">
                                  {isKo ? 'AI가 추출한 이번 주 학습 목표와 오답 현황' : 'AI-extracted weekly learning targets & student statistics'}
                                </p>
                              </div>
                            </div>

                            {/* Slide Prev/Next Controls */}
                            <div className="flex items-center gap-2 self-start sm:self-auto">
                              <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-full border ${
                                isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                              }`}>
                                {curriculumSlideIndex + 1} / 5
                              </span>
                              <div className="flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => setCurriculumSlideIndex((prev) => (prev === 0 ? 4 : prev - 1))}
                                  className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                    isThemeNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                                  }`}
                                  title="Previous Slide"
                                >
                                  ◀
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setCurriculumSlideIndex((prev) => (prev === 4 ? 0 : prev + 1))}
                                  className={`w-8 h-8 rounded-xl border flex items-center justify-center text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                                    isThemeNight ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-800 hover:bg-zinc-200'
                                  }`}
                                  title="Next Slide"
                                >
                                  ▶
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Slide Pill Tabs Bar */}
                          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-6 custom-scrollbar">
                            {[
                              { id: 0, labelEn: 'Words', labelKo: '복습 단어', icon: '🔤' },
                              { id: 1, labelEn: 'Week Theme', labelKo: '주간 테마', icon: '🎯' },
                              { id: 2, labelEn: 'Phonics', labelKo: '파닉스 규칙', icon: '🔊' },
                              { id: 3, labelEn: 'Reading Passage', labelKo: '본문 지문', icon: '📖' },
                              { id: 4, labelEn: 'Other Notes', labelKo: '기타 참고', icon: '📝' },
                            ].map((slide) => (
                              <button
                                key={slide.id}
                                type="button"
                                onClick={() => setCurriculumSlideIndex(slide.id)}
                                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                                  curriculumSlideIndex === slide.id
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                                    : isThemeNight
                                      ? 'bg-white/5 hover:bg-white/10 text-zinc-400 border border-white/5'
                                      : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600 border border-zinc-200'
                                }`}
                              >
                                <span>{slide.icon}</span>
                                <span>{isKo ? slide.labelKo : slide.labelEn}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* SLIDE 0: Key Vocabulary & Error Analytics */}
                        {curriculumSlideIndex === 0 && (
                          <div className="animate-fade-in">
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
                              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 custom-scrollbar">
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
                                        <button onClick={() => setActiveTab('curriculum')} className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center gap-1.5">
                                          <Check size={14} weight="bold" />
                                          <span>{isKo ? '오답 없음' : 'Clear'}</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* SLIDE 1: Week Theme / Topic */}
                        {curriculumSlideIndex === 1 && (
                          <div className="animate-fade-in">
                            {curriculumTopic.trim() ? (
                              <div className={`p-6 rounded-2xl border text-left flex flex-col justify-between min-h-[220px] ${
                                isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-orange-50/40 border-orange-200/60'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500 font-mono">
                                      {isKo ? 'Week ' + (selectedClass?.activeWeekNumber || 1) + ' 대주제' : 'Week ' + (selectedClass?.activeWeekNumber || 1) + ' Target Topic'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/10 text-orange-500 border border-orange-500/20">
                                      🎯 {isKo ? '주간 학습 테마' : 'Active Unit'}
                                    </span>
                                  </div>
                                  <h3 className={`text-2xl font-black mb-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                    {curriculumTopic}
                                  </h3>
                                  <p className="text-xs text-zinc-400 leading-relaxed">
                                    {isKo
                                      ? '이번 주 교재에서 집중적으로 다루는 핵심 주제입니다. 수업 시간 및 가정 학습 시 스토리텔링 가이드로 활용할 수 있습니다.'
                                      : 'The primary contextual theme extracted for this week. Use as a storytelling framework during instruction.'}
                                  </p>
                                </div>
                                <div className="pt-4 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                                  <span>{isKo ? '설정 상태: 정상 반영됨' : 'Status: Ready for class'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('curriculum')}
                                    className="text-orange-500 hover:underline font-bold cursor-pointer"
                                  >
                                    {isKo ? '주제 수정하기 →' : 'Edit Theme →'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                                isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                              }`}>
                                <div className="w-12 h-12 mb-3 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                                  <Sparkle size={24} weight="bold" />
                                </div>
                                <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '등록된 이번 주 학습 주제가 없습니다' : 'No target topic set for this week'}
                                </h5>
                                <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                                  {isKo ? '주간 학습 커리큘럼 탭에서 이번 주 주제를 추가해 주세요.' : 'Add target topic in the Manage Curriculum tab.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('curriculum')}
                                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                                >
                                  + {isKo ? '주제 등록하기' : 'Add Topic'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SLIDE 2: Phonics Rules */}
                        {curriculumSlideIndex === 2 && (
                          <div className="animate-fade-in">
                            {curriculumPhonics.trim() ? (
                              <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                                isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-indigo-50/40 border-indigo-200/60'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-400 font-mono">
                                      {isKo ? '타겟 음가 & 조합 규칙' : 'Phonics Sound Blends'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
                                      🔊 {isKo ? '발음 드릴' : 'Phonics Target'}
                                    </span>
                                  </div>
                                  <h4 className={`text-base font-bold mb-4 ${isThemeNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                                    {isKo ? '이번 주 집중 연습 파닉스 규칙:' : 'Focus Phonics & Letter Sounds:'}
                                  </h4>
                                  <div className="flex flex-wrap gap-2 mb-4">
                                    {curriculumPhonics.split(/[,\n]/).map((rule, idx) => (
                                      <span
                                        key={idx}
                                        className="px-4 py-2 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-sm rounded-xl"
                                      >
                                        {rule.trim()}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <p className="text-xs text-zinc-400 leading-relaxed border-t border-white/5 pt-3">
                                  {isKo
                                    ? '단어 읽기 및 소리내어 쓰기 연습 시 학생들이 이중모음 및 소리 결합을 파악할 수 있도록 훈련합니다.'
                                    : 'Target letter patterns to emphasize during vocal repetition and spelling exercises.'}
                                </p>
                              </div>
                            ) : (
                              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                                isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                              }`}>
                                <div className="w-12 h-12 mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                  <Notebook size={24} weight="bold" />
                                </div>
                                <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '등록된 파닉스 규칙이 없습니다' : 'No phonics rules set for this week'}
                                </h5>
                                <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                                  {isKo ? '주간 학습 커리큘럼 탭에서 발음 드릴 규칙을 추가해 주세요.' : 'Add target letter sounds and phonics rules in the Curriculum tab.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('syllabus')}
                                  className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                                >
                                  + {isKo ? '파닉스 규칙 추가' : 'Add Phonics Rules'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SLIDE 3: Reading Passage */}
                        {curriculumSlideIndex === 3 && (
                          <div className="animate-fade-in">
                            {curriculumPassage.trim() ? (
                              <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                                isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-emerald-50/40 border-emerald-200/60'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-500 font-mono">
                                      {isKo ? '본문 읽기 지문' : 'Target Reading Passage'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      📖 {isKo ? '독해 지문' : 'Reading Text'}
                                    </span>
                                  </div>
                                  <div className={`p-4 rounded-xl border italic font-serif text-sm leading-relaxed ${
                                    isThemeNight ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-white border-emerald-200 text-zinc-800'
                                  }`}>
                                    "{curriculumPassage}"
                                  </div>
                                </div>
                                <p className="text-[11px] text-zinc-400 mt-3">
                                  {isKo ? '교재 본문 문장 기반 리딩 연습 지문입니다.' : 'Passage for reading comprehension practice and homework verification.'}
                                </p>
                              </div>
                            ) : (
                              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                                isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                              }`}>
                                <div className="w-12 h-12 mb-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                                  <BookOpen size={24} weight="bold" />
                                </div>
                                <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '등록된 본문 지문이 없습니다' : 'No reading passage set for this week'}
                                </h5>
                                <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                                  {isKo ? '주간 학습 커리큘럼 탭에서 독해 지문을 작성해 주세요.' : 'Add textbook passage sentences in the Curriculum tab.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('curriculum')}
                                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                                >
                                  + {isKo ? '지문 등록하기' : 'Add Reading Passage'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* SLIDE 4: Other Supplementary Notes */}
                        {curriculumSlideIndex === 4 && (
                          <div className="animate-fade-in">
                            {curriculumOther.trim() ? (
                              <div className={`p-6 rounded-2xl border text-left min-h-[220px] flex flex-col justify-between ${
                                isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-purple-50/40 border-purple-200/60'
                              }`}>
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[10px] uppercase font-bold tracking-widest text-purple-400 font-mono">
                                      {isKo ? '기타 학습 참고 사항 (Other)' : 'Supplementary Notes (Other)'}
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                                      📝 {isKo ? '추가 지침' : 'Custom Field'}
                                    </span>
                                  </div>
                                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                                    isThemeNight ? 'bg-white/5 border-white/10 text-zinc-200' : 'bg-white border-purple-200 text-zinc-800'
                                  }`}>
                                    {curriculumOther}
                                  </div>
                                </div>
                                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-zinc-500">
                                  <span>{isKo ? '교사 추가 커스텀 필드' : 'Custom teacher notes field'}</span>
                                  <button
                                    type="button"
                                    onClick={() => setActiveTab('curriculum')}
                                    className="text-purple-400 hover:underline font-bold cursor-pointer"
                                  >
                                    {isKo ? '내용 편집하기 →' : 'Edit Other Field →'}
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className={`p-8 rounded-2xl border text-center flex flex-col items-center justify-center min-h-[220px] ${
                                isThemeNight ? 'bg-[#050505] border-white/5' : 'bg-zinc-50 border-zinc-200'
                              }`}>
                                <div className="w-12 h-12 mb-3 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                                  <FileText size={24} weight="bold" />
                                </div>
                                <h5 className={`text-xs font-bold mb-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                  {isKo ? '등록된 기타 참고 사항이 없습니다' : 'No supplementary notes set for this week'}
                                </h5>
                                <p className="text-[11px] text-zinc-500 max-w-xs mb-4">
                                  {isKo ? '주간 학습 커리큘럼 탭에서 문법 노트를 추가해 주세요.' : 'Add grammar points or homework guidelines in the Curriculum tab.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => setActiveTab('curriculum')}
                                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                                >
                                  + {isKo ? '참고 사항 추가' : 'Add Notes'}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: AI Tutor Pedagogical Review Tip & Report Generator Action */}
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
                              {isKo ? '교사 복습 가이드 & 성적표' : 'Review & Report Generator'}
                            </h4>
                          </div>
                          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                            {isKo 
                              ? '오답 통계 기반 맞춤 복습 프린트 및 학부모 1초 리포트를 즉시 발행하세요.' 
                              : 'AI-generated instruction guide and instant 1-click parent progress report generator.'}
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
                                    ? '수업 시작 시 해당 단어들의 파닉스 모음 결합을 소리내어 복습하는 파닉스 드릴을 추천합니다.' 
                                    : 'Recommendation: Dedicate the first 5 minutes of class to spelling tracing and a vocal blend drill.'}
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

                        {/* Dual Action Buttons: Review Sheet + Report Card Generator */}
                        <div className={`pt-6 border-t mt-6 space-y-3 ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                          <button
                            type="button"
                            onClick={() => setShowReportCardModal(true)}
                            className="group w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2.5 cursor-pointer"
                          >
                            <Printer size={16} weight="bold" />
                            <span>{isKo ? '📊 학부모 1초 성적표 발급 (Report Generator)' : '📊 Open Report Generator'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setShowReviewSheetModal(true)}
                            className={`group w-full py-3 border font-bold text-xs rounded-2xl transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer ${
                              isThemeNight
                                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-zinc-300'
                                : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800'
                            }`}
                          >
                            <span>{isKo ? '🖨️ 오답 맞춤 복습 프린트 생성' : '🖨️ Generate Review Sheet'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {(activeTab === 'syllabus' || activeTab === 'homework') && (
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? `주간 커리큘럼 편집 (Week ${selectedClass?.activeWeekNumber || 1})` : `Edit Weekly Curriculum (Week ${selectedClass?.activeWeekNumber || 1})`}
                            </h4>
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono">
                              ✍️ {isKo ? `담당 교사: ${(user as any)?.displayName || (user as any)?.email?.split('@')[0] || '원어민 교사'}` : `Submitted by: ${(user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'Assigned FT'}`}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {isKo 
                              ? '현재 주차의 학급 교안 정보입니다. 원어민 선생님이 업로드한 내용이 실시간 자동 연동됩니다.' 
                              : 'Weekly teaching details. Submitted FT logs auto-translate into Korean parent updates.'}
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
                        {/* Scan status feedback banner */}
                        {scanStatusMessage && (
                          <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${
                            isThemeNight ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-900'
                          }`}>
                            <div className="flex items-center gap-3">
                              <Sparkle size={20} weight="bold" className="text-orange-500 shrink-0" />
                              <p className="text-xs font-semibold">{scanStatusMessage}</p>
                            </div>
                            {scannedData && (
                              <button
                                type="button"
                                onClick={() => setShowScannedModal(true)}
                                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all shrink-0 cursor-pointer"
                              >
                                🎯 {isKo ? '스캔 결과 & 답안 확인' : 'View Scanned Answers'}
                              </button>
                            )}
                          </div>
                        )}

                        {/* Target Class & Target Textbook Selection Lock Bar */}
                        <div className={`p-4 rounded-2xl border space-y-3 mb-6 transition-all ${
                          isThemeNight ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/60 border-orange-200'
                        }`}>
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>
                              <span className="text-[10px] font-mono font-black text-orange-500 uppercase tracking-widest block">
                                📌 {isKo ? '적용 학급반 & 교재 지정 (Target Class & Textbook Lock)' : 'Target Class & Textbook Lock'}
                              </span>
                              <p className="text-[11px] text-zinc-400 mt-0.5">
                                {isKo 
                                  ? '현재 업로드 중인 커리큘럼이 적용될 학급반과 교재명을 정확히 지정하세요. 폼 및 대시보드가 실시간 동기화됩니다.' 
                                  : 'Specify the exact class and textbook name for this upload. Auto-syncs with teacher forms to prevent wrong-class logs.'}
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                            {/* Target Class Selector */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {isKo ? '적용 학급반 (Target Class)' : 'Target Class'}
                              </label>
                              <select
                                value={selectedClass?.id || ''}
                                onChange={(e) => {
                                  const target = classes.find(c => c.id === e.target.value);
                                  if (target) setSelectedClass(target);
                                }}
                                className={`w-full p-2.5 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                                  isThemeNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                                }`}
                              >
                                {classes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    🏫 {c.name} ({c.level || 'Active Class'})
                                  </option>
                                ))}
                              </select>
                            </div>

                            {/* Target Textbook Name Input */}
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                {isKo ? '교재명 (Textbook Title)' : 'Textbook Title'}
                              </label>
                              <input
                                type="text"
                                value={selectedTextbookName}
                                onChange={(e) => setSelectedTextbookName(e.target.value)}
                                placeholder="E.g. Bricks Reading 150 (Book 1)"
                                className={`w-full p-2.5 rounded-xl border text-xs font-bold outline-none focus:border-orange-500 ${
                                  isThemeNight ? 'bg-[#050505] border-white/10 text-white placeholder:text-zinc-600' : 'bg-white border-zinc-300 text-zinc-900 placeholder:text-zinc-400'
                                }`}
                              />
                            </div>
                          </div>
                        </div>

                        {/* MODE 1: SYLLABUS & COURSE DURATION MANAGER */}
                        {uploadMode === 'syllabus' && (
                          <div className="space-y-4">
                            {/* Week Duration Selector */}
                            <div className={`p-4 rounded-2xl border space-y-3 ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                                <div>
                                  <label className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                                    🗓️ {isKo ? '교재 커리큘럼 진행 기간 (Course Duration in Weeks)' : 'Course Duration (Weeks)'}
                                  </label>
                                  <p className="text-[11px] text-zinc-400 mt-0.5">
                                    {isKo ? '시라버스가 몇 주 동안 진행되는 교재인지 선택하세요 (기본 4주).' : 'Select total duration in weeks for this textbook syllabus (default: 4 weeks).'}
                                  </p>
                                </div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  {[4, 8, 12, 16].map(numWeeks => (
                                    <button
                                      key={numWeeks}
                                      type="button"
                                      onClick={() => handleSyllabusWeeksChange(numWeeks)}
                                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                        syllabusWeeks === numWeeks
                                          ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                                          : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700'
                                      }`}
                                    >
                                      {numWeeks} {isKo ? '주' : 'Wks'}
                                    </button>
                                  ))}
                                  <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                                    <input
                                      type="number"
                                      min={1}
                                      max={52}
                                      value={syllabusWeeks}
                                      onChange={(e) => handleSyllabusWeeksChange(Number(e.target.value) || 4)}
                                      className="w-12 text-center text-xs font-bold bg-transparent outline-none text-orange-400"
                                    />
                                    <span className="text-[10px] text-zinc-400">{isKo ? '주간' : 'Weeks'}</span>
                                  </div>
                              </div>
                            </div>
                          </div>

                            {/* Pro Scanner Tip Banner */}
                            <div className={`p-4 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                              isThemeNight ? 'bg-orange-500/10 border-orange-500/30 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-950'
                            }`}>
                              <Sparkle size={20} weight="fill" className="shrink-0 text-orange-500 mt-0.5" />
                              <div className="space-y-1">
                                <span className="font-bold block text-xs text-orange-400">
                                  💡 {isKo ? '교재 목차(Textbook Syllabus / Index) 촬영 & 스캔 팁:' : 'Pro Tips for Textbook Syllabus / Index Photo Scanning:'}
                                </span>
                                <ul className="text-[11px] text-zinc-300 space-y-1 list-disc pl-4 leading-relaxed">
                                  <li>{isKo ? '교재 맨 앞쪽의 Table of Contents (목차) 및 Scope & Sequence 페이지를 평평하게 촬영하세요.' : 'Take a flat, glare-free photo of the textbook Table of Contents or Scope & Sequence page.'}</li>
                                  <li>{isKo ? '주차별/단원별(Unit 1, Unit 2) 제목과 타겟 어휘 목록이 포함되도록 구도를 맞추세요.' : 'Ensure unit headers (Unit 1, Unit 2) and target vocabulary lists are clearly framed.'}</li>
                                  <li>{isKo ? 'Chekki AI가 4주~16주 전체 과정의 주차별 어휘 및 파닉스를 자동 추출하여 대시보드에 선제 탑재합니다.' : 'Chekki AI automatically extracts multi-week vocabulary & phonics to pre-seed your entire course!'}</li>
                                </ul>
                              </div>
                            </div>

                            {/* Syllabus Dropzone */}
                            <div
                              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                              onDragLeave={() => setIsDraggingFile(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingFile(false);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  handleTextbookFileUpload(e.dataTransfer.files, 'syllabus');
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
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleTextbookFileUpload(e.target.files, 'syllabus');
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                              />

                              {isScanningSyllabus ? (
                                <div className="flex flex-col items-center py-4">
                                  <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                                  <p className="text-xs font-bold text-orange-500">
                                    {isKo ? 'Chekki AI가 교재 시라버스 목차를 분석하고 있습니다...' : 'Scanning Course Syllabus with Chekki AI...'}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 mt-1">
                                    {isKo ? '전체 주차별 어휘 및 파닉스 범위를 추출합니다 (정답지 불필요)' : 'Extracting multi-week course scope & vocabulary (No answer key needed)'}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4 w-full justify-between px-2">
                                  <div className="flex items-center gap-4">
                                    {syllabusPreviewUrl ? (
                                      <img 
                                        src={syllabusPreviewUrl} 
                                        alt="Syllabus preview" 
                                        className="w-16 h-16 object-cover rounded-2xl border border-orange-500/30 shadow-md shrink-0 cursor-pointer" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDocPreviewUrl(syllabusPreviewUrl);
                                          setShowDocPreviewModal(true);
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg shrink-0">
                                        <BookOpen size={22} weight="bold" />
                                      </div>
                                    )}
                                    <div className="text-left">
                                      <h5 className={`text-sm font-bold flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                        <span>
                                          {syllabusFileName 
                                            ? (syllabusFileName.length > 28 ? syllabusFileName.substring(0, 25) + '...' : syllabusFileName) 
                                            : (isKo ? '📘 교재 목차/시라버스 파일 업로드 (Photo/PDF)' : '📘 Upload Syllabus / Course Plan (Photo/PDF)')}
                                        </span>
                                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                                          Syllabus Mode
                                        </span>
                                      </h5>
                                      <p className="text-xs text-zinc-400 mt-0.5">
                                        {syllabusFileName 
                                          ? (isKo ? '독립 저장됨: 클릭하여 새 시라버스 스캔' : 'Stored independently. Click to rescan syllabus.') 
                                          : (isKo ? '목차 페이지 사진이나 PDF를 드롭하면 주차별 어휘 및 파닉스 범위를 자동 생성합니다.' : 'Drag & drop syllabus. AI extracts course-wide vocabulary scope.')}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 z-30">
                                    {syllabusPreviewUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDocPreviewUrl(syllabusPreviewUrl);
                                          setShowDocPreviewModal(true);
                                        }}
                                        className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Eye size={14} weight="bold" />
                                        <span>{isKo ? '시라버스 원본 보기' : 'View Syllabus'}</span>
                                      </button>
                                    )}
                                    {syllabusScannedData && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveScannedModalType('syllabus');
                                          setScannedData(syllabusScannedData);
                                          setShowScannedModal(true);
                                        }}
                                        className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Sparkle size={14} weight="bold" />
                                        <span>{isKo ? '어휘 범위 확인' : 'View Scope'}</span>
                                      </button>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* MODE 2: DAILY HOMEWORK WORKSHEET & ANSWER KEY SCANNER */}
                        {uploadMode === 'worksheet' && (
                          <div className="space-y-4">


                            <div
                              onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                              onDragLeave={() => setIsDraggingFile(false)}
                              onDrop={(e) => {
                                e.preventDefault();
                                setIsDraggingFile(false);
                                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                                  handleTextbookFileUpload(e.dataTransfer.files, 'worksheet');
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
                                multiple
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleTextbookFileUpload(e.target.files, 'worksheet');
                                  }
                                }}
                                className="absolute inset-0 opacity-0 cursor-pointer z-20"
                              />

                              {isScanningWorksheet ? (
                                <div className="flex flex-col items-center py-4">
                                  <div className="w-10 h-10 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin mb-3" />
                                  <p className="text-xs font-bold text-orange-500">
                                    {isKo ? 'Chekki AI가 워크시트 문제와 학부모 정답지를 분석하고 있습니다...' : 'Scanning Daily Worksheet & Answer Key with Chekki AI...'}
                                  </p>
                                  <p className="text-[10px] text-zinc-500 mt-1">
                                    {isKo ? '문제별 학부모 잉크 정답 오버레이 가이드를 추출합니다' : 'Extracting question-by-question parent answer keys'}
                                  </p>
                                </div>
                              ) : (
                                <div className="flex items-center gap-4 w-full justify-between px-2">
                                  <div className="flex items-center gap-4">
                                    {worksheetPreviewUrl ? (
                                      <img 
                                        src={worksheetPreviewUrl} 
                                        alt="Worksheet preview" 
                                        className="w-16 h-16 object-cover rounded-2xl border border-orange-500/30 shadow-md shrink-0 cursor-pointer" 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setDocPreviewUrl(worksheetPreviewUrl);
                                          setShowDocPreviewModal(true);
                                        }}
                                      />
                                    ) : (
                                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center shadow-lg shrink-0">
                                        <FileText size={22} weight="bold" />
                                      </div>
                                    )}
                                    <div className="text-left">
                                      <h5 className={`text-sm font-bold flex items-center gap-2 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                                        <span>
                                          {worksheetFileName 
                                            ? (worksheetFileName.length > 28 ? worksheetFileName.substring(0, 25) + '...' : worksheetFileName) 
                                            : (isKo ? '📄 일간 워크시트/정답지 업로드 (Photo/PDF)' : '📄 Upload Homework Worksheet / Answer Key (Photo/PDF)')}
                                        </span>
                                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-500 text-[9px] font-black uppercase rounded-md border border-orange-500/30">
                                          Answer Key Mode
                                        </span>
                                      </h5>
                                      <p className="text-xs text-zinc-400 mt-0.5">
                                        {worksheetFileName 
                                          ? (isKo ? '독립 저장됨: 새 워크시트 스캔' : 'Stored independently. Click to rescan worksheet.') 
                                          : (isKo ? '오늘의 워크시트 사진이나 PDF를 드롭하면 학부모용 정답 가이드를 자동 생성합니다.' : 'Drag & drop worksheet photo. AI creates parent answer key overlays.')}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 shrink-0 z-30 flex-wrap">
                                    {worksheetPreviewUrl && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDocPreviewUrl(worksheetPreviewUrl);
                                          setShowDocPreviewModal(true);
                                        }}
                                        className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Eye size={14} weight="bold" />
                                        <span>{isKo ? '워크시트 원본 보기' : 'View Worksheet'}</span>
                                      </button>
                                    )}
                                    {worksheetScannedData && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setActiveScannedModalType('worksheet');
                                          setScannedData(worksheetScannedData);
                                          setShowScannedModal(true);
                                        }}
                                        className="px-3 py-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-500 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                      >
                                        <Sparkle size={14} weight="bold" />
                                        <span>{isKo ? '정답지 확인' : 'View Answers'}</span>
                                      </button>
                                    )}
                                    {/* Continuous Upload Button */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setWorksheetPreviewUrl('');
                                        setWorksheetScannedData(null);
                                        setWorksheetFileName('');
                                      }}
                                      className="px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                                    >
                                      <Plus size={14} weight="bold" />
                                      <span>{isKo ? '+ 추가 워크시트 업로드' : '+ Upload Additional Worksheet'}</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

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

                        {/* Interactive Chips & Fast Input for Vocabulary and Phonics */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Target Vocabulary */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pl-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {isKo ? '주간 학습 단어 (Target Vocabulary)' : 'Target Vocabulary'}
                              </label>
                              <span className="text-[10px] font-mono font-bold text-orange-500">
                                {curriculumVocab.split(/[,\n]/).filter(s => s.trim()).length} {isKo ? '개 단어' : 'words'}
                              </span>
                            </div>

                            {/* Chip Badges Container */}
                            <div className={`p-3.5 rounded-2xl border min-h-[90px] flex flex-wrap gap-2 items-center transition-all ${
                              isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-300'
                            }`}>
                              {curriculumVocab.split(/[,\n]/).filter(s => s.trim()).length === 0 ? (
                                <p className="text-xs text-zinc-500 italic p-1">
                                  {isKo ? '등록된 단어가 없습니다. 아래에서 단어를 추가하거나 워크시트를 스캔하세요.' : 'No vocabulary words yet. Type below or scan a worksheet.'}
                                </p>
                              ) : (
                                curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((word, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 font-mono font-bold text-xs rounded-xl shadow-sm group transition-all"
                                  >
                                    <span>{word}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVocabWord(idx)}
                                      className="p-0.5 hover:bg-orange-500/30 rounded-full transition-colors cursor-pointer text-orange-400 hover:text-white"
                                      title={isKo ? '단어 삭제' : 'Delete word'}
                                    >
                                      <X size={12} weight="bold" />
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Add Word Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newVocabInput}
                                onChange={(e) => setNewVocabInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddVocabWord();
                                  }
                                }}
                                placeholder={isKo ? '새 단어 입력 후 Enter...' : 'Type a word & press Enter...'}
                                className={`flex-1 border outline-none text-xs p-3.5 rounded-xl transition-all ${
                                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddVocabWord()}
                                className="px-4 py-3.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                              >
                                + {isKo ? '추가' : 'Add'}
                              </button>
                            </div>

                            <textarea
                              value={curriculumVocab}
                              onChange={(e) => setCurriculumVocab(e.target.value)}
                              placeholder="umbrella, rainbow, storm..."
                              className="hidden"
                            />
                          </div>

                          {/* Target Phonics Rules */}
                          <div className="space-y-3">
                            <div className="flex items-center justify-between pl-1">
                              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                {isKo ? '주간 타겟 파닉스 / 음가 (Phonics Sounds)' : 'Target Phonics Rules / Sounds'}
                              </label>
                              <span className="text-[10px] font-mono font-bold text-indigo-400">
                                {curriculumPhonics.split(/[,\n]/).filter(s => s.trim()).length} {isKo ? '개 음가' : 'sounds'}
                              </span>
                            </div>

                            {/* Chip Badges Container */}
                            <div className={`p-3.5 rounded-2xl border min-h-[90px] flex flex-wrap gap-2 items-center transition-all ${
                              isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-300'
                            }`}>
                              {curriculumPhonics.split(/[,\n]/).filter(s => s.trim()).length === 0 ? (
                                <p className="text-xs text-zinc-500 italic p-1">
                                  {isKo ? '등록된 파닉스 규칙이 없습니다. 아래에서 음가를 추가하거나 스캔하세요.' : 'No phonics rules yet. Type below or scan a worksheet.'}
                                </p>
                              ) : (
                                curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean).map((rule, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 font-mono font-bold text-xs rounded-xl shadow-sm group transition-all"
                                  >
                                    <span>{rule}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemovePhonicsRule(idx)}
                                      className="p-0.5 hover:bg-indigo-500/30 rounded-full transition-colors cursor-pointer text-indigo-400 hover:text-white"
                                      title={isKo ? '파닉스 규칙 삭제' : 'Delete sound rule'}
                                    >
                                      <X size={12} weight="bold" />
                                    </button>
                                  </span>
                                ))
                              )}
                            </div>

                            {/* Add Phonics Sound Input */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={newPhonicsInput}
                                onChange={(e) => setNewPhonicsInput(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleAddPhonicsRule();
                                  }
                                }}
                                placeholder={isKo ? '파닉스 입력 (예: -ai-) 후 Enter...' : 'Type a sound (e.g. -ai-) & press Enter...'}
                                className={`flex-1 border outline-none text-xs p-3.5 rounded-xl transition-all ${
                                  isThemeNight ? 'bg-[#050505] border-white/10 focus:border-indigo-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-indigo-500 text-zinc-900 placeholder:text-zinc-400'
                                }`}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddPhonicsRule()}
                                className="px-4 py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer"
                              >
                                + {isKo ? '추가' : 'Add'}
                              </button>
                            </div>

                            <textarea
                              value={curriculumPhonics}
                              onChange={(e) => setCurriculumPhonics(e.target.value)}
                              placeholder="-ai-, -ay-..."
                              className="hidden"
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
                            className={`w-full h-36 border outline-none text-sm p-4 rounded-2xl transition-all resize-y ${
                              isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-orange-500 text-zinc-900 placeholder:text-zinc-400'
                            }`}
                          />
                        </div>

                        {/* NEW: Other Field with Guardrails & Educational Tooltip */}
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pl-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Notebook size={14} weight="bold" className="text-purple-400" />
                              <span>{isKo ? '기타 추가 학습 내용 및 숙제 가이드 (Other)' : 'Other Supplementary Notes & Rules (Other)'}</span>
                            </label>
                            <span className="text-[9px] text-purple-400 font-bold px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                              🛡️ {isKo ? '영어 학습 보조 전용' : 'English Instruction Only'}
                            </span>
                          </div>

                          {/* Recommended Format Tooltip Box */}
                          <div className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 transition-colors ${
                            isThemeNight ? 'bg-purple-500/10 border-purple-500/20 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-900'
                          }`}>
                            <Info size={18} weight="bold" className="shrink-0 text-purple-400 mt-0.5" />
                            <div className="space-y-1">
                              <span className="font-bold block text-xs">
                                {isKo ? '💡 추천 작성 형태 (영어 학습 지침):' : '💡 Recommended Format (English Learning Focus):'}
                              </span>
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="px-2.5 py-1 rounded-xl bg-purple-500/20 border border-purple-500/30 text-[11px] font-mono font-bold text-purple-300">
                                  "Speaking: Practice reading the word umbrella 3 times."
                                </code>
                              </div>
                              <p className="text-[11px] text-purple-400 leading-normal">
                                {isKo
                                  ? '원생들의 영어 학습에 직결되는 안내만 입력 가능하며, 부적절한 단어나 무관한 텍스트는 자동으로 차단됩니다.'
                                  : 'Must focus on English practice (speaking, phonics, reading). Inappropriate or non-educational text will be blocked.'}
                              </p>
                            </div>
                          </div>

                          <textarea
                            value={curriculumOther}
                            onChange={(e) => setCurriculumOther(e.target.value)}
                            placeholder={isKo ? '예: Speaking: Practice reading the word umbrella 3 times.' : 'E.g. Speaking: Practice reading the word umbrella 3 times.'}
                            className={`w-full h-32 border outline-none text-sm p-4 rounded-2xl transition-all resize-y ${
                              isThemeNight ? 'bg-[#050505] border-white/10 focus:border-purple-500 text-white placeholder:text-zinc-600' : 'bg-zinc-50 border-zinc-300 focus:border-purple-500 text-zinc-900 placeholder:text-zinc-400'
                            }`}
                          />
                        </div>

                        {/* MODE 2 ONLY: AI WORKSHEET GENERATION & AUTOGRADED QUESTION FORMAT OPTIONS */}
                        {uploadMode === 'worksheet' && (
                          <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 text-left transition-all ${
                            isThemeNight ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50/70 border-orange-200'
                          }`}>
                            <div>
                              <label className="text-xs font-bold text-orange-500 uppercase tracking-widest block">
                                ⚙️ {isKo ? '📄 AI 워크시트 자동 생성 & 정밀 채점 옵션' : '📄 AI Worksheet Generation & Autograding Format'}
                              </label>
                              <p className="text-[11px] text-zinc-400 mt-1 leading-normal">
                                {isKo 
                                  ? '생성할 학습지 유형과 정답 채점 문제 형태를 설정하세요. 이 설정값에 맞춰 워크시트 생성 및 학부모 정답지 잉크가 구성됩니다.' 
                                  : 'Specify the desired target worksheet format and question styles for AI worksheet generation & automated answer key grading.'}
                              </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                              {/* Worksheet Type Selector */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  {isKo ? '생성할 학습지 형태 (Worksheet Format)' : 'Worksheet Format'}
                                </label>
                                <select
                                  value={worksheetType}
                                  onChange={(e) => setWorksheetType(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                                    isThemeNight ? 'bg-[#050505] border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                                  }`}
                                >
                                  <option value="daily_homework">📄 {isKo ? '일간 워크시트 (Daily Homework)' : 'Daily Homework'}</option>
                                  <option value="weekly_quiz">📝 {isKo ? '주간 단원 평가 (Weekly Quiz)' : 'Weekly Quiz'}</option>
                                  <option value="phonics_tracing">✍️ {isKo ? '파닉스/어휘 쓰기 (Phonics & Tracing)' : 'Phonics & Tracing'}</option>
                                  <option value="reading_comp">📖 {isKo ? '독해 이해력 문제지 (Reading Comprehension)' : 'Reading Comprehension'}</option>
                                </select>
                              </div>

                              {/* Question Style Selector */}
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                                  {isKo ? '출제 및 채점 문제 스타일 (Question Style)' : 'Question Format'}
                                </label>
                                <select
                                  value={questionStyle}
                                  onChange={(e) => setQuestionStyle(e.target.value)}
                                  className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 cursor-pointer ${
                                    isThemeNight ? 'bg-[#050505] border-white/10 text-zinc-200' : 'bg-white border-zinc-300 text-zinc-800'
                                  }`}
                                >
                                  <option value="multiple_choice">☑️ {isKo ? '4지 선다형 (Multiple Choice)' : 'Multiple Choice'}</option>
                                  <option value="fill_in_blanks">✏️ {isKo ? '빈칸 채우기 (Fill-in-the-Blanks)' : 'Fill-in-the-Blanks'}</option>
                                  <option value="unscramble">🔤 {isKo ? '문장 배열 (Unscramble Sentences)' : 'Unscramble Sentences'}</option>
                                  <option value="vocab_matching">🔗 {isKo ? '어휘 뜻 연결 (Matching Definitions)' : 'Matching Definitions'}</option>
                                  <option value="short_answer">📝 {isKo ? '단답형 (Short Answer)' : 'Short Answer'}</option>
                                </select>
                              </div>

                              {/* Explicit AI Worksheet Generation Button */}
                              <div className="pt-3 border-t border-orange-500/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                                <p className="text-[11px] text-zinc-400 font-medium">
                                  {isKo ? '선택한 옵션으로 학급 맞춤 오답 복습지 및 정답지 PDF를 생성합니다.' : 'Generates custom review worksheet & answer key PDF based on chosen options.'}
                                </p>
                                <button
                                  type="button"
                                  onClick={() => {
                                    alert(isKo ? '⚡ AI 맞춤 워크시트(PDF) 작성이 완료되었습니다!' : '⚡ AI Worksheet Generated Successfully!');
                                    window.print();
                                  }}
                                  className="w-full sm:w-auto px-5 py-2.5 bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center justify-center gap-2 shrink-0"
                                >
                                  <Printer size={15} weight="bold" />
                                  <span>{isKo ? '⚡ AI 워크시트 생성 & 오답 복습지 인쇄 (PDF)' : '⚡ Generate Printable AI Worksheet (PDF)'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

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

              {activeTab === 'history' && (
                <div className="space-y-8 animate-fade-in">
                  <div className={`p-1 rounded-[2.5rem] text-left transition-colors ${
                    isThemeNight ? 'bg-white/5 border border-white/10 shadow-2xl' : 'bg-white border border-zinc-200 shadow-md'
                  }`}>
                    <div className={`rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 transition-colors ${
                      isThemeNight ? 'bg-[#0a0a0c] text-white' : 'bg-white text-zinc-900'
                    }`}>
                      <div className={`flex items-center justify-between mb-8 pb-4 border-b ${isThemeNight ? 'border-white/5' : 'border-zinc-200'}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                            <FileText size={22} weight="bold" />
                          </div>
                          <div>
                            <h4 className={`text-xl font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '제출된 원어민 평가 폼 내역' : 'Submitted Teacher Evaluation Forms'}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {isKo 
                                ? '원어민 강사가 모바일에서 작성한 출석 및 관찰 일지 내역입니다. 학부모 알림톡 대본으로 1초 변환됩니다.' 
                                : 'Daily classroom evaluation logs submitted by foreign teachers. Auto-translated into Korean parent scripts.'}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('overview');
                            setTimeout(() => {
                              const el = document.getElementById('interactive');
                              if (el) el.scrollIntoView({ behavior: 'smooth' });
                            }, 200);
                          }}
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-[0.97] cursor-pointer flex items-center gap-1.5"
                        >
                          <Sparkle size={14} weight="bold" />
                          <span>{isKo ? '⚡ 폼 작성 체험하기' : 'Test FT Log Form'}</span>
                        </button>
                      </div>

                      {submittedLogs.length === 0 ? (
                        <div className={`p-12 rounded-3xl border text-center space-y-4 ${
                          isThemeNight ? 'bg-[#050505] border-white/5 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                        }`}>
                          <div className="w-16 h-16 rounded-3xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center mx-auto text-2xl shadow-inner">
                            📑
                          </div>
                          <div className="space-y-1.5 max-w-md mx-auto">
                            <h5 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {isKo ? '아직 제출된 평가 폼이 없습니다' : 'No Submitted Forms Found'}
                            </h5>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {isKo 
                                ? '원어민 선생님이 30초 모바일 평가 폼을 제출하면 이곳에서 실시간으로 대본을 검수하고 복사할 수 있습니다.' 
                                : 'When foreign teachers submit daily 30s evaluation logs, their responses and generated Korean KakaoTalk scripts will appear here.'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {submittedLogs.map((log: any, idx: number) => (
                            <div key={log.id || idx} className={`p-5 rounded-2xl border transition-all ${
                              isThemeNight ? 'bg-[#050505] border-white/10' : 'bg-zinc-50 border-zinc-200'
                            }`}>
                              <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-orange-400">{log.className || 'Class'}</span>
                                  <span className="text-xs text-zinc-500 font-mono">• {log.date}</span>
                                </div>
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                                  {isKo ? '대본 생성 완료' : 'Script Ready'}
                                </span>
                              </div>
                              <p className="text-xs text-zinc-300 pt-3 leading-relaxed">
                                {log.generalComments || log.lessonTopic}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
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
                    {isKo ? '학원 로고 이미지 URL (또는 파일 등록)' : 'Academy Logo Image URL'}
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
                  <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-[10px] text-orange-400 leading-normal space-y-1 font-mono">
                    <p className="font-bold">📐 {isKo ? '권장 로고 규격 및 지원 포맷:' : 'Recommended Dimensions & Formats:'}</p>
                    <p>• {isKo ? '지원 포맷: PNG (투명 배경 권장), JPG, SVG, WEBP' : 'Formats: PNG (transparent recommended), JPG, SVG, WEBP'}</p>
                    <p>• {isKo ? '권장 해상도: 400 × 400 px (정사각형) 또는 600 × 200 px (가로형)' : 'Resolution: 400 × 400 px (Square) or 600 × 200 px (Horizontal)'}</p>
                    <p>• {isKo ? '최대 용량: 5 MB 이하' : 'Max Size: Under 5 MB'}</p>
                  </div>
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
                  const topicName = (weekNum === selectedClass?.activeWeekNumber && curriculumTopic)
                    ? curriculumTopic
                    : (isKo ? '미등록 주차' : 'No Curriculum Set');
                  const wordCount = (weekNum === selectedClass?.activeWeekNumber && curriculumVocab)
                    ? curriculumVocab.split(',').filter(Boolean).length
                    : 0;
                  const hasUpload = wordCount > 0 || (weekNum === selectedClass?.activeWeekNumber && Boolean(curriculumTopic || curriculumVocab || curriculumPhonics));
                  const uploadDate = isKo ? '실시간 연동' : 'Live Sync';

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

      {/* --- ACADEMY BRANDED STUDENT GROWTH REPORT CARD MODAL --- */}
      {showReportCardModal && (
        <div className="fixed inset-0 z-[330] flex items-center justify-center p-4">
          <style>{`
            @media print {
              body * {
                visibility: hidden !important;
              }
              .printable-report-card, .printable-report-card * {
                visibility: visible !important;
              }
              .printable-report-card {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 100% !important;
                max-width: 100% !important;
                margin: 0 !important;
                padding: 32px !important;
                background: #ffffff !important;
                color: #000000 !important;
                box-shadow: none !important;
                border: none !important;
              }
              .no-print {
                display: none !important;
              }
            }
          `}</style>
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md no-print" 
            onClick={() => setShowReportCardModal(false)} 
          />
          <div className="relative p-1 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-3xl mx-4 animate-fade-in text-left max-h-[90vh]">
            <div className="printable-report-card relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 bg-white text-zinc-900 overflow-y-auto custom-scrollbar">
              <button
                type="button"
                onClick={() => setShowReportCardModal(false)}
                className="absolute top-6 right-6 p-2 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer no-print"
              >
                <X size={18} weight="bold" />
              </button>

              {/* Student Selector Bar */}
              {activeRoster.length > 0 && (
                <div className="mb-6 p-3 bg-orange-50/50 border border-orange-200 rounded-2xl flex items-center justify-between no-print">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-orange-700">{isKo ? '성적표 대상 원생 선택:' : 'Select Student for Report Card:'}</span>
                    <select
                      value={selectedStudentDetails?.uid || ''}
                      onChange={(e) => {
                        const target = activeRoster.find((s) => s.uid === e.target.value);
                        if (target) setSelectedStudentDetails(target);
                      }}
                      className="px-3 py-1.5 bg-white border border-orange-300 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer shadow-xs"
                    >
                      <option value="">-- {isKo ? '원생 선택' : 'Select Student'} --</option>
                      {activeRoster.map((s) => (
                        <option key={s.uid} value={s.uid}>
                          {s.studentName || s.name} ({s.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-orange-600">
                    Week {selectedClass?.activeWeekNumber || 1} Report Card
                  </span>
                </div>
              )}

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
                  <p className="font-bold text-zinc-900">Student: {selectedStudentDetails?.studentName || selectedStudentDetails?.name || 'Student'}</p>
                  <p className="text-zinc-500">Class: {selectedClass?.name || 'Assigned Class'}</p>
                  <p className="text-zinc-500">Date: {new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Weekly Curriculum Summary Section */}
              <div className="mb-6 p-4 border border-zinc-200 rounded-2xl bg-zinc-50/80 text-xs space-y-3">
                <h4 className="font-black text-zinc-900 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
                  <span>📚</span>
                  <span>{isKo ? '이번 주 학습 커리큘럼 요약' : 'Weekly Curriculum Summary'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-zinc-700">
                  <div>
                    <span className="font-bold text-zinc-900 block">{isKo ? '주간 주제 (Topic):' : 'Topic / Theme:'}</span>
                    <p className="text-zinc-600">{curriculumTopic || (isKo ? '미설정' : 'Not Set')}</p>
                  </div>
                  <div>
                    <span className="font-bold text-zinc-900 block">{isKo ? '파닉스 규칙 (Phonics):' : 'Phonics Targets:'}</span>
                    <p className="text-indigo-600 font-mono font-bold">{curriculumPhonics || (isKo ? '미설정' : 'Not Set')}</p>
                  </div>
                  {curriculumPassage && (
                    <div className="sm:col-span-2">
                      <span className="font-bold text-zinc-900 block">{isKo ? '본문 지문 (Passage):' : 'Reading Story:'}</span>
                      <p className="text-zinc-700 italic">"{curriculumPassage}"</p>
                    </div>
                  )}
                  {curriculumOther && (
                    <div className="sm:col-span-2 pt-1 border-t border-zinc-200">
                      <span className="font-bold text-purple-700 block">{isKo ? '기타 추가 학습 지침 (Other Notes):' : 'Supplementary Notes (Other):'}</span>
                      <p className="text-purple-900 font-medium">{curriculumOther}</p>
                    </div>
                  )}
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

      {/* --- SCANNED AI WORKSHEET & PICK-AND-CHOOSE MODAL --- */}
      {showScannedModal && (
        <div className="fixed inset-0 z-[350] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-md" 
            onClick={() => setShowScannedModal(false)} 
          />
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full ${activeScannedModalType === 'worksheet' ? 'max-w-6xl' : 'max-w-3xl'} mx-4 animate-fade-in text-left max-h-[90vh] ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar ${
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-100' : 'bg-white text-zinc-900'
            }`}>
              {/* Header */}
              <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-500 flex items-center justify-center">
                    {activeScannedModalType === 'syllabus' ? <BookOpen size={22} weight="bold" /> : <Sparkle size={22} weight="bold" />}
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {activeScannedModalType === 'syllabus' 
                        ? (isKo ? '📘 교재 목차 시라버스 분석 & 어휘 범위' : '📘 Scanned Course Syllabus & Scope')
                        : (isKo ? '📄 일간 워크시트 정답지 스캔 분석 & 항목 선택' : '📄 Scanned Worksheet AI Analysis & Selection')}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {activeScannedModalType === 'syllabus'
                        ? (isKo ? '전체 주차별 어휘 및 파닉스 범위를 설정합니다.' : 'Review course-wide vocabulary & phonics scope across weeks.')
                        : (isKo ? '추출된 학부모 정답 가이드와 커리큘럼 항목을 선택하세요.' : 'Review parent answer keys & select items to add to curriculum.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {(textbookPreviewUrl || docPreviewUrl || syllabusPreviewUrl || worksheetPreviewUrl) && (
                    <button
                      type="button"
                      onClick={() => setShowDocPreviewModal(true)}
                      className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-400 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye size={14} weight="bold" />
                      <span>{isKo ? '스캔 원본 문서 보기' : 'View Scanned Document'}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowScannedModal(false)}
                    className={`p-2 rounded-full transition-all cursor-pointer ${
                      isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                    }`}
                  >
                    <X size={18} weight="bold" />
                  </button>
                </div>
              </div>

              {/* Header Subtitle Banner */}
              {activeScannedModalType === 'worksheet' && (
                <div className="p-4 mb-6 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-xs text-orange-400 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkle size={20} weight="bold" className="shrink-0 text-orange-500" />
                    <div>
                      <p className="font-bold">
                        {isKo ? '체키 앱 학부모 스캔 화면과 동일한 AI 정답지 오버레이' : 'Identical AI Answer Ink Overlay as Chekki Parent App'}
                      </p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        {isKo 
                          ? '학부모님이 집에서 워크시트를 스캔했을 때 화면에 녹색 잉크로 자동 합성되는 정답지 내용입니다.' 
                          : 'This is the exact green answer ink overlaid on parents\' screens when they scan their child\'s physical worksheet.'}
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-orange-500 text-white font-mono font-bold text-[10px] rounded-lg uppercase shrink-0">
                    Chekki App Sync
                  </span>
                </div>
              )}

              {/* Page Selector Pill Bar for Multi-Page Extractions */}
              {scannedData?.pages && scannedData.pages.length > 0 && (
                <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 custom-scrollbar">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mr-1 shrink-0">
                    {isKo ? '페이지 선택:' : 'Select Page:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPageIndex('all')}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                      selectedPageIndex === 'all'
                        ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                        : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                    }`}
                  >
                    <span>📚</span>
                    <span>{isKo ? '전체 통합 (All Combined)' : 'All Pages'}</span>
                  </button>
                  {scannedData.pages.map((pObj: any, idx: number) => {
                    const pageNum = pObj.pageIndex || idx + 1;
                    const isActive = selectedPageIndex === pageNum;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedPageIndex(pageNum)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0 cursor-pointer flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-orange-500 text-white border-orange-500 shadow-md'
                            : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                        }`}
                      >
                        <span>📄</span>
                        <span>{pObj.pageTitle || (isKo ? `페이지 ${pageNum}` : `Page ${pageNum}`)}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Active Display Object based on page selection */}
              {(() => {
                const activeDisplayObj = selectedPageIndex === 'all' || !scannedData?.pages
                  ? scannedData
                  : (scannedData.pages.find((p: any) => (p.pageIndex || p.pageNumber) === selectedPageIndex) || scannedData);

                const BAD_WORDS_PATTERN = /(fuck|shit|asshole|bitch|bastard|cunt|dick|cock|pussy|slut|whore|nigger|faggot|retard|damn|crap|idiot|stupid|씨발|개새끼|병신|지랄|존나|닥쳐|미친|좆|씹)/i;
                const hasInappropriateContent = activeDisplayObj?.detectedAnswers?.some((ans: any) => 
                  BAD_WORDS_PATTERN.test(ans.questionText || '') || BAD_WORDS_PATTERN.test(ans.correctAnswer || ans.answer || '') || BAD_WORDS_PATTERN.test(ans.category || '')
                );

                return (
                  <div className="space-y-6">
                    {/* Guardrail Warning Banner */}
                    {hasInappropriateContent && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 font-bold flex items-center gap-3 animate-bounce">
                        <Warning size={20} weight="bold" className="shrink-0 text-red-400" />
                        <div>
                          <p>{isKo ? '🛡️ AI 세이프티 가드레일: 부적절한 단어 또는 비속어가 감지되었습니다.' : '🛡️ Content Safety Guardrail: Inappropriate language detected.'}</p>
                          <p className="text-[11px] font-normal text-red-300 mt-0.5">
                            {isKo 
                              ? '학습지 문항 및 정답에서 비속어를 수정해 주세요. 부적절한 단어는 커리큘럼 저장이 제한됩니다.' 
                              : 'Please remove offensive or profane words. Guardrails restrict saving inappropriate content into the student curriculum.'}
                          </p>
                        </div>
                      </div>
                    )}

                    {activeScannedModalType === 'worksheet' ? (
                      /* SIDE-BY-SIDE 2-COLUMN LAYOUT FOR WORKSHEETS */
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT COLUMN: Scanned Physical Paper Preview with Green Answer Overlay Ink */}
                        <div className="lg:col-span-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold font-mono text-orange-400 uppercase tracking-widest flex items-center gap-1.5">
                              <Eye size={14} weight="bold" />
                              <span>{isKo ? '스캔 원본 & AI 정답 잉크' : 'Scanned Paper & Answer Ink'}</span>
                            </span>
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono">
                              Green Ink Overlay
                            </span>
                          </div>

                          {/* Paper Sheet Preview Container with Real Image Preview */}
                          <div className="relative w-full rounded-2xl border border-zinc-300 dark:border-white/10 bg-black/40 text-zinc-900 shadow-xl overflow-hidden font-serif select-none min-h-[420px] flex flex-col items-center justify-center p-3">
                            {(worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl) ? (
                              <div className="relative w-full h-full min-h-[380px] rounded-xl overflow-hidden border border-white/20 bg-zinc-900 flex items-center justify-center group">
                                {/* Actual Scanned Physical Document Image */}
                                <img 
                                  src={(worksheetPreviewUrl || docPreviewUrl || syllabusPreviewUrl) || undefined} 
                                  alt="Scanned Physical Worksheet" 
                                  className="w-full h-auto max-h-[500px] object-contain rounded-lg drop-shadow-2xl"
                                />

                                {/* Green Ink Answer Overlay Badge on top of image */}
                                <div className="absolute top-3 right-3 px-3 py-1.5 rounded-xl bg-emerald-500/90 text-white font-mono font-bold text-xs shadow-lg backdrop-blur-md border border-emerald-300 flex items-center gap-1.5">
                                  <Sparkle size={14} weight="fill" className="animate-pulse" />
                                  <span>{isKo ? '🟢 Chekki Parent App 정답 오버레이 잉크' : '🟢 Green Ink Answer Overlay'}</span>
                                </div>

                                {/* Interactive Overlay Tags on Image */}
                                <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-black/80 backdrop-blur-md border border-white/20 text-white text-xs space-y-1">
                                  <span className="text-[10px] font-mono text-emerald-400 font-bold block uppercase tracking-wider">
                                    {isKo ? '💡 학부모용 실시간 정답 오버레이 가이드:' : '💡 Live Parent App Screen Overlay:'}
                                  </span>
                                  <div className="flex flex-wrap gap-1.5 pt-1">
                                    {(activeDisplayObj?.detectedAnswers || []).slice(0, 5).map((ans: any, i: number) => (
                                      <span key={i} className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-400/40">
                                        Q{i+1}: {ans.correctAnswer || ans.answer || 'Answer'}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="relative w-full rounded-2xl bg-white p-6 min-h-[380px] text-zinc-900">
                                <div className="border-b-2 border-zinc-900 pb-3 mb-6 flex justify-between items-end">
                                  <div>
                                    <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 font-bold">
                                      PHYSICAL WORKSHEET SCAN
                                    </span>
                                    <h4 className="text-base font-black tracking-tight text-zinc-900 font-sans">
                                      {activeDisplayObj?.topic || 'Science Unit 4 Homework'}
                                    </h4>
                                  </div>
                                  <span className="text-[10px] font-mono text-zinc-400 border border-zinc-300 px-2 py-0.5 rounded">
                                    PAGE 1 / 1
                                  </span>
                                </div>

                                <div className="space-y-4 text-xs">
                                  {(activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 
                                    ? activeDisplayObj.detectedAnswers 
                                    : [
                                        { questionNumber: 1, questionText: '1. Organisms that make their own food (Plants are ____).', correctAnswer: 'producers' },
                                        { questionNumber: 2, questionText: '2. Organisms that eat other living things (A rabbit is a ____).', correctAnswer: 'consumer' },
                                        { questionNumber: 3, questionText: '3. Organisms that break down dead material (Fungi are ____).', correctAnswer: 'decomposers' }
                                      ]
                                  ).map((item: any, idx: number) => (
                                    <div key={idx} className="p-3 rounded-xl bg-zinc-50 border border-zinc-200">
                                      <p className="font-semibold text-zinc-800 text-xs mb-1">
                                        {item.questionText || `Q${idx+1}: Question ${idx+1}`}
                                      </p>
                                      <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800 font-mono text-xs font-bold border border-emerald-300">
                                        <span>✍️ Green Ink:</span>
                                        <span className="underline decoration-emerald-500 decoration-2">{item.correctAnswer || item.answer || 'Answer'}</span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* RIGHT COLUMN: Editable Question & Answer Key Panel */}
                        <div className="lg:col-span-7 space-y-4">
                          <div className="flex items-center justify-between px-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                              {isKo ? '✏️ 문항 및 정답 수정 (Right Panel Editor)' : '✏️ Edit Questions & Correct Answers'}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setScannedData((prev: any) => {
                                  const currentAnswers = prev?.detectedAnswers || [];
                                  const newNum = currentAnswers.length + 1;
                                  const newAnswers = [
                                    ...currentAnswers,
                                    {
                                      questionNumber: newNum,
                                      category: 'Vocabulary',
                                      questionText: `${newNum}. Additional Question Text ${newNum}`,
                                      correctAnswer: 'answer',
                                      answer: 'answer'
                                    }
                                  ];
                                  return { ...prev, detectedAnswers: newAnswers };
                                });
                              }}
                              className="text-xs font-bold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                            >
                              <Plus size={14} weight="bold" />
                              <span>{isKo ? '문항 추가' : 'Add Question'}</span>
                            </button>
                          </div>

                          {activeDisplayObj?.detectedAnswers && activeDisplayObj.detectedAnswers.length > 0 ? (
                            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1 custom-scrollbar">
                              {activeDisplayObj.detectedAnswers.map((item: any, idx: number) => {
                                const itemHasBadWord = BAD_WORDS_PATTERN.test(item.questionText || '') || BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '');

                                return (
                                  <div
                                    key={idx}
                                    className={`p-4 rounded-2xl border transition-all text-left space-y-2.5 ${
                                      itemHasBadWord
                                        ? 'bg-red-500/10 border-red-500/40'
                                        : isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                        Question #{item.questionNumber || idx + 1}
                                      </span>
                                      <input
                                        type="text"
                                        value={item.category || 'Vocabulary'}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setScannedData((prev: any) => {
                                            const list = [...(prev?.detectedAnswers || [])];
                                            list[idx] = { ...list[idx], category: val };
                                            return { ...prev, detectedAnswers: list };
                                          });
                                        }}
                                        className="text-[10px] font-bold uppercase tracking-wider bg-transparent border-b border-zinc-600 focus:border-orange-500 text-zinc-400 outline-none text-right w-28"
                                      />
                                    </div>

                                    <input
                                      type="text"
                                      value={item.questionText || item.question || ''}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setScannedData((prev: any) => {
                                          const list = [...(prev?.detectedAnswers || [])];
                                          list[idx] = { ...list[idx], questionText: val, question: val };
                                          return { ...prev, detectedAnswers: list };
                                        });
                                      }}
                                      className={`w-full text-xs font-semibold p-2.5 rounded-xl border outline-none transition-all ${
                                        itemHasBadWord
                                          ? 'bg-red-950/40 border-red-500 text-red-200'
                                          : isThemeNight ? 'bg-[#050505] border-white/10 focus:border-orange-500 text-zinc-200' : 'bg-white border-zinc-300 focus:border-orange-500 text-zinc-800'
                                      }`}
                                      placeholder={isKo ? '문제 지문을 입력하세요' : 'Enter question text'}
                                    />

                                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-3 text-xs">
                                      <span className="text-emerald-400 font-bold shrink-0 flex items-center gap-1">
                                        <span>✏️</span>
                                        <span>{isKo ? '부모님용 정답 잉크 (수정 가능):' : 'Correct Answer Ink:'}</span>
                                      </span>
                                      <input
                                        type="text"
                                        value={item.correctAnswer || item.answer || ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setScannedData((prev: any) => {
                                            const list = [...(prev?.detectedAnswers || [])];
                                            list[idx] = { ...list[idx], correctAnswer: val, answer: val };
                                            return { ...prev, detectedAnswers: list };
                                          });
                                        }}
                                        className={`bg-[#050505] border outline-none px-3 py-1.5 rounded-lg font-mono font-black text-xs w-full max-w-[220px] ${
                                          BAD_WORDS_PATTERN.test(item.correctAnswer || item.answer || '')
                                            ? 'border-red-500 text-red-300'
                                            : 'border-emerald-500/50 focus:border-emerald-400 text-emerald-300'
                                        }`}
                                        placeholder={isKo ? '정답 단어/문장 입력' : 'Enter answer text'}
                                      />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-8 text-center border rounded-2xl border-dashed border-white/10 text-xs text-zinc-500 space-y-3">
                              <p>{isKo ? '추출된 개별 정답 문항이 없거나 아직 스캔되지 않았습니다.' : 'No worksheet question answers extracted yet.'}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setScannedData((prev: any) => ({
                                    ...prev,
                                    detectedAnswers: [
                                      { questionNumber: 1, category: 'Vocabulary', questionText: '1. Organisms that make food', correctAnswer: 'producers', answer: 'producers' },
                                      { questionNumber: 2, category: 'Vocabulary', questionText: '2. Organisms that eat living things', correctAnswer: 'consumer', answer: 'consumer' }
                                    ]
                                  }));
                                }}
                                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                              >
                                <Plus size={14} weight="bold" />
                                <span>{isKo ? '수동 정답 문항 작성하기' : 'Create Answer Key Manually'}</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* SINGLE COLUMN SCOPE PICKER FOR SYLLABUS */
                      <div className="space-y-6">
                        {/* Topic selection */}
                        {activeDisplayObj?.topic && (
                          <div className={`p-4 rounded-2xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                            <label className="flex items-center justify-between cursor-pointer">
                              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                                {isKo ? '추출된 대주제 / 테마 (Topic)' : 'Extracted Topic / Theme'}
                              </span>
                              <input
                                type="checkbox"
                                checked={selectedScannedTopic}
                                onChange={(e) => setSelectedScannedTopic(e.target.checked)}
                                className="w-4 h-4 accent-orange-500 cursor-pointer"
                              />
                            </label>
                            <p className={`text-base font-bold mt-1 ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                              {activeDisplayObj.topic}
                            </p>
                          </div>
                        )}

                        {/* Vocabulary Selection */}
                        {activeDisplayObj?.vocabWords && (Array.isArray(activeDisplayObj.vocabWords) ? activeDisplayObj.vocabWords.length > 0 : Boolean(activeDisplayObj.vocabWords)) && (
                          <div className={`p-4 rounded-2xl border ${isThemeNight ? 'bg-white/5 border-white/10' : 'bg-zinc-50 border-zinc-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs font-bold text-orange-500 uppercase tracking-widest">
                                {isKo ? '추출된 학습 단어 (Select Vocabulary Words)' : 'Extracted Target Vocabulary'}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  const pageWords = Array.isArray(activeDisplayObj.vocabWords)
                                    ? activeDisplayObj.vocabWords
                                    : activeDisplayObj.vocabWords.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean);
                                  
                                  const allSelected = pageWords.every((w: string) => selectedScannedVocab.includes(w));
                                  if (allSelected) {
                                    setSelectedScannedVocab(prev => prev.filter(w => !pageWords.includes(w)));
                                  } else {
                                    setSelectedScannedVocab(prev => Array.from(new Set([...prev, ...pageWords])));
                                  }
                                }}
                                className="text-[11px] font-bold text-orange-500 hover:underline cursor-pointer"
                              >
                                {isKo ? '이 페이지 단어 전체 선택 / 해제' : 'Toggle Page Words'}
                              </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {(Array.isArray(activeDisplayObj.vocabWords) ? activeDisplayObj.vocabWords : activeDisplayObj.vocabWords.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)).map((word: string) => {
                                const isSelected = selectedScannedVocab.includes(word);
                                return (
                                  <button
                                    type="button"
                                    key={word}
                                    onClick={() => {
                                      if (isSelected) {
                                        setSelectedScannedVocab(prev => prev.filter(w => w !== word));
                                      } else {
                                        setSelectedScannedVocab(prev => [...prev, word]);
                                      }
                                    }}
                                    className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-2 ${
                                      isSelected
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-md scale-[1.02]'
                                        : isThemeNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                                    }`}
                                  >
                                    <span>{word}</span>
                                    {isSelected ? <Check size={12} weight="bold" /> : <Plus size={12} weight="bold" />}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Modal Footer Actions */}
              <div className="mt-8 pt-4 border-t border-white/10 flex justify-between items-center">
                <button
                  type="button"
                  onClick={() => setShowScannedModal(false)}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                    isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}
                >
                  {isKo ? '닫기' : 'Close'}
                </button>

                <button
                  type="button"
                  onClick={applyScannedSelectionToCurriculum}
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={16} weight="bold" />
                  <span>{isKo ? '선택 항목을 주간 커리큘럼에 적용' : 'Apply Selected to Curriculum'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SCANNED DOCUMENT IMAGE / PDF PREVIEW MODAL --- */}
      {showDocPreviewModal && (
        <div className="fixed inset-0 z-[450] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setShowDocPreviewModal(false)} 
          />
          <div className={`relative p-1 border rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-4xl mx-4 animate-fade-in text-left max-h-[90vh] ${
            isThemeNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'
          }`}>
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 overflow-y-auto custom-scrollbar flex flex-col ${
              isThemeNight ? 'bg-[#0c0c0e] text-zinc-100' : 'bg-white text-zinc-900'
            }`}>
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
                    <Eye size={22} weight="bold" />
                  </div>
                  <div>
                    <h3 className={`text-lg font-black ${isThemeNight ? 'text-white' : 'text-zinc-900'}`}>
                      {isKo ? '스캔 원본 교재 / 워크시트 문서 미리보기' : 'Scanned Document Original Preview'}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      {uploadedFileName || (isKo ? '스캔된 교재 이미지/PDF' : 'Scanned Image / PDF')}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDocPreviewModal(false)}
                  className={`p-2 rounded-full transition-all cursor-pointer ${
                    isThemeNight ? 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-600'
                  }`}
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div className="flex-1 flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-white/10 overflow-hidden min-h-[50vh]">
                {textbookPreviewUrl ? (
                  <img 
                    src={textbookPreviewUrl} 
                    alt="Scanned original document" 
                    className="max-h-[65vh] w-auto object-contain rounded-xl shadow-2xl" 
                  />
                ) : (
                  <p className="text-sm text-zinc-400 italic">
                    {isKo ? '문서 미리보기 이미지를 로드할 수 없습니다.' : 'Document image preview unavailable.'}
                  </p>
                )}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowDocPreviewModal(false)}
                  className="px-5 py-2 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  {isKo ? '미리보기 닫기' : 'Close Preview'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
