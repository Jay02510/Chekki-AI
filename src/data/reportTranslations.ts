export const REPORT_TRANSLATIONS = {
  en: {
    nav: {
      tag: 'Chekki B2B System',
      title: 'Parent Report Automator',
      features: 'Features',
      demo: '1-Min Video Demo',
      interactive: 'Live Generator',
      calculator: 'ROI Calculator',
      pricing: 'Pricing',
      onboarding: 'Custom Setup',
      language: '한국어'
    },
    hero: {
      tagline: 'ACADEMY OPERATIONAL AUTOMATION SYSTEM',
      headline: 'Automate Foreign Teacher Management & Eliminate 100% of K-Teacher Translation Workload.',
      subheadline: 'ChekkiAI instantly transforms 45-second Fillout teacher logs into highly sophisticated, bilingual parent consultation scripts ready for phone calls and KakaoTalk.',
      primaryCta: 'Request Custom Academy Setup',
      secondaryCta: 'Watch 1-Minute Video Demo',
      badge: 'Dedicated system for elementary & middle school academies employing native English teachers'
    },
    pricing: {
      heading: 'Simple, Transparent Academy Pricing',
      subheading: 'No setup fees. Zero long-term lock-in. Scale as your academy grows.',
      starterTitle: 'Solo Tutor / Starter',
      starterPrice: '₩0',
      starterPeriod: '/ 14-Day Free Trial',
      starterDesc: 'Perfect for testing AI progress reports & KakaoTalk script generation.',
      starterFeatures: [
        'Up to 15 Monthly AI Progress Reports',
        'Standard KakaoTalk Script Generator',
        'Standard Student Progress Cards',
        'Email Support'
      ],
      starterCta: 'Start 14-Day Free Trial',

      proTitle: 'Report Studio Standalone (Product A)',
      proPrice: '₩35,000',
      proPeriod: '/ month per campus',
      proBadge: 'MOST POPULAR (PRODUCT A)',
      proDesc: 'Standalone AI report generator with live Korean Teacher review & edit workspace.',
      proFeatures: [
        '30-Second Foreign Teacher Mobile Log Form',
        'Built-in Chekki AI Engine (Sub-second speed)',
        'Bilingual (KO + EN) KakaoTalk Script Generator',
        'Live Editable Textarea for KT Review & Copying',
        '3-Stage Review Status Pipeline (Pending ➔ Edited ➔ Sent)',
        'Flagged Student Exception Phone Call Prep Drawer'
      ],
      proCta: 'Choose Report Studio (Product A)',

      enterpriseTitle: 'Chekki School Pro (Product B)',
      enterprisePrice: '₩69,000',
      enterprisePeriod: '/ month per campus',
      enterpriseDesc: 'Report Studio + Automated Textbook Scope & Sequence Pre-seeding & Roster Sync.',
      enterpriseFeatures: [
        'Everything in Report Studio (Product A)',
        '1-Click Textbook Syllabus Pre-seeding & Vocabulary Auto-Sync',
        'Verified Curriculum Vocabulary Accuracy',
        'Multi-Teacher & Multi-Class Roster Management',
        'Parent AI Diagnostic Insight Dashboard',
        'Dedicated 1:1 Director Onboarding'
      ],
      enterpriseCta: 'Choose Chekki School Pro (Product B)'
    },
    videoDemo: {
      tagline: '1-MINUTE PLATFORM WALKTHROUGH',
      heading: 'See How Chekki AI Transforms Raw FT Logs Into Phone-Ready Parent Scripts',
      subheading: 'Watch how simple 30-second mobile logs generate polished bilingual parent updates.'
    },
    painVsDream: {
      heading: 'Stop Wasting Korean Staff Hours on Manual Report Translation',
      subheading: 'Compare traditional fragmented workflows with ChekkiAI standardized automation.',
      bottleneckTitle: 'Traditional Manual Workflow',
      bottleneckSubtitle: 'High friction, translation backlogs, and delayed parent updates.',
      bottleneckAlert: 'Average academy loss: 15+ hours per week spent on manual translation before parent calls.',
      bottleneckPoints: [
        {
          title: 'Constant Chasing for Comments',
          desc: 'Directors and staff spend hours every Friday reminding foreign teachers to turn in weekly feedback.'
        },
        {
          title: 'Time-Consuming Translation Workload',
          desc: 'Korean staff spend 12–15 hours translating raw English notes into polite Korean honorifics (존댓말) before phone calls.'
        },
        {
          title: 'Inconsistent Consultation Quality',
          desc: 'Vague notes like "He did okay" force counselors to improvise during delicate parent consultations.'
        },
        {
          title: 'Delayed Exception Updates',
          desc: 'Missing homework, tardiness, or speaking hesitancy get buried in spreadsheets until parents complain.'
        }
      ],
      standardTitle: 'ChekkiAI Automated Pipeline',
      standardSubtitle: 'Standardized data, zero translation delay, phone-ready scripts.',
      standardResult: 'ChekkiAI impact: 90% reduction in translation workload and 100% standardized parent call readiness.',
      standardPoints: [
        {
          title: 'Frictionless 45-Second FT Input (Fillout)',
          desc: 'Foreign teachers log daily class data and student exceptions in seconds on any mobile device or laptop.'
        },
        {
          title: 'Instant Bilingual Normalization (Make & AI)',
          desc: 'Backend AI converts observations into natural, highly polite Korean (존댓말) consultation scripts instantly.'
        },
        {
          title: 'Structured Talk Tracks for Counselors (Softr)',
          desc: 'Korean counseling staff receive clear, line-by-line talking points with greeting, progress, and action items.'
        },
        {
          title: 'Automated Exception Flagging',
          desc: 'Missing homework or behavioral issues are flagged immediately for proactive parent updates.'
        }
      ]
    },
    howItWorks: {
      heading: 'From Raw Teacher Observations to Polished Parent Scripts in Seconds',
      subheading: 'A standardized 4-step pipeline designed specifically for South Korean English Academies.',
      step1Title: '1. Foreign Teacher Fillout Form',
      step1Desc: 'Native teachers log daily progress, vocabulary, and student observations using a 45-second Fillout form.',
      step2Title: '2. Make.com & Claude AI Engine',
      step2Desc: 'Automation engine normalizes English notes into formal Korean honorific scripts with zero delay.',
      step3Title: '3. Airtable & Softr Dashboard',
      step3Desc: 'Directors & Korean teachers review side-by-side student cards on a clean Softr dashboard.',
      step4Title: '4. 1-Click KakaoTalk Parent Care',
      step4Desc: '1-click copy formatted Korean consultation scripts directly into KakaoTalk or phone logs.'
    },
    interactiveDemo: {
      heading: 'Test ChekkiAI Parent Report Generation in Real-Time',
      subheading: 'Select a sample student scenario or type custom foreign teacher notes to generate a bilingual parent script.',
      selectPreset: 'Select Sample Student Case:',
      customInputLabel: 'Foreign Teacher Notes (English):',
      generateBtn: 'Generate Dual-Branch Parent Script',
      rawSource: 'Original English Teacher Log',
      translatedSummary: 'Normalized Korean Academic Summary (Airtable DB)',
      scriptSectionsHeading: '5-Part Korean Parent Consultation Script (KakaoTalk)',
      scriptSections: {
        greeting: '1. Polite Opening Greeting (인사말)',
        academicProgress: '2. Academic Progress Evaluation (학습 성과)',
        behaviorAndAttitude: '3. Classroom Engagement (수업 태도)',
        actionItems: '4. Home Guidance Request (가정 연계 지도)',
        closing: '5. Professional Closing (맺음말)'
      },
      flaggedAlert: 'Flagged Exception Notice',
      copyScriptBtn: '1-Click Copy for KakaoTalk',
      copiedText: 'Copied to Clipboard! ✅',
      directorNoteLabel: 'Note for Directors & Counselors',
      directorNoteBody: 'The generated script is refined into polished, phone-ready Korean honorifics (존댓말).',
      generatingLabel: 'Generating Script...',
      inputPlaceholder: 'Type or paste foreign teacher comments here...'
    },
    calculator: {
      heading: 'Calculate How Much Time & Money ChekkiAI Saves Your Academy',
      subheading: 'Based on operational data from top Korean English Academies.',
      foreignTeachersLabel: 'Number of Foreign Teachers (FTs):',
      studentCountLabel: 'Total Enrolled Students:',
      weeklyTranslationHours: 'Weekly Translation Hours Saved:',
      monthlyCostSavings: 'Estimated Monthly Labor Savings:',
      annualCostSavings: 'Estimated Annual Cost Savings:',
      hoursUnit: 'hours / week',
      currencyUnit: 'KRW',
      ctaText: 'Start saving hours on your very first week.',
      disclaimerText: 'Calculation basis: avg. 3.5 hrs/week per FT spent on report translation × Korean staff hourly rate.'
    },
    onboardingForm: {
      heading: 'Request Custom Academy Setup & Onboarding',
      subheading: 'Fill out your academy scale below. Our operations team will build your custom Fillout, Make.com, Airtable, and Softr pipeline within 48 hours.',
      directorName: 'Director / Contact Name',
      academyName: 'Academy Name',
      phone: 'Contact Phone Number',
      email: 'Email Address',
      location: 'Academy Region / City',
      teachersCount: 'Number of Foreign Teachers (FTs)',
      studentsCount: 'Total Enrolled Students',
      currentMethod: 'Current Parent Communication Method',
      preferredTime: 'Preferred Contact Time',
      submitBtn: 'Submit Custom Setup Request',
      submitting: 'Submitting Request...',
      successTitle: 'Setup Request Received! 🎉',
      successMessage: 'Thank you! Our operations team has received your academy parameters. We will contact you within 2 business hours to schedule your custom setup.',
      modalTitle: 'Request Custom Academy Setup',
      modalSubtitle: 'Get a custom Fillout, Make.com, Airtable, and Softr reporting pipeline built for your academy.'
    }
  },
  ko: {
    nav: {
      tag: '체키 B2B 시스템',
      title: '학부모 리포트 자동화',
      features: '주요 기능',
      demo: '1분 데모 영상',
      interactive: '실시간 생성기',
      calculator: '절감 비용 계산기',
      pricing: '요금 안내',
      onboarding: '맞춤 구축 신청',
      language: 'English'
    },
    hero: {
      tagline: '어학원 원어민 강사 관리 & 학부모 피드백 자동화 시스템',
      headline: 'ChekkiAI: 원어민 강사 관리 및 자동 이중언어 보고서 시스템',
      subheadline: '학원 운영의 핵심인 원어민 강사 관리와 학부모 피드백, 이제 ChekkiAI로 완벽하게 자동화하세요. 원어민 교사의 간단한 Fillout 입력 데이터를 0초 만에 정교한 한/영 학부모 상담 대본으로 전환해드립니다.',
      primaryCta: '맞춤 학원 구축 & 온보딩 신청',
      secondaryCta: '1분 시연 데모 영상 보기',
      badge: '원어민 강사를 보유한 초등·중등 어학원 및 영유 전용 전용 시스템'
    },
    pricing: {
      heading: '투명하고 합리적인 학원 요금제',
      subheading: '초기 구축 비용 0원. 언제든지 해지 가능. 학원 성장에 맞춰 선택하세요.',
      starterTitle: '1인 공부방 / 스타터',
      starterPrice: '₩0',
      starterPeriod: '/ 14일 무료 체험',
      starterDesc: 'AI 성적표 및 알림톡 대본 생성을 무료로 체험해보세요.',
      starterFeatures: [
        '월 최대 15회 AI 성적표 생성',
        '기본 학부모 상담 알림톡 대본',
        '원생별 기본 성취도 카드',
        '이메일 고객 지원'
      ],
      starterCta: '14일 무료 체험 시작하기',

      proTitle: '리포트 스튜디오 단독형 (Product A)',
      proPrice: '₩35,000',
      proPeriod: '/ 월 (캠퍼스당)',
      proBadge: '가장 인기 있는 플랜 (Product A)',
      proDesc: '독립형 AI 알림톡 대본 생성기 및 한국인 교사 수동 검수/수정 워크스페이스.',
      proFeatures: [
        '30초 원어민 강사 모바일 평가 폼',
        '체키 AI 엔진 직접 탑재 (초고속 자동 생성)',
        '한/영 이중언어 알림톡 대본 자동 생성',
        '실시간 편집 가능한 KT 검수 & 1클릭 복사 워크스페이스',
        '3단계 검수 상태 파이프라인 (검수대기 ➔ 수정완료 ➔ 발송완료)',
        '주의/칭찬 학생 전용 전화 상담 대본 드로어'
      ],
      proCta: '리포트 스튜디오 선택하기 (Product A)',

      enterpriseTitle: '체키 스쿨 프로 (Product B)',
      enterprisePrice: '₩69,000',
      enterprisePeriod: '/ 월 (캠퍼스당)',
      enterpriseDesc: '리포트 스튜디오 + 교재 목차 자동 선제 탑재 (어휘 동기화) & 원생 명단 연동.',
      enterpriseFeatures: [
        '리포트 스튜디오 (Product A) 모든 기능 포함',
        '1클릭 교재 목차 사진 스캔 & 타겟 어휘 자동 탑재',
        '검증된 커리큘럼 타겟 어휘 100% 연동',
        '강사별 반 배정 및 원생 명단 일괄 관리 (CSV 업로드)',
        '학부모 1클릭 AI 진단 인사이트 대시보드',
        '전담 매니저 1:1 맞춤 온보딩 지원'
      ],
      enterpriseCta: '체키 스쿨 프로 선택하기 (Product B)'
    },
    videoDemo: {
      tagline: '1분 플랫폼 시연 데모 영상',
      heading: '원어민 코멘트 입력부터 이중언어 상담 대본까지 1분 만에 확인하세요',
      subheading: 'Fillout 입력 폼부터 Make AI 프로세싱, Softr 대시보드 이중언어 보고서 생성 과정을 직접 확인해보세요.'
    },
    painVsDream: {
      heading: '수동 리포트 번역에 낭비되는 K-Teacher의 업무 시간을 멈추세요',
      subheading: '기존 비효율적인 수동 업무 방식과 체키AI의 자동화 파이프라인을 비교해보세요.',
      bottleneckTitle: '기존 수동 업무 방식',
      bottleneckSubtitle: '높은 업무 피로도, 번역 지연, 일관성 없는 상담 퀄리티.',
      bottleneckAlert: '어학원 평균 손실: 주당 15시간 이상이 학부모 상담 전 수동 번역에 소비됩니다.',
      bottleneckPoints: [
        {
          title: '매주 금요일 코멘트 독촉 스트레스',
          desc: '원장님과 상담 실장님이 매주 원어민 교사에게 주간 피드백 제출을 독촉하느라 시간이 허비됩니다.'
        },
        {
          title: '과도한 한국인 강사 번역 업무',
          desc: '한국인 교사들이 전화 상담 전 영문 메모를 존댓말 한국어로 번역하는 데 주당 12~15시간을 씁니다.'
        },
        {
          title: '일관성 없는 상담 대본 퀄리티',
          desc: '"He did okay" 같은 단편적인 코멘트 때문에 학부모 상담 전화 시 즉흥적으로 대답해야 합니다.'
        },
        {
          title: '이슈 발생 시 늦장 대응',
          desc: '숙제 미제출, 지각, 발표 태도 저하 등 주의 이슈가 엑셀에 묻혀 학부모 항의 후 대응하게 됩니다.'
        }
      ],
      standardTitle: '체키AI 자동화 파이프라인',
      standardSubtitle: '표준화된 데이터, 번역 지연 0초, 전화 상담 준비 완료 대본.',
      standardResult: '체키AI 도입 효과: 번역 업무 90% 감축 및 학부모 상담 준비도 100% 완료.',
      standardPoints: [
        {
          title: '45초 간편 모바일 입력 (Fillout)',
          desc: '원어민 강사들이 단 몇 번의 클릭만으로 오늘의 수업 데이터와 진도를 정확하게 기록합니다.'
        },
        {
          title: '실시간 이중언어 정제 엔진 (Make & Claude AI)',
          desc: '제출 즉시 백엔드 AI 시스템이 작동하여 복잡한 가이드라인에 맞춘 보고서를 즉각 생성합니다.'
        },
        {
          title: '상담 교사를 위한 5단계 구조화 대본 (Softr)',
          desc: '완성된 대시보드에서는 학부모 상담에 바로 활용할 수 있는 정교한 이중언어 보고서를 한눈에 확인합니다.'
        },
        {
          title: '특이사항 자동 감지 알림',
          desc: '숙제 미제출, 지각 등 주의 이슈가 즉시 깃발로 표시되어 선제적 학부모 케어가 가능합니다.'
        }
      ]
    },
    howItWorks: {
      heading: '원어민 관찰 메모부터 완벽한 학부모 상담 대본까지 0초 만에 완료',
      subheading: '대한민국 어학원 운영 프로세스에 최적화된 4단계 표준화 파이프라인.',
      step1Title: '1. 원어민 교사 Fillout 입력',
      step1Desc: '원어민 강사가 모바일 폼으로 일일 학습, 진도, 학생 관찰 메모를 45초 만에 입력합니다.',
      step2Title: '2. Make & AI 자동 정제',
      step2Desc: '자동화 엔진이 영문 코멘트를 정중한 한국어 존댓말 5단계 대본으로 변환합니다.',
      step3Title: '3. Airtable & Softr 대시보드',
      step3Desc: '원장님과 한국인 교사가 Softr 대시보드에서 나란히 정리된 학생 카드를 확인합니다.',
      step4Title: '4. 1클릭 카카오톡 학부모 케어',
      step4Desc: '1클릭으로 정제된 한국어 대본을 복사하여 카카오톡이나 전화 상담에 즉시 활용합니다.'
    },
    interactiveDemo: {
      heading: '체키 AI 학부모 리포트 스튜디오',
      subheading: '샘플 학생 케이스를 선택하거나 원어민 교사의 메모를 입력하여 1초 만에 카카오톡 발송용 대본을 생성하세요.',
      selectPreset: '샘플 학생 케이스 선택:',
      customInputLabel: '원어민 교사 수업 코멘트 (영문):',
      generateBtn: 'AI 이중 학부모 리포트 생성',
      rawSource: '원어민 교사 영문 원문',
      translatedSummary: '학원 DB 저장용 학업 요약문 (Airtable)',
      scriptSectionsHeading: '5단계 학부모 상담 & 카카오톡 발송 대본',
      scriptSections: {
        greeting: '1단계: 다정한 정중 인사말 (인사말)',
        academicProgress: '2단계: 학업 성과 & 평가 (학습 성과)',
        behaviorAndAttitude: '3단계: 수업 태도 & 집중도 (수업 태도)',
        actionItems: '4단계: 가정 연계 지도 요청 (가정 연계 지도)',
        closing: '5단계: 전문적인 맺음말 (맺음말)'
      },
      flaggedAlert: '주요 특이사항 & 감지된 주의 이슈',
      copyScriptBtn: '1클릭 카카오톡 대본 복사',
      copiedText: '클립보드 복사 완료! ✅',
      directorNoteLabel: '원장님 & 코티처 상담 가이드',
      directorNoteBody: '생성된 대본은 극존칭(존댓말)으로 정제되어 상담 전화 및 카카오톡 전송에 즉시 활용 가능합니다.',
      generatingLabel: '리포트 대본 생성 중...',
      inputPlaceholder: '원어민 강사의 수업 메모 또는 평가를 입력하세요...'
    },
    calculator: {
      heading: '우리 학원의 절감 시간 & 인건비 계산기',
      subheading: '실제 주요 어학원 운영 데이터를 바탕으로 산출된 실질 절감 수치입니다.',
      foreignTeachersLabel: '원어민 강사 수 (FT):',
      studentCountLabel: '총 재원생 수:',
      weeklyTranslationHours: '주당 절감되는 번역 업무 시간:',
      monthlyCostSavings: '추정 월간 인건비 절감액:',
      annualCostSavings: '추정 연간 인건비 절감액:',
      hoursUnit: '시간 / 주',
      currencyUnit: '원',
      ctaText: '도입 첫 주부터 매주 15시간 이상을 절감하세요.',
      disclaimerText: '산출 기준: 원어민 강사 1인당 주당 리포트 번역/상담 준비 약 3.5시간 × 한국인 강사 시급 기준.'
    },
    onboardingForm: {
      heading: '맞춤 학원 구축 & 온보딩 신청',
      subheading: '아래 학원 정보를 입력해주시면 전문 팀이 48시간 이내에 학원 맞춤형 Fillout, Make.com, Airtable, Softr 시스템을 구축해드립니다.',
      directorName: '원장님 / 담당자 성함',
      academyName: '학원명 / 어학원 명칭',
      phone: '연락처',
      email: '이메일 주소',
      location: '학원 지역 / 캠퍼스 위치',
      teachersCount: '원어민 강사 수 (FT)',
      studentsCount: '총 재원생 수',
      currentMethod: '현재 사용 중인 학부모 소통 방식',
      preferredTime: '상담 및 구축 희망 시간',
      submitBtn: '맞춤 학원 구축 신청하기',
      submitting: '신청서 제출 중...',
      successTitle: '구축 신청이 완료되었습니다! 🎉',
      successMessage: '감사합니다! 학원 파라미터가 정상 접수되었습니다. 담당 오퍼레이션 팀이 2시간 이내에 연락드려 맞춤 구축 일정을 안내해드립니다.',
      modalTitle: '맞춤 학원 구축 & 온보딩 신청',
      modalSubtitle: '우리 학원 전용 Fillout, Make.com, Softr 학부모 리포트 자동화 파이프라인을 구축하세요.'
    }
  }
};
