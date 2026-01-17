
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
    tagline: "Grading by Chekki, Praise by Mom",
    login: "Start Free",
    logout: "Log Out",
    scans: "Magic Scans",
    pro_plan: "Pro Magic 🚀",
    
    // Hero
    hero_title: "Homework Stress?\nJust Snap a Photo.",
    hero_title_night: "Hard day, Mom?\nLet Chekki take it from here.",
    hero_desc: "The homework war is over. Get instant answers and 'Mom Scripts' so you can teach with confidence and love. Perfect for English Kindergarten families.",
    hero_desc_night: "Enjoy your 'parenting retirement' 5 minutes earlier. Chekki handles the grading while you provide the hugs.",
    hero_badge: "99.9% Accuracy for Kids",
    hero_cta_title: "Peaceful Nights,",
    hero_cta_desc: "Join 10,000+ moms who've turned homework time into a happy bonding moment.",
    hero_cta_btn: "Start for Free Today",
    
    // Camera / Dashboard
    btn_upload: "Take a Photo",
    drop_title: "Snap the Worksheet",
    drop_subtitle: "Tap here to pick a photo",
    supported_formats: "Images are processed temporarily and NEVER stored. Privacy first.",
    dash_welcome: "Hi, Mom!",
    dash_subtitle: "Snap a photo to get your 1-minute teaching guide.",
    
    // How it works
    how_title: "How Chekki Works",
    how_step1: "Snap a Photo",
    how_step1_desc: "Capture the worksheet page clearly.",
    how_step2: "Instant Overlay",
    how_step2_desc: "Answers appear right on the paper.",
    how_step3: "Teach with Love",
    how_step3_desc: "Use 'Mom Scripts' to explain kindly.",

    // Trust
    trust_title: "Safe for Your Family",
    trust_privacy: "Zero Image Storage",
    trust_privacy_desc: "We process images in-memory and discard them immediately. Your child's privacy is our #1 priority.",
    trust_safety: "Parent-Mediated",
    trust_safety_desc: "Children never interact with the AI directly. You hold the authority; Chekki provides the tools.",

    // Comparison
    diff_title: "Why Chekki?",
    diff_ocr: "Kid-Handwriting AI",
    diff_ocr_desc: "Unlike Google Lens, we understand messy handwriting and worksheet contexts.",
    diff_script: "Mom's Teaching Scripts",
    diff_script_desc: "We don't just give answers. We give you the exact words to say to your child.",

    // Analysis & Loading
    processing: "Analyzing questions...",
    loading_step0: "Connecting to pedagogical brain...",
    loading_step1: "Reading the worksheet context...",
    loading_step2: "Generating Mom's Scripts...",
    loading_step3: "Preparing native audio...",
    loading_step4: "Almost there! Ready to teach...",
    loading_tip: "💡 Detailed worksheets take a few extra seconds!",
    loading_almost: "🚀 Preparing your teaching guide...",
    btn_cancel_retry: "Cancel",

    // Results
    ws_results_title: "Teaching Guide",
    ws_items_found: "questions found",
    ws_voice_guide: "💡 Tap answers to hear native pronunciation!",
    ws_gen_practice: "Generate Similar Practice",
    ws_scan_again: "Next Page",
    ws_overlay: "Focus View",
    ws_list: "Step-by-Step",
    ws_scanning_header: "Reading worksheet...",
    ws_scanning_detail: "Analyzing handwriting...",
    ws_finding_questions: "Finding Questions...",

    // Errors
    error_title: "Let's try one more time!",
    err_network: "The connection is a bit sleepy. Check your lighting and try again!",
    err_confirm: "Are you sure? Current worksheet data will be reset.",
    btn_scan_again_simple: "Try Again",
    btn_retake: "Retake Photo",
    growing_text: "Processing...",
    tt_report: "Report Error",
    lbl_mom_tip: "Mom's Script",

    // Paywall
    pw_title: "Buy Back Your Time",
    pw_desc: "Unlimited scans and AI practice sheets for the price of a latte.",
    
    // Rewards
    reward_job: "Amazing Job!",
    reward_stamp: "Perfect Stamp",
    reward_tap: "Tap to stamp the page!",

    // Onboarding
    onb_1_title: "Stop the Homework War",
    onb_1_desc: "Turn correction time into bonding time.",
    onb_1_btn: "Next",
    onb_2_title: "Snap & Solve",
    onb_2_desc: "Answers appear instantly on your phone.",
    onb_2_btn: "Got it",
    onb_3_title: "Safe & Private",
    onb_3_desc: "Images are never stored. Privacy is our priority.",
    onb_3_btn: "Start Now",

    // Community / Feedback
    beta_banner: "✨ Chekki is growing! Share your feedback with us.",
    fb_title: "Share Feedback",
    fb_desc: "How can we make homework easier for you?",
    fb_success: "Thank you for the feedback!",
    fb_rating: "How was the experience?",
    fb_comment: "Anything else to share?",
    fb_submit: "Send with Love",
    fb_error_desc: "Found a mistake? Let us know!",

    // Misc / Labels
    lbl_question: "Question",
    lbl_write_answer: "Write the answer here",
    lbl_correct_answer: "Correct Answer",
    lbl_mistakes_count: "Review items found",
    review_title: "My Review Note",
    review_empty_title: "All Clear!",
    review_empty_desc: "No review items yet. Great job!",
    review_print_btn: "Print Practice Sheet",
    print_footer: "Made with Love by Chekki AI",

    footer_text: "Chekki AI - Supporting every English Kindergarten family with love."
  },
  ko: {
    app_name: "채키 AI",
    tagline: "채점은 채키가, 칭찬은 엄마가",
    login: "무료로 시작하기",
    logout: "로그아웃",
    scans: "번의 마법 남음",
    pro_plan: "마법 프로 플랜 🚀",

    // Hero
    hero_title: "오늘 숙제 전쟁,\n사진 한 장으로 끝내세요",
    hero_title_night: "오늘도 고생 많으셨어요.\n야간 숙제는 채키가 맡을게요.",
    hero_desc: "영유 숙제, 더 이상 엄마의 스트레스가 되지 않게. 정확한 정답과 '엄마표 티칭 스크립트'로 아이에겐 자신감을, 엄마에겐 여유를 선물하세요.",
    hero_desc_night: "육아퇴근을 5분 더 앞당겨 드릴게요. 채점은 채키가 할 테니, 어머님은 아이를 한 번 더 안아주세요.",
    hero_badge: "영유 맞춤형 99.9% 정확도",
    hero_cta_title: "행복한 숙제 시간,",
    hero_cta_desc: "이미 1만 명의 엄마들이 숙제 시간을 '혼내는 시간'에서 '칭찬하는 시간'으로 바꿨습니다.",
    hero_cta_btn: "지금 바로 시작하기",
    
    // Camera / Dashboard
    btn_upload: "숙제 사진 찍기",
    drop_title: "여기에 숙제를 보여주세요",
    drop_subtitle: "터치하여 사진을 찍거나 앨범에서 선택",
    supported_formats: "업로드된 이미지는 분석 후 즉시 삭제됩니다. 안심하고 사용하세요.",
    dash_welcome: "반가워요, 어머님!",
    dash_subtitle: "숙제 사진을 올려주시면 1분 만에 티칭 가이드를 만들어드려요.",

    // How it works
    how_title: "채키는 이렇게 도와드려요",
    how_step1: "사진 찍기",
    how_step1_desc: "숙제 페이지를 찰칵 찍어주세요.",
    how_step2: "정답 오버레이",
    how_step2_desc: "종이 위에 정답이 마법처럼 나타나요.",
    how_step3: "다정하게 지도",
    how_step3_desc: "티칭 스크립트로 친절하게 알려주세요.",

    // Trust
    trust_title: "엄마들이 채키를 믿는 이유",
    trust_privacy: "이미지 즉시 파기 원칙",
    trust_privacy_desc: "아이의 숙제 사진은 서버에 저장되지 않고 분석 즉시 파기됩니다. 개인정보 걱정 없이 사용하세요.",
    trust_safety: "엄마가 주도하는 학습",
    trust_safety_desc: "아이가 AI와 직접 대화하지 않습니다. 엄마가 정답을 확인하고 직접 가르쳐주는 '엄마표 영어'의 가치를 지킵니다.",

    // Comparison
    diff_title: "구글 렌즈나 파파고와 무엇이 다른가요?",
    diff_ocr: "아이 손글씨 특화 AI",
    diff_ocr_desc: "삐뚤빼뚤한 아이의 글씨와 영유 교재 특유의 맥락을 완벽하게 이해합니다.",
    diff_script: "다정한 '엄마표' 스크립트",
    diff_script_desc: "단순한 답안지가 아닙니다. 아이에게 어떻게 설명하면 좋을지 다정한 한마디를 매칭해 드립니다.",

    // Analysis & Loading
    processing: "문제를 분석하고 있어요...",
    loading_step0: "영유 교육 데이터 연결 중...",
    loading_step1: "숙제 페이지 맥락 읽는 중...",
    loading_step2: "다정한 엄마표 스크립트 작성 중...",
    loading_step3: "원어민 발음 가이드 준비 중...",
    loading_step4: "준비 완료! 아이와 함께 보세요...",
    loading_tip: "💡 복잡한 페이지는 조금 더 시간이 걸릴 수 있어요!",
    loading_almost: "🚀 곧 완료됩니다! 다정한 가이드를 준비 중이에요...",
    btn_cancel_retry: "취소",

    // Results
    ws_results_title: "채키의 티칭 가이드",
    ws_items_found: "개의 문제를 해결했어요",
    ws_voice_guide: "💡 정답을 누르면 원어민 발음을 들려드려요!",
    ws_gen_practice: "맞춤 복습 문제 만들기",
    ws_scan_again: "다음 페이지 찍기",
    ws_overlay: "집중 보기",
    ws_list: "목록으로 보기",
    ws_scanning_header: "문제를 읽는 중...",
    ws_scanning_detail: "손글씨를 분석하고 있어요...",
    ws_finding_questions: "문제를 찾는 중...",

    // Errors
    error_title: "다시 한번 해볼까요?",
    err_network: "조명이 너무 어둡거나 연결이 불안정해요. 밝은 곳에서 다시 찍어주세요!",
    err_confirm: "정말 취소하시겠어요? 현재 숙제 정보가 사라집니다.",
    btn_scan_again_simple: "다시 분석하기",
    btn_retake: "사진 다시 찍기",
    growing_text: "생성 중...",
    tt_report: "오류 신고",
    lbl_mom_tip: "엄마의 한마디",

    // Paywall
    pw_title: "매일 밤 평화를 구매하세요",
    pw_desc: "커피 한 잔 값으로 무제한 스캔과 AI 복습 문제 생성 기능을 누리세요.",
    
    // Rewards
    reward_job: "정말 잘했어요!",
    reward_stamp: "참 잘했어요",
    reward_tap: "아이와 함께 도장을 꾹 눌러보세요!",

    // Onboarding
    onb_1_title: "숙제 전쟁, 이제 그만",
    onb_1_desc: "혼내는 시간에서 칭찬하는 시간으로 바꿔보세요.",
    onb_1_btn: "다음",
    onb_2_title: "사진만 찍으세요",
    onb_2_desc: "삐뚤빼뚤한 손글씨도 채키가 다 읽어드려요.",
    onb_2_btn: "확인",
    onb_3_title: "안심하고 사용하세요",
    onb_3_desc: "사진은 저장되지 않고 즉시 삭제됩니다.",
    onb_3_btn: "시작하기",

    // Community / Feedback
    beta_banner: "✨ 채키는 성장 중! 더 좋은 서비스가 될 수 있게 의견을 들려주세요.",
    fb_title: "의견 보내기",
    fb_desc: "채키가 어떻게 더 도와드리면 좋을까요?",
    fb_success: "소중한 의견 감사합니다!",
    fb_rating: "사용 경험은 어떠셨나요?",
    fb_comment: "더 하고 싶은 말씀이 있으신가요?",
    fb_submit: "사랑을 담아 보내기",
    fb_error_desc: "분석 오류가 있었나요? 알려주시면 바로 개선할게요!",

    // Misc / Labels
    lbl_question: "문제",
    lbl_write_answer: "여기에 정답을 써보세요",
    lbl_correct_answer: "정답",
    lbl_mistakes_count: "개의 복습할 문제가 있어요",
    review_title: "우리 아이 오답 노트",
    review_empty_title: "참 잘했어요!",
    review_empty_desc: "아직 복습할 문제가 없네요. 완벽합니다!",
    review_print_btn: "프린트용 학습지 만들기",
    print_footer: "채키 AI - 다정한 엄마표 영어 가이드",

    footer_text: "채키 AI - 대한민국 모든 영유 맘들을 진심으로 응원합니다."
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
