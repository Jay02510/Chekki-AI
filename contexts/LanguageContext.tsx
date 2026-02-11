
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
    pro_plan: "Pro Magic 🚀",
    
    // Viral Sharing
    share_title: "Spread the Peace 🕊️",
    share_desc: "Help other parents find peace. Copy a pre-made template for your favorite Mom Cafe!",
    share_btn: "Copy Cafe Template",
    share_toast: "Template Copied! Ready to post.",
    
    // Payments & Compliance (Toss Approval Exact Strings)
    pay_method_card: "Credit / Debit Card",
    pay_method_easy: "Easy Pay (Kakao, Naver)",
    pay_secure_notice: "Secure payment guaranteed via Toss Escrow",
    pay_vat_included: "VAT included",
    pay_auto_renew: "This is a recurring subscription product.",
    pay_cancel_notice: "Subscriptions may be cancelled anytime from the My Page section.",
    biz_name: "Chekki",
    biz_info_title: "Business Information",
    biz_reg_num: "Business Registration Number: 814-14-03096",
    biz_rep: "Representative: Jason Benjamin",
    biz_address: "Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea",
    biz_mail_order: "E-commerce Registration Number: (Pending)",
    biz_hours: "Customer Support Hours: Weekdays 10AM–6PM (KST)",
    biz_escrow: "This service guarantees payment safety through the Purchase Safety Service (Escrow).",
    biz_contact_notice: "Inquiries are accepted 24 hours a day and will be answered within 1 business day.",
    biz_email: "Email: jsn.benjamin@gmail.com",
    
    // UI Labels for Footer Nav
    nav_home: "Home",
    nav_pricing: "Pricing",
    nav_terms: "Terms of Service",
    nav_privacy: "Privacy Policy",
    nav_refund: "Refund Policy",
    nav_contact: "Contact Us",

    // Analysis & Loading
    processing: "Generating answer key...",
    loading_step0: "Scanning for questions...",
    loading_step1: "Preparing the answer key...",
    loading_step2: "Writing your teaching scripts...",
    loading_step3: "Syncing native audio...",
    loading_step4: "Ready! Time to teach with love...",
    loading_thorough: "Chekki is checking thoroughly to give you the perfect answers.",
    loading_tip: "💡 Complex pages take a few extra seconds!",
    loading_almost: "🚀 Almost there! Preparing your guide...",
    btn_cancel_retry: "Cancel",

    // Results
    ws_results_title: "Your Teaching Guide",
    ws_items_found: "answers identified",
    ws_voice_guide: "💡 Tap an answer to hear the pronunciation!",
    ws_gen_practice: "Extra Practice Sheet",
    ws_scan_again: "Next Page",
    
    // Paywall
    pw_title: "Buy Back Your Time",
    pw_desc: "Unlimited scans and AI practice sheets for the price of a latte.",
    
    // Errors
    error_title: "Let's try one more time!",
    err_network: "The lighting might be tricky. Try a clearer shot for perfect answers!",
    err_confirm: "Are you sure? Current data will be reset.",
    btn_scan_again_simple: "Try Again",
    btn_retake: "Retake Photo",
    growing_text: "Generating...",

    footer_text: "Chekki AI - Supporting every English Kindergarten family with love."
  },
  ko: {
    app_name: "채키 AI",
    tagline: "정답은 채키가, 칭찬은 부모님이",
    login: "무료로 시작하기",
    logout: "로그아웃",
    scans: "번의 마법 남음",
    pro_plan: "마법 프로 플랜 🚀",

    // Viral Sharing
    share_title: "이 평화를 다른 분들께도 🕊️",
    share_desc: "영유 맘 카페에 채키 사용 후기를 남겨주세요! 숙제 시간이 훨씬 행복해집니다.",
    share_btn: "맘 카페 양식 복사하기",
    share_toast: "양식이 복사되었습니다! 카페에 바로 올려보세요.",

    // Payments & Compliance (Toss Approval Exact Strings)
    pay_method_card: "일반 신용/체크카드",
    pay_method_easy: "간편 결제 (카카오페이, 네이버페이)",
    pay_secure_notice: "구매안전서비스(에스크로)를 통해 결제 안전을 보장합니다.",
    pay_vat_included: "부가세 포함",
    pay_auto_renew: "자동 결제 구독 상품입니다. 언제든지 해지 가능합니다.",
    pay_cancel_notice: "구독 해지는 마이페이지에서 언제든지 가능하며, 해지 시 다음 결제일부터 과금되지 않습니다.",
    biz_name: "Chekki (채키)",
    biz_info_title: "사업자 정보",
    biz_reg_num: "사업자등록번호: 814-14-03096",
    biz_rep: "대표자: Jason Benjamin (제이슨 벤자민)",
    biz_address: "주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113",
    biz_mail_order: "통신판매업 신고번호: 제2025-서울종로-XXXX호 (발급 후 기재)",
    biz_hours: "고객센터 운영시간: 평일 10:00–18:00 (공휴일 제외)",
    biz_escrow: "본 서비스는 구매안전서비스(에스크로)를 통해 결제 안전을 보장합니다.",
    biz_contact_notice: "문의는 24시간 접수 가능하며 1영업일 이내 답변드립니다.",
    biz_email: "이메일: jsn.benjamin@gmail.com",

    // UI Labels for Footer Nav
    nav_home: "홈",
    nav_pricing: "요금 안내",
    nav_terms: "이용약관",
    nav_privacy: "개인정보처리방침",
    nav_refund: "환불정책",
    nav_contact: "문의하기",

    // Analysis & Loading
    processing: "정답지를 만들고 있어요...",
    loading_step0: "문제들을 찾고 있어요...",
    loading_step1: "정답 데이터를 매칭하는 중...",
    loading_step2: "다정한 티칭 스크립트 작성 중...",
    loading_step3: "원어민 발음 가이드 준비 중...",
    loading_step4: "준비 완료! 아이와 함께 보세요...",
    loading_thorough: "완벽한 정답을 위해 채키가 꼼꼼하게 확인하고 있어요.",
    loading_tip: "💡 내용이 많은 페이지는 조금 더 걸릴 수 있어요!",
    loading_almost: "🚀 곧 완료됩니다! 다정한 가이드를 준비 중이에요...",
    btn_cancel_retry: "취소",

    // Results
    ws_results_title: "채키의 정답 가이드",
    ws_items_found: "개의 정답을 확인했어요",
    ws_voice_guide: "💡 정답을 누르면 원어민 발음을 들려드려요!",
    ws_gen_practice: "추가 복습 문제 만들기",
    ws_scan_again: "다음 페이지 찍기",

    // Paywall
    pw_title: "매일 밤 평화를 구매하세요",
    pw_desc: "커피 한 잔 값으로 무제한 스캔과 AI 복습 문제 생성 기능을 누리세요.",
    
    // Errors
    error_title: "다시 한번 해볼까요?",
    err_network: "사진이 조금 흐릿해요. 정답을 정확히 찾으려면 밝은 곳에서 다시 찍어주세요!",
    err_confirm: "정말 취소하시겠어요? 현재 숙제 정보가 사라집니다.",
    btn_scan_again_simple: "다시 분석하기",
    btn_retake: "사진 다시 찍기",
    growing_text: "생성 중...",

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
    return (translations[language] as any)[key] || (translations['en'] as any)[key] || key;
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
