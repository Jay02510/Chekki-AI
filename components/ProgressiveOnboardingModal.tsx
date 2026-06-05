import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  isNight?: boolean;
}

const AGE_OPTIONS = [
  { id: '4-5', ko: '4-5세', en: '4-5 years' },
  { id: '6', ko: '6세', en: '6 years' },
  { id: '7', ko: '7세', en: '7 years' },
  { id: '8+', ko: '8세 이상', en: '8+ years' },
];

const LEVEL_OPTIONS = [
  { id: 'beginner', ko: '파닉스 / 기초', en: 'Phonics / Beginner' },
  { id: 'intermediate', ko: '1-2년차 (중급)', en: '1-2 Years (Intermediate)' },
  { id: 'advanced', ko: '3년차 이상 (고급)', en: 'Fluent (Advanced)' },
];

export const ProgressiveOnboardingModal: React.FC<Props> = ({
  onComplete,
  onSkip,
  isNight = true,
}) => {
  const { language } = useLanguage();
  const { updateChildProfile } = useAuth();

  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [parentLevel, setParentLevel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedAge || !selectedLevel || !parentLevel) return;
    setIsSubmitting(true);
    try {
      await updateChildProfile(selectedAge, selectedLevel, parentLevel);
      onComplete();
    } catch (e) {
      console.error(e);
      onSkip(); // If it fails, fallback to skipping so we don't break the flow
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
      <div
        className={`relative ${isNight ? 'bg-zinc-900 border-white/10' : 'bg-white border-zinc-200'} p-6 md:p-8 rounded-3xl w-full max-w-sm shadow-[0_20px_60px_rgba(0,0,0,0.8)] animate-fade-in-up border transition-colors`}
      >
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-lg ring-4 ring-orange-500/20">
            ✨
          </div>
          <h3
            className={`text-xl font-black ${isNight ? 'text-white' : 'text-zinc-900'} font-display`}
          >
            {language === 'ko' ? '아이에게 딱 맞는 설명서' : 'Tailored Explanations'}
          </h3>
          <p className="text-xs text-zinc-400 mt-2 font-korean leading-relaxed">
            {language === 'ko'
              ? '아이의 연령과 수준을 알려주시면, AI가 그에 맞춰 가장 이해하기 쉬운 단어와 문장으로 티칭 가이드를 만들어 드립니다.'
              : 'Tell us about your child, and our AI will tailor its vocabulary and teaching guides perfectly to their level.'}
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label
              className={`block text-[10px] font-black ${isNight ? 'text-white' : 'text-zinc-900'} uppercase tracking-widest mb-3 opacity-60`}
            >
              {language === 'ko' ? '아이의 연령' : "Child's Age"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {AGE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedAge(opt.id)}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border ${
                    selectedAge === opt.id
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                      : isNight
                        ? 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  {language === 'ko' ? opt.ko : opt.en}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-black ${isNight ? 'text-white' : 'text-zinc-900'} uppercase tracking-widest mb-3 opacity-60`}
            >
              {language === 'ko' ? '영어 학습 경험' : 'English Experience'}
            </label>
            <div className="flex flex-col gap-2">
              {LEVEL_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedLevel(opt.id)}
                  className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex justify-between items-center ${
                    selectedLevel === opt.id
                      ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                      : isNight
                        ? 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                        : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                  }`}
                >
                  <span>{language === 'ko' ? opt.ko : opt.en}</span>
                  {selectedLevel === opt.id && <span className="text-sm">✓</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label
              className={`block text-[10px] font-black ${isNight ? 'text-white' : 'text-zinc-900'} uppercase tracking-widest mb-3 opacity-60 mt-6`}
            >
              {language === 'ko' ? '엄마/아빠의 영어 수준' : "Parent's English Level"}
            </label>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setParentLevel('beginner')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex justify-between items-center ${
                  parentLevel === 'beginner'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                    : isNight
                      ? 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                <span>{language === 'ko' ? '기본적인 문장만! (왕초보)' : 'Beginner'}</span>
                {parentLevel === 'beginner' && <span className="text-sm">✓</span>}
              </button>
              <button
                onClick={() => setParentLevel('fluent')}
                className={`py-3 px-4 rounded-xl text-xs font-bold transition-all border text-left flex justify-between items-center ${
                  parentLevel === 'fluent'
                    ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                    : isNight
                      ? 'bg-zinc-800 border-white/5 text-zinc-400 hover:bg-zinc-700'
                      : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:bg-zinc-200'
                }`}
              >
                <span>
                  {language === 'ko' ? '기본적인 설명 가능! (중급 이상)' : 'Comfortable (Fluent)'}
                </span>
                {parentLevel === 'fluent' && <span className="text-sm">✓</span>}
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleSubmit}
            disabled={!selectedAge || !selectedLevel || !parentLevel || isSubmitting}
            className={`w-full ${isNight ? 'bg-white text-black' : 'bg-zinc-900 text-white shadow-lg shadow-zinc-900/20'} py-4 rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:bg-zinc-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {isSubmitting
              ? language === 'ko'
                ? '저장 중...'
                : 'Saving...'
              : language === 'ko'
                ? '설정 완료 (맞춤형 시작)'
                : 'Save & Tailor Guides'}
          </button>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setSelectedAge(null);
                setSelectedLevel(null);
                setParentLevel(null);
              }}
              className={`flex-1 ${isNight ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'} py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all`}
            >
              {language === 'ko' ? '초기화' : 'Reset'}
            </button>
            <button
              onClick={onSkip}
              className="flex-1 bg-transparent text-zinc-500 py-3 rounded-2xl font-bold uppercase text-[10px] tracking-widest hover:text-orange-500 transition-colors"
            >
              {language === 'ko' ? '다음에 할게요' : 'Skip for now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
