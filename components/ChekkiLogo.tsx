import React from 'react';

interface ChekkiLogoProps {
  className?: string;
  height?: number | string;
  isNight?: boolean;
}

export const ChekkiLogo: React.FC<ChekkiLogoProps> = ({
  className = '',
  height = 36,
  isNight = false,
}) => {
  // Black for light background / White for dark background, with vibrant Crimson Red for "AI"
  const textColor = isNight ? '#FFFFFF' : '#0F172A'; // Black/Slate-900 or White
  const accentColor = '#EF4444'; // Vibrant Red

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Eagle Wing / Check Feather Icon */}
      <svg
        width={height}
        height={height}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="transition-transform duration-300 hover:scale-105"
      >
        <path
          d="M20 70C35 70 50 55 60 30C65 20 70 10 85 10C85 25 70 45 55 60C45 70 30 75 20 70Z"
          fill={accentColor}
        />
        <path
          d="M15 50C25 50 40 40 50 20C55 12 60 5 75 5C75 18 62 35 48 48C38 56 25 55 15 50Z"
          fill={textColor}
          opacity="0.85"
        />
        <circle cx="78" cy="12" r="4" fill={accentColor} />
      </svg>

      {/* Brand Wordmark: Chekki (Black) AI (Red) */}
      <div className="flex items-baseline font-black tracking-tight font-sans text-2xl">
        <span style={{ color: textColor }}>Chekki</span>
        <span style={{ color: accentColor }} className="ml-0.5 font-extrabold">
          AI
        </span>
      </div>
    </div>
  );
};
