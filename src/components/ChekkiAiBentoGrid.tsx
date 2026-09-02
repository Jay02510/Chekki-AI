import React, { useState } from 'react';
import {
  Sparkle,
  Lightning,
  FilePdf,
  Image as ImageIcon,
  Pulse,
  Heart,
  Camera,
  BookOpen,
  SpeakerHigh,
  ArrowRight,
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
}

export default function ChekkiAiBentoGrid({ isNight = true, isKo = false }: Props) {
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>(isKo ? 'korean' : 'english');

  React.useEffect(() => {
    setActiveTab(isKo ? 'korean' : 'english');
  }, [isKo]);

  return (
    <section id="ai-bento" className={`py-20 md:py-32 pt-28 md:pt-36 scroll-mt-28 px-4 md:px-8 max-w-7xl mx-auto w-full relative transition-colors duration-500 ${
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
        <h2 className={`text-[clamp(2.25rem,4.5vw,4rem)] font-extrabold tracking-tight mb-4 leading-[1.12] ${
          isNight ? 'text-white' : 'text-zinc-900'
        }`}>
          {activeTab === 'korean' ? (
            <>영어 숙제 전쟁은 끝, <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">아이와 함께하는 따뜻한 시간.</span></>
          ) : (
            <>Turn Homework Battles Into <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Bonding Moments.</span></>
          )}
        </h2>

        <p className={`text-base md:text-lg max-w-2xl font-normal leading-relaxed ${
          isNight ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {activeTab === 'korean'
            ? '엄마의 고민과 채키의 솔루션을 카드에서 바로 확인해보세요.'
            : 'See each parent painpoint and how Chekki solves it, right on the card.'}
        </p>
      </div>

      {/* Primary Bento Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        {/* ========================================================================= */}
        {/* LEFT COLUMN (Col 1) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">
          
          {/* 1. End 8 PM Homework War Card (Mom Painpoint 1) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 min-h-[220px] flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-brand-dark group-hover:bg-brand-dark-elevated' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/30 transition-colors pointer-events-none" />
              
              <div>
                <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 mb-3 relative z-10">
                  <Heart size={22} weight="fill" />
                </div>

                <div className="space-y-2 relative z-10">
                  <div>
                    <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block mb-1">
                      {activeTab === 'korean' ? '엄마의 매일 밤 고민' : "Mom's Painpoint"}
                    </span>
                    <h3 className={`text-sm sm:text-base md:text-lg font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {activeTab === 'korean'
                        ? '"8시만 되면 영어 숙제 때문에 아이와 매일 싸우시나요?"'
                        : '"Exhausted by 8 PM homework battles every single night?"'}
                    </h3>
                  </div>

                  <div className={`pt-2 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}>
                    <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                      {activeTab === 'korean' ? '체키의 따뜻한 솔루션' : 'Chekki Solution'}
                    </span>
                    <h3 className={`text-sm sm:text-base font-bold mb-1 leading-snug ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                      {activeTab === 'korean' ? '5초 이내 오답 채점 & 엄마의 칭찬 가이드' : 'Instant AI Grading & Praise Guide'}
                    </h3>
                    <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {activeTab === 'korean'
                        ? '채점의 스트레스는 체키가 맡고, 엄마는 악역 대신 따뜻한 칭찬에만 집중하세요.'
                        : 'Chekki handles grading pressure so parents don\'t have to be the bad cop. Focus 100% on praise.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`pt-3 border-t flex items-center justify-between text-xs font-mono mt-4 relative z-10 ${
                isNight ? 'border-white/5 text-zinc-500' : 'border-zinc-100 text-zinc-400'
              }`}>
                <span>{activeTab === 'korean' ? '체키 핵심 가치' : 'Core Philosophy'}</span>
                <span className="px-2.5 py-1 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-bold text-xs flex items-center gap-1 shadow-md">
                  {activeTab === 'korean' ? '숙제 평화' : 'Peace at Home'} <ArrowRight size={12} weight="bold" />
                </span>
              </div>
            </div>
          </div>

          {/* 2. Heavy Textbook Answer Key Grading Card (Mom Painpoint 2) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 flex flex-col justify-between relative overflow-hidden min-h-[190px] transition-all duration-500 ${
              isNight ? 'bg-brand-dark group-hover:bg-brand-dark-elevated' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 mb-3 relative z-10">
                <Camera size={22} weight="fill" />
              </div>

              <div className="space-y-2 relative z-10">
                <div>
                  <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '엄마의 매일 밤 고민' : "Mom's Painpoint"}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean'
                      ? '"영유/대형학원 두꺼운 정답지 찾느라 매일 1시간씩 쓰시나요?"'
                      : '"Dread spent 1+ hours checking complex academy answer keys?"'}
                  </h3>
                </div>

                <div className={`pt-2 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '체키의 따뜻한 솔루션' : 'Chekki Solution'}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold mb-1 leading-snug ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {activeTab === 'korean' ? '사진 1장이면 끝! 손글씨 위 오답 빨간상자 표시' : 'Instant Snap & Answer Key Sync'}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean'
                      ? '숙제 사진 1장이면 끝. 학원 선생님이 등록한 진짜 정답지와 비교해 오답을 빨간상자로 5초 이내에 표시합니다.'
                      : 'Snap 1 photo of homework. Chekki highlights handwriting errors in seconds, matched against the real answer key.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. NO TYPING / NO PROMPTS NEEDED CARD (Replacing 10-Sec Snap Grade) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 ${
            isNight 
              ? 'bg-gradient-to-b from-orange-600/30 to-purple-900/30 border border-orange-500/30 shadow-2xl' 
              : 'bg-gradient-to-b from-orange-100 to-amber-100 border border-orange-200 shadow-lg'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-5 flex items-center justify-between ${
              isNight ? 'bg-[#0A0710]' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 shrink-0">
                  <Sparkle size={22} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-sm font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '타이핑·질문 작성 0번!' : 'Zero Typing or Prompts'}
                  </h4>
                  <p className={`text-[11px] ${isNight ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {activeTab === 'korean' ? '어려운 프롬프트 없이 사진 1장이면 완료' : 'No complex AI prompts required'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => window.location.href = '#pricing'}
                className="px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-black font-black text-xs shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Camera weight="fill" size={14} />
                {activeTab === 'korean' ? '무료 체험' : 'Try Free'}
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER HERO HUB CARD WITH 3D CHEKKI MASCOT (Cols 2-3, Row-Span 2) */}
        {/* ========================================================================= */}
        <div className={`md:col-span-2 rounded-[2.5rem] p-2 relative overflow-hidden flex flex-col justify-between group transition-all duration-500 ${
          isNight 
            ? 'bg-gradient-to-b from-orange-500/20 via-purple-900/10 to-transparent border border-orange-500/30 shadow-[0_0_50px_rgba(249,115,22,0.15)]' 
            : 'bg-gradient-to-b from-orange-100 via-amber-50 to-white border border-orange-200/80 shadow-2xl shadow-orange-200/50'
        }`}>
          
          {/* Inner Card Double-Bezel */}
          <div className={`rounded-[calc(2.5rem-0.5rem)] p-8 md:p-10 h-full flex flex-col justify-between relative overflow-hidden ${
            isNight ? 'bg-brand-dark' : 'bg-white'
          }`}>
            
            {/* Top Hub Header */}
            <div className="relative z-20 flex justify-between items-start">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                isNight 
                  ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' 
                  : 'bg-orange-100 border-orange-200 text-orange-700'
              }`}>
                <Pulse className="text-orange-500 animate-pulse" size={16} />
                <span>{activeTab === 'korean' ? '체키 엄마표 AI 엔진' : 'Chekki Parent AI Engine'}</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('korean')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'korean' 
                      ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30' 
                      : isNight ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  한국어
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('english')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'english' 
                      ? 'bg-orange-500 text-black shadow-md shadow-orange-500/30' 
                      : isNight ? 'bg-white/5 text-zinc-400 hover:text-white' : 'bg-zinc-100 text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Central Glowing Mascot Character */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center text-center">
              
              {/* Mascot Image with Radial Glow */}
              <div className="relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-70 group-hover:opacity-90 transition-opacity duration-700 animate-pulse ${
                  isNight 
                    ? 'bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600' 
                    : 'bg-gradient-to-tr from-orange-300 via-pink-300 to-purple-300'
                }`} />
                
                <img 
                  src="/assets/chekki-mascot.webp"
                  alt="Chekki Mascot"
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Title & Subtitle inside Hub */}
              <h3 className={`text-2xl md:text-3xl font-black mt-4 mb-2 tracking-tight ${
                isNight ? 'text-white' : 'text-zinc-900'
              }`}>
                {activeTab === 'korean' ? '채점은 체키가, 칭찬은 엄마가' : 'Grading by Chekki, Praise by Mom'}
              </h3>
              <p className={`text-sm max-w-md leading-relaxed ${
                isNight ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {activeTab === 'korean' 
                  ? '사진 한 장이면 손글씨 오답 채점, 원어민 진짜 발음 듣기, 엄마용 5초 한국어 칭찬 가이드까지 한 번에 해결됩니다.'
                  : 'Snap 1 photo to get red-box autograding, native English voice answers, and warm 5-second Korean coaching tips for moms.'}
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
                <div className="w-8 h-8 rounded-xl bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0">
                  <BookOpen size={18} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '엄마용 5초 칭찬 가이드' : "Mom's Praise Guide"}
                  </h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {activeTab === 'korean' ? '따뜻한 한국어 코칭 답변' : 'Warm Korean coaching script'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isNight 
                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' 
                  : 'bg-zinc-50 border-zinc-200/60 hover:bg-indigo-50/50'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500 shrink-0">
                  <SpeakerHigh size={18} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '원어민 100% 음성 듣기' : 'Native English Voice'}
                  </h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {activeTab === 'korean' ? '정확한 원어민 발음 재생' : 'Real native English speech'}
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (Col 4) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">

          {/* 1. Mom's Script Toggle Card (Mom Painpoint 3) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/40' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-5 flex flex-col justify-between min-h-[140px] relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-brand-dark group-hover:bg-brand-dark-elevated' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block mb-2 relative z-10">
                {activeTab === 'korean' ? '엄마의 매일 밤 고민' : "Mom's Painpoint"}
              </span>

              <div className="space-y-2 relative z-10">
                <h3 className={`text-xs md:text-sm font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean'
                    ? '"엄마인 내가 영어를 못해서 아이 발음이나 정답 지도하기 불안하신가요?"'
                    : '"Fear your own English accent will ruin your child\'s phonics?"'}
                </h3>

                <div className={`pt-2 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '체키의 따뜻한 솔루션' : 'Chekki Solution'}
                  </span>
                  <h3 className={`text-xs sm:text-sm font-bold mb-1 leading-snug ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {activeTab === 'korean' ? '원어민 100% 생생한 발음 & 엄마용 5초 한국어 가이드' : 'Native English Voice & Instant Mom Script'}
                  </h3>
                  <p className={`text-[11px] leading-snug ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean'
                      ? '생생한 원어민 음성으로 정답과 단어를 들려주고, 체키가 알려주는 한국어 칭찬 문장만 아이에게 읽어주세요.'
                      : 'Play crisp native audio for any word while reading Chekki\'s warm Korean praise script.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Homework Arguments & Rescan Mastery Card (Mom Painpoint 4) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-emerald-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-emerald-500/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 relative overflow-hidden flex flex-col justify-between min-h-[175px] transition-all duration-500 ${
              isNight ? 'bg-brand-dark group-hover:bg-[#06140A]' : 'bg-white group-hover:bg-emerald-50/40'
            }`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 mb-3 relative z-10">
                <Lightning size={22} weight="fill" />
              </div>

              <div className="space-y-2 relative z-10">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '엄마의 매일 밤 고민' : "Mom's Painpoint"}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean'
                      ? '"틀린 문제 다시 풀라고 하면 아이가 울고 떼쓰나요?"'
                      : '"Frustrated by tears and arguments when fixing wrong answers?"'}
                  </h3>
                </div>

                <div className={`pt-2 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '체키의 따뜻한 솔루션' : 'Chekki Solution'}
                  </span>
                  <h3 className={`text-sm sm:text-base font-bold mb-1 leading-snug ${isNight ? 'text-emerald-300' : 'text-emerald-700'}`}>
                    {activeTab === 'korean' ? '⚡ 2차 재도전 스캔으로 100점 마스터' : '⚡ 2nd Rescan & Mastery'}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean'
                      ? '엄마의 5초 코칭 가이드 후 아이가 직접 고쳐 써서 재스캔하면, 눈물 없이 100점 마스터 성공!'
                      : 'Mom shares a 5-sec coaching tip, child fixes the paper, rescans, and achieves 100% Mastery without tears.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Phonics & Custom Worksheets Card (Mom Painpoint 5) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 flex-1 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/40' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-brand-dark group-hover:bg-brand-dark-elevated' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="space-y-2 relative z-10">
                <div>
                  <span className="text-[10px] font-extrabold text-orange-500 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '엄마의 매일 밤 고민' : "Mom's Painpoint"}
                  </span>
                  <h4 className={`text-xs sm:text-sm font-bold mb-1 leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '"우리 아이 틀린 어휘 맞춤 복습 프린트를 찾아 헤매시나요?"' : '"Searching endlessly for extra practice worksheets for weak phonics?"'}
                  </h4>
                  <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {activeTab === 'korean' ? '학원 교재 어휘 & 오답 100% 자동 연동' : 'Academy curriculum & error sync.'}
                  </p>
                </div>

                <div className={`pt-2 border-t ${isNight ? 'border-white/5' : 'border-zinc-100'}`}>
                  <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '체키의 따뜻한 솔루션' : 'Chekki Solution'}
                  </span>
                  <h3 className={`text-xs sm:text-sm font-bold mb-1 leading-snug ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {activeTab === 'korean' ? '1클릭 맞춤형 PDF 학습지 출력' : '1-Click Custom PDF Printable Worksheets'}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean'
                      ? '아이의 오답 패턴을 기반으로 즉시 인쇄 가능한 맞춤형 PDF 학습지를 자동 생성합니다.'
                      : 'Instantly export clean, academy-ready phonics & mistake review worksheets for home practice.'}
                  </p>
                </div>
              </div>

              {/* Floating Pills & Badges */}
              <div className="flex flex-wrap gap-2 py-2 mt-auto relative z-10">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                  isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  <Heart size={12} weight="fill" />
                  {activeTab === 'korean' ? '엄마표 영어' : "Mom's English"}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  isNight ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {activeTab === 'korean' ? '원어민 100% 음성' : 'Native Audio'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border ${
                  isNight ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <FilePdf size={12} className="text-red-500" /> .PDF
                </span>
                <span className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border ${
                  isNight ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <ImageIcon size={12} className="text-blue-500" /> {activeTab === 'korean' ? '1클릭 출력' : 'Print Ready'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
