import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dbInstance } from '../../services/database';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';
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
  Notebook
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
}

export default function TeacherPage({ isNight = true }: Props) {
  const { user, firebaseUser, signIn, logout, isAuthenticated } = useAuth();
  const { language } = useLanguage();
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  // Student roster & analytics state
  const [studentsData, setStudentsData] = useState<any[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any | null>(null);

  // Teacher onboarding
  const [showTeacherOnboarding, setShowTeacherOnboarding] = useState(false);
  const [teacherObStep, setTeacherObStep] = useState(0);

  const isKo = language === 'ko';

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
      titleEn: 'Create Your First Class',
      titleKo: '첫 번째 학급을 만드세요',
      descEn: 'Set up a class for each group you teach. Give it a name and level — you can create as many as you need.',
      descKo: '가르치는 반마다 학급을 만들어 보세요. 이름과 레벨을 설정하면 준비 완료!',
    },
    {
      img: '/assets/teacher_ob_seed_curriculum.png',
      titleEn: 'Seed Your Weekly Curriculum',
      titleKo: '주간 커리큘럼을 등록하세요',
      descEn: "Add this week's vocabulary words, phonics targets, and reading passages. Chekki grades homework against your exact curriculum.",
      descKo: '이번 주 단어, 파닉스, 읽기 지문을 등록하세요. Chekki가 교재에 맞춰 자동 채점합니다.',
    },
    {
      img: '/assets/teacher_ob_share_code.png',
      titleEn: 'Share Your Class Code',
      titleKo: '학급 코드를 학부모님께 공유하세요',
      descEn: 'Each class gets a unique 6-letter code. Parents enter it in their Chekki app to link their child automatically.',
      descKo: '각 반에는 고유 6자리 코드가 생성됩니다. 학부모님이 앱에 입력하면 즉시 연동됩니다.',
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
      await signIn(email, password);
    } catch (err: any) {
      setAuthError(err.message || 'Login failed. Please check your credentials.');
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
    try {
      const classRef = doc(dbInstance, 'classes', selectedClass.id);
      await updateDoc(classRef, { activeWeekNumber: newWeek });
      const updated = { ...selectedClass, activeWeekNumber: newWeek };
      setSelectedClass(updated);
      setClasses(prev => prev.map(c => c.id === updated.id ? updated : c));
    } catch (err) {
      console.error('Failed to update active week:', err);
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
    try {
      const currDocId = `${selectedClass.id}_week_${selectedClass.activeWeekNumber || 1}`;
      const docRef = doc(dbInstance, 'curriculums', currDocId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
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
    } catch (err) {
      console.error('Failed to load curriculum:', err);
    } finally {
      setIsLoadingCurriculum(false);
    }
  };

  const handleSaveCurriculum = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    setIsSavingCurriculum(true);
    try {
      const currDocId = `${selectedClass.id}_week_${selectedClass.activeWeekNumber || 1}`;
      const docRef = doc(dbInstance, 'curriculums', currDocId);
      
      const vocabList = curriculumVocab.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
      const phonicsList = curriculumPhonics.split(/[,\n]/).map(s => s.trim()).filter(Boolean);

      const payload = {
        classId: selectedClass.id,
        weekNumber: selectedClass.activeWeekNumber || 1,
        topic: curriculumTopic.trim(),
        vocabWords: vocabList,
        phonicsRules: phonicsList,
        passage: curriculumPassage.trim(),
        updatedAt: new Date().toISOString()
      };

      await setDoc(docRef, payload, { merge: true });
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
      const q = query(
        collection(dbInstance, 'users'),
        where('classId', '==', selectedClass.id)
      );
      const snap = await getDocs(q);
      const students: any[] = [];
      
      for (const userDoc of snap.docs) {
        const student = { uid: userDoc.id, ...userDoc.data() };
        
        try {
          const mistakesQ = query(
            collection(dbInstance, 'mistakes'),
            where('userUid', '==', student.uid)
          );
          const mistakesSnap = await getDocs(mistakesQ);
          const mistakes: any[] = [];
          mistakesSnap.forEach(mDoc => mistakes.push({ id: mDoc.id, ...mDoc.data() }));
          (student as any).mistakes = mistakes;
        } catch (mErr) {
          (student as any).mistakes = [];
        }

        students.push(student);
      }

      setStudentsData(students);
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

  // --- RENDER LOGIN VIEW ---
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

            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {isKo ? '교사 포털 로그인' : 'Teacher Portal Login'}
            </h2>
            <p className="text-zinc-400 text-xs mb-8 text-center leading-relaxed max-w-xs">
              {isKo 
                ? '학습지 관리 및 분석을 위해 교사 계정으로 로그인해 주세요.'
                : 'Log in with your teacher credentials to manage curricula and rosters.'}
            </p>

            <form onSubmit={handleSignIn} className="w-full space-y-4">
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
                    <span>{isKo ? '로그인' : 'Log In'}</span>
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
      <aside className="w-full md:w-72 bg-[#08080a] border-b md:border-b-0 md:border-r border-white/5 flex flex-col shrink-0">
        
        {/* Sidebar Header / Brand */}
        <div className="p-6 border-b border-white/5 flex items-center gap-3.5">
          <div className="w-11 h-11 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 shadow-lg shadow-orange-500/5">
            <ChalkboardTeacher size={22} weight="bold" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-black text-white leading-tight truncate">
              {user.schoolName || 'B2B Academy'}
            </h1>
            <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
              <Sparkle size={10} weight="bold" />
              <span>Teacher Portal</span>
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 flex-1 space-y-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group ${
              activeTab === 'overview'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${activeTab === 'overview' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                <ChartBar size={18} weight="bold" />
              </div>
              <span>{isKo ? '반 통계 및 대시보드' : 'Class Dashboard'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'overview' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>
          
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group ${
              activeTab === 'curriculum'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${activeTab === 'curriculum' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                <BookOpen size={18} weight="bold" />
              </div>
              <span>{isKo ? '주간 학습 커리큘럼' : 'Manage Curriculum'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'curriculum' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`w-full px-4 py-3.5 rounded-2xl text-left text-xs font-bold transition-all duration-200 active:scale-[0.98] flex items-center justify-between group ${
              activeTab === 'students'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-xl shadow-orange-500/5'
                : 'text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl transition-colors ${activeTab === 'students' ? 'bg-orange-500/20 text-orange-400' : 'bg-white/5 text-zinc-400 group-hover:text-white'}`}>
                <Users size={18} weight="bold" />
              </div>
              <span>{isKo ? '학생 출석 및 활동 정보' : 'Student Activity'}</span>
            </div>
            <CaretRight size={14} weight="bold" className={`transition-transform duration-200 ${activeTab === 'students' ? 'translate-x-0 opacity-100' : '-translate-x-1 opacity-0 group-hover:opacity-50'}`} />
          </button>
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-white/5 bg-[#050505]/60 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-xs shrink-0">
              {user.name ? user.name.slice(0, 2).toUpperCase() : 'TC'}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2.5 text-zinc-500 hover:text-white rounded-xl hover:bg-white/10 transition-all active:scale-[0.95] shrink-0"
            title="Log Out"
          >
            <SignOut size={18} weight="bold" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Control Bar */}
        <header className="p-6 border-b border-white/5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 shrink-0 bg-[#08080a]/80 backdrop-blur-2xl">
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-orange-400">
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
                  className="bg-[#050505] border border-white/10 hover:border-white/20 text-white font-bold text-sm px-4 py-2.5 rounded-2xl focus:border-orange-500 outline-none cursor-pointer pr-10 appearance-none transition-colors"
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
              onClick={() => setShowCreateClassModal(true)}
              className="group p-2.5 border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-2xl transition-all font-bold text-xs shrink-0 active:scale-[0.97] flex items-center gap-1.5"
              title="Add New Class"
            >
              <Plus size={16} weight="bold" className="group-hover:rotate-90 transition-transform" />
              <span className="hidden sm:inline">{isKo ? '새 학급' : 'New Class'}</span>
            </button>

            {selectedClass && (
              <div className="text-xs font-bold text-orange-400 bg-orange-500/10 px-4 py-2 border border-orange-500/20 rounded-2xl flex items-center gap-2 shadow-lg shadow-orange-500/5 shrink-0">
                <Key size={14} weight="bold" />
                <span>{isKo ? '학급 코드' : 'Class Code'}:</span>
                <span className="font-mono select-all tracking-wider text-white text-xs font-black bg-black/40 px-2 py-0.5 rounded-md border border-white/10">
                  {selectedClass.joinCode || 'N/A'}
                </span>
              </div>
            )}
          </div>

          {/* Active Week Controls */}
          {selectedClass && (
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <Calendar size={14} weight="bold" />
                <span>{isKo ? '현재 학기 주차' : 'Active Week'}</span>
              </span>
              <div className="bg-[#050505] border border-white/10 rounded-2xl flex items-center overflow-hidden p-1 shadow-inner">
                <button
                  onClick={() => handleUpdateWeek(-1)}
                  disabled={selectedClass.activeWeekNumber <= 1}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white disabled:opacity-20 hover:bg-white/10 rounded-xl transition-all text-xs font-black active:scale-[0.95]"
                >
                  -
                </button>
                <span className="px-4 text-xs font-black text-white min-w-[3.5rem] text-center font-mono">
                  Week {selectedClass.activeWeekNumber}
                </span>
                <button
                  onClick={() => handleUpdateWeek(1)}
                  className="w-8 h-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition-all text-xs font-black active:scale-[0.95]"
                >
                  +
                </button>
              </div>
            </div>
          )}
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
                    <div className="p-1 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl">
                      <div className="bg-[#0a0a0c] rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <ChalkboardTeacher size={14} weight="bold" className="text-orange-400" />
                            <span>{isKo ? '대상 학급' : 'Active Class'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-orange-500/10 border border-orange-500/20 text-orange-400 font-mono">
                            Level: {selectedClass?.level}
                          </span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white tracking-tight">{selectedClass?.name}</h4>
                          <p className="text-xs text-zinc-500 mt-1">
                            {isKo ? '선택된 가입 코드:' : 'Active join code:'} <span className="font-mono text-zinc-300">{selectedClass?.joinCode}</span>
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Stat Card 2 */}
                    <div className="p-1 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl">
                      <div className="bg-[#0a0a0c] rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-orange-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <TrendUp size={14} weight="bold" />
                            <span>{isKo ? '숙제 완료율' : 'Completion Rate'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono">
                            {completionRate}%
                          </span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white tracking-tight">
                            {completedHomeworkCount} <span className="text-sm font-normal text-zinc-500">/ {activeStudentsCount} {isKo ? '명 완료' : 'Students'}</span>
                          </h4>
                          <div className="w-full bg-[#050505] h-2 rounded-full mt-4 overflow-hidden p-0.5 border border-white/5">
                            <div 
                              className="bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-400 h-full rounded-full transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]"
                              style={{ width: `${completionRate}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="p-1 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl">
                      <div className="bg-[#0a0a0c] rounded-[calc(2rem-0.25rem)] p-6 flex flex-col justify-between h-full">
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                            <Users size={14} weight="bold" className="text-purple-400" />
                            <span>{isKo ? '등록 원생 수' : 'Enrolled Students'}</span>
                          </span>
                          <span className="px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 border border-purple-500/20 text-purple-400 font-mono">
                            Active Roster
                          </span>
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-white tracking-tight">
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
                    <div className="lg:col-span-2 p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl">
                      <div className="bg-[#0a0a0c] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                                <Lightbulb size={20} weight="bold" />
                              </div>
                              <div>
                                <h4 className="text-lg font-black text-white">
                                  {isKo ? '이번 주 취약 단어 분석' : 'Weekly Vocabulary Struggle Counts'}
                                </h4>
                              </div>
                            </div>
                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 font-mono bg-white/5 px-3 py-1 rounded-full border border-white/5">
                              Analytics
                            </span>
                          </div>
                          <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
                            {isKo 
                              ? '아이들이 숙제 채점 시 틀렸거나 어려워한 단어들의 오답 횟수입니다.' 
                              : 'Tally of spelling and grading mistakes recorded across all student homework scans.'}
                          </p>
                        </div>

                        {activeVocabWords.length === 0 ? (
                          <div className="py-12 px-6 rounded-2xl bg-[#050505] border border-white/5 flex flex-col items-center justify-center text-center">
                            <div className="w-14 h-14 mb-4 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                              <Notebook size={28} weight="bold" />
                            </div>
                            <h5 className="text-sm font-bold text-white mb-1">
                              {isKo ? '등록된 이번 주 학습 단어가 없습니다.' : 'No vocabulary words configured for this week.'}
                            </h5>
                            <p className="text-xs text-zinc-500 max-w-xs mb-6">
                              {isKo ? '주간 학습 커리큘럼 탭에서 이번 주 단어를 등록해 주세요.' : 'Go to the Curriculum tab to add target vocabulary words.'}
                            </p>
                            <button
                              onClick={() => setActiveTab('curriculum')}
                              className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.97]"
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
                              <div key={word} className="flex items-center justify-between p-4 bg-[#050505] border border-white/5 rounded-2xl hover:border-white/10 transition-all">
                                <span className="text-sm font-bold text-white font-mono tracking-wide">{word}</span>
                                <div className="flex items-center gap-3">
                                  {count > 0 ? (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-1.5">
                                      <Warning size={14} weight="bold" />
                                      <span>{count} {isKo ? '명 틀림' : 'Mistakes'}</span>
                                    </span>
                                  ) : (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
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
                    <div className="p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl">
                      <div className="bg-[#0a0a0c] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 flex flex-col justify-between h-full text-left relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-amber-500/10 to-transparent blur-3xl pointer-events-none" />
                        <div>
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                              <BookOpen size={20} weight="bold" />
                            </div>
                            <h4 className="text-lg font-black text-white">
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
                                <p className="text-zinc-200 font-semibold">
                                  {isKo 
                                    ? `이번 주 가장 많이 틀린 단어는 "${sortedTroubleWords[0].word}" 입니다.` 
                                    : `Students struggled most with the word "${sortedTroubleWords[0].word}" this week.`}
                                </p>
                                <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-orange-300 leading-relaxed">
                                  💡 {isKo 
                                    ? '내일 수업 시작 시, 보드판에 해당 단어들의 파닉스 모음 결합을 소리내어 복습하는 파닉스 드릴 게임을 추천합니다.' 
                                    : 'Recommendation: Dedicate the first 5 minutes of class to spelling tracing and a vocal blend drill focusing on target phonics.'}
                                </div>
                              </>
                            ) : (
                              <div className="p-6 rounded-2xl bg-[#050505] border border-white/5 text-center text-xs text-emerald-400 flex flex-col items-center gap-2">
                                <Sparkle size={24} weight="bold" />
                                <span>{isKo ? '모든 아이들이 숙제를 완벽히 소화하고 있습니다!' : 'All children have mastered the weekly vocabulary!'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 mt-6">
                          <button
                            type="button"
                            onClick={() => {
                              if (activeVocabWords.length > 0) {
                                alert(isKo ? '오답 맞춤 복습 프린트 학습지 PDF가 다운로드 대기 중입니다.' : 'AI review worksheet PDF compile initiated.');
                              } else {
                                alert(isKo ? '이번 주 커리큘럼 단어를 먼저 등록해 주세요.' : 'Please add vocabulary words first.');
                              }
                            }}
                            className="group w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all duration-300 active:scale-[0.97] flex items-center justify-center gap-3"
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
                <div className="p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl animate-fade-in text-left">
                  <div className="bg-[#0a0a0c] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8">
                    <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                          <BookOpen size={22} weight="bold" />
                        </div>
                        <div>
                          <h4 className="text-xl font-black text-white">
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
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                            {isKo ? '대주제 / 주간 테마 (Topic)' : 'Weekly Topic / Theme'}
                          </label>
                          <input
                            type="text"
                            value={curriculumTopic}
                            onChange={(e) => setCurriculumTopic(e.target.value)}
                            placeholder={isKo ? '예: Weather & Nature (날씨와 자연)' : 'E.g. Weather & Nature'}
                            className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
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
                              className="w-full h-36 bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white resize-none font-mono placeholder:text-zinc-600"
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
                              className="w-full h-36 bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white resize-none font-mono placeholder:text-zinc-600"
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
                            className="w-full h-40 bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white resize-y placeholder:text-zinc-600"
                          />
                        </div>

                        <div className="flex gap-4 justify-end pt-4 border-t border-white/5">
                          <button
                            type="button"
                            onClick={loadCurriculum}
                            disabled={isSavingCurriculum}
                            className="px-6 py-3.5 rounded-2xl text-xs font-bold bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white border border-white/10 transition-all active:scale-[0.98]"
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
                    <div className="p-1 bg-orange-500/10 border border-orange-500/30 rounded-[2.5rem] shadow-2xl text-left">
                      <div className="bg-[#0a0a0c] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-2xl bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center">
                            <Warning size={22} weight="bold" />
                          </div>
                          <div>
                            <h4 className="text-lg font-black text-white">
                              {isKo ? '가입 승인 대기 목록' : 'Pending Classroom Approvals'}
                            </h4>
                            <p className="text-xs text-orange-400/90 leading-normal">
                              {isKo 
                                ? '이 학급반에 가입을 요청한 학부모 목록입니다. 승인 후 대시보드에 합산됩니다.' 
                                : 'Parents requesting to enroll their children. Approve to add them to class analytics.'}
                            </p>
                          </div>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-zinc-400 text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                                <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                                <th className="pb-4 text-right pr-2">{isKo ? '승인 여부' : 'Approval Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {pendingRoster.map((student) => (
                                <tr key={student.uid} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 pl-2 font-black text-white text-sm">
                                    {student.studentName || 'Unnamed'}
                                  </td>
                                  <td className="py-4">
                                    <p className="font-bold text-zinc-200">{student.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                                  </td>
                                  <td className="py-4 text-right pr-2 space-x-3">
                                    <button
                                      onClick={() => handleDeclineStudent(student.uid)}
                                      className="px-4 py-2 border border-white/10 hover:border-white/20 bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-zinc-200 font-bold rounded-xl transition-all text-xs active:scale-[0.97]"
                                    >
                                      {isKo ? '거절' : 'Decline'}
                                    </button>
                                    <button
                                      onClick={() => handleApproveStudent(student.uid)}
                                      className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all text-xs active:scale-[0.97]"
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
                  <div className="p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl text-left">
                    <div className="bg-[#0a0a0c] rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8">
                      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                            <UserCheck size={22} weight="bold" />
                          </div>
                          <div>
                            <h4 className="text-xl font-black text-white">
                              {isKo ? '소속 원생 명단' : 'Approved Student Roster'}
                            </h4>
                            <p className="text-xs text-zinc-400 mt-0.5">
                              {isKo 
                                ? '현재 승인 완료되어 활동 중인 학생 명단입니다.' 
                                : 'Active classroom student roster logs and transfer operations.'}
                            </p>
                          </div>
                        </div>
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
                          <table className="w-full text-xs text-zinc-400 text-left border-collapse">
                            <thead>
                              <tr className="border-b border-white/5 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                                <th className="pb-4 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                                <th className="pb-4">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                                <th className="pb-4">{isKo ? '숙제 상태' : 'Weekly Status'}</th>
                                <th className="pb-4">{isKo ? '마지막 스캔일' : 'Last Active'}</th>
                                <th className="pb-4 text-right pr-2">{isKo ? '원생 관리' : 'Actions'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                              {activeRoster.map((student) => (
                                <tr key={student.uid} className="hover:bg-white/[0.02] transition-colors">
                                  <td className="py-4 pl-2 font-black text-white text-sm">{student.studentName || 'Unnamed'}</td>
                                  <td className="py-4">
                                    <p className="font-bold text-zinc-200">{student.name}</p>
                                    <p className="text-[10px] text-zinc-500 font-mono">{student.email}</p>
                                  </td>
                                  <td className="py-4">
                                    {student.hasScannedThisWeek ? (
                                      <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5 w-fit">
                                        <CheckCircle size={14} weight="bold" />
                                        <span>{isKo ? '스캔 완료' : 'Scanned'}</span>
                                      </span>
                                    ) : (
                                      <span className="px-3 py-1.5 rounded-full text-[10px] font-bold bg-zinc-900 border border-white/5 text-zinc-500 flex items-center gap-1.5 w-fit">
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
                                      className="bg-[#050505] border border-white/10 text-[10px] font-bold text-zinc-400 px-3 py-2 rounded-xl cursor-pointer outline-none focus:border-orange-500 appearance-none transition-colors"
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
                                      className="px-3.5 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all text-[10px] active:scale-[0.95]"
                                    >
                                      {isKo ? '삭제' : 'Remove'}
                                    </button>
                                    <button
                                      onClick={() => setSelectedStudentDetails(student)}
                                      className="px-4 py-2 border border-white/10 bg-[#050505] hover:bg-white/5 text-orange-400 hover:text-orange-300 font-bold rounded-xl transition-all text-[10px] active:scale-[0.95] flex items-center gap-1.5"
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
            className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setSelectedStudentDetails(null)} 
          />
          <div className="relative w-full max-w-lg h-full bg-[#0c0c0e] border-l border-white/10 p-6 sm:p-8 flex flex-col shadow-2xl animate-slide-in text-left">
            
            {/* Drawer Header */}
            <div className="pb-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <span>👦 {selectedStudentDetails.studentName || 'Unnamed'}</span>
                  <span className="text-xs font-normal text-zinc-400">{isKo ? '원생 오답 기록' : "'s Error Logs"}</span>
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  {selectedStudentDetails.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="p-2.5 text-zinc-400 hover:text-white rounded-full hover:bg-white/10 transition-all text-sm font-bold active:scale-[0.95]"
              >
                <X size={18} weight="bold" />
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
              <div>
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4 block">
                  {isKo ? '이번 주 오답 목록' : "This week's mistakes"}
                </span>

                {selectedStudentDetails.weeklyMistakes.length === 0 ? (
                  <div className="py-16 text-center text-emerald-400 text-xs flex flex-col items-center gap-2">
                    <Sparkle size={24} weight="bold" />
                    <span>{isKo ? '오답 기록이 없습니다. 완벽해요!' : 'No spelling or vocabulary errors recorded this week.'}</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudentDetails.weeklyMistakes.map((m: any, idx: number) => (
                      <div key={m.uniqueId || idx} className="p-5 bg-[#050505] border border-white/10 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2.5 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold rounded-lg text-[9px] uppercase tracking-wider font-mono">
                            {m.type || 'Phonics'}
                          </span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {m.dateAdded ? m.dateAdded.split('T')[0] : ''}
                          </span>
                        </div>

                        <div className="space-y-3 text-xs">
                          <div>
                            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                              Question / Word
                            </span>
                            <p className="font-bold text-white font-mono">{m.question_text}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                Target Answer
                              </span>
                              <p className="font-bold text-emerald-400 font-mono">{m.correct_answer}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest block mb-1">
                                Student Answer
                              </span>
                              <p className="font-bold text-red-400 font-mono">{m.student_response || '(Blank)'}</p>
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
            <div className="pt-6 border-t border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStudentDetails(null)}
                className="w-full py-4 bg-[#050505] hover:bg-white/5 text-zinc-300 font-bold text-xs rounded-2xl transition-all border border-white/10 active:scale-[0.98]"
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
            className="absolute inset-0 bg-black/85 backdrop-blur-md" 
            onClick={() => setShowCreateClassModal(false)} 
          />
          <div className="relative p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in">
            <div className="relative w-full h-full rounded-[calc(2.5rem-0.25rem)] bg-[#0c0c0e] text-zinc-200 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] p-8 overflow-hidden">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-500/10 border border-orange-500/20 text-orange-400 flex items-center justify-center">
                  <Plus size={22} weight="bold" />
                </div>
                <h3 className="text-xl font-black text-white">
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
                    className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white placeholder:text-zinc-600"
                  />
                </div>

                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest pl-1">
                    {isKo ? '대상 학년' : 'Class Level'}
                  </label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 focus:border-orange-500 outline-none text-sm p-4 rounded-2xl transition-all text-white cursor-pointer"
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
                    className="flex-1 py-4 bg-[#050505] hover:bg-white/5 text-zinc-400 hover:text-white font-bold text-xs rounded-2xl border border-white/10 transition-all active:scale-[0.98]"
                  >
                    {isKo ? '취소' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClass}
                    className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
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
    </div>
  );
}
