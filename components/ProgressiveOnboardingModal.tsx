import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
  isNight?: boolean;
  initialStep?: number;
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
  initialStep = 0,
}) => {
  const { language, setLanguage } = useLanguage();
  const { updateChildProfile } = useAuth();

  const [step, setStep] = useState(initialStep);
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [parentLevel, setParentLevel] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleProfileSubmit = async () => {
    if (!selectedAge || !selectedLevel || !parentLevel) return;
    setIsSubmitting(true);
    try {
      await updateChildProfile(selectedAge, selectedLevel, parentLevel);
      onComplete(); 
    } catch (e) {
      console.error(e);
      onSkip(); 
    } finally {
      setIsSubmitting(false);
    }
  };

  const transitionSpring = {
    type: 'spring' as const,
    damping: 24,
    stiffness: 200,
  };

  const fadeVariants = {
    initial: { opacity: 0, scale: 0.96, filter: 'blur(8px)', y: 20 },
    animate: { opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 },
    exit: { opacity: 0, scale: 1.04, filter: 'blur(8px)', y: -20, transition: { duration: 0.2 } },
  };

  const renderProfileForm = () => (
    <motion.div 
      key="profileForm"
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitionSpring}
      className="flex flex-col h-full"
    >
      <div className="text-center mb-10 pt-4">
        <motion.div 
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="w-32 h-32 rounded-[2.5rem] mx-auto mb-6 shadow-[0_20px_40px_rgba(249,115,22,0.2)] ring-1 ring-white/10 overflow-hidden bg-[#050505]"
        >
          <img src="/assets/bento_reveal_only.png" alt="Setup" className="w-full h-full object-cover" />
        </motion.div>
        <h3 className="text-3xl font-display font-black text-white tracking-tight leading-tight">
          {language === 'ko' ? 'AI 튜터 설정' : 'Tailor the AI'}
        </h3>
        <p className="text-sm text-zinc-400 mt-4 font-korean leading-relaxed max-w-[280px] mx-auto">
          {language === 'ko' 
            ? '아이의 학습 수준에 맞게 단어와 해설을 조정합니다.' 
            : "We'll adjust the vocabulary and explanations to fit your child perfectly."}
        </p>
      </div>

      <div className="space-y-8 mb-10 flex-1 overflow-y-auto custom-scrollbar px-2 -mx-2">
        {/* Age Select */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
            {language === 'ko' ? '아이의 연령' : "Child's Age"}
          </label>
          <div className="grid grid-cols-2 gap-3">
            {AGE_OPTIONS.map((opt) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                key={opt.id}
                onClick={() => setSelectedAge(opt.id)}
                className={`relative overflow-hidden py-4 px-3 rounded-2xl text-sm font-bold transition-all duration-200 \${
                  selectedAge === opt.id
                    ? 'text-white ring-2 ring-orange-500 bg-orange-500/10'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 ring-1 ring-white/10'
                }`}
              >
                <span className="relative z-10">{language === 'ko' ? opt.ko : opt.en}</span>
                {selectedAge === opt.id && (
                  <motion.div 
                    layoutId="age-active"
                    className="absolute inset-0 bg-orange-500/20 blur-xl"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Level Select */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
            {language === 'ko' ? '영어 학습 경험' : 'English Experience'}
          </label>
          <div className="flex flex-col gap-3">
            {LEVEL_OPTIONS.map((opt) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                key={opt.id}
                onClick={() => setSelectedLevel(opt.id)}
                className={`relative overflow-hidden py-4 px-5 rounded-2xl text-sm font-bold transition-all duration-200 text-left flex justify-between items-center \${
                  selectedLevel === opt.id
                    ? 'text-white ring-2 ring-orange-500 bg-orange-500/10'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 ring-1 ring-white/10'
                }`}
              >
                <span className="relative z-10">{language === 'ko' ? opt.ko : opt.en}</span>
                {selectedLevel === opt.id && (
                  <motion.div 
                    layoutId="level-active"
                    className="absolute inset-0 bg-orange-500/20 blur-xl"
                  />
                )}
                <AnimatePresence>
                  {selectedLevel === opt.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs relative z-10"
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Parent Level Select */}
        <div>
          <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] mb-4">
            {language === 'ko' ? '엄마/아빠의 영어 수준' : "Parent's English Level"}
          </label>
          <div className="flex flex-col gap-3">
            {[
              { id: 'beginner', ko: '기본적인 문장만! (왕초보)', en: 'Beginner' },
              { id: 'fluent', ko: '기본적인 설명 가능! (중급 이상)', en: 'Comfortable (Fluent)' }
            ].map((opt) => (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                key={opt.id}
                onClick={() => setParentLevel(opt.id)}
                className={`relative overflow-hidden py-4 px-5 rounded-2xl text-sm font-bold transition-all duration-200 text-left flex justify-between items-center \${
                  parentLevel === opt.id
                    ? 'text-white ring-2 ring-orange-500 bg-orange-500/10'
                    : 'bg-white/5 text-zinc-400 hover:bg-white/10 ring-1 ring-white/10'
                }`}
              >
                <span className="relative z-10">{language === 'ko' ? opt.ko : opt.en}</span>
                {parentLevel === opt.id && (
                  <motion.div 
                    layoutId="parent-level-active"
                    className="absolute inset-0 bg-orange-500/20 blur-xl"
                  />
                )}
                <AnimatePresence>
                  {parentLevel === opt.id && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="w-5 h-5 rounded-full bg-orange-500 text-white flex items-center justify-center text-xs relative z-10"
                    >
                      ✓
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-white/5">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleProfileSubmit}
          disabled={!selectedAge || !selectedLevel || !parentLevel || isSubmitting}
          className="w-full relative overflow-hidden bg-white text-black py-5 rounded-full font-black uppercase text-xs tracking-[0.15em] transition-colors disabled:opacity-50 disabled:cursor-not-allowed group shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
        >
          <span className="relative z-10">
            {isSubmitting ? (language === 'ko' ? '저장 중...' : 'Saving...') : (language === 'ko' ? '저장 후 계속하기' : 'Save & Continue')}
          </span>
          <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
        </motion.button>
        
        <div className="flex justify-center">
          <button
            onClick={onSkip}
            className="text-zinc-500 py-2 font-bold uppercase text-[10px] tracking-[0.2em] hover:text-white transition-colors cursor-pointer"
          >
            {language === 'ko' ? '다음에 할게요' : 'Skip for now'}
          </button>
        </div>
      </div>
    </motion.div>
  );

  const renderEducationalStep = (
    imageSrc: string,
    titleKo: string,
    titleEn: string,
    descKo: string,
    descEn: string,
    nextAction: () => void,
    isLast: boolean = false
  ) => (
    <motion.div 
      key={`step${step}`}
      variants={fadeVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={transitionSpring}
      className="flex flex-col h-full items-center justify-center text-center py-8"
    >
      <motion.div 
        animate={{ y: [0, -10, 0], rotate: [2, -1, 2] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-48 h-48 rounded-[3rem] flex items-center justify-center mb-10 shadow-[0_30px_60px_rgba(249,115,22,0.2)] ring-1 ring-white/10 overflow-hidden bg-black/20"
      >
        <img src={imageSrc} alt="" className="w-full h-full object-cover" />
      </motion.div>
      <h3 className="text-3xl font-display font-black text-white tracking-tight leading-tight mb-5">
        {language === 'ko' ? titleKo : titleEn}
      </h3>
      <p className="text-base text-zinc-400 mb-12 leading-relaxed max-w-[280px] font-korean">
        {language === 'ko' ? descKo : descEn}
      </p>

      <div className="w-full mt-auto">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={nextAction}
          className="w-full relative overflow-hidden bg-white text-black py-5 rounded-full font-black uppercase text-xs tracking-[0.15em] transition-colors shadow-[0_10px_20px_rgba(255,255,255,0.1)] group"
        >
          <span className="relative z-10">
            {isLast ? (language === 'ko' ? '시작하기!' : 'Get Started!') : (language === 'ko' ? '다음' : 'Next')}
          </span>
          <div className="absolute inset-0 bg-black/5 translate-y-full group-hover:translate-y-0 transition-transform duration-200" />
        </motion.button>
        
        <div className="flex justify-center gap-3 mt-8">
          {[0, 1, 2, 3, 4].map(i => (
            <motion.div 
              key={i}
              layout
              className={`h-1.5 rounded-full transition-colors \${step === i ? 'bg-orange-500 w-8' : 'bg-white/20 w-1.5'}`} 
            />
          ))}
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl"
      />
      
      {/* Outer Shell Double-Bezel */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={transitionSpring}
        className="relative w-full max-w-[420px] h-[750px] max-h-[90vh] bg-white/5 ring-1 ring-white/10 p-2 sm:p-2.5 rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.8)]"
      >
        {/* Inner Core */}
        <div className="relative w-full h-full bg-[#050505] rounded-[2.5rem] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden flex flex-col">
          {step < 5 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute top-6 left-6 z-50"
            >
              <button 
                onClick={onSkip}
                className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-bold px-4 py-1.5 rounded-full backdrop-blur-md transition-all tracking-widest uppercase border border-white/5 hover:border-white/20 shadow-lg"
              >
                {language === 'ko' ? '건너뛰기' : 'Skip'}
              </button>
            </motion.div>
          )}
          {step === 0 && (
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              className="absolute top-6 right-6 z-50"
            >
              <button 
                onClick={() => setLanguage(language === 'ko' ? 'en' : 'ko')}
                className="bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md transition-all tracking-wider border border-white/5 hover:border-white/20 flex items-center gap-1.5 shadow-lg"
              >
                <span className="text-[12px]">{language === 'ko' ? '🇺🇸' : '🇰🇷'}</span>
                <span>{language === 'ko' ? 'ENG' : '한국어'}</span>
              </button>
            </motion.div>
          )}
          <AnimatePresence mode="wait">
            {step === 0 && renderEducationalStep(
              '/assets/slide1_welcome_mascot.png',
              '체키에 오신 것을 환영합니다',
              'Welcome to Chekki',
              '우리 아이의 완벽한 AI 영어 튜터를 만나보세요.',
              "Meet your child's new personal AI English Tutor.",
              () => setStep(1)
            )}
            {step === 1 && renderEducationalStep(
              '/assets/onboarding_icon_grader_1782545224150.png',
              '찰칵! 1초 채점',
              'Instant Grader',
              '아이가 푼 문제집을 촬영하세요. AI가 손글씨를 인식해 즉시 채점하고 정답을 알려줍니다.',
              'Take a picture of the homework. Chekki will instantly grade their handwriting and show you the answers.',
              () => setStep(2)
            )}
            {step === 2 && renderEducationalStep(
              '/assets/onboarding_icon_dashboard_1782545238800.png',
              '자동 오답 노트',
              'Learning Dashboard',
              '틀린 문제는 자동으로 학습 대시보드에 저장됩니다. 번거롭게 따로 기록할 필요가 없어요.',
              'Wrong answers are automatically saved to your Dashboard. No need to manually keep track.',
              () => setStep(3)
            )}
            {step === 3 && renderEducationalStep(
              '/assets/onboarding_icon_loop_1782545249835.png',
              '스마트 맞춤 학습지',
              'Smart Practice Sheets',
              '저장된 오답을 모아 맞춤형 복습 프린트물을 만들어주세요. 빈틈없는 영어 학습이 완성됩니다.',
              'Generate practice worksheets from their mistakes. Close the learning gap easily and effectively.',
              () => setStep(4)
            )}
            {step === 4 && renderEducationalStep(
              '/assets/bento_speed_mode.png',
              '빠른 채점 & AI 튜터',
              'Speed Grading & AI Tutor',
              '빠른 채점 모드로 즉시 채점하거나, 튜터 모드로 맞춤형 개인 과외 선생님이 되게 하세요.',
              `Choose "Speed Mode" to instantly grade handwriting. Or let the AI tailor its vocabulary and be your child's personal tutor in "Tutor Mode".`,
              () => setStep(5)
            )}
            {step === 5 && renderProfileForm()}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
