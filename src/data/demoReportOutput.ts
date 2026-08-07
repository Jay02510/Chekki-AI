import { ClassLogPayload, GeneratedReportOutput } from '../services/aiGenerator';

// Deterministic, offline canned output for public marketing demos (SchoolsLandingPage,
// ReportStudioPage). No network call, no Gemini cost — same shape the real AI generator
// returns, so the real NativeKtDashboard component renders it identically either way.
export function buildDemoReportOutput(payload: ClassLogPayload): GeneratedReportOutput {
  const korean = `오늘 ${payload.className} 수업에서는 ${payload.textbook} (${payload.lessonTopic})의 핵심 내용을 집중 학습했습니다. 원생들은 ${payload.activities.join(', ')} 활동에 ${payload.energyLevel === 'High Energy and Engaged' ? '매우 밝고 적극적으로' : '차분하게'} 참여하였습니다.`;
  const english = `Today in ${payload.className}, students focused on ${payload.lessonTopic} using ${payload.textbook}. Everyone participated attentively during ${payload.activities.join(' and ')}.`;

  const studentReports = payload.exceptions.map((ex) => ({
    studentName: ex.studentName,
    koreanUpdate: `${ex.studentName} 원생은 오늘 ${payload.textbook} (${payload.lessonTopic}) 수업을 진지하게 이수하였습니다. 담임 교사 소견: ${ex.details}`,
    phoneTalkingPoints: [
      `${ex.studentName} 학생의 오늘 수업 참여도: ${payload.energyLevel}`,
      `담임 교사 관찰: ${ex.details}`,
      `다음 수업 목표: ${payload.lessonTopic} 관련 내용 복습 권장`,
    ],
  }));

  return {
    status: 'pending_review',
    bilingualClassSummary: { korean, english },
    studentReports,
  };
}
