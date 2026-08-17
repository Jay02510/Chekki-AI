import React, { useState, useEffect } from 'react';
import {
  Sparkle,
  CaretDown,
  MagnifyingGlass,
  Question,
  GraduationCap,
  Heart,
  Moon,
  Sun,
  Globe,
  ArrowLeft,
  Lightning,
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
  setIsNight?: React.Dispatch<React.SetStateAction<boolean>>;
}

interface FaqItem {
  id: string;
  category: 'parent' | 'teacher';
  questionKo: string;
  questionEn: string;
  answerKo: string;
  answerEn: string;
  tagKo: string;
  tagEn: string;
}

const FAQ_DATA: FaqItem[] = [
  // --- PARENT FAQS ---
  {
    id: 'p1',
    category: 'parent',
    tagKo: '엄마표 영어',
    tagEn: "Mom's English",
    questionKo: '영어 발음이나 문법에 자신 없는 엄마도 아이 숙제를 도울 수 있나요?',
    questionEn: 'Can moms who lack confidence in English pronunciation help with homework?',
    answerKo: '네, 완벽히 가능합니다! 채키 AI는 엄마가 영어 선생님 역할을 직접 맡을 필요가 없도록 설계되었습니다. 숙제 사진을 찍으면 5초 이내로 AI가 채점하고, 엄마가 아이에게 들려줄 한국어 칭찬 가이드("엄마, 이렇게 알려주세요")와 정확한 원어민 음성을 제공합니다.',
    answerEn: 'Yes, absolutely! Chekki AI eliminates the pressure for moms to act as English teachers. Simply snap a photo, and Chekki provides grading in well under 5 seconds, warm Korean coaching tips, and native pronunciation audio.'
  },
  {
    id: 'p2',
    category: 'parent',
    tagKo: '2차 재도전 스캔',
    tagEn: '2nd Rescan Loop',
    questionKo: '아이 답안을 스캔한 후 틀린 문제가 나오면 어떻게 재도전하나요?',
    questionEn: 'How does the 2nd attempt rescan work when a child gets wrong answers?',
    answerKo: '채키의 "⚡ 2차 재도전 스캔"을 활용해보세요! 첫 채점 후 오답이 나오면 채키가 엄마에게 칭찬 가이드를 전달합니다. 아이가 종이에 직접 정답을 고쳐 쓴 뒤 "2차 재도전 스캔"을 올리면, 100% 완벽 마스터로 즉시 업데이트되어 눈물이나 실랑이 없이 성취감을 얻을 수 있습니다.',
    answerEn: 'Use Chekki\'s "⚡ 2nd Rescan Loop"! When errors are detected, Mom shares a warm 5-second coaching tip. The child fixes the paper response, rescans, and instantly updates their grade to 100% Mastered without arguments.'
  },
  {
    id: 'p3',
    category: 'parent',
    tagKo: '사용 편의성',
    tagEn: 'Ease of Use',
    questionKo: '앱 사용 시 긴 프롬프트를 입력하거나 타이핑해야 하나요?',
    questionEn: 'Do I need to type long prompts or instructions to use the app?',
    answerKo: '아닙니다. 채키는 100% 무(無)프롬프트 방식입니다. 바쁜 엄마들을 위해 복잡한 키보드 입력이나 프롬프트 지시어 없이 오직 카메라 스캔 1회만으로 모든 채점과 코칭 가이드가 자동 완성됩니다.',
    answerEn: 'No! Chekki is 100% prompt-less. Designed for busy moms, zero typing or complex prompts are required. A single camera scan handles all grading and coaching guides automatically.'
  },
  {
    id: 'p4',
    category: 'parent',
    tagKo: '학원 교재 연동',
    tagEn: 'Academy Key Sync',
    questionKo: '영유/어학원 교재 정답지와 AI 채점 결과가 일치하나요?',
    questionEn: 'Does Chekki sync with English Kindergarten & Academy textbook answer keys?',
    answerKo: '네, 정확하게 연동됩니다. 다니고 계신 학원의 초대를 받아 연동하면, 학원에서 입력한 이번 주 타겟 단어, 파닉스 규칙, 읽기 지문과 100% 연동되어 일반 AI의 환각 오류 없이 채점됩니다.',
    answerEn: "Yes! Once your academy invites you, Chekki evaluates scans against the teacher's active textbook keys, eliminating false AI grading errors."
  },
  {
    id: 'p5',
    category: 'parent',
    tagKo: '가격 및 무료체험',
    tagEn: 'Pricing & Trial',
    questionKo: '학부모용 Chekki 모바일 앱 이용 가격은 어떻게 되나요?',
    questionEn: 'How much does the Chekki Parent Mobile App cost?',
    answerKo: '기본 무료 스캔이 제공되며, 신용카드 등록 없이 언제든지 시작하실 수 있습니다. 연동 학원에 재원 중인 원생은 학원 플랜을 통해 100% 무제한 무료로 모든 기능을 이용하실 수 있습니다.',
    answerEn: 'Chekki offers free daily scans with no credit card required. Students enrolled in partner academies get 100% unlimited free access through their academy subscription.'
  },

  // --- TEACHER FAQS ---
  {
    id: 't1',
    category: 'teacher',
    tagKo: '다중 페이지 AI 스캔',
    tagEn: 'Multi-Page AI Scan',
    questionKo: '매주 학급 주간 단어와 정답지를 일일이 타이핑해야 하나요?',
    questionEn: 'Do teachers have to manually type weekly vocabulary words and answer keys?',
    answerKo: '아닙니다! 교재 사진이나 PDF 파일을 한 번에 최대 5장까지 드롭하면 AI가 단어, 파닉스 패턴, 읽기 지문, 학부모용 정답 가이드를 3초 만에 자동으로 추출하여 대시보드에 등록해 줍니다. 1클릭 칩 삭제/추가 기능으로 원하는 항목만 자유롭게 편집하실 수 있습니다.',
    answerEn: 'No! Simply drop up to 5 textbook photos or multi-page PDFs at once. AI extracts target words, phonics rules, reading stories, and parent answer keys into your dashboard in seconds. You can easily add or delete items with 1-click interactive chips.'
  },
  {
    id: 't2',
    category: 'teacher',
    tagKo: '초대 링크 연동',
    tagEn: 'Invite-Link Sync',
    questionKo: '가정에서 학부모가 스캔한 오답 데이터는 어떻게 선생님께 전송되나요?',
    questionEn: 'How do parent homework scans sync to the Teacher Dashboard?',
    answerKo: '학부모님이 원장님/선생님께 받은 초대 링크로 Chekki 앱에 연동하면 자동으로 동기화됩니다. 집에서 스캔한 빨간 테두리 오답과 점수가 교사 대시보드로 실시간 전송되어 개별 원생 활동에서 확인하실 수 있습니다.',
    answerEn: "Parents link their account via the invite their teacher sends them. Homework scans and red-bordered mistake data silently sync straight to your teacher dashboard in real-time."
  },
  {
    id: 't3',
    category: 'teacher',
    tagKo: '오답 맞춤 프린트',
    tagEn: 'Printable Review',
    questionKo: '오답 맞춤 복습 프린트 및 학원 성적표는 어떻게 인쇄하나요?',
    questionEn: 'How do I generate printable review sheets and academy branded report cards?',
    answerKo: '교사 대시보드에서 1클릭으로 간편히 발급됩니다. "오답 맞춤 프린트 생성" 버튼을 누르면 학원 로고가 포함된 파닉스/단어 쓰기 맞춤 PDF가 생성되며, 원생 상세 정보에서 "맞춤 로고 성적표 인쇄"를 누르면 공식 학부모 리포트가 출력됩니다.',
    answerEn: 'With a single click! Click "Generate Review Sheet" for an automated custom PDF worksheet, or click "Print Branded Report" inside any student profile for an official academy report card.'
  },
  {
    id: 't4',
    category: 'teacher',
    tagKo: '7일 무료 체험',
    tagEn: '7-Day Free Trial',
    questionKo: '학원용 7일 무료 체험 신청 조건 및 승인 절차는 어떻게 되나요?',
    questionEn: 'What is required for the 7-Day Academy Free Trial?',
    answerKo: '학원명, 담당자 성함, 이메일/연락처 3가지 필수 정보만 입력하시면 즉시 신청됩니다. 신용카드 등록이나 사업자번호 없이 신청 후 1시간 내 7일 전용 교사 승인 코드가 발급됩니다.',
    answerEn: 'Only 3 basic fields are required: Academy Name, Contact Name, and Email/Phone. No credit card or tax documents required. Your 7-day access code is issued within 1 hour.'
  },
  {
    id: 't5',
    category: 'teacher',
    tagKo: 'AI 오답 정밀도',
    tagEn: 'AI Precision',
    questionKo: '학생 손글씨 채점 시 일반 AI의 환각(Hallucination) 오답 우려는 없나요?',
    questionEn: 'Are there concerns about AI OCR hallucinations misgrading student handwriting?',
    answerKo: '체키는 학원 교재의 정답지 데이터(Ground-Truth)를 채점 기준으로 1차 대조하기 때문에, 일반 AI 파운데이션 모델의 환각 오류 없이 정밀한 채점 기준을 유지합니다.',
    answerEn: 'Chekki cross-references scans against your academy\'s ground-truth answer key, keeping grading precise and eliminating false AI grading hallucinations.'
  },
  {
    id: 't6',
    category: 'teacher',
    tagKo: '페이지별 항목 선택',
    tagEn: 'Page-by-Page Picker',
    questionKo: '단원 전체 교재 페이지를 스캔한 후 원하는 항목만 골라서 커리큘럼에 넣을 수 있나요?',
    questionEn: 'Can I scan a multi-page textbook unit and selectively pick items for each category?',
    answerKo: '네, 가능합니다! 다중 스캔 후 제공되는 "🎯 Pick & Choose 서랍"에서 1페이지, 2페이지 등 페이지별 탭을 오가며 파닉스 규칙, 단어, 본문 지문을 선택적으로 체크하여 학급 주간 커리큘럼에 바로 반영할 수 있습니다.',
    answerEn: 'Yes! After scanning multiple pages, Chekki provides a "🎯 Pick & Choose Drawer". Easily toggle between Page 1, Page 2, etc., and selectively pick vocabulary, phonics rules, and reading passages into your weekly curriculum.'
  }
];

