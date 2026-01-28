
import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ASSETS } from '../constants';

interface Props {
  onClose: () => void;
}

export const FlyerModal: React.FC<Props> = ({ onClose }) => {
  const { t } = useLanguage();
  const [successMsg, setSuccessMsg] = useState('');

  const handleNativeShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chekki AI Flyer',
          text: `Check out Chekki AI - ${title}`,
          url: url,
        });
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          navigator.clipboard.writeText(url);
          setSuccessMsg(t('res_copied'));
          setTimeout(() => setSuccessMsg(''), 2000);
        }
      }
    } else {
      navigator.clipboard.writeText(url);
      setSuccessMsg(t('res_copied'));
      setTimeout(() => setSuccessMsg(''), 2000);
    }
  };

  const FlyerItem = ({ title, thumb, pdf, dl }: { title: string, thumb: string, pdf: string, dl: string }) => (
    <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden group flex flex-col h-full">
        <div className="relative aspect-[3/4] overflow-hidden shrink-0">
            <img 
              src={thumb} 
              alt={title} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 bg-zinc-900" 
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400/18181b/ffffff?text=Poster'; }}
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-4 backdrop-blur-sm">
                <a href={pdf} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black shadow-xl uppercase tracking-tighter hover:bg-zinc-200 transition-colors">View PDF</a>
            </div>
        </div>
        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
            <p className="text-[10px] font-black text-zinc-300 truncate uppercase tracking-widest">{title}</p>
            <div className="flex gap-1.5">
                <a 
                    href={dl} 
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black py-2.5 rounded-lg text-center border border-white/10 transition-colors uppercase"
                >
                    {t('res_download')}
                </a>
                <button 
                    onClick={() => handleNativeShare(pdf, title)}
                    className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black py-2.5 rounded-lg border border-orange-500/20 transition-colors uppercase"
                >
                    {t('res_share')}
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl animate-fade-in" onClick={onClose}></div>
      <div className="relative bg-zinc-900 rounded-[2.5rem] w-full max-w-lg shadow-2xl border border-white/10 overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="bg-zinc-950 px-8 py-6 border-b border-white/5 flex justify-between items-center shrink-0">
           <div>
              <h2 className="text-xl font-black text-white font-display uppercase tracking-widest">{t('res_title')}</h2>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">{t('res_subtitle')}</p>
           </div>
           <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors text-xl">✕</button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">
           <div className="grid grid-cols-2 gap-4">
              <FlyerItem 
                title={t('res_kr')} 
                thumb={ASSETS.FLYER_KR_THUMB} 
                pdf={ASSETS.PDF_KR_SHARE} 
                dl={ASSETS.PDF_KR_DOWNLOAD}
              />
              <FlyerItem 
                title={t('res_en')} 
                thumb={ASSETS.FLYER_EN_THUMB} 
                pdf={ASSETS.PDF_EN_SHARE} 
                dl={ASSETS.PDF_EN_DOWNLOAD}
              />
           </div>
           {successMsg && (
             <p className="text-center text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-6 animate-pulse">{successMsg}</p>
           )}
        </div>
      </div>
    </div>
  );
};
