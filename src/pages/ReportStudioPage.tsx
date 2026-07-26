import React, { useState } from 'react';
import {
  Sparkle,
  Copy,
  CheckCircle,
  ArrowRight,
  Sun,
  Moon,
  Globe,
  FileText,
  UserCheck,
  Lightning,
  ShareNetwork,
  CaretRight,
  ListChecks,
  WarningCircle,
  Clock,
  CurrencyCircleDollar,
  TrendUp,
  Buildings,
  X,
  PlayCircle,
} from '@phosphor-icons/react';
import { SAMPLE_REPORTS, SampleReport } from '../data/sampleReports';
import { REPORT_TRANSLATIONS } from '../data/reportTranslations';

interface Props {
  isNight?: boolean;
  setIsNight?: (val: boolean) => void;
}

export default function ReportStudioPage({ isNight = true, setIsNight }: Props) {
  const [lang, setLang] = useState<'ko' | 'en'>('ko');
  const [selectedReportId, setSelectedReportId] = useState<string>(SAMPLE_REPORTS[0].id);
  const [customInput, setCustomInput] = useState<string>(SAMPLE_REPORTS[0].rawInput);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showModal, setShowModal] = useState<boolean>(false);

  // ROI Calculator State
  const [ftCount, setFtCount] = useState<number>(3);
  const [studentCount, setStudentCount] = useState<number>(100);

  // Form State (for both embedded & modal forms)
  const [directorName, setDirectorName] = useState('');
  const [academyName, setAcademyName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [location, setLocation] = useState('');
  const [currentMethod, setCurrentMethod] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const t = REPORT_TRANSLATIONS[lang];
  const demoT = t.interactiveDemo;
  const activeReport = SAMPLE_REPORTS.find((r) => r.id === selectedReportId) || SAMPLE_REPORTS[0];

  // ROI Math
  const weeklyHoursSaved = Math.round(ftCount * 3.5);
  const hourlyRateKRW = 15000;
  const monthlyLaborSavingsKRW = weeklyHoursSaved * 4 * hourlyRateKRW;
  const annualLaborSavingsKRW = monthlyLaborSavingsKRW * 12;

  const handleSelectPreset = (report: SampleReport) => {
    setSelectedReportId(report.id);
    setCustomInput(report.rawInput);
  };

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 450);
  };

  const handleCopyKakaoScript = () => {
    const scriptText = `[체키AI 학부모 상담 대본]
학생: ${activeReport.studentNameKo} (${activeReport.studentNameEn}) - ${activeReport.gradeKo}
과목: ${activeReport.subject}
담당: ${activeReport.teacherName}

[1. 인사말]
${activeReport.parentScriptKo.greeting}

[2. 학습 성과]
${activeReport.parentScriptKo.academicProgress}

[3. 수업 태도]
${activeReport.parentScriptKo.behaviorAndAttitude}

[4. 가정 연계 지도]
${activeReport.parentScriptKo.actionItems}

[5. 맺음말]
${activeReport.parentScriptKo.closing}`.trim();

    navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directorName || !academyName || !email || !phone) return;

    setIsSubmitting(true);
    try {
      await fetch('/api/request-school-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          directorName,
          academyName,
          phone,
          email,
          location,
          ftCount,
          studentCount,
          currentMethod,
          preferredTime,
          type: 'report-studio-setup',
        }),
      });
    } catch (err) {
      console.warn('Backend endpoint fallback; proceeding with client success state.');
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  const openOnboardingModal = () => {
    setSubmitted(false);
    setShowModal(true);
  };

  return (
    <div
      className={`min-h-screen ${
        isNight ? 'bg-[#030305] text-zinc-100' : 'bg-[#F8FAFC] text-zinc-900'
      } font-sans transition-colors duration-300 relative overflow-x-hidden flex flex-col`}
    >
      {/* Background Ambient Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Floating Island Pill Navigation */}
      <div className="fixed top-6 left-0 w-full z-50 flex justify-center px-4">
        <header
          className={`flex h-14 items-center gap-4 md:gap-8 px-6 backdrop-blur-2xl border rounded-full shadow-2xl transition-all duration-300 ${
            isNight
              ? 'bg-white/10 border-white/15 text-white shadow-black/40'
              : 'bg-white/90 border-slate-200/90 text-slate-900 shadow-slate-200/60'
          }`}
        >
          {/* Logo */}
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-extrabold text-lg tracking-tight">
              Chekki<span className="text-orange-500">AI</span>
            </span>
            <span
              className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ml-1 ${
                isNight ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30' : 'bg-orange-100 text-orange-700'
              }`}
            >
              B2B System
            </span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold">
            <a href="#video-demo" className="hover:text-orange-500 transition-colors">
              {t.nav.demo}
            </a>
            <a href="#features" className="hover:text-orange-500 transition-colors">
              {t.nav.features}
            </a>
            <a href="#interactive" className="hover:text-orange-500 transition-colors">
              {t.nav.interactive}
            </a>
            <a href="#calculator" className="hover:text-orange-500 transition-colors">
              {t.nav.calculator}
            </a>
            <a href="#onboarding-form" className="hover:text-orange-500 transition-colors">
              {t.nav.onboarding}
            </a>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3 ml-auto">
            {/* Language Toggle */}
            <button
              type="button"
              onClick={() => setLang(lang === 'ko' ? 'en' : 'ko')}
              className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isNight
                  ? 'bg-white/5 border-white/15 text-white/90 hover:bg-white/15'
                  : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
              }`}
            >
              <Globe size={14} weight="bold" className="text-orange-500" />
              <span>{t.nav.language}</span>
            </button>

            {/* Theme Toggle */}
            {setIsNight && (
              <button
                type="button"
                onClick={() => setIsNight(!isNight)}
                className={`p-2 rounded-full border transition-colors cursor-pointer ${
                  isNight
                    ? 'border-white/10 hover:bg-white/10 text-white/70 hover:text-white'
                    : 'border-slate-300 hover:bg-slate-100 text-slate-700 hover:text-slate-900'
                }`}
              >
                {isNight ? <Sun size={16} weight="bold" /> : <Moon size={16} weight="bold" />}
              </button>
            )}

            <button
              type="button"
              onClick={openOnboardingModal}
              className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-full text-xs transition-all shadow-md active:scale-95 cursor-pointer"
            >
              {lang === 'ko' ? '맞춤 구축 신청' : 'Request Setup'}
            </button>
          </div>
        </header>
      </div>

      {/* Main Content Workspace */}
      <main className="pt-28 md:pt-36 pb-20 max-w-7xl mx-auto w-full flex-1 flex flex-col space-y-24 px-4 md:px-8">
        
        {/* ========================================================================= */}
        {/* 1. HERO SECTION */}
        {/* ========================================================================= */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-6">
          <div
            className={`inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black tracking-widest uppercase border font-mono ${
              isNight ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : 'bg-orange-100 border-orange-200 text-orange-700'
            }`}
          >
            <Sparkle size={14} weight="fill" className="text-orange-500" />
            <span>{t.hero.tagline}</span>
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-[1.08] break-keep">
            {t.hero.headline}
          </h1>

          <p className={`text-base sm:text-lg max-w-2xl mx-auto leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'} break-keep`}>
            {t.hero.subheadline}
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <button
              type="button"
              onClick={openOnboardingModal}
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-[0.97] flex items-center justify-center gap-2 cursor-pointer group"
            >
              <span>{t.hero.primaryCta}</span>
              <ArrowRight size={16} weight="bold" className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#video-demo"
              className={`w-full sm:w-auto px-8 py-4 font-black text-sm rounded-2xl border transition-all active:scale-[0.97] text-center flex items-center justify-center gap-2 ${
                isNight
                  ? 'bg-white/5 border-white/10 hover:bg-white/10 text-white'
                  : 'bg-white border-zinc-300 hover:bg-zinc-50 text-zinc-900 shadow-sm'
              }`}
            >
              <PlayCircle size={18} weight="fill" className="text-orange-500" />
              <span>{t.hero.secondaryCta}</span>
            </a>
          </div>

          {/* Trust Badge */}
          <p className={`text-xs ${isNight ? 'text-zinc-500' : 'text-zinc-400'} pt-2 font-mono`}>
            🔒 {t.hero.badge}
          </p>
        </section>

        {/* ========================================================================= */}
        {/* 2. 1-MINUTE GUIDDE VIDEO SHOWCASE FRAME (#video-demo) */}
        {/* ========================================================================= */}
        <section id="video-demo" className="space-y-6 max-w-5xl mx-auto w-full pt-4">
          <div className="text-center space-y-2">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
              {t.videoDemo.tagline}
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
              {t.videoDemo.heading}
            </h2>
            <p className={`text-xs sm:text-sm max-w-xl mx-auto ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.videoDemo.subheading}
            </p>
          </div>

          {/* Responsive Embedded Video Frame */}
          <div
            className={`rounded-3xl border p-3 md:p-4 shadow-2xl relative overflow-hidden transition-all ${
              isNight
                ? 'bg-[#050505] border-white/15 shadow-orange-500/10'
                : 'bg-white border-zinc-300 shadow-xl'
            }`}
          >
            <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-inner">
              <iframe
                src="https://embed.app.guidde.com/playbooks/fXwhH7ayipdTFcXASDJx5K?mode=videoOnly"
                title="ChekkiAI 1-Minute Demo"
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 3. PAIN VS DREAM COMPARISON GRID (#features) */}
        {/* ========================================================================= */}
        <section id="features" className="space-y-12">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.painVsDream.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.painVsDream.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left: Traditional Bottlenecks */}
            <div
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
                isNight ? 'bg-[#050505] border-red-500/20' : 'bg-red-50/40 border-red-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center font-bold">
                    ⚠️
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.painVsDream.bottleneckTitle}
                    </h3>
                    <p className="text-xs text-red-500 font-bold">{t.painVsDream.bottleneckSubtitle}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-red-500/10">
                  {t.painVsDream.bottleneckPoints.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-black text-red-400 flex items-center gap-2">
                        <span>❌</span> {item.title}
                      </h4>
                      <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs font-bold text-red-400 ${isNight ? 'bg-red-500/10 border-red-500/20' : 'bg-red-100 border-red-200'}`}>
                {t.painVsDream.bottleneckAlert}
              </div>
            </div>

            {/* Right: ChekkiAI Automated Pipeline */}
            <div
              className={`p-8 rounded-3xl border flex flex-col justify-between space-y-6 ${
                isNight ? 'bg-[#060b07] border-emerald-500/30' : 'bg-emerald-50/40 border-emerald-200'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                    ⚡
                  </div>
                  <div>
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {t.painVsDream.standardTitle}
                    </h3>
                    <p className="text-xs text-emerald-400 font-bold">{t.painVsDream.standardSubtitle}</p>
                  </div>
                </div>

                <div className="space-y-4 pt-4 border-t border-emerald-500/10">
                  {t.painVsDream.standardPoints.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <h4 className="text-xs font-black text-emerald-400 flex items-center gap-2">
                        <span>✅</span> {item.title}
                      </h4>
                      <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {item.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-2xl border text-xs font-bold text-emerald-400 ${isNight ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-100 border-emerald-200'}`}>
                {t.painVsDream.standardResult}
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. INTERACTIVE REPORT GENERATOR DEMO WORKSPACE (#interactive) */}
        {/* ========================================================================= */}
        <section id="interactive" className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono mb-2">
              LIVE INTERACTIVE GENERATOR
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {demoT.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {demoT.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Controls (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Preset Selector */}
              <div className="space-y-3">
                <label className="text-xs font-black uppercase tracking-wider text-orange-500 block font-mono flex items-center justify-between">
                  <span>{demoT.selectPreset}</span>
                  <span className="text-[10px] text-zinc-500 font-normal">Airtable Source</span>
                </label>
                <div className="space-y-2.5">
                  {SAMPLE_REPORTS.map((report) => (
                    <button
                      key={report.id}
                      type="button"
                      onClick={() => handleSelectPreset(report)}
                      className={`w-full text-left p-4 rounded-2xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between cursor-pointer ${
                        selectedReportId === report.id
                          ? isNight
                            ? 'bg-[#0f0b08] border-orange-500 text-white shadow-lg shadow-orange-500/10'
                            : 'bg-orange-50/80 border-orange-500 text-zinc-900 shadow-md'
                          : isNight
                          ? 'bg-[#050505] border-white/10 text-zinc-300 hover:border-white/30'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:border-zinc-300 shadow-sm'
                      }`}
                    >
                      <div>
                        <div className="font-bold flex items-center gap-2">
                          <span>{report.studentNameKo}</span>
                          <span className="text-xs font-normal opacity-70">({report.studentNameEn})</span>
                        </div>
                        <div className="text-[11px] opacity-70 mt-1">
                          {report.gradeKo} • {report.subject}
                        </div>
                      </div>
                      {selectedReportId === report.id && (
                        <div className="w-2.5 h-2.5 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Raw Foreign Teacher Input */}
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider font-mono text-zinc-400">
                  <span>{demoT.customInputLabel}</span>
                  <span className="text-orange-500 text-[10px] font-normal">Fillout Form Log ✏️</span>
                </div>
                <textarea
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  rows={5}
                  className={`w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none transition-colors font-mono ${
                    isNight
                      ? 'bg-[#050505] border-white/10 text-zinc-100 focus:border-orange-500'
                      : 'bg-white border-zinc-200 text-zinc-900 focus:border-orange-500 shadow-inner'
                  }`}
                  placeholder={demoT.inputPlaceholder}
                />
              </div>

              {/* Generate Action Button */}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-orange-500/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Sparkle size={18} className="animate-spin text-white" />
                    <span>{demoT.generatingLabel}</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>{demoT.generateBtn}</span>
                  </>
                )}
              </button>

              {/* Director Note Card */}
              <div
                className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                  isNight ? 'bg-[#0a0a0c] border-white/10 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
                }`}
              >
                <span className={`font-bold block mb-1 ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                  💡 {demoT.directorNoteLabel}:
                </span>
                <p>{demoT.directorNoteBody}</p>
              </div>
            </div>

            {/* Right Output Dashboard (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Header bar with Copy Action */}
              <div
                className={`p-6 rounded-3xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 transition-colors ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <UserCheck size={20} className="text-orange-500" weight="bold" />
                    <h3 className={`font-black text-lg ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                      {activeReport.studentNameKo} ({activeReport.studentNameEn})
                    </h3>
                  </div>
                  <p className={`text-xs mt-1 ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {activeReport.gradeKo} • {activeReport.subject} • {activeReport.teacherName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleCopyKakaoScript}
                  className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-orange-500 hover:bg-orange-600 text-white shadow-md active:scale-95'
                  }`}
                >
                  {copied ? (
                    <>
                      <CheckCircle size={16} weight="bold" />
                      <span>{demoT.copiedText}</span>
                    </>
                  ) : (
                    <>
                      <Copy size={16} weight="bold" />
                      <span>{demoT.copyScriptBtn}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Branch A: Normalized Academic Summary (Airtable DB) */}
              <div
                className={`p-6 rounded-3xl border space-y-3 ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
                    Branch A • {demoT.translatedSummary}
                  </span>
                  {activeReport.flaggedIssue && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      ⚠️ {activeReport.flaggedIssue}
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  {activeReport.translatedSummaryKo}
                </p>
              </div>

              {/* Branch B: 5-Part Parent Script (KakaoTalk Phone Script) */}
              <div
                className={`p-6 rounded-3xl border space-y-5 ${
                  isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
                }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 font-mono block">
                  Branch B • {demoT.scriptSectionsHeading}
                </span>

                {/* Section 1: Greeting */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-orange-500 block">{demoT.scriptSections.greeting}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.greeting}
                  </p>
                </div>

                {/* Section 2: Academic Progress */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-blue-400 block">{demoT.scriptSections.academicProgress}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.academicProgress}
                  </p>
                </div>

                {/* Section 3: Behavior & Attitude */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-purple-400 block">{demoT.scriptSections.behaviorAndAttitude}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.behaviorAndAttitude}
                  </p>
                </div>

                {/* Section 4: Action Items */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-amber-500/5 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
                  <span className="text-[11px] font-bold text-amber-500 block">{demoT.scriptSections.actionItems}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.actionItems}
                  </p>
                </div>

                {/* Section 5: Closing */}
                <div className={`p-4 rounded-2xl border space-y-1 ${isNight ? 'bg-white/[0.02] border-white/5' : 'bg-zinc-50 border-zinc-200'}`}>
                  <span className="text-[11px] font-bold text-emerald-400 block">{demoT.scriptSections.closing}</span>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isNight ? 'text-zinc-200' : 'text-zinc-800'}`}>
                    {activeReport.parentScriptKo.closing}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Sticky Mobile Copy Bar */}
        <div className="sm:hidden fixed bottom-4 left-4 right-4 z-40">
          <button
            type="button"
            onClick={handleCopyKakaoScript}
            className={`w-full py-3.5 px-6 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-2xl transition-all ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-orange-500 text-white shadow-orange-500/40 active:scale-95'
            }`}
          >
            {copied ? <CheckCircle size={18} weight="bold" /> : <Copy size={18} weight="bold" />}
            <span>{copied ? demoT.copiedText : demoT.copyScriptBtn}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* 5. DYNAMIC ROI & TIME SAVINGS CALCULATOR (#calculator) */}
        {/* ========================================================================= */}
        <section id="calculator" className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono mb-2">
              COST & TIME SAVINGS CALCULATOR
            </span>
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.calculator.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.calculator.subheading}
            </p>
          </div>

          <div
            className={`p-8 md:p-10 rounded-3xl border grid grid-cols-1 lg:grid-cols-12 gap-8 items-center ${
              isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-sm'
            }`}
          >
            {/* Controls (6 cols) */}
            <div className="lg:col-span-6 space-y-8">
              {/* FT Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>{t.calculator.foreignTeachersLabel}</span>
                  <span className="text-lg font-black text-orange-500">{ftCount} FTs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="20"
                  value={ftCount}
                  onChange={(e) => setFtCount(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              {/* Student Count Slider */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs font-bold font-mono">
                  <span>{t.calculator.studentCountLabel}</span>
                  <span className="text-lg font-black text-orange-500">{studentCount} Students</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="500"
                  step="10"
                  value={studentCount}
                  onChange={(e) => setStudentCount(parseInt(e.target.value))}
                  className="w-full accent-orange-500 cursor-pointer"
                />
              </div>

              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-500' : 'text-zinc-400'} font-mono`}>
                ℹ️ {t.calculator.disclaimerText}
              </p>
            </div>

            {/* Calculated Output Display (6 cols) */}
            <div
              className={`lg:col-span-6 p-8 rounded-2xl border space-y-6 ${
                isNight ? 'bg-gradient-to-b from-orange-500/10 to-purple-900/10 border-orange-500/30' : 'bg-gradient-to-b from-orange-50 to-amber-50 border-orange-200'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-orange-500 uppercase tracking-widest block mb-1 font-mono">
                  {t.calculator.weeklyTranslationHours}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-4xl sm:text-5xl font-black text-orange-500">
                    {weeklyHoursSaved}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">{t.calculator.hoursUnit}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-orange-500/20">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-widest block mb-1 font-mono">
                  {t.calculator.annualCostSavings}
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-3xl sm:text-4xl font-black text-emerald-400">
                    ₩{annualLaborSavingsKRW.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-zinc-400">/ year</span>
                </div>
              </div>

              <button
                type="button"
                onClick={openOnboardingModal}
                className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer active:scale-95"
              >
                {t.calculator.ctaText}
              </button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 6. 4-STEP PIPELINE OVERVIEW */}
        {/* ========================================================================= */}
        <section className="space-y-8 pt-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight mb-4">
              {t.howItWorks.heading}
            </h2>
            <p className={`text-sm sm:text-base ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {t.howItWorks.subheading}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`p-6 rounded-3xl border space-y-3 ${isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center font-black">
                1
              </div>
              <h3 className={`font-black text-base ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {t.howItWorks.step1Title}
              </h3>
              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.howItWorks.step1Desc}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border space-y-3 ${isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center font-black">
                2
              </div>
              <h3 className={`font-black text-base ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {t.howItWorks.step2Title}
              </h3>
              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.howItWorks.step2Desc}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border space-y-3 ${isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center font-black">
                3
              </div>
              <h3 className={`font-black text-base ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {t.howItWorks.step3Title}
              </h3>
              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.howItWorks.step3Desc}
              </p>
            </div>

            <div className={`p-6 rounded-3xl border space-y-3 ${isNight ? 'bg-[#050505] border-white/10' : 'bg-white border-zinc-200'}`}>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-black">
                4
              </div>
              <h3 className={`font-black text-base ${isNight ? 'text-white' : 'text-zinc-900'}`}>
                {t.howItWorks.step4Title}
              </h3>
              <p className={`text-xs leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.howItWorks.step4Desc}
              </p>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 7. EMBEDDED ACADEMY ONBOARDING FORM (#onboarding-form) */}
        {/* ========================================================================= */}
        <section id="onboarding-form" className="space-y-8 pt-8">
          <div
            className={`p-8 md:p-12 rounded-3xl border max-w-4xl mx-auto w-full space-y-8 ${
              isNight ? 'bg-gradient-to-b from-[#0a0a0c] to-[#050505] border-white/10' : 'bg-white border-zinc-200 shadow-xl'
            }`}
          >
            <div className="text-center space-y-3">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-mono">
                CUSTOM ACADEMY ONBOARDING
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black tracking-tight">
                {t.onboardingForm.heading}
              </h2>
              <p className={`text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.onboardingForm.subheading}
              </p>
            </div>

            {submitted ? (
              <div className="p-8 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-3xl">
                  🎉
                </div>
                <h3 className="font-black text-xl text-white">{t.onboardingForm.successTitle}</h3>
                <p className="text-xs sm:text-sm text-zinc-300 max-w-lg mx-auto leading-relaxed">
                  {t.onboardingForm.successMessage}
                </p>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.directorName} *</label>
                  <input
                    type="text"
                    required
                    value={directorName}
                    onChange={(e) => setDirectorName(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="김원장"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.academyName} *</label>
                  <input
                    type="text"
                    required
                    value={academyName}
                    onChange={(e) => setAcademyName(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="청담 이스트 어학원"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.phone} *</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="010-1234-5678"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.email} *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="director@academy.com"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.location}</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="서울 강남구 대치동"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.currentMethod}</label>
                  <input
                    type="text"
                    value={currentMethod}
                    onChange={(e) => setCurrentMethod(e.target.value)}
                    className={`w-full p-3.5 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                    placeholder="카카오 알림톡 / 종이 성적표 / 전화 상담"
                  />
                </div>

                <div className="md:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    {isSubmitting ? t.onboardingForm.submitting : t.onboardingForm.submitBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* 8. POP-UP MODAL OVERLAY (`showModal`) */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 overflow-y-auto bg-black/80 backdrop-blur-md">
          <div
            className={`w-full max-w-xl p-6 sm:p-8 rounded-3xl border shadow-2xl relative transition-all ${
              isNight ? 'bg-[#0a0a0c] border-white/15 text-white' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6 space-y-1">
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest font-mono block">
                CHEKKI ACADEMY ONBOARDING
              </span>
              <h3 className="font-display text-2xl font-black">{t.onboardingForm.modalTitle}</h3>
              <p className={`text-xs ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {t.onboardingForm.modalSubtitle}
              </p>
            </div>

            {submitted ? (
              <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-3">
                <span className="text-3xl block">🎉</span>
                <h4 className="font-black text-lg text-white">{t.onboardingForm.successTitle}</h4>
                <p className="text-xs text-zinc-300 leading-relaxed">{t.onboardingForm.successMessage}</p>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-4 px-6 py-2.5 bg-emerald-500 text-white font-bold text-xs rounded-xl"
                >
                  닫기 (Close)
                </button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.directorName} *</label>
                    <input
                      type="text"
                      required
                      value={directorName}
                      onChange={(e) => setDirectorName(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="김원장"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.academyName} *</label>
                    <input
                      type="text"
                      required
                      value={academyName}
                      onChange={(e) => setAcademyName(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="청담 이스트 어학원"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.phone} *</label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="010-1234-5678"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-zinc-400 block">{t.onboardingForm.email} *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full p-3 rounded-xl border text-xs focus:outline-none ${
                        isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      }`}
                      placeholder="director@academy.com"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer active:scale-95 mt-2"
                >
                  {isSubmitting ? t.onboardingForm.submitting : t.onboardingForm.submitBtn}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
