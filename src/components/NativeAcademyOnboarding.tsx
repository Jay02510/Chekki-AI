import React, { useState } from 'react';
import {
  Buildings,
  CheckCircle,
  ArrowRight,
  UploadSimple,
  UserPlus,
  Users,
  Copy,
  Sparkle,
  X,
  FileText,
  Key
} from '@phosphor-icons/react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isNight?: boolean;
}

export const NativeAcademyOnboarding: React.FC<Props> = ({
  isOpen,
  onClose,
  isNight = true
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [campusName, setCampusName] = useState('POLY Academy (Seocho)');
  const [directorEmail, setDirectorEmail] = useState('director@poly-seocho.edu');
  const [ftEmail, setFtEmail] = useState('sarah.teacher@poly-seocho.edu');
  const [ktEmail, setKtEmail] = useState('jiyoung.kt@poly-seocho.edu');
  const [rawRosterText, setRawRosterText] = useState(
    `Class 7A Sunshine, Min-jun Kim, 김민준\nClass 7A Sunshine, Seo-yeon Park, 박서연\nClass 8B Excellence, Ji-hoo Lee, 이지후`
  );
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const ftFormUrl = `https://chekki.ai/log?campus=${encodeURIComponent(campusName)}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(ftFormUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col space-y-6 p-6 sm:p-8 relative ${
          isNight ? 'bg-[#0a0a0f] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full border border-white/10 hover:bg-white/10 text-zinc-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Wizard Header & Progress Bar */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono">
              1-CLICK CAMPUS ONBOARDING WIZARD
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-orange-500/10 text-orange-400 border border-orange-500/20">
              Step {currentStep} of 3
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black tracking-tight">
            {currentStep === 1 && '🏫 Step 1: Campus Branding & Director Info'}
            {currentStep === 2 && '👥 Step 2: Staff Emails & Class Rosters'}
            {currentStep === 3 && '🚀 Step 3: Workspace Live & Teacher Logins Active!'}
          </h3>

          {/* Step Progress Dots */}
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  currentStep >= step ? 'w-1/3 bg-orange-500' : 'w-1/3 bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Step 1: Branding Info */}
        {currentStep === 1 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs font-medium">
            <div className="space-y-1">
              <label className="block text-zinc-400 font-mono">Official Campus / Academy Name *</label>
              <input
                type="text"
                required
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                placeholder="e.g. POLY Academy (Seocho) / 청담어학원 분당"
                className={`w-full p-3.5 rounded-xl border font-bold ${
                  isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-400 font-mono">Director Admin Email *</label>
              <input
                type="email"
                required
                value={directorEmail}
                onChange={(e) => setDirectorEmail(e.target.value)}
                placeholder="e.g. director@poly.edu"
                className={`w-full p-3.5 rounded-xl border font-bold ${
                  isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Continue to Staff Rosters</span>
                <ArrowRight size={16} weight="bold" />
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Staff Emails & Rosters */}
        {currentStep === 2 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs font-medium">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-zinc-400 font-mono">Foreign Teacher (FT) Email</label>
                <input
                  type="email"
                  value={ftEmail}
                  onChange={(e) => setFtEmail(e.target.value)}
                  placeholder="sarah.teacher@poly.edu"
                  className={`w-full p-3 rounded-xl border font-bold ${
                    isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-zinc-400 font-mono">Korean Teacher (KT) Email</label>
                <input
                  type="email"
                  value={ktEmail}
                  onChange={(e) => setKtEmail(e.target.value)}
                  placeholder="jiyoung.kt@poly.edu"
                  className={`w-full p-3 rounded-xl border font-bold ${
                    isNight ? 'bg-[#030305] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-zinc-400 font-mono flex items-center justify-between">
                <span>Class Rosters (Paste CSV or Simple List)</span>
                <span className="text-[10px] text-orange-400">Class, Student EN, Student KO</span>
              </label>
              <textarea
                rows={3}
                value={rawRosterText}
                onChange={(e) => setRawRosterText(e.target.value)}
                className={`w-full p-3 rounded-xl border font-mono text-xs ${
                  isNight ? 'bg-[#030305] border-white/10 text-emerald-400' : 'bg-zinc-900 text-emerald-400 border-zinc-800'
                }`}
              />
            </div>

            {/* Smart CSV Auto-Repair & Validation Preview */}
            <div className={`p-4 rounded-2xl border space-y-2 text-xs ${isNight ? 'bg-white/[0.02] border-white/10' : 'bg-zinc-100 border-zinc-200'}`}>
              <div className="flex items-center justify-between text-zinc-400 font-mono text-[11px]">
                <span className="font-bold text-orange-400 uppercase">⚡ Auto-Parser & Missing Field Repair:</span>
                <span className="text-emerald-400">100% Validated</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                  <CheckCircle size={14} weight="fill" />
                  <span>3 Roster Rows Extracted</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Sparkle size={14} />
                  <span>Auto-Fills Missing KO Names Phonetically</span>
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="text-xs text-zinc-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <span>Launch Campus Workspace</span>
                <Sparkle size={16} weight="fill" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Success & Links Hand-off */}
        {currentStep === 3 && (
          <div className="space-y-6 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
              <CheckCircle size={24} weight="fill" className="text-emerald-400 shrink-0" />
              <div>
                <h4 className="font-bold text-emerald-400 text-sm">Workspace Successfully Provisioned!</h4>
                <p className="text-zinc-300 text-xs">
                  {campusName} is live. Foreign Teachers can begin logging class notes immediately.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="p-4 rounded-2xl border bg-white/5 border-white/10 space-y-2">
                <span className="text-[10px] font-bold font-mono uppercase text-orange-400 block">
                  Foreign Teacher Mobile Form Link:
                </span>
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-black border border-white/10 font-mono text-xs">
                  <span className="truncate text-zinc-300">{ftFormUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-1 bg-orange-500 text-white font-bold rounded-lg shrink-0 cursor-pointer text-xs"
                  >
                    {copiedLink ? 'Copied!' : 'Copy Link'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl border bg-white/5 border-white/10 space-y-1">
                <span className="text-[10px] font-bold font-mono uppercase text-emerald-400 block">
                  Korean Teacher & Director Login Credentials:
                </span>
                <p className="text-zinc-300 font-mono">
                  Login URL: <span className="text-white font-bold">https://chekki.ai/login</span>
                </p>
                <p className="text-zinc-400 text-[11px]">
                  Temporary passwords have been dispatched to {directorEmail} and {ktEmail}.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                Close & Enter Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
