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
    
    // Guest Mode CTAs
    hero_guest_cta: "Try 1 Free Scan",
    login_guest_link: "Not ready? Try 1 scan as guest",
    guest_scan_badge: "1 Free Magic Scan Ready",
    guest_used_title: "Free Scan Used!",
    guest_used_desc: "You've seen the magic. Sign up now for UNLIMITED magic scans and see your digital answer key anytime!",

    // Dashboard
    drop_title: "Snap the Worksheet",
    drop_subtitle: "Get your digital answer key instantly",
    btn_upload: "Snap Worksheet",
    lbl_pro_active: "Pro Features Active",
    lbl_magic_unlimited: "Unlimited Magic Scans",
    lbl_member_active: "Unlimited Magic Scans Active",
    lbl_member_subtitle: "All your answer overlays are free and unlimited.",

    // Onboarding
    onb_1_title: "Stop the Homework War",
    onb_1_desc: "Chekki provides the answers, you provide the hugs.",
    onb_2_title: "Unlimited Digital Answers",
    onb_2_desc: "Sign up for free to get unlimited digital answer keys forever.",
    
    // Paywall Alert
    pw_alert_title: "Beta Pro Feature",
    pw_alert_desc: "Audio, Scripts, and Practice Sheets require Beta Access. Your Magic Scans remain unlimited!",
    pw_alert_cta: "Enter Beta Code",
    pw_alert_back: "Maybe Later",

    // Results
    ws_results_title: "Your Digital Guide",
    ws_voice_guide: "💡 Tap an answer to hear the pronunciation!",
    ws_gen_practice: "AI Practice Sheet",
    tip_click_guide: "💡 Tap any question to see your teaching tips!",
    
    // Misc
    footer_text: "Chekki AI - Supporting every English Kindergarten family with love."
  },
  ko: {
    app_name: "채키 AI",
    tagline: "정답은 채키가, 칭찬은 부모님이",
    login: "무료로 시작하기",
    logout: "로그아웃",
    scans: "번의 마법 남음",
    pro_plan: "베타 프로 🚀",

    // Guest Mode CTAs
    hero_guest_cta: "1회 무료 체험하기",
    login_guest_link: "회원가입 없이 1회 무료 체험하기",
    guest_scan_badge: "무료 마법 1회 가능",
    guest_used_title: "무료 체험 완료!",
    guest_used_desc: "채키의 마법을 보셨나요? 가입만 하면 평생 '무제한 디지털 답지' 기능을 무료로 사용할 수 있어요!",

    // Dashboard
    drop_title: "여기에 숙제를 보여주세요",
    drop_subtitle: "종이 위에 정답이 마법처럼 나타나요",
    btn_upload: "숙제 사진 찍기",
    lbl_pro_active: "프로 기능 활성화됨",
    lbl_magic_unlimited: "무제한 마법 스캔",
    lbl_member_active: "무제한 디지털 답지 활성화",
    lbl_member_subtitle: "가입 회원님은 모든 숙제의 정답을 무제한으로 볼 수 있습니다.",

    // Onboarding
    onb_1_title: "숙제 전쟁, 이제 그만",
    onb_1_desc: "채점은 채키가 할게요. 부모님은 칭찬만 해주세요.",
    onb_2_title: "무제한 디지털 답지",
    onb_2_desc: "가입만 하면 모든 숙제의 정답 오버레이를 평생 무제한으로 볼 수 있어요.",

    // Paywall Alert
    pw_alert_title: "베타 프로 전용 기능",
    pw_alert_desc: "원어민 오디오, 티칭 스크립트, 복습 문제는 베타 코드가 필요합니다. 무제한 답지 기능은 계속 무료입니다!",
    pw_alert_cta: "베타 코드 입력하기",
    pw_alert_back: "나중에 하기",
    
    // Results
    ws_results_title: "디지털 정답 가이드",
    ws_voice_guide: "💡 정답을 누르면 원어민 발음을 들려드려요!",
    ws_gen_practice: "AI 복습 문제 만들기",
    tip_click_guide: "💡 문제를 누르면 다정한 티칭 가이드가 나타나요!",
    
    // Misc
    footer_text: "대한민국 모든 영유 부모님들을 진심으로 응원합니다."
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