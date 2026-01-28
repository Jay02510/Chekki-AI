
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { LegalModal } from './LegalModal';
import { FeedbackModal } from './FeedbackModal';
import { ASSETS } from '../constants';
import { db } from '../services/database';

interface Props {
  onClose: () => void;
}

export const SettingsModal: React.FC<Props> = ({ onClose }) => {
  const { user, updateProfile, deleteAccount, upgradeToPro, firebaseUser, joinSchool } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  
  const [name, setName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');
  const [betaCode, setBetaCode] = useState('');
  const [schoolCode, setSchoolCode] = useState('');
  const [betaError, setBetaError] = useState(false);
  const [schoolError, setSchoolError] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [showLegal, setShowLegal] = useState<'privacy' | 'terms' | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);

  // Admin Stats
  const [adminStats, setAdminStats] = useState<{ totalUsers: number, betaUsage: any } | null>(null);
  const [isAdminLoading, setIsAdminLoading] = useState(false);

  // Developer Email Check
  const isAdmin = firebaseUser?.email === 'jsn.benjamin@gmail.com';

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    if (isAdmin) {
      fetchAdminStats();
    }
  }, [isAdmin]);

  const fetchAdminStats = async () => {
    setIsAdminLoading(true);
    const stats = await db.getSystemStats();
    if (stats) setAdminStats(stats);
    setIsAdminLoading(false);
  };

  const handleSave = () => {
    updateProfile(name);
    setSuccessMsg('Settings saved successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleNativeShare = async (url: string, title: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Chekki AI Flyer',
          text: `Check out Chekki AI - ${title}`,
          url: url,
        });
      } catch (err) {
        // Only trigger clipboard fallback if it's not a user cancellation
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
    <div className="bg-zinc-950/50 border border-white/5 rounded-2xl overflow-hidden group">
        <div className="relative aspect-[3/4] overflow-hidden">
            <img src={thumb} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 px-4">
                <a href={pdf} target="_blank" rel="noopener noreferrer" className="bg-white text-black px-4 py-2 rounded-xl text-xs font-black shadow-xl uppercase tracking-tighter">View PDF</a>
            </div>
        </div>
        <div className="p-3 space-y-2">
            <p className="text-[10px] font-bold text-zinc-300 truncate">{title}</p>
            <div className="flex gap-1.5">
                <a 
                    href={dl} 
                    className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black py-2 rounded-lg text-center border border-white/10 transition-colors uppercase"
                >
                    {t('res_download')}
                </a>
                <button 
                    onClick={() => handleNativeShare(pdf, title)}
                    className="flex-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 text-[9px] font-black py-2 rounded-lg border border-orange-500/20 transition-colors uppercase"
                >
                    {t('res_share')}
                </button>
            </div>
        </div>
    </div>
  );

  return (
    <>
      {showLegal && (
        <LegalModal type={showLegal} onClose={() => setShowLegal(null)} />
      )}
      {showFeedback && (
        <FeedbackModal onClose={() => setShowFeedback(false)} />
      )}
      
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}></div>
        
        <div className="relative bg-zinc-900 rounded-2xl w-full max-w-lg shadow-2xl border border-zinc-800 overflow-hidden animate-fade-in