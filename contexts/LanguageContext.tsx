import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'ko';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations = {
  en: {
    app_name: 'Chekki AI',
    tagline: 'Your AI Homework Helper',
    login: 'Log In',
    logout: 'Log Out',
    scans: 'Magic Scans',
    pro_plan: 'Premium 🚀',
    feat_overlay: '🎯 Instant Answer Overlays',
    feat_script: '💌 Bilingual Teaching Scripts',
    feat_pronounce: '🔊 Native Voice & Speaking',
    feat_practice: '🪄 AI Practice Generator',

    // Viral Sharing
    share_title: 'Spread the Peace 🕊️',
    share_desc:
      'Help other parents find peace. Copy a pre-made template for your favorite Mom Cafe!',
    share_btn: 'Copy Cafe Template',
    share_toast: 'Template copied! Ready to post.',

    // Guest Mode CTAs
    hero_guest_cta: 'Try Magic Scan',
    login_guest_link: 'Not ready? Try 1 scan as guest',
    guest_scan_badge: 'Magic Scan ✨',
    guest_used_title: 'Seen the magic? ✨',
    guest_used_desc: 'Sign up free to get 3 scans per day, plus teaching scripts and audio.',

    // Payments & Compliance
    pay_method_card: 'Credit / Debit Card',
    pay_method_easy: 'Easy Pay (Kakao, Naver)',
    pay_secure_notice: 'Secure payment guaranteed via Toss Escrow',
    pay_vat_included: 'VAT included',
    pay_auto_renew: 'This is a recurring subscription product.',
    pay_cancel_notice: 'Subscriptions may be cancelled anytime from the My Page section.',

    // --- Subscription System ---
    sub_title: 'Premium',
    sub_subtitle: 'Unlimited AI homework magic',
    sub_monthly: 'Monthly',
    sub_yearly: 'Yearly',
    sub_perMonth: '/mo',
    sub_perYear: '/yr',
    sub_subscribe: 'Subscribe',
    sub_restore: 'Restore Purchases',
    sub_cancelAnytime: 'Cancel anytime',
    sub_cancelAnytimeSettings: 'Cancel anytime in App Store Settings',
    sub_bestValue: 'Best Value',
    sub_mostPopular: 'Most Popular',
    sub_trial_headline: 'Stop the Homework Fights Today',
    sub_trial_subtext:
      'Get 7 days of unlimited Instant Grading and AI Teaching Guides for free. Cancel anytime.',
    sub_trial_badge: '7 days free',
    sub_trial_no_charge: 'No charge until trial ends',
    sub_trial_restore: 'Restore previous purchases',
    sub_save_yearly: 'Save 17% vs monthly',
    sub_cta_trial: 'Start My Free Trial',
    sub_trial_status: 'Free Trial — {days} days remaining',
    sub_trial_ending: 'Your free trial ends in 2 days',
    sub_disclosure_trial:
      'After your 7-day free trial, payment will be charged to your Apple ID account. Subscription automatically renews unless cancelled at least 24 hours before the end of the current period. You can manage and cancel your subscription in your App Store account settings.',
    sub_success: 'Subscription complete!',
    sub_error: 'Subscription failed. Check your payment method and try again.',
    sub_androidSoon: 'Android subscriptions coming soon',
    sub_androidSoonDesc:
      'Thank you for your patience while we set up Android billing. Please use the iOS app to subscribe.',
    sub_terms:
      'Subscription is charged to your iTunes account at confirmation of purchase. Subscription automatically renews unless auto-renew is turned off at least 24-hours before the end of the current period.',
    sub_webHeadline: 'Subscribe via our mobile app',
    sub_webSubtext: 'Download the ChekkiAI app to start your subscription.',
    sub_webCta: 'View Download Options →',
    sub_platformApple: 'Subscribed via App Store',
    sub_platformGoogle: 'Subscribed via Google Play',
    sub_platformWeb: 'Subscribed via Web',
    sub_active: 'Active',
    sub_renews_on: 'Renews on',
    sub_no_active: 'No Active Subscription',
    sub_subscribe_now: 'Subscribe Now',
    sub_expired: 'Expired',
    sub_expired_on: 'Expired on',
    sub_renew_now: 'Renew Subscription',
    sub_manage: 'Manage Subscription',
    sub_web_manage: 'Manage your subscription in the App Store app on your iPhone',
    sub_loading: 'Loading subscription options...',
    sub_load_error: 'Unable to load subscription options. Please try again.',
    sub_retry: 'Retry',
    sub_disclosure:
      'Payment will be charged to your Apple ID account at the confirmation of purchase. The subscription automatically renews unless it is canceled at least 24 hours before the end of the current period. Your account will be charged for renewal within 24 hours prior to the end of the current period at the same price as your initial purchase. You can manage and cancel your subscriptions by going to your App Store account settings after purchase.',
    sub_privacy_terms: 'Privacy Policy | Terms of Use',
    biz_name: 'Chekki',
    biz_info_title: 'Business Information',
    biz_reg_num: 'Business Registration: 814-14-03096',
    biz_rep: 'Representative: Chekki Support Team',
    biz_address: 'Address: Jongno 347, Lotte Castle, Seoul 03113, South Korea',
    biz_mail_order: 'E-commerce Registration Number: (Pending)',
    biz_hours: 'Customer Support Hours: Weekdays 10AM–6PM (KST)',
    biz_escrow:
      'This service guarantees payment safety through the Purchase Safety Service (Escrow).',
    biz_contact_notice:
      'Inquiries are accepted 24 hours a day and will be answered within 1 business day.',
    biz_email: 'Email: chekkihelp@gmail.com',

    // Settings
    settings_title: 'Parent Profile',
    settings_profile: 'My Profile',
    settings_name_label: 'Your Name',
    settings_lang_label: 'App Language',
    settings_theme_label: 'App Theme',
    settings_delete_account: 'Delete Account',
    settings_delete_confirm: 'Delete your account permanently?',
    settings_delete_yes: 'Delete my account',
    settings_delete_no: 'Keep my account',
    settings_save: 'Save Changes',
    settings_saved: 'Settings saved!',
    settings_feedback: 'Send Feedback',
    settings_device_diag: 'Device Diagnostics',

    // Billing
    billing_title: 'Billing & Subscription',
    billing_active: 'Active Subscription',
    billing_plan: 'Plan',
    billing_started: 'Started',
    billing_next: 'Next Billing',
    billing_expires: 'Expires',
    billing_canceled_notice: 'Canceled — access continues until expiry.',
    billing_back: 'Back to App',
    billing_cancel_btn: 'Cancel Subscription?',
    billing_cancel_desc: 'You will lose premium access at the end of your billing cycle.',
    billing_cancel_yes: 'Cancel my subscription',
    billing_cancel_no: 'Keep my subscription',

    // Navigation
    nav_home: 'Home',
    nav_pricing: 'Pricing',
    nav_terms: 'Terms',
    nav_privacy: 'Privacy',
    nav_refund: 'Refund',
    nav_youth: 'Youth Protection',
    nav_contact: 'Contact',
    nav_settings: 'Settings',
    nav_billing: 'Billing',

    // Hero
    hero_badge: 'Magic Scan ✨',
    hero_title: 'Instant Answer Key\nRight on the Paper.',
    hero_title_night: "Snap your child's worksheet — Chekki checks it in Korean.",
    hero_desc:
      "The homework war is over. Get instant answer overlays and 'Teaching Scripts' so you can teach with confidence and love. No more guessing.",
    hero_desc_night:
      "Enjoy your 'parenting retirement' 5 minutes earlier. Chekki handles the answers while you provide the hugs.",
    hero_cta_btn: 'Start Now',

    // Camera View / Dashboard
    drop_title: 'Scan a Worksheet',
    drop_subtitle: 'Get your digital answer key instantly',
    btn_upload: 'Scan Worksheet',
    btn_guest_scan: 'Try a Free Scan',
    btn_walkthrough: 'Watch Walkthrough',
    supported_formats: 'Images are processed temporarily and NEVER stored.',
    dash_welcome: 'Hi,',
    dash_subtitle: 'Snap a photo to see the answers and your teaching guide.',
    lbl_feedback: 'Feedback',
    lbl_share_ideas: 'Share Ideas',
    lbl_quick_guide: 'Quick Guide',
    lbl_resource: 'Resource',
    lbl_pro_active: 'Premium',
    lbl_magic_left: 'Scans',
    lbl_lighting: 'Lighting',
    lbl_flat: 'Flat',
    lbl_sharp: 'Sharp',
    res_title: 'Parent Resources',
    res_subtitle: 'Help other parents find peace.',
    res_flyer: 'Official Flyer',
    res_download: 'Download',
    res_share: 'Share',
    res_copied: 'Link Copied!',

    // Usage Limits
    refill_title: 'Refill Required!',
    refill_desc: 'Daily scans used. We refill your magic at midnight!',
    refill_cta: 'Unlock Unlimited Magic',

    // Onboarding
    onb_1_title: 'Stop the Homework War',
    onb_1_desc: 'Chekki provides the answers, you provide the hugs.',
    onb_1_btn: 'Next Step',
    onb_2_title: 'Instant Answer Key',
    onb_2_desc: 'Answers appear right on top of the worksheet.',
    onb_2_btn: 'Got it!',
    onb_academy_title: 'Academy Authorized',
    onb_academy_desc: 'Enter your School code to unlock all premium features.',
    onb_3_title: 'Safe & Private',
    onb_3_desc: 'Data is securely stored for personalized practice. Privacy is our priority.',
    onb_3_btn: 'Start Now',
    onb_skip: 'Skip Intro',

    // Features Section
    how_title: 'How Chekki Works',
    how_step1: 'Magic Scans',
    how_step1_desc: 'Snap a photo for instant overlays.',
    how_step2: 'Perfect Pronunciation',
    how_step2_desc: 'Tap answers to hear native audio.',
    how_step3: 'Teach with Love',
    how_step3_desc: 'Use AI Tutor and Teaching Scripts to explain gently.',

    magic_title: 'See the Magic in Action',
    magic_subtitle: 'THE ESSENTIAL TOOL FOR EK PARENTS',

    trust_title: 'Safe for Your Family',
    trust_privacy: 'Privacy You Can Trust',
    trust_privacy_desc:
      'Your family’s safety is our priority; we never store your child’s data, processing images in real-time before deleting them instantly.',
    trust_safety: 'Bonding, Not Battling',
    trust_safety_desc:
      'We turn stressful correction time into a happy, high-five moment with interactive digital stamps and positive praise your child will love.',

    diff_title: 'Why Chekki?',
    diff_ocr: 'Magic Scans & Audio',
    diff_ocr_desc:
      "Get instant digital answer keys directly on the worksheet. Tap any answer for native pronunciation.",
    diff_script: 'Mom\'s Teaching Scripts',
    diff_script_desc:
      'Receive bilingual step-by-step scripts and grammar guides to confidently teach your child without frustration.',
    diff_brand: 'Interactive AI Tutor',
    diff_brand_desc: 'Need a simpler explanation? Get preschooler-friendly analogies and examples instantly.',

    // Analysis & Loading
    processing: 'Generating answer key...',
    loading_step0: 'Scanning for questions...',
    loading_step1: 'Preparing the answer key...',
    loading_step2: 'Writing your teaching scripts...',
    loading_step3: 'Syncing native audio...',
    loading_step4: 'Ready! Time to teach with love...',
    loading_thorough: 'Chekki is checking thoroughly for perfect answers.',
    loading_tip: '💡 Complex pages can take up to 30 seconds.',
    loading_almost: '🚀 Almost done! One final check...',
    loading_subliminal: '💡 Tip: Understand first, then check the answer.',
    btn_cancel_retry: 'Stop scanning',

    // Results
    ws_results_title: 'Teaching Guide',
    ws_items_found: 'Answers Ready',
    ws_voice_guide: '💡 Tap for native pronunciation',
    ws_gen_practice: 'Practice Sheet',
    ws_scan_again: 'Scan Again',
    ws_scanning_header: 'Generating answers...',
    ws_scanning_detail: 'Reading your worksheet...',
    tip_click_guide: 'Tap any question to see your Teaching Script!',
    lbl_mom_tip: 'Ask Chekki',
    lbl_audio: 'Listen',
    lbl_bookmark: 'Save to Dash',
    lbl_refine: 'Explain',
    growing_text: 'Generating...',

    // Feedback Form
    fb_title: 'Send Feedback',
    fb_desc: 'How is your experience with Chekki?',
    fb_error_desc: 'Something went wrong? Let us know.',
    fb_rating: 'Rating',
    fb_comment: 'Comment',
    fb_submit: 'Send Feedback',
    fb_success: "Feedback sent! We'll review it within 1 business day.",

    // Review / Mistake Note
    review_title: 'Mistake Bank',
    review_empty_title: 'All caught up!',
    review_empty_desc: "You don't have any items to review yet.",
    review_print_btn: 'Save / Print PDF',
    lbl_mistakes_count: 'items saved',
    lbl_question: 'Question',
    lbl_write_answer: 'Write the answer here...',
    lbl_correct_answer: 'Correct Answer:',
    print_footer: 'Chekki AI - Growing together every day.',

    // Gamification
    reward_job: 'Great Job!',
    reward_stamp: 'Sticker',
    reward_tap: 'Tap to get your stamp!',

    // Security Settings
    sec_audit_title: 'Security Audit',
    sec_audit_desc: 'Your data safety is our priority.',
    sec_point_1: 'Secure data storage active',
    sec_point_2: 'End-to-end encryption',
    sec_point_3: 'Anonymous processing',
    sec_point_4: 'Safe for kids',

    // Benefits List
    bene_unlimited: 'Unlimited AI Magic Scans',
    bene_tutor: 'Interactive Assistant',
    bene_pronounce: 'Interactive Voice Practice',
    bene_scripts: 'Step-by-Step Teaching Scripts',
    bene_stamps: 'Digital Stamps & Rewards',
    bene_anytime: 'Cancel Anytime',
    bene_overlays: 'Instant Answer Overlays',

    // Paywall
    pw_title: 'Premium Access',
    pw_desc: 'Unlock all premium features immediately and enjoy the full magic of Chekki.',
    subs_coming_soon: 'Full Access Included',
    beta_access_title: 'Redeem Access Code',

    // Errors
    error_title: "Couldn't read the worksheet",
    err_network: "We couldn't connect. Check your Wi-Fi and try again.",
    err_confirm: "Discard these results? You'll need to rescan the worksheet.",
    btn_scan_again_simple: 'Try Again',
    btn_retake: 'Take New Photo',

    // Subscription IAP
    subs_title: 'Premium Subscription',
    subs_subtitle: 'Unlock all features with unlimited access',
    subs_monthly: 'Monthly Subscription',
    subs_yearly: 'Yearly Subscription',
    subs_perMonth: '/mo',
    subs_perYear: '/yr',
    subs_subscribe: 'Subscribe',
    subs_restore: 'Restore Purchases',
    subs_cancelAnytime: 'Cancel anytime',
    subs_bestValue: 'Best Value',
    subs_mostPopular: 'Most Popular',
    subs_trialTitle: '7-Day Trial',
    subs_trialSubtitle: 'Subscription automatically starts after trial',
    subs_terms:
      'Subscription is billed to your iTunes account and will automatically renew unless cancelled at least 24 hours before the end of the current period. Manage or cancel your subscription in your account settings after purchase.',
    subs_manageTitle: 'Manage Subscription',
    subs_activeSubscription: 'Active Subscription',
    subs_noSubscription: 'No active subscription',
    subs_successTitle: 'Subscription Complete!',
    subs_successMessage: 'Welcome to ChekkiAI Premium',
    subs_errorTitle: 'Subscription Failed',
    subs_errorMessage:
      "Payment couldn't be processed. Try a different card or check your payment details.",
    subs_cancelledMessage: 'Subscription cancelled',
    ask_placeholder: 'Need help with homework? Ask Chekki! (e.g., Explain question 5)',

    // Tooltips
    tt_close: 'Deselect',
    tt_audio: 'Listen to Pronunciation',
    tt_bookmark: 'Save to Dashboard Mistake Bank',
    tt_refine: 'Explain More',
    tt_home: 'Return to Home',
    tt_lang_toggle: 'Switch Language',
    tt_moms_lounge: "Mom's Lounge",
    tt_review_note: 'Mistake Bank',
    tt_feedback: 'Share Feedback',
    tt_guide: 'Watch Guide',
    tt_resource: 'Parent Resources',
    tt_lighting: 'Ensure bright lighting for better accuracy',
    tt_flat: 'Keep the paper flat',
    tt_sharp: 'Make sure the text is in focus',

    // Misc
    footer_text: 'Chekki AI - Supporting every English Kindergarten (EK) family with love.',
    privacy_badge: '100% Private',
    privacy_pledge: 'Privacy Pledge',
    zero_memory_policy: 'Secure Storage Policy',
    zero_memory_desc:
      "We securely store your learning data solely for generating personalized practice worksheets and tracking progress.",
    share_app: 'Share Chekki AI',
    copy_script: 'Copy Script',
    script_copied: 'Copied!',
    btn_back: 'Back to Scan',
    theme_light: 'Switch to Light Mode',
    theme_dark: 'Switch to Dark Mode',
  },
  ko: {
    app_name: '채키 AI',
    tagline: '우리 아이 AI 숙제 도우미',
    login: '로그인',
    logout: '로그아웃',
    scans: '매직 스캔',
    pro_plan: '프리미엄 🚀',
    feat_overlay: '🎯 실시간 정답 오버레이',
    feat_script: '💌 다정한 티칭 스크립트',
    feat_pronounce: '🔊 원어민 발음 & 스피킹',
    feat_practice: '🪄 연습문제 무제한 생성',

    // Viral Sharing
    share_title: '평화를 선물하세요 🕊️',
    share_desc:
      '다른 부모님들도 평화를 찾을 수 있게 도와주세요. 맘카페에 바로 올릴 수 있는 템플릿을 복사해 드릴게요!',
    share_btn: '카페 템플릿 복사',
    share_toast: '템플릿이 복사되었습니다! 카페에 바로 붙여넣으세요.',

    // Guest Mode CTAs
    hero_guest_cta: '무료 체험하기',
    login_guest_link: '회원가입 없이 1회 체험하기',
    guest_scan_badge: '마법 스캔 ✨',
    guest_used_title: '마법을 경험하셨나요? ✨',
    guest_used_desc:
      '무료로 가입하면 하루 3회 스캔과 티칭 스크립트, 발음 듣기 기능을 이용할 수 있어요.',

    // Payments & Compliance
    pay_method_card: '일반 신용/체크카드',
    pay_method_easy: '간편 결제 (카카오페이, 네이버페이)',
    pay_secure_notice: '구매안전서비스(에스크로)를 통해 결제 안전을 보장합니다.',
    pay_vat_included: '부가세 포함',
    pay_auto_renew: '자동 결제 구독 상품입니다. 언제든지 해지 가능합니다.',
    pay_cancel_notice: '구독 해지는 마이페이지에서 언제든지 가능합니다.',

    // --- 구독 시스템 ---
    sub_title: '프리미엄 구독',
    sub_subtitle: '모든 기능을 무제한으로 이용하세요',
    sub_monthly: '월간 구독',
    sub_yearly: '연간 구독',
    sub_perMonth: '/월',
    sub_perYear: '/년',
    sub_subscribe: '구독하기',
    sub_restore: '구매 복원',
    sub_cancelAnytime: '언제든지 취소 가능',
    sub_cancelAnytimeSettings: 'App Store 설정에서 언제든지 취소',
    sub_bestValue: '최고의 가치',
    sub_mostPopular: '가장 인기 있는',
    sub_trial_headline: '매일 밤 숙제 전쟁, 이제 끝내세요',
    sub_trial_subtext:
      '7일 동안 무제한 1초 채점과 다정한 AI 티칭 가이드를 무료로 체험해보세요. 언제든지 해지 가능합니다.',
    sub_trial_badge: '7일 무료',
    sub_trial_no_charge: '체험 기간 종료 전 요금 없음',
    sub_trial_restore: '이전 구매 복원 가능',
    sub_save_yearly: '월간 대비 17% 절약',
    sub_cta_trial: '무료 체험 시작하기',
    sub_trial_status: '무료 체험 — {days}일 남음',
    sub_trial_ending: '무료 체험이 2일 후 종료됩니다',
    sub_disclosure_trial:
      '7일 무료 체험 후 Apple ID 계정으로 결제됩니다. 현재 구독 기간 종료 최소 24시간 전에 취소하지 않으면 자동으로 갱신됩니다. App Store 계정 설정에서 구독을 관리하고 취소할 수 있습니다.',
    sub_success: '구독 완료!',
    sub_error: '구독에 실패했습니다. 결제 수단을 확인하고 다시 시도해 주세요.',
    sub_androidSoon: 'Android 구독은 곧 출시됩니다',
    sub_androidSoonDesc: 'Android 결제 시스템을 준비 중입니다. iOS 앱을 사용하여 구독해 주세요.',
    sub_terms:
      '구독은 iTunes 계정으로 청구되며, 현재 구독 기간 종료 최소 24시간 전에 취소하지 않으면 자동으로 갱신됩니다.',
    sub_webHeadline: '모바일 앱에서 구독하세요',
    sub_webSubtext: 'ChekkiAI 앱을 다운로드하여 구독을 시작하세요.',
    sub_webCta: '다운로드 옵션 보기 →',
    sub_platformApple: 'App Store를 통해 구독됨',
    sub_platformGoogle: 'Google Play를 통해 구독됨',
    sub_platformWeb: 'Web으로 구독함',
    sub_active: '활성',
    sub_renews_on: '에 갱신됩니다',
    sub_no_active: '활성 구독 없음',
    sub_subscribe_now: '지금 구독하기',
    sub_expired: '만료됨',
    sub_expired_on: '에 만료됨',
    sub_renew_now: '구독 갱신하기',
    sub_manage: '구독 관리',
    sub_web_manage: 'iPhone의 App Store 앱에서 구독을 관리하세요',
    sub_loading: '구독 옵션 불러오는 중...',
    sub_load_error: '구독 옵션을 불러올 수 없습니다. 다시 시도해 주세요.',
    sub_retry: '다시 시도',
    sub_disclosure:
      '구매 확인 시 Apple ID 계정으로 결제됩니다. 현재 구독 기간 종료 최소 24시간 전에 취소하지 않으면 구독이 자동으로 갱신됩니다. 현재 기간 종료 전 24시간 이내에 동일한 금액으로 갱신 비용이 계정에 청구됩니다. 구매 후 App Store 계정 설정에서 구독을 관리하고 취소할 수 있습니다.',
    sub_privacy_terms: '개인정보 처리방침 | 이용약관',
    biz_name: 'Chekki (채키)',
    biz_info_title: '사업자 정보',
    biz_reg_num: '사업자등록번호: 814-14-03096',
    biz_rep: '대표자: Chekki 지원팀',
    biz_address: '주소: 서울특별시 종로구 종로 347, 롯데캐슬, 03113',
    biz_mail_order: '통신판매업 신고번호: 준비중',
    biz_hours: '고객센터: 평일 10:00–18:00 (KST)',
    biz_escrow: '본 서비스는 구매안전서비스를 통해 결제 안전을 보장합니다.',
    biz_contact_notice: '문의는 1영업일 이내 답변드립니다.',
    biz_email: '이메일: chekkihelp@gmail.com',

    // Settings
    settings_title: '학부모 프로필',
    settings_profile: '내 프로필',
    settings_name_label: '성함',
    settings_lang_label: '앱 언어 설정',
    settings_theme_label: '화면 테마 설정',
    settings_delete_account: '계정 탈퇴',
    settings_delete_confirm: '계정을 영구 삭제하시겠습니까?',
    settings_delete_yes: '계정 삭제하기',
    settings_delete_no: '계정 유지하기',
    settings_save: '설정 저장하기',
    settings_saved: '설정이 저장되었습니다!',
    settings_feedback: '의견 보내기',
    settings_device_diag: '기기 진단',

    // Billing
    billing_title: '결제 및 구독 정보',
    billing_active: '활성 구독 정보',
    billing_plan: '구독 플랜',
    billing_started: '구독 시작일',
    billing_next: '다음 결제일',
    billing_expires: '만료일',
    billing_canceled_notice:
      '구독이 해지되었습니다. 만료일까지는 모든 기능을 이용하실 수 있습니다.',
    billing_back: '앱으로 돌아가기',
    billing_cancel_btn: '정말 구독을 해지하시겠습니까?',
    billing_cancel_desc:
      '해지 시 다음 결제 주기가 끝난 후 프리미엄 기능을 이용하실 수 없게 됩니다.',
    billing_cancel_yes: '구독 해지하기',
    billing_cancel_no: '구독 유지하기',

    // Navigation
    nav_home: '홈',
    nav_pricing: '요금 안내',
    nav_terms: '이용약관',
    nav_privacy: '개인정보처리방침',
    nav_refund: '환불정책',
    nav_youth: '청소년 보호 정책',
    nav_contact: '문의하기',
    nav_settings: '설정',
    nav_billing: '구독 관리',

    // Hero
    hero_badge: '마법 스캔 ✨',
    hero_title: '잃어버린 답지 찾지 말고,\n사진 한 장만 찍으세요',
    hero_title_night: '영어 숙제, 채키가 확인해드려요',
    hero_desc:
      "영유 숙제, 정답 찾느라 헤매지 마세요. 마법처럼 종이 위에 나타나는 정답과 '티칭 스크립트'로 다정하게 지도하세요.",
    hero_desc_night:
      '육아퇴근을 5분 더 앞당겨 드릴게요. 정답은 채키가 찾을 테니, 아이를 한 번 더 안아주세요.',
    hero_cta_btn: '지금 바로 시작하기',

    // Camera View / Dashboard
    drop_title: '학습지를 스캔해 보세요',
    drop_subtitle: '종이 위에 정답이 마법처럼 나타나요',
    btn_upload: '학습지 스캔하기',
    btn_guest_scan: '무료 스캔 체험하기',
    btn_walkthrough: '사용 가이드 보기',
    supported_formats: '이미지는 분석 후 즉시 삭제됩니다.',
    dash_welcome: '반가워요,',
    dash_subtitle: '사진을 찍으면 바로 정답과 티칭 가이드를 보여드려요.',
    lbl_feedback: '의견 보내기',
    lbl_share_ideas: '의견 보내기',
    lbl_quick_guide: '사용 가이드',
    lbl_resource: '학부모 자료',
    lbl_pro_active: '프리미엄',
    lbl_magic_left: '남은 스캔',
    lbl_lighting: '밝게',
    lbl_flat: '수평',
    lbl_sharp: '선명',
    res_title: '학부모 리소스',
    res_subtitle: '다른 부모님들께 평화를 선물하세요.',
    res_flyer: '공식 안내문',
    res_download: '저장',
    res_share: '공유',
    res_copied: '복사 완료!',

    // Usage Limits
    refill_title: '마법 충전 필요!',
    refill_desc: '오늘의 스캔을 모두 사용했어요. 내일 다시 충전됩니다!',
    refill_cta: '무제한 마법 시작하기',

    // Onboarding
    onb_1_title: '숙제 전쟁, 이제 그만',
    onb_1_desc: '채점은 채키가 할게요. 부모님은 칭찬만 해주세요.',
    onb_1_btn: '다음 단계로',
    onb_2_title: '마법 같은 정답지',
    onb_2_desc: '사진만 찍으면 종이 위에 정답이 바로 나타나요.',
    onb_2_btn: '확인했어요!',
    onb_academy_title: '우리 아이 학원과 함께',
    onb_academy_desc: '학원 코드를 입력하면 모든 기능을 이용할 수 있어요.',
    onb_3_title: '안심하고 사용하세요',
    onb_3_desc: '맞춤형 학습을 위해 데이터는 안전하게 보관됩니다.',
    onb_3_btn: '시작하기',
    onb_skip: '건너뛰기',

    // Features Section
    how_title: '채키는 이렇게 도와드려요',
    how_step1: '매직 스캔',
    how_step1_desc: '사진 한 장으로 정답이 오버레이 됩니다.',
    how_step2: '완벽한 발음 듣기',
    how_step2_desc: '정답을 탭하여 원어민 발음을 들려주세요.',
    how_step3: '다정한 설명',
    how_step3_desc: '맞춤 AI 튜터와 티칭 스크립트로 친절하게 알려주세요.',

    magic_title: '마법 같은 실력을 직접 확인하세요',
    magic_subtitle: '영유 학부모님을 위한 필수 도구',

    trust_title: '부모님들이 채키를 믿는 이유',
    trust_privacy: '안심할 수 있는 보안',
    trust_privacy_desc:
      '우리 아이의 정보는 소중하니까요. 사진은 저장되지 않고 분석 즉시 파기되어 개인정보를 완벽하게 보호합니다.',
    trust_safety: '혼내지 않는 즐거운 학습',
    trust_safety_desc:
      '숙제 시간이 전쟁터가 아닌, 아이와 웃으며 하이파이브하는 칭찬과 교감의 시간으로 바뀝니다.',

    diff_title: '채키와 함께라면 다릅니다',
    diff_ocr: '매직 스캔 & 발음 듣기',
    diff_ocr_desc:
      '문제집 위에 실시간으로 마법처럼 정답이 표시됩니다. 정답을 눌러 원어민 발음까지 완벽하게 확인하세요.',
    diff_script: '엄마의 티칭 스크립트',
    diff_script_desc:
      '아이에게 어떻게 가르쳐야 할지 고민하지 마세요. 엄마가 그대로 읽어주기만 하면 되는 한/영 대본을 제공합니다.',
    diff_brand: '우리 아이 맞춤 AI 튜터',
    diff_brand_desc: '아이가 이해하기 어려워하나요? 아이 눈높이에 딱 맞는 쉬운 비유와 추가 예시를 즉시 받아보세요.',

    // Analysis & Loading
    processing: '정답지를 만들고 있어요...',
    loading_step0: '문제들을 찾고 있어요...',
    loading_step1: '정답 데이터를 매칭하는 중...',
    loading_step2: '다정한 티칭 스크립트 작성 중...',
    loading_step3: '원어민 발음 가이드 준비 중...',
    loading_step4: '준비 완료! 아이와 함께 보세요...',
    loading_thorough: '완벽한 정답을 위해 채키가 꼼꼼하게 확인하고 있어요.',
    loading_tip: '💡 내용이 많은 페이지는 최대 30초까지 걸릴 수 있어요.',
    loading_almost: '🚀 거의 다 됐어요! 마지막으로 한 번 더 확인 중이에요...',
    loading_subliminal: '💡 팁: 정답을 쓰기 전에 먼저 이해해보세요.',
    btn_cancel_retry: '스캔 중지',

    // Results
    ws_results_title: '티칭 가이드',
    ws_items_found: '개의 정답 완료',
    ws_voice_guide: '💡 탭하면 원어민의 정확한 발음을 들려드려요',
    ws_gen_practice: '복습 문제지',
    ws_scan_again: '다시 스캔하기',
    ws_scanning_header: '정답을 찾는 중...',
    ws_scanning_detail: '학습지를 읽고 있어요...',
    tip_click_guide: '질문을 탭하면 다정한 티칭 가이드가 나타나요!',
    lbl_mom_tip: '티칭 스크립트',
    lbl_audio: '듣기',
    lbl_bookmark: '대시보드 저장',
    lbl_refine: '설명',
    growing_text: '생성 중...',

    // Feedback Form
    fb_title: '의견 보내기',
    fb_desc: '채키를 사용해보니 어떠신가요?',
    fb_error_desc: '불편한 점이 있으셨나요? 알려주세요.',
    fb_rating: '별점',
    fb_comment: '의견',
    fb_submit: '의견 보내기',
    fb_success: '의견을 보내주셔서 감사합니다! 1영업일 내에 검토해 드릴게요.',

    // Review / Mistake Note
    review_title: '오답 노트',
    review_empty_title: '복습할 내용이 없어요!',
    review_empty_desc: '아직 학습할 오답이 없습니다.',
    review_print_btn: 'PDF 저장 / 인쇄하기',
    lbl_mistakes_count: '개의 저장된 문제',
    lbl_question: '문제',
    lbl_write_answer: '여기에 정답을 써보세요...',
    lbl_correct_answer: '정답:',
    print_footer: '채키 AI와 함께 매일 조금씩 성장합니다.',

    // Gamification
    reward_job: '잘했어요!',
    reward_stamp: '참 잘했어요',
    reward_tap: '도장을 찍어주세요!',

    // Security Settings
    sec_audit_title: '보안 감사 완료',
    sec_audit_desc: '채키는 개인정보 보호를 최우선으로 합니다.',
    sec_point_1: '안전한 데이터 보관',
    sec_point_2: '데이터 암호화 전송',
    sec_point_3: '익명 분석 처리',
    sec_point_4: '자녀 안심 서비스',

    // Benefits List
    bene_unlimited: '무제한 AI 매직 스캔',
    bene_tutor: '우리 아이 맞춤 학습 도우미',
    bene_pronounce: '실전 오디오 스피킹 연습',
    bene_scripts: '단계별 티칭 가이드 & 스크립트',
    bene_stamps: '디지털 도장 및 보상',
    bene_anytime: '언제든지 해지 가능',
    bene_overlays: '즉각적인 답안 오버레이',

    // Paywall
    pw_title: '프리미엄 액세스',
    pw_desc: '지금 바로 프리미엄 기능을 활성화하고 채키의 모든 마법을 경험해보세요.',
    subs_coming_soon: '모든 기능 포함됨',
    beta_access_title: '액세스 코드 입력',

    // Errors
    error_title: '학습지를 읽지 못했어요',
    err_network: '연결에 실패했습니다. Wi-Fi를 확인하고 다시 시도해 주세요.',
    err_confirm: '결과를 삭제하시겠어요? 학습지를 다시 스캔해야 합니다.',
    btn_scan_again_simple: '다시 시도하기',
    btn_retake: '새 사진 찍기',

    // Subscription IAP
    subs_title: '프리미엄 구독',
    subs_subtitle: '모든 기능을 무제한으로 이용하세요',
    subs_monthly: '월간 구독',
    subs_yearly: '연간 구독',
    subs_perMonth: '/월',
    subs_perYear: '/년',
    subs_subscribe: '구독하기',
    subs_restore: '구매 복원',
    subs_cancelAnytime: '언제든지 취소 가능',
    subs_bestValue: '최고의 가치',
    subs_mostPopular: '가장 인기 있는',
    subs_trialTitle: '7일 체험',
    subs_trialSubtitle: '체험 후 자동으로 구독이 시작됩니다',
    subs_terms:
      '구독 시 서비스 이용약관 및 개인정보 처리방침에 동의하게 됩니다. 구독은 iTunes 계정으로 청구되며, 현재 구독 기간 종료 최소 24시간 전에 취소하지 않으면 자동으로 갱신됩니다. 구독 관리 및 자동 갱신 해제는 구매 후 계정 설정에서 가능합니다.',
    subs_manageTitle: '구독 관리',
    subs_activeSubscription: '현재 활성 구독',
    subs_noSubscription: '활성 구독이 없습니다',
    subs_successTitle: '구독 완료!',
    subs_successMessage: 'ChekkiAI 프리미엄에 오신 것을 환영합니다',
    subs_errorTitle: '결제 실패',
    subs_errorMessage:
      '결제를 처리하지 못했습니다. 다른 카드를 사용하거나 결제 정보를 확인해 주세요.',
    subs_cancelledMessage: '구독이 취소되었습니다.',
    ask_placeholder: '숙제 중 궁금한 게 있나요? 채키에게 물어보세요! (예: 5번 문제 설명해줘)',

    // Tooltips
    tt_close: '선택 취소',
    tt_audio: '원어민 발음 듣기',
    tt_bookmark: '대시보드 오답 노트에 저장',
    tt_refine: '상세 설명 보기',
    tt_home: '처음으로 돌아가기',
    tt_lang_toggle: '언어 변경',
    tt_moms_lounge: '엄마들의 쉼터',
    tt_review_note: '오답 노트',
    tt_feedback: '의견 보내기',
    tt_guide: '가이드 보기',
    tt_resource: '학부모 자료',
    tt_lighting: '정확한 분석을 위해 밝은 곳에서 찍어주세요',
    tt_flat: '종이를 평평하게 펴주세요',
    tt_sharp: '글자가 선명하게 보이도록 해주세요',

    // Misc
    footer_text: '채키 AI - 모든 영어 유치원(EK) 가족의 평화를 기원합니다.',
    privacy_badge: '100% 안심 보안',
    privacy_pledge: '프라이버시 약속',
    zero_memory_policy: '데이터 안심 보관',
    zero_memory_desc:
      '학습 진행도를 추적하고 맞춤형 워크시트를 생성하기 위해 필요한 데이터만 안전하게 보관합니다.',
    share_app: '채키 AI 공유하기',
    copy_script: '스크립트 복사',
    script_copied: '복사됨!',
    btn_back: '스캔으로 돌아가기',
    theme_light: '라이트 모드로 전환',
    theme_dark: '다크 모드로 전환',
  },
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
