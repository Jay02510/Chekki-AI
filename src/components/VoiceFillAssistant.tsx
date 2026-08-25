import React, { useRef, useState } from 'react';
import { ArrowCounterClockwise, Check, ShieldCheck, Sparkle, X } from '@phosphor-icons/react';
import { callVoiceLogFill, VoiceFillException, VoiceFillFields, VoiceFillResponse, VoiceFillTurn } from '../services/voiceFill';
import { useLanguage } from '../../contexts/LanguageContext';
import { VoiceOrb } from './ui/VoiceOrb';

// Dismissal persists across sessions (same device/browser) — a teacher who's
// already dismissed it shouldn't see it re-appear every time they open
// voice fill again.
const PRIVACY_BANNER_DISMISSED_KEY = 'chekki_voice_privacy_banner_dismissed';

interface Props {
  isNight?: boolean;
  currentFields: VoiceFillFields;
  onFieldsUpdate: (fields: VoiceFillFields) => void;
  onExceptionsAdd: (exceptions: VoiceFillException[]) => void;
  onClose: () => void;
}

type RecorderState = 'idle' | 'recording' | 'processing';
type ConversationPhase = 'general' | 'exceptions';

// Static, hint-rich opening line shown before the first recording of each
// phase — not model-generated. Naming every field up front is what lets most
// teachers finish a phase in a single turn instead of triggering a follow-up.
const phaseOpenPrompt = (phase: ConversationPhase, isKo: boolean): string => {
  if (phase === 'exceptions') {
    return isKo
      ? '오늘 특별히 언급하고 싶은 학생이 있나요? 잘한 점이나 도움이 필요한 점을 이름과 함께 말씀해 주세요. 없으면 "없음"이라고 말씀하시거나 건너뛰기를 눌러주세요.'
      : "Any students who stood out today — good or needing extra support? Say their name and what happened, or say “none” if there's nothing to add.";
  }
  return isKo
    ? '오늘 수업에 대해 말씀해 주세요 — 주제, 교재, 수업 분위기, 활동 내용을 포함해서요.'
    : "Tell me about today's class — what topic and textbook did you use, how was the energy, and what activities did you do?";
};

const phaseLabel = (phase: ConversationPhase, isKo: boolean): string => {
  if (phase === 'exceptions') return isKo ? '학생 노트' : 'Student Notes';
  return isKo ? '수업 일반 노트' : 'General Notes';
};

