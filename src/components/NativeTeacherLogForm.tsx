import React, { useState, useEffect } from 'react';
import { Sparkle, Plus, X, Check, UserPlus, Lock, FloppyDisk, Microphone, PencilSimple } from '@phosphor-icons/react';
import { ClassLogPayload, saveOfflineDraft, getOfflineDraft, clearOfflineDraft } from '../services/aiGenerator';
import { VoiceFillException, VoiceFillFields } from '../services/voiceFill';
import { UserProfile } from '../../types';
import { getPermissionsForUser } from '../utils/permissions';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { VoiceFillAssistant } from './VoiceFillAssistant';

interface Props {
  isNight?: boolean;
  onSubmitLog: (payload: ClassLogPayload) => void;
  isSubmitting?: boolean;
  userProfile?: UserProfile | null;
  selectedClassName?: string;
  selectedTextbookName?: string;
  /** This week's saved curriculum topic, if any — prefills Lesson Topic so
   * voice-fill/manual entry don't ask for something already scanned in via
   * the Syllabus tab. */
  selectedLessonTopic?: string;
  /** Real, approved students in the active class. Empty until the roster loads or has no one yet. */
  roster?: string[];
  /** Public marketing/demo showcase only. Never true for a real, authenticated teacher session. */
  isDemo?: boolean;
}

const DEMO_CLASS_NAME = 'Apex Seocho 7A';
const DEMO_LESSON_TOPIC = 'Unit 4: Photosynthesis & Plant Growth';
const DEMO_TEXTBOOK = 'Bricks Reading 150 (Book 1)';
const DEMO_ENERGY_LEVEL = 'High Energy and Engaged';
const DEMO_ACTIVITIES = ['Reading', 'Speaking', 'Worksheet'];
const DEMO_ROSTER = ['Ji-woo (지우)', 'Min-jun (민준)', 'Chloe (클로이)', 'Seo-yun (서윤)'];
const DEMO_COMMENTS = 'Students engaged very enthusiastically with the new plant vocabulary drill. Everyone read aloud clearly.';
const DEMO_EXCEPTIONS: Array<{ studentName: string; details: string; type?: 'praise' | 'attention' }> = [
  {
    studentName: 'Seo-yeon (서연)',
    details: '⭐ Outstanding participation! Led the vocabulary team quiz and helped classmates with pronunciation.',
    type: 'praise',
  },
  {
    studentName: 'Min-jun (민준)',
    details: '⚠️ Struggled with target word "Chloroplast" and needs 5-minute review at home.',
    type: 'attention',
  },
];

