import { ArrowRight, FilePdf, GraduationCap, PlayCircle } from '@phosphor-icons/react';

// Free teaching resources (YouTube, TPT, grammar PPT). Moved here from the
// parent landing page: these are for teachers, not tired parents.
export default function EducatorResources({ isNight, isKo }: { isNight: boolean; isKo: boolean }) {
  return (
    <section id="educators" className="py-16 md:py-24 px-4 md:px-8 max-w-7xl mx-auto w-full">
      <div className="mb-12 flex flex-col items-start md:items-center md:text-center">
        <h2
          className={`font-display text-2xl sm:text-4xl font-black tracking-tight mb-4 ${
            isNight ? 'text-white' : 'text-slate-900'
          }`}
        >
          {isKo ? '선생님을 위한 무료 자료' : 'Free resources for teachers'}
        </h2>
        <p className={`text-lg max-w-2xl ${isNight ? 'text-white/60' : 'text-slate-600'}`}>
          {isKo
            ? '수업에 바로 쓸 수 있는 영상, 워크시트, 문법 자료를 모아 두었어요.'
            : 'Videos, worksheets and grammar slides you can use in class.'}
        </p>
      </div>

      {/* Clean 3-Card High-Impact Educator Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. YouTube */}
        <a
          href="https://www.youtube.com/@ChekkiAI"
          target="_blank"
          rel="noopener noreferrer"
          className={`edu-card rounded-[2.5rem] p-2 shadow-2xl group block outline-none border transition-[border-color] ${
            isNight
              ? 'bg-white/[0.02] border-white/5 hover:border-brand/40'
              : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
          }`}
        >
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('/assets/youtube_bg.png')] bg-cover bg-center mix-blend-screen" />
            <div className="relative z-20">
              <PlayCircle weight="fill" className="text-5xl text-brand mb-4 drop-shadow-xl" />
              <h3 className="text-2xl font-bold text-white mb-2">YouTube Channel</h3>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                {isKo
                  ? '이중언어 교육 및 학습 습관 형성을 위한 매주 업데이트'
                  : 'Weekly insights on bilingual education & study habits.'}
              </p>
              <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                <span>{isKo ? '영상 시청하기' : 'Watch videos'}</span>
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-brand" />
              </div>
            </div>
          </div>
        </a>

        {/* 2. TPT Store */}
        <a
          href="https://www.teacherspayteachers.com/store/chekki-ai"
          target="_blank"
          rel="noopener noreferrer"
          className={`edu-card rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-[border-color] ${
            isNight
              ? 'bg-white/[0.02] border-white/5 hover:border-brand/40'
              : 'bg-white border-slate-300 hover:border-brand/60 shadow-slate-200'
          }`}
        >
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('https://res.cloudinary.com/dginphpy4/image/upload/v1771381888/Chekki_Splash_1_nrpzaj.png')] bg-cover bg-center mix-blend-screen" />
            <div className="relative z-20">
              <GraduationCap weight="fill" className="text-5xl text-blue-400 mb-4 drop-shadow-xl" />
              <h3 className="text-2xl font-bold text-white mb-2">TPT Store</h3>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                {isKo
                  ? '출력 가능한 영유 교재 및 워크시트 자료'
                  : 'Downloadable worksheets & lesson plan resources.'}
              </p>
              <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                <span>{isKo ? '교재 둘러보기' : 'Browse worksheets'}</span>
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-blue-400" />
              </div>
            </div>
          </div>
        </a>

        {/* 3. Free Grammar PPT */}
        <a
          href="https://chekkiai.netlify.app/"
          target="_blank"
          rel="noopener noreferrer"
          className={`edu-card rounded-[2.5rem] p-2 shadow-xl group block outline-none border transition-[border-color] ${
            isNight
              ? 'bg-white/[0.02] border-white/5 hover:border-red-500/40'
              : 'bg-white border-slate-300 hover:border-red-500/50 shadow-slate-200'
          }`}
        >
          <div className="overflow-hidden rounded-[calc(2.5rem-0.5rem)] bg-brand-dark relative h-[320px] flex flex-col justify-end p-8 text-white">
            <div className="absolute inset-0 bg-gradient-to-t from-brand-dark via-brand-dark/50 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-0 opacity-60 group-hover:scale-110 group-hover:opacity-85 transition-[transform,opacity] duration-[1200ms] bg-[url('/assets/grammar_bg.png')] bg-cover bg-center mix-blend-screen" />
            <div className="relative z-20">
              <FilePdf weight="fill" className="text-5xl text-red-500 mb-4 drop-shadow-xl" />
              <h3 className="text-2xl font-bold text-white mb-2">Top Grammar PPT</h3>
              <p className="text-white/70 text-sm mb-6 leading-relaxed">
                {isKo
                  ? '한국 학생들이 가장 많이 틀리는 영문법 무료 정리 PPT'
                  : 'Free downloadable PPT on top grammar mistakes.'}
              </p>
              <div className="relative inline-flex items-center gap-3 text-sm text-white font-semibold">
                <span>{isKo ? '무료 자료 받기' : 'Download free PPT'}</span>
                <ArrowRight className="transition-transform duration-500 group-hover:translate-x-1 text-red-400" />
              </div>
            </div>
          </div>
        </a>
      </div>
    </section>
  );
}
