import React from 'react';
import { Microphone, MicrophoneSlash } from '@phosphor-icons/react';

type OrbState = 'idle' | 'listening' | 'processing' | 'error';

interface VoiceOrbProps {
  state: OrbState;
  size?: number;
  isNight?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
}

/**
 * CSS-only state indicator (no canvas/audio-amplitude reactivity, by design
 * decision) replacing the flat color-swap mic button. Stays inside the
 * One Accent Rule — every state is a shade/motion of brand orange, never a
 * second color, including error (a desaturated flash, not red).
 */
export const VoiceOrb: React.FC<VoiceOrbProps> = ({
  state,
  size = 64,
  isNight = true,
  onClick,
  disabled,
  ariaLabel,
}) => {
  const isListening = state === 'listening';
  const isProcessing = state === 'processing';
  const isError = state === 'error';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className="relative inline-flex items-center justify-center active:scale-[0.97] transition-transform disabled:opacity-60 disabled:active:scale-100"
      style={{ width: size, height: size }}
    >
      {isListening && (
        <>
          <span className="absolute inset-0 rounded-full bg-orange-500/40 motion-safe:animate-ring-pulse motion-reduce:opacity-40" />
          <span
            className="absolute inset-0 rounded-full bg-orange-500/40 motion-safe:animate-ring-pulse motion-reduce:opacity-20"
            style={{ animationDelay: '0.4s' }}
          />
        </>
      )}

      {isProcessing && (
        <svg
          className="absolute inset-0 motion-safe:animate-spin motion-reduce:animate-none"
          style={{ animationDuration: '1.2s' }}
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={(size - 6) / 2}
            fill="none"
            stroke="#f97316"
            strokeWidth={4}
            strokeLinecap="round"
            strokeDasharray={`${Math.PI * (size - 6) * 0.28} ${Math.PI * (size - 6)}`}
            className="opacity-80"
          />
        </svg>
      )}

      <span
        className={`relative flex items-center justify-center rounded-full transition-colors duration-300 shadow-[0_20px_50px_rgba(249,115,22,0.25)] ${
          isError ? 'bg-orange-700/70' : 'bg-orange-500'
        }`}
        style={{ width: size * 0.75, height: size * 0.75 }}
      >
        {isListening ? (
          <MicrophoneSlash size={size * 0.34} weight="bold" className="text-white" />
        ) : (
          <Microphone size={size * 0.34} weight="bold" className="text-white" />
        )}
      </span>
    </button>
  );
};
