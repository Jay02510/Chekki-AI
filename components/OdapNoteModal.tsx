import React, { useState, useRef } from 'react';
import { useMistakes } from '../contexts/MistakeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useToast } from '../contexts/ToastContext';
import { Share } from '@capacitor/share';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Capacitor } from '@capacitor/core';
import { toJpeg } from 'html-to-image';
import { motion, AnimatePresence } from 'framer-motion';
import { useDialogA11y } from '../hooks/useDialogA11y';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface Props {
  isNight?: boolean;
}

export const OdapNoteModal: React.FC<Props> = ({ isNight = true }) => {
  const { mistakes, showMistakeModal, setShowMistakeModal, removeMistake } = useMistakes();
  const { t, language } = useLanguage();
  const { showToast } = useToast();

  const [particles, setParticles] = useState<Particle[]>([]);
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const dialogRef = useDialogA11y<HTMLDivElement>({
    isOpen: showMistakeModal,
    onClose: () => setShowMistakeModal(false),
  });

  if (!showMistakeModal) return null;

  const triggerConfetti = (e: React.MouseEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const colors = ['#F97316', '#EC4899', '#8B5CF6', '#10B981', '#F59E0B'];
    const newParticles: Particle[] = [];

    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: centerX,
        y: centerY,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);

    setTimeout(() => {
      setParticles([]);
    }, 1000);
  };

  const handleMastery = (id: string, e: React.MouseEvent) => {
    triggerConfetti(e);
    setTimeout(() => {
      removeMistake(id);
    }, 300);
  };

  const handlePrint = async () => {
    if (mistakes.length === 0) return;
    setIsPrinting(true);

    await new Promise((resolve) => setTimeout(resolve, 300));

    try {
      if (Capacitor.isNativePlatform()) {
        if (!printRef.current) return;

        const dataUrl = await toJpeg(printRef.current, {
          quality: 0.95,
          backgroundColor: '#ffffff',
          pixelRatio: 2,
        });

        const base64Data = dataUrl.split('base64,')[1];
        const fileName = `chekki-review-${Date.now()}.jpg`;

        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache,
        });

        await Share.share({
          title: t('review_title'),
          text: t('print_footer'),
          files: [savedFile.uri],
        });
      } else {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (doc) {
          doc.write(`
            <html>
              <head>
                <title>Chekki - Review Sheet</title>
                <style>
                  body { font-family: 'Helvetica', 'Apple SD Gothic Neo', sans-serif; padding: 40px; color: #333; }
                  .header { text-align: center; margin-bottom: 40px; border-bottom: 3px solid #f97316; padding-bottom: 20px; }
                  .logo { font-size: 24px; font-weight: bold; color: #f97316; }
                  .title { font-size: 32px; font-weight: 900; margin: 10px 0; }
                  .subtitle { color: #666; font-style: italic; }
                  .grid { display: grid; grid-template-columns: 1fr; gap: 20px; }
                  .item { border: 1px solid #ddd; padding: 20px; border-radius: 12px; background: #fafafa; page-break-inside: avoid; }
                  .question-label { font-size: 12px; font-weight: bold; color: #999; text-transform: uppercase; letter-spacing: 1px; }
                  .question { font-size: 20px; font-weight: bold; margin: 5px 0 15px 0; }
                  .answer-box { background: white; border: 2px dashed #cbd5e1; padding: 20px; border-radius: 8px; margin-top: 10px; min-height: 80px; position: relative; }
                  .answer-label { font-size: 12px; color: #9ca3af; margin-bottom: 5px; font-weight: 500; }
                  .answer-footer { display: flex; justify-content: flex-end; margin-top: 8px; }
                  .answer { color: #f97316; font-weight: bold; font-size: 11px; transform: rotate(180deg); display: inline-block; opacity: 0.6; }
                  .tip { margin-top: 15px; font-size: 14px; color: #666; font-style: italic; border-left: 3px solid #f97316; padding-left: 10px; line-height: 1.5; }
                  .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #aaa; }
                  @media print {
                    body { padding: 0; }
                    .item { border: 1px solid #eee; }
                  }
                </style>
              </head>
              <body>
                <div class="header">
                  <div class="logo">Chekki AI</div>
                  <div class="title">${t('review_title')}</div>
                  <div class="subtitle">${language === 'ko' ? '오늘도 한 걸음 더 성장했어요!' : 'Growing every day!'}</div>
                </div>
                <div class="grid">
                  ${mistakes
                    .map(
                      (m) => `
                    <div class="item">
                      <div class="question-label">${t('lbl_question')}</div>
                      <div class="question">\${m.question_text}</div>
                      <div class="answer-box"><div class="answer-label">${t('lbl_write_answer')}</div></div>
                      <div class="answer-footer"><div class="answer">(${t('lbl_correct_answer')} \${m.correct_answer})</div></div>
                      <div class="tip"><strong>${t('lbl_mom_tip')}</strong> \${language === 'ko' ? m.teaching_script_ko : m.teaching_script_en || m.teaching_script_ko}</div>
                    </div>
                  `
                    )
                    .join('')}
                </div>
                <div class="footer">${t('print_footer')}</div>
              </body>
            </html>
          `);
          doc.close();

          iframe.contentWindow?.focus();
          setTimeout(() => {
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
          }, 500);
        }
      }
    } catch (err) {
      console.error('Print failed:', err);
      showToast({ type: 'error', message: language === 'ko'
        ? '인쇄에 실패했습니다. 다시 시도해 주세요.'
        : 'Print failed. Please try again.'
      });
    } finally {
      setIsPrinting(false);
    }
  };

  // Emil Custom Spring
  const transitionSpring = {
    type: 'spring' as const,
    damping: 24,
    stiffness: 200,
  };

  return (
    <>
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            animate={{
              opacity: 0,
              scale: 0,
              x: (Math.random() - 0.5) * 200,
              y: (Math.random() - 1) * 200,
            }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="fixed w-2 h-2 rounded-full pointer-events-none z-[400]"
            style={{ left: p.x, top: p.y, backgroundColor: p.color }}
          />
        ))}
      </AnimatePresence>

      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
          onClick={() => setShowMistakeModal(false)}
        />

        {/* Double-Bezel Modal Shell */}
        <motion.div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={t('review_title')}
          tabIndex={-1}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={transitionSpring}
          className="relative w-full max-w-[800px] max-h-[90vh] bg-white/5 ring-1 ring-white/10 p-2 sm:p-3 rounded-[2.5rem] shadow-[0_0_80px_rgba(0,0,0,0.8)]"
        >
          {/* Inner Core */}
          <div className="relative h-full max-h-[calc(90vh-1.5rem)] flex flex-col bg-brand-dark rounded-[2rem] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)] overflow-hidden">
            {/* Header */}
            <div className="flex-none p-6 sm:p-10 flex justify-between items-start z-10 bg-gradient-to-b from-brand-dark to-transparent">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, ...transitionSpring }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 ring-1 ring-white/10 mb-4"
                >
                  <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    {t('review_title')}
                  </span>
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, ...transitionSpring }}
                  className="text-4xl sm:text-5xl font-display font-black tracking-tight text-white"
                >
                  Learning
                  <br />
                  <span className="text-zinc-500">Dashboard</span>
                </motion.h2>
              </div>

              <motion.button
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowMistakeModal(false)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 ring-1 ring-white/10 flex items-center justify-center transition-colors cursor-pointer"
              >
                <svg
                  className="w-5 h-5 text-zinc-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </motion.button>
            </div>

            {/* Bento Grid Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-10 pb-40 custom-scrollbar relative z-0">
              {mistakes.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="h-full min-h-[40vh] flex flex-col items-center justify-center text-center"
                >
                  <div className="w-24 h-24 rounded-full bg-white/5 ring-1 ring-white/10 flex items-center justify-center mb-8 shadow-inner">
                    <span className="text-4xl opacity-50 grayscale">🚩</span>
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-3">
                    {t('review_empty_title')}
                  </h3>
                  <p className="text-zinc-500 max-w-sm leading-relaxed text-sm">
                    {t('review_empty_desc')}
                  </p>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                  <AnimatePresence mode="popLayout">
                    {mistakes.map((item, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                        transition={{
                          layout: { type: 'spring', bounce: 0.2, duration: 0.6 },
                          opacity: { duration: 0.2 },
                          delay: index * 0.05,
                        }}
                        key={item.uniqueId}
                        className={`\${index === 0 && mistakes.length > 1 ? 'md:col-span-2 md:flex-row md:items-center' : 'flex-col'} group relative flex gap-6 p-1.5 rounded-[1.75rem] bg-white/5 ring-1 ring-white/10 overflow-hidden`}
                      >
                        {/* Inner Core of Bento Card */}
                        <div
                          className={`\${index === 0 && mistakes.length > 1 ? 'md:flex-row md:items-center' : 'flex-col'} relative flex-1 bg-[#0f1014] rounded-[1.5rem] p-6 sm:p-8 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] flex gap-6`}
                        >
                          <div className="flex-1">
                            <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-widest mb-4">
                              {t('lbl_question')}
                            </span>
                            <h4 className="text-lg sm:text-xl font-medium text-white mb-6 leading-snug">
                              {item.question_text}
                            </h4>

                            <div className="p-4 rounded-2xl bg-black/50 ring-1 ring-white/5">
                              <span className="text-[10px] text-zinc-500 uppercase tracking-widest block mb-1">
                                {t('lbl_correct_answer')}
                              </span>
                              <p className="text-emerald-400 font-hand text-2xl font-bold tracking-wide">
                                {item.correct_answer}
                              </p>
                            </div>

                            {item.korean_guide && (
                              <p className="text-zinc-500 text-sm mt-6 leading-relaxed font-korean">
                                <span className="text-white/40 block mb-1 text-xs">
                                  {t('lbl_mom_tip')}
                                </span>
                                {item.korean_guide}
                              </p>
                            )}
                          </div>

                          <div
                            className={`\${index === 0 && mistakes.length > 1 ? 'md:self-end md:w-auto w-full mt-4 md:mt-0' : 'w-full mt-4'}`}
                          >
                            <motion.button
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={(e) => handleMastery(item.uniqueId, e as any)}
                              className="w-full group/btn cursor-pointer relative flex items-center justify-between px-6 py-4 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-2xl font-bold transition-colors ring-1 ring-emerald-500/20"
                            >
                              <span>Mastered</span>
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center transition-transform group-hover/btn:translate-x-1 group-hover/btn:-translate-y-px">
                                ✓
                              </div>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Massive Floating Print CTA */}
            <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 bg-gradient-to-t from-brand-dark via-brand-dark to-transparent pointer-events-none flex justify-center z-20">
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, ...transitionSpring }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePrint}
                disabled={mistakes.length === 0 || isPrinting}
                className="pointer-events-auto cursor-pointer group relative flex items-center gap-4 px-8 py-5 rounded-full bg-white disabled:bg-zinc-800 disabled:text-zinc-500 text-black font-bold tracking-wide shadow-[0_20px_40px_rgba(255,255,255,0.15)] disabled:shadow-none transition-colors"
              >
                {isPrinting ? (
                  <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                    />
                  </svg>
                )}
                <span>
                  {isPrinting
                    ? language === 'ko'
                      ? '준비 중...'
                      : 'Preparing...'
                    : t('review_print_btn')}
                </span>

                {/* Button-in-Button pattern */}
                {!isPrinting && mistakes.length > 0 && (
                  <div className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center transition-transform group-hover:translate-x-1 group-hover:-translate-y-px">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </div>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Hidden Printable Container for Native Share */}
        <div
          style={{
            position: 'absolute',
            left: '-9999px',
            top: 0,
            width: '800px',
            background: 'white',
            padding: '40px',
            color: '#333',
            fontFamily: 'Helvetica, sans-serif',
          }}
          ref={printRef}
        >
          <div
            style={{
              textAlign: 'center',
              marginBottom: '40px',
              borderBottom: '3px solid #f97316',
              paddingBottom: '20px',
            }}
          >
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f97316' }}>Chekki AI</div>
            <div style={{ fontSize: '32px', fontWeight: '900', margin: '10px 0' }}>
              {t('review_title')}
            </div>
            <div style={{ color: '#666', fontStyle: 'italic' }}>
              {language === 'ko' ? '오늘도 한 걸음 더 성장했어요!' : 'Growing every day!'}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '20px' }}>
            {mistakes.map((m, idx) => (
              <div
                key={idx}
                style={{
                  border: '1px solid #ddd',
                  padding: '20px',
                  borderRadius: '12px',
                  background: '#fafafa',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#999',
                    textTransform: 'uppercase',
                    letterSpacing: '1px',
                  }}
                >
                  {t('lbl_question')}
                </div>
                <div style={{ fontSize: '20px', fontWeight: 'bold', margin: '5px 0 15px 0' }}>
                  {m.question_text}
                </div>
                <div
                  style={{
                    background: 'white',
                    border: '2px dashed #cbd5e1',
                    padding: '20px',
                    borderRadius: '8px',
                    marginTop: '10px',
                    minHeight: '80px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#9ca3af',
                      marginBottom: '5px',
                      fontWeight: '500',
                    }}
                  >
                    {t('lbl_write_answer')}
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '8px' }}>
                  <div
                    style={{
                      color: '#f97316',
                      fontWeight: 'bold',
                      fontSize: '11px',
                      transform: 'rotate(180deg)',
                      display: 'inline-block',
                    }}
                  >
                    ({t('lbl_correct_answer')} {m.correct_answer})
                  </div>
                </div>
                <div
                  style={{
                    marginTop: '15px',
                    fontSize: '14px',
                    color: '#666',
                    fontStyle: 'italic',
                    borderLeft: '3px solid #f97316',
                    paddingLeft: '10px',
                    lineHeight: '1.5',
                  }}
                >
                  <strong>{t('lbl_mom_tip')}</strong>{' '}
                  {language === 'ko'
                    ? m.teaching_script_ko
                    : m.teaching_script_en || m.teaching_script_ko}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '50px', textAlign: 'center', fontSize: '12px', color: '#aaa' }}>
            {t('print_footer')}
          </div>
        </div>
      </div>
    </>
  );
};
