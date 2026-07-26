export interface SampleReport {
  id: string;
  studentNameEn: string;
  studentNameKo: string;
  grade: string;
  gradeKo: string;
  subject: string;
  teacherName: string;
  rawInput: string;
  flaggedIssue?: string;
  translatedSummaryKo: string;
  parentScriptKo: {
    greeting: string;
    academicProgress: string;
    behaviorAndAttitude: string;
    actionItems: string;
    closing: string;
  };
}

export const SAMPLE_REPORTS: SampleReport[] = [
  {
    id: 'sample-1',
    studentNameEn: 'Minjun Kim',
    studentNameKo: '김민준',
    grade: 'Elementary 4th Grade',
    gradeKo: '초등 4학년',
    subject: 'Phonics & Reading Comprehension',
    teacherName: 'Teacher Sarah',
    rawInput: 'Minjun scored 95/100 on the Unit 4 vocabulary quiz. His oral reading fluency has improved significantly. However, he forgot his homework workbook twice this week and seemed distracted during group presentation practice on Thursday.',
    flaggedIssue: 'Missing Homework (2x) & Presentation Distraction',
    translatedSummaryKo: '민준이는 4단원 어휘 평가에서 95점을 기록하며 뛰어난 성적을 거두었습니다. 낭독(Oral Reading) 유창성이 크게 향상되었으나, 이번 주 숙제 교재를 2회 지참하지 않았으며 목요일 그룹 발표 연습 시 다소 집중력이 저하된 모습이 관찰되었습니다.',
    parentScriptKo: {
      greeting: '어머니 안녕하세요, 청담 이스트 어학원 민준이 담당 교사 및 원장실입니다. 평소 민준이의 영어 학습에 관심 가져주셔서 감사드립니다.',
      academicProgress: '이번 4단원 어휘 테스트에서 95점이라는 우수한 성적을 받았습니다. 특히 단어를 정확한 발음과 억양으로 읽어내는 유창성이 지난달 대비 현저히 좋아졌습니다.',
      behaviorAndAttitude: '다만 이번 주에는 숙제 워크북을 두 차례 가져오지 않아 수업 진행에 약간의 아쉬움이 있었습니다. 목요일 조별 발표 준비 때 집중이 흔들리는 모습이 있어 다독여 주었습니다.',
      actionItems: '가정에서도 등원 전 가방에 워크북이 지참되었는지 1분만 함께 점검해 주시면 감사하겠습니다. 읽기 실력이 크게 늘고 있는 시기인 만큼 가정에서의 작은 관심이 큰 결실로 이어질 것입니다.',
      closing: '추가로 궁금하신 점이나 가정에서 지도 힘드신 부분 있으시면 언제든 말씀해 주세요. 감사합니다.'
    }
  },
  {
    id: 'sample-2',
    studentNameEn: 'Yuna Park',
    studentNameKo: '박유나',
    grade: 'Middle School 1st Grade',
    gradeKo: '중등 1학년',
    subject: 'TOEFL Speaking & Essay Writing',
    teacherName: 'Teacher Alex',
    rawInput: 'Yuna wrote a very well-structured 3-paragraph argument on environmental policy. Great use of transition words. In Speaking class, she is still hesitant to volunteer answers unless directly called upon.',
    flaggedIssue: 'Speaking Class Volunteering Hesitancy',
    translatedSummaryKo: '유나는 환경 정책을 주제로 한 3단락 논설문 작성에서 뛰어난 논리 구조와 접속어 활용 능력을 보여주었습니다. 스피킹 수업에서는 지목받기 전 먼저 발표를 시도하는 자신감이 다소 부족한 상태입니다.',
    parentScriptKo: {
      greeting: '어머니 안녕하세요, 유나 원어민 에세이 및 스피킹 담당 교사입니다.',
      academicProgress: '유나가 이번 주 작성한 환경 주제 논설문 에세이는 문단 구성과 어휘 연결이 매우 매끄럽고 훌륭했습니다. 문법적 정확도 또한 상위권 수준을 유지하고 있습니다.',
      behaviorAndAttitude: '영어 표현력이 매우 뛰어남에도 불구하고, 스피킹 토론 시간에는 완벽하게 답변하려는 부담감 때문인지 먼저 손을 들고 발표하는 데 약간 머뭇거리는 경향이 있습니다.',
      actionItems: '유나의 영작 실력과 논리력이 훌륭하므로 틀려도 괜찮다는 자존감을 높여주고 있습니다. 가정에서도 칭찬과 함께 자신 있게 말하도록 격려해 주시면 감사하겠습니다.',
      closing: '유나가 더욱 자신감을 갖고 수업을 주도할 수 있도록 지속적으로 가이드 하겠습니다. 좋은 하루 되세요.'
    }
  },
  {
    id: 'sample-3',
    studentNameEn: 'Jiho Lee',
    studentNameKo: '이지호',
    grade: 'Elementary 6th Grade',
    gradeKo: '초등 6학년',
    subject: 'Intensive Grammar & Novel Reading',
    teacherName: 'Teacher Michael',
    rawInput: 'Jiho was late by 15 minutes on Tuesday. He completed all classwork, but missed the warm-up discussion. His reading comprehension score was 88%. Needs to focus on main idea identification.',
    flaggedIssue: 'Tardiness (15 mins) & Main Idea Analysis',
    translatedSummaryKo: '지호는 화요일 수업에 15분 지각하여 도입부 토의에 참여하지 못했습니다. 수업 과제는 모두 완수하였으나 리딩 독해 점수는 88점으로, 글의 주제문(Main Idea) 파악 연습이 추가로 필요합니다.',
    parentScriptKo: {
      greeting: '어머니 안녕하세요, 지호 원어민 소설 및 문법반 상담 전화드립니다.',
      academicProgress: '지호는 이번 주 원서 읽기 평가에서 88점을 기록했습니다. 세부 내용을 기억하는 능력은 좋으나, 전체 글의 핵심 주제(Main Idea)를 요약하는 연습을 강화하고 있습니다.',
      behaviorAndAttitude: '화요일에 15분가량 지각이 발생하여 앞부분 핵심 토의를 놓쳤습니다. 지호가 당황하지 않도록 쉬는 시간에 보충 설명을 전달하였습니다.',
      actionItems: '수업 첫 10분 동안 주요 어휘와 핵심 질문이 다뤄지므로 정시 입실할 수 있도록 가정에서도 시계 확인을 부탁드립니다.',
      closing: '지호가 6학년 상위권 과정에 잘 적응하고 있으니 꾸준히 응원하겠습니다. 감사합니다.'
    }
  }
];
