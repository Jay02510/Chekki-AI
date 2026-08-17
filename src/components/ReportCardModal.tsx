import React, { useState, useEffect } from 'react';
import { X, Printer, Sparkle, PhoneCall } from '@phosphor-icons/react';
import { useDialogA11y } from '../../hooks/useDialogA11y';
import { dbInstance } from '../../services/database';
import { collection, query, where, orderBy, getDocs, Timestamp } from 'firebase/firestore';
import { generatePhoneConsultationPrep } from '../services/aiGenerator';

interface Props {
  isKo: boolean;
  activeRoster: any[];
  selectedStudentDetails: any | null;
  setSelectedStudentDetails: (student: any) => void;
  selectedClass: { id?: string; name?: string } | null;
  academyLogo: string;
  schoolName?: string | null;
  onClose: () => void;
}

const toDateInputValue = (date: Date) => date.toISOString().slice(0, 10);

export const ReportCardModal: React.FC<Props> = ({
  isKo,
  activeRoster,
  selectedStudentDetails,
  setSelectedStudentDetails,
  selectedClass,
  academyLogo,
  schoolName,
  onClose,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>({ isOpen: true, onClose });

  // Weekly consultation talking points — real AI, generated on demand from
  // this student's actual daily logs over the selected date range (general
  // class paragraphs + any exception notes). This is the entire content of
  // the report now: pick a student, pick a range, generate the summary.
  const [fromDate, setFromDate] = useState(() => toDateInputValue(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)));
  const [toDate, setToDate] = useState(() => toDateInputValue(new Date()));
  const [talkingPoints, setTalkingPoints] = useState<string[] | null>(null);
  const [isGeneratingTalkingPoints, setIsGeneratingTalkingPoints] = useState(false);
  const [talkingPointsError, setTalkingPointsError] = useState(false);

  useEffect(() => {
    setTalkingPoints(null);
    setTalkingPointsError(false);
  }, [selectedStudentDetails?.uid]);

  const handleGenerateTalkingPoints = async () => {
    const studentUid = selectedStudentDetails?.uid;
    const classId = selectedClass?.id;
    const studentName = selectedStudentDetails?.studentName || selectedStudentDetails?.name || 'Student';
    if (!studentUid || !classId) return;
    setIsGeneratingTalkingPoints(true);
    setTalkingPointsError(false);
    try {
      const rangeStart = Timestamp.fromMillis(new Date(`${fromDate}T00:00:00`).getTime());
      const rangeEnd = Timestamp.fromMillis(new Date(`${toDate}T23:59:59`).getTime());
      const logsRef = collection(dbInstance, 'classes', classId, 'logs');
      const logsQuery = query(
        logsRef,
        where('createdAt', '>=', rangeStart),
        where('createdAt', '<=', rangeEnd),
        orderBy('createdAt', 'asc')
      );
      const snap = await getDocs(logsQuery);
      const rangeLogs = snap.docs
        .map((d) => d.data() as any)
        .filter((l) => (l.enrolledStudentUids || []).includes(studentUid) || (l.aiStudentReports || []).some((r: any) => r.studentUid === studentUid));

      const historicalLogs = rangeLogs
        .map((l) => {
          const exception = (l.aiStudentReports || []).find((r: any) => r.studentUid === studentUid);
          return [l.date, l.aiKoreanSummary, exception?.koreanUpdate].filter(Boolean).join(' — ');
        })
        .filter(Boolean)
        .join('\n');

      if (!historicalLogs) {
        setTalkingPoints([]);
        return;
      }
      const points = await generatePhoneConsultationPrep(studentName, historicalLogs);
      setTalkingPoints(points);
    } catch (err) {
      console.error('Failed to generate weekly talking points:', err);
      setTalkingPointsError(true);
    } finally {
      setIsGeneratingTalkingPoints(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[330] flex items-center justify-center p-4">
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          .printable-report-card, .printable-report-card * {
            visibility: visible !important;
          }
          .printable-report-card {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 32px !important;
            background: #ffffff !important;
            color: #000000 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md no-print" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isKo ? '학부모 상담 요약' : 'Parent consultation summary'}
        tabIndex={-1}
        className="relative p-1 bg-white border border-zinc-200 rounded-[2.5rem] shadow-2xl flex flex-col w-full max-w-2xl mx-4 animate-fade-in text-left max-h-[90vh]"
      >
        <div className="printable-report-card relative w-full h-full rounded-[calc(2.5rem-0.25rem)] p-6 sm:p-8 bg-white text-zinc-900 overflow-y-auto custom-scrollbar">
          <button
            type="button"
            onClick={onClose}
            aria-label={isKo ? '닫기' : 'Close'}
            className="absolute top-6 right-6 min-w-11 min-h-11 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-all cursor-pointer no-print"
          >
            <X size={18} weight="bold" />
          </button>

          {/* Official Academy Header */}
          <div className="border-b-2 border-zinc-900 pb-6 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {academyLogo ? (
                <img src={academyLogo} alt="Logo" className="w-14 h-14 object-contain rounded-xl border border-zinc-200" />
              ) : (
                <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-md">
                  🏫
                </div>
              )}
              <div>
                <h2 className="text-xl font-black text-zinc-900 tracking-tight">{schoolName || 'B2B Academy'}</h2>
                <p className="text-xs text-orange-600 font-bold uppercase tracking-widest">
                  {isKo ? '학부모 상담 요약' : 'PARENT CONSULTATION SUMMARY'}
                </p>
              </div>
            </div>
          </div>

          {/* Student + Date Range Picker */}
          <div className="mb-6 p-3 bg-orange-50/50 border border-orange-200 rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3 no-print">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label htmlFor="report-card-student-select" className="text-xs font-bold text-orange-700 shrink-0">{isKo ? '원생:' : 'Student:'}</label>
              <select
                id="report-card-student-select"
                value={selectedStudentDetails?.uid || ''}
                onChange={(e) => {
                  const target = activeRoster.find((s) => s.uid === e.target.value);
                  if (target) setSelectedStudentDetails(target);
                }}
                className="min-w-0 flex-1 px-3 py-1.5 bg-white border border-orange-300 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer shadow-xs"
              >
                <option value="">-- {isKo ? '원생 선택' : 'Select Student'} --</option>
                {activeRoster.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.studentName || s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label={isKo ? '시작일' : 'From date'}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className="px-2.5 py-1.5 bg-white border border-orange-300 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer shadow-xs"
              />
              <span className="text-xs text-orange-700 font-bold">–</span>
              <input
                type="date"
                aria-label={isKo ? '종료일' : 'To date'}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={toDateInputValue(new Date())}
                className="px-2.5 py-1.5 bg-white border border-orange-300 rounded-xl text-xs font-bold text-zinc-900 outline-none cursor-pointer shadow-xs"
              />
            </div>
          </div>

          {/* Weekly Consultation Talking Points — real AI, generated on demand
              from this student's actual logs in the selected range. */}
          <div className="mb-2 p-4 border border-orange-200 rounded-2xl bg-orange-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-zinc-900 uppercase tracking-widest text-[11px] flex items-center gap-1.5">
                <PhoneCall size={14} weight="bold" className="text-orange-600" />
                <span>{isKo ? '학부모 상담 talking points' : 'Parent Consultation Talking Points'}</span>
              </h4>
              <button
                type="button"
                onClick={handleGenerateTalkingPoints}
                disabled={!selectedStudentDetails?.uid || isGeneratingTalkingPoints}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5 no-print"
              >
                <Sparkle size={13} weight="bold" className={isGeneratingTalkingPoints ? 'animate-spin' : ''} />
                <span>
                  {isGeneratingTalkingPoints
                    ? (isKo ? '생성 중...' : 'Generating...')
                    : (isKo ? '생성하기' : 'Generate')}
                </span>
              </button>
            </div>
            {!selectedStudentDetails?.uid ? (
              <p className="text-xs text-zinc-500">{isKo ? '먼저 원생을 선택하세요.' : 'Select a student first.'}</p>
            ) : talkingPointsError ? (
              <p className="text-xs text-rose-600">{isKo ? '생성에 실패했습니다. 다시 시도해주세요.' : 'Generation failed — please try again.'}</p>
            ) : talkingPoints === null ? (
              <p className="text-xs text-zinc-500">
                {isKo
                  ? '선택한 기간의 일일 기록(수업 코멘트 + 특이사항)을 바탕으로 실제 AI가 상담 포인트를 생성합니다.'
                  : "Pulls this student's real daily logs (class comments + exceptions) from the selected range and generates real AI talking points."}
              </p>
            ) : talkingPoints.length === 0 ? (
              <p className="text-xs text-zinc-500">{isKo ? '선택한 기간에 기록된 일지가 없습니다.' : 'No logs recorded for this student in the selected range.'}</p>
            ) : (
              <ul className="space-y-1.5">
                {talkingPoints.map((point, i) => (
                  <li key={i} className="text-xs text-zinc-800 flex items-start gap-2">
                    <span className="text-orange-500 font-bold shrink-0">{i + 1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Print Action Bar */}
          <div className="mt-6 pt-4 border-t border-zinc-200 flex justify-between items-center">
            <p className="text-[10px] text-zinc-500 font-mono">
              {isKo ? 'Chekki AI B2B Academy Platform' : 'Chekki AI B2B Academy Platform'}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-bold text-xs rounded-xl border border-zinc-300 transition-all cursor-pointer"
              >
                {isKo ? '닫기' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                disabled={talkingPoints === null || talkingPoints.length === 0}
                className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all flex items-center gap-2 cursor-pointer"
              >
                <Printer size={16} weight="bold" />
                <span>{isKo ? '인쇄 / PDF 발급' : 'Print / Export PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
