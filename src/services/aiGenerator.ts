import { GoogleGenAI } from '@google/genai';

// Initialize Gemini API client
const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || 'AIzaSyBU8ehL18e1y-WXMULzA9XkKFkC7BkzX8k';
const ai = new GoogleGenAI({ apiKey });

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

/**
 * 1. General Class Summary Generator (Bilingual KO + EN)
 * Prompt exact match from Gemini screenshot #1
 */
export async function generateGeneralClassSummary(payload: ClassLogPayload): Promise<{ korean: string; english: string }> {
  try {
    const prompt = `System Prompt / Instructions:
You are drafting a daily class summary for a Kindergarten / Elementary class. This message will be reviewed by the Korean Teacher (KT) before being sent to parents.

CRITICAL RULES:
You are an expert, highly empathetic Korean educational coordinator. Your job is to translate and refine notes from Foreign Teachers into polished updates for Korean mothers. The students are 5-7 years old in an English Kindergarten program.

You are a silent partner. Never mention AI, Chekki, or that this was automated. Write from the warm, professional perspective of the teaching team.

Combine the provided inputs into a single, cohesive paragraph (3-4 sentences max).

Tone Guidelines:
Warm, encouraging, professional, and never condescending. Soften any harsh feedback into constructive next steps.

Format:
Bilingual. Always provide the Korean translation first, followed immediately by the English original below it.

INPUT DATA:
Class Name: ${payload.className}
Date: ${payload.date}
Lesson Topic: ${payload.lessonTopic}
Textbook: ${payload.textbook}
Class Energy Level: ${payload.energyLevel}
Activities Covered: ${payload.activities.join(', ')}
Teacher Notes: ${payload.generalComments}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    
    // Split KO and EN if bilingual format returned
    const parts = text.split(/\n\n(?=[A-Z])/);
    if (parts.length >= 2) {
      return { korean: parts[0].trim(), english: parts.slice(1).join('\n\n').trim() };
    }

    return {
      korean: text.trim(),
      english: `Today in ${payload.className}, students explored ${payload.lessonTopic} with ${payload.textbook}. They engaged in ${payload.activities.join(' and ')} with a ${payload.energyLevel.toLowerCase()} mood.`
    };
  } catch (err) {
    console.warn('Gemini API call fallback to deterministic template:', err);
    return {
      korean: `오늘 ${payload.className} 수업에서는 ${payload.textbook} (${payload.lessonTopic})의 핵심 내용을 집중 학습했습니다. 원생들은 ${payload.activities.join(', ')} 활동에 ${payload.energyLevel === 'High Energy and Engaged' ? '매우 밝고 적극적으로' : '차분하게'} 참여하였습니다.`,
      english: `Today in ${payload.className}, students focused on ${payload.lessonTopic} using ${payload.textbook}. Everyone participated attentively during ${payload.activities.join(' and ')}.`
    };
  }
}

/**
 * 2. Personalized Student Exception Update Generator (Polite KO)
 * Prompt exact match from Gemini screenshot #2
 */
export async function generateStudentExceptionReport(
  studentName: string,
  classTopic: string,
  textbook: string,
  exceptionDetails: string
): Promise<string> {
  try {
    const prompt = `System Prompt / Instructions:
You are drafting a personalized daily update for a specific student's parents. This will be reviewed by the Korean Teacher (KT).

CRITICAL RULES:
Act as a silent partner. Do not mention AI. Write warmly and professionally.

ONLY write about the student named below. Do not invent, assume, or hallucinate any other student names.

Smoothly combine the general class topic with the specific teacher's note about the student.

Provide the final output in polite, parent-friendly Korean.

Input Variables:
Student Name: ${studentName}
Class Topic: ${classTopic}
Textbook: ${textbook}
Teacher Note: ${exceptionDetails}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text?.trim() || `${studentName} 원생은 오늘 ${textbook} (${classTopic}) 수업에 참여하였습니다. ${exceptionDetails}`;
  } catch (err) {
    return `${studentName} 원생은 오늘 ${textbook} (${classTopic}) 수업을 진지하게 이수하였습니다. 담임 교사 소견: ${exceptionDetails}`;
  }
}

/**
 * 3. Parent Consultation Phone Prep Report Generator
 * Prompt exact match from Gemini screenshot #3
 */
export async function generatePhoneConsultationPrep(
  studentName: string,
  historicalLogs: string
): Promise<string[]> {
  try {
    const prompt = `System Instructions:
You are an expert educational assistant helping a Korean Kindergarten Teacher (KT) prepare for a parent consultation.

You will be provided with a raw log of teacher notes regarding a specific student. Your job is to synthesize these notes into 3-4 professional, actionable talking points for the KT to use during the parent phone call.

CRITICAL RULES:
Zero Hallucination: ONLY use the exact student name provided in the input. Do not ever substitute, default to, or hallucinate random placeholder names like Jiwoo or Min-jun.

Silent Partner: Do not mention that this was generated by AI or Chekki. Write as a helpful summary for the teaching staff.

Tone: Professional, constructive, and polite. Always frame challenges (like distraction) as "areas for growth" or "things we are working on together."

Language: Output the final talking points entirely in natural Korean.

Inputs:
Student Name: ${studentName}
Historical Logs: ${historicalLogs}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const lines = (response.text || '')
      .split('\n')
      .map(l => l.replace(/^[-*•\d.]+\s*/, '').trim())
      .filter(l => l.length > 0);

    return lines.length > 0 ? lines : [
      `${studentName} 원생의 최근 학습 태도 및 주차별 어휘 성취도 점검`,
      `수업 중 집중도 향상을 위한 가정 내 1:1 맞춤 읽기 지도 권장`,
      `다음 주 차 타겟 어휘 선제 복습 및 학원 차원의 밀착 케어 진행`
    ];
  } catch (err) {
    return [
      `${studentName} 원생의 교재 이수 현황 및 수업 참여도 공유`,
      `가정 내 어휘 복습 지도 방안 안내`,
      `원내 1:1 보충 케어 스케줄 협의`
    ];
  }
}