export default function FaqPage({ isNight = true, setIsNight }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'parent' | 'teacher'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const [isKo, setIsKo] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chekki_lang');
      if (saved === 'en') return false;
      if (saved === 'ko') return true;
    }
    return true;
  });

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLangToggle = () => {
    const next = !isKo;
    setIsKo(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('chekki_lang', next ? 'ko' : 'en');
    }
  };

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const qText = isKo ? item.questionKo : item.questionEn;
    const aText = isKo ? item.answerKo : item.answerEn;
    const matchesSearch = searchQuery.trim() === '' || 
      qText.toLowerCase().includes(searchQuery.toLowerCase()) || 
      aText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <div className={`min-h-screen ${isNight ? 'bg-brand-dark text-zinc-100' : 'bg-slate-50 text-zinc-900'} font-sans transition-colors duration-300 relative flex flex-col`}>
      {/* Background radial glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/5 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Header Bar */}
      <header className={`relative z-20 w-full border-b backdrop-blur-xl transition-colors ${
        isNight ? 'bg-brand-dark/80 border-white/10' : 'bg-white/80 border-zinc-200 shadow-xs'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center gap-2 text-xs font-bold ${
                isNight ? 'bg-white/5 border-white/10 hover:bg-white/10 text-zinc-300' : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-700'
              }`}
            >
              <ArrowLeft size={16} weight="bold" />
              <span>{isKo ? '메인으로' : 'Home'}</span>
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigateTo('/')}>
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-orange-500/30">
                체
              </div>
              <span className="font-extrabold text-lg tracking-tight">Chekki AI <span className="text-orange-500 font-mono text-xs">FAQ</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={handleLangToggle}
              className={`px-3 py-1.5 min-h-11 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-zinc-900'
              }`}
            >
              <Globe size={14} weight="bold" />
              <span>{isKo ? 'EN' : '한국어'}</span>
            </button>

            {/* Theme Toggle */}
            {setIsNight && (
              <button
                type="button"
                onClick={() => setIsNight(prev => !prev)}
                aria-label={isKo ? '테마 전환' : 'Toggle light / dark mode'}
                className={`min-w-11 min-h-11 flex items-center justify-center rounded-xl border transition-all cursor-pointer ${
                  isNight ? 'bg-white/5 border-white/10 text-amber-400 hover:bg-white/10' : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200'
                }`}
              >
                {isNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12 sm:py-16 relative z-10">
        
        {/* Title Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-orange-500/10 border border-orange-500/20 text-orange-500 mb-4">
            <Sparkle size={14} weight="bold" />
            <span>{isKo ? '자주 묻는 질문 센터' : 'Frequently Asked Questions'}</span>
          </div>
          <h1 className={`text-3xl sm:text-5xl font-black tracking-tight mb-4 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '궁금하신 점을 빠르게 해결해 드립니다.' : 'Got Questions? We Have Answers.'}
          </h1>
          <p className={`text-sm sm:text-base max-w-xl mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '학부모용 무프롬프트 스캔부터 학원용 3초 AI 교재 등록 및 1클릭 성적표 발급까지 한눈에 확인하세요.' 
              : 'Everything you need to know about Chekki AI for parents and academies.'}
          </p>
        </div>

        {/* Search & Category Filter Control Bar */}
        <div className="space-y-6 mb-10">
          
          {/* Search Box */}
          <div className="relative max-w-2xl mx-auto">
            <MagnifyingGlass size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isKo ? '질문 내용 검색 (예: 재도전, 교재 등록, 성적표)...' : 'Search questions (e.g., rescan, textbook, reports)...'}
              className={`w-full pl-11 pr-4 py-4 rounded-2xl border text-sm outline-none transition-all ${
                isNight 
                  ? 'bg-brand-dark border-white/10 text-white placeholder-zinc-500 focus:border-orange-500/50' 
                  : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400 focus:border-orange-500 shadow-xs'
              }`}
            />
          </div>

          {/* Persona Category Tabs */}
          <div className="flex justify-center items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                activeCategory === 'all' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : isNight ? 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              {isKo ? '전체 보기' : 'All FAQs'}
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('parent')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeCategory === 'parent' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : isNight ? 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <Heart size={14} weight="fill" className={activeCategory === 'parent' ? 'text-white' : 'text-orange-500'} />
              <span>{isKo ? '👩‍👧 학부모님 FAQ' : 'For Parents'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveCategory('teacher')}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                activeCategory === 'teacher' 
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' 
                  : isNight ? 'bg-white/5 border border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border border-zinc-200 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <GraduationCap size={14} weight="bold" className={activeCategory === 'teacher' ? 'text-white' : 'text-purple-400'} />
              <span>{isKo ? '👨‍🏫 선생님 / 학원 FAQ' : 'For Academies'}</span>
            </button>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-4">
          {filteredFaqs.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border ${isNight ? 'bg-brand-dark border-white/5 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-500'}`}>
              <Question size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm">{isKo ? '검색 결과와 일치하는 FAQ 질문이 없습니다.' : 'No matching FAQ questions found.'}</p>
            </div>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              const isTeacher = faq.category === 'teacher';
              return (
                <div 
                  key={faq.id}
                  className={`border rounded-2xl sm:rounded-3xl transition-all duration-300 overflow-hidden ${
                    isOpen 
                      ? isNight 
                        ? isTeacher ? 'bg-brand-dark-elevated-alt border-purple-500/40 shadow-xl' : 'bg-brand-dark-elevated border-orange-500/40 shadow-xl' 
                        : isTeacher ? 'bg-purple-50/40 border-purple-200 shadow-md' : 'bg-orange-50/40 border-orange-200 shadow-md'
                      : isNight 
                        ? 'bg-brand-dark border-white/10 hover:border-white/20' 
                        : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-2xs'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    className="w-full p-5 sm:p-6 text-left flex items-start justify-between gap-4 cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider shrink-0 mt-0.5 ${
                        isTeacher 
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' 
                          : 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      }`}>
                        {isKo ? faq.tagKo : faq.tagEn}
                      </span>
                      <h3 className={`text-sm sm:text-base font-extrabold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                        {isKo ? faq.questionKo : faq.questionEn}
                      </h3>
                    </div>

                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-300 ${
                      isOpen ? 'rotate-180 bg-orange-500 text-white' : isNight ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      <CaretDown size={16} weight="bold" />
                    </div>
                  </button>

                  {/* Expandable Answer Content */}
                  {isOpen && (
                    <div className={`px-5 sm:px-6 pb-6 pt-2 text-xs sm:text-sm leading-relaxed border-t transition-all ${
                      isNight ? 'border-white/5 text-zinc-300' : 'border-zinc-200/80 text-zinc-700'
                    }`}>
                      <p className="font-normal">{isKo ? faq.answerKo : faq.answerEn}</p>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Contact Assistance CTA Card */}
        <div className={`mt-16 p-8 sm:p-10 rounded-3xl border text-center relative overflow-hidden ${
          isNight ? 'bg-gradient-to-b from-brand-dark-elevated to-brand-dark border-orange-500/20' : 'bg-gradient-to-b from-orange-50 to-white border-orange-200'
        }`}>
          <h3 className={`text-xl sm:text-2xl font-black mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
            {isKo ? '찾으시는 답변이 없으신가요?' : 'Still Have Questions?'}
          </h3>
          <p className={`text-xs sm:text-sm max-w-md mx-auto mb-6 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo 
              ? '체키 AI 전담 지원팀이 학원 무료 체험 및 서비스 이용을 친절히 도와드립니다.' 
              : 'Our support team is ready to assist you with free trial setup and questions.'}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="mailto:chekkihelp@gmail.com?subject=[Chekki%20Support]%20Customer%20Inquiry"
              className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center gap-2"
            >
              <span>💬</span>
              <span>{isKo ? '고객 지원 1:1 이메일 문의' : 'Contact Customer Support'}</span>
            </a>
            <button
              type="button"
              onClick={() => navigateTo('/')}
              className={`px-6 py-3.5 font-bold text-xs rounded-2xl border transition-all active:scale-[0.97] cursor-pointer ${
                isNight ? 'bg-white/5 hover:bg-white/10 text-white border-white/10' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 border-zinc-300'
              }`}
            >
              {isKo ? '🏠 메인 랜딩으로 이동' : 'Back to Main Landing'}
            </button>
          </div>
        </div>

      </main>

      {/* --- FOOTER --- */}
      <footer className={`py-12 border-t ${isNight ? 'border-white/5 bg-black/30 text-zinc-400' : 'border-zinc-200 bg-white text-zinc-600'} px-6 transition-colors mt-20`}>
        <div className="max-w-7xl mx-auto flex flex-col gap-6 items-center text-center">
          <div className="text-xs space-y-1.5 font-medium max-w-3xl opacity-80">
            <p className="font-bold text-sm mb-1">
              {isKo ? '사업자 정보' : 'Business Information'}
            </p>
            <div className="flex flex-wrap justify-center gap-x-6 gap-y-1.5 text-xs">
              <span><strong>{isKo ? '상호명:' : 'Company:'}</strong> 채키 AI (Chekki AI)</span>
              <span><strong>{isKo ? '대표자:' : 'Representative:'}</strong> Benjamin Jason</span>
              <span><strong>{isKo ? '사업자등록번호:' : 'Biz Reg No:'}</strong> 814-14-03096</span>
              <span><strong>{isKo ? '고객센터:' : 'Email:'}</strong> support@chekkiai.com</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-xs font-black tracking-wider uppercase">
            <button onClick={() => navigateTo('/')} className="hover:text-orange-500 transition-colors">
              {isKo ? '메인 서비스' : 'Main Service'}
            </button>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <button onClick={() => navigateTo('/privacy')} className="hover:text-orange-500 transition-colors">
              {isKo ? '개인정보처리방침' : 'Privacy Policy'}
            </button>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <button onClick={() => navigateTo('/terms')} className="hover:text-orange-500 transition-colors">
              {isKo ? '이용약관' : 'Terms of Service'}
            </button>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <button onClick={() => navigateTo('/refund')} className="hover:text-orange-500 transition-colors">
              {isKo ? '환불정책' : 'Refund Policy'}
            </button>
            <span className={isNight ? 'text-zinc-800' : 'text-zinc-300'}>|</span>
            <button onClick={() => navigateTo('/support')} className="hover:text-orange-500 transition-colors">
              {isKo ? '고객지원' : 'Customer Support'}
            </button>
          </div>

          <p className="text-xs text-zinc-500 font-medium pt-2">
            © {new Date().getFullYear()} ChekkiAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
