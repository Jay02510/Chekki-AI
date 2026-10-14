import React, { useState, useEffect, useRef } from 'react';
import { Sparkle, Plus, X, Check, UserPlus, Lock, FloppyDisk, Microphone, PencilSimple } from '@phosphor-icons/react';
import { ClassLogPayload, saveOfflineDraft, getOfflineDraft, clearOfflineDraft } from '../services/aiGenerator';
import { VoiceFillException, VoiceFillFields } from '../services/voiceFill';
import { UserProfile } from '../../types';
import { VoiceFillAssistant } from './VoiceFillAssistant';
import { staffUi } from './staffUi';
import { localDate } from '../utils/localDate';

interface Props {
  isNight?: boolean;
  /** Falls back to the stored language when omitted (landing demo). */
  isKo?: boolean;
  /** Returns true once the log is safely queued, which clears the form. */
  onSubmitLog: (payload: ClassLogPayload) => boolean | void;
  userProfile?: UserProfile | null;
  selectedClassName?: string;
  selectedTextbookName?: string;
  /** This week's saved curriculum topic, if any — prefills Lesson Topic so
   * voice-fill/manual entry don't ask for something already scanned in via
   * the Syllabus tab. */
  selectedLessonTopic?: string;
  /** Real, approved students in the active class, plus students invited but
   * not yet redeemed (isPending) — empty until the roster loads or has no
   * one yet. */
  roster?: { uid: string; name: string; isPending?: boolean }[];
  /** False when the active class is the client-only sample/preview
   * placeholder (no real class assigned yet) — the locked class field then
   * says "Preview" instead of "Synced", since nothing is actually synced
   * to the cloud yet. Defaults true so existing real-class callers are
   * unaffected. */
  isRealClassSynced?: boolean;
  /** Public marketing/demo showcase only. Never true for a real, authenticated teacher session. */
  isDemo?: boolean;
  /** Landing-page demo only: shows the mic button and plays a canned,
   * pre-scripted voice-fill sequence on tap instead of mounting the real
   * VoiceFillAssistant. Never triggers getUserMedia or /api/analyze — the
   * real component does both, and wiring that live for anonymous public
   * traffic on a marketing page would be free, unauthenticated API access. */
  demoScripted?: boolean;
}

// Textbook rarely changes day to day for a class — prefill from the last
// submitted log when the class has no curriculum textbook set.
const LAST_TEXTBOOK_KEY = 'chekki_last_textbook_';
const readLastTextbook = (cls?: string) => {
  if (!cls) return '';
  try {
    return localStorage.getItem(LAST_TEXTBOOK_KEY + cls) || '';
  } catch {
    return '';
  }
};

const SCRIPTED_VOICE_FILL: VoiceFillFields = {
  lessonTopic: 'Unit 4: Photosynthesis & Plant Growth',
  textbook: 'Bricks Reading 150 (Book 1)',
  energyLevel: 'High Energy and Engaged',
  activities: ['Reading', 'Speaking', 'Worksheet'],
  generalComments: 'Students engaged very enthusiastically with the new plant vocabulary drill. Everyone read aloud clearly.',
};

export interface LogException {
  studentName: string;
  studentUid?: string | null;
  details: string;
  type?: 'praise' | 'attention';
  // A roster name close-but-not-exact to a voice-transcribed name — surfaced
  // as a "did you mean X?" prompt rather than silently either dropping the
  // match or guessing wrong. Cleared once the FT/KT confirms or dismisses it.
  suggestedMatch?: { uid: string; name: string } | null;
}

// Small edit-distance matcher for voice-transcribed names against the
// roster — no fuzzy/similarity library exists anywhere else in this
// codebase (confirmed by search), so this is deliberately minimal rather
// than a new dependency. Case-insensitive, ASCII+Hangul safe since it just
// compares code units.
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prevDiag = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1]
        ? prevDiag
        : 1 + Math.min(prevDiag, dp[j], dp[j - 1]);
      prevDiag = temp;
    }
  }
  return dp[n];
}

// Closest roster match within a small edit-distance budget (scaled to name
// length so short names don't match too loosely) — used only as a
// suggestion, never auto-applied, since a wrong auto-match would silently
// attach a note to the wrong kid.
function findClosestRosterMatch(
  name: string,
  roster: { uid: string; name: string }[]
): { uid: string; name: string } | null {
  const target = name.trim().toLowerCase();
  if (!target) return null;
  let best: { uid: string; name: string } | null = null;
  let bestDistance = Infinity;
  for (const s of roster) {
    const distance = levenshteinDistance(target, s.name.trim().toLowerCase());
    if (distance < bestDistance) {
      bestDistance = distance;
      best = s;
    }
  }
  const budget = Math.max(1, Math.floor(target.length * 0.3));
  return best && bestDistance > 0 && bestDistance <= budget ? best : null;
}

