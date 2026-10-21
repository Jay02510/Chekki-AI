import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Camera,
  CaretDown,
  ClockCounterClockwise,
  ChatCircleText,
  Check,
  DeviceMobile,
  InstagramLogo,
  List,
  Moon,
  Sun,
  TiktokLogo,
  X,
} from '@phosphor-icons/react';
import { copyToClipboard } from '../utils/clipboard';
import { langPath, switchLang, urlLang } from './lib/lang';
import { track } from './lib/track';
import { useWarmTheme } from './lib/theme';
import { FAQ_DATA } from './data/faq';
import { ScreenTour, type TourStep } from './components/ScreenTour';

const APP_DOWNLOAD_URL = 'https://urlgeni.us/chekki';

// SPA hop into the app (the landing bundle mounts <App /> on /app).
const goTo = (path: string) => (e: React.MouseEvent) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'instant' });
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

export default function Home() {
  const isKo = urlLang() === 'ko';
  const [isNight, toggleTheme] = useWarmTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const startScan = (where: string) => (e: React.MouseEvent) => {
    track('landing_start_scan', { where });
    goTo('/app')(e);
  };

  const directorMsg = isKo
    ? '안녕하세요 원장님! Chekki AI로 아이 숙제를 스캔해서 채점 결과를 바로 받아보고 있어요. Chekki School Pro를 도입하시면 선생님들 채점 시간이 크게 줄고, 저희 같은 학부모들은 전원 무료로 이용할 수 있대요. 한번 살펴봐 주시겠어요? https://www.chekkiai.com/schools'
    : "Hello Director! We've been using Chekki AI to scan and grade my child's homework — it's been great. Chekki School Pro brings this to your whole academy: teachers save hours on grading, and every parent gets it free. Worth a look: https://www.chekkiai.com/schools";

  const copyDirectorMsg = async () => {
    if (await copyToClipboard(directorMsg)) {
      track('landing_copy_director_msg');
      setInviteCopied(true);
      setTimeout(() => setInviteCopied(false), 2500);
    }
  };

  const steps = isKo
    ? [
        { t: '숙제 사진 찍기', d: '아이가 푼 영어 숙제를 그대로 찍어요. 글자를 칠 필요 없어요.', alt: '앱 화면: 찍은 학습지를 채키가 채점하고 있어요' },
        { t: '채점과 한국어 설명', d: '채키가 손글씨를 읽고 채점해요. 왜 그런지 한국어로 알려 줘요.', alt: '앱 화면: 학습지 사진 위에 틀린 칸의 정답 habitat이 표시돼요' },
        { t: '아이와 같이 보기', d: '맞은 건 먼저 칭찬하고, 틀린 문제는 하나씩 같이 봐요.', alt: '앱 화면: 틀린 문제와 아이에게 할 말을 한국어로 보여 줘요' },
      ]
    : [
        { t: 'Snap the homework', d: 'Take a photo of the page as it is. No typing.', alt: 'App screen: Chekki grading a photographed worksheet' },
        { t: 'Graded, explained in Korean', d: "Chekki reads your child's handwriting, grades it and explains why.", alt: 'App screen: the correct answer, habitat, marked on the worksheet photo' },
        { t: 'Look at it together', d: 'Praise the right answers first, then go through the misses one by one.', alt: 'App screen: a missed question with what to say to your child' },
      ];

  // Real app screens from a sample worksheet (440px-wide phone captures at 2x).
  // Pins are percentages of each image; re-place them when a screen changes.
  const pins = isKo
    ? [
        [
          { x: 88, y: 27, text: '채키가 아이 손글씨를 읽고 채점해요. 글자를 칠 필요 없어요.' },
          { x: 93, y: 77, text: '기다리는 동안 아이에게 해 줄 칭찬 한마디도 알려 줘요.' },
        ],
        [
          { x: 66, y: 35, text: '틀린 칸 위에 정답이 바로 떠요.' },
          { x: 66, y: 88, text: '정답을 가리면 아이가 다시 풀어 볼 수 있어요.' },
        ],
        [
          { x: 96, y: 20, text: "틀린 문제는 '같이 볼 문제'로 하나씩 봐요." },
          { x: 96, y: 75, text: '아이에게 할 말을 알려 줘요. 한국어와 영어로 바꿔 볼 수 있어요.' },
        ],
      ]
    : [
        [
          { x: 88, y: 25, text: "Chekki reads your child's handwriting and grades it. Nothing to type." },
          { x: 93, y: 77, text: 'Something kind to say while you wait.' },
        ],
        [
          { x: 66, y: 35, text: 'The right answer appears right on the missed blank.' },
          { x: 66, y: 88, text: 'Hide the answers so your child can try again.' },
        ],
        [
          { x: 96, y: 20, text: "Misses become 'look together' questions, one at a time." },
          { x: 96, y: 75, text: 'What to say to your child. Switch between Korean and English.' },
        ],
      ];
  const tourSteps: TourStep[] = steps.map((s, i) => ({
    title: s.t,
    sub: s.d,
    alt: s.alt,
    screen: { src: `/images/parent/step${i + 1}-${isKo ? 'ko' : 'en'}.webp`, w: 440, h: 600, pins: pins[i] },
  }));

  // The parent's problem in their words, then what Chekki does about it.
  // Replaced "why not a chatbot": its points live in these answers now.
  const pains = isKo
    ? [
        { Icon: Camera, pain: '영어를 잘 몰라서 맞게 했는지 모르겠어요', fix: '학습지를 찍기만 하면 채점하고 왜 틀렸는지 한국어로 알려 줘요. 질문을 쓸 필요도 없어요.' },
        { Icon: ChatCircleText, pain: '틀린 걸 말하다 보면 아이랑 싸우게 돼요', fix: '맞은 건 먼저 칭찬하고, 틀린 문제는 하나씩 같이 봐요. 아이에게 할 말도 한국어로 알려 줘요.' },
        { Icon: ClockCounterClockwise, pain: '어제 틀린 문제를 다시 찾을 수가 없어요', fix: '틀린 문제는 저절로 모이고, 지난 채점도 다시 열어 볼 수 있어요. 카드로 아이와 복습해요.' },
      ]
    : [
        { Icon: Camera, pain: "My English isn't good enough to check it", fix: 'Snap the page and Chekki grades it and explains each miss in Korean. Nothing to type.' },
        { Icon: ChatCircleText, pain: 'Pointing out mistakes turns into a fight', fix: 'Praise the right answers first, then go through misses one at a time, with what to say in Korean.' },
        { Icon: ClockCounterClockwise, pain: "I can't find yesterday's mistakes again", fix: 'Misses collect on their own and past scans reopen anytime. Review them with your child as cards.' },
      ];

  const faqs = FAQ_DATA.filter((f) => ['p1', 'p4', 'p5'].includes(f.id));

  const primaryBtn =
    'btn-press inline-flex min-h-14 items-center justify-center gap-2 rounded-md bg-line px-7 text-[17px] font-extrabold text-[#2b211a]';
  const iconBtn =
    'flex h-11 w-11 items-center justify-center rounded-md text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3';

  return (
    <main className="font-warm min-h-dvh w-full overflow-x-clip bg-ground text-ink break-keep">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-line focus:px-4 focus:py-2 focus:font-bold focus:text-[#2b211a]"
      >
        {isKo ? '본문으로 건너뛰기' : 'Skip to content'}
      </a>

      {/* App bar: theme and language toggles stay visible on every width */}
      <header className="sticky top-0 z-50 border-b border-rule bg-ground/95">
        <div className="mx-auto flex h-16 max-w-5xl items-center gap-2 px-4">
          <a href={langPath('/')} className="mr-auto text-[19px] font-extrabold tracking-[-0.02em] text-ink">
            Chekki<span className="text-line">AI</span>
          </a>
          <nav className="hidden items-center gap-5 pr-2 text-[15px] font-semibold text-ink-2 md:flex">
            <a href={langPath('/schools')} className="hover:text-ink">
              {isKo ? '학원·교사' : 'For schools'}
            </a>
            <a href={langPath('/faq')} className="hover:text-ink">
              FAQ
            </a>
          </nav>
          <button
            type="button"
            onClick={() => switchLang(isKo ? 'en' : 'ko')}
            className={`${iconBtn} text-[14px] font-bold`}
            aria-label={isKo ? 'Switch to English' : '한국어로 보기'}
          >
            {isKo ? 'EN' : '한'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={iconBtn}
            aria-label={isNight ? (isKo ? '밝은 화면으로' : 'Light mode') : isKo ? '어두운 화면으로' : 'Dark mode'}
          >
            {isNight ? <Sun size={20} weight="bold" /> : <Moon size={20} weight="bold" />}
          </button>
          <a
            href="/app"
            onClick={startScan('header')}
            className="btn-press hidden min-h-11 items-center rounded-md bg-line px-4 text-[15px] font-bold text-[#2b211a] sm:inline-flex"
          >
            {isKo ? '채점해 보기' : 'Try it'}
          </a>
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className={`${iconBtn} md:hidden`}
            aria-label={isKo ? '메뉴 열기' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            <List size={20} weight="bold" />
          </button>
        </div>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-ground p-4 animate-fade-in md:hidden" role="dialog" aria-modal="true" aria-label={isKo ? '메뉴' : 'Menu'}>
          <div className="flex justify-end">
            <button type="button" onClick={() => setMenuOpen(false)} className={iconBtn} aria-label={isKo ? '메뉴 닫기' : 'Close menu'}>
              <X size={20} weight="bold" />
            </button>
          </div>
          <nav className="mt-6 flex flex-col gap-1 text-[20px] font-bold">
            <a href="/app" onClick={(e) => { setMenuOpen(false); startScan('menu')(e); }} className="rounded-md px-3 py-3 text-line-ink hover:bg-sunken">
              {isKo ? '지금 채점해 보기' : 'Try it now'}
            </a>
            <a href={APP_DOWNLOAD_URL} target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '모바일 앱 받기' : 'Get the mobile app'}
            </a>
            <a href={langPath('/schools')} className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '학원·교사 안내' : 'For schools'}
            </a>
            <a href={langPath('/faq')} className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '자주 묻는 질문' : 'FAQ'}
            </a>
            <a href="https://blog.naver.com/chekkiai" target="_blank" rel="noopener noreferrer" className="rounded-md px-3 py-3 hover:bg-sunken">
              {isKo ? '블로그' : 'Blog'}
            </a>
          </nav>
        </div>
      )}

      {/* HERO */}
      <section id="main-content" className="tile-ground">
        <div className="mx-auto grid max-w-5xl items-center gap-8 px-4 pb-12 pt-10 md:grid-cols-[1.2fr_1fr] md:pb-20 md:pt-16">
          <div>
            <p className="text-[15px] font-bold text-line-ink">
              {isKo ? '영어 숙제, 엄마가 다 알 필요 없어요' : "You don't need to know all the English"}
            </p>
            <h1 className="mt-3 text-[40px] font-extrabold leading-[1.1] tracking-[-0.03em] text-ink sm:text-[56px]">
              {isKo ? (
                <>
                  채점은 채키가,
                  <br />
                  칭찬은 엄마가
                </>
              ) : (
                <>
                  Chekki grades.
                  <br />
                  You praise.
                </>
              )}
            </h1>
            <p className="mt-4 max-w-md text-[17px] leading-relaxed text-ink-2">
              {isKo
                ? '아이 영어 숙제를 사진으로 찍으면, 채점과 한국어 설명이 바로 나와요. 엄마는 옆에서 칭찬만 해 주세요.'
                : "Photograph your child's English homework and get it graded, with the reasons explained in Korean. You just do the praising."}
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="/app" onClick={startScan('hero')} className={primaryBtn}>
                <Camera size={22} weight="bold" />
                {isKo ? '지금 무료로 채점해 보기' : 'Grade homework free'}
              </a>
              <p className="text-[14px] font-semibold text-ink-3 sm:max-w-[11rem]">
                {isKo ? '가입 없이 웹에서 바로 써 볼 수 있어요' : 'No sign-up needed. Works in your browser.'}
              </p>
            </div>

            {/* Designed for phones: point people at the app without blocking the web try */}
            <a
              href={APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('landing_get_app', { where: 'hero' })}
              className="mt-6 flex max-w-md items-center gap-3 rounded-md bg-surface p-4 ring-1 ring-inset ring-rule hover:ring-ink-3"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-line-soft text-line-ink">
                <DeviceMobile size={22} weight="bold" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-ink">
                  {isKo ? '채키는 휴대폰에 맞춰 만들었어요' : 'Chekki is designed for your phone'}
                </span>
                <span className="block text-[14px] text-ink-2">
                  {isKo ? '앱으로 받으면 숙제 찍기가 더 편해요' : 'The app makes snapping homework easier'}
                </span>
              </span>
              <span className="shrink-0 text-[14px] font-bold text-line-ink">
                {isKo ? '앱 받기' : 'Get app'}
              </span>
            </a>
          </div>

          <img
            src="/assets/chekki-mascot.webp"
            alt=""
            width={440}
            height={440}
            className="mx-auto w-full max-w-[200px] md:max-w-[400px]"
          />
        </div>
      </section>

      {/* PAINS SOLVED: the problem first, then how it works */}
      <section className="bg-sunken">
        <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
          <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">
            {isKo ? '숙제 볼 때 이런 고민 있으셨죠' : 'Sound familiar?'}
          </h2>
          <ul className="mt-6 grid gap-3 md:grid-cols-3">
            {pains.map(({ Icon, pain, fix }) => (
              <li key={pain} className="rounded-md bg-surface p-5 ring-1 ring-inset ring-rule">
                <span className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-line-soft text-line-ink">
                  <Icon size={22} weight="bold" aria-hidden="true" />
                </span>
                <p className="mt-3 text-[15px] font-semibold text-ink-3">“{pain}”</p>
                <p className="mt-2 text-[16px] font-bold leading-relaxed text-ink">{fix}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">
          {isKo ? '이렇게 써요' : 'How it works'}
        </h2>
        <p className="mt-1.5 text-[15px] text-ink-3">
          {isKo ? '번호를 누르면 화면의 각 부분을 설명해 드려요.' : 'Tap a number to see what each part of the screen does.'}
        </p>
        <div className="mt-6">
          <ScreenTour isKo={isKo} name="parent" steps={tourSteps} footnote={isKo ? '실제 앱 화면 · 예시 학습지' : 'Real app screens · sample worksheet'} />
        </div>
      </section>

      {/* ACADEMY */}
      <section className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <div className="grid gap-6 rounded-lg bg-surface p-6 ring-1 ring-inset ring-rule md:grid-cols-[1.3fr_1fr] md:p-8">
          <div>
            <p className="text-[15px] font-bold text-line-ink">{isKo ? '학원에 다닌다면' : 'If your child goes to an academy'}</p>
            <h2 className="mt-2 text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[30px]">
              {isKo ? '학원이 체키를 쓰면, 엄마는 무료예요' : "If the academy uses Chekki, it's free for you"}
            </h2>
            <ul className="mt-4 space-y-2.5">
              {(isKo
                ? ['선생님이 올린 이번 주 정답지로 채점해요', '집에서 틀린 문제가 선생님께 전달돼요', '수업에서 그 단어를 다시 봤는지 리포트로 알려 줘요']
                : ["Graded with this week's answer key from the teacher", 'Misses at home reach the teacher', 'The class report tells you when those words were retaught']
              ).map((x) => (
                <li key={x} className="flex items-start gap-2.5 text-[16px] font-semibold text-ink">
                  <Check size={18} weight="bold" className="mt-0.5 shrink-0 text-line-ink" />
                  {x}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col justify-center gap-3">
            <p className="text-[15px] leading-relaxed text-ink-2">
              {isKo
                ? '아직이라면 원장님께 추천 메시지를 보내 보세요. 복사해서 카카오톡에 붙여 넣으면 돼요.'
                : 'Not yet? Send the director a note. Copy it and paste it into KakaoTalk.'}
            </p>
            <button
              type="button"
              onClick={copyDirectorMsg}
              className="btn-press inline-flex min-h-12 items-center justify-center rounded-md bg-sign px-6 text-[16px] font-bold text-on-sign dark:bg-ink dark:text-ground"
            >
              {inviteCopied ? (isKo ? '복사했어요' : 'Copied') : isKo ? '원장님께 보낼 메시지 복사' : 'Copy message for the director'}
            </button>
            <a href={langPath('/schools')} className="inline-flex min-h-11 items-center justify-center gap-1.5 text-[15px] font-bold text-line-ink">
              {isKo ? '학원·교사 안내 보기' : 'See Chekki for schools'}
              <ArrowRight size={16} weight="bold" />
            </a>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="mx-auto max-w-5xl px-4 pb-12 md:pb-16">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">{isKo ? '요금' : 'Pricing'}</h2>
        <p className="mt-2 text-[16px] text-ink-2">
          {isKo ? '무료로 시작하고, 필요할 때 구독하세요. 구독은 7일 무료 체험부터 시작해요.' : 'Start free. Subscribe when you need more, starting with a 7-day free trial.'}
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="flex flex-col rounded-md bg-surface p-5 ring-1 ring-inset ring-rule">
            <h3 className="text-[17px] font-extrabold text-ink">{isKo ? '무료로 시작' : 'Start free'}</h3>
            <p className="num mt-2 text-[32px] font-extrabold text-ink">₩0</p>
            <p className="mt-1 flex-1 text-[15px] text-ink-2">
              {isKo ? '웹에서 바로 채점해 볼 수 있어요. 학원 초대로 연결되면 계속 무료예요.' : 'Try grading on the web right away. Free for good if your academy invites you.'}
            </p>
            <a href="/app" onClick={startScan('pricing')} className={`${primaryBtn} mt-5 min-h-12 text-[15px]`}>
              {isKo ? '채점해 보기' : 'Try it'}
            </a>
          </div>
          {[
            { name: isKo ? '월간' : 'Monthly', price: '₩9,900', per: isKo ? '/월' : '/month', note: isKo ? '언제든 해지할 수 있어요' : 'Cancel anytime' },
            { name: isKo ? '연간' : 'Yearly', price: '₩99,000', per: isKo ? '/년' : '/year', note: isKo ? '월 8,250원 꼴' : 'About ₩8,250 a month', best: true },
          ].map((p) => (
            <div key={p.name} className={`flex flex-col rounded-md p-5 ${p.best ? 'bg-line-soft ring-2 ring-inset ring-line' : 'bg-surface ring-1 ring-inset ring-rule'}`}>
              <h3 className="flex items-center gap-2 text-[17px] font-extrabold text-ink">
                {p.name}
                {p.best && (
                  <span className="rounded-full bg-sign px-2 py-0.5 text-[12px] font-bold text-on-sign dark:bg-ink dark:text-ground">
                    {isKo ? '추천' : 'Best value'}
                  </span>
                )}
              </h3>
              <p className="num mt-2 text-[32px] font-extrabold text-ink">
                {p.price}
                <span className="text-[15px] font-semibold text-ink-3">{p.per}</span>
              </p>
              <p className="mt-1 flex-1 text-[15px] text-ink-2">
                {p.note}. {isKo ? '채점 무제한, 원어민 발음, 티칭 스크립트.' : 'Unlimited grading, native audio, teaching scripts.'}
              </p>
              <a
                href="/subscribe"
                className="btn-press mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-surface text-[15px] font-bold text-ink ring-1 ring-inset ring-rule hover:ring-ink-3"
              >
                {isKo ? '앱에서 구독하기' : 'Subscribe in the app'}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-12 md:pb-16">
        <h2 className="text-[26px] font-extrabold tracking-[-0.02em] text-ink sm:text-[32px]">
          {isKo ? '자주 묻는 질문' : 'Questions'}
        </h2>
        <div className="mt-6 space-y-2">
          {faqs.map((f) => (
            <details key={f.id} className="group rounded-md bg-surface ring-1 ring-inset ring-rule">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-[16px] font-bold text-ink [&::-webkit-details-marker]:hidden">
                {isKo ? f.questionKo : f.questionEn}
                <CaretDown size={18} weight="bold" className="shrink-0 text-ink-3 transition-transform group-open:rotate-180" />
              </summary>
              <p className="border-t border-rule px-5 pb-5 pt-4 text-[15px] leading-relaxed text-ink-2">
                {isKo ? f.answerKo : f.answerEn}
              </p>
            </details>
          ))}
        </div>
        <a href={langPath('/faq')} className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-[15px] font-bold text-line-ink">
          {isKo ? '질문 더 보기' : 'More questions'}
          <ArrowRight size={16} weight="bold" />
        </a>
      </section>

      {/* CLOSING CTA */}
      <section className="tile-ground border-t border-rule">
        <div className="mx-auto max-w-3xl px-4 py-14 text-center md:py-20">
          <img src="/images/chekki-thumbs.webp" alt="" width={112} height={112} className="mx-auto h-28 w-28 object-contain" />
          <h2 className="mt-3 text-[28px] font-extrabold tracking-[-0.02em] text-ink sm:text-[36px]">
            {isKo ? '오늘 숙제부터 찍어 보세요' : "Start with tonight's homework"}
          </h2>
          <a href="/app" onClick={startScan('footer')} className={`${primaryBtn} mt-6`}>
            <Camera size={22} weight="bold" />
            {isKo ? '지금 무료로 채점해 보기' : 'Grade homework free'}
          </a>
          <p className="mt-4 text-[14px] text-ink-3">
            {isKo ? '휴대폰이라면 ' : 'On a phone? '}
            <a
              href={APP_DOWNLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('landing_get_app', { where: 'footer' })}
              className="font-bold text-line-ink underline"
            >
              {isKo ? '앱으로 받는 게 더 편해요' : 'the app is easier'}
            </a>
          </p>
        </div>
      </section>

      {/* FOOTER: business info is required for KC INCIS / PortOne inspection */}
      <footer className="border-t border-rule bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-10 text-[13px] text-ink-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-ink-2">
            <a href={langPath('/faq')} className="hover:text-ink">FAQ</a>
            <a href={langPath('/schools')} className="hover:text-ink">{isKo ? '학원·교사' : 'For schools'}</a>
            <a href="https://blog.naver.com/chekkiai" target="_blank" rel="noopener noreferrer" className="hover:text-ink">
              {isKo ? '블로그' : 'Blog'}
            </a>
            <a href="/privacy" onClick={goTo('/privacy')} className="hover:text-ink">{isKo ? '개인정보처리방침' : 'Privacy Policy'}</a>
            <a href="/terms" onClick={goTo('/terms')} className="hover:text-ink">{isKo ? '이용약관' : 'Terms of Service'}</a>
            <a href="/refund" onClick={goTo('/refund')} className="hover:text-ink">{isKo ? '환불정책' : 'Refund Policy'}</a>
            <a href="/support" onClick={goTo('/support')} className="hover:text-ink">{isKo ? '고객지원' : 'Customer Support'}</a>
          </div>
          <div className="space-y-1">
            <p className="font-bold text-ink-2">{isKo ? '사업자 정보' : 'Business information'}</p>
            <p>
              {isKo ? '상호명' : 'Company'}: 채키 AI (Chekki AI) · {isKo ? '대표자' : 'Representative'}: Benjamin Jason ·{' '}
              {isKo ? '사업자등록번호' : 'Biz Reg No'}: 814-14-03096 · {isKo ? '고객센터' : 'Email'}: support@chekkiai.com
            </p>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Chekki AI</p>
            <div className="flex gap-2">
              <a href="https://www.instagram.com/chekki__ai" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className={iconBtn}>
                <InstagramLogo size={20} weight="fill" />
              </a>
              <a href="https://www.tiktok.com/@chekkiai" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className={iconBtn}>
                <TiktokLogo size={20} weight="fill" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
