import React, { useEffect } from 'react';

interface Props {
  isNight: boolean;
  isKo: boolean;
}

// Static artwork replacing the live-drawn loop cards below (Gemini-generated,
// cropped/prepped in scripts/, not committed — see docs/DECISIONS.md #019
// follow-up). Each variant's own flat backdrop color is baked into its
// wrapper's background so there's no visible seam between the image and its
// frame; the frame-to-page-background seam is a separate, much smaller
// mismatch (page tokens vs. the image's own near-identical flat color).
const LOOP_IMAGE: Record<'dark' | 'light', Record<'en' | 'ko', { src: string; bg: string }>> = {
  dark: {
    en: { src: '/images/loop-diagram-dark-en.webp', bg: '#121212' },
    ko: { src: '/images/loop-diagram-dark-ko.webp', bg: '#0e0e0e' },
  },
  light: {
    en: { src: '/images/loop-diagram-light-en.webp', bg: '#ffffff' },
    ko: { src: '/images/loop-diagram-light-ko.webp', bg: '#f8f9fb' },
  },
};

// Toggling theme/language swaps the <img src> between four separate static
// files; without a warm cache the new file can take long enough to fetch
// that the old (wrong-theme) image stays visibly on screen mid-swap. Prefetch
// all four on mount so any later toggle resolves from cache instantly.
function usePrefetchLoopImages() {
  useEffect(() => {
    Object.values(LOOP_IMAGE).forEach((byLang) => {
      Object.values(byLang).forEach(({ src }) => {
        const img = new Image();
        img.src = src;
      });
    });
  }, []);
}

export function SchoolLoopDiagram({ isNight, isKo }: Props) {
  usePrefetchLoopImages();
  const variant = LOOP_IMAGE[isNight ? 'dark' : 'light'][isKo ? 'ko' : 'en'];
  const alt = isKo
    ? '두 개의 순환 루프. 선생님용: 숙제 업로드, 학부모가 스캔, 오답이 드러남, 격차 지도 (매주 반복). 학부모용: 교사가 일지 기록, AI가 초안 작성, KT 검토 후 발송, 학부모가 확인 (매일 반복).'
    : 'Two loops. For teachers: upload homework, parent scans it, mistakes surface, teach to the gap (repeats every week). For parents: teacher logs the day, AI drafts the report, KT reviews and sends, parent reads it (repeats every day).';

  return (
    <section className="py-8 md:py-10 px-4 md:px-8 max-w-6xl mx-auto w-full space-y-5">
      <div className="text-center max-w-xl mx-auto space-y-1.5">
        <span className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-500 text-[10px] font-mono font-black uppercase tracking-widest rounded-full inline-block">
          {isKo ? '채키 작동 방식' : 'HOW CHEKKI WORKS'}
        </span>
        <h3 className={`font-display text-2xl sm:text-3xl font-black break-keep ${isNight ? 'text-white' : 'text-zinc-900'}`}>
          {isKo ? '두 개의 루프, 계속 돌아갑니다' : 'Two loops, always turning'}
        </h3>
      </div>

      <div className="rounded-[2rem] overflow-hidden" style={{ backgroundColor: variant.bg }}>
        <img src={variant.src} alt={alt} className="w-full h-auto block" loading="lazy" />
      </div>
    </section>
  );
}