const DEMO_CLASS_NAME = 'Apex Seocho 7A';
const DEMO_LESSON_TOPIC = 'Unit 4: Photosynthesis & Plant Growth';
const DEMO_TEXTBOOK = 'Bricks Reading 150 (Book 1)';
const DEMO_ENERGY_LEVEL = 'High Energy and Engaged';
const DEMO_ACTIVITIES = ['Reading', 'Speaking', 'Worksheet'];
const DEMO_ROSTER: { uid: string; name: string; isPending?: boolean }[] = [
  { uid: 'demo-jiwoo', name: 'Ji-woo (지우)' },
  { uid: 'demo-minjun', name: 'Min-jun (민준)' },
  { uid: 'demo-chloe', name: 'Chloe (클로이)' },
  { uid: 'demo-seoyun', name: 'Seo-yun (서윤)' },
];
const DEMO_COMMENTS = 'Students engaged very enthusiastically with the new plant vocabulary drill. Everyone read aloud clearly.';
const DEMO_EXCEPTIONS: LogException[] = [
  {
    studentName: 'Seo-yeon (서연)',
    studentUid: null,
    details: 'Outstanding participation! Led the vocabulary team quiz and helped classmates with pronunciation.',
    type: 'praise',
  },
  {
    studentName: 'Min-jun (민준)',
    studentUid: 'demo-minjun',
    details: 'Struggled with target word "Chloroplast" and needs 5-minute review at home.',
    type: 'attention',
  },
];

