import React, { useState } from 'react';
import { Copy, CheckCircle, PhoneCall, Sparkle, UserCheck, X } from '@phosphor-icons/react';
import { GeneratedReportOutput } from '../services/aiGenerator';

interface Props {
  isNight?: boolean;
  generatedOutput: GeneratedReportOutput | null;
  className?: string;
  academyName?: string;
}

export const NativeKtDashboard: React.FC<Props> = ({
  isNight = true,
  generatedOutput,
  className = 'POLY Seocho 7A',
  academyName = 'POLY Academy (Seocho)',
}) => {
  // Live Editable State for Korean Teacher Review
  const [editedKoreanSummary, setEditedKoreanSummary] = useState(
    generatedOutput?.bilingualClassSummary.korean ||
      '오늘 7A 반 원생들은 Unit 4 식물의 광합성(Photosynthesis) 어휘를 집중 학습했습니다. 모든 원생이 어휘 읽기 카드 활동에 밝고 적극적으로 참여하였습니다.'
  );

  const [englishSummary, setEnglishSummary] = useState(
    generatedOutput?.bilingualClassSummary.english ||
      'Today in 7A, students actively practiced Unit 4 Photosynthesis vocabulary. Everyone participated attentively during the reading drill.'
  );

  const [copied, setCopied] = useState(false);

  // Phone Consultation Drawer State
  const [activeDrawerStudent, setActiveDrawerStudent] = useState<{
    name: string;
    talkingPoints: string[];
  } | null>(null);

  const handleCopyKakaoScript = () => {
    const fullText = `[${academyName} 학부모 알림톡]
학급: ${className}

${editedKoreanSummary}

-----------------------------------
[Original Teacher Note]
${englishSummary}`.trim();

    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl space-y-6 max-w-4xl mx-auto w-full transition-all ${
        isNight ? 'bg-[#060608] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
              KT REVIEW WORKSPACE (HUMAN-IN-THE-LOOP)
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">🔒 No Auto-Send (Edit First)</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Korean Teacher & Counselor Dashboard
          </h2>
        </div>

        <button
          type="button"
          onClick={handleCopyKakaoScript}
          className={`px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20'
          }`}
        >
          {copied ? <CheckCircle size={16} weight="bold" /> : <Copy size={16} weight="bold" />}
          <span>{copied ? 'Copied Edited Script! ✅' : '1-Click Copy Edited KakaoTalk'}</span>
        </button>
      </div>

      {/* Editable Korean Summary Section */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold font-mono">
          <span className="text-orange-400 uppercase tracking-wider">
            ✏️ Live Editable Korean Script (Review & Tweak Before Copying)
          </span>
          <span className="text-zinc-500 text-[10px]">Polite Honorifics (존댓말)</span>
        </div>

        <textarea
          value={editedKoreanSummary}
          onChange={(e) => setEditedKoreanSummary(e.target.value)}
          rows={4}
          className={`w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none transition-all font-sans ${
            isNight
              ? 'bg-[#030305] border-orange-500/30 text-white focus:border-orange-500'
              : 'bg-orange-50/50 border-orange-200 text-zinc-900 focus:border-orange-500'
          }`}
        />
        <p className="text-[11px] text-zinc-500 font-mono italic">
          ℹ️ KT can edit any sentence above directly. Clicking copy will copy your edited version.
        </p>
      </div>

      {/* English Original Reference */}
      <div className="space-y-1.5 p-4 rounded-2xl border bg-white/[0.02] border-white/10 text-xs">
        <span className="font-bold text-zinc-400 block font-mono">Original Foreign Teacher English Note:</span>
        <p className="text-zinc-300 font-mono leading-relaxed">{englishSummary}</p>
      </div>

      {/* Flagged Student Exception Section with Phone Consultation Prep Drawer Trigger */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <span className="text-xs font-bold text-amber-400 uppercase font-mono block">
          ⚠️ Flagged Student Exceptions & Phone Consultation Prep
        </span>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(generatedOutput?.studentReports && generatedOutput.studentReports.length > 0
            ? generatedOutput.studentReports
            : [
                {
                  studentName: 'Min-jun (민준)',
                  koreanUpdate:
                    '민준 학생은 오늘 수업 참여도는 밝았으나, Target 어휘인 Chloroplast 발음에 1:1 교정이 필요했습니다.',
                  phoneTalkingPoints: [
                    '1. 수업 참여도는 매우 우수하나 특정 곤란 어휘(Chloroplast) 복습이 필요함',
                    '2. 가정 내 14페이지 어휘 카드 1회 함께 읽어보기 지도 권장',
                    '3. 다음 시간 1:1 발음 교정 케어 진행 예정',
                  ],
                },
              ]
          ).map((std, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border space-y-3 ${
                isNight ? 'bg-[#0a080c] border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm text-amber-400 flex items-center gap-1.5 font-mono">
                  <UserCheck size={16} weight="bold" />
                  <span>{std.studentName}</span>
                </span>
                <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                  Flagged Exception
                </span>
              </div>

              <p className="text-xs leading-relaxed text-zinc-300">{std.koreanUpdate}</p>

              <button
                type="button"
                onClick={() =>
                  setActiveDrawerStudent({
                    name: std.studentName,
                    talkingPoints: std.phoneTalkingPoints,
                  })
                }
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
              >
                <PhoneCall size={14} weight="bold" />
                <span>📞 Open Phone Consultation Prep Talking Points</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Phone Consultation Talking Points Drawer */}
      {activeDrawerStudent && (
        <div className="fixed inset-0 z-[450] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isNight ? 'bg-[#0a0a0c] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  PROMPT #3 • PARENT PHONE CONSULTATION PREP
                </span>
                <h3 className="font-black text-lg text-white">
                  📞 Talking Points for {activeDrawerStudent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerStudent(null)}
                className="p-1 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {activeDrawerStudent.talkingPoints.map((pt, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border bg-amber-500/10 border-amber-500/20 text-amber-200 leading-relaxed font-bold flex items-start gap-2"
                >
                  <span className="text-amber-400 font-black">▶</span>
                  <span>{pt}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setActiveDrawerStudent(null)}
                className="w-full py-2.5 bg-orange-500 text-white font-bold text-xs rounded-xl"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
