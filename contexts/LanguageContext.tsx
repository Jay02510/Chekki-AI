
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
    tagline: "Answers for You, Praise for Them",
    login: "Start Free",
    logout: "Log Out",
    scans: "Magic Scans",
    pro_plan: "Pro Magic 🚀",
    
    // Payments & Compliance
    pay_method_card: "Credit / Debit Card",
    pay_method_easy: "Easy Pay (Kakao, Naver)",
    pay_secure_notice: "Secure payment powered by Toss Payments",
    biz_info_title: "Business Information",
    biz_reg_num: "Reg: 123-45-67890",
    biz_rep: "Rep: Chekki Team",
    
    // Instructional Tips
    tip_click_guide: "💡 Tap any question to see your Teaching Script!",
    tip_scroll_more: "Scroll down to see all answers",
    
    // Security Section
    sec_audit_title: "Privacy & Security Audit",
    sec_audit_desc: "Your family's safety is our #1 priority. Chekki is built on a 'Zero-Storage' architecture.",
    sec_point_1: "Images are deleted instantly after analysis",
    sec_point_2: "Encrypted data transmission (SSL/TLS)",
    sec_point_3: "Child-Safe: No personal identifiers stored",
    sec_point_4: "Authorized School codes verify identity",

    // Resource Center
    res_title: "Read More",
    res_subtitle: "Help other parents find peace.",
    res_download: "Download",
    res_copy: "Copy Link",
    res_share: "Share",
    res_copied: "Link Copied!",
    res_flyer: "Chekki Official Flyer",
    
    // Hero
    hero_title: "Instant Answer Key\nRight on the Paper.",
    hero_title_night: "Long day?\nLet Chekki handle the grading.",
    hero_desc: "The homework war is over. Get instant answer overlays and 'Teaching Scripts' so you can teach with confidence and love. No more guessing.",
    hero_desc_night: "Enjoy your 'parenting retirement' 5 minutes earlier. Chekki handles the answers while you provide the hugs.",
    hero_badge: "High-Accuracy Answer Key",
    hero_cta_title: "Peaceful Nights,",
    hero_cta_desc: "Join 10,000+ parents who've turned homework time into a happy bonding moment.",
    hero_cta_btn: "Start for Free Today",
    
    // Camera / Dashboard
    btn_upload: "Snap Worksheet",
    btn_walkthrough: "Watch Walkthrough",
    drop_title: "Snap the Worksheet",
    drop_subtitle: "Get your digital answer key instantly",
    supported_formats: "Images are processed temporarily and NEVER stored. Privacy first.",
    dash_welcome: "Hi,",
    dash_subtitle: "Snap a photo to see the answers and your teaching guide.",
    
    // How it works
    how_title: "How Chekki Works",
    how_step1: "Snap a Photo",
    how_step1_desc: "Capture the worksheet page clearly.",
    how_step2: "Instant Overlay",
    how_step2_desc: "Answers appear right on the paper.",
    how_step3: "Teach with Love",
    how_step3_desc: "Use 'Teaching Scripts' to explain kindly.",

    // Trust
    trust_title: "Safe for Your Family",
    trust_privacy: "Privacy You Can Trust",
    trust_privacy_desc: "Your family’s safety is our priority; we never store your child’s data, processing images in real-time before deleting them instantly.",
    trust_safety: "Bonding, Not Battling",
    trust_safety_desc: "We turn stressful correction time into a happy, high-five moment with interactive digital stamps and positive praise your child will love.",

    // Comparison
    diff_title: "Why Chekki?",
    diff_ocr: "The Perfect Answer Key",
    diff_ocr_desc: "Don't waste time hunting for keys. Chekki identifies the questions and shows you exactly what to write, right on the screen.",
    diff_script: "Bilingual Teaching Scripts",
    diff_script_desc: "We give you the exact words to say in Korean and English to encourage your child through the tricky parts.",
    diff_brand: "Consistent Learning",
    diff_brand_desc: "Ensure your child receives the same high-quality, authorized guidance at home that matches their classroom experience perfectly.",

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
    ws_overlay: "Answer View",
    ws_list: "List View",
    ws_scanning_header: "Generating answers...",
    ws_scanning_detail: "Processing context...",
    ws_finding_questions: "Finding Questions...",

    // Errors
    error_title: "Let's try one more time!",
    err_network: "The lighting might be tricky. Try a clearer shot for perfect answers!",
    err_confirm: "Are you sure? Current data will be reset.",
    btn_scan_again_simple: "Try Again",
    btn_retake: "Retake Photo",
    growing_text: "Generating...",
    tt_report: "Report Error",
    lbl_mom_tip: "Teaching Script",

    // Paywall
    pw_title: "Buy Back Your Time",
    pw_desc: "Unlimited scans and AI practice sheets for the price of a latte.",
    
    // Rewards
    reward_job: "Amazing Job!",
    reward_stamp: "Perfect Stamp",
    reward_tap: "Tap to stamp the page!",

    // Onboarding
    onb_1_title: "Stop the Homework War",
    onb_1_desc: "Chekki provides the answers, you provide the hugs.",
    onb_1_btn: "Next",
    onb_2_title: "Instant Answer Key",
    onb_2_desc: "Answers appear right on top of the worksheet.",
    onb_2_btn: "Got it",
    onb_3_title: "Safe & Private",
    onb_3_desc: "Images are never stored. Privacy is our priority.",
    onb_3_btn: "Start Now",

    // Community / Feedback
    beta_banner: "✨ Chekki is growing! Share your feedback with us.",
    fb_title: "Share Feedback",
    fb_desc: "How can we make teaching easier for you?",
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
    tagline: "정답은 채키가, 칭찬은 직접",
    login: "무료로 시작하기",
    logout: "로그아웃",
    scans: "번의 마법 남음",
    pro_plan: "마법 프로 플랜 🚀",

    // Payments & Compliance
    pay_method_card: "일반 신용/체크카드",
    pay_method_easy: "간편 결제 (카카오페이, 네이버페이)",
    pay_secure_notice: "토스페이먼츠를 통한 안전한 결제가 지원됩니다.",
    biz_info_title: "사업자 정보",
    biz_reg_num: "사업자번호: 123-45-67890",
    biz_rep: "대표: 채키 팀",

    // Instructional Tips
    tip_click_guide: "💡 문제를 누르면 다정한 티칭 가이드가 나타나요!",
    tip_scroll_more: "아래로 스크롤하여 모든 정답을 확인하세요",

    // Security Section
    sec_audit_title: "보안 및 개인정보 진단",
    sec_audit_desc: "우리 아이의 정보는 소중합니다. 채키는 'Zero-Storage' 설계를 통해 보안을 최우선으로 합니다.",
    sec_point_1: "분석 완료 즉시 사진 데이터 파기",
    sec_point_2: "SSL/TLS 암호화 데이터 전송",
    sec_point_3: "개인 식별 정보를 저장하지 않는 익명성 유지",
    sec_point_4: "학원 인증 코드를 통한 안전한 이용",

    // Resource Center
    res_title: "자세히 보기",
    res_subtitle: "다른 부모님들께 평화를 선물하세요.",
    res_download: "저장",
    res_copy: "링크 복사",
    res_share: "공유하기",
    res_copied: "복사 완료!",
    res_flyer: "채키 공식 안내문",

    // Hero
    hero_title: "잃어버린 답지 찾지 말고,\n사진 한 장만 찍으세요",
    hero_title_night: "오늘도 고생 많으셨어요.",
    hero_desc: "영유 숙제, 정답 찾느라 헤매지 마세요. 마법처럼 종이 위에 나타나는 정답과 '티칭 스크립트'로 다정하게 지도하세요.",
    hero_desc_night: "육아퇴근을 5분 더 앞당겨 드릴게요. 정답은 채키가 찾을 테니, 아이를 한 번 더 안아주세요.",
    hero_badge: "정확한 디지털 답지 제공",
    hero_cta_title: "행복한 숙제 시간,",
    hero_cta_desc: "이미 1만 명의 부모님들이 숙제 시간을 '혼내는 시간'에서 '칭찬하는 시간'으로 바꿨습니다.",
    hero_cta_btn: "지금 바로 시작하기",
    
    // Camera / Dashboard
    btn_upload: "숙제 사진 찍기",
    btn_walkthrough: "사용 가이드 보기",
    drop_title: "여기에 숙제를 보여주세요",
    drop_subtitle: "종이 위에 정답이 마법처럼 나타나요",
    supported_formats: "업로드된 이미지는 분석 후 즉시 삭제됩니다. 안심하고 사용하세요.",
    dash_welcome: "반가워요,",
    dash_subtitle: "사진을 찍으면 바로 정답과 티칭 가이드를 보여드려요.",

    // How it works
    how_title: "채키는 이렇게 도와드려요",
    how_step1: "사진 찍기",
    how_step1_desc: "숙제 페이지를 찰칵 찍어주세요.",
    how_step2: "정답 오버레이",
    how_step2_desc: "종이 위에 정답이 마법처럼 나타나요.",
    how_step3: "다정하게 지도",
    how_step3_desc: "티칭 스크립트로 친절하게 알려주세요.",

    // Trust
    trust_title: "부모님들이 채키를 믿는 이유",
    trust_privacy: "안심할 수 있는 보안",
    trust_privacy_desc: "우리 아이의 정보는 소중하니까요. 사진은 저장되지 않고 분석 즉시 파기되어 개인정보를 완벽하게 보호합니다.",
    trust_safety: "혼내지 않는 즐거운 학습",
    trust_safety_desc: "숙제 시간이 전쟁터가 아닌, 아이와 웃으며 하이파이브하는 칭찬과 교감의 시간으로 바뀝니다.",

    // Comparison
    diff_title: "채키와 함께라면 다릅니다",
    diff_ocr: "마법 같은 디지털 답지",
    diff_ocr_desc: "답지를 찾을 필요가 없어요. 채키가 문제를 읽고 정답을 정확한 위치에 표시해 드립니다.",
    diff_script: "다정한 티칭 스크립트",
    diff_script_desc: "영어를 몰라도 괜찮아요. 아이에게 어떻게 설명하면 좋을지 한국어와 영어 대본을 모두 드립니다.",
    diff_brand: "학원과 집의 연결",
    diff_brand_desc: "학원에서 배우는 내용 그대로, 집에서도 전문적인 학습 가이드를 일관성 있게 이어갈 수 있습니다.",

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
    ws_overlay: "정답 보기",
    ws_list: "목록 보기",
    ws_scanning_header: "정답을 찾는 중...",
    ws_scanning_detail: "맥락을 분석하고 있어요...",
    ws_finding_questions: "문제를 찾는 중...",

    // Errors
    error_title: "다시 한번 해볼까요?",
    err_network: "사진이 조금 흐릿해요. 정답을 정확히 찾으려면 밝은 곳에서 다시 찍어주세요!",
    err_confirm: "정말 취소하시겠어요? 현재 숙제 정보가 사라집니다.",
    btn_scan_again_simple: "다시 분석하기",
    btn_retake: "사진 다시 찍기",
    growing_text: "생성 중...",
    tt_report: "오류 신고",
    lbl_mom_tip: "티칭 가이드",

    // Paywall
    pw_title: "매일 밤 평화를 구매하세요",
    pw_desc: "커피 한 잔 값으로 무제한 스캔과 AI 복습 문제 생성 기능을 누리세요.",
    
    // Rewards
    reward_job: "정말 잘했어요!",
    reward_stamp: "참 잘했어요",
    reward_tap: "아이와 함께 도장을 꾹 눌러보세요!",

    // Onboarding
    onb_1_title: "숙제 전쟁, 이제 그만",
    onb_1_desc: "채점은 채키가 할게요. 부모님은 칭찬만 해주세요.",
    onb_1_btn: "다음",
    onb_2_title: "마법 같은 정답지",
    onb_2_desc: "사진만 찍으면 종이 위에 정답이 바로 나타나요.",
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
    print_footer: "채키 AI - 다정한 부모님용 영어 가이드",

    footer_text: "채키 AI - 대한민국 모든 영유 부모님들을 진심으로 응원합니다."
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
