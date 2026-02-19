
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
    share_toast: "Template copied! Ready to post.",

    // Guest Mode CTAs
    hero_guest_cta: "Try Guest Scan",
    login_guest_link: "Not ready? Try 1 scan as guest",
    guest_scan_badge: "Free Magic Scan Available",
    guest_used_title: "Free Scan Used!",
    guest_used_desc: "You've seen the magic. Sign up now for more scans and unlock full scripts and audio!",

    // Payments & Compliance
    pay_method_card: "Credit / Debit Card",
    pay_method_easy: "Easy Pay (Kakao, Naver)",
    pay_secure_notice: "Secure payment guaranteed via Toss Escrow",
    pay_vat_included: "VAT included",
    pay_auto_renew: "This is a recurring subscription product.",
    pay_cancel_notice: "Subscriptions may be cancelled anytime from the My Page section.",
    biz_name: "Chekki",
    biz_info_title: "Business Information",
    biz_reg_num: "Business Registration: 814-14-03096",
    biz_rep: "Representative: Jason Benjamin",
    biz_address: "Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea",
    biz_mail_order: "E-commerce Registration Number: (Pending)",
    biz_hours: "Customer Support Hours: Weekdays 10AM–6PM (KST)",
    biz_escrow: "This service guarantees payment safety through the Purchase Safety Service (Escrow).",
    biz_contact_notice: "Inquiries are accepted 24 hours a day and will be answered within 1 business day.",
    biz_email: "Email: jsn.benjamin@gmail.com",

    // Navigation
    nav_home: "Home",
    nav_pricing: "Pricing",
    nav_terms: "Terms",
    nav_privacy: "Privacy",
    nav_refund: "Refund",
    nav_contact: "Contact",

    // Hero
    hero_badge: "High-Accuracy Answer Key",
    hero_title: "Instant Answer Key\nRight on the Paper.",
    hero_title_night: "Long day?\nLet Chekki handle the grading.",
    hero_desc: "The homework war is over. Get instant answer overlays and 'Teaching Scripts' so you can teach with confidence and love. No more guessing.",
    hero_desc_night: "Enjoy your 'parenting retirement' 5 minutes earlier. Chekki handles the answers while you provide the hugs.",
    hero_cta_btn: "Start for Free Today",

    // Camera View / Dashboard
    drop_title: "Snap the Worksheet",
    drop_subtitle: "Get your digital answer key instantly",
    btn_upload: "Snap Worksheet",
    btn_walkthrough: "Watch Walkthrough",
    supported_formats: "Images are processed temporarily and NEVER stored.",
    dash_welcome: "Hi,",
    dash_subtitle: "Snap a photo to see the answers and your teaching guide.",
    lbl_feedback: "Feedback",
    lbl_share_ideas: "Share Ideas",
    lbl_quick_guide: "Quick Guide",
    lbl_resource: "Resource",
    lbl_pro_active: "Pro Magic Active",
    lbl_magic_left: "Magic Left",
    lbl_lighting: "Lighting",
    lbl_flat: "Flat",
    lbl_sharp: "Sharp",
    res_title: "Parent Resources",
    res_subtitle: "Help other parents find peace.",
    res_flyer: "Official Flyer",
    res_download: "Download",
    res_share: "Share",
    res_copied: "Link Copied!",

    // Usage Limits
    refill_title: "Refill Required!",
    refill_desc: "Daily free scans used. We refill your magic at midnight!",
    refill_cta: "Unlock Unlimited Magic",

    // Onboarding
    onb_1_title: "Stop the Homework War",
    onb_1_desc: "Chekki provides the answers, you provide the hugs.",
    onb_1_btn: "Next Step",
    onb_2_title: "Instant Answer Key",
    onb_2_desc: "Answers appear right on top of the worksheet.",
    onb_2_btn: "Got it!",
    onb_academy_title: "Academy Authorized",
    onb_academy_desc: "Enter your School code to unlock all Pro features for free.",
    onb_3_title: "Safe & Private",
    onb_3_desc: "Images are never stored. Privacy is our priority.",
    onb_3_btn: "Start Now",
    onb_skip: "Skip Intro",

    // Features Section
    how_title: "How Chekki Works",
    how_step1: "Snap a Photo",
    how_step1_desc: "Capture the worksheet page clearly.",
    how_step2: "Instant Overlay",
    how_step2_desc: "Answers appear right on the paper.",
    how_step3: "Teach with Love",
    how_step3_desc: "Use 'Teaching Scripts' to explain kindly.",

    magic_title: "See the Magic in Action",
    magic_subtitle: "THE ESSENTIAL TOOL FOR EK PARENTS",


    trust_title: "Safe for Your Family",
    trust_privacy: "Privacy You Can Trust",
    trust_privacy_desc: "Your family’s safety is our priority; we never store your child’s data, processing images in real-time before deleting them instantly.",
    trust_safety: "Bonding, Not Battling",
    trust_safety_desc: "We turn stressful correction time into a happy, high-five moment with interactive digital stamps and positive praise your child will love.",

    diff_title: "Why Chekki?",
    diff_ocr: "The Perfect Answer Key",
    diff_ocr_desc: "Don't waste time hunting for keys. Chekki identifies the questions and shows you exactly what to write, right on the screen.",
    diff_script: "Bilingual Teaching Scripts",
    diff_script_desc: "We give you the exact words to say in Korean and English to encourage your child through the tricky parts.",
    diff_brand: "Consistent Learning",
    diff_brand_desc: "Ensure your child receives guidance matching their classroom experience.",


    // Analysis & Loading
    processing: "Generating answer key...",
    loading_step0: "Scanning for questions...",
    loading_step1: "Preparing the answer key...",
    loading_step2: "Writing your teaching scripts...",
    loading_step3: "Syncing native audio...",
    loading_step4: "Ready! Time to teach with love...",
    loading_thorough: "Chekki is checking thoroughly for perfect answers.",
    loading_tip: "💡 Complex pages take a few extra seconds!",
    loading_almost: "🚀 Almost there! Preparing your guide...",
    btn_cancel_retry: "Cancel",

    // Results
    ws_results_title: "Your Teaching Guide",
    ws_items_found: "answers identified",
    ws_voice_guide: "💡 Tap an answer to hear the pronunciation!",
    ws_gen_practice: "Extra Practice Sheet",
    ws_scan_again: "Next Page",
    ws_scanning_header: "Generating answers...",
    ws_scanning_detail: "Analyzing context...",
    tip_click_guide: "💡 Tap any question to see your Teaching Script!",
    lbl_mom_tip: "Teaching Script",
    growing_text: "Generating...",

    // Feedback Form
    fb_title: "Send Feedback",
    fb_desc: "How is your experience with Chekki?",
    fb_error_desc: "Something went wrong? Let us know.",
    fb_rating: "Rating",
    fb_comment: "Comment",
    fb_submit: "Submit Feedback",
    fb_success: "Feedback Sent!",

    // Review / Mistake Note
    review_title: "Review Note",
    review_empty_title: "No Mistakes Yet!",
    review_empty_desc: "All caught up. Good job!",
    review_print_btn: "Print Review Sheet",
    lbl_mistakes_count: "items to review",
    lbl_question: "Question",
    lbl_write_answer: "Write the answer here...",
    lbl_correct_answer: "Correct Answer:",
    print_footer: "Chekki AI - Growing together every day.",

    // Gamification
    reward_job: "Great Job!",
    reward_stamp: "Sticker",
    reward_tap: "Tap to get your stamp!",

    // Security Settings
    sec_audit_title: "Security Audit",
    sec_audit_desc: "Your data safety is our priority.",
    sec_point_1: "Zero-storage policy active",
    sec_point_2: "End-to-end encryption",
    sec_point_3: "Anonymous processing",
    sec_point_4: "Safe for kids",

    // Paywall
    pw_title: "Beta Access Only",
    pw_desc: "Chekki is currently in a free beta period. Enter your invitation code to unlock all pro features immediately.",
    subs_coming_soon: "Subscriptions coming soon",
    beta_access_title: "Beta Access",

    // Errors
    error_title: "Let's try one more time!",
    err_network: "The lighting might be tricky. Try a clearer shot!",
    err_confirm: "Are you sure? Current data will be reset.",
    btn_scan_again_simple: "Try Again",
    btn_retake: "Retake Photo",

    // Misc
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

    // Guest Mode CTAs
    hero_guest_cta: "로그인 없이 체험하기",
    login_guest_link: "회원가입 없이 1회 무료 체험하기",
    guest_scan_badge: "무료 마법 1회 사용 가능",
    guest_used_title: "무료 체험 완료!",
    guest_used_desc: "채키의 마법을 보셨나요? 가입하고 더 많은 스캔과 티칭 가이드를 확인하세요!",

    // Payments & Compliance
    pay_method_card: "일반 신용/체크카드",
    pay_method_easy: "간편 결제 (카카오페이, 네이버페이)",
    pay_secure_notice: "구매안전서비스(에스크로)를 통해 결제 안전을 보장합니다.",
    pay_vat_included: "부가세 포함",
    pay_auto_renew: "자동 결제 구독 상품입니다. 언제든지 해지 가능합니다.",
    pay_cancel_notice: "구독 해지는 마이페이지에서 언제든지 가능합니다.",
    biz_name: "Chekki (채키)",
    biz_info_title: "사업자 정보",
    biz_reg_num: "사업자등록번호: 814-14-03096",
    biz_rep: "대표자: Jason Benjamin (제이슨 벤자민)",
    biz_address: "주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113",
    biz_mail_order: "통신판매업 신고번호: 준비중",
    biz_hours: "고객센터: 평일 10:00–18:00 (KST)",
    biz_escrow: "본 서비스는 구매안전서비스를 통해 결제 안전을 보장합니다.",
    biz_contact_notice: "문의는 1영업일 이내 답변드립니다.",
    biz_email: "이메일: jsn.benjamin@gmail.com",

    // Navigation
    nav_home: "홈",
    nav_pricing: "요금 안내",
    nav_terms: "이용약관",
    nav_privacy: "개인정보처리방침",
    nav_refund: "환불정책",
    nav_contact: "문의하기",

    // Hero
    hero_badge: "정확한 디지털 답지 제공",
    hero_title: "잃어버린 답지 찾지 말고,\n사진 한 장만 찍으세요",
    hero_title_night: "오늘도 고생 많으셨어요.",
    hero_desc: "영유 숙제, 정답 찾느라 헤매지 마세요. 마법처럼 종이 위에 나타나는 정답과 '티칭 스크립트'로 다정하게 지도하세요.",
    hero_desc_night: "육아퇴근을 5분 더 앞당겨 드릴게요. 정답은 채키가 찾을 테니, 아이를 한 번 더 안아주세요.",
    hero_cta_btn: "지금 바로 시작하기",

    // Camera View / Dashboard
    drop_title: "여기에 숙제를 보여주세요",
    drop_subtitle: "종이 위에 정답이 마법처럼 나타나요",
    btn_upload: "숙제 사진 찍기",
    btn_walkthrough: "사용 가이드 보기",
    supported_formats: "이미지는 분석 후 즉시 삭제됩니다.",
    dash_welcome: "반가워요,",
    dash_subtitle: "사진을 찍으면 바로 정답과 티칭 가이드를 보여드려요.",
    lbl_feedback: "의견 보내기",
    lbl_share_ideas: "의견 보내기",
    lbl_quick_guide: "사용 가이드",
    lbl_resource: "학부모 자료",
    lbl_pro_active: "프로 마법 활성화됨",
    lbl_magic_left: "남은 마법",
    lbl_lighting: "밝게",
    lbl_flat: "수평",
    lbl_sharp: "선명",
    res_title: "학부모 리소스",
    res_subtitle: "다른 부모님들께 평화를 선물하세요.",
    res_flyer: "공식 안내문",
    res_download: "저장",
    res_share: "공유",
    res_copied: "복사 완료!",

    // Usage Limits
    refill_title: "마법 충전 필요!",
    refill_desc: "오늘의 무료 스캔을 모두 사용했어요. 내일 다시 충전됩니다!",
    refill_cta: "무제한 마법 시작하기",

    // Onboarding
    onb_1_title: "숙제 전쟁, 이제 그만",
    onb_1_desc: "채점은 채키가 할게요. 부모님은 칭찬만 해주세요.",
    onb_1_btn: "다음 단계로",
    onb_2_title: "마법 같은 정답지",
    onb_2_desc: "사진만 찍으면 종이 위에 정답이 바로 나타나요.",
    onb_2_btn: "확인했어요!",
    onb_academy_title: "우리 아이 학원과 함께",
    onb_academy_desc: "학원 코드를 입력하면 모든 기능을 무료로 이용할 수 있어요.",
    onb_3_title: "안심하고 사용하세요",
    onb_3_desc: "사진은 저장되지 않고 즉시 삭제됩니다.",
    onb_3_btn: "시작하기",
    onb_skip: "건너뛰기",

    // Features Section
    how_title: "채키는 이렇게 도와드려요",
    how_step1: "사진 찍기",
    how_step1_desc: "숙제 페이지를 찰칵 찍어주세요.",
    how_step2: "정답 오버레이",
    how_step2_desc: "종이 위에 정답이 마법처럼 나타나요.",
    how_step3: "다정하게 지도",
    how_step3_desc: "티칭 스크립트로 친절하게 알려주세요.",

    magic_title: "마법 같은 실력을 직접 확인하세요",
    magic_subtitle: "영유 학부모님을 위한 필수 도구",


    trust_title: "부모님들이 채키를 믿는 이유",
    trust_privacy: "안심할 수 있는 보안",
    trust_privacy_desc: "우리 아이의 정보는 소중하니까요. 사진은 저장되지 않고 분석 즉시 파기되어 개인정보를 완벽하게 보호합니다.",
    trust_safety: "혼내지 않는 즐거운 학습",
    trust_safety_desc: "숙제 시간이 전쟁터가 아닌, 아이와 웃으며 하이파이브하는 칭찬과 교감의 시간으로 바뀝니다.",

    diff_title: "채키와 함께라면 다릅니다",
    diff_ocr: "마법 같은 디지털 답지",
    diff_ocr_desc: "답지를 찾을 필요가 없어요. 채키가 문제를 읽고 정답을 정확한 위치에 표시해 드립니다.",
    diff_script: "다정한 티칭 스크립트",
    diff_script_desc: "영어를 몰라도 괜찮아요. 아이에게 어떻게 설명하면 좋을지 한국어와 영어 대본을 모두 드립니다.",
    diff_brand: "학원과의 연결",
    diff_brand_desc: "학원에서 배우는 내용 그대로 집에서도 일관성 있게 학습하세요.",


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
    ws_scanning_header: "정답을 찾는 중...",
    ws_scanning_detail: "맥락을 분석하고 있어요...",
    tip_click_guide: "💡 문제를 누르면 다정한 티칭 가이드가 나타나요!",
    lbl_mom_tip: "티칭 가이드",
    growing_text: "생성 중...",

    // Feedback Form
    fb_title: "의견 보내기",
    fb_desc: "채키를 사용해보니 어떠신가요?",
    fb_error_desc: "불편한 점이 있으셨나요? 알려주세요.",
    fb_rating: "별점",
    fb_comment: "의견",
    fb_submit: "의견 제출하기",
    fb_success: "소중한 의견 감사합니다!",

    // Review / Mistake Note
    review_title: "오답 노트",
    review_empty_title: "복습할 문제가 없어요!",
    review_empty_desc: "모든 숙제를 완벽하게 마스터했습니다!",
    review_print_btn: "복습 시트 프린트하기",
    lbl_mistakes_count: "개의 복습할 문제",
    lbl_question: "문제",
    lbl_write_answer: "여기에 정답을 써보세요...",
    lbl_correct_answer: "정답:",
    print_footer: "채키 AI와 함께 매일 조금씩 성장합니다.",

    // Gamification
    reward_job: "잘했어요!",
    reward_stamp: "참 잘했어요",
    reward_tap: "도장을 찍어주세요!",

    // Security Settings
    sec_audit_title: "보안 감사 완료",
    sec_audit_desc: "채키는 개인정보 보호를 최우선으로 합니다.",
    sec_point_1: "이미지 즉시 삭제 정책",
    sec_point_2: "데이터 암호화 전송",
    sec_point_3: "익명 분석 처리",
    sec_point_4: "자녀 안심 서비스",

    // Paywall
    pw_title: "베타 액세스 전용",
    pw_desc: "채키는 현재 무료 베타 기간입니다. 초대 코드를 입력하여 곧바로 모든 프로 기능을 사용해 보세요.",
    subs_coming_soon: "정기 구독 서비스 준비 중",
    beta_access_title: "베타 액세스",

    // Errors
    error_title: "다시 한번 해볼까요?",
    err_network: "사진이 조금 흐릿해요. 밝은 곳에서 다시 찍어주세요!",
    err_confirm: "정말 취소하시겠어요? 현재 숙제 정보가 사라집니다.",
    btn_scan_again_simple: "다시 분석하기",
    btn_retake: "사진 다시 찍기",

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
