import React, { useState } from 'react';
import { Copy, CheckCircle, PhoneCall, Sparkle, UserCheck, X, Lock } from '@phosphor-icons/react';
import { GeneratedReportOutput } from '../services/aiGenerator';
import { UserProfile } from '../../types';
import { getPermissionsForUser } from '../utils/permissions';
import { useDialogA11y } from '../../hooks/useDialogA11y';

interface Props {
  isNight?: boolean;
  isKo?: boolean;
  generatedOutput?: GeneratedReportOutput | null;
  className?: string;
  academyName?: string;
  userProfile?: UserProfile | null;
  // Number of other logs still waiting behind this one in the review queue.
  pendingCount?: number;
  // Persists the KT-reviewed version to Firestore (classes/{id}/logs/{id})
  // so it's the record parents see — never the raw FT note. Fired when the
  // KT copies the script to send, since that's the point they've committed
  // to this version being final.
  onApprove?: (approvedSummary: string, approvedExceptions: { studentName: string; approvedText: string }[]) => Promise<boolean> | boolean | void;
}

export const NativeKtDashboard: React.FC<Props> = ({
  isNight = true,
  isKo: isKoProp,
  generatedOutput,
  className = 'POLY Seocho 7A',
  academyName = 'POLY Academy (Seocho)',
  userProfile,
  pendingCount = 0,
  onApprove,
}) => {
  const isKo = isKoProp !== undefined ? isKoProp : (typeof window !== 'undefined' && localStorage.getItem('chekki_lang') === 'ko');
  const permissions = getPermissionsForUser(userProfile);
  // No real submitted log yet — the fields below fall back to sample copy so
  // the KT can see what the workspace looks like. Copy/Share must not act on
  // that sample text as if it were real, or a KT could send fabricated
  // class/student content into a real parent chat without noticing it's a
  // placeholder (Audit: demo data reachable via Copy/Share).
  const isDemoContent = !generatedOutput;
  // Live Editable State for Korean Teacher Review
  const [editedKoreanSummary, setEditedKoreanSummary] = useState(
    generatedOutput?.bilingualClassSummary.korean ||
      (isKo 
        ? '오늘 7A 반 원생들은 Unit 4 식물의 광합성(Photosynthesis) 어휘를 집중 학습했습니다. 모든 원생이 어휘 읽기 카드 활동에 밝고 적극적으로 참여하였습니다.'
        : 'Today in 7A, students focused on learning Unit 4 Photosynthesis vocabulary. All students actively and cheerfully participated in the vocabulary flashcard reading activity.')
  );

  const [englishSummary, setEnglishSummary] = useState(
    generatedOutput?.bilingualClassSummary.english ||
      'Today in 7A, students actively practiced Unit 4 Photosynthesis vocabulary. Everyone participated attentively during the reading drill.'
  );

  // 3-Stage Report Status State
  const [reportStatus, setReportStatus] = useState<'pending_review' | 'edited_by_kt' | 'copied_sent'>(
    generatedOutput?.status || 'pending_review'
  );

  // 3-Tone Script Switcher State
  const [scriptTone, setScriptTone] = useState<'formal' | 'friendly' | 'concise'>('formal');
  const [filterUrgentOnly, setFilterUrgentOnly] = useState(false);

  const getToneHeader = () => {
    if (scriptTone === 'friendly') return isKo ? `[어머님 안녕하세요! ${academyName}입니다 🌸]` : `[Hello Parents! This is ${academyName} 🌸]`;
    if (scriptTone === 'concise') return `[${className} ${isKo ? '알림톡' : 'Report'}]`;
    return `[${academyName} ${isKo ? '학부모 알림톡' : 'Parent Update'}]`;
  };

  const getFormattedScript = () => {
    return `${getToneHeader()}\n${isKo ? '학급' : 'Class'}: ${className}\n\n${editedKoreanSummary}\n\n-----------------------------------\n[Original Teacher Note]\n${englishSummary}`.trim();
  };

  const currentFullText = getFormattedScript();
  const charCount = currentFullText.length;

  const [copied, setCopied] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  // Phone Consultation Drawer State
  const [activeDrawerStudent, setActiveDrawerStudent] = useState<{
    name: string;
    talkingPoints: string[];
  } | null>(null);

  const drawerDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: !!activeDrawerStudent,
    onClose: () => setActiveDrawerStudent(null),
  });

  const handleTextChange = (val: string) => {
    setEditedKoreanSummary(val);
    if (reportStatus === 'pending_review') {
      setReportStatus('edited_by_kt');
    }
  };

  const displayedStudentReports = generatedOutput?.studentReports && generatedOutput.studentReports.length > 0
    ? generatedOutput.studentReports
    : [];

  const handleCopyKakaoScript = async () => {
    if (isDemoContent || isApproving) return;
    const fullText = currentFullText;

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullText);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = fullText;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch (e) {
      console.warn('Clipboard write fallback executed:', e);
    }

    // The approve write must resolve before we tell the KT this is sent —
    // flipping to "sent" first meant a failed Firestore write still looked
    // successful in this dashboard (Audit: KT "sent" fires before write resolves).
    setIsApproving(true);
    try {
      const result = await onApprove?.(
        editedKoreanSummary,
        displayedStudentReports.map((s) => ({ studentName: s.studentName, approvedText: s.koreanUpdate }))
      );
      if (result === false) return;
      setCopied(true);
      setReportStatus('copied_sent');
      setTimeout(() => setCopied(false), 2500);
    } finally {
      setIsApproving(false);
    }
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
              {isKo ? '한국인 교사 검수 워크스페이스' : 'KT REVIEW WORKSPACE (HUMAN-IN-THE-LOOP)'}
            </span>
            <span className="text-[10px] text-amber-400 font-mono font-bold">
              {isKo ? '🔒 자동발송 없음 (검수 후 복사)' : '🔒 No Auto-Send (Edit First)'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isKo ? '한국인 담임 교사 & 상담 대시보드' : 'Korean Teacher & Counselor Dashboard'}
          </h2>
          {pendingCount > 0 && (
            <span className="mt-1 inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-bold bg-red-500/15 border border-red-500/30 text-red-400 font-mono">
              {isKo ? `대기 중인 리포트 ${pendingCount}건 더 있음` : `${pendingCount} more waiting in queue`}
            </span>
          )}
          {isDemoContent && (
            <span className="mt-1 inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-widest bg-purple-500/15 border border-purple-500/30 text-purple-300 font-mono">
              {isKo ? '📋 샘플 미리보기 — 아직 실제 리포트 없음' : '📋 Sample preview — no real report yet'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 min-h-11 rounded-2xl font-bold text-xs bg-white/10 hover:bg-white/15 border border-white/15 text-white flex items-center justify-center gap-2 transition-all cursor-pointer"
            title={isKo ? '학원 로고 리포트 PDF 인쇄' : 'Download/Print PDF Report with Custom Academy Logo Header'}
          >
            <span>📄</span>
            <span>{isKo ? '학원 로고 PDF 인쇄' : 'Print Custom Logo PDF Report'}</span>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              disabled={isDemoContent}
              title={isDemoContent ? (isKo ? '실제 리포트가 없어 공유할 수 없습니다' : 'No real report to share yet') : undefined}
              onClick={() => {
                if (isDemoContent) return;
                if (navigator.share) {
                  navigator.share({
                    title: isKo ? '체키 학부모 상담 알림톡' : 'Chekki Parent Update',
                    text: editedKoreanSummary,
                  }).catch(() => {});
                } else {
                  navigator.clipboard.writeText(editedKoreanSummary);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }
              }}
              className={`px-3.5 py-2.5 min-h-11 font-black text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 shrink-0 ${
                isDemoContent
                  ? 'bg-zinc-500/30 text-zinc-400 cursor-not-allowed'
                  : 'bg-yellow-400 hover:bg-yellow-500 text-zinc-900 cursor-pointer active:scale-95'
              }`}
            >
              <span>💬</span>
              <span>{isKo ? '카카오톡 공유' : 'Share KakaoTalk'}</span>
            </button>
            <button
              type="button"
              disabled={isDemoContent || isApproving}
              title={isDemoContent ? (isKo ? '실제 리포트가 없어 복사할 수 없습니다' : 'No real report to copy yet') : undefined}
              onClick={handleCopyKakaoScript}
              className={`px-4 py-2.5 min-h-11 rounded-xl text-xs font-black shadow-lg transition-all flex items-center gap-2 shrink-0 ${
                isDemoContent || isApproving
                  ? 'bg-zinc-500/30 text-zinc-400 cursor-not-allowed'
                  : copied
                  ? 'bg-emerald-500 text-white shadow-emerald-500/20 cursor-pointer active:scale-95'
                  : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/20 cursor-pointer active:scale-95'
              }`}
            >
              {isApproving ? (
                <Sparkle size={16} weight="bold" className="animate-spin" />
              ) : copied ? (
                <CheckCircle size={16} weight="bold" />
              ) : (
                <Copy size={16} weight="bold" />
              )}
              <span>
                {isApproving
                  ? (isKo ? '저장 중...' : 'Saving...')
                  : copied
                  ? (isKo ? '복사 완료! ✅' : 'Copied! ✅')
                  : (isKo ? '대본 1클릭 복사' : '1-Click Copy Script')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3-Stage Report Status Badge Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl border bg-white/[0.02] border-white/10 font-mono text-xs">
        <span className="font-bold text-zinc-400">{isKo ? '리포트 검수 진행 상태:' : 'Report Review Status:'}</span>
        <div className="flex items-center gap-1.5 flex-wrap">
          <button
            type="button"
            onClick={() => setReportStatus('pending_review')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              reportStatus === 'pending_review'
                ? 'bg-red-500/20 border-red-500 text-red-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
          >
            🔴 {isKo ? '검수 대기' : 'PENDING REVIEW'}
          </button>

          <button
            type="button"
            onClick={() => setReportStatus('edited_by_kt')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              reportStatus === 'edited_by_kt'
                ? 'bg-amber-500/20 border-amber-500 text-amber-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
          >
            🟡 {isKo ? '교사 수정완료' : 'EDITED BY KT'}
          </button>

          <button
            type="button"
            onClick={() => setReportStatus('copied_sent')}
            className={`px-3 py-1 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
              reportStatus === 'copied_sent'
                ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                : 'bg-white/5 border-white/10 text-zinc-500'
            }`}
          >
            🟢 {isKo ? '발송 완료' : 'COPIED & SENT'}
          </button>
        </div>
      </div>

      {/* 3-Tone Script Switcher & Character Counter Bar */}
      <div className="p-4 rounded-2xl border bg-white/[0.02] border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-400">💬 {isKo ? '대본 어조 선택:' : 'Script Tone:'}</span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setScriptTone('formal')}
              className={`px-3 py-1.5 min-h-11 rounded-xl font-bold border transition-all cursor-pointer ${
                scriptTone === 'formal'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              🎩 {isKo ? '정중한 톤 (Standard)' : 'Formal Tone (Standard)'}
            </button>
            <button
              type="button"
              onClick={() => setScriptTone('friendly')}

              className={`px-3 py-1.5 min-h-11 rounded-xl font-bold border transition-all cursor-pointer ${
                scriptTone === 'friendly'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              🌸 친근한 톤 (Soft)
            </button>
            <button
              type="button"
              onClick={() => setScriptTone('concise')}
              className={`px-3 py-1.5 min-h-11 rounded-xl font-bold border transition-all cursor-pointer ${
                scriptTone === 'concise'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 shadow-sm'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              ⚡ 간결한 톤 (Concise)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-xl border font-bold ${
            charCount <= 500
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
            💬 {isKo ? '카카오톡 분량' : 'KakaoTalk Length'}: {charCount} {isKo ? '자' : 'chars'} ({charCount <= 500 ? (isKo ? '적정 ~30초' : 'Ideal ~30s read') : (isKo ? '긴 분량 ~1분' : 'Long ~1m read')})
          </span>

          <button
            type="button"
            onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
            className={`px-3 py-1 min-h-11 rounded-xl font-bold border transition-all cursor-pointer ${
              filterUrgentOnly
                ? 'bg-red-500 border-red-500 text-white shadow-md'
                : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            🚨 {isKo ? '전화상담 필요만' : 'Urgent Call Only'} {filterUrgentOnly ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Editable Korean Summary Section */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-bold font-mono">
          <span className="text-orange-400 uppercase tracking-wider">
            ✏️ {isKo ? '실시간 편집 가능 학부모 알림톡 대본 (복사 전 자유 수정)' : 'Live Editable Korean Script (Review & Tweak Before Copying)'}
          </span>
        </div>

        <textarea
          value={editedKoreanSummary}
          onChange={(e) => permissions.canEditReports && setEditedKoreanSummary(e.target.value)}
          disabled={!permissions.canEditReports}
          rows={4}
          className={`w-full p-4 rounded-2xl border text-xs sm:text-sm leading-relaxed focus:outline-none transition-all font-sans ${
            !permissions.canEditReports ? 'opacity-60 cursor-not-allowed' : ''
          } ${
            isNight
              ? 'bg-[#030305] border-orange-500/30 text-white focus:border-orange-500'
              : 'bg-orange-50/50 border-orange-200 text-zinc-900 focus:border-orange-500'
          }`}
        />
        <div className="flex justify-between items-center text-[11px] text-zinc-500 font-mono italic">
          <span>ℹ️ {isKo ? '위 대본 문장을 직접 수정할 수 있습니다. 복사 버튼 클릭 시 수정된 내용이 복사됩니다.' : 'KT can edit any sentence above directly. Clicking copy will copy your edited version.'}</span>
          {!permissions.canEditReports && (
            <span className="text-amber-400 font-bold flex items-center gap-1">
              <Lock size={12} /> {isKo ? '읽기 전용 권한' : 'Read-only Permission'}
            </span>
          )}
        </div>
      </div>

      {/* English Original Reference */}
      <div className="space-y-1.5 p-4 rounded-2xl border bg-white/[0.02] border-white/10 text-xs">
        <span className="font-bold text-zinc-400 block font-mono">{isKo ? '원어민 강사 원본 작성 메모:' : 'Original Foreign Teacher English Note:'}</span>
        <p className="text-zinc-300 font-mono leading-relaxed">{englishSummary}</p>
      </div>

      {/* Flagged Student Exception Section with Phone Consultation Prep Drawer Trigger */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <span className="text-xs font-bold text-amber-400 uppercase font-mono block">
          ⚠️ {isKo ? '주의 필요 학생 집중 케어 & 전화 상담 대본' : 'Flagged Student Exceptions & Phone Consultation Prep'}
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
            ref={drawerDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="phone-consult-title"
            tabIndex={-1}
            className={`w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isNight ? 'bg-[#0a0a0c] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">
                  PROMPT #3 • PARENT PHONE CONSULTATION PREP
                </span>
                <h3 id="phone-consult-title" className="font-black text-lg text-white">
                  📞 Talking Points for {activeDrawerStudent.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveDrawerStudent(null)}
                aria-label="Close"
                className="min-w-11 min-h-11 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              {activeDrawerStudent.talkingPoints.map((pt, i) => (
                <div
                  key={i}
                  className={`p-3.5 rounded-xl border leading-relaxed font-bold flex items-start gap-2 ${
                    isNight
                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                      : 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                  }`}
                >
                  <span className={isNight ? 'text-amber-400 font-black' : 'text-amber-700 font-black'}>▶</span>
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
