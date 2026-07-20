import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { dbInstance } from '../../services/database';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ChekkiMascot } from '../../components/Icons';

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

  const fetchClasses = async () => {
    if (!user?.uid) return;
    try {
      const q = query(
        collection(dbInstance, 'classes'),
        where('teacherUid', '==', user.uid)
      );
      const querySnapshot = await getDocs(q);
      const fetched: any[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() });
      });
      setClasses(fetched);
      if (fetched.length > 0 && !selectedClass) {
        setSelectedClass(fetched[0]);
      }
    } catch (err) {
      console.error('Error fetching classes:', err);
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
      
      // Force page reload to sync context profile
      window.location.reload();
    } catch (err: any) {
      setAuthError(err.message || 'Failed to activate code.');
    } finally {
      setIsActivating(false);
    }
  };

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.schoolId || !user?.uid) return;
    setIsCreatingClass(true);
    try {
      const sanitizedName = newClassName.trim().replace(/\s+/g, '-');
      const classId = `${user.schoolId}_${sanitizedName}_${Date.now()}`;
      
      // Generate a unique 6-character alphanumeric join code
      let joinCode = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      for (let i = 0; i < 6; i++) {
        joinCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      const newClass = {
        schoolId: user.schoolId,
        schoolName: user.schoolName || user.schoolId,
        name: newClassName,
        level: newClassLevel,
        teacherUid: user.uid,
        activeWeekNumber: 1,
        joinCode: joinCode,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(dbInstance, 'classes', classId), newClass);
      
      setNewClassName('');
      setShowCreateClassModal(false);
      await fetchClasses();
    } catch (err) {
      console.error('Failed to create class:', err);
      alert('Failed to create class. Please try again.');
    } finally {
      setIsCreatingClass(false);
    }
  };

  const handleUpdateWeek = async (increment: number) => {
    if (!selectedClass) return;
    const newWeek = Math.max(1, (selectedClass.activeWeekNumber || 1) + increment);
    try {
      await updateDoc(doc(dbInstance, 'classes', selectedClass.id), {
        activeWeekNumber: newWeek,
      });
      const updatedClass = { ...selectedClass, activeWeekNumber: newWeek };
      setSelectedClass(updatedClass);
      setClasses(classes.map(c => c.id === selectedClass.id ? updatedClass : c));
    } catch (err) {
      console.error('Failed to update week:', err);
    }
  };

  // Load weekly curriculum data
  useEffect(() => {
    if (selectedClass && activeTab === 'curriculum') {
      loadCurriculum();
    }
  }, [selectedClass?.id, selectedClass?.activeWeekNumber, activeTab]);

  const loadCurriculum = async () => {
    if (!selectedClass) return;
    setIsLoadingCurriculum(true);
    try {
      const curriculumId = `${selectedClass.schoolId}_${selectedClass.id}_W${selectedClass.activeWeekNumber}`;
      const docRef = doc(dbInstance, 'curriculums', curriculumId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCurriculumTopic(data.topic || '');
        setCurriculumVocab(Array.isArray(data.vocabList) ? data.vocabList.join(', ') : '');
        setCurriculumPhonics(Array.isArray(data.phonicsRules) ? data.phonicsRules.join(', ') : '');
        setCurriculumPassage(data.passage || '');
      } else {
        // Clear fields for a new weekly curriculum entry
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
    if (!selectedClass || !user?.uid) return;
    setIsSavingCurriculum(true);
    try {
      const curriculumId = `${selectedClass.schoolId}_${selectedClass.id}_W${selectedClass.activeWeekNumber}`;
      
      // Parse list strings into clean arrays
      const vocabList = curriculumVocab
        .split(/[,\n]/)
        .map((w) => w.trim().toLowerCase())
        .filter((w) => w.length > 0);
        
      const phonicsRules = curriculumPhonics
        .split(/[,\n]/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      const curriculumData = {
        schoolId: selectedClass.schoolId,
        classId: selectedClass.id,
        weekNumber: selectedClass.activeWeekNumber,
        topic: curriculumTopic.trim(),
        vocabList,
        phonicsRules,
        passage: curriculumPassage.trim(),
        lastUpdatedBy: user.uid,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(dbInstance, 'curriculums', curriculumId), curriculumData);
      alert(isKo ? '주간 학습 커리큘럼이 성공적으로 저장되었습니다!' : 'Weekly curriculum saved successfully!');
    } catch (err) {
      console.error('Failed to save curriculum:', err);
      alert(isKo ? '저장에 실패했습니다. 다시 시도해 주세요.' : 'Failed to save curriculum. Please try again.');
    } finally {
      setIsSavingCurriculum(false);
    }
  };

  // Load roster and mistakes when class or active week changes
  useEffect(() => {
    if (selectedClass) {
      fetchRosterAndMistakes();
    }
  }, [selectedClass?.id, selectedClass?.activeWeekNumber]);

  const fetchRosterAndMistakes = async () => {
    if (!selectedClass) return;
    setIsLoadingRoster(true);
    try {
      // 1. Fetch all parents/users who have signed up in this class
      const q = query(
        collection(dbInstance, 'users'),
        where('classId', '==', selectedClass.id)
      );
      const querySnapshot = await getDocs(q);
      const roster: any[] = [];
      querySnapshot.forEach((docSnap) => {
        roster.push({ uid: docSnap.id, ...docSnap.data() });
      });

      // 2. Fetch concurrent mistakes document for each student in the roster
      const studentMistakesPromises = roster.map(async (student) => {
        const docRef = doc(dbInstance, 'users', student.uid, 'data', 'mistakes');
        const docSnap = await getDoc(docRef);
        const items = docSnap.exists() ? docSnap.data().items || [] : [];
        return {
          ...student,
          mistakes: items
        };
      });

      const mergedData = await Promise.all(studentMistakesPromises);
      setStudentsData(mergedData);
    } catch (err) {
      console.error('Failed to fetch roster and mistakes:', err);
    } finally {
      setIsLoadingRoster(false);
    }
  };

  const handleApproveStudent = async (studentUid: string) => {
    try {
      await updateDoc(doc(dbInstance, 'users', studentUid), {
        classStatus: 'active',
      });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to approve student:', err);
      alert('Failed to approve student.');
    }
  };

  const handleDeclineStudent = async (studentUid: string) => {
    if (!confirm(isKo ? '이 학생의 가입 신청을 거절하시겠습니까?' : 'Are you sure you want to decline this request?')) return;
    try {
      await updateDoc(doc(dbInstance, 'users', studentUid), {
        classId: null,
        classStatus: null,
      });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to decline student:', err);
      alert('Failed to decline request.');
    }
  };

  const handleRemoveStudent = async (studentUid: string) => {
    if (!confirm(isKo ? '이 학생을 학급에서 삭제하시겠습니까?' : 'Are you sure you want to remove this student?')) return;
    try {
      await updateDoc(doc(dbInstance, 'users', studentUid), {
        classId: null,
        classStatus: null,
      });
      await fetchRosterAndMistakes();
    } catch (err) {
      console.error('Failed to remove student:', err);
      alert('Failed to remove student.');
    }
  };

  const handleMoveStudent = async (studentUid: string, newClassId: string) => {
    if (!newClassId) return;
    try {
      await updateDoc(doc(dbInstance, 'users', studentUid), {
        classId: newClassId,
        classStatus: 'active', // promote to active in new class
      });
      await fetchRosterAndMistakes();
      alert(isKo ? '학급 이동이 완료되었습니다.' : 'Student transferred successfully.');
    } catch (err) {
      console.error('Failed to transfer student:', err);
      alert('Failed to transfer student.');
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

  // Check if a specific mistake belongs to the active week's curriculum
  const isMistakeInWeeklyCurriculum = (mistake: any) => {
    const activeVocab = getWeeklyVocabWords();
    const activePhonics = getWeeklyPhonicsRules();
    const qText = (mistake.question_text || '').toLowerCase();
    const aText = (mistake.correct_answer || '').toLowerCase();
    const rText = (mistake.student_response || '').toLowerCase();

    // Check intersection with vocabulary words
    const matchesVocab = activeVocab.some(word => 
      qText.includes(word) || aText.includes(word) || rText.includes(word)
    );

    // Check intersection with phonics rules
    const matchesPhonics = activePhonics.some(rule => {
      const cleanRule = rule.replace(/-/g, '').toLowerCase();
      if (!cleanRule) return false;
      return qText.includes(cleanRule) || aText.includes(cleanRule) || rText.includes(cleanRule);
    });

    return matchesVocab || matchesPhonics;
  };

  // Compile trouble words and submission states
  const activeVocabWords = getWeeklyVocabWords();
  
  // Tally mistakes per vocabulary word
  const vocabMistakeCounts: Record<string, number> = {};
  activeVocabWords.forEach(word => {
    vocabMistakeCounts[word] = 0;
  });

  let completedHomeworkCount = 0;

  const rosterWithCompletion = studentsData.map(student => {
    // A student is marked complete if they have mistakes or scans matching this week's vocab list
    const weeklyMistakes = (student.mistakes || []).filter((m: any) => isMistakeInWeeklyCurriculum(m));
    const hasScannedThisWeek = weeklyMistakes.length > 0 || (
      student.lastScanDate && 
      // Simple date comparison: scan within last 7 days is considered active
      (new Date().getTime() - new Date(student.lastScanDate).getTime()) < 7 * 24 * 60 * 60 * 1000
    );

    if (hasScannedThisWeek && student.classStatus === 'active') {
      completedHomeworkCount++;
    }

    // Tally vocab errors (only count active students)
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

  // Sort vocabulary words by most mistake counts
  const sortedTroubleWords = Object.keys(vocabMistakeCounts)
    .map(word => ({ word, count: vocabMistakeCounts[word] }))
    .sort((a, b) => b.count - a.count);

  // --- RENDER LOGIN VIEW ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-pink-500/5 to-red-500/5 blur-[120px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-[#0c0c0c] rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6">
              <ChekkiMascot className="w-full h-full" mood="thinking" />
            </div>
            
            <h2 className="text-2xl font-black tracking-tight text-white mb-2 font-display">
              {isKo ? '교사 포털 로그인' : 'Teacher Portal Login'}
            </h2>
            <p className="text-zinc-500 text-xs font-korean mb-6 text-center break-keep">
              {isKo 
                ? '학습지 관리 및 분석을 위해 교사 계정으로 로그인해 주세요.'
                : 'Log in with your teacher credentials to manage curricula and rosters.'}
            </p>

            <form onSubmit={handleSignIn} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="teacher@school.com"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white"
                />
              </div>

              {authError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isSigningIn}
                className="w-full py-4 mt-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isSigningIn ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isKo ? '로그인' : 'Log In'}</span>
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
      <div className="min-h-screen bg-[#050505] text-zinc-200 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-pink-500/5 to-red-500/5 blur-[120px] pointer-events-none" />
        <div className="relative w-full max-w-md p-1.5 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col">
          <div className="bg-[#0c0c0c] rounded-[calc(2.5rem-0.375rem)] p-8 sm:p-10 flex flex-col items-center">
            <div className="w-20 h-20 mb-6">
              <ChekkiMascot className="w-full h-full" mood="happy" />
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white mb-2 text-center break-keep">
              {isKo ? '교사용 권한 활성화' : 'Activate Teacher Access'}
            </h2>
            <p className="text-zinc-500 text-xs font-korean mb-6 text-center leading-relaxed break-keep">
              {isKo 
                ? `반갑습니다, ${user?.name || '선생님'}! 교사 대시보드에 접근하려면 인증 코드를 등록해 주세요.`
                : `Welcome, ${user?.name || 'Teacher'}! Please enter your teacher authorization code to proceed.`}
            </p>

            <form onSubmit={handleActivateTeacher} className="w-full space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                  {isKo ? '교사 인증 코드' : 'Teacher Authorization Code'}
                </label>
                <input
                  type="text"
                  required
                  value={teacherCode}
                  onChange={(e) => setTeacherCode(e.target.value)}
                  placeholder="E.g. POLY10-TEACHER"
                  className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white uppercase"
                />
              </div>

              {authError && (
                <div className="p-3.5 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold rounded-xl text-center">
                  ⚠️ {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isActivating}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/15 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {isActivating ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <span>{isKo ? '인증 및 활성화' : 'Verify & Activate'}</span>
                )}
              </button>

              <button
                type="button"
                onClick={logout}
                className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl transition-all border border-zinc-800/40"
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
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex flex-col md:flex-row font-korean">

      {/* Teacher Onboarding Modal */}
      {showTeacherOnboarding && (() => {
        const step = teacherObSteps[teacherObStep];
        const isLast = teacherObStep === teacherObSteps.length - 1;
        return (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-2xl" onClick={dismissTeacherOnboarding} />
            <div className="relative w-full max-w-[400px] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-8 flex flex-col items-center text-center shadow-2xl">
              {/* Skip */}
              <button
                onClick={dismissTeacherOnboarding}
                className="absolute top-5 right-5 text-zinc-500 hover:text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all"
              >
                {isKo ? '건너뛰기' : 'Skip'}
              </button>

              {/* Illustration */}
              <div className="w-44 h-44 mb-6 rounded-3xl overflow-hidden bg-black/40 border border-white/5 shadow-[0_20px_40px_rgba(249,115,22,0.15)]">
                <img src={step.img} alt="" className="w-full h-full object-contain p-2" />
              </div>

              {/* Text */}
              <h3 className="text-2xl font-black text-white tracking-tight mb-3">
                {isKo ? step.titleKo : step.titleEn}
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed max-w-[280px] mb-8">
                {isKo ? step.descKo : step.descEn}
              </p>

              {/* Step dots */}
              <div className="flex items-center gap-2 mb-6">
                {teacherObSteps.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === teacherObStep ? 'w-8 bg-orange-500' : 'w-1.5 bg-white/20'}`}
                  />
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  if (isLast) {
                    dismissTeacherOnboarding();
                    setShowCreateClassModal(true);
                  } else {
                    setTeacherObStep(teacherObStep + 1);
                  }
                }}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 transition-all active:scale-[0.98]"
              >
                {isLast
                  ? (isKo ? '🚀 첫 학급 만들기' : '🚀 Create First Class')
                  : (isKo ? '다음' : 'Next')}
              </button>
            </div>
          </div>
        );
      })()}


      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-[#0a0a0a] border-b md:border-b-0 md:border-r border-zinc-900 flex flex-col shrink-0">
        
        {/* Sidebar Header / Brand */}
        <div className="p-6 border-b border-zinc-900 flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-500/10 border border-orange-500/20 rounded-xl flex items-center justify-center text-lg shadow-md shadow-orange-500/5">
            🏫
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-tight">
              {user.schoolName || 'B2B Academy'}
            </h1>
            <span className="text-[9px] font-black uppercase tracking-widest text-orange-500 leading-none">
              Teacher Portal
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="p-4 flex-1 space-y-1.5">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'overview'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-md shadow-orange-500/5'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <span>📊</span>
            <span>{isKo ? '반 통계 및 대시보드' : 'Class Dashboard'}</span>
          </button>
          
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'curriculum'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-md shadow-orange-500/5'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <span>📚</span>
            <span>{isKo ? '주간 학습 커리큘럼' : 'Manage Curriculum'}</span>
          </button>

          <button
            onClick={() => setActiveTab('students')}
            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-bold transition-all flex items-center gap-3 ${
              activeTab === 'students'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-md shadow-orange-500/5'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
            }`}
          >
            <span>👥</span>
            <span>{isKo ? '학생 출석 및 활동 정보' : 'Student Activity'}</span>
          </button>
        </nav>

        {/* Sidebar Footer / User Info */}
        <div className="p-4 border-t border-zinc-900 bg-zinc-950/20 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] font-black text-white truncate">{user.name}</p>
            <p className="text-[9px] text-zinc-500 truncate">{user.email}</p>
          </div>
          <button
            onClick={logout}
            className="p-2 text-zinc-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors shrink-0"
            title="Log Out"
          >
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#050505] relative overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/2 via-transparent to-transparent pointer-events-none" />
        
        {/* Top Header Control Bar */}
        <header className="p-6 border-b border-zinc-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🏫</span>
            <div className="relative">
              {classes.length > 0 ? (
                <select
                  value={selectedClass?.id || ''}
                  onChange={(e) => {
                    const found = classes.find(c => c.id === e.target.value);
                    if (found) setSelectedClass(found);
                  }}
                  className="bg-zinc-900 border border-zinc-800 text-white font-bold text-sm px-4 py-2 rounded-xl focus:border-orange-500 outline-none cursor-pointer pr-10 appearance-none"
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
              className="p-2 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-orange-400 hover:text-orange-300 rounded-xl transition-all font-bold text-xs shrink-0"
              title="Add New Class"
            >
              ➕
            </button>

            {selectedClass && (
              <div className="text-[10px] font-black text-orange-500 bg-orange-500/5 px-3 py-2 border border-orange-500/10 rounded-xl flex items-center gap-1.5 shadow-md shadow-orange-500/2 shrink-0">
                🔑 {isKo ? '학급 코드' : 'Class Code'}: <span className="font-mono select-all tracking-wider text-white text-xs">{selectedClass.joinCode || 'N/A'}</span>
              </div>
            )}
          </div>

          {/* Active Week Controls */}
          {selectedClass && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest mr-1">
                {isKo ? '현재 학기 주차' : 'Active Week'}
              </span>
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl flex items-center overflow-hidden">
                <button
                  onClick={() => handleUpdateWeek(-1)}
                  disabled={selectedClass.activeWeekNumber <= 1}
                  className="px-3 py-2 text-zinc-500 hover:text-white disabled:opacity-30 hover:bg-white/5 transition-all text-xs font-black border-r border-zinc-800"
                >
                  -
                </button>
                <span className="px-4 text-xs font-black text-white min-w-[3rem] text-center">
                  Week {selectedClass.activeWeekNumber}
                </span>
                <button
                  onClick={() => handleUpdateWeek(1)}
                  className="px-3 py-2 text-zinc-500 hover:text-white hover:bg-white/5 transition-all text-xs font-black"
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
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-56 h-56 mb-4 mx-auto">
                <img
                  src="/assets/teacher_ob_empty_state.png"
                  alt="Create your first class"
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              <h3 className="text-xl font-bold text-zinc-300 mb-2">
                {isKo ? '등록된 반이 없습니다' : 'No Classes Registered Yet'}
              </h3>
              <p className="text-zinc-600 text-xs font-medium max-w-sm mb-6 break-keep leading-relaxed">
                {isKo 
                  ? '교사 대시보드를 사용하려면 첫 번째 학급반을 먼저 만들어 주세요.' 
                  : 'Start by creating your first class to manage student rosters and homework curricula.'}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98]"
                >
                  🚀 {isKo ? '새 학급반 만들기' : 'Create Class Now'}
                </button>
                <button
                  onClick={() => { setShowTeacherOnboarding(true); setTeacherObStep(0); }}
                  className="px-5 py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white font-bold text-xs rounded-xl transition-all"
                >
                  {isKo ? '사용 가이드 보기' : 'View Guide'}
                </button>
              </div>
            </div>
          ) : (
            // Tabs Skeletons to be built in subsequent steps
            <div className="animate-fade-in">
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Top Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                        {isKo ? '대상 학급' : 'Active Class'}
                      </p>
                      <h4 className="text-lg font-black text-white">{selectedClass?.name}</h4>
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">Level: {selectedClass?.level}</p>
                    </div>
                    
                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                      <p className="text-[10px] font-black text-orange-500/90 uppercase tracking-widest mb-1">
                        {isKo ? '숙제 완료율' : 'Completion Rate'}
                      </p>
                      <h4 className="text-lg font-black text-white">
                        {completedHomeworkCount} / {activeStudentsCount} {isKo ? '명 완료' : 'Students'} ({completionRate}%)
                      </h4>
                      {/* Simple progress bar */}
                      <div className="w-full bg-zinc-950 h-1.5 rounded-full mt-3 overflow-hidden border border-zinc-900">
                        <div 
                          className="bg-gradient-to-r from-orange-500 to-pink-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 shadow-xl backdrop-blur-sm">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                        {isKo ? '등록 원생 수' : 'Enrolled Students'}
                      </p>
                      <h4 className="text-lg font-black text-white">
                        {activeStudentsCount} {isKo ? '명' : 'Children'}
                      </h4>
                      <p className="text-[10px] text-zinc-600 mt-2 font-medium">
                        {isKo ? '가입 승인 완료된 활동 원생 수' : 'Approved active student profiles'}
                      </p>
                    </div>
                  </div>

                  {/* Main Overview Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Left/Middle Column: Trouble Words */}
                    <div className="lg:col-span-2 bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm flex flex-col text-left">
                      <h4 className="text-md font-black text-white mb-1">
                        {isKo ? '💡 이번 주 취약 단어 분석' : '💡 Weekly Vocabulary Struggle Counts'}
                      </h4>
                      <p className="text-[10px] text-zinc-500 mb-6 leading-normal font-medium">
                        {isKo 
                          ? '아이들이 숙제 채점 시 틀렸거나 어려워한 단어들의 오답 횟수입니다.' 
                          : 'Tally of spelling and grading mistakes recorded across all student homework scans.'}
                      </p>

                      {activeVocabWords.length === 0 ? (
                        <div className="flex-1 flex flex-col items-center justify-center py-10 text-zinc-600 text-xs">
                          <span>📝 {isKo ? '등록된 이번 주 학습 단어가 없습니다.' : 'No vocabulary words configured for this week.'}</span>
                          <span className="text-[10px] text-zinc-700 mt-1">
                            {isKo ? '주간 학습 커리큘럼 탭에서 단어를 추가해 주세요.' : 'Go to the Curriculum tab to add words.'}
                          </span>
                        </div>
                      ) : isLoadingRoster ? (
                        <div className="flex-1 flex items-center justify-center py-10">
                          <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {sortedTroubleWords.map(({ word, count }) => (
                            <div key={word} className="flex items-center justify-between p-3.5 bg-zinc-950/60 border border-zinc-900/60 rounded-xl hover:border-zinc-800 transition-colors">
                              <span className="text-sm font-black text-white font-mono">{word}</span>
                              <div className="flex items-center gap-3">
                                {count > 0 ? (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-500/10 border border-red-500/20 text-red-400">
                                    ⚠️ {count} {isKo ? '명 틀림' : 'Mistakes'}
                                  </span>
                                ) : (
                                  <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                                    ✓ {isKo ? '오답 없음' : 'Clear'}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Column: AI Tutor Pedagogical Review Tip */}
                    <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm text-left flex flex-col justify-between">
                      <div>
                        <h4 className="text-md font-black text-white mb-1">
                          {isKo ? '📖 교사 복습 가이드' : '📖 Review Strategy Guide'}
                        </h4>
                        <p className="text-[10px] text-zinc-500 mb-6 leading-normal font-medium">
                          {isKo 
                            ? '오답 통계를 기반으로 추천하는 다음 수업 복습 가이드입니다.' 
                            : 'AI-generated instruction guide based on current weekly error statistics.'}
                        </p>
                        
                        <div className="space-y-4 text-xs leading-relaxed text-zinc-400 font-medium">
                          {sortedTroubleWords.some(w => w.count > 0) ? (
                            <>
                              <p className="text-zinc-300">
                                {isKo 
                                  ? `이번 주 가장 많이 틀린 단어는 "${sortedTroubleWords[0].word}" 입니다.` 
                                  : `Students struggled most with the word "${sortedTroubleWords[0].word}" this week.`}
                              </p>
                              <div className="p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl text-orange-400/90 leading-normal">
                                💡 {isKo 
                                  ? '내일 수업 시작 시, 보드판에 해당 단어들의 파닉스 모음 결합을 소리내어 복습하는 파닉스 드릴 게임을 추천합니다.' 
                                  : 'Recommendation: Dedicate the first 5 minutes of class to spelling tracing and a vocal blend drill focusing on target phonics.'}
                              </div>
                            </>
                          ) : (
                            <div className="text-zinc-500 py-6 text-center text-xs">
                              🎉 {isKo ? '모든 아이들이 숙제를 완벽히 소화하고 있습니다!' : 'All children have mastered the weekly vocabulary!'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-6 border-t border-zinc-900 mt-6 flex justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            if (activeVocabWords.length > 0) {
                              alert(isKo ? '오답 맞춤 복습 프린트 학습지 PDF가 다운로드 대기 중입니다.' : 'AI review worksheet PDF compile initiated.');
                            } else {
                              alert(isKo ? '이번 주 커리큘럼 단어를 먼저 등록해 주세요.' : 'Please add vocabulary words first.');
                            }
                          }}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white font-bold text-xs rounded-xl border border-zinc-800/40 transition-colors"
                        >
                          🖨️ {isKo ? '오답 맞춤 프린트 생성' : 'Generate Review Sheet'}
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {activeTab === 'curriculum' && (
                <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm animate-fade-in text-left">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
                    <div>
                      <h4 className="text-lg font-black text-white">
                        {isKo ? `주간 커리큘럼 편집 (Week ${selectedClass?.activeWeekNumber})` : `Edit Weekly Curriculum (Week ${selectedClass?.activeWeekNumber})`}
                      </h4>
                      <p className="text-[10px] text-zinc-500 font-medium">
                        {isKo 
                          ? '현재 주차의 학급 교안 정보입니다. 저장된 내용은 부모님들의 채점 피드백에 반영됩니다.' 
                          : 'Weekly teaching details. Saved context is fed directly to parents\' scans.'}
                      </p>
                    </div>
                  </div>

                  {isLoadingCurriculum ? (
                    <div className="flex items-center justify-center min-h-[30vh]">
                      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    </div>
                  ) : (
                    <form onSubmit={handleSaveCurriculum} className="space-y-6">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                          {isKo ? '대주제 / 주간 테마 (Topic)' : 'Weekly Topic / Theme'}
                        </label>
                        <input
                          type="text"
                          value={curriculumTopic}
                          onChange={(e) => setCurriculumTopic(e.target.value)}
                          placeholder={isKo ? '예: Weather & Nature (날씨와 자연)' : 'E.g. Weather & Nature'}
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <span>{isKo ? '주간 학습 단어 (Vocabulary)' : 'Target Vocabulary'}</span>
                            <span className="text-[9px] text-zinc-600 font-medium capitalize">
                              ({isKo ? '쉼표로 구분' : 'separated by commas'})
                            </span>
                          </label>
                          <textarea
                            value={curriculumVocab}
                            onChange={(e) => setCurriculumVocab(e.target.value)}
                            placeholder="umbrella, rainbow, storm, rain..."
                            className="w-full h-32 bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white resize-none font-mono"
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1 flex items-center gap-1.5">
                            <span>{isKo ? '주간 타겟 파닉스 / 문법 (Phonics)' : 'Target Phonics Rules / Sounds'}</span>
                            <span className="text-[9px] text-zinc-600 font-medium capitalize">
                              ({isKo ? '쉼표로 구분' : 'separated by commas'})
                            </span>
                          </label>
                          <textarea
                            value={curriculumPhonics}
                            onChange={(e) => setCurriculumPhonics(e.target.value)}
                            placeholder="-ai-, -ay-, sh-, ch-..."
                            className="w-full h-32 bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white resize-none font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                          {isKo ? '주간 본문 지문 / 스토리 (Reading Passage)' : 'Weekly Reading Passage / Target Story'}
                        </label>
                        <textarea
                          value={curriculumPassage}
                          onChange={(e) => setCurriculumPassage(e.target.value)}
                          placeholder={isKo ? '이번 주 교재에 수록된 본문 이야기를 입력해 주세요.' : 'Paste the reference reading text here.'}
                          className="w-full h-40 bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white resize-y"
                        />
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-zinc-900">
                        <button
                          type="button"
                          onClick={loadCurriculum}
                          disabled={isSavingCurriculum}
                          className="px-5 py-3 rounded-xl text-xs font-bold bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800/40 transition-colors"
                        >
                          {isKo ? '초기화' : 'Reset'}
                        </button>
                        
                        <button
                          type="submit"
                          disabled={isSavingCurriculum}
                          className="px-6 py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
                        >
                          {isSavingCurriculum ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <span>💾 {isKo ? '주간 계획 저장' : 'Save Curriculum'}</span>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'students' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* --- SECTION 1: PENDING APPROVALS --- */}
                  {pendingRoster.length > 0 && (
                    <div className="bg-[#0a0a0a] border border-orange-500/20 rounded-3xl p-6 sm:p-8 shadow-xl text-left">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-xl">🔔</span>
                        <div>
                          <h4 className="text-md font-black text-white">
                            {isKo ? '가입 승인 대기 목록' : 'Pending Classroom Approvals'}
                          </h4>
                          <p className="text-[10px] text-orange-400 font-medium font-korean leading-normal">
                            {isKo 
                              ? '이 학급반에 가입을 요청한 학부모 목록입니다. 승인 후 대시보드에 합산됩니다.' 
                              : 'Parents requesting to enroll their children. Approve to add them to class analytics.'}
                          </p>
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-zinc-400 text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="pb-3 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                              <th className="pb-3">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                              <th className="pb-3 text-right pr-2">{isKo ? '승인 여부' : 'Approval Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {pendingRoster.map((student) => (
                              <tr key={student.uid} className="hover:bg-zinc-950/40 transition-colors">
                                <td className="py-4 pl-2 font-black text-white text-sm">
                                  {student.studentName || 'Unnamed'}
                                </td>
                                <td className="py-4">
                                  <p className="font-bold text-zinc-300">{student.name}</p>
                                  <p className="text-[10px] text-zinc-500">{student.email}</p>
                                </td>
                                <td className="py-4 text-right pr-2 space-x-2">
                                  <button
                                    onClick={() => handleDeclineStudent(student.uid)}
                                    className="px-3.5 py-2 border border-zinc-800 hover:border-zinc-700 bg-zinc-900/50 hover:bg-zinc-900 text-zinc-400 hover:text-zinc-300 font-bold rounded-xl transition-all text-xs"
                                  >
                                    {isKo ? '거절' : 'Decline'}
                                  </button>
                                  <button
                                    onClick={() => handleApproveStudent(student.uid)}
                                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/10 transition-all text-xs"
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
                  )}

                  {/* --- SECTION 2: ACTIVE ROSTER --- */}
                  <div className="bg-[#0a0a0a] border border-zinc-900 rounded-3xl p-6 sm:p-8 shadow-xl backdrop-blur-sm text-left">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-900">
                      <div>
                        <h4 className="text-lg font-black text-white">
                          {isKo ? '👥 소속 원생 명단' : 'Approved Student Roster'}
                        </h4>
                        <p className="text-[10px] text-zinc-500 font-medium font-korean leading-normal">
                          {isKo 
                            ? '현재 승인 완료되어 활동 중인 학생 명단입니다.' 
                            : 'Active classroom student roster logs and transfer operations.'}
                        </p>
                      </div>
                    </div>

                    {isLoadingRoster ? (
                      <div className="flex items-center justify-center min-h-[30vh]">
                        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                      </div>
                    ) : activeRoster.length === 0 ? (
                      <div className="text-center py-12 text-zinc-500 text-xs leading-relaxed font-korean">
                        {isKo 
                          ? '이 학급반에 등록된 학생이 없습니다. 가입 코드를 학부모에게 공유하거나 승인을 기다려 주세요.' 
                          : 'No active students enrolled in this class yet.'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-zinc-400 text-left border-collapse">
                          <thead>
                            <tr className="border-b border-zinc-900 text-zinc-500 font-bold uppercase tracking-wider text-[10px]">
                              <th className="pb-3 pl-2">{isKo ? '학생 이름' : 'Student Name'}</th>
                              <th className="pb-3">{isKo ? '학부모 계정' : 'Parent Info'}</th>
                              <th className="pb-3">{isKo ? '숙제 상태' : 'Weekly Status'}</th>
                              <th className="pb-3">{isKo ? '마지막 스캔일' : 'Last Active'}</th>
                              <th className="pb-3 text-right pr-2">{isKo ? '원생 관리' : 'Actions'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {activeRoster.map((student) => (
                              <tr key={student.uid} className="hover:bg-zinc-950/40 transition-colors">
                                <td className="py-4 pl-2 font-black text-white text-sm">{student.studentName || 'Unnamed'}</td>
                                <td className="py-4">
                                  <p className="font-bold text-zinc-300">{student.name}</p>
                                  <p className="text-[10px] text-zinc-500">{student.email}</p>
                                </td>
                                <td className="py-4">
                                  {student.hasScannedThisWeek ? (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 animate-pulse">
                                      ✅ {isKo ? '스캔 완료' : 'Scanned'}
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-zinc-900 border border-zinc-800 text-zinc-500">
                                      ❌ {isKo ? '미스캔' : 'Not Scanned'}
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
                                    className="bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-400 px-2 py-1.5 rounded-xl cursor-pointer outline-none focus:border-orange-500 appearance-none"
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
                                    className="px-3 py-1.5 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl transition-all text-[10px]"
                                  >
                                    {isKo ? '삭제' : 'Remove'}
                                  </button>
                                  <button
                                    onClick={() => setSelectedStudentDetails(student)}
                                    className="px-4 py-1.5 border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 text-orange-400 hover:text-orange-300 font-bold rounded-xl transition-all text-[10px]"
                                  >
                                    🔍 {isKo ? '오답 상세' : 'View Details'}
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
              )}
            </div>
          )}
        </section>
      </main>

      {/* --- STUDENT MISTAKE DETAILS SLIDE-OVER DRAWER --- */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 z-[200] flex items-center justify-end">
          <div 
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setSelectedStudentDetails(null)} 
          />
          <div className="relative w-full max-w-lg h-full bg-[#0a0a0a] border-l border-zinc-900 p-6 flex flex-col shadow-2xl animate-slide-in text-left">
            
            {/* Drawer Header */}
            <div className="pb-4 border-b border-zinc-900 flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-black text-white">
                  👦 {selectedStudentDetails.studentName || 'Unnamed'}{isKo ? ' 원생 오답 기록' : "'s Error Logs"}
                </h3>
                <p className="text-[10px] text-zinc-500 font-medium font-mono mt-0.5">
                  {selectedStudentDetails.email}
                </p>
              </div>
              <button
                onClick={() => setSelectedStudentDetails(null)}
                className="p-2 text-zinc-500 hover:text-white rounded-full hover:bg-white/5 transition-all text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {/* Drawer Content */}
            <div className="flex-1 overflow-y-auto py-6 space-y-6 custom-scrollbar pr-1">
              <div>
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 block">
                  {isKo ? '이번 주 오답 목록' : "This week's mistakes"}
                </span>

                {selectedStudentDetails.weeklyMistakes.length === 0 ? (
                  <div className="text-center py-12 text-zinc-600 text-xs">
                    🎉 {isKo ? '오답 기록이 없습니다. 완벽해요!' : 'No spelling or vocabulary errors recorded this week.'}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStudentDetails.weeklyMistakes.map((m: any, idx: number) => (
                      <div key={m.uniqueId || idx} className="p-4 bg-zinc-950 border border-zinc-900 rounded-2xl flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="px-2 py-0.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 font-bold rounded-lg text-[9px] uppercase tracking-wider font-mono">
                            {m.type || 'Phonics'}
                          </span>
                          <span className="text-[9px] text-zinc-600 font-mono">
                            {m.dateAdded ? m.dateAdded.split('T')[0] : ''}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs">
                          <div>
                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">
                              Question / Word
                            </span>
                            <p className="font-bold text-white font-mono">{m.question_text}</p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-1">
                            <div>
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">
                                Target Answer
                              </span>
                              <p className="font-bold text-emerald-400 font-mono">{m.correct_answer}</p>
                            </div>
                            <div>
                              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block mb-0.5">
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
            <div className="pt-4 border-t border-zinc-900 shrink-0">
              <button
                type="button"
                onClick={() => setSelectedStudentDetails(null)}
                className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl transition-all border border-zinc-800/40"
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
            className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
            onClick={() => setShowCreateClassModal(false)} 
          />
          <div className="relative p-1 bg-white/5 border border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-md mx-4 animate-fade-in">
            <div className={`relative w-full h-full rounded-[calc(2.5rem-0.25rem)] ${isNight ? 'bg-[#0a0a0a] text-zinc-200' : 'bg-white text-zinc-900'} shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] p-8 overflow-hidden`}>
              <h3 className="text-xl font-black text-white mb-2">
                {isKo ? '새 학급반 추가' : 'Add New Class'}
              </h3>
              <p className="text-zinc-500 text-xs font-korean mb-6 leading-relaxed">
                {isKo 
                  ? '관리할 학급의 이름과 대상 학년을 설정해 학급을 개설하세요.'
                  : 'Specify the class details to expand your school roster.'}
              </p>

              <form onSubmit={handleCreateClass} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    {isKo ? '반 이름' : 'Class Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    placeholder="E.g. 7-Mercury"
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">
                    {isKo ? '대상 학년' : 'Class Level'}
                  </label>
                  <select
                    value={newClassLevel}
                    onChange={(e) => setNewClassLevel(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 focus:border-orange-500 outline-none text-sm p-3.5 rounded-xl transition-colors text-white cursor-pointer"
                  >
                    <option value="5-year-old">{isKo ? '5세반' : '5-year-old'}</option>
                    <option value="6-year-old">{isKo ? '6세반' : '6-year-old'}</option>
                    <option value="7-year-old">{isKo ? '7세반' : '7-year-old'}</option>
                    <option value="Elementary Grade 1">{isKo ? '초등 1학년' : 'Elementary Grade 1'}</option>
                    <option value="Elementary Grade 2">{isKo ? '초등 2학년' : 'Elementary Grade 2'}</option>
                  </select>
                </div>

                <div className="pt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateClassModal(false)}
                    className="flex-1 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-zinc-400 font-bold text-xs rounded-xl border border-zinc-800/40 transition-colors"
                  >
                    {isKo ? '취소' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingClass}
                    className="flex-1 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/10 transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
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
