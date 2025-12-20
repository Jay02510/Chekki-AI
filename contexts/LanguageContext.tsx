
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
    tagline: "Mom's Friendly Homework Partner",
    login: "Start Here",
    logout: "Bye for now!",
    scans: "Magic Helps",
    pro_plan: "Pro Magic 🚀",
    
    // Hero / Camera
    hero_title: "English Homework?\nLeave it to Chekki!",
    hero_desc: "Don't stress over tricky English questions anymore. Get warm, easy-to-understand explanations and clear answers instantly. Help your child grow with confidence!",
    hero_badge: "Mom's Secret Helper",
    hero_cta_title: "Happy Homework,",
    hero_cta_desc: "Join thousands of moms who've turned homework time into a peaceful, happy bonding moment.",
    hero_cta_btn: "Try it for Free",
    btn_upload: "Upload Image",
    
    // Loading
    processing: "Looking at the questions...",
    loading_step0: "Waking up my brain...",
    loading_step1: "Reading the stories carefully...",
    loading_step2: "Finding the best answers...",
    loading_step3: "Writing your kind guide...",
    loading_step4: "Almost ready! Just a second...",
    loading_tip: "💡 Busy worksheets might take a bit longer!",
    loading_almost: "🚀 Almost there! Preparing your guide...",
    btn_cancel_retry: "Cancel and try again",

    // Workspace
    ws_results_title: "Chekki's Results",
    ws_items_found: "ITEMS FOUND",
    ws_review_tip: "Tip: Click the flag 🚩 to gently save tricky questions for later practice!",
    ws_voice_guide: "💡 Tap an answer to hear the English pronunciation!",
    ws_gen_practice: "Generate Practice Questions",
    ws_scan_again: "Scan Again",
    ws_overlay: "Focus View",
    ws_list: "Easy List",
    
    // Errors
    error_title: "Oops! Let's try again.",
    btn_retry: "Try with Smart AI",
    btn_retake: "Take New Photo",
    err_confirm: "Are you sure? Current results will be lost.",
    err_network: "Connection is weak. Let's try again!",

    // Misc
    dash_welcome: "Hi there,",
    dash_subtitle: "Upload the homework and I'll make you an easy teaching guide.",
    scans_left: "Homework Magic Left",
    supported_formats: "JPG, PNG, WEBP, HEIC are all great!",
    footer_text: "Gemini 3 Pro Powered • Your Friendly Homework Buddy"
  },
  ko: {
    app_name: "채키 AI",
    tagline: "엄마를 위한 다정한 영어 숙제 파트너",
    login: "함께 시작해요",
    logout: "다음에 만나요!",
    scans: "번의 마법 남음",
    pro_plan: "마법 프로 플랜 🚀",

    // Hero / Camera
    hero_title: "영어 숙제 정답,\n채키가 다정하게 알려드려요!",
    hero_desc: "어려운 영어 문제로 고민하지 마세요. 따뜻하고 이해하기 쉬운 설명과 정답을 즉시 확인하고, 우리 아이에게 자신 있게 가르쳐주세요.",
    hero_badge: "엄마만의 비밀 도우미",
    hero_cta_btn: "무료로 체험해보기",
    btn_upload: "이미지 업로드",
    
    // Loading
    processing: "문제를 읽어보고 있어요...",
    loading_step0: "머리를 맞대고 고민 중...",
    loading_step1: "이야기를 꼼꼼히 읽고 있어요...",
    loading_step2: "멋진 정답을 찾는 중이에요...",
    loading_step3: "다정한 설명을 쓰고 있어요...",
    loading_step4: "거의 다 됐어요! 조금만 기다려주세요.",
    loading_tip: "💡 사진에 글자가 많으면 조금 더 걸릴 수 있어요.",
    loading_almost: "🚀 거의 다 됐어요! 정답지를 준비 중입니다.",
    btn_cancel_retry: "취소하고 다시 시도하기",

    // Workspace
    ws_results_title: "채키의 채점 결과",
    ws_items_found: "개의 문제 해결됨",
    ws_review_tip: "팁: 🚩 깃발을 누르면 어려운 문제를 나중에 복습할 수 있도록 저장해요!",
    ws_voice_guide: "💡 정답을 누르면 영어 발음을 들려드려요!",
    ws_gen_practice: "맞춤 연습문제 만들기",
    ws_scan_again: "다시 찍기",
    ws_overlay: "포커스 뷰",
    ws_list: "다정한 리스트",
    
    // Errors
    error_title: "앗! 조금만 더 잘 보여주세요.",
    btn_retry: "똑똑한 AI로 다시 시도",
    btn_retake: "새로 찍기",
    err_confirm: "정말 취소하시겠어요? 현재 결과가 사라집니다.",
    err_network: "연결이 잠시 끊겼나 봐요. 다시 시도해 볼까요?",

    // Misc
    dash_welcome: "반가워요,",
    dash_subtitle: "숙제 사진만 올려주세요! 제가 다정한 정답 가이드를 만들어 드릴게요.",
    scans_left: "남은 마법 횟수",
    supported_formats: "JPG, PNG, WEBP, HEIC 모두 좋아요!",
    footer_text: "Gemini 3 Pro 기반 • 엄마를 위한 다정한 영어 숙제 파트너"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hw_language');
      if (stored === 'en' || stored === 'ko') return stored;
    }
    return 'ko'; 
  });

  useEffect(() => {
    localStorage.setItem('hw_language', language);
  }, [language]);

  const t = (key: string) => {
    // @ts-ignore
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
};