export const NativeTeacherLogForm: React.FC<Props> = ({
  isNight = true,
  onSubmitLog,
  isSubmitting = false,
  userProfile,
  selectedClassName,
  selectedTextbookName,
  selectedLessonTopic,
  roster = [],
  isDemo = false,
}) => {
  const permissions = getPermissionsForUser(userProfile);
  const effectiveRoster = roster.length > 0 ? roster : (isDemo ? DEMO_ROSTER : []);
  const [className, setClassName] = useState(selectedClassName || (isDemo ? DEMO_CLASS_NAME : ''));
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [lessonTopic, setLessonTopic] = useState(isDemo ? DEMO_LESSON_TOPIC : (selectedLessonTopic || ''));
  const [textbook, setTextbook] = useState(selectedTextbookName || (isDemo ? DEMO_TEXTBOOK : ''));
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

  // Voice Fill Assistant State
  const [showVoiceFill, setShowVoiceFill] = useState(false);

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
  const [exceptions, setExceptions] = useState<Array<{ studentName: string; details: string; type?: 'praise' | 'attention' }>>(
    isDemo ? DEMO_EXCEPTIONS : []
  );
  const [showExceptionModal, setShowExceptionModal] = useState(false);
  const [modalStudentName, setModalStudentName] = useState(effectiveRoster[0] || '');
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
    const hasContent =
      draft.lessonTopic || draft.textbook || draft.energyLevel ||
      (draft.activities && draft.activities.length > 0) ||
      draft.generalComments || (draft.exceptions && draft.exceptions.length > 0);
    if (!hasContent) return;
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
    setModalStudentName(effectiveRoster[0] || '');
    setShowExceptionModal(true);
  };

  const handleEditException = (idx: number) => {
    const ex = exceptions[idx];
    const inRoster = effectiveRoster.includes(ex.studentName);
    setIsCustomStudentName(!inRoster);
    if (inRoster) setModalStudentName(ex.studentName);
    else setCustomStudentInput(ex.studentName);
    setModalCategory(ex.type || 'praise');
    // Strip the ⭐/⚠️ prefix "Save Highlight" auto-adds so editing and
    // re-saving doesn't stack a second prefix onto the same note.
    setModalDetails(ex.details.replace(/^(⭐|⚠️)\s*/, ''));
    setEditingExceptionIndex(idx);
    setShowExceptionModal(true);
  };

  const handleVoiceExceptionsAdd = (newExceptions: VoiceFillException[]) => {
    setExceptions((prev) => [
      ...prev,
      ...newExceptions.map((ex) => ({ studentName: ex.studentName, details: ex.details, type: ex.category })),
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
    setModalStudentName((prev) => (effectiveRoster.includes(prev) ? prev : effectiveRoster[0]));
  }, [effectiveRoster.join('|')]);

  const exceptionDialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showExceptionModal,
    onClose: () => setShowExceptionModal(false),
  });

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

  const energyOptions = [
    'High Energy and Engaged',
    'Focused and Quiet',
    'A bit distracted',
  ];

  const activityOptions = ['Reading', 'Speaking', 'Writing', 'Worksheet', 'Game', 'Test'];

  const toggleActivity = (act: string) => {
    setActivities((prev) =>
      prev.includes(act) ? prev.filter((a) => a !== act) : [...prev, act]
    );
  };

  const handleAddException = () => {
    const finalStudentName = isCustomStudentName ? customStudentInput.trim() : modalStudentName;
    if (!finalStudentName || !modalDetails) return;
    setExceptions((prev) => [...prev, { studentName: finalStudentName, details: modalDetails }]);
    setModalDetails('');
    setCustomStudentInput('');
    setIsCustomStudentName(false);
    setShowExceptionModal(false);
  };

  const handleRemoveException = (idx: number) => {
    setExceptions((prev) => prev.filter((_, i) => i !== idx));
  };

  const isRealLogIncomplete =
    !isDemo && (!className.trim() || !lessonTopic.trim() || !textbook.trim() || !energyLevel || activities.length === 0);

  const missingFieldLabels = isDemo
    ? []
    : [
        !className.trim() && 'Class Name',
        !lessonTopic.trim() && 'Lesson Topic',
        !textbook.trim() && 'Textbook',
        !energyLevel && 'Energy Level',
        activities.length === 0 && 'Activities',
      ].filter((label): label is string => Boolean(label));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRealLogIncomplete) return;
    clearOfflineDraft();
    onSubmitLog({
      className,
      date,
      lessonTopic,
      textbook,
      energyLevel,
      activities,
      generalComments,
      exceptions,
    });
  };

  return (
    <div
      className={`p-6 sm:p-8 rounded-3xl border shadow-2xl transition-all max-w-3xl mx-auto w-full ${
        isNight ? 'bg-[#060608] border-white/15 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500 font-mono block">
            FOREIGN TEACHER DAILY LOG FORM
          </span>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            Daily Classroom & Student Assessment Log
          </h2>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-mono font-bold">
            ⚡ Takes about 30 seconds
          </span>
          {!isDemo && (
            <button
              type="button"
              onClick={() => setShowVoiceFill((prev) => !prev)}
              className={`w-9 h-9 rounded-full flex items-center justify-center border transition-all cursor-pointer active:scale-95 ${
                showVoiceFill
                  ? 'bg-orange-500 border-orange-500 text-white'
                  : isNight
                  ? 'bg-white/5 border-white/10 text-orange-400 hover:bg-white/10'
                  : 'bg-orange-50 border-orange-200 text-orange-500 hover:bg-orange-100'
              }`}
              aria-label="Fill by voice"
              title="Fill by voice"
            >
              <Microphone size={16} weight="fill" />
            </button>
          )}
        </div>
      </div>

      {/* Draft Restored Banner */}
      {hasDraftRestored && (
        <div className={`mb-6 p-3 rounded-2xl border flex items-center gap-2.5 text-xs font-bold ${
          isNight ? 'bg-sky-500/10 border-sky-500/30 text-sky-300' : 'bg-sky-50 border-sky-200 text-sky-700'
        }`}>
          <FloppyDisk size={16} weight="fill" className="shrink-0" />
          <span className="flex-1">Restored your unsaved draft from last time.</span>
          <button
            type="button"
            onClick={discardRestoredDraft}
            className="shrink-0 underline hover:no-underline cursor-pointer"
          >
            Discard
          </button>
        </div>
      )}

      {/* Interactive Helper Banner */}
      {isDemo && (
        <div className="mb-6 p-3.5 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-between text-xs font-bold text-orange-400 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkle size={18} weight="fill" className="animate-pulse text-orange-500 shrink-0" />
            <span>👇 Demo Preview: Click any buttons below & hit orange button to see how AI parent script generation works!</span>
          </div>
        </div>
      )}

      {!isDemo && showVoiceFill && (
        <VoiceFillAssistant
          isNight={isNight}
          currentFields={{ lessonTopic, textbook, energyLevel, activities, generalComments }}
          onFieldsUpdate={handleVoiceFieldsUpdate}
          onExceptionsAdd={handleVoiceExceptionsAdd}
          onClose={() => setShowVoiceFill(false)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Class & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="log-class-name" className="text-xs font-bold text-zinc-400 block font-mono">Class Name *</label>
            {isDemo ? (
              <select
                id="log-class-name"
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 ${
                  isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
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
              <div
                className={`w-full p-3 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
                  isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                }`}
              >
                <span>{selectedClassName || 'No class selected'}</span>
                <span className="flex items-center gap-1 text-[10px] font-mono uppercase tracking-wide text-zinc-500 shrink-0">
                  <Lock size={12} weight="bold" />
                  Synced
                </span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="log-date" className="text-xs font-bold text-zinc-400 block font-mono">Date *</label>
            <input
              id="log-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none focus:border-orange-500 ${
                isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
          </div>
        </div>

        {/* Lesson Topic & Textbook */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label htmlFor="log-lesson-topic" className="text-xs font-bold text-zinc-400 block font-mono">Lesson Topic *</label>
            <input
              id="log-lesson-topic"
              type="text"
              required
              value={lessonTopic}
              onChange={(e) => setLessonTopic(e.target.value)}
              placeholder="e.g. Unit 4: Photosynthesis"
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="log-textbook" className="text-xs font-bold text-zinc-400 block font-mono">Textbook *</label>
            <input
              id="log-textbook"
              type="text"
              required
              value={textbook}
              onChange={(e) => setTextbook(e.target.value)}
              placeholder="e.g. Bricks Reading 150"
              className={`w-full p-3 rounded-xl border text-xs focus:outline-none focus:border-orange-500 ${
                isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
              }`}
            />
          </div>
        </div>

        {/* Class Energy Level */}
        <div className="space-y-2">
          <span id="log-energy-label" className="text-xs font-bold text-zinc-400 block font-mono">Class Energy Level *</span>
          <div role="group" aria-labelledby="log-energy-label" className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {energyOptions.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setEnergyLevel(opt)}
                className={`p-3 rounded-xl border text-xs font-bold transition-all text-left flex items-center justify-between cursor-pointer ${
                  energyLevel === opt
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400 shadow-md'
                    : isNight
                    ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                    : 'bg-zinc-50 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                }`}
              >
                <span>{opt}</span>
                {energyLevel === opt && <Check size={16} weight="bold" className="text-orange-500 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Activities Multi-Select */}
        <div className="space-y-2">
          <span id="log-activities-label" className="text-xs font-bold text-zinc-400 block font-mono">Daily Activities (Multi-Select) *</span>
          <div role="group" aria-labelledby="log-activities-label" className="flex flex-wrap gap-2">
            {activityOptions.map((act) => {
              const active = activities.includes(act);
              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => toggleActivity(act)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border flex items-center gap-1.5 ${
                    active
                      ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                      : isNight
                      ? 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-700 hover:text-zinc-900'
                  }`}
                >
                  {active && <Check size={14} weight="bold" />}
                  <span>{act}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* General Class Comments */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="log-general-comments" className="text-xs font-bold text-zinc-400 block font-mono">General Class Comments</label>
            <span className="text-[10px] text-orange-400 font-mono">1-Tap Presets Below</span>
          </div>
          <textarea
            id="log-general-comments"
            value={generalComments}
            onChange={(e) => setGeneralComments(e.target.value)}
            rows={3}
            className={`w-full p-3.5 rounded-xl border text-xs leading-relaxed focus:outline-none focus:border-orange-500 font-mono ${
              isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
            }`}
            placeholder="Type general class notes here..."
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {[
              "⭐ Students engaged very enthusiastically with reading drills.",
              "📝 All students completed vocabulary homework on time.",
              "🗣️ Great active speaking participation during team quiz."
            ].map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setGeneralComments(preset)}
                className="px-2.5 py-1 rounded-lg bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[11px] font-medium border border-orange-500/20 transition-all cursor-pointer"
              >
                + Preset: {preset.slice(0, 32)}...
              </button>
            ))}
          </div>
        </div>

        {/* Student Exceptions Section */}
        <div className="space-y-3 pt-2 border-t border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-orange-400 uppercase font-mono block">
                Student Notes
              </label>
              <span className="text-[11px] text-zinc-500 font-mono">Flag specific students needing tailored parent updates</span>
            </div>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-md active:scale-95"
            >
              <Plus size={14} weight="bold" />
              <span>+ Add A Student</span>
            </button>
          </div>

          {/* List of Flagged Exceptions */}
          {exceptions.length === 0 ? (
            <p className="text-xs text-zinc-500 italic py-2 font-mono">No student exceptions added for this class session.</p>
          ) : (
            <div className="space-y-2">
              {exceptions.map((ex, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border flex items-start justify-between gap-3 text-xs ${
                    isNight ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-900'
                  }`}
                >
                  <div>
                    <span className="font-black text-amber-400 block font-mono">⚠️ {ex.studentName}</span>
                    <p className="text-xs leading-relaxed mt-0.5 opacity-90">{ex.details}</p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditException(idx)}
                      aria-label="Edit exception"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded bg-black/20 hover:bg-orange-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <PencilSimple size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveException(idx)}
                      aria-label="Remove exception"
                      className="min-w-11 min-h-11 flex items-center justify-center rounded bg-black/20 hover:bg-red-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isRealLogIncomplete}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm rounded-2xl shadow-xl shadow-orange-500/25 transition-all active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Sparkle size={18} className="animate-spin" />
              <span>Sending to KT...</span>
            </>
          ) : (
            <>
              <Sparkle size={18} weight="fill" />
              <span>Send to KT for Review</span>
            </>
          )}
        </button>
        {missingFieldLabels.length > 0 && (
          <p className="text-[11px] text-amber-400 font-mono text-center -mt-3">
            Missing: {missingFieldLabels.join(', ')}
          </p>
        )}
      </form>

      {/* Student Exception Pop-up Modal (Exact match to Screenshot 5) */}
      {showExceptionModal && (
        <div className="fixed inset-0 z-[400] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div
            ref={exceptionDialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="exception-modal-title"
            tabIndex={-1}
            className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${
              isNight ? 'bg-[#0a0a0c] border-white/15 text-white' : 'bg-white border-zinc-300 text-zinc-900'
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={20} className="text-orange-500" weight="bold" />
                <h3 id="exception-modal-title" className="font-black text-base">
                  {editingExceptionIndex !== null ? 'Edit Student Note' : 'Flag Student Exception'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingExceptionIndex(null);
                  setShowExceptionModal(false);
                }}
                aria-label="Close"
                className="min-w-11 min-h-11 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3">
              {/* Praise vs Attention Category Toggle */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-400 font-mono block">Update Category *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setModalCategory('praise')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalCategory === 'praise'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 font-black'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <span>⭐ Positive Praise</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setModalCategory('attention')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      modalCategory === 'attention'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 font-black'
                        : 'bg-white/5 border-white/10 text-zinc-400'
                    }`}
                  >
                    <span>⚠️ Attention Needed</span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs font-bold text-zinc-400 font-mono">
                  <label htmlFor="exception-student-field">Student *</label>
                  {effectiveRoster.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsCustomStudentName(!isCustomStudentName)}
                      className="text-orange-400 text-[10px] underline hover:text-orange-300"
                    >
                      {isCustomStudentName ? 'Select from Roster' : '+ Type Custom Name'}
                    </button>
                  )}
                </div>

                {isCustomStudentName || effectiveRoster.length === 0 ? (
                  <input
                    id="exception-student-field"
                    type="text"
                    value={customStudentInput}
                    onChange={(e) => setCustomStudentInput(e.target.value)}
                    placeholder="Enter student name (e.g. David / 김다윗)..."
                    className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  />
                ) : (
                  <select
                    id="exception-student-field"
                    value={modalStudentName}
                    onChange={(e) => setModalStudentName(e.target.value)}
                    className={`w-full p-3 rounded-xl border text-xs font-bold focus:outline-none ${
                      isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    }`}
                  >
                    {effectiveRoster.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label htmlFor="exception-details-field" className="text-xs font-bold text-zinc-400 block font-mono">Details *</label>
                <textarea
                  id="exception-details-field"
                  value={modalDetails}
                  onChange={(e) => setModalDetails(e.target.value)}
                  rows={4}
                  required
                  placeholder={
                    modalCategory === 'praise'
                      ? 'Describe positive milestone (e.g. 100% quiz score, excellent pronunciation, helped classmates)...'
                      : 'Explain focus issue (e.g. missing homework, tardy, hesitant during speaking drill)...'
                  }
                  className={`w-full p-3 rounded-xl border text-xs font-medium focus:outline-none ${
                    isNight ? 'bg-[#050505] border-white/10 text-white' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  }`}
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingExceptionIndex(null);
                    setShowExceptionModal(false);
                  }}
                  className="w-1/2 py-2.5 rounded-xl text-xs font-bold border border-white/10 hover:bg-white/10 text-zinc-400"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const chosenName = (isCustomStudentName ? customStudentInput : modalStudentName) || 'Student';
                    const detailText = modalDetails.trim() || (modalCategory === 'praise' ? 'Great focus and enthusiastic participation!' : 'Needs extra review on target vocabulary.');
                    const prefix = modalCategory === 'praise' ? '⭐ ' : '⚠️ ';
                    const savedException = { studentName: chosenName, details: prefix + detailText, type: modalCategory };
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
                  className="w-1/2 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                >
                  {editingExceptionIndex !== null ? 'Save Changes' : 'Save Highlight'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
