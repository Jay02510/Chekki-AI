import React, { useState } from 'react';
import {
  Sparkle,
  Lightning,
  CheckCircle,
  FilePdf,
  Image as ImageIcon,
  TreeStructure,
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
  const [autoGradeEnabled, setAutoGradeEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState<'korean' | 'english'>(isKo ? 'korean' : 'english');

  React.useEffect(() => {
    setActiveTab(isKo ? 'korean' : 'english');
  }, [isKo]);

  return (
    <section id="ai-bento" className={`py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto w-full relative transition-colors duration-500 ${
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
            <>숙제 전쟁을 <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">칭찬과 교감의 시간으로.</span></>
          ) : (
            <>Turn Homework Battles Into <br className="hidden md:block" />
            <span className="bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Bonding Moments.</span></>
          )}
        </h2>

        <p className={`text-base md:text-lg max-w-2xl font-normal leading-relaxed ${
          isNight ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          {activeTab === 'korean' 
            ? '아래 카드에 마우스를 올리면 체키의 완벽한 솔루션을 확인하실 수 있습니다.'
            : 'Hover over any problem card below to see how Chekki solves it.'}
        </p>
      </div>

      {/* Primary Bento Layout Grid */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">

        {/* ========================================================================= */}
        {/* LEFT COLUMN (Col 1) */}
        {/* ========================================================================= */}
        <div className="flex flex-col gap-4 md:gap-6 md:col-span-1">
          
          {/* 1. End 8 PM Homework War Card (Problem -> Solution Hover Reveal) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 h-full flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0F0814]' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-[40px] group-hover:bg-orange-500/30 transition-colors" />
              
              <div>
                <div className="flex justify-between items-center mb-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 group-hover:scale-110 transition-transform">
                    <Heart size={22} weight="fill" />
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    isNight 
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/30 group-hover:bg-orange-500/40' 
                      : 'bg-orange-100 text-orange-700 border-orange-200 group-hover:bg-orange-200'
                  }`}>
                    {activeTab === 'korean' ? '솔루션 보기' : 'Hover Solution'}
                  </span>
                </div>

                {/* Default Question / Problem */}
                <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2 absolute inset-x-6 top-20">
                  <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '문제 상황' : 'Problem'}
                  </span>
                  <h3 className={`text-lg font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' 
                      ? '"매일 밤 8시, 아이와의 숙제 전쟁에 지치셨나요?"' 
                      : '"Exhausted by 8 PM homework battles every single night?"'}
                  </h3>
                </div>

                {/* Hover Reveal Solution */}
                <div className="opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-500 pt-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    {activeTab === 'korean' ? '체키 솔루션' : 'Chekki Solution'}
                  </span>
                  <h3 className={`text-base font-bold mb-2 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                    {activeTab === 'korean' ? '실시간 손글씨 AI 채점' : 'Instant AI Handwriting Scoring'}
                  </h3>
                  <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    {activeTab === 'korean'
                      ? '체키가 채점 부담을 대신 가져가 부모님은 아이 칭찬과 교감에만 집중할 수 있습니다.'
                      : 'Chekki takes over the grading pressure so parents can focus purely on praise, affection, and bonding.'}
                  </p>
                </div>
              </div>

              <div className={`pt-4 border-t flex items-center justify-between text-xs font-mono mt-24 group-hover:mt-6 transition-all ${
                isNight ? 'border-white/5 text-zinc-500' : 'border-zinc-100 text-zinc-400'
              }`}>
                <span>{activeTab === 'korean' ? '핵심 철학' : 'Core Philosophy'}</span>
                <span className="px-3 py-1.5 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-300 font-black text-sm flex items-center gap-1.5 shadow-md">
                  {activeTab === 'korean' ? '가정의 평화 🕊️' : 'Peace at Home'} <ArrowRight size={14} weight="bold" />
                </span>
              </div>
            </div>
          </div>

          {/* 2. Instant Handwriting OCR Card (Problem -> Solution Hover Reveal) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 flex flex-col justify-between relative overflow-hidden h-full min-h-[180px] transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0F0814]' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="flex justify-between items-center mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                  <Camera size={22} weight="fill" />
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border flex items-center gap-1 ${
                  isNight 
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                    : 'bg-emerald-100 text-emerald-700 border-emerald-200'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeTab === 'korean' ? '솔루션 보기' : 'Hover Solution'}
                </span>
              </div>

              {/* Default Question / Problem */}
              <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest block mb-1">
                  {activeTab === 'korean' ? '문제 상황' : 'Problem'}
                </span>
                <h3 className={`text-base font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' 
                    ? '"수동 채점과 AI 환각 오류에 지치셨나요?"' 
                    : '"Tired of manual grading & OCR errors?"'}
                </h3>
              </div>

              {/* Hover Reveal Solution */}
              <div className="opacity-0 group-hover:opacity-100 absolute inset-x-6 top-16 transition-all duration-500">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  {activeTab === 'korean' ? '체키 솔루션' : 'Chekki Solution'}
                </span>
                <h3 className={`text-sm font-bold mb-1 ${isNight ? 'text-orange-400' : 'text-orange-600'}`}>
                  {activeTab === 'korean' ? '교재 정답지 연동' : 'Ground-Truth Answer Keys'}
                </h3>
                <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeTab === 'korean' 
                    ? '학원 교재 정답 데이터 연동으로 99.9% 정확도를 보장합니다.' 
                    : "Linked to your academy's active textbooks with 99.9% accuracy."}
                </p>
              </div>
            </div>
          </div>

          {/* 3. One-Tap Scan & Grade Action Card */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 ${
            isNight 
              ? 'bg-gradient-to-b from-orange-600/30 to-purple-900/30 border border-orange-500/30 shadow-2xl' 
              : 'bg-gradient-to-b from-orange-100 to-amber-100 border border-orange-200 shadow-lg'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-5 flex items-center justify-between ${
              isNight ? 'bg-[#0A0710]' : 'bg-white'
            }`}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-500">
                  <Lightning size={20} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '10초 자동 채점' : '10-Sec Grade'}
                  </h4>
                  <p className={`text-[11px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {activeTab === 'korean' ? '실시간 손글씨 AI' : 'Instant handwriting AI'}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs shadow-lg shadow-orange-500/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Camera weight="fill" size={14} />
                {activeTab === 'korean' ? '스캔 시작' : 'Scan Page'}
              </button>
            </div>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* CENTER HERO HUB CARD WITH TRANSPARENT CHEKKI MASCOT (Cols 2-3, Row-Span 2) */}
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
                <span>{activeTab === 'korean' ? '체키 코어 엔진' : 'Chekki Core Engine'}</span>
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

            {/* Central Glowing Mascot Character (Chekki with Laptop, Transparent Background) */}
            <div className="relative z-10 my-6 flex flex-col items-center justify-center text-center">
              
              {/* Mascot Image with Radial Glow */}
              <div className="relative w-52 h-52 md:w-60 md:h-60 flex items-center justify-center">
                <div className={`absolute inset-0 rounded-full blur-3xl opacity-70 group-hover:opacity-90 transition-opacity duration-700 animate-pulse ${
                  isNight 
                    ? 'bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600' 
                    : 'bg-gradient-to-tr from-orange-300 via-pink-300 to-purple-300'
                }`} />
                
                <img 
                  src="/assets/schools/chekki_teacher_mascot_transparent.png" 
                  alt="Chekki Mascot holding laptop" 
                  className="w-full h-full object-contain relative z-10 drop-shadow-[0_15px_35px_rgba(249,115,22,0.4)] group-hover:scale-105 transition-transform duration-700"
                />
              </div>

              {/* Title & Subtitle inside Hub */}
              <h3 className={`text-2xl md:text-3xl font-extrabold mt-4 mb-2 tracking-tight ${
                isNight ? 'text-white' : 'text-zinc-900'
              }`}>
                {activeTab === 'korean' ? '채점은 체키가, 칭찬은 엄마가' : 'Grading by Chekki, Praise by Mom'}
              </h3>
              <p className={`text-sm max-w-sm leading-relaxed ${
                isNight ? 'text-zinc-400' : 'text-zinc-600'
              }`}>
                {activeTab === 'korean' 
                  ? '복잡한 영어 유치원 숙제도 AI가 10초 만에 완벽히 채점하고, 엄마를 위한 따뜻한 칭찬 가이드를 제공합니다.'
                  : 'Instant handwriting OCR & smart scoring frees parents to focus purely on encouragement and bonding.'}
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
                  <BookOpen size={18} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '엄마 가이드 스크립트' : "Mom's Script"}
                  </h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {activeTab === 'korean' ? '따뜻한 한국어 칭찬 가이드' : 'Warm Korean guidance'}
                  </p>
                </div>
              </div>

              <div className={`flex items-center gap-3 p-3 rounded-2xl border transition-colors ${
                isNight 
                  ? 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05]' 
                  : 'bg-zinc-50 border-zinc-200/60 hover:bg-indigo-50/50'
              }`}>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-500">
                  <SpeakerHigh size={18} weight="fill" />
                </div>
                <div>
                  <h4 className={`text-xs font-bold ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                    {activeTab === 'korean' ? '파닉스 오디오 코치' : 'Phonics Audio Coach'}
                  </h4>
                  <p className={`text-[10px] ${isNight ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {activeTab === 'korean' ? '원어민 발음 & 음성 체크' : 'Native TTS & speech check'}
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

          {/* 1. Mom's Script Toggle Card (Problem -> Solution Hover Reveal) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/40' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-5 flex flex-col justify-between min-h-[100px] relative overflow-hidden transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0F0814]' : 'bg-white group-hover:bg-orange-50/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-bold block ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' ? '엄마 가이드' : "Mom's Script Guide"}
                </span>
                
                {/* Interactive Toggle Pill */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAutoGradeEnabled(!autoGradeEnabled);
                  }}
                  className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 flex items-center cursor-pointer ${
                    autoGradeEnabled ? 'bg-orange-500 justify-end' : isNight ? 'bg-white/10 justify-start' : 'bg-zinc-200 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md flex items-center justify-center text-[#050505]">
                    <Heart size={10} weight="fill" className={autoGradeEnabled ? 'text-orange-500' : 'text-zinc-400'} />
                  </div>
                </button>
              </div>

              {/* Default Question */}
              <p className={`text-[11px] leading-snug group-hover:opacity-0 transition-opacity ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {activeTab === 'korean' ? '어려운 문법을 어떻게 설명해야 할지 막막하신가요?' : 'Unsure how to teach complex grammar?'}
              </p>

              {/* Hover Solution */}
              <p className="opacity-0 group-hover:opacity-100 absolute inset-x-5 bottom-4 text-[11px] font-medium text-orange-400 leading-snug transition-opacity">
                {activeTab === 'korean' 
                  ? '"우와! 정답을 맞췄네! 같이 소리 내서 읽어볼까?"' 
                  : '"Wow! You found the right answer! Let\'s say it together!"'}
              </p>
            </div>
          </div>

          {/* 2. Automatic ODAP Error Notes Feature Card (Problem -> Solution Hover Reveal) */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 cursor-pointer ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-indigo-500/50' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-indigo-500/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 relative overflow-hidden flex flex-col justify-between min-h-[170px] transition-all duration-500 ${
              isNight ? 'bg-[#050505] group-hover:bg-[#0A0714]' : 'bg-white group-hover:bg-indigo-50/40'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                  <TreeStructure size={22} weight="fill" />
                </div>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase ${
                  isNight ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {activeTab === 'korean' ? '솔루션 보기' : 'Hover Solution'}
                </span>
              </div>

              {/* Default Problem */}
              <div className="transition-all duration-500 group-hover:opacity-0 group-hover:-translate-y-2">
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                  {activeTab === 'korean' ? '문제 상황' : 'Problem'}
                </span>
                <h3 className={`text-base font-bold leading-snug ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' 
                    ? '"손글씨 오답 노트를 직접 쓰기 번거로우신가요?"' 
                    : '"Rewriting mistake notes by hand?"'}
                </h3>
              </div>

              {/* Hover Solution */}
              <div className="opacity-0 group-hover:opacity-100 absolute inset-x-6 top-16 transition-all duration-500">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                  {activeTab === 'korean' ? '체키 솔루션' : 'Chekki Solution'}
                </span>
                <h3 className={`text-sm font-bold mb-1 ${isNight ? 'text-indigo-300' : 'text-indigo-700'}`}>
                  {activeTab === 'korean' ? '오답 플래시카드 자동 생성' : 'Auto-ODAP Flashcards'}
                </h3>
                <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeTab === 'korean' 
                    ? '자주 틀리는 오답 패턴만 분리하여 복습용 카드로 자동 추출합니다.' 
                    : 'Isolates mistake patterns into review flashcards instantly.'}
                </p>
              </div>
            </div>
          </div>

          {/* 3. Phonics & Audio Coach Bento Cell */}
          <div className={`rounded-[2.25rem] p-1.5 backdrop-blur-xl group transition-all duration-500 flex-1 ${
            isNight 
              ? 'bg-white/[0.03] border border-white/10 shadow-2xl hover:border-orange-500/40' 
              : 'bg-white border border-zinc-200/90 shadow-xl shadow-zinc-200/40 hover:border-orange-400/50'
          }`}>
            <div className={`rounded-[calc(2.25rem-0.375rem)] p-6 h-full flex flex-col justify-between ${
              isNight ? 'bg-[#050505]' : 'bg-white'
            }`}>
              <div>
                <h4 className={`text-sm font-bold mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  {activeTab === 'korean' ? '파닉스 & 워크시트' : 'Phonics & Worksheets'}
                </h4>
                <p className={`text-xs mb-4 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  {activeTab === 'korean' 
                    ? '영유 & 초등 커리큘럼 템플릿 제공 (폴리, GATE, PSA 준비)' 
                    : 'EK & Elementary curriculum templates (Poly, GATE, PSA ready).'}
                </p>
              </div>

              {/* Floating Pills & Badges */}
              <div className="flex flex-wrap gap-2 py-2">
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 border ${
                  isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/40' : 'bg-orange-100 text-orange-700 border-orange-200'
                }`}>
                  <Heart size={12} weight="fill" />
                  {activeTab === 'korean' ? '엄마표 영어' : "Mom's English"}
                </span>
                <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${
                  isNight ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-100 text-amber-700 border-amber-200'
                }`}>
                  {activeTab === 'korean' ? '파닉스 음성' : 'Phonics TTS'}
                </span>
                <span className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border ${
                  isNight ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <FilePdf size={12} className="text-red-500" /> .PDF
                </span>
                <span className={`px-3 py-1 rounded-lg text-[11px] font-mono flex items-center gap-1 border ${
                  isNight ? 'bg-white/5 text-zinc-300 border-white/10' : 'bg-zinc-100 text-zinc-700 border-zinc-200'
                }`}>
                  <ImageIcon size={12} className="text-blue-500" /> {activeTab === 'korean' ? '출력 가능' : 'Print Ready'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
