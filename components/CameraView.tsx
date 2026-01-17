
import React, { useRef, useState, useEffect } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';
import { LegalModal } from './LegalModal';

interface Props {
  onImageSelected: (base64: string) => void;
  isNight?: boolean;
}

export const CameraView: React.FC<Props> = ({ onImageSelected, isNight = false }) => {
  const { user, openLoginModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [imgError, setImgError] = useState(false);
  const [mascotLoaded, setMascotLoaded] = useState(false);
  
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  
  const { t, language } = useLanguage();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Url = await compressImage(file);
      const base64Data = base64Url.split(',')[1];
      onImageSelected(base64Data);
    } catch (e) {
      console.error("Image processing failed."); 
      alert("Error processing image. Please try another photo.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) processFile(e.target.files[0]);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation(); setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]);
  };

  const ClarityGuide = () => (
    <div className="flex gap-2 mt-4 mb-2 overflow-x-auto pb-2 no-scrollbar px-2">
      {[
        { icon: '☀️', text: language === 'ko' ? '밝은 곳에서' : 'Good Lighting' },
        { icon: '📏', text: language === 'ko' ? '수평 맞춰서' : 'Hold Flat' },
        { icon: '🔍', text: language === 'ko' ? '초점 선명하게' : 'Stay Sharp' }
      ].map((tip, i) => (
        <div key={i} className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-3 py-1.5 rounded-full shrink-0">
          <span className="text-xs">{tip.icon}</span>
          <span className="text-[10px] font-bold text-zinc-400 whitespace-nowrap">{tip.text}</span>
        </div>
      ))}
    </div>
  );

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => (
    <div className={`relative w-full ${size === 'large' ? 'min-h-[300px] h-auto md:min-h-[400px]' : 'h-[500px]'} perspective-1000 transition-all duration-700 ease-out py-4 md:py-8`}>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border ${isNight ? 'border-indigo-500/10' : 'border-white/5'} rounded-full animate-[spin_20s_linear_infinite] pointer-events-none`}></div>
      <div 
        role="button"
        aria-label="Upload Worksheet"
        className={`relative w-full h-full max-w-2xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/60'} backdrop-blur-2xl rounded-[2rem] md:rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center justify-center p-6 md:p-10 group cursor-pointer overflow-hidden
          ${dragActive ? 'border-brand-orange shadow-[0_0_50px_rgba(249,115,22,0.3)] scale-[1.02]' : 'border-white/10 shadow-2xl hover:border-white/30 hover:shadow-brand-orange/10'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
          <div className={`absolute inset-0 bg-gradient-to-br ${isNight ? 'from-indigo-500/10 to-purple-500/10' : 'from-brand-orange/5 to-brand-purple/5'} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`${size === 'large' ? 'w-32 h-32 md:w-56 md:h-56' : 'w-40 h-40'} mb-4 md:mb-6 relative transition-transform duration-500 group-hover:scale-105`}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-12 h-12 md:w-16 md:h-16 border-4 ${isNight ? 'border-indigo-500' : 'border-brand-orange'} border-t-transparent rounded-full animate-spin`}></div>
                  </div>
                ) : (
                  <div className="w-full h-full animate-float flex items-center justify-center">
                    {!imgError ? (
                       <img 
                        src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} 
                        alt="Chekki Mascot" 
                        className={`w-full h-full object-contain drop-shadow-2xl filter brightness-110 ${isNight ? 'scale-[1.5] md:scale-[1.8]' : ''} transition-opacity duration-500 ${mascotLoaded ? 'opacity-100' : 'opacity-0'}`} 
                        onLoad={() => setMascotLoaded(true)}
                        onError={() => setImgError(true)}
                        loading="eager"
                       />
                    ) : (
                       <ChekkiMascot className="w-full h-full drop-shadow-2xl filter brightness-110" mood={isNight ? "sleeping" : "happy"} />
                    )}
                    {!mascotLoaded && !imgError && <div className="absolute inset-0 bg-white/5 rounded-full animate-pulse"></div>}
                  </div>
                )}
            </div>
            <h3 className="text-xl md:text-3xl font-bold text-white mb-2 font-display break-keep">
              {isProcessing ? t('processing') : t('drop_title')}
            </h3>
            <p className="text-zinc-500 font-medium font-korean text-base md:text-lg break-keep leading-tight">{t('drop_subtitle')}</p>
            
            <ClarityGuide />

            <div className="mt-6 md:mt-8 flex flex-col items-center gap-3 group/btn">
                <div className={`w-12 h-12 md:w-14 md:h-14 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-lg group-hover/btn:${isNight ? 'bg-indigo-600' : 'bg-brand-orange'} group-hover/btn:border-white group-hover/btn:scale-110 transition-all duration-300`}>
                    <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-[10px] md:text-xs font-black text-zinc-400 uppercase tracking-widest group-hover/btn:text-white transition-colors">{t('btn_upload')}</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
      </div>
    </div>
  );

  const BetaBanner = () => (
    <div 
      role="button"
      aria-label="Submit Feedback"
      onClick={() => setShowFeedbackModal(true)}
      className="group cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-4 rounded-[2rem] flex items-center gap-4 transition-all animate-fade-in-up shadow-2xl backdrop-blur-md mb-8 md:mb-10 ring-1 ring-white/5 hover:ring-orange-500/50"
    >
       <div className={`w-8 h-8 md:w-10 md:h-10 rounded-xl flex-shrink-0 ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-lg animate-pulse shadow-inner`}>✨</div>
       <div className="flex-1 min-w-0">
          <p className={`text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-0.5`}>Beta Community</p>
          <p className="text-xs md:text-base font-bold text-zinc-200 font-korean group-hover:text-white transition-colors leading-tight truncate">
            {t('beta_banner')}
          </p>
       </div>
       <span className={`${isNight ? 'text-indigo-400' : 'text-orange-500'} ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-black`}>→</span>
    </div>
  );

  if (user) {
    const remaining = user.plan === 'pro' ? '∞' : Math.max(0, user.maxScansPerDay - user.scansUsedToday);
    return (
      <div className="min-h-full pt-12 md:pt-28 pb-12 px-4 md:px-6 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        <div className="w-full max-w-3xl flex flex-col items-center text-center mb-8 md:mb-10 gap-4 md:gap-6">
           <div className="space-y-1 md:space-y-2">
              <h1 className="text-3xl md:text-6xl font-black text-white font-display break-keep leading-[1.15]">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-korean text-base md:text-xl max-w-lg mx-auto leading-relaxed break-keep">{t('dash_subtitle')}</p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-3 md:gap-4">
              <div className="bg-[#0F1014] border border-white/10 rounded-full py-1.5 px-5 md:py-2 md:px-6 flex items-center gap-2 md:gap-3 shadow-lg">
                  <div className="text-[9px] md:text-[10px] text-zinc-500 uppercase font-black tracking-widest">{language === 'ko' ? "오늘 남은 마법" : "Magic Left Today"}</div>
                  <div className="w-px h-3 md:h-4 bg-white/10"></div>
                  <div className="font-bold text-white text-base md:text-xl font-display leading-none">{remaining}</div>
              </div>
           </div>
        </div>
        
        <div className="w-full max-w-2xl animate-fade-in-up">
           <BetaBanner />
           <DropZone size="large" />
        </div>
        <p className="mt-6 md:mt-8 text-zinc-600 text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-full flex flex-col pt-12 md:pt-24 pb-12 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      {showLegal && <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />}
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-10 lg:gap-8 items-center mb-12 md:mb-16">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/20'} rounded-full blur-[120px] -z-10 pointer-events-none opacity-50 mix-blend-screen`}></div>
        <div className="w-full flex flex-col items-start text-left z-10 animate-fade-in-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-3 py-1 md:px-4 md:py-1.5 rounded-full border border-white/10 bg-white/5 mb-6 backdrop-blur-sm shadow-xl self-start ring-1 ring-white/10">
            <span className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${isNight ? 'bg-indigo-500' : 'bg-brand-orange'} animate-pulse shadow-[0_0_8px_rgba(249,115,22,0.6)]`}></span>
            <span className="text-[9px] md:text-xs font-black text-zinc-200 tracking-widest uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white font-display mb-6 md:mb-8 tracking-tighter text-left drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                  <>숙제 전쟁은 이제 끝, <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>아이와 웃으며 공부하세요</span></>
              ) : (
                  <>Homework Stress? <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Just Snap a Photo.</span></>
              )
            )}
          </h1>
          <p className="text-base md:text-xl text-zinc-400 max-w-lg leading-relaxed mb-8 md:mb-10 font-korean text-left font-medium break-keep">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          <div className="flex flex-wrap gap-4 justify-start">
            <button onClick={openLoginModal} className="group relative bg-white text-black px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-base md:text-xl transition-all transform active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.2)] font-display flex items-center gap-3 overflow-hidden">
              <span className="relative font-korean whitespace-nowrap">{t('hero_cta_btn')}</span> 
              <span className="text-xl md:text-2xl relative transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
        
        {/* Mascot */}
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2">
            <div className="relative w-full max-w-[260px] md:max-w-[400px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[80px] animate-pulse`}></div>
                <div className="w-full h-full relative z-10 transition-transform scale-100 md:scale-105">
                   <img 
                    src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} 
                    alt="Chekki Hero" 
                    className="w-full h-full object-contain drop-shadow-2xl animate-float filter brightness-110" 
                   />
                </div>
            </div>
        </div>
      </div>

      {/* Why Chekki Section */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-3xl md:text-5xl font-black text-white text-center mb-12 font-display break-keep">{t('diff_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md min-h-[200px]">
                  <div className="text-3xl mb-4">✍️</div>
                  <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('diff_ocr')}</h3>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-korean break-keep">{t('diff_ocr_desc')}</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/10 p-8 rounded-[2.5rem] backdrop-blur-md min-h-[200px]">
                  <div className="text-3xl mb-4">💌</div>
                  <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('diff_script')}</h3>
                  <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-korean break-keep">{t('diff_script_desc')}</p>
              </div>
          </div>
      </div>

      {/* Trust & Privacy Section */}
      <div className="bg-white/5 border-y border-white/5 py-20 mb-24 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 font-display break-keep">{t('trust_title')}</h2>
            <div className="grid md:grid-cols-2 gap-12 mt-12">
                <div className="space-y-4">
                    <div className="text-emerald-500 text-4xl">🔒</div>
                    <h3 className="text-xl font-bold text-white font-korean">{t('trust_privacy')}</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto font-korean break-keep">{t('trust_privacy_desc')}</p>
                </div>
                <div className="space-y-4">
                    <div className="text-orange-500 text-4xl">👨‍👩‍👧</div>
                    <h3 className="text-xl font-bold text-white font-korean">{t('trust_safety')}</h3>
                    <p className="text-zinc-400 text-sm max-w-sm mx-auto font-korean break-keep">{t('trust_safety_desc')}</p>
                </div>
            </div>
        </div>
      </div>

      {/* Three Step Process */}
      <div className="max-w-7xl mx-auto px-6 mb-24">
          <h2 className="text-2xl md:text-4xl font-black text-white text-center mb-16 font-display uppercase tracking-widest break-keep">{t('how_title')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                  { title: t('how_step1'), desc: t('how_step1_desc'), icon: '📸' },
                  { title: t('how_step2'), desc: t('how_step2_desc'), icon: '✨' },
                  { title: t('how_step3'), desc: t('how_step3_desc'), icon: '🗣️' }
              ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center text-center group min-h-[220px]">
                      <div className="w-20 h-20 md:w-24 md:h-24 rounded-[2rem] bg-white/5 border border-white/10 flex items-center justify-center text-3xl md:text-4xl mb-6 shadow-2xl backdrop-blur-md group-hover:scale-110 transition-transform">
                        {item.icon}
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-white mb-3 font-korean">{item.title}</h3>
                      <p className="text-zinc-500 font-korean text-sm md:text-base leading-relaxed break-keep max-w-[240px]">
                        {item.desc}
                      </p>
                  </div>
              ))}
          </div>
      </div>

      {/* Final CTA Section */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
          <div className="relative w-full rounded-[2.5rem] md:rounded-[3rem] overflow-hidden bg-gradient-to-r from-brand-orange via-[#EC4899] to-brand-purple shadow-[0_40px_100px_rgba(249,115,22,0.3)]">
              <div className="absolute top-0 right-0 w-1/2 h-full bg-white/5 blur-[80px] pointer-events-none"></div>
              
              <div className="relative z-10 w-full h-full flex flex-col lg:flex-row items-center p-8 md:p-12 lg:p-16">
                  <div className="w-full lg:max-w-xl text-left">
                      <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 font-display tracking-tight leading-[1] drop-shadow-2xl break-keep">
                          {t('hero_cta_title')}
                      </h2>
                      <p className="text-white font-korean text-lg md:text-xl mb-8 leading-relaxed break-keep font-bold opacity-90 max-w-sm drop-shadow-lg">
                          {t('hero_cta_desc')}
                      </p>
                      <button 
                        onClick={openLoginModal} 
                        className="group relative bg-white text-brand-orange px-10 py-4 md:px-12 md:py-5 rounded-[1.5rem] font-black text-base md:text-2xl transition-all transform active:scale-95 shadow-2xl font-display flex items-center justify-center gap-3 md:gap-4 hover:shadow-white/40 whitespace-nowrap w-fit"
                      >
                          <span className="font-korean">{t('hero_cta_btn')}</span>
                          <span className="text-xl md:text-3xl transition-transform group-hover:translate-x-2">→</span>
                      </button>
                  </div>
                  
                  <div className="hidden lg:flex flex-1 justify-end items-center h-full relative pointer-events-none">
                       <div className="relative w-full max-w-[600px] aspect-square animate-float">
                            <div className="absolute inset-0 bg-white/20 blur-[120px] rounded-full scale-125 opacity-40"></div>
                            <img 
                              src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-logo_q5xeux.png" 
                              alt="Chekki Happy Mascot" 
                              className="w-full h-full object-contain filter drop-shadow-2xl transform scale-[1.8] translate-x-12 translate-y-4" 
                            />
                       </div>
                  </div>
              </div>
          </div>
          
          {/* Footer Section */}
          <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-0 pb-8">
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <h4 className="text-lg font-black text-white font-display mb-1">
                    Chekki<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">AI</span>
                  </h4>
                  <p className="text-zinc-500 text-[9px] md:text-[10px] font-bold font-korean tracking-tight uppercase break-keep">
                    {t('footer_text')}
                  </p>
              </div>
              
              <div className="flex flex-wrap justify-center gap-6 md:gap-10 text-[10px] md:text-[11px] text-zinc-400 font-black uppercase tracking-[0.2em]">
                  <button onClick={() => setShowLegal('privacy')} className="hover:text-white transition-colors cursor-pointer">PRIVACY</button>
                  <button onClick={() => setShowLegal('terms')} className="hover:text-white transition-colors cursor-pointer">TERMS</button>
                  <a href="mailto:chekkihelp@gmail.com" className="hover:text-white transition-colors cursor-pointer">SUPPORT</a>
              </div>
          </div>
      </div>
    </div>
  );
};
