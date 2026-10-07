import { useState, useEffect } from 'react';
import { ArrowLeft, CaretDown, MagnifyingGlass, Moon, Sun } from '@phosphor-icons/react';
import { FAQ_DATA } from '../data/faq';
import { langPath, switchLang, urlLang } from '../lib/lang';
import { useWarmTheme } from '../lib/theme';

export default function FaqPage() {
  const [isNight, toggleTheme] = useWarmTheme();
  const [activeCategory, setActiveCategory] = useState<'all' | 'parent' | 'teacher'>('all');
  const [openFaqId, setOpenFaqId] = useState<string | null>('p1');
  const [searchQuery, setSearchQuery] = useState('');
  const isKo = urlLang() === 'ko';

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);

  const handleLangToggle = () => switchLang(isKo ? 'en' : 'ko');

  const toggleFaq = (id: string) => {
    setOpenFaqId(prev => (prev === id ? null : id));
  };

  const filteredFaqs = FAQ_DATA.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const qText = isKo ? item.questionKo : item.questionEn;
    const aText = isKo ? item.answerKo : item.answerEn;
    const matchesSearch = searchQuery.trim() === '' || 
      qText.toLowerCase().includes(searchQuery.toLowerCase()) || 
      aText.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', langPath(path));
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const tab = (on: boolean) =>
    `min-h-11 rounded-md px-4 text-[15px] font-bold ${on ? 'bg-sign text-on-sign dark:bg-ink dark:text-ground' : 'bg-surface text-ink-2 ring-1 ring-inset ring-rule hover:text-ink'}`;
  const iconBtn =
    'flex h-11 w-11 items-center justify-center rounded-md text-ink-2 ring-1 ring-inset ring-rule hover:text-ink hover:ring-ink-3';
  const legal: [string, string][] = [
    ['/privacy', isKo ? '개인정보처리방침' : 'Privacy Policy'],
    ['/terms', isKo ? '이용약관' : 'Terms of Service'],
    ['/refund', isKo ? '환불정책' : 'Refund Policy'],
    ['/support', isKo ? '고객지원' : 'Customer Support'],
  ];

  return (
    <div className="font-warm flex min-h-screen flex-col bg-ground text-ink break-keep">
      <header className="sticky top-0 z-20 border-b border-rule bg-ground/95">
        <div className="mx-auto flex h-16 max-w-3xl items-center gap-2 px-4">
          <a href={langPath('/')} className="mr-auto text-[19px] font-extrabold tracking-[-0.02em] text-ink">
            Chekki<span className="text-line">AI</span>
          </a>
          <button type="button" onClick={handleLangToggle} className={`${iconBtn} text-[14px] font-bold`} aria-label={isKo ? 'Switch to English' : '한국어로 보기'}>
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
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <a href={langPath('/')} className="-ml-2 inline-flex min-h-11 items-center gap-2 rounded-md px-2 text-[15px] font-semibold text-ink-2 hover:text-ink">
          <ArrowLeft size={18} weight="bold" />
          {isKo ? '홈으로' : 'Home'}
        </a>
        <h1 className="mt-3 text-[30px] font-extrabold tracking-[-0.02em] text-ink sm:text-[36px]">
          {isKo ? '자주 묻는 질문' : 'Questions and answers'}
        </h1>

        <div className="relative mt-6">
          <MagnifyingGlass size={18} weight="bold" className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isKo ? '궁금한 걸 검색해 보세요' : 'Search questions'}
            aria-label={isKo ? '질문 검색' : 'Search questions'}
            className="min-h-12 w-full rounded-md bg-surface pl-11 pr-4 text-[16px] text-ink ring-1 ring-inset ring-rule placeholder:text-ink-3 focus:outline-none focus:ring-2 focus:ring-line"
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={isKo ? '분류' : 'Category'}>
          {([
            ['all', isKo ? '전체' : 'All'],
            ['parent', isKo ? '학부모' : 'Parents'],
            ['teacher', isKo ? '학원·선생님' : 'Academies'],
          ] as const).map(([key, label]) => (
            <button key={key} type="button" onClick={() => setActiveCategory(key)} aria-pressed={activeCategory === key} className={tab(activeCategory === key)}>
              {label}
            </button>
          ))}
        </div>

        <div className="mt-6 space-y-2">
          {filteredFaqs.length === 0 ? (
            <p className="rounded-md bg-surface p-8 text-center text-[15px] text-ink-2 ring-1 ring-inset ring-rule">
              {isKo ? '찾는 질문이 없어요. 다른 말로 검색해 보세요.' : 'No matching questions. Try other words.'}
            </p>
          ) : (
            filteredFaqs.map((faq) => {
              const isOpen = openFaqId === faq.id;
              return (
                <div key={faq.id} className={`rounded-md bg-surface ring-inset ${isOpen ? 'ring-2 ring-line' : 'ring-1 ring-rule'}`}>
                  <button
                    type="button"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                    className="flex min-h-14 w-full items-start justify-between gap-3 px-5 py-4 text-left"
                  >
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-line-ink">{isKo ? faq.tagKo : faq.tagEn}</span>
                      <span className="mt-0.5 block text-[16px] font-bold leading-snug text-ink">{isKo ? faq.questionKo : faq.questionEn}</span>
                    </span>
                    <CaretDown size={18} weight="bold" className={`mt-1 shrink-0 text-ink-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <p className="border-t border-rule px-5 pb-5 pt-4 text-[15px] leading-relaxed text-ink-2">
                      {isKo ? faq.answerKo : faq.answerEn}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="mt-12 rounded-lg bg-surface p-6 text-center ring-1 ring-inset ring-rule">
          <img src="/images/chekki-wave.webp" alt="" width={96} height={96} className="mx-auto h-24 w-24 object-contain" />
          <h2 className="mt-2 text-[20px] font-extrabold text-ink">{isKo ? '찾는 답이 없나요?' : "Didn't find your answer?"}</h2>
          <p className="mt-1 text-[15px] text-ink-2">{isKo ? '이메일로 물어보시면 답장 드릴게요.' : "Email us and we'll write back."}</p>
          <a
            href="mailto:support@chekkiai.com?subject=[Chekki%20Support]%20Customer%20Inquiry"
            className="btn-press mt-5 inline-flex min-h-12 items-center justify-center rounded-md bg-line px-6 text-[15px] font-bold text-[#2b211a]"
          >
            support@chekkiai.com
          </a>
        </div>
      </main>

      <footer className="border-t border-rule bg-surface">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-8 text-[13px] text-ink-3">
          <div className="flex flex-wrap gap-x-5 gap-y-2 font-semibold text-ink-2">
            <a href={langPath('/')} className="hover:text-ink">{isKo ? '홈' : 'Home'}</a>
            {legal.map(([path, label]) => (
              <button key={path} type="button" onClick={() => navigateTo(path)} className="hover:text-ink">
                {label}
              </button>
            ))}
          </div>
          <p>
            {isKo ? '상호명' : 'Company'}: 채키 AI (Chekki AI) · {isKo ? '대표자' : 'Representative'}: Benjamin Jason ·{' '}
            {isKo ? '사업자등록번호' : 'Biz Reg No'}: 814-14-03096 · {isKo ? '고객센터' : 'Email'}: support@chekkiai.com
          </p>
          <p>© {new Date().getFullYear()} Chekki AI</p>
        </div>
      </footer>
    </div>
  );
}
