
import React from 'react';

interface IconProps {
  className?: string;
  mood?: 'happy' | 'winking' | 'sleeping' | 'thinking';
}

export const ChekkiMascot: React.FC<IconProps> = ({ className, mood = 'happy' }) => {
  return (
    <svg viewBox="0 0 200 200" className={className} xmlns="http://www.w3.org/2000/svg" fill="none">
      {/* --- PENCIL BODY --- */}
      {/* Wood / Tip */}
      <path d="M100 180 L70 140 L130 140 Z" fill="#FCD34D" /> {/* Wood */}
      <path d="M100 180 L85 160 L115 160 Z" fill="#1F2937" /> {/* Lead */}
      
      {/* Orange Body */}
      <rect x="70" y="50" width="60" height="90" fill="#F97316" />
      <path d="M70 50 L130 50 L130 140 L70 140 Z" fill="url(#grad1)" />
      
      {/* Metal Ferrule */}
      <rect x="70" y="30" width="60" height="20" fill="#94A3B8" rx="2" />
      <path d="M70 35 H130 M70 40 H130 M70 45 H130" stroke="#64748B" strokeWidth="1" />

      {/* Eraser */}
      <path d="M70 30 L70 15 C70 5 130 5 130 15 L130 30 Z" fill="#F472B6" />

      {/* --- FACE --- */}
      {/* Glasses Frames */}
      <circle cx="85" cy="90" r="14" stroke="#1F2937" strokeWidth="4" fill="rgba(255,255,255,0.4)" />
      <circle cx="115" cy="90" r="14" stroke="#1F2937" strokeWidth="4" fill="rgba(255,255,255,0.4)" />
      <path d="M99 90 H101" stroke="#1F2937" strokeWidth="3" /> {/* Bridge */}
      <path d="M71 90 L60 85" stroke="#1F2937" strokeWidth="3" /> {/* Left Arm */}
      <path d="M129 90 L140 85" stroke="#1F2937" strokeWidth="3" /> {/* Right Arm */}

      {/* Eyes & Mouth based on Mood */}
      {mood === 'happy' && (
        <>
          <circle cx="85" cy="90" r="3" fill="#1F2937" />
          <circle cx="115" cy="90" r="3" fill="#1F2937" />
          <path d="M90 110 Q100 120 110 110" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
        </>
      )}

      {mood === 'winking' && (
        <>
          <circle cx="85" cy="90" r="3" fill="#1F2937" />
          {/* Wink */}
          <path d="M108 90 L122 90" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" /> 
          <path d="M90 110 Q100 120 110 110" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          
          {/* REPLACED THUMBS UP WITH A STAR TO AVOID MISINTERPRETATION */}
          <path d="M150 115 L153 125 L163 125 L155 131 L158 141 L150 135 L142 141 L145 131 L137 125 L147 125 Z" fill="#F97316" stroke="#F97316" strokeWidth="2" strokeLinejoin="round" />
        </>
      )}

      {mood === 'thinking' && (
        <>
          <circle cx="85" cy="85" r="3" fill="#1F2937" />
          <circle cx="115" cy="85" r="3" fill="#1F2937" />
          <path d="M95 115 H105" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          {/* Question Mark */}
          <text x="140" y="80" fontSize="40" fill="#F97316" fontWeight="bold" transform="rotate(15, 140, 80)">?</text>
        </>
      )}

      {mood === 'sleeping' && (
        <>
          {/* Closed Eyes */}
          <path d="M78 92 Q85 92 92 92" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          <path d="M108 92 Q115 92 122 92" stroke="#1F2937" strokeWidth="3" strokeLinecap="round" />
          {/* Mouth (O) */}
          <circle cx="100" cy="115" r="4" fill="#1F2937" />
          {/* Nightcap */}
          <path d="M70 30 Q50 30 50 60 L60 65" stroke="#6366F1" strokeWidth="0" fill="#6366F1" />
          <circle cx="50" cy="60" r="6" fill="#FFFFFF" />
          {/* Zzz */}
          <text x="140" y="70" fontSize="30" fill="#6366F1" fontWeight="bold">Zzz</text>
        </>
      )}

      {/* Gradients */}
      <defs>
        <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
          <stop offset="50%" style={{ stopColor: '#FB923C', stopOpacity: 1 }} />
          <stop offset="100%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
        </linearGradient>
      </defs>
    </svg>
  );
};
