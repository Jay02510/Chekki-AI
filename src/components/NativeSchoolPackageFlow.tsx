import React, { useState } from 'react';
import {
  BookOpen,
  Sparkle,
  CheckCircle,
  Lightning,
  WarningCircle
} from '@phosphor-icons/react';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
}

export const NativeSchoolPackageFlow: React.FC<Props> = ({ isNight = true, isKo = true }) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  // Step 1 State: Upload & AI Categorization
  const [isScanning, setIsScanning] = useState(false);

  // Step 2 State: Active Unit in Teacher Dashboard
  const [selectedUnit, setSelectedUnit] = useState<number>(4);

  // Step 3 State: Selected Student Mistake Radar
  const [selectedStudent, setSelectedStudent] = useState<'jihoo' | 'minjun'>('jihoo');

  return (
    <div className={`p-6 md:p-8 rounded-3xl border shadow-2xl transition-all font-sans ${
      isNight ? 'bg-[#060609] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900 shadow-xl'
    }`}>
      {/* HEADER & STEP WIZARD NAVIGATION */}
      <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
        <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-mono font-black uppercase tracking-widest rounded-full inline-block">
          {isKo ? '체키 스쿨 프로 • 3단계 워크플로우' : 'CHEKKI SCHOOL PACKAGE • 3-STEP FLOW'}
        </span>
        <h3 className={`font-display text-xl sm:text-2xl font-black ${isNight ? 'text-white' : 'text-zinc-900'}`}>
          {isKo ? '교재 목차 선제 탑재 ➔ 교사 대시보드 ➔ 학부모 앱 오답 레이더' : 'Textbook Seeding ➔ Teacher Dashboard ➔ Mom App Mistake Radar'}
        </h3>
        <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
          {isKo 
            ? '아래 3개 단계를 클릭하여 교재 목차 탑재, 교사 대시보드 자동 채우기, 학부모 앱 오답 수집을 실시간으로 체험해보세요.' 
            : 'Click any step below to see how syllabus uploads, teacher dashboard auto-population, and mom app mistake callouts work together.'}
        </p>
      </div>

      {/* 3 STEP TABS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
        {/* STEP 1 TAB */}
        <button
          type="button"
          onClick={() => setActiveStep(1)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
            activeStep === 1
              ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
              : isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
              activeStep === 1 ? 'bg-orange-500 text-white' : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
            }`}>
              STEP 01
            </span>
            <span className="text-sm">📸</span>
          </div>
          <h4 className="font-bold text-xs sm:text-sm">{isKo ? '1. 교재 목차 & 숙제 AI 스캔' : '1. Syllabus & Homework AI Scan'}</h4>
          <p className={`text-[11px] ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo ? '교재 목차 스캔 시 AI가 타겟 어휘 & 정답지를 선제 탑재' : 'Teachers upload syllabus/homework; AI populates vocab & answer keys.'}
          </p>
        </button>

        {/* STEP 2 TAB */}
        <button
          type="button"
          onClick={() => setActiveStep(2)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
            activeStep === 2
              ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
              : isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
              activeStep === 2 ? 'bg-orange-500 text-white' : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
            }`}>
              STEP 02
            </span>
            <span className="text-sm">📊</span>
          </div>
          <h4 className="font-bold text-xs sm:text-sm">{isKo ? '2. 교사 대시보드 자동 채우기' : '2. Teacher Dashboard Sync'}</h4>
          <p className={`text-[11px] ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo ? '선제 탑재된 어휘 데이터가 학급 대시보드에 자동 반영' : 'Pre-seeded data automatically fills class rosters & active unit keys.'}
          </p>
        </button>

        {/* STEP 3 TAB */}
        <button
          type="button"
          onClick={() => setActiveStep(3)}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
            activeStep === 3
              ? 'bg-orange-500/15 border-orange-500 shadow-lg shadow-orange-500/10 scale-[1.02]'
              : isNight ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-black uppercase ${
              activeStep === 3 ? 'bg-orange-500 text-white' : isNight ? 'bg-white/10 text-zinc-400' : 'bg-zinc-200 text-zinc-700'
            }`}>
              STEP 03
            </span>
            <span className="text-sm">🚨</span>
          </div>
          <h4 className="font-bold text-xs sm:text-sm">{isKo ? '3. 학부모 앱 오답 수집 레이더' : '3. Mom App Mistake Sync'}</h4>
          <p className={`text-[11px] ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
            {isKo ? '학부모 앱에서 스캔된 오답을 선생님 레이더에서 실시간 확인' : 'Teachers view student homework mistakes highlighted from Mom App.'}
          </p>
        </button>
      </div>

      {/* ACTIVE STEP CONTENT */}
      <div className="mt-4">
        {/* STEP 1: Upload Syllabus/Homework ➔ AI Categorization */}
        {activeStep === 1 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Left: Upload Simulator */}
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${
              isNight ? 'bg-[#030305] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div>
                <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block mb-2">
                  IMAGE / PDF UPLOADER
                </span>
                <h4 className="font-bold text-base mb-2">Scan Textbook Syllabus or Unit Page</h4>
                <p className={`text-xs mb-6 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                  Snap 1 photo of your textbook contents page. Chekki AI Vision extracts all topics, target vocabulary, and answer key structures automatically.
                </p>

                <div className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                  isScanning ? 'border-orange-500 bg-orange-500/10 animate-pulse' : isNight ? 'border-white/20 bg-white/5' : 'border-zinc-300 bg-white'
                }`}>
                  {isScanning ? (
                    <div className="py-4 space-y-2">
                      <Sparkle size={32} className="mx-auto text-orange-500 animate-spin" />
                      <p className="text-xs font-bold text-orange-400">AI Vision Extracting Vocabulary & Answer Keys...</p>
                    </div>
                  ) : (
                    <div className="py-4 space-y-3">
                      <BookOpen size={36} className="mx-auto text-orange-500" />
                      <p className="text-xs font-bold">Uploaded: Bricks Reading 150 (Book 1) Syllabus.pdf</p>
                      <button
                        type="button"
                        onClick={() => {
                          setIsScanning(true);
                          setTimeout(() => {
                            setIsScanning(false);
                          }, 1200);
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <Lightning size={14} weight="fill" />
                        <span>Re-Scan Syllabus Photo</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between text-[11px] text-emerald-400 font-mono">
                <span className="flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  <span>OCR Accuracy: 99.9%</span>
                </span>
                <span>Auto-categorized into 4 Units</span>
              </div>
            </div>

            {/* Right: AI Categorized Output Categories */}
            <div className={`p-6 rounded-2xl border space-y-4 ${
              isNight ? 'bg-[#030305] border-white/10' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">
                    AI EXTRACTED CATEGORIES
                  </span>
                  <h4 className="font-bold text-sm">Unit 4: Photosynthesis & Plants</h4>
                </div>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold">
                  Ready to Sync
                </span>
              </div>

              {/* Category 1: Target Vocabulary */}
              <div className={`p-3 rounded-xl border space-y-1.5 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <span className="text-[10px] font-bold font-mono text-orange-400 uppercase tracking-wider block">
                  🔤 Target Vocabulary Chips (RAG Pre-seeded)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Chloroplast', 'Stomata', 'Glucose', 'Carbon Dioxide', 'Sunlight'].map((word) => (
                    <span key={word} className={`px-2 py-1 rounded-md text-xs font-bold border ${
                      isNight ? 'bg-orange-500/20 text-orange-300 border-orange-500/30' : 'bg-orange-100 text-orange-800 border-orange-200'
                    }`}>
                      {word}
                    </span>
                  ))}
                </div>
              </div>

              {/* Category 2: Phonics & Grammar Rules */}
              <div className={`p-3 rounded-xl border space-y-1.5 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <span className="text-[10px] font-bold font-mono text-purple-400 uppercase tracking-wider block">
                  🔠 Phonics & Grammar Focus
                </span>
                <p className="text-xs font-semibold">Scientific Term Suffixes (-synthesis, -phyll) • Present Tense Science Verbs</p>
              </div>

              {/* Category 3: Answer Key Mapping */}
              <div className={`p-3 rounded-xl border space-y-1.5 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <span className="text-[10px] font-bold font-mono text-cyan-400 uppercase tracking-wider block">
                  📖 Answer Key & Comprehension Checks
                </span>
                <p className="text-xs font-mono text-zinc-400">Q1: Sunlight energy | Q2: Oxygen release | Q3: Root absorption</p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center gap-1.5"
                >
                  <span>Populate Teacher Dashboard →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Live Teacher Dashboard Auto-Population */}
        {activeStep === 2 && (
          <div className={`p-6 rounded-2xl border space-y-6 ${
            isNight ? 'bg-[#030305] border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">
                    LIVE TEACHER DASHBOARD
                  </span>
                </div>
                <h4 className="font-extrabold text-base sm:text-lg">Class 7A Sunshine • Bricks Reading 150</h4>
              </div>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4].map((unit) => (
                  <button
                    key={unit}
                    type="button"
                    onClick={() => setSelectedUnit(unit)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer transition-all ${
                      selectedUnit === unit
                        ? 'bg-orange-500 text-white border-orange-500'
                        : isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-white border-zinc-300 text-zinc-700'
                    }`}
                  >
                    Unit {unit}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Dashboard Col 1: Auto-populated Vocabulary */}
              <div className={`p-4 rounded-xl border space-y-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <span className="text-[10px] font-bold text-orange-400 uppercase font-mono tracking-wider block">
                  📚 Auto-Populated Unit {selectedUnit} Vocab
                </span>
                <ul className="text-xs space-y-1.5 font-bold">
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Chloroplast</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Pre-Seeded</span>
                  </li>
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Stomata</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Pre-Seeded</span>
                  </li>
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Glucose</span>
                    <span className="text-[10px] text-emerald-400 font-mono">100% Pre-Seeded</span>
                  </li>
                </ul>
              </div>

              {/* Dashboard Col 2: Class Student Roster Status */}
              <div className={`p-4 rounded-xl border space-y-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <span className="text-[10px] font-bold text-purple-400 uppercase font-mono tracking-wider block">
                  👥 Class Roster & Sync Status
                </span>
                <ul className="text-xs space-y-1.5 font-medium">
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Min-jun Kim (김민준)</span>
                    <span className="text-[10px] font-bold text-emerald-400">Synced (100%)</span>
                  </li>
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Ji-hoo Lee (이지후)</span>
                    <span className="text-[10px] font-bold text-amber-400">1 Error Flagged</span>
                  </li>
                  <li className="flex justify-between items-center p-2 rounded bg-white/5">
                    <span>Seo-yeon Park (박서연)</span>
                    <span className="text-[10px] font-bold text-emerald-400">Synced (95%)</span>
                  </li>
                </ul>
              </div>

              {/* Dashboard Col 3: Teacher Quick Action */}
              <div className={`p-4 rounded-xl border space-y-3 flex flex-col justify-between ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                <div>
                  <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono tracking-wider block mb-1">
                    ⚡ Teacher Control
                  </span>
                  <p className="text-xs text-zinc-400">
                    Syllabus data is auto-linked to all 12 student accounts via 6-digit class code: <strong className="text-orange-400 font-mono">7A-SEOCHO</strong>.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep(3)}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>View Student Mistake Radar →</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Student Homework Mistake Radar (Mom App Sync) */}
        {activeStep === 3 && (
          <div className={`p-6 rounded-2xl border space-y-6 ${
            isNight ? 'bg-[#030305] border-white/10' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-mono font-bold text-orange-500 uppercase tracking-widest block">
                  MOM APP HOMEWORK MISTAKE RADAR
                </span>
                <h4 className="font-extrabold text-base sm:text-lg">Real-Time Student Homework Scans</h4>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedStudent('jihoo')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    selectedStudent === 'jihoo' ? 'bg-amber-500 text-black border-amber-500' : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Ji-hoo Lee (Flagged Error)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudent('minjun')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border cursor-pointer ${
                    selectedStudent === 'minjun' ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-white/5 border-white/10 text-zinc-400'
                  }`}
                >
                  Min-jun Kim (100%)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              {/* Left: Homework Scan Paper Preview with AI Error Overlay */}
              <div className={`p-5 rounded-2xl border space-y-3 relative overflow-hidden ${
                isNight ? 'bg-[#0a0a0f] border-amber-500/30' : 'bg-white border-amber-300'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                    Mom App Scan: {selectedStudent === 'jihoo' ? 'Ji-hoo Lee (이지후)' : 'Min-jun Kim (김민준)'}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                    selectedStudent === 'jihoo' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {selectedStudent === 'jihoo' ? '88/100 • 2nd Rescan Pending' : '100/100 • Mastered'}
                  </span>
                </div>

                {/* Simulated Scanned Sheet */}
                <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-mono space-y-3 relative">
                  <div>
                    <p className="text-zinc-500">Unit 4: Photosynthesis Question 1</p>
                    <p className="text-zinc-200">Q: What organelle absorbs sunlight in plant leaves?</p>
                    {selectedStudent === 'jihoo' ? (
                      <div className="mt-1 p-2 rounded border border-amber-500/50 bg-amber-500/10 text-amber-300 flex items-center justify-between">
                        <span>Student wrote: <strong className="line-through">Cloroplast</strong> ➔ Correction: <strong>Chloroplast</strong></span>
                        <WarningCircle size={16} className="text-amber-400 flex-shrink-0" />
                      </div>
                    ) : (
                      <div className="mt-1 p-2 rounded border border-emerald-500/50 bg-emerald-500/10 text-emerald-300 flex items-center justify-between">
                        <span>Student wrote: <strong>Chloroplast</strong></span>
                        <CheckCircle size={16} className="text-emerald-400 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right: Teacher Actions & Mom Feedback Preview */}
              <div className="space-y-4">
                <div className={`p-4 rounded-xl border space-y-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-orange-400 uppercase tracking-wider block">
                    💬 Synchronized Parent Coaching Tip
                  </span>
                  <p className="text-xs text-zinc-300 italic">
                    "{selectedStudent === 'jihoo' 
                      ? '지후가 Chloroplast의 h 철자를 살짝 놓쳤어요! 엄마가 "지후야 5초만 같이 읽어볼까?" 하고 칭찬 후 2차 재도전 올려주시면 바로 100점으로 업데이트됩니다.' 
                      : '민준이가 Unit 4 핵심 어휘 5개를 모두 정확히 작성했습니다! 최고의 집중력입니다.'}"
                  </p>
                </div>

                <div className={`p-4 rounded-xl border space-y-2 ${isNight ? 'bg-white/5 border-white/10' : 'bg-white border-zinc-200'}`}>
                  <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider block">
                    📞 Teacher 1:1 Consultation Note
                  </span>
                  <p className="text-xs text-zinc-400">
                    Auto-flagged for phone consultation prep if 2nd rescan is missed. 1-Click copy available for KakaoTalk.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
