import { PRICING_BILLING } from '../../api/_lib/pricingTiers';

// The six director questions on /schools, with the one-sentence answer each
// fold opens on. Shared by SchoolsLandingPage and the build-time prerender
// (vite.config.ts), which turns them into crawlable text and FAQPage JSON-LD.
const won = (n: number) => `₩${n.toLocaleString('ko-KR')}`;
const low = PRICING_BILLING.solo.monthly.krw;
const high = PRICING_BILLING.enterprise.monthly.krw;

export const SCHOOLS_QA: { qKo: string; qEn: string; aKo: string; aEn: string }[] = [
  {
    qKo: '채점이 정확한가요?',
    qEn: 'Can we trust the grading?',
    aKo: '선생님이 올린 이번 주 정답지로 먼저 채점해요. 정답지에 있는 문항은 AI가 답을 추측하지 않아요.',
    aEn: "Chekki grades against the answer key your teacher uploaded this week. For anything on the key, the AI doesn't guess the answer.",
  },
  {
    qKo: '원어민 선생님이 한국어를 써야 하나요?',
    qEn: 'Do foreign teachers have to write Korean?',
    aKo: '아니요. 원어민 선생님은 영어로 짧은 수업 기록만 남겨요. 말로 해도 돼요. AI가 한국어 리포트 초안을 쓰고, 한국인 선생님이 고쳐서 보내요.',
    aEn: 'No. Foreign teachers leave a short class note in English, typed or spoken. The AI drafts the Korean report, and a Korean teacher edits and sends it.',
  },
  {
    qKo: '집에서 한 숙제가 선생님께 보이나요?',
    qEn: 'Do teachers see homework done at home?',
    aKo: '네. 학부모님이 학원에서 받은 초대 링크로 연결하면, 집에서 찍은 숙제의 점수와 틀린 문제가 원생별로 선생님 화면에 쌓여요.',
    aEn: 'Yes. Once a parent joins with the invite link from your academy, scores and misses from homework scanned at home build up per student on the teacher’s screen.',
  },
  {
    qKo: '학부모님은 돈을 내나요?',
    qEn: 'Do parents pay anything?',
    aKo: '아니요. 학원에 연결된 학부모님은 채키 앱을 무료로 써요. 숙제를 찍으면 채점과 한국어 설명을 받고, 선생님이 보낸 수업 리포트도 앱에서 봐요.',
    aEn: 'No. Parents linked to your academy use the Chekki app for free. They scan homework to get it graded and explained in Korean, and read your class reports in the app.',
  },
  {
    qKo: '비용은 얼마인가요?',
    qEn: 'What does it cost?',
    aKo: `모든 학원은 7일 무료 체험으로 시작해요. 요금제는 월 ${won(low)}부터 ${won(high)}까지이고, 연 결제 시 약 20% 할인돼요.`,
    aEn: `Every academy starts with a 7-day free trial. Plans run from ${won(low)} to ${won(high)} a month, about 20% less when billed yearly.`,
  },
  {
    qKo: '어떻게 시작하나요?',
    qEn: 'How do we start?',
    aKo: '학원명과 원장님 이메일로 가입하면 7일 체험이 바로 시작돼요. 반을 만들고 선생님과 학부모님을 초대한 뒤, 이번 주 정답지를 올리면 돼요.',
    aEn: "Sign up with your academy name and email and the 7-day trial starts right away. Create classes, invite teachers and parents, then upload this week's answer key.",
  },
];
