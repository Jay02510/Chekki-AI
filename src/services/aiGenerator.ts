import { auth } from '../../services/database';

// Gemini calls run server-side (api/generate-report.ts) — the client never holds
// a Gemini key. Previously this file called GoogleGenAI directly from the browser,
// which meant the API key shipped in the client bundle.

export interface ClassLogPayload {
  className: string;
  date: string;
  lessonTopic: string;
  textbook: string;
  energyLevel: 'High Energy and Engaged' | 'Focused and Quiet' | 'A bit distracted' | string;
  activities: string[];
  generalComments: string;
  exceptions: Array<{
    studentName: string;
    // Roster-matched student identity, when known — the join key daily/
    // weekly consolidation groups on. Null for a custom-typed name not yet
    // in the roster (no stable key to join across logs, so it's still sent
    // standalone rather than silently dropped or mis-grouped).
    studentUid?: string | null;
    details: string;
    type?: 'praise' | 'attention';
  }>;
  // Every roster-approved student enrolled in this class at submission time
  // — lets consolidation attach the general class-summary paragraph to
  // every enrolled student's daily report, not just the ones flagged.
  enrolledStudentUids?: string[];
  // Who wrote the notes — the AI prompt assumes English FT notes by default;
  // a KT authoring their own log writes in Korean already, so the summary
  // prompt needs to polish instead of "translate from English" (that framing
  // would otherwise garble/mistranslate input that's already Korean).
  authorRole?: 'ft' | 'kt';
}

export interface GeneratedReportOutput {
  status?: 'pending_review' | 'edited_by_kt' | 'copied_sent';
  lastEditedAt?: string;
  bilingualClassSummary: {
    korean: string;
    english: string;
  };
  studentReports: Array<{
    studentName: string;
    studentUid?: string | null;
    koreanUpdate: string;
    phoneTalkingPoints: string[];
    category?: 'praise' | 'attention';
  }>;
}

// Offline Draft Cache Utilities
const DRAFT_CACHE_KEY = 'chekki_offline_log_draft';

export function saveOfflineDraft(payload: ClassLogPayload): void {
  try {
    localStorage.setItem(DRAFT_CACHE_KEY, JSON.stringify(payload));
  } catch (e) {
    console.warn('Failed to save offline draft:', e);
  }
}

export function getOfflineDraft(): ClassLogPayload | null {
  try {
    const raw = localStorage.getItem(DRAFT_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

export function clearOfflineDraft(): void {
  try {
    localStorage.removeItem(DRAFT_CACHE_KEY);
  } catch (e) {
    console.warn('Failed to clear offline draft:', e);
  }
}

async function callGenerateReport(type: string, payload: unknown): Promise<any> {
  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) throw new Error('Not authenticated');

  // Folded into api/analyze.ts (task: 'generate_report') — was its own
  // endpoint file until the Vercel Hobby plan's 12-function limit blocked
  // deployment.
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
    body: JSON.stringify({ task: 'generate_report', type, payload }),
  });

  if (!response.ok) {
    throw new Error(`generate-report failed: ${response.status}`);
  }
  return response.json();
}

/**
 * 1. General Class Summary Generator (Bilingual KO + EN)
 */
export async function generateGeneralClassSummary(payload: ClassLogPayload): Promise<{ korean: string; english: string }> {
  try {
    return await callGenerateReport('summary', payload);
  } catch (err) {
    console.warn('generate-report call fallback to deterministic template:', err);
    return {
      korean: `오늘 ${payload.className} 수업에서는 ${payload.textbook} (${payload.lessonTopic})의 핵심 내용을 집중 학습했습니다. 원생들은 ${payload.activities.join(', ')} 활동에 ${payload.energyLevel === 'High Energy and Engaged' ? '매우 밝고 적극적으로' : '차분하게'} 참여하였습니다.`,
      english: `Today in ${payload.className}, students focused on ${payload.lessonTopic} using ${payload.textbook}. Everyone participated attentively during ${payload.activities.join(' and ')}.`,
    };
  }
}

/**
 * 2. Personalized Student Exception Update Generator (Polite KO)
 */
export async function generateStudentExceptionReport(
  studentName: string,
  classTopic: string,
  textbook: string,
  exceptionDetails: string
): Promise<string> {
  try {
    const { text } = await callGenerateReport('exception', { studentName, classTopic, textbook, exceptionDetails });
    return text || `${studentName} 원생은 오늘 ${textbook} (${classTopic}) 수업에 참여하였습니다. ${exceptionDetails}`;
  } catch (err) {
    // API route itself unreachable — same flagged-fallback shape as the
    // server-side retry exhaustion in api/analyze.ts, so a KT never sees
    // raw English disguised as translated Korean either way.
    return `⚠️ ${studentName} — 자동 번역 실패, 아래 원문을 직접 번역해 주세요 (auto-translation failed, please translate manually):\n${exceptionDetails}`;
  }
}

/**
 * 2b. Merge several same-day source paragraphs for one student (multiple
 * classes, or multiple teacher submissions for the same class) into a
 * single flowing paragraph in one voice, instead of stacking them.
 */
export async function mergeConsolidatedReport(
  studentName: string,
  paragraphs: string[],
  isKo: boolean
): Promise<string | null> {
  try {
    const { korean } = await callGenerateReport('merge', { studentName, paragraphs, isKo });
    return korean || null;
  } catch (err) {
    console.warn('mergeConsolidatedReport failed, falling back to stacked paragraphs:', err);
    return null;
  }
}

/**
 * 3. Parent Consultation Phone Prep Report Generator
 */
export async function generatePhoneConsultationPrep(studentName: string, historicalLogs: string): Promise<string[]> {
  try {
    const { points } = await callGenerateReport('phonePrep', { studentName, historicalLogs });
    return Array.isArray(points) && points.length > 0
      ? points
      : [
          `${studentName} 원생의 최근 학습 태도 및 주차별 어휘 성취도 점검`,
          `수업 중 집중도 향상을 위한 가정 내 1:1 맞춤 읽기 지도 권장`,
          `다음 주 차 타겟 어휘 선제 복습 및 학원 차원의 밀착 케어 진행`,
        ];
  } catch (err) {
    return [
      `${studentName} 원생의 교재 이수 현황 및 수업 참여도 공유`,
      `가정 내 어휘 복습 지도 방안 안내`,
      `원내 1:1 보충 케어 스케줄 협의`,
    ];
  }
}
