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
    details: string;
  }>;
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
    koreanUpdate: string;
    phoneTalkingPoints: string[];
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
  } catch (e) {}
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
    return `${studentName} 원생은 오늘 ${textbook} (${classTopic}) 수업을 진지하게 이수하였습니다. 담임 교사 소견: ${exceptionDetails}`;
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
