
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
    
    // How It Works
    how_title: "How Chekki Helps",
    how_step1: "Take a Photo",
    how_step1_desc: "Snap a quick picture of the page.",
    how_step2: "Get Answers",
    how_step2_desc: "I'll find all the right answers for you.",
    how_step3: "Teach with Love",
    how_step3_desc: "Explain it kindly using my easy guide.",

    // Testimonials
    test_title: "Real Stories from Moms",
    test_1_name: "Min-jun's Mom",
    test_1_text: "I used to be so nervous when Min-jun asked for help. Now I have Chekki, and homework time is actually fun!",
    test_2_name: "Ji-woo's Dad",
    test_2_text: "The explanations are so easy to understand. I can explain the 'why' to my daughter without any stress.",
    test_3_name: "Seo-yeon's Mom",
    test_3_text: "The practice sheets are like magic for review. It feels like having a kind tutor right in my pocket.",

    drop_title: "Show me the homework!",
    drop_subtitle: "Tap here to pick a photo",
    processing: "Looking at the questions...",
    checking: "Making your easy guide...",
    
    // Dashboard (Logged In)
    dash_welcome: "Hi there,",
    dash_subtitle: "Just upload the homework! I'll give you a kind guide so you can explain everything perfectly.",
    scans_left: "Homework Magic Left",
    supported_formats: "JPG, PNG, WEBP, HEIC are all great! • Max: 10MB",

    // Onboarding
    onb_1_title: "I'll handle the tricky part!",
    onb_1_desc: "I'll find the answers so you can focus on giving big hugs and high-fives.",
    onb_1_btn: "Let's Go!",
    onb_2_title: "Ready to start?",
    onb_2_desc: "I just need to see through your camera to help with the questions.",
    onb_2_btn: "Turn on Camera",
    onb_3_title: "Let's stay in touch!",
    onb_3_desc: "I'll send you helpful tips and gentle reminders for review time.",
    onb_3_btn: "Yes, please!",

    // Features
    feat_vision_title: "Easy Answer Key",
    feat_vision_desc: "I'll solve those tricky reading and grammar pages for you, giving you the exact letters and words you need.",
    feat_grading: "Quick Solutions",
    feat_korean: "Kind Explanations",
    feat_audio: "Native Voice",
    feat_audio_desc: "Listen to the right way to say it, then model it perfectly for your little one.",
    feat_tips: "Teaching Guide",
    feat_review_desc: "Save the 'tricky' questions in your review note to make custom practice sheets later.",
    feat_privacy: "Safe & Private",
    feat_privacy_desc: "Your child's safety is everything. I look at the photos and then they're gone—no storage, no worries.",

    // Stats
    stat_accuracy: "Correctness",
    stat_users: "Happy Families",
    stat_questions: "Helped So Far",
    stat_rating: "Parent Rating",

    // Loading Steps
    loading_step0: "Waking up my brain...",
    loading_step1: "Reading the stories carefully...",
    loading_step2: "Finding the best answers...",
    loading_step3: "Writing your kind guide...",
    loading_step4: "Almost ready! Just a second...",
    scan_loading_text: "THINKING...",
    growing_text: "Growing!",

    // Reward
    reward_job: "You're Doing Great!",
    reward_stamp: "Super Mom!",
    reward_tap: "Give a High Five!",

    // Error
    error_title: "Oops! Let's try again.",
    error_desc: "I couldn't quite see that. Could you take a clearer photo in a brighter spot?",
    btn_retake: "Try Again",
    err_network: "My connection is a bit weak. Let's try one more time!",
    err_confirm: "Wait! Your progress will be lost. Is that okay?",

    // Workspace
    ws_overlay: "Focus View",
    ws_list: "Easy List",
    ws_scan_again: "Scan Again",
    ws_summary_title: "Homework Summary",
    ws_ref_scan: "The Homework",
    ws_read_only: "View Mode",
    ws_results_title: "Kind Answers",
    ws_items_found: "questions solved",
    ws_repeated: "Again",
    ws_times: "times",
    ws_review_tip: "Tip: Tap the flag 🚩 to save questions for later practice!",
    ws_report_error: "Report Error",

    // Feedback
    fb_title: "Help Chekki Learn",
    fb_desc: "Your thoughts help me become a better helper for you and your child!",
    fb_rating: "How was your experience today?",
    fb_comment: "Anything else you'd like to tell me?",
    fb_submit: "Send with Love",
    fb_success: "Thank you! I'll read this carefully. ❤️",
    fb_error_desc: "Tell me what's wrong with this answer...",

    // Paywall
    pw_title: "Help Your Child More",
    pw_desc: "Upgrade to get unlimited answers and practice sheets every day.",
    pw_free_title: "Free Buddy",
    pw_free_limit: "3 Helps / Month",
    pw_current: "Using this",
    pw_pro_title: "Magic Pro",
    pw_pro_limit: "Unlimited Help, Magic Practice Sheets, Native Audio Voice",
    pw_rec: "POPULAR",
    pw_price: "$9.99/mo",
    pw_btn: "Use Beta Code",
    pw_footer: "Beta access enabled.",

    // Review (O-dap)
    review_title: "Review Note",
    review_empty_title: "No saved questions yet",
    review_empty_desc: "Save the questions your child finds tricky. I'll turn them into a fun practice sheet!",
    review_print_btn: "Make Practice Sheet (PDF)",
    lbl_mistakes_count: "saved questions",
    lbl_correct_answer: "The Answer:",
    lbl_question: "Question",
    lbl_write_answer: "Practice Here:",
    lbl_mom_tip: "Kind Tip:",
    print_footer: "Chekki AI - Your partner in your child's growth!",

    footer_text: "Made with love and Gemini 3 Pro • Your Friendly Homework Buddy"
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
    hero_cta_title: "행복한 숙제 시간,",
    hero_cta_desc: "숙제 시간이 스트레스가 아닌, 아이와 함께 웃으며 성장하는 따뜻한 시간이 됩니다.",
    hero_cta_btn: "무료로 체험해보기",
    
    // How It Works
    how_title: "채키는 이렇게 도와드려요",
    how_step1: "사진 찍기",
    how_step1_desc: "숙제 페이지를 찰칵 찍어주세요.",
    how_step2: "정답 확인",
    how_step2_desc: "제가 모든 정답을 꼼꼼히 찾아낼게요.",
    how_step3: "다정하게 지도",
    how_step3_desc: "제 설명을 보고 아이에게 친절히 알려주세요.",

    // Testimonials
    test_title: "어머님들의 따뜻한 후기",
    test_1_name: "민준 어머님",
    test_1_text: "아이가 물어볼 때마다 당황했는데, 이제 채키 덕분에 저도 자신 있게 가르쳐줄 수 있어요!",
    test_2_name: "지우 아버님",
    test_2_text: "설명이 정말 쉬워요. 단순히 답만 주는 게 아니라 아이 눈높이에서 설명해줄 수 있어 정말 좋습니다.",
    test_3_name: "서연 어머님",
    test_3_text: "연습문제 만들어주는 기능이 최고예요. 아이가 어려워하는 것만 쏙쏙 골라 복습시킬 수 있거든요.",

    drop_title: "숙제를 보여주세요!",
    drop_subtitle: "여기를 눌러 앨범에서 골라주세요",
    processing: "문제를 읽어보고 있어요...",
    checking: "친절한 정답지를 만드는 중...",

    // Dashboard (Logged In)
    dash_welcome: "반가워요,",
    dash_subtitle: "숙제 사진만 올려주세요! 엄마가 아이에게 완벽하게 설명해줄 수 있도록 제가 다정하게 도와드릴게요.",
    scans_left: "남은 마법 횟수",
    supported_formats: "JPG, PNG, WEBP, HEIC 모두 좋아요! • 최대 10MB",

    // Onboarding
    onb_1_title: "어려운 건 제가 할게요!",
    onb_1_desc: "정답은 제가 찾을게요. 엄마는 아이에게 따뜻한 칭찬과 응원만 듬뿍 해주세요.",
    onb_1_btn: "시작할까요?",
    onb_2_title: "준비 되셨나요?",
    onb_2_desc: "숙제를 잘 볼 수 있게 카메라 권한을 허용해 주세요.",
    onb_2_btn: "카메라 켜기",
    onb_3_title: "알림을 켜두세요!",
    onb_3_desc: "도움이 되는 티칭 팁과 다정한 복습 알림을 보내드릴게요.",
    onb_3_btn: "좋아요!",

    // Features
    feat_vision_title: "다정한 정답지",
    feat_vision_desc: "복잡한 문제도 채키가 알기 쉽게 풀어드려요. 정확한 정답과 텍스트를 한눈에 확인하세요.",
    feat_grading: "빠른 정답 확인",
    feat_korean: "이해하기 쉬운 설명",
    feat_audio: "원어민 발음 듣기",
    feat_audio_desc: "정확한 발음을 함께 듣고 아이에게 자신 있게 들려주세요.",
    feat_tips: "티칭 가이드",
    feat_review_desc: "어려웠던 문제는 깃발로 콕! 저장했다가 나중에 맞춤 연습문제로 복습해요.",
    feat_privacy: "안전한 프라이버시",
    feat_privacy_desc: "우리 아이 사진은 분석 후 바로 삭제되니 안심하세요. 소중한 정보는 안전하게 지켜집니다.",

    // Stats
    stat_accuracy: "정확도",
    stat_users: "행복한 가족",
    stat_questions: "해결한 문제",
    stat_rating: "부모님 평점",

    // Loading Steps
    loading_step0: "머리를 맞대고 고민 중...",
    loading_step1: "이야기를 꼼꼼히 읽고 있어요...",
    loading_step2: "멋진 정답을 찾는 중이에요...",
    loading_step3: "다정한 설명을 쓰고 있어요...",
    loading_step4: "거의 다 됐어요! 조금만 기다려주세요.",
    scan_loading_text: "생각 중...",
    growing_text: "성장 중!",

    // Reward
    reward_job: "정말 잘하고 계세요!",
    reward_stamp: "최고의 엄마!",
    reward_tap: "하이파이브 해주세요!",
    
    // Error
    error_title: "앗! 조금만 더 잘 보여주세요.",
    error_desc: "사진이 조금 흐릿해요. 밝은 곳에서 글자가 잘 보이게 다시 한 번 찍어주실래요?",
    btn_retake: "다시 찍기",
    err_network: "연결이 잠시 끊겼나 봐요. 한 번만 다시 시도해 볼까요?",
    err_confirm: "잠깐만요! 지금까지 한 게 사라질 수 있는데 괜찮으세요?",

    // Workspace
    ws_overlay: "포커스 뷰",
    ws_list: "다정한 리스트",
    ws_scan_again: "다시 찍기",
    ws_summary_title: "숙제 요약",
    ws_ref_scan: "원본 숙제",
    ws_read_only: "보기 모드",
    ws_results_title: "다정한 정답",
    ws_items_found: "문제 해결됨",
    ws_repeated: "반복",
    ws_times: "회",
    ws_review_tip: "팁: 깃발 🚩을 누르면 어려운 문제를 나중에 복습할 수 있어요!",
    ws_report_error: "오류 제보",

    // Feedback
    fb_title: "채키에게 들려주세요",
    fb_desc: "어머님의 소중한 의견은 채키가 더 똑똑한 도우미가 되는 데 큰 힘이 돼요!",
    fb_rating: "오늘 채키와의 시간은 어떠셨나요?",
    fb_comment: "더 하고 싶은 이야기가 있으신가요?",
    fb_submit: "사랑을 담아 보내기",
    fb_success: "감사합니다! 어머님의 의견을 소중히 읽어볼게요. ❤️",
    fb_error_desc: "이 정답의 어떤 점이 잘못되었나요?",

    // Paywall
    pw_title: "더 많은 도움을 드리고 싶어요",
    pw_desc: "무제한으로 모든 숙제의 정답과 연습문제를 받아보세요.",
    pw_free_title: "무료 짝꿍",
    pw_free_limit: "월 3회 도움",
    pw_current: "현재 이용 중",
    pw_pro_title: "매직 프로",
    pw_pro_limit: "무제한 정답 확인, 매직 연습문제 생성, 원어민 발음 가이드",
    pw_rec: "가장 인기",
    pw_price: "월 9,900원",
    pw_btn: "베타 코드 사용하기",
    pw_footer: "베타 버전 전용 코드: CHEKKIBETA",

    // Review (O-dap)
    review_title: "복습 노트",
    review_empty_title: "아직 저장된 문제가 없어요",
    review_empty_desc: "아이가 어려워했던 문제를 저장해 보세요. 나중에 멋진 연습문제지로 만들어 드릴게요!",
    review_print_btn: "연습 문제지 만들기 (PDF)",
    lbl_mistakes_count: "개의 저장된 문제",
    lbl_correct_answer: "정답:",
    lbl_question: "질문",
    lbl_write_answer: "연습 공간:",
    lbl_mom_tip: "다정한 팁:",
    print_footer: "채키 AI - 우리 아이의 성장을 엄마와 함께 응원합니다!",

    footer_text: "Gemini 3 Pro 기반 • 엄마를 위한 다정한 영어 숙제 파트너"
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('hw_language');
      if (stored === 'en' || stored === 'ko') {
        return stored;
      }
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
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
