
import React from 'react';
import { ASSETS } from '../constants';

interface IconProps {
  className?: string;
  mood?: 'happy' | 'winking' | 'sleeping' | 'thinking';
}

export const ChekkiMascot: React.FC<IconProps> = ({ className, mood = 'happy' }) => {
  // Use the high-fidelity mascot image
  const mascotUrl = mood === 'sleeping' ? ASSETS.HERO_SLEEPY : ASSETS.LOGO;

  return (
    <div className={`${className} flex items-center justify-center overflow-hidden`}>
      <img 
        src={mascotUrl} 
        alt="Chekki Mascot" 
        className={`w-full h-full object-contain ${mood === 'thinking' ? 'rotate-[-5deg]' : ''} ${mood === 'winking' ? 'scale-110' : ''}`}
        style={{ 
            filter: mood === 'thinking' ? 'brightness(1.1) contrast(1.1)' : 'none'
        }}
      />
    </div>
  );
};
