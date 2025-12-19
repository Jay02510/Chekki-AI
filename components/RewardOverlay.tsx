
import React, { useState, useEffect } from 'react';
import { ASSETS } from '../constants';

interface Props {
  onClose: () => void;
  score: number;
}

export const RewardOverlay: React.FC<Props> = ({ onClose, score }) => {
  const [showStamp, setShowStamp] = useState(false);
  const [stamped, setStamped] = useState(false);

  useEffect(() => {
    // Show stamp after a short entrance delay
    const timer = setTimeout(() => setShowStamp(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleStamp = () => {
    if (stamped) return;
    setStamped(true);
    
    // Play sound
    const audio = new Audio(ASSETS.STAMP_SOUND);
    audio.play().catch(() => {});

    // Auto-close after celebration
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-sm flex flex-col items-center">
        {/* Entrance Message */}
        <div className={`text-center mb-8 transition-all duration-700 ${showStamp ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-10'}`}>
            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-xl">Awesome Job!</h2>
            <p className="text-orange-400 font-bold text-xl font-korean bg-white/10 px-4 py-1 rounded-full backdrop-blur-md">참 잘했어요! ✨</p>
        </div>

        {/* The Stamp Interaction */}
        <div 
            onClick={handleStamp}
            className={`
                relative w-48 h-48 cursor-pointer transition-all duration-500
                ${showStamp ? 'scale-100 opacity-100 rotate-12' : 'scale-150 opacity-0'}
                ${stamped ? 'scale-90 rotate-0' : 'hover:scale-110'}
            `}
        >
            {/* The Handle */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-16 h-24 bg-gradient-to-b from-red-600 to-red-800 rounded-t-full shadow-2xl z-10 ${stamped ? 'translate-y-8' : ''} transition-transform`}></div>
            
            {/* The Impression (Result) */}
            <div className={`
                absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 rounded-[50%] border-[6px] border-red-500 flex items-center justify-center transition-all duration-300
                ${stamped ? 'bg-red-500/20 scale-110 border-red-600' : 'bg-white shadow-2xl'}
            `}>
                <span className={`text-2xl font-black font-korean ${stamped ? 'text-red-600' : 'text-gray-300'}`}>참 잘했어요!</span>
            </div>

            {/* Score Bubble */}
            <div className={`absolute -top-6 -right-6 w-20 h-20 bg-yellow-400 rounded-full flex items-center justify-center border-4 border-white shadow-2xl transition-all duration-700 ${stamped ? 'scale-125 rotate-[15deg]' : 'scale-0'}`}>
                <span className="text-2xl font-black text-gray-900">{score}</span>
            </div>
        </div>

        <p className={`mt-12 text-zinc-400 font-bold font-korean transition-opacity ${stamped ? 'opacity-0' : 'opacity-100 animate-pulse'}`}>
            도장을 꾹! 눌러주세요
        </p>

        {/* Confetti (Simple) */}
        {stamped && (
            <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                    <div 
                        key={i}
                        className="absolute w-2 h-2 rounded-full animate-ping"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                            backgroundColor: ['#F97316', '#EC4899', '#8B5CF6', '#F59E0B'][i % 4],
                            animationDelay: `${Math.random() * 2}s`
                        }}
                    ></div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
