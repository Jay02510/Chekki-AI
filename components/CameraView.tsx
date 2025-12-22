
import React, { useRef, useState } from 'react';
import { compressImage } from '../utils/imageUtils';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { ChekkiMascot } from './Icons';
import { ASSETS } from '../constants';
import { FeedbackModal } from './FeedbackModal';

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
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const { t, language } = useLanguage();

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const base64Url = await compressImage(file, 1024, 0.75);
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
    <div className={`relative w-full ${size === 'large' ? 'min-h-[400px] h-auto' : 'h-[500px]'} perspective-1000 transition-all duration-700 ease-out py-8`}>
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] border ${isNight ? 'border-indigo-500/10' : 'border-white/5'} rounded-full animate-[spin_20s_linear_infinite] pointer-events-none`}></div>
      <div 
        role="button"
        aria-label="Upload Worksheet"
        className={`relative w-full h-full max-w-2xl mx-auto ${isNight ? 'bg-indigo-950/20' : 'bg-zinc-900/60'} backdrop-blur-2xl rounded-[2.5rem] border transition-all duration-500 flex flex-col items-center justify-center p-10 group cursor-pointer overflow-hidden
          ${dragActive ? 'border-brand-orange shadow-[0_0_50px_rgba(249,115,22,0.3)] scale-[1.02]' : 'border-white/10 shadow-2xl hover:border-white/30 hover:shadow-brand-orange/10'}`}
        onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
          <div className={`absolute inset-0 bg-gradient-to-br ${isNight ? 'from-indigo-500/10 to-purple-500/10' : 'from-brand-orange/5 to-brand-purple/5'} opacity-50 group-hover:opacity-100 transition-opacity duration-500`}></div>
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className={`${size === 'large' ? 'w-48 h-48 md:w-56 md:h-56' : 'w-40 h-40'} mb-8 relative transition-transform duration-500 group-hover:scale-105`}>
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className={`w-16 h-16 border-4 ${isNight ? 'border-indigo-500' : 'border-brand-orange'} border-t-transparent rounded-full animate-spin`}></div>
                  </div>
                ) : (
                  <div className="w-full h-full animate-float flex items-center justify-center">
                    {!imgError ? (
                       <img src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.MASCOT_HAPPY} alt="Chekki Mascot" className={`w-full h-full object-contain drop-shadow-2xl filter brightness-110 ${isNight ? 'scale-[1.8]' : ''}`} onError={() => setImgError(true)}/>
                    ) : (
                       <ChekkiMascot className="w-full h-full drop-shadow-2xl filter brightness-110" mood={isNight ? "sleeping" : "happy"} />
                    )}
                  </div>
                )}
                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-32 h-6 bg-black/50 blur-lg rounded-full opacity-50 group-hover:opacity-80 transition-opacity"></div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2 font-display break-keep">
              {isProcessing ? t('processing') : t('drop_title')}
            </h3>
            <p className="text-zinc-500 font-medium font-korean text-lg break-keep leading-snug">{t('drop_subtitle')}</p>
            <div className="mt-8 flex flex-col items-center gap-3 group/btn">
                <div className={`w-14 h-14 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-lg group-hover/btn:${isNight ? 'bg-indigo-600' : 'bg-brand-orange'} group-hover/btn:border-white group-hover/btn:scale-110 transition-all duration-300`}>
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest group-hover/btn:text-white transition-colors">{t('btn_upload')}</span>
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
      className="group cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 px-8 py-4 rounded-[2rem] flex items-center gap-4 transition-all animate-fade-in-up shadow-2xl backdrop-blur-md mb-12 ring-1 ring-white/5 hover:ring-orange-500/50"
    >
       <div className={`w-10 h-10 rounded-xl ${isNight ? 'bg-indigo-500/20' : 'bg-orange-500/20'} flex items-center justify-center text-xl animate-pulse shadow-inner`}>✨</div>
       <div className="flex-1">
          <p className={`text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] ${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-0.5`}>Beta Community</p>
          <p className="text-sm md:text-base font-bold text-zinc-200 font-korean group-hover:text-white transition-colors leading-tight">
            {t('beta_banner')}
          </p>
       </div>
       <span className={`${isNight ? 'text-indigo-400' : 'text-orange-500'} ml-auto opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 font-black`}>→</span>
    </div>
  );

  if (user) {
    return (
      <div className="min-h-screen pt-32 pb-12 px-6 max-w-7xl mx-auto flex flex-col items-center animate-fade-in relative">
        {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
        <div className="w-full max-w-3xl flex flex-col items-center text-center mb-10 gap-6">
           <div className="space-y-2">
              <h1 className="text-4xl md:text-6xl font-black text-white font-display break-keep leading-[1.15]">
                {t('dash_welcome')} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${isNight ? 'from-indigo-400 to-purple-500' : 'from-orange-400 to-pink-500'}`}>{user.name}!</span>
              </h1>
              <p className="text-zinc-400 font-korean text-lg md:text-xl max-w-lg mx-auto leading-relaxed break-keep">{t('dash_subtitle')}</p>
           </div>
           
           <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-[#0F1014] border border-white/10 rounded-full py-2 px-6 flex items-center gap-3 shadow-lg">
                  <div className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">{t('scans_left')}</div>
                  <div className="w-px h-4 bg-white/10"></div>
                  <div className="font-bold text-white text-xl font-display leading-none">{user.plan === 'pro' ? '∞' : (user.maxScans - user.scansUsed)}</div>
              </div>
           </div>
        </div>
        
        <div className="w-full max-w-2xl animate-fade-in-up">
           <BetaBanner />
           <DropZone size="large" />
        </div>
        <p className="mt-8 text-zinc-600 text-xs font-bold uppercase tracking-widest text-center">{t('supported_formats')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col pt-32 md:pt-40 pb-20 overflow-x-hidden scroll-smooth">
      {showFeedbackModal && <FeedbackModal onClose={() => setShowFeedbackModal(false)} />}
      
      {/* Hero Section */}
      <div className="relative max-w-7xl mx-auto px-6 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 lg:gap-8 items-center mb-32">
        <div className={`absolute top-0 left-1/4 -translate-x-1/2 w-[800px] h-[500px] ${isNight ? 'bg-indigo-900/20' : 'bg-brand-purple/20'} rounded-full blur-[120px] -z-10 pointer-events-none opacity-50 mix-blend-screen`}></div>
        <div className="w-full flex flex-col items-start text-left z-10 animate-fade-in-up order-2 lg:order-1">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 mb-8 backdrop-blur-sm shadow-xl self-start ring-1 ring-white/10">
            <span className={`w-2 h-2 rounded-full ${isNight ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.6)]`}></span>
            <span className="text-[10px] md:text-xs font-black text-zinc-200 tracking-widest uppercase">{t('hero_badge')}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-7xl font-black text-white font-display mb-8 tracking-tighter text-left drop-shadow-2xl whitespace-pre-line leading-[1.1] break-keep">
            {isNight ? (
              <span className={`text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-600`}>{t('hero_title_night')}</span>
            ) : (
              language === 'ko' ? (
                  <>우리 아이 영어 실력 <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>한 단계 더 높이기</span></>
              ) : (
                  <>English Homework? <br/> <span className={`text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500`}>Just Snap a Photo.</span></>
              )
            )}
          </h1>
          <p className="text-lg md:text-xl text-zinc-400 max-w-lg leading-relaxed mb-10 font-korean text-left font-medium break-keep">
            {isNight ? t('hero_desc_night') : t('hero_desc')}
          </p>
          <div className="flex flex-wrap gap-4 justify-start">
            <button onClick={openLoginModal} className="group relative bg-white text-black px-10 py-5 rounded-2xl font-black text-lg md:text-xl transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(255,255,255,0.2)] font-display flex items-center gap-3 overflow-hidden">
              <span className="relative font-korean">{t('onb_1_btn')}</span> 
              <span className="text-2xl relative transition-transform group-hover:translate-x-1">→</span>
            </button>
          </div>
        </div>
        <div className="w-full flex justify-center lg:justify-end items-center animate-fade-in-up order-1 lg:order-2">
            <div className="relative w-full max-w-[500px] aspect-square flex items-center justify-center">
                <div className={`absolute inset-0 bg-gradient-to-tr ${isNight ? 'from-indigo-500/20 to-purple-500/20' : 'from-brand-orange/20 to-brand-purple/20'} rounded-full blur-[80px] animate-pulse`}></div>
                <img 
                  src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} 
                  alt="Chekki Hero" 
                  className={`w-full h-full object-contain drop-shadow-2xl animate-float relative z-10 transition-transform scale-[1.8] lg:scale-[2.2]`}
                />
            </div>
        </div>
      </div>

      {/* Trust Stats with Night Mode Banner */}
      <div className="max-w-7xl mx-auto px-6 mb-32">
          {isNight && (
            <div className="max-w-2xl mb-12">
               <BetaBanner />
            </div>
          )}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
              {[
                { label: t('stat_accuracy'), value: '99.9%' },
                { label: t('stat_users'), value: '10,000+' },
                { label: t('stat_questions'), value: '1M+' },
                { label: t('stat_rating'), value: '4.9/5' }
              ].map((stat, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-3xl text-center backdrop-blur-md">
                    <div className="text-2xl md:text-3xl font-black text-white mb-1 font-display leading-tight">{stat.value}</div>
                    <div className="text-[10px] md:text-xs font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
          </div>
      </div>

      {/* How It Works */}
      <div className="bg-white/[0.02] border-y border-white/5 backdrop-blur-sm py-20 mb-32 relative overflow-hidden">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className={`text-xs font-black ${isNight ? 'text-indigo-400' : 'text-orange-500'} uppercase tracking-[0.2em] mb-3 leading-tight`}>{t('how_title')}</h2>
            <p className="text-3xl md:text-4xl font-black text-white font-korean mb-16 break-keep leading-[1.25]">{language === 'ko' ? "3단계로 끝내는 홈스쿨링" : "Done in 3 Simple Steps"}</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                <div className="flex flex-col items-center group">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-orange-500/50 text-3xl">📸</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean break-keep leading-tight">{t('how_step1')}</h3>
                    <p className="text-zinc-400 font-korean text-sm leading-relaxed max-w-[200px] break-keep">{t('how_step1_desc')}</p>
                </div>
                <div className="flex flex-col items-center group">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-purple-500/50 text-3xl">✨</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean break-keep leading-tight">{t('how_step2')}</h3>
                    <p className="text-zinc-400 font-korean text-sm leading-relaxed max-w-[200px] break-keep">{t('how_step2_desc')}</p>
                </div>
                <div className="flex flex-col items-center group">
                    <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-2xl mb-6 group-hover:scale-110 transition-transform duration-300 group-hover:border-emerald-500/50 text-3xl">🗣️</div>
                    <h3 className="text-xl font-bold text-white mb-2 font-korean break-keep leading-tight">{t('how_step3')}</h3>
                    <p className="text-zinc-400 font-korean text-sm leading-relaxed max-w-[200px] break-keep">{t('how_step3_desc')}</p>
                </div>
            </div>
         </div>
      </div>

      {/* Feature Section */}
      <div className="max-w-7xl mx-auto px-6 mb-40">
          <div className="grid md:grid-cols-2 gap-8">
              {/* Vision AI Card with Video Loop Background */}
              <div className={`bg-gradient-to-br from-zinc-900 to-zinc-950 p-10 rounded-[3rem] border border-white/5 shadow-2xl flex flex-col justify-center relative overflow-hidden group min-h-[400px]`}>
                  <div className="absolute inset-0 opacity-40 pointer-events-none group-hover:opacity-60 transition-opacity duration-700">
                     <video autoPlay muted loop playsInline className="w-full h-full object-cover">
                        <source src={ASSETS.VIDEO_INTRO} type="video/mp4" />
                     </video>
                  </div>
                  <div className="relative z-10 drop-shadow-md">
                    <span className={`${isNight ? 'text-indigo-400' : 'text-orange-500'} font-black text-xs uppercase tracking-widest mb-4`}>Vision AI</span>
                    <h3 className="text-3xl font-black text-white mb-4 font-korean break-keep leading-tight">{t('feat_vision_title')}</h3>
                    <p className="text-zinc-100 font-korean leading-relaxed mb-8 break-keep drop-shadow-lg font-bold">{t('feat_vision_desc')}</p>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-black/40 backdrop-blur-md rounded-xl flex items-center justify-center shadow-lg border border-white/10">
                            <span className="text-xl">🔍</span>
                        </div>
                        <span className="text-xs text-white font-black uppercase tracking-widest drop-shadow-md">{language === 'ko' ? "실시간 정답 스캔" : "Real-time AI Grading"}</span>
                    </div>
                  </div>
              </div>
              
              <div className="grid gap-8">
                  <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm flex items-start gap-6">
                      <div className={`w-14 h-14 ${isNight ? 'bg-indigo-500/10' : 'bg-emerald-500/10'} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>🔊</div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-2 font-korean leading-tight">{t('feat_audio')}</h4>
                          <p className="text-zinc-500 text-sm font-korean break-keep leading-relaxed">{t('feat_audio_desc')}</p>
                      </div>
                  </div>
                  <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm flex items-start gap-6">
                      <div className={`w-14 h-14 ${isNight ? 'bg-indigo-500/10' : 'bg-purple-500/10'} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>📝</div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-2 font-korean leading-tight">{language === 'ko' ? "복습 노트 생성" : "Smart Review Note"}</h4>
                          <p className="text-zinc-500 text-sm font-korean break-keep leading-relaxed">{t('feat_review_desc')}</p>
                      </div>
                  </div>
                  <div className="bg-zinc-900/50 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-sm flex items-start gap-6">
                      <div className={`w-14 h-14 ${isNight ? 'bg-indigo-500/10' : 'bg-pink-500/10'} rounded-2xl flex items-center justify-center text-2xl shrink-0`}>🛡️</div>
                      <div>
                          <h4 className="text-xl font-bold text-white mb-2 font-korean leading-tight">{t('feat_privacy')}</h4>
                          <p className="text-zinc-500 text-sm font-korean break-keep leading-relaxed">{t('feat_privacy_desc')}</p>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-6 mb-40 text-center">
          <h2 className={`text-xs font-black ${isNight ? 'text-indigo-400' : 'text-orange-500'} uppercase tracking-[0.2em] mb-3 leading-tight`}>{t('test_title')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
              {[
                { name: t('test_1_name'), text: t('test_1_text'), avatar: '👩🏻' },
                { name: t('test_2_name'), text: t('test_2_text'), avatar: '👨🏻' },
                { name: t('test_3_name'), text: t('test_3_text'), avatar: '👩🏼' }
              ].map((test, i) => (
                <div key={i} className="bg-zinc-900/40 border border-white/5 p-8 rounded-3xl text-left backdrop-blur-md hover:-translate-y-2 transition-transform">
                    <div className={`${isNight ? 'text-indigo-400' : 'text-orange-500'} mb-4 text-xl`}>★★★★★</div>
                    <p className="text-zinc-300 font-korean text-sm italic mb-6 leading-relaxed break-keep">"{test.text}"</p>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center text-xl">{test.avatar}</div>
                        <div className="text-xs font-bold text-white leading-tight">{test.name}</div>
                    </div>
                </div>
              ))}
          </div>
      </div>

      {/* Final CTA with Reduced Spacing */}
      <div className="max-w-5xl mx-auto px-6 mb-20">
          <div className={`bg-gradient-to-r ${isNight ? 'from-indigo-600 to-indigo-950' : 'from-orange-500 to-pink-500'} rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden shadow-2xl ${isNight ? 'shadow-indigo-500/10' : 'shadow-orange-500/20'} group min-h-[350px] flex items-center`}>
              {/* Futuristic Glow Backdrop */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white/5 blur-[100px] rounded-full pointer-events-none"></div>
              
              <div className="relative z-10 grid lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center w-full">
                <div className="text-left animate-fade-in-up">
                  <h2 className="text-3xl md:text-5xl font-black text-white mb-3 font-display break-keep leading-tight drop-shadow-xl">{t('hero_cta_title')}</h2>
                  <p className="text-white text-base md:text-xl font-korean mb-8 font-bold break-keep leading-relaxed drop-shadow-lg opacity-95 max-w-lg">{t('hero_cta_desc')}</p>
                  <button onClick={openLoginModal} className={`bg-white ${isNight ? 'text-indigo-800' : 'text-orange-600'} px-10 py-4 rounded-xl font-black text-lg hover:bg-zinc-100 transition-all transform active:scale-95 shadow-2xl leading-tight`}>
                      {t('hero_cta_btn')}
                  </button>
                </div>
                
                <div className="hidden lg:flex justify-end items-center relative h-full">
                   <img 
                    src={isNight ? ASSETS.HERO_SLEEPY : ASSETS.HERO_IMAGE} 
                    alt="Chekki Mascot" 
                    className={`w-[110%] h-[110%] object-contain filter brightness-110 drop-shadow-[0_15px_40px_rgba(0,0,0,0.3)] animate-float scale-[1.8] lg:scale-[2.2]`} 
                   />
                </div>
              </div>
          </div>
      </div>

      {/* Footer info */}
      <footer className="max-w-7xl mx-auto px-6 pt-10 pb-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-col items-center md:items-start gap-1">
              <div className="text-sm font-black text-white font-display leading-tight">Chekki<span className={isNight ? 'text-indigo-500' : 'text-orange-500'}>AI</span></div>
              <div className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">{t('footer_text')}</div>
          </div>
          <div className="flex gap-8 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
              <span className="hover:text-white cursor-pointer" onClick={() => (window as any).openLegal?.('privacy')}>Privacy</span>
              <span className="hover:text-white cursor-pointer" onClick={() => (window as any).openLegal?.('terms')}>Terms</span>
              <span className="hover:text-white cursor-pointer">Support</span>
          </div>
      </footer>
    </div>
  );
};
