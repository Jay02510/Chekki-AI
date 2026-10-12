import React, { useRef, useState } from 'react';
import { ArrowCounterClockwise, ShieldCheck, Sparkle, X } from '@phosphor-icons/react';
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
  /** Applies a turn's result straight into the form — the form below is the
   * review screen, so there's no separate confirm step. */
  onApply: (fields: VoiceFillFields, exceptions: VoiceFillException[]) => void;
  /** Reverts the most recent onApply. */
  onUndo: () => void;
  onClose: () => void;
}

type RecorderState = 'idle' | 'recording' | 'processing';

const FIELD_LABELS: Record<string, { ko: string; en: string }> = {
  lessonTopic: { ko: '수업 주제', en: 'topic' },
  textbook: { ko: '교재', en: 'textbook' },
  energyLevel: { ko: '수업 분위기', en: 'energy' },
  activities: { ko: '활동', en: 'activities' },
  generalComments: { ko: '수업 코멘트', en: 'comments' },
};

// One recording covers the whole log — class details and any students to
// mention. A follow-up only happens if a required field is still missing.
export const VoiceFillAssistant: React.FC<Props> = ({ isNight = true, currentFields, onApply, onUndo, onClose }) => {
  const { language } = useLanguage();
  const isKo = language === 'ko';
  const openPrompt = isKo
    ? '오늘 수업에 대해 말씀해 주세요 — 주제와 교재, 수업 분위기, 활동, 그리고 학부모께 전할 학생이 있다면 이름과 함께요.'
    : "Tell me about today's class — topic and textbook, how it went, what you did, and any students worth mentioning by name.";

  const [state, setState] = useState<RecorderState>('idle');
  const [history, setHistory] = useState<VoiceFillTurn[]>([]);
  const [prompt, setPrompt] = useState(openPrompt);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<VoiceFillResponse | null>(null);
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
      setError(isKo ? '마이크 권한이 필요합니다. 아래에 직접 입력해 주세요.' : 'Microphone access is needed. You can type in the form below instead.');
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setState('processing');
  };

  const processTurn = async (blob: Blob) => {
    try {
      const result = await callVoiceLogFill(blob, history, fieldsRef.current, language);
      // Backend guarantees an object here, but this crosses a network
      // boundary from an external LLM call — defensive fallbacks.
      onApply(result.updatedFields || {}, result.newExceptions || []);
      setHistory((prev) => [
        ...prev,
        { role: 'user', text: result.transcript || '' },
        { role: 'model', text: result.assistantReplyForHistory || '' },
      ]);
      setLastResult(result);
      setPrompt(result.nextQuestion || (isKo ? '아래 내용을 확인하고 보내주세요. 추가할 내용이 있으면 다시 눌러 말씀하세요.' : 'Check the form below and send. Tap again to add anything.'));
    } catch (err) {
      console.warn('Voice fill: turn failed', err);
      setError(isKo ? '음성 처리 중 문제가 발생했어요. 다시 시도하거나 아래에 직접 입력해 주세요.' : 'Something went wrong processing that. Try again, or type in the form below.');
    } finally {
      setState('idle');
    }
  };

  const undoLast = () => {
    onUndo();
    setHistory((prev) => prev.slice(0, -2));
    setLastResult(null);
    setPrompt(openPrompt);
  };

  const filledKeys = lastResult
    ? Object.keys(lastResult.updatedFields || {}).filter((k) => (lastResult.updatedFields as Record<string, unknown>)[k])
    : [];
  const addedStudents = lastResult?.newExceptions || [];

  return (
    <div
      className="mb-6 space-y-3 rounded-lg bg-surface p-5 ring-1 ring-inset ring-rule"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-[16px] font-extrabold">
          <Sparkle size={18} weight="fill" className="text-line-ink" aria-hidden="true" />
          {isKo ? '음성으로 입력하기' : 'Fill by voice'}
        </span>
        <button
          type="button"
          onClick={onClose}
          className="flex min-h-10 cursor-pointer items-center gap-1 rounded-md px-2 text-[14px] font-bold text-ink-2 hover:bg-sunken hover:text-ink"
        >
          {isKo ? '직접 입력' : 'Type instead'}
          <X size={14} />
        </button>
      </div>

      {showPrivacyBanner && (
        <div
          className="flex items-center gap-2 text-[13px] text-ink-3"
        >
          <ShieldCheck size={16} weight="fill" className="shrink-0 text-correct" aria-hidden="true" />
          <span className="flex-1">
            {isKo ? '음성은 저장되지 않습니다 — 처리 후 즉시 삭제됩니다.' : "Your voice is never saved — it's discarded right after processing."}
          </span>
          <button
            type="button"
            onClick={dismissPrivacyBanner}
            aria-label={isKo ? '배너 닫기' : 'Dismiss'}
            className="flex min-h-9 min-w-9 shrink-0 cursor-pointer items-center justify-center rounded-md hover:bg-sunken"
          >
            <X size={12} />
          </button>
        </div>
      )}

      <p
        key={prompt}
        className="animate-fade-in border-l-[3px] border-line pl-3 text-[15px] leading-relaxed text-ink"
      >
        {prompt}
      </p>

      {error && (
        <p role="status" aria-live="assertive" className="text-xs text-wrong font-medium">
          {error}
        </p>
      )}

      <div className="flex items-center justify-center py-2">
        <VoiceOrb
          state={error ? 'error' : state === 'recording' ? 'listening' : state === 'processing' ? 'processing' : 'idle'}
          onClick={state === 'recording' ? stopRecording : startRecording}
          disabled={state === 'processing'}
          isNight={isNight}
          ariaLabel={state === 'recording' ? (isKo ? '녹음 중지' : 'Stop recording') : (isKo ? '녹음 시작' : 'Start recording')}
        />
      </div>

      <p role="status" aria-live="polite" className="text-center text-[13px] text-ink-3">
        {state === 'recording'
          ? isKo ? '녹음 중... 다시 눌러 종료' : 'Recording... tap again to stop'
          : state === 'processing'
            ? isKo ? '처리 중...' : 'Processing...'
            : isKo ? '눌러서 말하기' : 'Tap to speak'}
      </p>

      {lastResult && state === 'idle' && (
        <div className="space-y-1.5 border-t border-rule pt-3 text-[14px]">
          <p className={`italic text-ink-2`}>
            {isKo ? '들은 내용: ' : 'Heard: '}&ldquo;{lastResult.transcript || (isKo ? '(내용 없음)' : '(nothing heard)')}&rdquo;
          </p>
          {filledKeys.length === 0 && addedStudents.length === 0 ? (
            <p className="text-line-ink font-bold">{isKo ? '인식된 항목이 없습니다. 다시 말씀해 주세요.' : "Didn't catch anything from that — try again."}</p>
          ) : (
            <p className="text-correct font-bold">
              {[
                filledKeys.length > 0 &&
                  (isKo ? '입력됨: ' : 'Filled in ') + filledKeys.map((k) => FIELD_LABELS[k]?.[isKo ? 'ko' : 'en'] || k).join(', '),
                addedStudents.length > 0 &&
                  (isKo ? `학생 노트 ${addedStudents.length}개 추가` : `added ${addedStudents.length} student note${addedStudents.length > 1 ? 's' : ''}`),
              ]
                .filter(Boolean)
                .join(' · ')}
            </p>
          )}
          <button
            type="button"
            onClick={undoLast}
            className={`min-h-9 flex items-center gap-1.5 font-bold cursor-pointer text-ink-2 hover:text-ink`}
          >
            <ArrowCounterClockwise size={14} weight="bold" />
            {isKo ? '되돌리기' : 'Undo'}
          </button>
        </div>
      )}
    </div>
  );
};
