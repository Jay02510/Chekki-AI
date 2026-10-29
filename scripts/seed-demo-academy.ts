// Seeds (or reseeds) a demo academy for sales demos and screenshots: two
// classes on Chekki English 1, a fortnight of KT-sent reports, this week's
// homework scans, and one log waiting for KT review today. Dates are relative
// to the day it runs, so rerun it before each demo.
//
// Each run first clears the demo school's classes (with their logs, reports
// and scans), curriculums, pending invites and seeded parent docs, and
// touches nothing outside that school. Run it Tuesday to Friday: "this week"
// scans use this week's earlier weekdays.
//
//   DEMO_DIRECTOR_EMAIL=… DEMO_FT_EMAIL=… DEMO_KT_EMAIL=… DEMO_PASSWORD=… \
//     npx tsx scripts/seed-demo-academy.ts
//
// Staff emails and the password come from the environment so they never land
// in this public repo. FIREBASE_SERVICE_ACCOUNT comes from .env (production).
import { cert, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

try {
  process.loadEnvFile('.env');
} catch {
  // already in the environment
}
const env = (k: string) => {
  const v = process.env[k];
  if (!v) throw new Error(`${k} missing`);
  return v;
};
initializeApp({ credential: cert(JSON.parse(env('FIREBASE_SERVICE_ACCOUNT'))) });
const auth = getAuth();
const db = getFirestore();

const SCHOOL_NAME = '채키 데모 어학원';

// --- dates (KST) ---
const kst = (d: Date) => new Date(d.getTime() + 9 * 3600_000).toISOString().slice(0, 10);
const today = kst(new Date());
const atKst = (date: string, hhmm: string) => new Date(`${date}T${hhmm}:00+09:00`);
const weekdaysBack = (n: number) => {
  const out: string[] = [];
  for (let i = 1; out.length < n; i++) {
    const d = new Date(Date.now() - i * 86400_000);
    const day = new Date(`${kst(d)}T12:00:00+09:00`).getUTCDay();
    if (day !== 0 && day !== 6) out.unshift(kst(d));
  }
  return out;
};
const mondayOf = (date: string) => {
  const d = new Date(`${date}T12:00:00+09:00`);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return kst(d);
};
const thisMonday = mondayOf(today);
// Korean terms start in March and September.
const termStart = (() => {
  const y = Number(today.slice(0, 4));
  const m = Number(today.slice(5, 7));
  return mondayOf(m >= 9 ? `${y}-09-01` : m >= 3 ? `${y}-03-02` : `${y - 1}-09-01`);
})();
const weekNo = (date: string) => Math.floor((Date.parse(mondayOf(date)) - Date.parse(termStart)) / (7 * 86400_000)) + 1;
const currentWeek = weekNo(today);

// --- content: Chekki English 1, units 3-5 ---
type Lesson = { topic: string; en: string; ko: string; enSummary: string };
type Unit = {
  title: string;
  vocab: string[];
  key: { questionText: string; answer: string }[];
  lessons: Lesson[];
  praise: { en: string; ko: string }[];
  attention: { en: string; ko: string }[];
  mistakes: { q: string; answer: string; wrong: string; guide: string; script: string }[];
};
const UNITS: Record<number, Unit> = {
  3: {
    title: 'Unit 3: Mia is running',
    vocab: ['running', 'eating', 'jumping', 'reading', 'sleeping', 'drawing'],
    key: [
      { questionText: '1. Mia is ______. (run)', answer: 'running' },
      { questionText: '2. Mia is ______. (eat)', answer: 'eating' },
      { questionText: '3. Mia is ______. (jump)', answer: 'jumping' },
      { questionText: '4. Ben is ______. (read)', answer: 'reading' },
      { questionText: '5. Ben is ______. (sleep)', answer: 'sleeping' },
    ],
    lessons: [
      { topic: 'Unit 3: running, jumping, eating', en: 'Action words with a Simon Says game. Kids acted out running, jumping and eating, then read "Mia is running." in pairs.', ko: '오늘은 Simon Says 게임으로 running, jumping, eating 같은 동작 단어를 몸으로 익혔어요. 이어서 짝과 함께 "Mia is running." 문장을 읽었어요.', enSummary: 'Today we learned action words running, jumping and eating through Simon Says, then read "Mia is running." in pairs.' },
      { topic: 'Unit 3: reading, sleeping, drawing', en: 'New actions: reading, sleeping, drawing. Picture cards plus a mime guessing game. Most kids read all three sentences on their own.', ko: '오늘은 reading, sleeping, drawing 세 동작을 그림 카드와 몸짓 맞히기 게임으로 배웠어요. 대부분의 친구들이 세 문장을 혼자 읽었어요.', enSummary: 'Today we learned reading, sleeping and drawing with picture cards and a guessing game. Most children read all three sentences by themselves.' },
      { topic: 'Unit 3: review and writing', en: 'Reviewed all six action words, then wrote the -ing words in the workbook. Some kids still drop the double letter in running.', ko: '오늘은 동작 단어 여섯 개를 복습하고 워크북에 -ing 단어를 직접 써 봤어요. running의 n을 두 번 쓰는 걸 헷갈리는 친구들이 있어서 다음 시간에 한 번 더 볼게요.', enSummary: 'Today we reviewed the six action words and wrote the -ing words in the workbook. A few children still miss the double n in running.' },
    ],
    praise: [
      { en: 'Read every sentence aloud with clear sounds and helped a friend with "sleeping".', ko: '{name} 학생은 모든 문장을 또박또박 소리 내어 읽었고, 친구에게 sleeping 읽는 법을 알려 주었어요.' },
      { en: 'Volunteered first in Simon Says and used full sentences.', ko: '{name} 학생은 Simon Says 게임에서 먼저 손을 들고 완전한 문장으로 말했어요.' },
    ],
    attention: [
      { en: 'Mixed up jumping and running. Please say the action words together at home.', ko: '{name} 학생은 jumping과 running을 가끔 헷갈렸어요. 집에서 동작을 하며 단어를 함께 말해 주세요.' },
    ],
    mistakes: [
      { q: '1. Mia is ______. (run)', answer: 'running', wrong: 'runing', guide: "정답은 'running'이에요. run에 -ing를 붙일 때는 n을 한 번 더 써요. 아이가 'runing'으로 썼어요.", script: "run에 ing를 붙이면 n이 하나 더 생겨. r-u-n-n-i-n-g, 같이 써 볼까?" },
      { q: '5. Ben is ______. (sleep)', answer: 'sleeping', wrong: 'sleping', guide: "정답은 'sleeping'이에요. ee 두 글자를 써야 해요.", script: "자는 건 sleep, e가 두 개야. 소리 내면서 s-l-e-e-p-i-n-g 써 보자." },
    ],
  },
  4: {
    title: 'Unit 4: The ball is on the table',
    vocab: ['on', 'under', 'in', 'next to', 'table', 'box'],
    key: [
      { questionText: '1. The ball is ______ the table.', answer: 'on' },
      { questionText: '2. The ball is ______ the table.', answer: 'under' },
      { questionText: '3. The ball is ______ the table.', answer: 'next to' },
      { questionText: '4. The ball is ______ the box.', answer: 'in' },
      { questionText: '5. The ball is ______ the chair.', answer: 'under' },
      { questionText: '6. The ball is ______ the bed.', answer: 'on' },
    ],
    lessons: [
      { topic: 'Unit 4: on, under', en: 'Position words on and under with a real ball and the classroom table. Kids placed the ball and said the sentence.', ko: '오늘은 공과 교실 책상으로 on과 under를 배웠어요. 아이들이 직접 공을 놓고 "The ball is on the table." 문장을 말해 봤어요.', enSummary: 'Today we learned on and under with a ball and the classroom table. Children placed the ball and said the sentence.' },
      { topic: 'Unit 4: in, next to', en: 'Added in and next to. Hide-the-cat game with a box. Next to was the hardest; we will review it.', ko: '오늘은 in과 next to를 배웠어요. 상자에 고양이 인형을 숨기는 게임을 했어요. next to를 가장 어려워해서 다음 시간에 한 번 더 복습할게요.', enSummary: 'Today we added in and next to with a hide-the-cat game. Next to was the hardest, so we will review it.' },
      { topic: 'Unit 4: review and reading', en: 'Read the Unit 4 story together and circled the right sentence for each picture. Good focus today.', ko: '오늘은 4단원 이야기를 함께 읽고, 그림에 맞는 문장을 고르는 활동을 했어요. 모두 집중을 잘했어요.', enSummary: 'Today we read the Unit 4 story together and chose the right sentence for each picture. Everyone focused well.' },
    ],
    praise: [
      { en: 'Got every position word right in the hide-the-cat game.', ko: '{name} 학생은 고양이 숨기기 게임에서 위치 단어를 모두 정확하게 말했어요.' },
      { en: 'Read the Unit 4 story to the class with a big voice.', ko: '{name} 학생은 4단원 이야기를 큰 목소리로 친구들에게 읽어 주었어요.' },
    ],
    attention: [
      { en: 'Still mixes up in and on. Please practice with a cup and a toy at home.', ko: '{name} 학생은 in과 on을 아직 헷갈려요. 집에서 컵과 장난감으로 "in the cup, on the cup" 놀이를 해 주세요.' },
      { en: 'Quiet today and a little tired. Joined in by the end.', ko: '{name} 학생은 오늘 조금 피곤해 보였지만 수업 끝에는 활동에 잘 참여했어요.' },
    ],
    mistakes: [
      { q: '3. The ball is ______ the table.', answer: 'next to', wrong: 'nex to', guide: "정답은 'next to'(옆에)예요. next 끝의 t가 빠졌어요.", script: "옆에 있을 때는 next to라고 해. next 끝에 t가 있지? n-e-x-t, 같이 써 볼까?" },
      { q: '4. The ball is ______ the box.', answer: 'in', wrong: 'on', guide: "그림에서 공은 상자 안에 있어서 정답은 'in'이에요. 아이가 위를 뜻하는 'on'을 썼어요.", script: "공이 상자 위에 있어, 안에 있어? 안에 있으면 in이야. 손으로 상자 안을 가리켜 볼까?" },
      { q: '2. The ball is ______ the table.', answer: 'under', wrong: 'undr', guide: "정답은 'under'(아래에)예요. e가 빠졌어요.", script: "책상 아래는 under야. u-n-d-e-r, 마지막에 e-r 소리를 같이 내 보자." },
    ],
  },
  5: {
    title: 'Unit 5: Mia has a ball',
    vocab: ['has', 'ball', 'apple', 'cup', 'egg', 'he', 'she'],
    key: [
      { questionText: '1. Mia has a ______.', answer: 'ball' },
      { questionText: '2. Ben has an ______.', answer: 'apple' },
      { questionText: '3. Mia has a ______.', answer: 'cup' },
      { questionText: '4. Ben ______ a cup.', answer: 'has' },
      { questionText: '5. ______ has a red cup. (Mia)', answer: 'She' },
    ],
    lessons: [
      { topic: 'Unit 5: Mia has a ball', en: 'New pattern "___ has a ___." with a show-and-tell bag. Each child pulled out an object and made a sentence.', ko: '오늘은 "___ has a ___." 문장을 배웠어요. 가방에서 물건을 하나씩 꺼내며 "Mia has a ball." 처럼 문장을 만들어 봤어요.', enSummary: 'Today we learned "___ has a ___." Each child pulled an object from a bag and made a sentence.' },
      { topic: 'Unit 5: a or an, he and she', en: 'a vs an (an apple, an egg) and he/she. Sorting game with picture cards. Most kids chose an correctly by the end.', ko: '오늘은 a와 an(an apple, an egg), 그리고 he와 she를 배웠어요. 그림 카드 분류 게임을 했고, 끝날 때는 대부분 an을 바르게 골랐어요.', enSummary: 'Today we practised a vs an and he/she with a picture-card sorting game. By the end most children chose an correctly.' },
    ],
    praise: [
      { en: 'Made five "has" sentences on their own and helped a friend with "an apple".', ko: '{name} 학생은 has 문장을 혼자서 다섯 개나 만들고, 친구에게 an apple을 알려 주었어요.' },
    ],
    attention: [
      { en: 'Writes "a apple". Please read "an apple, an egg" together at home.', ko: '{name} 학생은 "a apple"이라고 쓰는 경우가 있어요. 집에서 "an apple, an egg"를 함께 읽어 주세요.' },
    ],
    mistakes: [
      { q: '2. Ben has an ______.', answer: 'apple', wrong: 'aple', guide: "정답은 'apple'이에요. p를 두 번 써야 해요.", script: "사과는 apple, p가 두 개야. a-p-p-l-e 같이 써 볼까?" },
      { q: '5. ______ has a red cup. (Mia)', answer: 'She', wrong: 'He', guide: "Mia는 여자아이라서 'She'가 정답이에요. 아이가 'He'를 썼어요.", script: "Mia는 여자 친구지? 여자 친구는 she, 남자 친구는 he야." },
    ],
  },
};

// unit by week: each class moves a unit per week, ending on its current unit
const CLASSES = [
  {
    id: 'demo_sunny',
    name: 'Sunny반',
    level: '7-year-old',
    unitNow: 4,
    joined: ['Lucy (김서연)', 'Daniel (이준호)', 'Emma (박지우)', 'Leo (최민준)', 'Chloe (정하은)', 'Ryan (강도윤)'],
    invited: ['Mia (윤서아)'],
    rosterOnly: ['Noah (한시우)'],
  },
  {
    id: 'demo_ocean',
    name: 'Ocean반',
    level: 'Elementary Grade 1',
    unitNow: 5,
    joined: ['Olivia (조예린)', 'Jake (임지호)', 'Sophie (오다인)', 'Ethan (서준우)'],
    invited: ['Ella (신하린)'],
    rosterOnly: ['Max (권태윤)'],
  },
];
const unitFor = (cls: (typeof CLASSES)[number], date: string) => UNITS[Math.max(cls.unitNow - 1, cls.unitNow - (currentWeek - weekNo(date)))];

let seq = 0;
const pick = <T>(arr: T[], i: number) => arr[i % arr.length];

async function ensureStaff(email: string, name: string) {
  const user = await auth.getUserByEmail(email).catch(() => null);
  if (user) {
    await auth.updateUser(user.uid, { password: env('DEMO_PASSWORD'), displayName: name, emailVerified: true });
    return user.uid;
  }
  return (await auth.createUser({ email, password: env('DEMO_PASSWORD'), displayName: name, emailVerified: true })).uid;
}

async function reset(schoolId: string) {
  const classes = await db.collection('classes').where('schoolId', '==', schoolId).get();
  for (const c of classes.docs) {
    const cur = await db.collection('curriculums').where('classId', '==', c.id).get();
    await Promise.all(cur.docs.map((d) => d.ref.delete()));
    await db.recursiveDelete(c.ref);
  }
  const pending = await db.collection('pendingStudents').where('schoolId', '==', schoolId).get();
  await Promise.all(pending.docs.map((d) => d.ref.delete()));
  const parents = await db.collection('users').where('schoolId', '==', schoolId).get();
  await Promise.all(parents.docs.filter((d) => d.id.startsWith('demo_parent_')).map((d) => d.ref.delete()));
  console.log(`reset: ${classes.size} classes, ${pending.size} invites`);
}

async function main() {
  const directorUid = await ensureStaff(env('DEMO_DIRECTOR_EMAIL'), '김지원 원장');
  const ftUid = await ensureStaff(env('DEMO_FT_EMAIL'), 'Sarah Miller');
  const ktUid = await ensureStaff(env('DEMO_KT_EMAIL'), '이수진 선생님');
  const schoolId = `school_${directorUid}`;
  await reset(schoolId);

  const staffBase = { scansUsedToday: 0, questionsUsedToday: 0, schoolId, schoolName: SCHOOL_NAME };
  await db.doc(`users/${directorUid}`).set({ ...staffBase, uid: directorUid, name: '김지원 원장', email: env('DEMO_DIRECTOR_EMAIL'), role: 'director', plan: 'free', maxScansPerDay: 3 }, { merge: true });
  for (const [uid, name, email, educatorRole] of [
    [ftUid, 'Sarah Miller', env('DEMO_FT_EMAIL'), 'ft'],
    [ktUid, '이수진 선생님', env('DEMO_KT_EMAIL'), 'kt'],
  ]) {
    await db.doc(`users/${uid}`).set({ ...staffBase, uid, name, email, role: 'teacher', educatorRole, plan: 'pro', subscriptionPlatform: 'teacher_invite', maxScansPerDay: 9999, maxQuestionsPerDay: 9999 }, { merge: true });
  }
  for (const [uid, role] of [[directorUid, 'director'], [ftUid, 'teacher'], [ktUid, 'teacher']]) {
    await auth.setCustomUserClaims(uid, { role, schoolId });
  }
  await db.doc(`schools/${schoolId}`).set(
    { name: SCHOOL_NAME, ownerUid: directorUid, usedByUids: [ftUid, ktUid], seatsTotal: { ft: 2, kt: 1 }, planId: 'starter', createdAt: atKst(termStart, '10:00').toISOString() },
    { merge: true }
  );

  const days = weekdaysBack(10);
  for (const cls of CLASSES) {
    const classRef = db.doc(`classes/${cls.id}`);
    await classRef.set({
      id: cls.id, schoolId, schoolName: SCHOOL_NAME, name: cls.name, level: cls.level, teacherUid: directorUid,
      assignedTeacherUids: [directorUid, ftUid, ktUid], activeWeekNumber: currentWeek, createdAt: atKst(termStart, '10:00').toISOString(),
    });

    for (const w of [currentWeek - 1, currentWeek]) {
      const unit = UNITS[cls.unitNow - (currentWeek - w)];
      await db.doc(`curriculums/${cls.id}_week_${w}`).set({
        classId: cls.id, weekNumber: w, topic: unit.title, vocabWords: unit.vocab, answerKey: unit.key, passage: '', phonicsRules: [], other: '',
        teacherUid: ftUid, lastEditedByUid: ftUid, lastEditedByName: 'Sarah Miller', updatedAt: atKst(mondayOf(today), '09:00').toISOString(), lastEditedAt: atKst(mondayOf(today), '09:00').toISOString(),
      });
    }

    // students: joined parents get a users doc, the rest stay invites
    const students: { uid: string; name: string }[] = [];
    for (const [i, name] of cls.joined.entries()) {
      const uid = `demo_parent_${cls.id}_${i}`;
      const pendingRef = db.collection('pendingStudents').doc();
      await pendingRef.set({ classId: cls.id, schoolId, name, parentEmail: `parent.${cls.id}.${i}@example.com`, inviteCode: `DM${cls.id.slice(5, 7).toUpperCase()}${i}${i}`, status: 'redeemed', redeemedUid: uid, addedByUid: directorUid, addedAt: atKst(termStart, '11:00').toISOString(), redeemedAt: atKst(termStart, '20:00').toISOString() });
      await db.doc(`users/${uid}`).set({
        uid, name: `${name.split(' (')[0]} 어머님`, studentName: name, email: `parent.${cls.id}.${i}@example.com`, classId: cls.id, classStatus: 'active', schoolId, schoolName: SCHOOL_NAME,
        plan: 'pro', subscriptionPlatform: 'school_code', maxScansPerDay: 9999, maxQuestionsPerDay: 9999, pendingStudentId: pendingRef.id, createdAt: atKst(termStart, '20:00').toISOString(),
      });
      students.push({ uid, name });
    }
    const pendingIds: string[] = [];
    for (const [i, name] of [...cls.invited, ...cls.rosterOnly].entries()) {
      const ref = db.collection('pendingStudents').doc();
      const emailed = i < cls.invited.length;
      await ref.set({ classId: cls.id, schoolId, name, parentEmail: emailed ? `invite.${cls.id}.${i}@example.com` : '', inviteCode: `DQ${cls.id.slice(5, 7).toUpperCase()}${i}${i}`, status: 'invited', addedByUid: directorUid, addedAt: atKst(days[days.length - 2], '15:00').toISOString(), ...(emailed ? { emailSentAt: atKst(days[days.length - 2], '15:01').toISOString() } : {}) });
      pendingIds.push(`pending:${ref.id}`);
    }
    const enrolled = [...students.map((s) => s.uid), ...pendingIds];

    // a log per class day; today's Sunny log waits for KT review, Ocean has none yet
    const logDays = cls.id === 'demo_sunny' ? [...days, today] : days;
    for (const [d, date] of logDays.entries()) {
      const unit = unitFor(cls, date);
      const lesson = pick(unit.lessons, d);
      const praiseKid = pick(students, d);
      const attnKid = pick(students, d + 3);
      const exceptions = [
        { studentName: praiseKid.name, studentUid: praiseKid.uid, type: 'praise', details: pick(unit.praise, d).en, ko: pick(unit.praise, d).ko.replace('{name}', praiseKid.name) },
        ...(d % 2 ? [{ studentName: attnKid.name, studentUid: attnKid.uid, type: 'attention', details: pick(unit.attention, d).en, ko: pick(unit.attention, d).ko.replace('{name}', attnKid.name) }] : []),
      ];
      const isPending = date === today;
      const created = atKst(date, '16:40');
      const sent = atKst(date, '18:10');
      const logId = `demo_${date}`;
      await classRef.collection('logs').doc(logId).set({
        classId: cls.id, className: cls.name, date, lessonTopic: lesson.topic, textbook: 'Chekki English 1', energyLevel: 'High Energy and Engaged',
        activities: ['Reading', 'Speaking', 'Game'], generalComments: lesson.en, exceptions: exceptions.map(({ ko, ...e }) => e),
        enrolledStudentUids: enrolled, reviewedWords: d % 3 === 0 ? unit.mistakes.slice(0, 1).map((m) => m.answer) : [],
        teacherUid: ftUid, teacherName: 'Sarah Miller', authorRole: 'ft', createdAt: Timestamp.fromDate(created),
        aiKoreanSummary: lesson.ko, aiEnglishSummary: lesson.enSummary, aiSummaryFallback: false,
        aiStudentReports: exceptions.map((e) => ({ studentName: e.studentName, studentUid: e.studentUid, koreanUpdate: e.ko, phoneTalkingPoints: [], category: e.type, failed: false })),
        ...(isPending
          ? { reviewStatus: 'pending_review' }
          : {
              reviewStatus: 'sent', reviewedByUid: ktUid, reviewedByName: '이수진 선생님', sentAt: Timestamp.fromDate(sent),
              reviewedStudentUids: students.map((s) => s.uid), approvedSummary: lesson.ko,
              approvedExceptions: exceptions.map((e) => ({ studentName: e.studentName, studentUid: e.studentUid, approvedText: e.ko })),
            }),
      });
      if (isPending) continue;
      for (const s of students) {
        const note = exceptions.find((e) => e.studentUid === s.uid)?.ko;
        await classRef.collection('parentReports').doc(`${logId}_${s.uid}`).set({
          classId: cls.id, logId, studentUid: s.uid, className: cls.name, date, lessonTopic: lesson.topic,
          summary: lesson.ko, summaryEn: lesson.enSummary, ...(note ? { note } : {}), reviewedByName: '이수진 선생님', sentAt: Timestamp.fromDate(sent),
        });
      }
    }

    // homework scans: last week for everyone, this week for all but the last joined child
    for (const [i, s] of students.entries()) {
      for (const date of [days[Math.max(0, days.length - 6 - (i % 3))], ...(i < students.length - 1 ? [days[days.length - 1 - (i % 3)]] : [])]) {
        const unit = unitFor(cls, date);
        const misses = unit.mistakes.slice(0, (i + Number(date.slice(-1))) % 3);
        const total = unit.key.length;
        const scannedAt = atKst(date, `${19 + (i % 3)}:${String(10 + i * 7).padStart(2, '0')}`);
        const id = `scan_${scannedAt.getTime()}_${(seq++).toString(16).padStart(6, '0')}`;
        await classRef.collection('studentScans').doc(id).set({
          id, classId: cls.id, studentUid: s.uid, studentName: s.name, scannedAt: scannedAt.toISOString(),
          titleEn: `Chekki English 1 · ${unit.title}`, titleKo: `체키 영어 1 · ${unit.title.replace('Unit ', '').replace(':', '단원:')}`,
          totalItems: total, correctCount: total - misses.length, mistakeCount: misses.length, totalScore: Math.round(((total - misses.length) / total) * 100),
          hasHandwriting: true, isLegible: true,
          redBorderedMistakes: misses.map((m) => ({
            id: Number(m.q.split('.')[0]), type: 'Fill-in-the-blank', question_text: m.q, correct_answer: m.answer, student_response: m.wrong,
            korean_guide: m.guide, teaching_script_ko: m.script,
          })),
        });
      }
    }
    console.log(`${cls.name}: ${students.length} joined, ${pendingIds.length} invited, ${logDays.length} logs`);
  }
  console.log(`done: ${SCHOOL_NAME}, week ${currentWeek}, today ${today}`);
}

main().then(() => process.exit(0), (e) => {
  console.error(e);
  process.exit(1);
});
