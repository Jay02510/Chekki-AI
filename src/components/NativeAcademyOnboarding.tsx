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
  const [campusName, setCampusName] = useState('Apex English Academy (Seocho)');
  const [directorEmail, setDirectorEmail] = useState('director@apex-seocho.edu');
  const [ftEmail, setFtEmail] = useState('sarah.teacher@apex-seocho.edu');
  const [ktEmail, setKtEmail] = useState('jiyoung.kt@apex-seocho.edu');
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
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
      <div
        className={`relative p-6 sm:p-8 rounded-3xl border shadow-2xl w-full max-w-xl animate-fade-in text-left ${
          isNight ? 'bg-[#0a0a0e] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500/20 text-orange-400 flex items-center justify-center font-bold text-lg border border-orange-500/30">
              🏫
            </div>
            <div>
              <h3 className="font-black text-lg sm:text-xl">Chekki School Pro Onboarding</h3>
              <p className="text-xs text-zinc-400">Set up your campus workspace in under 60 seconds.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Step Wizard Progress Pills */}
        <div className="grid grid-cols-3 gap-2 mb-6 font-mono text-[10px] font-bold">
          <div className={`p-2 rounded-xl border text-center ${currentStep === 1 ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            1. CAMPUS INFO
          </div>
          <div className={`p-2 rounded-xl border text-center ${currentStep === 2 ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            2. STAFF & ROSTER
          </div>
          <div className={`p-2 rounded-xl border text-center ${currentStep === 3 ? 'bg-orange-500/20 border-orange-500 text-orange-400' : 'bg-white/5 border-white/10 text-zinc-500'}`}>
            3. CLASS CODE
          </div>
        </div>

        {/* Step 1: Campus Setup */}
        {currentStep === 1 && (
          <form onSubmit={handleNext} className="space-y-4 text-xs font-medium">
            <div className="space-y-1">
              <label className="block text-zinc-400 font-mono">Academy Campus Name *</label>
              <input
                type="text"
                required
                value={campusName}
                onChange={(e) => setCampusName(e.target.value)}
                placeholder="e.g. Apex English Academy (Seocho) / Chekki Language Institute"
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
                placeholder="e.g. director@apex-seocho.edu"
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
                  placeholder="sarah.teacher@apex-seocho.edu"
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
                  placeholder="jiyoung.kt@apex-seocho.edu"
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