export const NativeTeacherLogForm: React.FC<Props> = ({
  isNight = true,
  isKo: isKoProp,
  onSubmitLog,
  userProfile,
  selectedClassName,
  selectedTextbookName,
  selectedLessonTopic,
  roster = [],
  isRealClassSynced = true,
  isDemo = false,
  demoScripted = false,
}) => {
  // This form is submitted by KTs too (see generateGeneralClassSummary's
  // authorRole === 'kt' branch in api/analyze.ts), not just FTs — it needs
  // Korean labels for that audience.
  const isKo = isKoProp ?? (typeof window !== 'undefined' && localStorage.getItem('chekki_lang') === 'ko');
  const effectiveRoster = roster.length > 0 ? roster : (isDemo ? DEMO_ROSTER : []);
  const [className, setClassName] = useState(selectedClassName || (isDemo ? DEMO_CLASS_NAME : ''));
  const [date, setDate] = useState(() => localDate());
  const [lessonTopic, setLessonTopic] = useState(isDemo ? DEMO_LESSON_TOPIC : (selectedLessonTopic || ''));
  const [textbook, setTextbook] = useState(
    () => selectedTextbookName || (isDemo ? DEMO_TEXTBOOK : readLastTextbook(selectedClassName)),
  );
  const [energyLevel, setEnergyLevel] = useState<string>(isDemo ? DEMO_ENERGY_LEVEL : '');

  useEffect(() => {
    if (selectedClassName) setClassName(selectedClassName);
  }, [selectedClassName]);

  useEffect(() => {
    if (selectedTextbookName) setTextbook(selectedTextbookName);
  }, [selectedTextbookName]);

  useEffect(() => {
    if (selectedLessonTopic) setLessonTopic(selectedLessonTopic);
  }, [selectedLessonTopic]);
  const [activities, setActivities] = useState<string[]>(isDemo ? DEMO_ACTIVITIES : []);
  const [generalComments, setGeneralComments] = useState(isDemo ? DEMO_COMMENTS : '');

  // Offline Draft Notification State
  const [hasDraftRestored, setHasDraftRestored] = useState(false);

  // Voice is the default way in — the form below doubles as its review
  // screen. "Type instead" closes it.
  const [showVoiceFill, setShowVoiceFill] = useState(!isDemo);
  // Remounts the voice panel after a submit so last class's "Heard:" clears.
  const [voiceFillKey, setVoiceFillKey] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const [isPlayingScriptedVoiceFill, setIsPlayingScriptedVoiceFill] = useState(false);

  const playScriptedVoiceFill = () => {
    if (isPlayingScriptedVoiceFill) return;
    setIsPlayingScriptedVoiceFill(true);
    window.setTimeout(() => {
      handleVoiceFieldsUpdate(SCRIPTED_VOICE_FILL);
      setIsPlayingScriptedVoiceFill(false);
    }, 1400);
  };

  // responseSchema on the backend constrains JSON *shape*, not string
  // *content* — the server already strips values that look like leaked JSON
  // (api/analyze.ts, handleVoiceLogFillTask), but this is a second, cheap
  // backstop on the client so a value that slips past that check (or a future
  // code path that skips it) still can't silently land in the form.
  const looksLikeLeakedJson = (value: unknown): boolean =>
    typeof value === 'string' && /"\s*:\s*"/.test(value);

  // lessonTopic/textbook are short structured fields — a 200+ char value is
  // itself a sign something went wrong upstream. generalComments is the one
  // field meant to hold a long dictated note, so it only goes through the
  // leaked-JSON shape check, not a length cap (a legitimately long voice-fill
  // comment used to be silently dropped here with no indication to the
  // teacher — audit: Low-Medium finding).
  const looksLikeLeakedShortField = (value: unknown): boolean =>
    looksLikeLeakedJson(value) || (typeof value === 'string' && value.length > 200);

  const handleVoiceFieldsUpdate = (fields: VoiceFillFields | null | undefined) => {
    if (!fields) return;
    if (fields.lessonTopic && !looksLikeLeakedShortField(fields.lessonTopic)) setLessonTopic(fields.lessonTopic);
    if (fields.textbook && !looksLikeLeakedShortField(fields.textbook)) setTextbook(fields.textbook);
    if (fields.energyLevel) setEnergyLevel(fields.energyLevel);
    if (fields.activities && fields.activities.length > 0) setActivities(fields.activities);
    if (fields.generalComments && !looksLikeLeakedJson(fields.generalComments)) setGeneralComments(fields.generalComments);
  };

  // Student Spotlight & Exception Modal State (Praise & Attention)
  const [exceptions, setExceptions] = useState<LogException[]>(
    isDemo ? DEMO_EXCEPTIONS : []
  );

  // Clear class-specific form state when the FT switches which class is
  // active mid-log — previously only className/textbook/lessonTopic
  // re-synced, so exceptions (which carry studentUids from whichever
  // roster was active when they were flagged) survived a class switch and
  // could be submitted against the wrong class's log (Audit: exception
  // carried into wrong class on switch). Skipped on the very first mount —
  // this only fires on an actual change, not the initial value.
  const prevClassNameRef = useRef(selectedClassName);
  useEffect(() => {
    if (isDemo) return;
    if (prevClassNameRef.current === selectedClassName) return;
    prevClassNameRef.current = selectedClassName;
    setActivities([]);
    setEnergyLevel('');
    setGeneralComments('');
    setExceptions([]);
  }, [selectedClassName, isDemo]);

  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [modalStudentUid, setModalStudentUid] = useState(effectiveRoster[0]?.uid || '');
  const [modalCategory, setModalCategory] = useState<'praise' | 'attention'>('praise');
  const [isCustomStudentName, setIsCustomStudentName] = useState(effectiveRoster.length === 0);
  const [customStudentInput, setCustomStudentInput] = useState('');
  const [modalDetails, setModalDetails] = useState('');
  // null = adding a new exception; a number = editing exceptions[idx] in place.
  const [editingExceptionIndex, setEditingExceptionIndex] = useState<number | null>(null);

  // Restore an unsaved draft on mount. saveOfflineDraft() has been writing
  // every field change to localStorage all along, but nothing ever read it
  // back — a crash or accidental reload silently threw away whatever the
  // teacher had typed/spoken so far. Only class/lessonTopic/textbook can
  // still be overridden by the selectedClassName/selectedTextbookName/
  // selectedLessonTopic prop-prefill effects above (intentional — fresh
  // class/curriculum data should always win over a stale draft for those).
  useEffect(() => {
    if (isDemo) return;
    const draft = getOfflineDraft();
    if (!draft) return;
    // Textbook and a curriculum-matching topic are prefills, not typing —
    // counting them showed "draft restored" on every visit after a submit.
    const hasContent =
      (draft.lessonTopic && draft.lessonTopic !== selectedLessonTopic) || draft.energyLevel ||
      (draft.activities && draft.activities.length > 0) ||
      draft.generalComments || (draft.exceptions && draft.exceptions.length > 0);
    if (!hasContent) return;
    // The autosaved draft is a single global localStorage key, not scoped
    // per class — this form remounts every time its parent tab unmounts it
    // (e.g. switching to Insights and back), and a stale draft from a
    // DIFFERENT class than the one now active would otherwise silently
    // overwrite className/exceptions here, with the UI still showing the
    // (correct) selectedClassName prop elsewhere — the submitted log's
    // exceptions end up tied to the wrong class's roster (audit: log
    // submitted under wrong class after a mid-session class switch). Only
    // restore when the draft actually belongs to the class currently active.
    if (selectedClassName && draft.className && draft.className !== selectedClassName) {
      return;
    }
    if (draft.className) setClassName(draft.className);
    if (draft.date) setDate(draft.date);
    if (draft.lessonTopic) setLessonTopic(draft.lessonTopic);
    if (draft.textbook) setTextbook(draft.textbook);
    if (draft.energyLevel) setEnergyLevel(draft.energyLevel);
    if (draft.activities && draft.activities.length > 0) setActivities(draft.activities);
    if (draft.generalComments) setGeneralComments(draft.generalComments);
    if (draft.exceptions && draft.exceptions.length > 0) setExceptions(draft.exceptions);
    setHasDraftRestored(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const discardRestoredDraft = () => {
    clearOfflineDraft();
    setHasDraftRestored(false);
    setLessonTopic(selectedLessonTopic || '');
    setTextbook(selectedTextbookName || '');
    setEnergyLevel('');
    setActivities([]);
    setGeneralComments('');
    setExceptions([]);
  };

  const handleOpenAddModal = () => {
    setEditingExceptionIndex(null);
    setModalCategory('praise');
    setModalDetails('');
    setCustomStudentInput('');
    setIsCustomStudentName(effectiveRoster.length === 0);
    setModalStudentUid(effectiveRoster[0]?.uid || '');
    setShowExceptionModal(true);
  };

  const handleEditException = (idx: number) => {
    const ex = exceptions[idx];
    const rosterMatch = ex.studentUid ? effectiveRoster.find((s) => s.uid === ex.studentUid) : undefined;
    setIsCustomStudentName(!rosterMatch);
    if (rosterMatch) setModalStudentUid(rosterMatch.uid);
    else setCustomStudentInput(ex.studentName);
    setModalCategory(ex.type || 'praise');
    // Strip the ⭐/⚠️ prefix older saved highlights carry so editing and
    // re-saving doesn't stack a second prefix onto the same note.
    setModalDetails(ex.details.replace(/^(⭐|⚠️)\s*/, ''));
    setEditingExceptionIndex(idx);
    setShowExceptionModal(true);
  };

  // Voice results land in the form immediately; this keeps one step of undo.
  // Read through a ref so a turn that finishes after the teacher typed
  // something snapshots what's actually on screen, not a stale render.
  const formStateRef = useRef({ lessonTopic, textbook, energyLevel, activities, generalComments, exceptions });
  formStateRef.current = { lessonTopic, textbook, energyLevel, activities, generalComments, exceptions };
  const undoSnapshotRef = useRef<typeof formStateRef.current | null>(null);

  const handleVoiceApply = (fields: VoiceFillFields, newExceptions: VoiceFillException[]) => {
    undoSnapshotRef.current = formStateRef.current;
    handleVoiceFieldsUpdate(fields);
    if (newExceptions.length > 0) handleVoiceExceptionsAdd(newExceptions);
  };

  const handleVoiceUndo = () => {
    const snap = undoSnapshotRef.current;
    if (!snap) return;
    setLessonTopic(snap.lessonTopic);
    setTextbook(snap.textbook);
    setEnergyLevel(snap.energyLevel);
    setActivities(snap.activities);
    setGeneralComments(snap.generalComments);
    setExceptions(snap.exceptions);
    undoSnapshotRef.current = null;
  };

  const handleVoiceExceptionsAdd = (newExceptions: VoiceFillException[]) => {
    setExceptions((prev) => [
      ...prev,
      ...newExceptions.map((ex): LogException => {
        // Voice transcription can't produce a uid directly — best-effort
        // match against the roster by exact name so a spoken exception for
        // a known student gets their note in the app; unmatched names
        // fall back to standalone (studentUid: null), same as a custom-typed
        // name. When no exact match exists, try a closest-match suggestion
        // instead of just silently discarding the connection — a misheard
        // "Ji-woo" transcribed as "Jiu" would otherwise create its own
        // disconnected entry with no path back to the real student.
        const exactMatch = effectiveRoster.find(
          (s) => s.name.trim().toLowerCase() === ex.studentName.trim().toLowerCase()
        );
        const suggestedMatch = !exactMatch ? findClosestRosterMatch(ex.studentName, effectiveRoster) : null;
        return {
          studentName: ex.studentName,
          studentUid: exactMatch?.uid ?? null,
          details: ex.details,
          type: ex.category,
          suggestedMatch,
        };
      }),
    ]);
  };

  // Roster loads asynchronously after this form mounts (class fetch on
  // TeacherPage). Once real names arrive, switch off custom-name mode and
  // seed a valid selection instead of leaving the dropdown pointed at
  // whatever was available (or nothing) at mount time.
  useEffect(() => {
    if (effectiveRoster.length === 0) {
      setIsCustomStudentName(true);
      return;
    }
    setIsCustomStudentName(false);
    setModalStudentUid((prev) => (effectiveRoster.some((s) => s.uid === prev) ? prev : effectiveRoster[0].uid));
  }, [effectiveRoster.map((s) => s.uid).join('|')]);


  // Auto-save offline draft to localStorage on change
  useEffect(() => {
    saveOfflineDraft({
      className,
      date,
      lessonTopic,
      textbook,
      energyLevel,
      activities,
      generalComments,
      exceptions,
    });
  }, [className, date, lessonTopic, textbook, energyLevel, activities, generalComments, exceptions]);

  // Values stay English (saved to Firestore, matched against DEMO_* constants
  // and the AI prompt) — only the on-screen label is translated, via the
  // lookup maps below.
  const energyOptions = [
    'High Energy and Engaged',
    'Focused and Quiet',
    'A bit distracted',
  ];
  const energyOptionLabelsKo: Record<string, string> = {
    'High Energy and Engaged': '활기차고 적극적',
    'Focused and Quiet': '집중하고 차분함',
    'A bit distracted': '다소 산만함',
  };
  // The option values are stored on the log; these are display labels only.
  const energyOptionLabelsEn: Record<string, string> = {
    'High Energy and Engaged': 'High energy, engaged',
    'Focused and Quiet': 'Focused and quiet',
    'A bit distracted': 'A bit distracted',
  };

  const activityOptions = ['Reading', 'Speaking', 'Writing', 'Worksheet', 'Game', 'Test'];
  const activityOptionLabelsKo: Record<string, string> = {
    Reading: '읽기',
    Speaking: '말하기',
    Writing: '쓰기',
    Worksheet: '워크시트',
    Game: '게임',
    Test: '테스트',
  };

  const toggleActivity = (act: string) => {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleRemoveException = (idx: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleConfirmSuggestedMatch = (idx: number) => {
    setExceptions((prev) =>
      prev.map((ex, i) =>
        i === idx && ex.suggestedMatch
          ? { ...ex, studentName: ex.suggestedMatch.name, studentUid: ex.suggestedMatch.uid, suggestedMatch: null }
          : ex
      )
    );
  };

  const handleDismissSuggestedMatch = (idx: number) => {
    setExceptions((prev) => prev.map((ex, i) => (i === idx ? { ...ex, suggestedMatch: null } : ex)));
  };

  const isRealLogIncomplete =
    !isDemo && (!className.trim() || !lessonTopic.trim() || !textbook.trim());

  const missingFieldLabels = isDemo
    ? []
    : [
        !className.trim() && (isKo ? '학급명' : 'Class Name'),
        !lessonTopic.trim() && (isKo ? '수업 주제' : 'Lesson Topic'),
        !textbook.trim() && (isKo ? '교재' : 'Textbook'),
      ].filter((label): label is string => Boolean(label));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRealLogIncomplete) return;
    try {
      localStorage.setItem(LAST_TEXTBOOK_KEY + className, textbook);
    } catch {
      /* storage blocked — prefill is a convenience only */
    }
    // Clearing here ran synchronously before onSubmitLog's async work (AI
    // report generation, then the Firestore write) had even started — if
    // either step failed (network drop mid-submit) or the tab was
    // reloaded/killed while still in flight, the offline-draft recovery
    // copy was already gone with nothing to fall back on. onSubmitLog's
    // caller (TeacherPage.tsx's handleLogSubmit) now clears it itself, only
    // once the log has actually persisted.
    const accepted = onSubmitLog({
      className,
      date,
      lessonTopic,
      textbook,
      energyLevel,
      activities,
      generalComments,
      exceptions,
      enrolledStudentUids: effectiveRoster.map((s) => s.uid),
    });
    // Queued safely — clear for the next class. Class, date and textbook
    // usually carry over, so they stay.
    if (accepted && !isDemo) {
      setLessonTopic(selectedLessonTopic || '');
      setEnergyLevel('');
      setActivities([]);
      setGeneralComments('');
      setExceptions([]);
      setHasDraftRestored(false);
      undoSnapshotRef.current = null;
      setVoiceFillKey((k) => k + 1);
      rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      ref={rootRef}
      className="mx-auto w-full max-w-3xl scroll-mt-4 text-left text-ink"
    >
      <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="min-w-0 text-[26px] font-extrabold leading-tight tracking-[-0.02em] sm:text-[30px]">
          {isKo ? '오늘의 수업 기록' : "Today's class log"}
        </h2>
        {/* The open voice panel has its own "Type instead" close. */}
        {!isDemo && !showVoiceFill && (
          <button
            type="button"
            onClick={() => setShowVoiceFill(true)}
            className={staffUi.primaryBtn}
          >
            <Microphone size={16} weight="fill" />
            {isKo ? '음성으로 채우기' : 'Fill by voice'}
          </button>
        )}
        {isDemo && demoScripted && (
          <button
            type="button"
            onClick={playScriptedVoiceFill}
            disabled={isPlayingScriptedVoiceFill}
            className={`px-4 min-h-11 rounded-md flex items-center justify-center gap-2 text-sm font-extrabold transition-[background-color,transform] cursor-pointer active:scale-95 disabled:cursor-default ${
              isPlayingScriptedVoiceFill
                ? 'bg-line-soft text-line-ink animate-pulse'
                : 'bg-line hover:bg-line text-on-line'
            }`}
          >
            <Microphone size={16} weight="fill" />
            {isKo ? '음성으로 채우기 (체험)' : 'Fill by voice (demo)'}
          </button>
        )}
      </div>

      {/* Draft Restored Banner */}
      {hasDraftRestored && (
        <div className={`mb-6 p-3 rounded-lg border flex items-center gap-2.5 text-[14px] font-bold ${
          'bg-sunken border-rule text-ink-2'
        }`}>
          <FloppyDisk size={16} weight="fill" className="shrink-0" />
          <span className="flex-1">{isKo ? '저장하지 못했던 임시 기록을 불러왔어요.' : 'Restored your unsaved draft from last time.'}</span>
          <button
            type="button"
            onClick={discardRestoredDraft}
            className="shrink-0 underline hover:no-underline cursor-pointer"
          >
            {isKo ? '삭제' : 'Discard'}
          </button>
        </div>
      )}

      {/* Scripted Voice-Fill Listening Banner (demo only) */}
      {isDemo && demoScripted && isPlayingScriptedVoiceFill && (
        <div className="mb-6 p-3.5 bg-line-soft border border-rule rounded-lg flex items-center gap-2.5 text-[14px] font-bold text-line-ink">
          <Microphone size={18} weight="fill" className="animate-pulse text-line-ink shrink-0" />
          <span>{isKo ? '듣고 있어요… 말씀하신 수업 내용으로 양식을 채우고 있어요.' : 'Listening... filling the form from a spoken class recap.'}</span>
        </div>
      )}

      {/* Interactive Helper Banner */}
      {isDemo && (
        <div className="mb-6 p-3.5 bg-line-soft border border-rule rounded-lg flex items-center justify-between text-[14px] font-bold text-line-ink">
          <div className="flex items-center gap-2">
            <Sparkle size={18} weight="fill" className="animate-pulse text-line-ink shrink-0" />
            <span>{isKo ? '데모 미리보기: 아래 버튼을 클릭하고 주황색 버튼을 눌러 AI 학부모 대본 생성을 체험해보세요!' : 'Demo Preview: Click any buttons below & hit orange button to see how AI parent script generation works!'}</span>
          </div>
        </div>
      )}

      {!isDemo && showVoiceFill && (
        <VoiceFillAssistant
          key={voiceFillKey}
          isNight={isNight}
          currentFields={{ lessonTopic, textbook, energyLevel, activities, generalComments }}
          onApply={handleVoiceApply}
          onUndo={handleVoiceUndo}
          onClose={() => setShowVoiceFill(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class & Date */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="log-class-name" className={staffUi.label}>{isKo ? '학급명 *' : 'Class name *'}</label>
            {isDemo ? (
              <select
                id="log-class-name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className={staffUi.field}
              >
                <option value="Apex Seocho 7A">Apex Seocho 7A (Kindergarten 7yo)</option>
                <option value="Apex Seocho 6B">Apex Seocho 6B (Kindergarten 6yo)</option>
                <option value="Apex Seocho 5C">Apex Seocho 5C (Kindergarten 5yo)</option>
              </select>
            ) : (
              // Not a picker — always the same class you have active in the
              // top class switcher, on purpose (prevents logging against the
              // wrong class). It used to render as a <select> with exactly
              // one option, which looked broken since a dropdown implies
              // there should be more to pick from.
              <div className={`${staffUi.field} flex items-center justify-between gap-2 font-bold`}>
                <span className="min-w-0 truncate">{selectedClassName || (isKo ? '선택된 학급 없음' : 'No class selected')}</span>
                <span className="flex shrink-0 items-center gap-1 text-[13px] font-semibold text-ink-3">
                  <Lock size={12} weight="bold" />
                  {isRealClassSynced ? (isKo ? '동기화됨' : 'Synced') : (isKo ? '미리보기' : 'Preview')}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="log-date" className={staffUi.label}>{isKo ? '날짜 *' : 'Date *'}</label>
            <input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={staffUi.field}
            />
          </div>
        </div>

        {/* Lesson Topic & Textbook */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="log-lesson-topic" className={staffUi.label}>{isKo ? '수업 주제 *' : 'Lesson topic *'}</label>
            <input
              id="log-lesson-topic"
              type="text"
              required
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder={isKo ? '예: Unit 4: 광합성' : 'e.g. Unit 4: Photosynthesis'}
              className={staffUi.field}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="log-textbook" className={staffUi.label}>{isKo ? '교재 *' : 'Textbook *'}</label>
            <input
              id="log-textbook"
              type="text"
              required
              value={textbook}
              onChange={(e) => setTextbook(e.target.value)}
              placeholder={isKo ? '예: Bricks Reading 150' : 'e.g. Bricks Reading 150'}
              className={staffUi.field}
            />
          </div>
        </div>

        {/* General Class Comments — sits right under the topic: it's what
            the parent report is written from, so it comes before the
            optional one-tap chips. */}
        <div className="space-y-1.5">
          <label htmlFor="log-general-comments" className={staffUi.label}>{isKo ? '수업 코멘트' : 'Class comments'}</label>
          <textarea
            id="log-general-comments"
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            rows={3}
            aria-describedby="log-general-comments-hint"
            className={`${staffUi.field} py-3 leading-relaxed`}
            placeholder={isKo ? '예: leaf, root, stem을 배우고 짝과 그림 카드를 분류했어요.' : 'e.g. Learned leaf, root, stem. Sorted picture cards in pairs.'}
          />
          <p id="log-general-comments-hint" className="text-[13px] text-ink-3">
            {isKo ? '학부모 리포트는 이 메모로 써요. 한두 문장이면 충분해요.' : 'The parent report is written from this. One or two sentences is enough.'}
          </p>
        </div>

        {/* Class Energy Level */}
        <div className="space-y-2">
          <span id="log-energy-label" className={staffUi.label}>{isKo ? '수업 분위기 (선택)' : 'Class energy (optional)'}</span>
          <div role="group" aria-labelledby="log-energy-label" className="flex flex-wrap gap-2">
            {energyOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEnergyLevel((prev) => (prev === opt ? '' : opt))}
                aria-pressed={energyLevel === opt}
                className={`px-3.5 min-h-11 rounded-md border text-[14px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  energyLevel === opt
                    ? 'bg-line-soft border-line text-line-ink'
                    : 'bg-surface border-rule text-ink-2 hover:text-ink'
                }`}
              >
                <span>{isKo ? energyOptionLabelsKo[opt] : energyOptionLabelsEn[opt]}</span>
                {energyLevel === opt && <Check size={16} weight="bold" className="text-line-ink shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Activities Multi-Select */}
        <div className="space-y-2">
          <span id="log-activities-label" className={staffUi.label}>{isKo ? '오늘의 활동 (선택)' : 'Activities (optional)'}</span>
          <div role="group" aria-labelledby="log-activities-label" className="flex flex-wrap gap-2">
            {activityOptions.map((act) => {
              const active = activities.includes(act);
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleActivity(act)}
                  aria-pressed={active}
                  className={`px-3.5 min-h-11 rounded-md border text-[14px] font-bold transition-colors flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'bg-line-soft border-line text-line-ink'
                      : 'bg-surface border-rule text-ink-2 hover:text-ink'
                  }`}
                >
                  <span>{isKo ? activityOptionLabelsKo[act] : act}</span>
                  {active && <Check size={16} weight="bold" className="text-line-ink shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Student Exceptions Section */}
        <div className="space-y-3 pt-2 border-t border-rule">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <label className="block text-[15px] font-extrabold">
                {isKo ? '학생별 노트' : 'Student notes'}
              </label>
              <span className={staffUi.sub}>{isKo ? '학부모에게 따로 전할 내용이 있는 학생' : 'Students with something to tell their parents'}</span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className={staffUi.quietBtn}
            >
              <Plus size={14} weight="bold" />
              <span>{isKo ? '학생 추가' : 'Add student'}</span>
            </button>
          </div>

          {/* List of Flagged Exceptions */}
          {exceptions.length === 0 ? (
            <p className={`${staffUi.sub} py-2`}>{isKo ? '아직 추가한 학생이 없어요.' : 'No students added yet.'}</p>
          ) : (
            <div className="space-y-2">
              {exceptions.map((ex, idx) => (
                <div
                  key={idx}
                  className={`rounded-md border text-[14px] overflow-hidden ${
                    'bg-line-soft border-rule text-line-ink'
                  }`}
                >
                  <div className="p-3 flex items-start justify-between gap-3">
                    <div>
                      <span className="font-extrabold text-line-ink block">{ex.studentName}</span>
                      <p className="mt-0.5 leading-relaxed text-ink">{ex.details}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEditException(idx)}
                        aria-label={isKo ? '노트 수정' : 'Edit exception'}
                        className="min-w-11 min-h-11 flex items-center justify-center rounded bg-sunken hover:bg-line hover:text-on-line transition-colors cursor-pointer"
                      >
                        <PencilSimple size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveException(idx)}
                        aria-label={isKo ? '노트 삭제' : 'Remove exception'}
                        className="min-w-11 min-h-11 flex items-center justify-center rounded bg-sunken hover:bg-wrong hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                  {ex.suggestedMatch && (
                    <div className={`px-3 py-2 flex items-center justify-between gap-2 border-t text-[13px] font-bold ${
                      'bg-line-soft border-rule text-line-ink'
                    }`}>
                      <span>
                        {isKo
                          ? `혹시 "${ex.suggestedMatch.name}"을(를) 말씀하신 건가요? 음성 인식이 이름을 정확히 못 들었을 수 있어요.`
                          : `Did you mean "${ex.suggestedMatch.name}"? Voice input may not have caught the name exactly.`}
                      </span>
                      <span className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleConfirmSuggestedMatch(idx)}
                          className="px-2 py-1 rounded-lg bg-line hover:bg-line text-on-line cursor-pointer"
                        >
                          {isKo ? '확인' : 'Confirm'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissSuggestedMatch(idx)}
                          className="px-2 py-1 rounded-lg bg-sunken hover:bg-sunken cursor-pointer"
                        >
                          {isKo ? '무시' : 'Dismiss'}
                        </button>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
          {/* Inline student-note editor (was a pop-up modal — one more
              layer than a quick "Ji-woo did great" note needs). */}
          {showExceptionModal && (
          <div
            role="group"
            aria-labelledby="exception-modal-title"
            className="p-4 rounded-lg border space-y-4 bg-surface border-rule text-ink"
          >
            <div className="flex items-center justify-between border-b border-rule pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-line-ink" weight="bold" />
                <h3 id="exception-modal-title" className="font-extrabold text-base">
                  {editingExceptionIndex !== null
                    ? (isKo ? '학생 노트 수정' : 'Edit student note')
                    : (isKo ? '학생 노트 추가' : 'Add student note')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingExceptionIndex(null);
                  setShowExceptionModal(false);
                }}
                aria-label={isKo ? '닫기' : 'Close'}
                className="min-w-11 min-h-11 flex items-center justify-center rounded bg-sunken hover:bg-sunken transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Praise vs Attention Category Toggle */}
              <div className="space-y-1.5">
                <label className={staffUi.label}>{isKo ? '분류 선택 *' : 'Note type *'}</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCategory('praise')}
                    aria-pressed={modalCategory === 'praise'}
                    className={`min-h-11 px-3 rounded-md text-[14px] font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalCategory === 'praise'
                        ? 'bg-right-soft border-correct text-correct font-extrabold'
                        : 'bg-surface border-rule text-ink-2'
                    }`}
                  >
                    {modalCategory === 'praise' && <Check size={16} weight="bold" />}
                    <span>{isKo ? '칭찬' : 'Praise'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalCategory('attention')}
                    aria-pressed={modalCategory === 'attention'}
                    className={`min-h-11 px-3 rounded-md text-[14px] font-bold border transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalCategory === 'attention'
                        ? 'bg-line-soft border-line text-line-ink font-extrabold'
                        : 'bg-surface border-rule text-ink-2'
                    }`}
                  >
                    {modalCategory === 'attention' && <Check size={16} weight="bold" />}
                    <span>{isKo ? '주의 필요' : 'Needs attention'}</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="mb-1 flex items-center justify-between text-[13px] font-bold text-ink-3">
                  <label htmlFor="exception-student-field">{isKo ? '학생 *' : 'Student *'}</label>
                  {effectiveRoster.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomStudentName(!isCustomStudentName)}
                      className="min-h-11 text-[13px] font-bold text-line-ink hover:underline"
                    >
                      {isCustomStudentName
                        ? (isKo ? '명단에서 선택' : 'Pick from roster')
                        : (isKo ? '직접 입력' : 'Type a name')}
                    </button>
                  )}
                </div>

                {isCustomStudentName || effectiveRoster.length === 0 ? (
                  <input
                    id="exception-student-field"
                    type="text"
                    value={customStudentInput}
                    onChange={(e) => setCustomStudentInput(e.target.value)}
                    // Inline inside the log <form> now — Enter here must not submit the whole log.
                    onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
                    placeholder={isKo ? '학생 이름 입력 (예: David / 김다윗)...' : 'Enter student name (e.g. David / 김다윗)...'}
                    className={staffUi.field}
                  />
                ) : (
                  // One tap per name instead of a dropdown: a class roster is
                  // short enough to show whole.
                  <div id="exception-student-field" role="radiogroup" aria-label={isKo ? '학생' : 'Student'} className="flex flex-wrap gap-2">
                    {effectiveRoster.map((s) => (
                      <button
                        key={s.uid}
                        type="button"
                        role="radio"
                        aria-checked={modalStudentUid === s.uid}
                        onClick={() => setModalStudentUid(s.uid)}
                        className={`px-3.5 min-h-11 rounded-md border text-[14px] font-bold transition-colors cursor-pointer ${
                          modalStudentUid === s.uid
                            ? 'bg-line-soft border-line text-line-ink'
                            : 'bg-surface border-rule text-ink-2 hover:text-ink'
                        }`}
                      >
                        {s.name}{s.isPending ? (isKo ? ' (가입 대기)' : ' (pending)') : ''}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="exception-details-field" className={staffUi.label}>{isKo ? '세부 내용 *' : 'Details *'}</label>
                <textarea
                  id="exception-details-field"
                  value={modalDetails}
                  onChange={(e) => setModalDetails(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    isKo
                      ? (modalCategory === 'praise'
                          ? '긍정적인 성과를 설명하세요 (예: 퀴즈 만점, 훌륭한 발음, 친구를 도와줌)...'
                          : '주의가 필요한 부분을 설명하세요 (예: 숙제 미제출, 지각, 말하기 활동에서 소극적)...')
                      : (modalCategory === 'praise'
                          ? 'Describe positive milestone (e.g. 100% quiz score, excellent pronunciation, helped classmates)...'
                          : 'Explain focus issue (e.g. missing homework, tardy, hesitant during speaking drill)...')
                  }
                  className={`${staffUi.field} py-3 leading-relaxed`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingExceptionIndex(null);
                    setShowExceptionModal(false);
                  }}
                  className={`${staffUi.quietBtn} flex-1 min-h-11`}
                >
                  {isKo ? '취소' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const rosterMatch = !isCustomStudentName ? effectiveRoster.find((s) => s.uid === modalStudentUid) : undefined;
                    const chosenName = (isCustomStudentName ? customStudentInput : rosterMatch?.name) || (isKo ? '학생' : 'Student');
                    // No stand-in text for an empty note: it would reach a
                    // parent as an observation nobody made.
                    const detailText = modalDetails.trim();
                    if (!detailText) return;
                    // No emoji prefix: `type` already carries praise/concern, and the
                    // prefix leaked into FT history and parent notes.
                    const savedException = { studentName: chosenName, studentUid: rosterMatch?.uid ?? null, details: detailText, type: modalCategory };
                    if (editingExceptionIndex !== null) {
                      setExceptions((prev) => prev.map((ex, i) => (i === editingExceptionIndex ? savedException : ex)));
                    } else {
                      setExceptions((prev) => [...prev, savedException]);
                    }
                    setModalDetails('');
                    setCustomStudentInput('');
                    setEditingExceptionIndex(null);
                    setShowExceptionModal(false);
                  }}
                  disabled={!modalDetails.trim() || (isCustomStudentName && !customStudentInput.trim())}
                  className={`${staffUi.primaryBtn} flex-1`}
                >
                  {editingExceptionIndex !== null
                    ? (isKo ? '변경사항 저장' : 'Save changes')
                    : (isKo ? '저장' : 'Save note')}
                </button>
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Submit Button — sticky on phones, sitting just above the
            TeacherMobileTabBar, so it's reachable without scrolling the form. */}
        <div className="max-md:sticky max-md:bottom-[calc(env(safe-area-inset-bottom)+4rem)] max-md:z-20 space-y-2">
        <button
          type="submit"
          disabled={isRealLogIncomplete}
          className={`${staffUi.primaryBtn} min-h-12 w-full`}
        >
          <Sparkle size={18} weight="fill" />
          <span>
            {userProfile?.educatorRole === 'kt'
              ? (isKo ? '일지 저장' : 'Save log')
              : (isKo ? '한국인 교사에게 검토 요청' : 'Send to KT for review')}
          </span>
        </button>
        {missingFieldLabels.length > 0 && (
          <p className="text-center">
            <span className="inline-block rounded-md bg-surface px-3 py-1 text-[13px] font-bold text-line-ink">
              {isKo ? '누락된 항목: ' : 'Missing: '}{missingFieldLabels.join(', ')}
            </span>
          </p>
        )}
        </div>
      </form>

    </div>
  );
};
