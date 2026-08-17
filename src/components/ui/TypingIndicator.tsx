import React from 'react';

interface TypingIndicatorProps {
  isNight?: boolean;
  label?: string;
}

/**
 * Renders as an incoming (empty) chat bubble matching InsightsChatPanel's
 * model-bubble styling, rather than a spinner glued to the send button.
 */
export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isNight = true, label = 'Thinking…' }) => {
  return (
    <div
      role="status"
      aria-live="polite"
      className={`p-3 rounded-2xl max-w-[85%] flex items-center gap-1.5 ${
        isNight ? 'bg-white/5' : 'bg-zinc-100'
      }`}
    >
      <span className="sr-only">{label}</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          className={`w-1.5 h-1.5 rounded-full motion-safe:animate-pulse motion-reduce:opacity-60 ${
            isNight ? 'bg-zinc-400' : 'bg-zinc-500'
          }`}
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  );
};
