
import React from 'react';

export const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-[confetti_3s_ease-out_forwards]"
          style={{
            backgroundColor: ['#F97316', '#EC4899', '#8B5CF6', '#FCD34D'][i % 4],
            left: '50%',
            top: '50%',
            '--tx': `${(Math.random() - 0.5) * 600}px`,
            '--ty': `${(Math.random() - 0.7) * 400}px`,
            animationDelay: `${Math.random() * 0.5}s`
          } as any}
        ></div>
      ))}
    </div>
  );
};
