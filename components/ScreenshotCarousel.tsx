import React, { useState, useEffect, useRef } from 'react';

interface Screenshot {
  url: string;
  title: string;
}

const screenshots: Screenshot[] = [
  {
    url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771328734/Story_Upload_ubfd9l.png',
    title: 'Homework Upload',
  },
  {
    url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771328734/Story_Gen_Text_d2lwgj.png',
    title: 'Chekki generated Answers',
  },
  {
    url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771328730/Kor_Pronunciation_v6bxaq.png',
    title: 'Pronunciation and Korean Teaching Guide',
  },
  {
    url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771328724/Eng_Questions_Pronunciation_irbcxk.png',
    title: 'English Question Pronunciation',
  },
  {
    url: 'https://res.cloudinary.com/dginphpy4/image/upload/v1771329421/Practice_Worksheet_p6oxaq.png',
    title: 'Generated Practice Worksheet',
  },
];

export const ScreenshotCarousel: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % screenshots.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
  };

  useEffect(() => {
    if (!isPaused) {
      timerRef.current = window.setInterval(nextSlide, 5000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused]);

  return (
    <div
      className="relative w-full max-w-4xl mx-auto px-4 pb-12 md:pb-24"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative aspect-[9/16] md:aspect-video w-full overflow-hidden rounded-3xl bg-zinc-900/50 border border-white/10 shadow-2xl">
        {/* Images */}
        <div
          className="flex transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {screenshots.map((s, i) => (
            <div
              key={i}
              className="min-w-full h-full flex items-center justify-center p-2 md:p-8 cursor-zoom-in group/img"
              onClick={() => setSelectedImage(s.url)}
            >
              <img
                src={s.url}
                alt={s.title}
                className="w-full h-full object-contain drop-shadow-2xl rounded-xl md:rounded-2xl transition-transform duration-200 group-hover/img:scale-[1.02]"
              />
            </div>
          ))}
        </div>

        {/* Overlay Text */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none">
          <h4 className="text-white text-lg md:text-3xl font-black font-display tracking-tight text-center">
            {screenshots[currentIndex].title}
          </h4>
        </div>

        {/* Navigation Arrows */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            prevSlide();
          }}
          className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-[0.97] group"
        >
          <span className="text-xl md:text-3xl group-hover:-translate-x-1 transition-transform">
            ←
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            nextSlide();
          }}
          className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 md:w-16 md:h-16 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-md flex items-center justify-center text-white transition-all active:scale-[0.97] group"
        >
          <span className="text-xl md:text-3xl group-hover:translate-x-1 transition-transform">
            →
          </span>
        </button>
      </div>

      {/* Dots */}
      <div className="flex justify-center gap-2 md:gap-4 mt-6 md:mt-10">
        {screenshots.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-200 rounded-full ${
              i === currentIndex
                ? 'w-8 md:w-12 h-2 md:h-3 bg-orange-500'
                : 'w-2 md:w-3 h-2 md:h-3 bg-white/20 hover:bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Lightbox / Enlarged View */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-12 animate-in fade-in duration-200"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-white text-2xl z-[110] transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            ✕
          </button>
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              src={selectedImage}
              alt="Enlarged view"
              className="max-w-full max-h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-200"
            />
          </div>
        </div>
      )}
    </div>
  );
};
