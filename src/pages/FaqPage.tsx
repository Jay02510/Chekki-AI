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
import { FAQ_DATA } from '../data/faq';
import { langPath, switchLang, urlLang } from '../lib/lang';

interface Props {
  isNight?: boolean;
  setIsNight?: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function FaqPage({ isNight = true, setIsNight }: Props) {
  const [activeCategory, setActiveCategory] = useState<'all' | 'parent' | 'teacher'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const isKo = urlLang() === 'ko';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLangToggle = () => switchLang(isKo ? 'en' : 'ko');

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
    window.history.pushState({}, '', langPath(path));
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
              <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center text-black font-bold text-lg shadow-md shadow-orange-500/30">
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
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
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
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
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
                  ? 'bg-orange-500 text-black shadow-lg shadow-orange-500/20' 
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
                      isOpen ? 'rotate-180 bg-orange-500 text-black' : isNight ? 'bg-white/5 text-zinc-400' : 'bg-zinc-100 text-zinc-600'
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
              href="mailto:support@chekkiai.com?subject=[Chekki%20Support]%20Customer%20Inquiry"
              className="px-6 py-3.5 bg-orange-500 hover:bg-orange-600 text-black font-bold text-xs rounded-2xl shadow-xl shadow-orange-500/20 transition-all active:scale-[0.97] cursor-pointer flex items-center gap-2"
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

          <p className="text-xs text-zinc-400 font-medium pt-2">
            © {new Date().getFullYear()} ChekkiAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
