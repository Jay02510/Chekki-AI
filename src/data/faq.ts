// Plain data (no React) so vite.config.ts can also read it to prerender
// /faq for non-JS crawlers.
export interface FaqItem {
  id: string;
  category: 'parent' | 'teacher';
  questionKo: string;
  questionEn: string;
  answerKo: string;
  answerEn: string;
  tagKo: string;
  tagEn: string;
}

export const FAQ_DATA: FaqItem[] = [
  // --- PARENT FAQS ---
  {
    id: 'p1',
    category: 'parent',
    tagKo: '엄마표 영어',
    tagEn: "Mom's English",
    questionKo: '영어 발음이나 문법에 자신 없는 엄마도 아이 숙제를 도울 수 있나요?',
    questionEn: 'Can moms who lack confidence in English pronunciation help with homework?',
    answerKo: '네, 완벽히 가능합니다! 채키 AI는 엄마가 영어 선생님 역할을 직접 맡을 필요가 없도록 설계되었습니다. 숙제 사진을 찍으면 몇 초 안에 AI가 채점하고, 엄마가 아이에게 들려줄 한국어 칭찬 가이드("엄마, 이렇게 알려주세요")와 정확한 원어민 음성을 제공합니다.',
    answerEn: 'Yes, absolutely! Chekki AI eliminates the pressure for moms to act as English teachers. Simply snap a photo, and Chekki grades it in seconds, with warm Korean coaching tips, and native pronunciation audio.'
  },
  {
    id: 'p2',
    category: 'parent',
    tagKo: '2차 재도전 스캔',
    tagEn: '2nd Rescan Loop',
    questionKo: '아이 답안을 스캔한 후 틀린 문제가 나오면 어떻게 재도전하나요?',
    questionEn: 'How does the 2nd attempt rescan work when a child gets wrong answers?',
    answerKo: '채키의 "⚡ 2차 재도전 스캔"을 활용해보세요! 첫 채점 후 오답이 나오면 채키가 엄마에게 칭찬 가이드를 전달합니다. 아이가 종이에 직접 정답을 고쳐 쓴 뒤 "2차 재도전 스캔"을 올리면, 100% 완벽 마스터로 즉시 업데이트되어 눈물이나 실랑이 없이 성취감을 얻을 수 있습니다.',
    answerEn: 'Use Chekki\'s "⚡ 2nd Rescan Loop"! When errors are detected, Mom shares a warm 5-second coaching tip. The child fixes the paper response, rescans, and instantly updates their grade to 100% Mastered without arguments.'
  },
  {
    id: 'p3',
    category: 'parent',
    tagKo: '사용 편의성',
    tagEn: 'Ease of Use',
    questionKo: '앱 사용 시 긴 프롬프트를 입력하거나 타이핑해야 하나요?',
    questionEn: 'Do I need to type long prompts or instructions to use the app?',
    answerKo: '아닙니다. 채키는 100% 무(無)프롬프트 방식입니다. 바쁜 엄마들을 위해 복잡한 키보드 입력이나 프롬프트 지시어 없이 오직 카메라 스캔 1회만으로 모든 채점과 코칭 가이드가 자동 완성됩니다.',
    answerEn: 'No! Chekki is 100% prompt-less. Designed for busy moms, zero typing or complex prompts are required. A single camera scan handles all grading and coaching guides automatically.'
  },
  {
    id: 'p4',
    category: 'parent',
    tagKo: '학원 교재 연동',
    tagEn: 'Academy Key Sync',
    questionKo: '영유/어학원 교재 정답지와 AI 채점 결과가 일치하나요?',
    questionEn: 'Does Chekki sync with English Kindergarten & Academy textbook answer keys?',
    answerKo: '학원 초대로 연결하면, 선생님이 올린 이번 주 단어·파닉스·지문·정답지를 기준으로 채점합니다. 정답지에 있는 문항은 그 정답을 그대로 기준으로 삼고, 정답지에 없는 문항만 AI가 직접 판단합니다.',
    answerEn: "Once your academy invites you, Chekki grades against the words, phonics, passage and answer key your teacher uploaded for this week. Questions covered by the key use the teacher's answer; only questions outside it are judged by the AI."
  },
  {
    id: 'p5',
    category: 'parent',
    tagKo: '가격 및 무료체험',
    tagEn: 'Pricing & Trial',
    questionKo: '학부모용 Chekki 모바일 앱 이용 가격은 어떻게 되나요?',
    questionEn: 'How much does the Chekki Parent Mobile App cost?',
    answerKo: '기본 무료 스캔이 제공되며, 신용카드 등록 없이 언제든지 시작하실 수 있습니다. 연동 학원에 재원 중인 원생은 학원 플랜을 통해 100% 무제한 무료로 모든 기능을 이용하실 수 있습니다.',
    answerEn: 'Chekki offers free daily scans with no credit card required. Students enrolled in partner academies get 100% unlimited free access through their academy subscription.'
  },

  // --- TEACHER FAQS ---
  {
    id: 't1',
    category: 'teacher',
    tagKo: '다중 페이지 AI 스캔',
    tagEn: 'Multi-Page AI Scan',
    questionKo: '매주 학급 주간 단어와 정답지를 일일이 타이핑해야 하나요?',
    questionEn: 'Do teachers have to manually type weekly vocabulary words and answer keys?',
    answerKo: '아닙니다. 교재 사진이나 PDF를 한 번에 최대 5장까지 올리면 AI가 단어, 파닉스 패턴, 읽기 지문, 정답을 추출해 대시보드에 채워 넣습니다. 추출된 항목은 칩을 눌러 바로 추가/삭제할 수 있어 확인 후 저장만 하시면 됩니다.',
    answerEn: 'No. Drop up to 5 textbook photos or PDF pages at once and AI extracts target words, phonics rules, reading passages and answers into your dashboard. Review the chips, add or remove items, and save.'
  },
  {
    id: 't2',
    category: 'teacher',
    tagKo: '초대 링크 연동',
    tagEn: 'Invite-Link Sync',
    questionKo: '가정에서 학부모가 스캔한 오답 데이터는 어떻게 선생님께 전송되나요?',
    questionEn: 'How do parent homework scans sync to the Teacher Dashboard?',
    answerKo: '학부모님이 학원에서 받은 개별 초대로 Chekki 앱에 연결하면, 집에서 스캔한 숙제의 오답과 점수가 교사 대시보드의 원생별 활동에 자동으로 쌓입니다.',
    answerEn: "Parents connect through the personal invite their academy sends. From then on, mistakes and scores from homework they scan at home appear automatically in each student's activity on your dashboard."
  },
  {
    id: 't3',
    category: 'teacher',
    tagKo: '오답 맞춤 프린트',
    tagEn: 'Printable Review',
    questionKo: '오답 맞춤 복습 프린트 및 학원 성적표는 어떻게 인쇄하나요?',
    questionEn: 'How do I generate printable review sheets and academy branded report cards?',
    answerKo: '원생 상세 화면에서 학부모용 리포트 카드를 바로 인쇄할 수 있습니다(등록하신 학원 로고가 함께 표시됩니다). 틀린 문제 복습 학습지는 학부모 앱의 오답 노트에서 아이가 실제로 틀린 문제로 만들 수 있습니다.',
    answerEn: "Print a parent report card from any student's detail view (with your academy logo, if you've added one). Review worksheets are made in the parent app's mistake notebook from the questions each child actually missed."
  },
  {
    id: 't4',
    category: 'teacher',
    tagKo: '7일 무료 체험',
    tagEn: '7-Day Free Trial',
    questionKo: '학원용 7일 무료 체험 신청 조건 및 승인 절차는 어떻게 되나요?',
    questionEn: 'What is required for the 7-Day Academy Free Trial?',
    answerKo: '학원명과 원장님 이메일로 가입하시면 7일 체험이 바로 시작됩니다. 신용카드나 사업자번호는 필요 없습니다.',
    answerEn: 'Sign up with your academy name and email and the 7-day trial starts right away. No credit card or business registration needed.'
  },
  {
    id: 't5',
    category: 'teacher',
    tagKo: '채점 정확도',
    tagEn: 'Grading Accuracy',
    questionKo: 'AI가 아이 손글씨를 잘못 채점할 수도 있나요?',
    questionEn: 'Can the AI misgrade a child\'s handwriting?',
    answerKo: '가능성은 있습니다. 그래서 선생님이 그 주 정답지를 올리면 채점 시 그 정답을 먼저 기준으로 대조합니다. 정답지에 있는 문항은 AI가 정답을 추측하지 않고, 정답지에 없는 문항만 AI가 판단합니다. 손글씨가 많이 흐리면 읽기 오류가 생길 수 있으니, 정답지를 올릴수록 정확해집니다.',
    answerEn: 'It can happen, which is why answer keys matter. When a teacher uploads the week\'s key, grading checks against it first: questions on the key use the teacher\'s answer instead of an AI guess, and only questions outside it are judged by the AI. Very messy handwriting can still be misread.'
  },
  {
    id: 't6',
    category: 'teacher',
    tagKo: '페이지별 항목 선택',
    tagEn: 'Page-by-Page Picker',
    questionKo: '단원 전체 교재 페이지를 스캔한 후 원하는 항목만 골라서 커리큘럼에 넣을 수 있나요?',
    questionEn: 'Can I scan a multi-page textbook unit and selectively pick items for each category?',
    answerKo: '네, 가능합니다! 다중 스캔 후 제공되는 "🎯 Pick & Choose 서랍"에서 1페이지, 2페이지 등 페이지별 탭을 오가며 파닉스 규칙, 단어, 본문 지문을 선택적으로 체크하여 학급 주간 커리큘럼에 바로 반영할 수 있습니다.',
    answerEn: 'Yes! After scanning multiple pages, Chekki provides a "🎯 Pick & Choose Drawer". Easily toggle between Page 1, Page 2, etc., and selectively pick vocabulary, phonics rules, and reading passages into your weekly curriculum.'
  }
];
