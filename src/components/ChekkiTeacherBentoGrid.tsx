import React, { useState } from 'react';
import {
  Sparkle,
  Pulse,
  GraduationCap,
  Users,
  ChartBar,
  FileText,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
}

export default function ChekkiTeacherBentoGrid({ isNight = true, isKo = true }: Props) {
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>(isKo ? 'korean' : 'english');

  React.useEffect(() => {
    setActiveTab(isKo ? 'korean' : 'english');
  }, [isKo]);

  return (
    <section id="teacher-bento" className={`py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto w-full relative transition-colors duration-500 ${
      isNight ? 'bg-transparent text-white' : 'bg-transparent text-slate-900'
    }`}>
      {/* Background Ambient Glows */}
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-[900px] aspect-square rounded-full blur-[140px] pointer-events-none z-0 ${
        isNight 
          ? 'bg-gradient-to-tr from-orange-500/20 via-pink-600/10 to-amber-500/15' 
          : 'bg-gradient-to-tr from-orange-200/40 via-pink-200/30 to-amber-200/40'
      }`} />

      {/* Section Header */}
      <div className="relative z-10 mb-16 flex flex-col items-center text-center">
        <h2 className={`text-[clamp(2.5rem,5vw,4.5rem)] font-bold tracking-tight mb-4 leading-[1.08] ${
          isNight ? 'text-white' : 'text-zinc-900'
        }`}>
          {activeTab === 'korean' ? (
            <>선생님의 행정 부담은 줄이고, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">학부모 피드백은 100% 정밀하게.</span></>
          ) : (
            <>Eliminate Teacher Admin Stress <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-amber-400 bg-clip-text text-transparent">With Precision AI Dashboards.</span></>
          )}
        </h2>

        <p className={`text-base md:text-lg max-w-2xl font-normal leading-relaxed ${
          isNight ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {activeTab === 'korean'
            ? '카드를 마우스로 올려 선생님의 대표적인 고충을 해결하는 채키의 자동화 솔루션을 확인해보세요.'
            : 'Hover over any card below to see how Chekki solves top teacher painpoints.'}
        </p>
      </div>

      {/* Primary Bento Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        {/* ========================================================================= */}
        {/* LEFT COLUMN (Col 1) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">
          
          {/* 1. 6-Digit Join Code & Auto-Sync Card (Teacher Painpoint 1) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-purple-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-purple-500/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0F0814]' : 'bg-white group-hover:bg-purple-50/40'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[40px] group-hover:bg-purple-500/30 transition-colors" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                    <Users size={22} weight="bold" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    isNight 
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                      : 'bg-purple-100 text-purple-700 border-purple-200'
                  }`}>
                    Hover Solution
                  </span>
                </div>

                {/* Default Teacher Painpoint */}
                <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`text-base font-bold mb-2 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' 
                      ? '"매일 학생별 숙제 제출 여부를 일일이 확인하고 카톡으로 챙기느라 지치셨나요?"' 
                      : '"Tired of chasing parents individually or collecting paper folders to check daily home homework?"'}
                  </h3>
                </div>

                {/* Hover Reveal Solution */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 absolute inset-x-6 top-16">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                  <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-purple-300' : 'text-purple-600'}`}>
                    {activeTab === 'korean' ? '6자리 학급 코드 & 실시간 자동 연동' : '6-Digit Join Code & Silent Auto-Sync'}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean' 
                      ? '가정에서 6자리 코드로 스캔한 빨간 테두리 오답과 점수가 교사 대시보드로 실시간 자동 수집됩니다.'
                      : 'Parents enter a 6-letter class code once. Homework scans & mistake data silently sync straight to your dashboard.'}
                  </p>
                </div>

                {/* Dashboard UI Screenshot Image */}
                <div className="mt-4 w-full rounded-2xl overflow-hidden p-1 flex justify-center items-center">
                  <img 
                    src={isNight ? "/assets/schools/schools_bento_join_code.png" : "/assets/schools/schools_bento_join_code_light.png"} 
                    alt="Class join code entry UI" 
                    className="w-full max-w-[240px] h-auto object-contain rounded-xl filter drop-shadow-md group-hover:scale-105 transition-transform" 
                  />
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between text-xs font-mono mt-4 ${
                isNight ? 'border-white/5 text-zinc-500' : 'border-zinc-100 text-zinc-400'
              }`}>
                <span>Sync Protocol</span>
                <span className="text-purple-500 font-semibold flex items-center gap-1">
                  Instant Auto-Sync <ArrowRight size={12} />
                </span>
              </div>
            </div>
          </div>

          {/* 2. Instant OCR & Ground Truth Key (Teacher Painpoint 2) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 flex flex-col justify-between relative overflow-hidden h-full ${
              isNight ? 'bg-[#050505]' : 'bg-white'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                  <ShieldCheck size={22} weight="bold" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                  isNight ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Hover Solution
                </span>
              </div>

              {/* Default Teacher Painpoint */}
              <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean'
                    ? '"일반 AI 오답 환각 오류로 학부모 항의를 받으실까 걱정되시나요?"'
                    : '"Worried about AI OCR hallucinations misgrading student handwriting and upsetting parents?"'}
                </h3>
              </div>

              {/* Hover Solution */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 absolute inset-x-6 top-16">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                  {activeTab === 'korean' ? '교재 정답지 연동으로 AI 환각 100% 제거' : 'Ground-Truth Answer Keys (99.9% Precision)'}
                </h3>
                <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeTab === 'korean'
                    ? '학원 교재 정답 데이터와 연동하여 오답 판별 오류 없는 99.9% 정밀 채점 기준을 제공합니다.'
                    : 'Evaluates scans against your exact answer key, completely eliminating false OCR errors and building trust.'}
                </p>
              </div>

              <div className="mt-4 p-3.5 rounded-2xl bg-orange-500/15 border-2 border-orange-500/40 text-orange-400 font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-orange-500/10">
                <Sparkle size={20} weight="fill" className="text-orange-400 shrink-0 animate-pulse" />
                <span>{activeTab === 'korean' ? '교재 정답지 연동으로 AI 환각 100% 제거' : 'Ground-truth answer keys eliminate AI hallucination'}</span>
              </div>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER HERO HUB CARD (Cols 2-3, Row-Span 2) */}
        {/* ========================================================================= */}
        <div className={`md:col-span-2 rounded-[2.5rem] p-2 relative overflow-hidden flex flex-col justify-between group transition-all duration-500 ${
          isNight 
            ? 'bg-gradient-to-b from-orange-500/20 via-purple-900/10 to-transparent border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.15)]' 
            : 'bg-gradient-to-b from-orange-100 via-amber-50 to-white border border-orange-200/80 shadow-2xl shadow-orange-200/50'
        }`}>
          
          {/* Inner Card Double-Bezel */}
          <div className={`rounded-[calc(2.5rem-0.5rem)] p-8 md:p-10 h-full flex flex-col justify-between relative overflow-hidden ${
            isNight ? 'bg-[#050505]' : 'bg-white'
          }`}>
            
            {/* Top Hub Header */}
            <div className="relative z-20 flex justify-between items-start">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                isNight 
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' 
                  : 'bg-orange-100 border-orange-200 text-orange-700'
              }`}>
                <Pulse className="text-orange-500 animate-pulse" size={16} />
                <span>Teacher Engine</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('korean')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'korean' 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                      : isNight ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  한국어
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('english')}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === 'english' 
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/30' 
                      : isNight ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Central Mascot Image */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center text-center">
              
              <div className="relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-70 group-hover:opacity-90 transition-opacity duration-700 animate-pulse ${
                  isNight 
                    ? 'bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600' 
                    : 'bg-gradient-to-tr from-orange-300 via-pink-300 to-purple-300'
                }`} />
                
                <img 
                  src="https://res.cloudinary.com/dginphpy4/image/upload/e_background_removal,f_png/v1771383933/Chekki_Futuristic_Background_i8foqe.png" 
                  alt="Chekki Teacher Mascot" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              <h3 className={`text-2xl md:text-3xl font-extrabold mt-4 mb-2 tracking-tight ${
                isNight ? 'text-white' : 'text-zinc-900'
              }`}>
                {activeTab === 'korean' ? '선생님의 평가는 더 섬세하게, 학부모 피드백은 더 정확하게' : 'Precision AI Grading & Parent Sync'}
              </h3>
              <p className={`text-sm max-w-sm leading-relaxed ${
                isNight ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {activeTab === 'korean' 
                  ? '학원 전용 6자리 커스텀 코드, 수동 행정 업무 90% 감소, 자동 학부모 리포트 생성.'
                  : 'Reduces teacher admin work by 90% and keeps parents engaged with automated progress cards.'}
              </p>
            </div>

            {/* Bottom Connector Nodes */}
            <div className={`relative z-20 pt-6 border-t grid grid-cols-2 gap-4 ${
              isNight ? 'border-orange-500/20' : 'border-zinc-100'
            }`}>
              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isNight 
                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' 
                  : 'bg-zinc-50 border-zinc-200/60 hover:bg-orange-50/50'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <GraduationCap size={18} weight="bold" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>Weekly Seeding</h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>Target Vocabulary</p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isNight 
                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' 
                  : 'bg-zinc-50 border-zinc-200/60 hover:bg-indigo-50/50'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <FileText size={18} weight="bold" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>1-Click PDF</h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>Parent Report Cards</p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (Col 4) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">

          {/* 1. Weekly Curriculum AI Auto-Fill Card (Teacher Painpoint 3) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0F0814]' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div>
                <div className="flex justify-between items-center mb-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                    <GraduationCap size={22} weight="bold" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                    isNight ? 'bg-orange-500/20 text-orange-300' : 'bg-orange-100 text-orange-700'
                  }`}>
                    Hover Solution
                  </span>
                </div>

                {/* Default Teacher Painpoint */}
                <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                  <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' 
                      ? '"매주 학급별 주간 단어, 파닉스, 정답지를 일일이 타이핑하느라 야근하시나요?"' 
                      : '"Exhausted by typing weekly active vocabulary lists, phonics targets, and answer keys for every class?"'}
                  </h3>
                </div>

                {/* Hover Solution */}
                <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 absolute inset-x-6 top-16">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                  <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {activeTab === 'korean' ? '3초 교재 AI 자동 등록' : '3-Sec AI Curriculum Seeding'}
                  </h3>
                  <p className={`text-xs leading-relaxed mb-3 ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean' 
                      ? '교재 PDF나 사진을 드롭하면 AI가 단어, 파닉스 규칙, 정답지를 3초 만에 자동 채워줍니다.'
                      : 'Drop a textbook photo or PDF. AI extracts target words, phonics rules & answer keys in 3 seconds.'}
                  </p>
                </div>
              </div>

              <div className="w-full rounded-2xl overflow-hidden p-1 flex justify-center items-center mt-4">
                <img 
                  src={isNight ? "/assets/schools/schools_bento_curriculum.png" : "/assets/schools/schools_bento_curriculum_light.png"} 
                  alt="Curriculum seeding interface" 
                  className="w-full max-w-[240px] h-auto object-contain rounded-xl filter drop-shadow-md group-hover:scale-105 transition-transform" 
                />
              </div>
            </div>
          </div>

          {/* 2. Visibility Beyond the Classroom Card (Teacher Painpoint 4) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-indigo-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-indigo-500/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 relative overflow-hidden flex flex-col justify-between transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0A0714]' : 'bg-white group-hover:bg-indigo-50/40'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <ChartBar size={22} weight="bold" />
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                  isNight ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  Hover Solution
                </span>
              </div>

              {/* Default Teacher Painpoint */}
              <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">Teacher Painpoint</span>
                <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' 
                    ? '"아이들이 집에서 혼자 숙제할 때 어떤 파닉스와 단어에서 막히는지 파악하기 어려우셨나요?"' 
                    : '"Blind to where students struggle during home practice until weekly test day?"'}
                </h3>
              </div>

              {/* Hover Solution */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 absolute inset-x-6 top-16">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                <h3 className={`text-base font-bold mb-1 ${isNight ? 'text-indigo-300' : 'text-indigo-600'}`}>
                  {activeTab === 'korean' ? '교실 밖 학습 진단 대시보드' : 'Classroom Diagnostics Beyond the Wall'}
                </h3>
                <p className={`text-xs leading-relaxed mb-3 ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeTab === 'korean' 
                    ? '가정 스캔 데이터를 분석하여 다음 수업에 보강해야 할 파닉스 규칙과 취약 단어를 미리 집어냅니다.'
                    : 'Track home scan difficulty rates to pinpoint key phonics rules and vocabulary items for your next lesson.'}
                </p>
              </div>

              <div className="w-full rounded-2xl overflow-hidden p-1 flex justify-center items-center mt-4">
                <img 
                  src={isNight ? "/assets/schools/schools_bento_diagnostics.png" : "/assets/schools/schools_bento_diagnostics_light.png"} 
                  alt="Classroom diagnostics dashboard" 
                  className="w-full max-w-[240px] h-auto object-contain rounded-xl filter drop-shadow-md group-hover:scale-105 transition-transform" 
                />
              </div>
            </div>
          </div>

          {/* 3. 1-Click Parent Growth Reports Card (Teacher Painpoint 5) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-gradient-to-b from-pink-600/30 to-purple-900/30 border border-pink-500/30 shadow-2xl' 
              : 'bg-gradient-to-b from-pink-100 to-amber-100 border border-pink-200 shadow-lg'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-5 flex flex-col justify-between relative overflow-hidden ${
              isNight ? 'bg-[#0A0710]' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-pink-500 uppercase tracking-widest block">Teacher Painpoint</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                  isNight ? 'bg-pink-500/20 text-pink-300 border-pink-500/30' : 'bg-pink-100 text-pink-700'
                }`}>
                  Hover Solution
                </span>
              </div>

              {/* Default Teacher Painpoint */}
              <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                <h4 className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' 
                    ? '"매월 학부모 평가서 작성에 10시간 넘는 행정 시간을 쓰느라 스트레스 받으시나요?"' 
                    : '"Dread spending 5-10+ hours every month writing manual parent evaluation report cards?"'}
                </h4>
              </div>

              {/* Hover Solution */}
              <div className="opacity-0 group-hover:opacity-100 transition-all duration-500 absolute inset-x-5 top-8">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">Chekki Solution</span>
                <h3 className={`text-xs font-bold mb-1 ${isNight ? 'text-pink-400' : 'text-pink-600'}`}>
                  {activeTab === 'korean' ? '1초 학부모 칭찬 & 성장 리포트' : '1-Click Branded PDF Parent Reports'}
                </h3>
                <p className={`text-[11px] leading-snug ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeTab === 'korean' 
                    ? '스캔 데이터를 바탕으로 긍정적 성장 리포트를 1초 만에 자동 생성하여 행정 부담 90% 감소!' 
                    : 'Auto-compiles home scan data into encouraging growth report cards in 1 click, reducing admin work by 90%.'}
                </p>
              </div>

              <div className="w-full rounded-2xl overflow-hidden p-1 flex justify-center items-center mt-4">
                <img 
                  src={isNight ? "/assets/schools/schools_bento_parent_care_dark.png" : "/assets/schools/schools_bento_parent_care_light.png"} 
                  alt="Parent report cards" 
                  className="w-full max-w-[220px] h-auto object-contain rounded-xl filter drop-shadow-md group-hover:scale-105 transition-transform" 
                />
              </div>
              <div className="mt-4 p-3.5 rounded-2xl bg-pink-500/15 border-2 border-pink-500/40 text-pink-400 font-black text-xs sm:text-sm tracking-wide flex items-center gap-2 shadow-lg shadow-pink-500/10">
                <CheckCircle size={20} weight="fill" className="text-pink-400 shrink-0 animate-pulse" />
                <span>{activeTab === 'korean' ? '선생님 행정 잡무 90% 감소 & 원생 재등록률 상승' : 'Reduces teacher admin work by 90% & boosts retention'}</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