export const VoiceFillAssistant: React.FC<Props> = ({
  isNight = true,
  currentFields,
  onFieldsUpdate,
  onExceptionsAdd,
  onClose,
}) => {
  const { language } = useLanguage();
  const isKo = language === 'ko';
  const [state, setState] = useState<RecorderState>('idle');
  const [history, setHistory] = useState<VoiceFillTurn[]>([]);
  const [phase, setPhase] = useState<ConversationPhase>('general');
  // Counts completed turns within the CURRENT phase — caps phase 'general'
  // at one initial turn + one combined follow-up, never a per-field loop.
  const [generalTurnCount, setGeneralTurnCount] = useState(0);
  const [prompt, setPrompt] = useState(() => phaseOpenPrompt('general', isKo));
  const [error, setError] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);
  // A turn's result sits here, unapplied, until the teacher explicitly
  // confirms it — nothing writes into the real form fields on its own.
  const [pendingResult, setPendingResult] = useState<VoiceFillResponse | null>(null);
  const [showPrivacyBanner, setShowPrivacyBanner] = useState(
    () => typeof window === 'undefined' || localStorage.getItem(PRIVACY_BANNER_DISMISSED_KEY) !== 'true'
  );

  const dismissPrivacyBanner = () => {
    setShowPrivacyBanner(false);
    try {
      localStorage.setItem(PRIVACY_BANNER_DISMISSED_KEY, 'true');
    } catch {
      // Best-effort — if storage is unavailable the banner just reappears next time, not a functional problem.
    }
  };

  const fieldLabels: Record<string, { ko: string; en: string }> = {
    lessonTopic: { ko: '수업 주제', en: 'Lesson Topic' },
    textbook: { ko: '교재', en: 'Textbook' },
    energyLevel: { ko: '수업 분위기', en: 'Energy Level' },
    activities: { ko: '활동', en: 'Activities' },
    generalComments: { ko: '수업 코멘트', en: 'Comments' },
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const fieldsRef = useRef<VoiceFillFields>(currentFields);
  fieldsRef.current = currentFields;

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        void processTurn(blob);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setState('recording');
    } catch (err) {
      console.warn('Voice fill: microphone access failed', err);
      setError(
        language === 'ko'
          ? '마이크 권한이 필요합니다. 수동으로 입력해 주세요.'
          : 'Microphone access is needed. Please fill the form manually instead.'
      );
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setState('processing');
  };

  const processTurn = async (blob: Blob) => {
    try {
      const result = await callVoiceLogFill(blob, history, fieldsRef.current, language, phase);
      // Hold for explicit confirmation rather than applying immediately —
      // the teacher needs a chance to catch a mis-transcription before it
      // lands in the actual form fields.
      setPendingResult(result);
    } catch (err) {
      console.warn('Voice fill: turn failed', err);
      setError(
        language === 'ko'
          ? '음성 처리 중 문제가 발생했어요. 다시 시도하거나 수동으로 입력해 주세요.'
          : 'Something went wrong processing that. Try again, or fill the field manually.'
      );
    } finally {
      setState('idle');
    }
  };

  const doneCopy = () =>
    isKo
      ? '필요한 항목을 모두 입력했어요! 아래에서 확인 후 제출해 주세요.'
      : 'Got everything needed! Review below and submit whenever you’re ready.';

  const confirmPendingResult = () => {
    if (!pendingResult) return;
    // Backend guarantees an object here (api/analyze.ts rejects malformed/
    // safety-filtered responses with a proper error before this resolves),
    // but this crosses a network boundary from an external LLM call —
    // worth a defensive fallback rather than trusting the shape blindly.
    const updatedFields = pendingResult.updatedFields || {};
    const newExceptions = pendingResult.newExceptions || [];

    onFieldsUpdate(updatedFields);
    if (newExceptions.length > 0) onExceptionsAdd(newExceptions);
    setHistory((prev) => [
      ...prev,
      { role: 'user', text: pendingResult.transcript || '' },
      { role: 'model', text: pendingResult.assistantReplyForHistory || '' },
    ]);
    setPendingResult(null);

    if (phase === 'exceptions') {
      // Exactly one round in this phase — the backend is instructed to
      // always close it (empty nextQuestion), so there's nothing to loop on.
      setIsDone(true);
      setPrompt(doneCopy());
      return;
    }

    // phase === 'general': allow at most one combined follow-up, never a
    // per-field loop — cap enforced here, not left to the model's judgment.
    const turnsSoFar = generalTurnCount + 1;
    setGeneralTurnCount(turnsSoFar);

    if (pendingResult.nextQuestion && turnsSoFar < 2) {
      setPrompt(pendingResult.nextQuestion);
      setIsDone(false);
      return;
    }

    // Move on to student notes — any still-missing general fields are left
    // for the visible manual form fields rather than a third voice turn.
    setPhase('exceptions');
    setHistory([]);
    setIsDone(false);
    setPrompt(phaseOpenPrompt('exceptions', isKo));
  };

  const redoPendingResult = () => {
    // Discard — nothing was applied, so there's nothing to undo. The
    // prompt/history stay exactly as they were before this turn.
    setPendingResult(null);
  };

  // "No exceptions" — bypasses the API entirely: nothing to transcribe or
  // review, so no confirm card, just a direct, deterministic finish. Cheaper
  // and more reliable than a spoken "none" round trip for a teacher who'd
  // rather just tap.
  const skipExceptions = () => {
    setIsDone(true);
    setPrompt(doneCopy());
  };

  return (
    <div
      className={`mb-6 p-4 sm:p-5 rounded-2xl border shadow-xl space-y-3 ${
        isNight ? 'bg-orange-500/5 border-orange-500/30' : 'bg-orange-50 border-orange-200'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono flex items-center gap-1.5">
          <Sparkle size={14} weight="fill" />
          {language === 'ko' ? '음성으로 입력하기' : 'Fill by voice'}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={language === 'ko' ? '닫기' : 'Close'}
          className="min-w-9 min-h-9 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
        >
          <X size={16} />
        </button>
      </div>

      {showPrivacyBanner && (
        <div
          className={`p-2.5 rounded-xl border flex items-center gap-2 text-[11px] ${
            isNight ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
          }`}
        >
          <ShieldCheck size={16} weight="fill" className="shrink-0" />
          <span className="flex-1">
            {language === 'ko'
              ? '음성은 저장되지 않습니다 — 처리 후 즉시 삭제됩니다.'
              : "Your voice is never saved — it's discarded right after processing."}
          </span>
          <button
            type="button"
            onClick={dismissPrivacyBanner}
            aria-label={language === 'ko' ? '배너 닫기' : 'Dismiss'}
            className="shrink-0 min-w-9 min-h-9 flex items-center justify-center rounded-lg hover:bg-black/10 transition-colors cursor-pointer"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <div key={prompt} className="animate-fade-in-up">
        <span className="text-[10px] font-bold uppercase tracking-widest text-orange-400 block mb-1.5">
          {phaseLabel(phase, isKo)}
        </span>
        <p
          className={`text-sm leading-relaxed rounded-2xl p-3 ${
            isNight ? 'bg-white/5 text-zinc-200' : 'bg-zinc-100 text-zinc-800'
          }`}
        >
          {prompt}
        </p>
      </div>

      {error && (
        <div role="status" aria-live="assertive">
          <p className="text-xs text-red-400 font-medium">{error}</p>
        </div>
      )}

      {pendingResult ? (
        <div className="space-y-3">
          <div className={`p-3 rounded-xl border text-xs space-y-1.5 ${isNight ? 'bg-black/20 border-white/10' : 'bg-white border-orange-200'}`}>
            <p className={`italic ${isNight ? 'text-zinc-400' : 'text-zinc-600'}`}>
              {language === 'ko' ? '들은 내용: ' : 'Heard: '}&ldquo;{pendingResult.transcript || (language === 'ko' ? '(내용 없음)' : '(nothing heard)')}&rdquo;
            </p>
            {(() => {
              const changedKeys = Object.keys(pendingResult.updatedFields || {}).filter(
                (k) => (pendingResult.updatedFields as Record<string, unknown>)[k]
              );
              const exceptions = pendingResult.newExceptions || [];
              if (changedKeys.length === 0 && exceptions.length === 0) {
                return (
                  <p className="text-amber-400 font-bold">
                    {language === 'ko' ? '인식된 항목이 없습니다.' : "Didn't catch any fields from that."}
                  </p>
                );
              }
              return (
                <>
                  {changedKeys.length > 0 && (
                    <p className="text-emerald-400 font-bold">
                      {language === 'ko' ? '입력 예정: ' : 'Will fill in: '}
                      {changedKeys.map((k) => fieldLabels[k]?.[language === 'ko' ? 'ko' : 'en'] || k).join(', ')}
                    </p>
                  )}
                  {exceptions.length > 0 && (
                    <p className="text-amber-400 font-bold">
                      {language === 'ko' ? '학생 플래그 예정: ' : 'Will flag: '}
                      {exceptions
                        .map((ex) => `${ex.studentName} (${ex.category === 'praise' ? (language === 'ko' ? '칭찬' : 'praise') : (language === 'ko' ? '주의' : 'attention')})`)
                        .join(', ')}
                    </p>
                  )}
                </>
              );
            })()}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={redoPendingResult}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 ${
                isNight ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10' : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:bg-zinc-200'
              }`}
            >
              <ArrowCounterClockwise size={14} weight="bold" />
              {language === 'ko' ? '다시 말하기' : 'Redo'}
            </button>
            <button
              type="button"
              onClick={confirmPendingResult}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95"
            >
              <Check size={14} weight="bold" />
              {language === 'ko' ? '이대로 입력' : 'Use this'}
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-center py-2">
            <VoiceOrb
              state={error ? 'error' : state === 'recording' ? 'listening' : state === 'processing' ? 'processing' : 'idle'}
              onClick={state === 'recording' ? stopRecording : startRecording}
              disabled={state === 'processing'}
              isNight={isNight}
              ariaLabel={
                state === 'recording'
                  ? language === 'ko' ? '녹음 중지' : 'Stop recording'
                  : language === 'ko' ? '녹음 시작' : 'Start recording'
              }
            />
          </div>

          {phase === 'exceptions' && state === 'idle' && !isDone && (
            <button
              type="button"
              onClick={skipExceptions}
              className={`w-full py-2 rounded-xl text-xs font-bold border cursor-pointer transition-all active:scale-[0.97] ${
                isNight ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white' : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:text-zinc-900'
              }`}
            >
              {isKo ? '해당 없음 (건너뛰기)' : 'No exceptions — skip'}
            </button>
          )}

          <div role="status" aria-live="polite">
            <p className="text-[11px] text-center font-mono text-zinc-400">
              {state === 'recording'
                ? language === 'ko'
                  ? '녹음 중... 다시 눌러 종료'
                  : 'Recording... tap again to stop'
                : state === 'processing'
                ? language === 'ko'
                  ? '처리 중...'
                  : 'Processing...'
                : isDone
                ? language === 'ko'
                  ? '완료! 더 추가하려면 다시 눌러주세요.'
                  : 'Done! Tap again to add more.'
                : language === 'ko'
                ? '눌러서 말하기'
                : 'Tap to speak'}
            </p>
          </div>
        </>
      )}
    </div>
  );
};
