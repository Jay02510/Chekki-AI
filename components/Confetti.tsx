import React from 'react';

export const Confetti: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      {[...Array(40)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-[confetti_3s_ease-out_forwards]"
          style={
            {
              backgroundColor: ['#ef7c1c', '#fdebd8', '#1f8a4c', '#f6a560'][i % 4],
              left: '50%',
              top: '50%',
              '--tx': `${(Math.random() - 0.5) * 600}px`,
              '--ty': `${(Math.random() - 0.7) * 400}px`,
              animationDelay: `${Math.random() * 0.5}s`,
            } as any
          }
        ></div>
      ))}
    </div>
  );
};
