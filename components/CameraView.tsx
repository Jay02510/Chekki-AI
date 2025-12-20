
import React, { useRef, useState } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';

interface Props {
  onImageSelected: (base64: string) => void;
}

export const CameraView: React.FC<Props> = ({ onImageSelected }) => {
  const { user, openLoginModal } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { t, language } = useLanguage();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Url = await compressImage(file, 1024, 0.85);
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

  const DropZone = ({ size = "large" }: { size?: "large" | "compact" }) => (
    <div className={`relative w-full ${size === 'large' ? 'h-[500px]' : 'h-[550px]'} perspective-1000 transition-all duration-700 ease-out`}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border border-white/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] border border-white/10 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
      <div 
        className={`absolute inset-4 md:inset-6 bg-[#0F1014]/80 backdrop-blur-2xl rounded-3xl border transition-all duration-500 flex flex-col items-center justify-center p-8 group cursor-pointer overflow-hidden
          ${dragActive ? 'border-brand-orange shadow-[0_0_50px_rgba(249,115,22,0.3)] scale-[1.02]' : 'border-white/10 shadow-2xl hover:border-white/30 hover:shadow-brand-orange/10 hover:-translate-y-1'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
          <div className="absolute inset-0 bg-gradient-to-br from-brand-orange/5 to-brand-purple/5 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`${size === 'large' ? 'w-64 h-64' : 'w-48 h-48'} mb-6 relative transition-transform duration-500 group-hover:scale-110`}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <div className="w-full h-full animate-float flex items-center justify-center">
                    {!imgError ? (
                       <img src={ASSETS.MASCOT_HAPPY} alt="Chekki Happy" className="w-full h-full object-contain drop-shadow-2xl filter brightness-110" onError={() => setImgError(true)}/>
                    ) : (
                       <ChekkiMascot className="w-full h-full drop-shadow-2xl filter brightness-110" mood="happy" />
                    )}
                  </div>
                )}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/50 blur-lg rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
            </div>
            <h3 className={`${size === 'large' ? 'text-4xl' : 'text-2xl'} font-bold text-white mb-3 font-display`}>
              {isProcessing ? t('processing') : t('drop_title')}
            </h3>
            <p className="text-zinc-500 font-medium font-korean text-xl">{t('drop_subtitle')}</p>
            <div className="mt-8 flex flex-col items-center gap-3 group/btn">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-lg group-hover/btn:bg-brand-orange group-hover/btn:border-white group-hover/btn:scale-110 transition-all duration-300">
                    <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest group-hover/btn:text-white transition-colors">Upload Image</span>
            </div>
          </div>
          <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} disabled={isProcessing} />
      </div>
    </div>
  );

  if (user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        <div className="w-full max-w-3xl flex flex-col items-center text-center mb-10 gap-6">
           <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white font-display mb-3">
                {t('dash_welcome')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-korean text-xl max-w-lg mx-auto leading-relaxed">{t('dash_subtitle')}</p>
           </div>
           <div className="bg-[#0F1014] border border-white/10 rounded-full py-2 px-6 flex items-center gap-3 shadow-lg">
               <div className="text-xs text-zinc-500 uppercase font-bold tracking-wider">{t('scans_left')}</div>
               <div className="w-px h-4 bg-white/10"></div>
               <div className="font-bold text-white text-xl font-display">{user.plan === 'pro' ? '∞' : (user.maxScans - user.scansUsed)}</div>
           </div>
        </div>
        <div className="w-full max-w-2xl animate-fade-in-up mb-12" style={{ animationDelay: '0.1s' }}>
           <DropZone size="large" />
        </div>
        <p className="mt-8 text-zinc-600 text-sm font-display text-center">{t('supported_formats')}</p>
        <div className="mt-12 text-center border-t border-white/5 pt-8 w-full max-w-lg mx-auto">
            <p className="text-zinc-500 text-xs">Need help?</p>
            <a href="mailto:chekkihelp@gmail.com" className="text-zinc-400 text-sm font-bold hover:text-white hover:underline transition-colors">Contact Us: chekkihelp@gmail.com</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-32 md:pt-40 pb-12 overflow-x-hidden scroll-smooth">
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center mb-24 lg:mb-32">
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] bg-brand-purple/20 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50 mix-blend-screen"></div>
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-brand-orange/10 rounded-full blur-[120px] -z-10 pointer-events-none opacity-50 mix-blend-screen"></div>
        <div className="w-full flex flex-col items-start text-left z-10 animate-fade-in-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-sm transition-transform hover:scale-105 cursor-default self-start ring-1 ring-white/10 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
            <span className="text-[10px] md:text-xs font-bold text-zinc-200 tracking-widest uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-5xl md:text-7xl lg:text-[6.5rem] font-bold text-white font-display mb-8 tracking-tighter text-left drop-shadow-xl whitespace-pre-line leading-[1.1]">
            {language === 'ko' ? (
                <>우리 아이 영어 실력 <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">한 단계 더 높이기</span></>
            ) : (
                <>English Homework? <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">Just Snap a Photo.</span></>
            )}
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-lg leading-relaxed mb-10 font-korean text-left font-medium">{t('hero_desc')}</p>
          <div className="flex flex-wrap gap-4 justify-start">
            <button onClick={openLoginModal} className="group relative bg-white text-black px-10 py-5 rounded-full font-bold text-xl transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] font-display flex items-center gap-3 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-200/50 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-in-out"></div>
              <span className="relative font-korean">{t('onb_1_btn')}</span> 
              <span className="text-2xl relative transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2">
            <div className="relative w-full max-w-[750px] aspect-square flex items-center justify-center lg:-mr-20">
                <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/20 to-brand-purple/20 rounded-full blur-[80px] animate-pulse"></div>
                <img src={ASSETS.HERO_IMAGE} alt="Chekki Hero" className="w-full h-full object-contain drop-shadow-2xl animate-float relative z-10 scale-125"/>
            </div>
        </div>
      </div>

      <div className="bg-white/[0.02] border-y border-white/5 backdrop-blur-sm py-20 mb-20 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold text-orange-500 uppercase tracking-widest mb-3 animate-fade-in-up">{t('how_title')}</h2>
            <p className="text-3xl md:text-4xl font-bold text-white font-korean mb-16 animate-fade-in-up">{language === 'ko' ? "3단계로 끝내는 홈스쿨링" : "Done in 3 Simple Steps"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 border-t border-dashed border-zinc-600 -z-10"></div>
                <div className="flex flex-col items-center group animate-fade-in-up" style={{animationDelay: '0.1s'}}>
                    <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-orange-500/50"><span className="text-4xl group-hover:animate-wiggle">📸</span></div>
                    <div className="bg-zinc-900 text-zinc-500 text-xs font-bold px-3 py-1 rounded-full border border-zinc-800 mb-3">STEP 01</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('how_step1')}</h3>
                    <p className="text-zinc-400 font-korean text-sm">{t('how_step1_desc')}</p>
                </div>
                <div className="flex flex-col items-center group animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                    <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-purple-500/50"><span className="text-4xl group-hover:animate-pulse">✨</span></div>
                    <div className="bg-zinc-900 text-zinc-500 text-xs font-bold px-3 py-1 rounded-full border border-zinc-800 mb-3">STEP 02</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('how_step2')}</h3>
                    <p className="text-zinc-400 font-korean text-sm">{t('how_step2_desc')}</p>
                </div>
                <div className="flex flex-col items-center group animate-fade-in-up" style={{animationDelay: '0.3s'}}>
                    <div className="w-24 h-24 rounded-3xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-green-500/50"><span className="text-4xl group-hover:animate-bounce">🗣️</span></div>
                    <div className="bg-zinc-900 text-zinc-500 text-xs font-bold px-3 py-1 rounded-full border border-zinc-800 mb-3">STEP 03</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean">{t('how_step3')}</h3>
                    <p className="text-zinc-400 font-korean text-sm">{t('how_step3_desc')}</p>
                </div>
            </div>
         </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
        <div className="flex flex-col items-start mb-16 animate-fade-in-up" style={{animationDelay: '0.3s'}}>
           <div className="max-w-3xl text-left">
             <h2 className="text-4xl md:text-5xl font-bold font-korean text-white mb-6 leading-tight text-left">{language === 'ko' ? "왜 채키를 선택할까요?" : "Why Choose Chekki AI?"}</h2>
             <p className="text-zinc-400 text-lg font-korean text-left leading-relaxed">{t('hero_desc')}</p>
           </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(300px,auto)] animate-fade-in-up" style={{animationDelay: '0.4s'}}>
          <div className="md:col-span-7 bg-[#0F1014] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-brand-pink/50 transition-all duration-500 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(236,72,153,0.1)]">
             <div className="absolute top-0 right-0 p-32 bg-brand-pink/10 rounded-full blur-[80px] group-hover:bg-brand-pink/20 transition-all duration-700"></div>
             <div className="text-left relative z-10">
               <span className="text-6xl font-bold text-brand-pink/20 font-display block mb-6 transition-transform group-hover:translate-x-2 group-hover:text-brand-pink/80 duration-500">01</span>
               <h3 className="text-3xl font-bold text-white mb-4">{t('feat_vision_title')}</h3>
               <p className="text-zinc-400 text-base leading-relaxed font-korean">{t('feat_vision_desc')}</p>
             </div>
             <div className="mt-10 relative h-48 bg-zinc-950/50 rounded-2xl border border-white/5 overflow-hidden flex items-center justify-center group-hover:border-white/20 transition-colors">
                <svg className="w-32 h-40 drop-shadow-xl transform group-hover:scale-105 transition-transform duration-500" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="100" height="120" rx="4" fill="#FFFFFF" />
                  <rect x="10" y="10" width="40" height="8" rx="2" fill="#E5E7EB" />
                  <rect x="80" y="10" width="10" height="8" rx="2" fill="#F3F4F6" />
                  <rect x="10" y="30" width="80" height="2" rx="1" fill="#E5E7EB" />
                  <rect x="10" y="40" width="60" height="2" rx="1" fill="#E5E7EB" />
                  <rect x="10" y="55" width="80" height="30" rx="2" fill="#F3F4F6" />
                  <circle cx="50" cy="70" r="8" fill="#E5E7EB" />
                  <circle cx="90" cy="35" r="4" fill="#10B981" opacity="0.8" />
                  <path d="M88 35L89.5 36.5L92 33.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="90" cy="70" r="4" fill="#F97316" opacity="0.8" />
                  <path d="M88 70L89.5 71.5L92 68.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <div className="absolute inset-x-0 h-[2px] bg-brand-pink shadow-[0_0_15px_#EC4899] animate-[bounceSubtle_3s_infinite_linear] opacity-80 z-10" style={{ top: '50%' }}></div>
                <div className="absolute bottom-3 right-4 text-[10px] font-mono text-brand-pink/80 bg-black/50 px-2 py-0.5 rounded backdrop-blur-sm">{t('scan_loading_text')}</div>
             </div>
          </div>
          <div className="md:col-span-5 bg-[#0F1014] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-brand-purple/50 transition-all duration-500 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]">
             <div className="absolute bottom-0 left-0 p-24 bg-brand-purple/10 rounded-full blur-[60px]"></div>
             <div className="text-left relative z-10">
               <span className="text-5xl font-bold text-brand-purple/20 font-display block mb-4 transition-transform group-hover:translate-x-2 group-hover:text-brand-purple/80 duration-500">02</span>
               <h3 className="text-2xl font-bold text-white mb-3">{t('feat_audio')}</h3>
               <p className="text-zinc-400 text-base font-korean leading-relaxed">{t('feat_audio_desc')}</p>
             </div>
             <div className="mt-8 self-end w-32 h-32 rounded-full bg-black border border-white/10 flex items-center justify-center relative shrink-0 group-hover:scale-105 transition-transform shadow-lg">
                <div className="absolute inset-2 border-2 border-brand-purple rounded-full border-t-transparent animate-[spin_3s_linear_infinite]"></div>
                <span className="text-4xl group-hover:animate-pulse">🔊</span>
             </div>
          </div>
          <div className="md:col-span-5 bg-[#0F1014] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-brand-orange/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)] flex flex-col justify-between">
             <div className="absolute top-0 right-0 p-24 bg-brand-orange/10 rounded-full blur-[60px]"></div>
             <div className="text-left relative z-10">
                <span className="text-5xl font-bold text-brand-orange/20 font-display block mb-4 transition-transform group-hover:translate-x-2 group-hover:text-brand-orange/80 duration-500">03</span>
                <h3 className="text-2xl font-bold text-white mb-3">{t('review_title')}</h3>
                <p className="text-zinc-400 text-base font-korean mb-6 leading-relaxed">{t('feat_review_desc')}</p>
             </div>
             <div className="flex items-center gap-4 mt-auto">
               <div className="h-3 w-full bg-zinc-800 rounded-full overflow-hidden border border-white/5"><div className="h-full bg-gradient-to-r from-brand-orange to-red-500 w-3/4 group-hover:w-[85%] transition-all duration-1000"></div></div>
               <span className="text-sm text-brand-orange font-bold whitespace-nowrap">{t('growing_text')}</span>
             </div>
          </div>
          <div className="md:col-span-7 bg-[#0F1014] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-500 flex flex-col justify-between hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
             <div className="absolute top-0 right-0 p-32 bg-emerald-500/10 rounded-full blur-[80px] group-hover:bg-emerald-500/20 transition-all duration-700"></div>
             <div className="text-left relative z-10 flex flex-col h-full">
               <div className="flex justify-between items-start mb-6">
                   <div>
                        <span className="text-6xl font-bold text-emerald-500/20 font-display block mb-2 transition-transform group-hover:translate-x-2 group-hover:text-emerald-500/80 duration-500">04</span>
                        <h3 className="text-3xl font-bold text-white">{t('feat_privacy')}</h3>
                   </div>
                   <div className="w-16 h-16 bg-emerald-900/30 rounded-2xl flex items-center justify-center border border-emerald-500/30 shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                   </div>
               </div>
               <p className="text-zinc-400 text-base leading-relaxed font-korean mb-8">{t('feat_privacy_desc')}</p>
               <div className="mt-auto bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex items-center gap-4 backdrop-blur-sm">
                    <div className="flex -space-x-2">
                         <div className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center text-[10px]">☁️</div>
                         <div className="w-8 h-8 rounded-full bg-red-500/20 border-2 border-zinc-900 flex items-center justify-center text-[10px] text-red-500 font-bold">✕</div>
                    </div>
                    <div className="h-px flex-1 bg-zinc-700/50 relative"><div className="absolute inset-0 bg-gradient-to-r from-transparent via-zinc-500 to-transparent w-1/2 animate-[shimmer_2s_infinite]"></div></div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider"><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>Local Only</div>
               </div>
             </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20 border-t border-white/5">
         <h2 className="text-2xl font-bold text-center text-white mb-12 font-korean">"{t('test_title')}"</h2>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute -top-3 left-6 text-4xl text-zinc-700">❝</div>
                <p className="text-zinc-300 font-korean text-lg mb-6 pt-4 leading-relaxed">"{t('test_1_text')}"</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center text-xl">👩</div>
                    <div><div className="font-bold text-white text-sm font-korean">{t('test_1_name')}</div><div className="text-xs text-orange-500 font-bold">Verified User</div></div>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute -top-3 left-6 text-4xl text-zinc-700">❝</div>
                <p className="text-zinc-300 font-korean text-lg mb-6 pt-4 leading-relaxed">"{t('test_2_text')}"</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-200 flex items-center justify-center text-xl">👨</div>
                    <div><div className="font-bold text-white text-sm font-korean">{t('test_2_name')}</div><div className="text-xs text-orange-500 font-bold">Verified User</div></div>
                </div>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl relative hover:-translate-y-1 transition-transform duration-300">
                <div className="absolute -top-3 left-6 text-4xl text-zinc-700">❝</div>
                <p className="text-zinc-300 font-korean text-lg mb-6 pt-4 leading-relaxed">"{t('test_3_text')}"</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-purple-200 flex items-center justify-center text-xl">👩</div>
                    <div><div className="font-bold text-white text-sm font-korean">{t('test_3_name')}</div><div className="text-xs text-orange-500 font-bold">Verified User</div></div>
                </div>
            </div>
         </div>
      </div>

      {/* --- REFINED CTA SECTION --- */}
      <div className="relative w-full py-32 bg-zinc-950 border-t border-white/5 overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-orange/5"></div>
         <div className="max-w-6xl mx-auto px-6 relative z-10 animate-fade-in-up" style={{animationDelay: '0.5s'}}>
            <div className="grid md:grid-cols-[1.2fr_1fr] gap-12 items-center">
              <div className="flex flex-col items-start w-full text-left">
                <h2 className="text-5xl md:text-8xl font-black text-white font-korean mb-8 tracking-tighter leading-none">
                   {t('hero_cta_title')}
                </h2>
                <p className="text-zinc-400 font-korean text-2xl mb-12 max-w-lg leading-relaxed">
                   {t('hero_cta_desc')}
                </p>
                <button onClick={openLoginModal} className="bg-orange-500 hover:bg-orange-600 text-white px-16 py-6 rounded-full font-black text-2xl shadow-2xl shadow-orange-500/40 transition-all transform hover:scale-105 hover:-rotate-1">
                  {t('hero_cta_btn')}
                </button>
              </div>
              <div className="hidden md:flex justify-end items-center relative h-[600px]">
                 <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-[120px] animate-pulse"></div>
                 {/* Mascot size massively boosted for superior visual impact and hero presence */}
                 <img 
                    src="https://res.cloudinary.com/dginphpy4/image/upload/v1765769939/chekki-logo_q5xeux.png" 
                    alt="Chekki Mascot" 
                    className="w-full max-w-[850px] h-full object-contain drop-shadow-[0_0_150px_rgba(249,115,22,0.6)] animate-float scale-[6.5] z-10 origin-right transition-transform"
                 />
              </div>
            </div>
         </div>
      </div>
      
      <div className="border-t border-white/5 bg-white/[0.02] backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 md:py-20 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            <div className="flex flex-col items-start justify-center space-y-2 group cursor-default">
              <div className="text-5xl md:text-6xl font-bold text-white font-display group-hover:scale-110 transition-transform duration-300">98<span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500">%</span></div>
              <p className="text-zinc-500 text-sm md:text-base font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors text-left">{t('stat_accuracy')}</p>
            </div>
            <div className="flex flex-col items-start justify-center space-y-2 group cursor-default">
              <div className="text-5xl md:text-6xl font-bold text-white font-display group-hover:scale-110 transition-transform duration-300">10<span className="text-brand-purple">k+</span></div>
              <p className="text-zinc-500 text-sm md:text-base font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors text-left">{t('stat_users')}</p>
            </div>
            <div className="flex flex-col items-start justify-center space-y-2 group cursor-default">
              <div className="text-5xl md:text-6xl font-bold text-white font-display group-hover:scale-110 transition-transform duration-300">500<span className="text-brand-pink">k+</span></div>
              <p className="text-zinc-500 text-sm md:text-base font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors text-left">{t('stat_questions')}</p>
            </div>
            <div className="flex flex-col items-start justify-center space-y-2 group cursor-default">
              <div className="text-5xl md:text-6xl font-bold text-white font-display group-hover:scale-110 transition-transform duration-300">4.9<span className="text-yellow-500">★</span></div>
              <p className="text-zinc-500 text-sm md:text-base font-medium uppercase tracking-wider group-hover:text-zinc-300 transition-colors text-left">{t('stat_rating')}</p>
            </div>
        </div>
      </div>
      <div className="text-center mt-12 mb-8 flex flex-col gap-4">
        <p className="text-zinc-500 text-sm font-display">{t('footer_text')}</p>
        <div className="text-zinc-600 text-xs">Questions? <a href="mailto:chekkihelp@gmail.com" className="text-zinc-500 hover:text-white underline ml-1">chekkihelp@gmail.com</a></div>
      </div>
    </div>
  );
};
