import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    app_name: "Chekki AI",
    tagline: "Grading by Chekki, Praise by You",
    login: "Start Free",
    logout: "Log Out",
    scans: "Magic Scans",
    pro_plan: "Beta Pro 🚀",
    
    // Homescreen Marketing
    feat_title: "Why Chekki?",
    feat_1_title: "The Perfect Answer Key",
    feat_1_desc: "Don't waste time hunting for keys. Chekki identifies the questions and shows you exactly what to write, right on the screen.",
    feat_2_title: "Bilingual Teaching Scripts",
    feat_2_desc: "We give you the exact words to say in Korean and English to encourage your child through the tricky parts.",
    feat_3_title: "Speaking Coach",
    feat_3_desc: "Interactive voice check lets your child practice pronunciation and earn digital stamps.",
    feat_4_title: "AI Practice Sheets",
    feat_4_desc: "Instantly generate extra practice questions based on the exact same worksheet your child is doing.",

    // Onboarding
    onb_1_title: "Stop the Homework War",
    onb_1_desc: "Chekki provides the answers, you provide the hugs.",
    onb_1_btn: "Sounds Good!",
    onb_2_title: "Unlimited Digital Answers",
    onb_2_desc: "Sign up for free to get unlimited digital answer keys forever.",
    onb_2_btn: "Tell Me More",
    onb_academy_title: "Curriculum Context",
    onb_academy_desc: "We analyze context based on top EK academy standards like Poly, ECC, and GATE.",
    onb_3_title: "Guided Learning",
    onb_3_desc: "Know exactly how to teach each specific question with our bilingual guides.",
    onb_3_btn: "Let's Start",
    onb_skip: "Skip Tour",

    // Dashboard
    drop_title: "Snap the Worksheet",
    drop_subtitle: "Get your digital answer key instantly",
    btn_upload: "Snap Worksheet",
    lbl_pro_active: "Pro Features Active",
    lbl_member_active: "Unlimited Magic Scans Active",

    // Results & Errors
    ws_results_title: "Digital Answer Guide",
    ws_voice_guide: "💡 Tap an answer to hear the pronunciation!",
    ws_gen_practice: "AI Practice Sheet",
    ws_scanning_header: "AI is Scanning...",
    ws_items_found: "questions analyzed",
    ws_scan_again: "Scan New",
    tip_click_guide: "💡 Tap any question to see your teaching tips!",
    growing_text: "Generating Sheet...",
    error_title: "Scan Failed",
    err_network: "Network error. Please check your connection and try again.",
    err_confirm: "Start over and scan a new worksheet?",
    btn_retake: "Retake Photo",
    btn_scan_again_simple: "Try Again",

    // Review
    review_title: "Review Note",
    lbl_mistakes_count: "mistakes recorded",
    lbl_question: "Question",
    lbl_correct_answer: "Answer",
    lbl_write_answer: "Practice Area",
    print_footer: "Made with love by Chekki AI",

    // Misc
    guest_scan_badge: "1 Free Magic Scan Ready",
    guest_used_title: "Free Scan Used!",
    guest_used_desc: "You've seen the magic. Sign up now for UNLIMITED magic scans and see your digital answer key anytime!",
    login_guest_link: "Not ready? Try 1 scan as guest",
    lbl_mom_tip: "Teaching Script",
    reward_job: "Great Job!",
    reward_stamp: "Digital Stamp",
    reward_tap: "Tap to stamp!",
    res_title: "Resources",
    res_subtitle: "Spread the magic",
    res_copied: "Link Copied!",
    res_flyer: "Promotional Flyer",
    res_download: "Download PDF",
    res_share: "Share Link",
    pw_title: "Upgrade to Pro",
    pw_desc: "Unlock the full pedagogical power of Chekki.",
    pw_alert_title: "Beta Pro Feature",
    pw_alert_desc: "Audio, Scripts, and Practice Sheets require Beta Access. Your Magic Scans remain unlimited!",
    pw_alert_cta: "Enter Beta Code",
    pw_alert_back: "Maybe Later",
    share_title: "Mom's Lounge",
    share_desc: "Share your child's success with other parents.",
    share_btn: "Copy Share Template",
    share_toast: "Copied to Clipboard!"
  },
  ko: {
    app_name: "채키 AI",
    tagline: "정답은 채키가, 칭찬은 부모님이",
    login: "무료로 시작하기",
    logout: "로그아웃",
    scans: "번의 마법 남음",
    pro_plan: "베타 프로 🚀",

    // Homescreen Marketing
    feat_title: "왜 채키인가요?",
    feat_1_title: "완벽한 디지털 답지",
    feat_1_desc: "답안지를 찾느라 고생하지 마세요. 사진만 찍으면 종이 위에 정답이 마법처럼 나타납니다.",
    feat_2_title: "다정한 티칭 대본",
    feat_2_desc: "아이에게 어떻게 설명해야 할지 고민되시죠? 엄마가 바로 읽어줄 수 있는 다정한 대본을 드려요.",
    feat_3_title: "원어민 발음 코치",
    feat_3_desc: "아이가 직접 말해보는 음성 체크 기능으로 발음을 교정하고 디지털 도장도 받을 수 있어요.",
    feat_4_title: "AI 연습문제 생성",
    feat_4_desc: "지금 풀고 있는 학습지와 가장 유사한 문제를 AI가 즉석에서 만들어 드립니다.",

    // Onboarding
    onb_1_title: "숙제 전쟁, 이제 그만",
    onb_1_desc: "채점은 채키가 할게요. 부모님은 칭찬만 해주세요.",
    onb_1_btn: "좋아요!",
    onb_2_title: "무제한 디지털 답지",
    onb_2_desc: "가입만 하면 모든 숙제의 정답 오버레이를 평생 무제한으로 볼 수 있어요.",
    onb_2_btn: "더 궁금해요",
    onb_academy_title: "영유 맞춤 분석",
    onb_academy_desc: "폴리, ECC, 게이트 등 주요 영유 커리큘럼 맥락을 완벽히 이해합니다.",
    onb_3_title: "가이드 학습",
    onb_3_desc: "문제마다 맞춤형 티칭 가이드를 제공하여 전문 선생님처럼 가르칠 수 있습니다.",
    onb_3_btn: "시작하기",
    onb_skip: "건너뛰기",

    // Dashboard
    drop_title: "여기에 숙제를 보여주세요",
    drop_subtitle: "종이 위에 정답이 마법처럼 나타나요",
    btn_upload: "숙제 사진 찍기",
    lbl_pro_active: "프로 기능 활성화됨",
    lbl_member_active: "무제한 디지털 답지 활성화",

    // Results & Errors
    ws_results_title: "디지털 정답 가이드",
    ws_voice_guide: "💡 정답을 누르면 원어민 발음을 들려드려요!",
    ws_gen_practice: "AI 복습 문제 만들기",
    ws_scanning_header: "AI 분석 중...",
    ws_items_found: "개의 문제를 찾았습니다",
    ws_scan_again: "새로 찍기",
    tip_click_guide: "💡 문제를 누르면 다정한 티칭 가이드가 나타나요!",
    growing_text: "문제 생성 중...",
    error_title: "분석 실패",
    err_network: "네트워크 오류가 발생했습니다. 다시 시도해주세요.",
    err_confirm: "현재 분석 결과를 지우고 새로 찍으시겠습니까?",
    btn_retake: "다시 찍기",
    btn_scan_again_simple: "재시도",

    // Review
    review_title: "오답 노트",
    lbl_mistakes_count: "개의 오답이 기록됨",
    lbl_question: "문제",
    lbl_correct_answer: "정답",
    lbl_write_answer: "직접 써보기",
    print_footer: "채키 AI와 함께하는 즐거운 숙제 시간",

    // Misc
    guest_scan_badge: "무료 마법 1회 가능",
    guest_used_title: "무료 체험 완료!",
    guest_used_desc: "채키의 마법을 보셨나요? 가입만 하면 평생 '무제한 디지털 답지' 기능을 무료로 사용할 수 있어요!",
    login_guest_link: "회원가입 없이 1회 무료 체험하기",
    lbl_mom_tip: "티칭 스크립트",
    reward_job: "참 잘했어요!",
    reward_stamp: "디지털 참잘했어요 도장",
    reward_tap: "도장을 꾹 눌러주세요!",
    res_title: "홍보 자료",
    res_subtitle: "채키의 마법을 널리 알려주세요",
    res_copied: "링크가 복사되었습니다!",
    res_flyer: "홍보 전단지",
    res_download: "PDF 다운로드",
    res_share: "링크 공유",
    pw_title: "프로로 업그레이드",
    pw_desc: "채키의 모든 학습 기능을 무제한으로 즐기세요.",
    pw_alert_title: "베타 프로 전용 기능",
    pw_alert_desc: "원어민 오디오, 티칭 스크립트, 복습 문제는 베타 코드가 필요합니다. 무제한 답지 기능은 계속 무료입니다!",
    pw_alert_cta: "베타 코드 입력하기",
    pw_alert_back: "나중에 하기",
    share_title: "맘스 라운지",
    share_desc: "아이의 성장 기록을 다른 부모님들과 공유해보세요.",
    share_btn: "공유 템플릿 복사",
    share_toast: "클립보드에 복사되었습니다!"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('chekki_lang');
    if (saved === 'ko' || saved === 'en') return saved;
    return navigator.language.startsWith('ko') ? 'ko' : 'en';
  });

  useEffect(() => {
    localStorage.setItem('chekki_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const translation = translations[language];
    if (translation && (translation as any)[key]) return (translation as any)[key];
    const englishFallback = (translations['en'] as any)[key];
    if (englishFallback) return englishFallback;
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};