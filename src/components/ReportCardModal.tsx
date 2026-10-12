import React, { useState, useEffect, useRef } from 'react';
import { X, Printer, Sparkle, Buildings, ShareNetwork } from '@phosphor-icons/react';
import { staffUi } from './staffUi';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';
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

  // Nothing cancelled the in-flight Firestore query + AI call below if the
  // staff member switched the selected student while it was still running —
  // the effect below only cleared the currently-displayed talkingPoints, it
  // didn't stop the older request from later overwriting state with the
  // PREVIOUS student's consultation notes once it resolved, silently
  // displaying one student's private notes under a different student's name
  // (audit: stale-response race in the parent-consultation panel).
  const requestIdRef = useRef(0);

  useEffect(() => {
    requestIdRef.current += 1;
    setTalkingPoints(null);
    setTalkingPointsError(false);
  }, [selectedStudentDetails?.uid]);

  const handleGenerateTalkingPoints = async () => {
    const studentUid = selectedStudentDetails?.uid;
    const classId = selectedClass?.id;
    const studentName = selectedStudentDetails?.studentName || selectedStudentDetails?.name || 'Student';
    if (!studentUid || !classId) return;
    const thisRequestId = ++requestIdRef.current;
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
        if (requestIdRef.current === thisRequestId) setTalkingPoints([]);
        return;
      }
      const points = await generatePhoneConsultationPrep(studentName, historicalLogs);
      if (requestIdRef.current === thisRequestId) setTalkingPoints(points);
    } catch (err) {
      console.error('Failed to generate weekly talking points:', err);
      if (requestIdRef.current === thisRequestId) setTalkingPointsError(true);
    } finally {
      if (requestIdRef.current === thisRequestId) setIsGeneratingTalkingPoints(false);
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
      <div className="absolute inset-0 bg-[#2b211a]/55 no-print" onClick={onClose} />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={isKo ? '학부모 상담 요약' : 'Parent consultation summary'}
        tabIndex={-1}
        className="modal-enter relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col rounded-lg bg-surface text-left shadow-[0_24px_60px_-20px_rgba(43,33,26,0.45)]"
      >
        <div className="printable-report-card custom-scrollbar relative h-full w-full overflow-y-auto rounded-lg bg-surface p-6 text-ink sm:p-8">
          <button
            type="button"
            onClick={onClose}
            aria-label={isKo ? '닫기' : 'Close'}
            className={`${staffUi.iconBtn} no-print absolute right-5 top-5 h-11 w-11`}
          >
            <X size={18} weight="bold" />
          </button>

          {/* Official Academy Header */}
          <div className="mb-6 flex items-center justify-between border-b border-rule pb-5 pr-12">
            <div className="flex items-center gap-3">
              {academyLogo ? (
                <img src={academyLogo} alt="" width={48} height={48} className="h-12 w-12 rounded-md object-contain" />
              ) : (
                <Buildings size={40} weight="duotone" className="text-line-ink" aria-hidden="true" />
              )}
              <div>
                <h2 className="text-[22px] font-extrabold tracking-[-0.01em]">{schoolName || 'B2B Academy'}</h2>
                <p className="text-[14px] text-ink-3">
                  {isKo ? '학부모 상담 노트' : 'Parent call notes'}
                </p>
              </div>
            </div>
          </div>

          {/* Student + Date Range Picker */}
          <div className="no-print mb-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <label htmlFor="report-card-student-select" className={staffUi.label}>{isKo ? '원생' : 'Student'}</label>
              <select
                id="report-card-student-select"
                value={selectedStudentDetails?.uid || ''}
                onChange={(e) => {
                  const target = activeRoster.find((s) => s.uid === e.target.value);
                  if (target) setSelectedStudentDetails(target);
                }}
                className={`${staffUi.field} cursor-pointer font-semibold`}
              >
                <option value="">{isKo ? '원생 선택' : 'Choose a student'}</option>
                {activeRoster.map((s) => (
                  <option key={s.uid} value={s.uid}>
                    {s.studentName || s.name} ({s.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <span className={staffUi.label}>{isKo ? '기간' : 'Dates'}</span>
              <div className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label={isKo ? '시작일' : 'From date'}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                max={toDate}
                className={`${staffUi.field} w-auto cursor-pointer`}
              />
              <span className="text-ink-3">–</span>
              <input
                type="date"
                aria-label={isKo ? '종료일' : 'To date'}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                min={fromDate}
                max={toDateInputValue(new Date())}
                className={`${staffUi.field} w-auto cursor-pointer`}
              />
              </div>
            </div>
          </div>

          {/* Weekly Consultation Talking Points — real AI, generated on demand
              from this student's actual logs in the selected range. */}
          <section className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className={staffUi.h3}>{isKo ? '상담 요점' : 'Talking points'}</h3>
              <button
                type="button"
                onClick={handleGenerateTalkingPoints}
                disabled={!selectedStudentDetails?.uid || isGeneratingTalkingPoints}
                className={`${staffUi.primaryBtn} no-print`}
              >
                <Sparkle size={18} weight="bold" className={isGeneratingTalkingPoints ? 'animate-spin' : ''} />
                <span>
                  {isGeneratingTalkingPoints
                    ? (isKo ? '생성 중...' : 'Generating...')
                    : (isKo ? '생성하기' : 'Generate')}
                </span>
              </button>
            </div>
            {!selectedStudentDetails?.uid ? (
              <p className="text-[14px] text-ink-3">{isKo ? '먼저 원생을 선택하세요.' : 'Select a student first.'}</p>
            ) : talkingPointsError ? (
              <p className="text-[14px] text-wrong">{isKo ? '생성에 실패했습니다. 다시 시도해주세요.' : 'Generation failed — please try again.'}</p>
            ) : talkingPoints === null ? (
              <p className="text-[14px] text-ink-3">
                {isKo
                  ? '선택한 기간의 일일 기록(수업 코멘트 + 특이사항)을 바탕으로 실제 AI가 상담 포인트를 생성합니다.'
                  : "Pulls this student's real daily logs (class comments + exceptions) from the selected range and generates real AI talking points."}
              </p>
            ) : talkingPoints.length === 0 ? (
              <p className="text-[14px] text-ink-3">{isKo ? '선택한 기간에 기록된 일지가 없습니다.' : 'No logs recorded for this student in the selected range.'}</p>
            ) : (
              <ul className="space-y-1.5">
                {talkingPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-[15px] leading-relaxed">
                    <span className="text-line-ink font-bold shrink-0">{i + 1}.</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Print Action Bar — window.print() is a no-op inside the iOS/
              Android WebView, so native shares the talking points as text.
              Close lives in the header (X). */}
          <div className="mt-6 flex border-t border-rule pt-4">
            <button
              type="button"
              onClick={async () => {
                if (!Capacitor.isNativePlatform()) {
                  window.print();
                  return;
                }
                const name = selectedStudentDetails?.studentName || selectedStudentDetails?.name || '';
                try {
                  await Share.share({ title: name, text: `${name}\n\n${(talkingPoints || []).join('\n')}` });
                } catch {
                  /* user dismissed the share sheet */
                }
              }}
              disabled={talkingPoints === null || talkingPoints.length === 0}
              className={`${staffUi.quietBtn} min-h-11 w-full sm:ml-auto sm:w-auto`}
            >
              {Capacitor.isNativePlatform() ? <ShareNetwork size={16} weight="bold" /> : <Printer size={16} weight="bold" />}
              <span>
                {Capacitor.isNativePlatform()
                  ? (isKo ? '공유하기' : 'Share')
                  : (isKo ? '인쇄 / PDF 저장' : 'Print / Save PDF')}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
