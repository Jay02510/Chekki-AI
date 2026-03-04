import React from 'react';
import { ASSETS } from '../constants';

interface IconProps {
  className?: string;
  mood?: 'happy' | 'winking' | 'sleeping' | 'thinking';
}

export const ChekkiMascot: React.FC<IconProps> = ({ className, mood = 'happy' }) => {
  const getMascotSrc = () => {
    switch (mood) {
      case 'sleeping':
        return ASSETS.HERO_SLEEPY;
      case 'thinking':
        return ASSETS.MASCOT_THINKING;
      default:
        return ASSETS.MASCOT_HAPPY;
    }
  };

  return (
    <div className={`relative flex items-center justify-center overflow-hidden ${className}`}>
      <img
        src={getMascotSrc()}
        alt={`Chekki ${mood}`}
        className="w-full h-full object-contain filter brightness-110 drop-shadow-2xl scale-[1.35] md:scale-150"
      />
    </div>
  );
};
