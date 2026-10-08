// Per-route <head> values. Read by landing-entry.tsx (client-side, for SPA
// navigation) and by vite.config.ts (prerendered HTML per route and language,
// for crawlers that don't run JS — GPTBot, ClaudeBot, PerplexityBot, Naver Yeti).
// `path` is the Korean URL; English lives at /en + path (see src/lib/lang.ts).
type Meta = { title: string; description: string };

export const ROUTE_META: Record<'home' | 'faq' | 'schools', { path: string; ko: Meta; en: Meta }> = {
  home: {
    path: '/',
    ko: {
      title: '채키 AI (Chekki AI) | 영어 숙제 AI 채점 · 발음 코칭 · 학원 리포트',
      description:
        '영어 숙제 사진 한 장으로 5초 AI 채점, 원어민 발음 코칭, 한국어 엄마표 가이드까지. 영유·어학원을 위한 정답지 기준 자동 채점과 카카오톡 학부모 리포트도 제공합니다.',
    },
    en: {
      title: 'Chekki AI | AI English Homework Checker for Korean Families & Hagwons',
      description:
        'Snap a photo of English homework and Chekki AI grades it in seconds, with native pronunciation coaching and Korean guidance for parents. Answer-key grading and KakaoTalk parent reports for academies.',
    },
  },
  faq: {
    path: '/faq',
    ko: {
      title: '자주 묻는 질문 (FAQ) | 채키 AI 영어 숙제 채점 · 가격 · 사용법',
      description: '채키 AI 영어 숙제 채점, 발음 코칭, 가격, 학원 무료 체험에 대해 자주 묻는 질문과 답변.',
    },
    en: {
      title: 'Chekki AI FAQ | Pricing, Homework Grading & How It Works',
      description: 'Answers about Chekki AI homework scanning, pronunciation coaching, pricing, and the 7-day academy free trial.',
    },
  },
  schools: {
    path: '/schools',
    ko: {
      title: '학원용 채키 AI | 원어민 수업 기록을 한국어 학부모 리포트로',
      description:
        '원어민 선생님의 영어 수업 기록을 한국어 학부모 리포트로 바꿔요. 한국인 선생님이 확인해서 보내고, 가정 숙제는 학원 정답지 기준으로 자동 채점합니다.',
    },
    en: {
      title: 'Chekki AI for Academies | Korean Parent Reports from Foreign Teacher Notes',
      description:
        "Foreign teachers' English class notes become Korean parent reports, checked by a Korean teacher before they go out. Homework scanned at home is graded against your answer key.",
    },
  },
};

export function landingMeta(key: keyof typeof ROUTE_META, lang: 'ko' | 'en') {
  return { ...ROUTE_META[key][lang], path: ROUTE_META[key].path, lang };
}

export const TEACHER_META = {
  title: 'Teacher & Director Portal | Chekki AI',
  description: 'Sign in to the Chekki AI teacher and director dashboard to manage classes, review homework scans, and send parent reports.',
  path: '/teacher',
};
