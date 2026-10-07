import { useEffect, useState } from 'react';

// Same key the parent app uses, so a theme picked on the marketing pages
// carries into /app. Follows the device until the visitor picks one.
const THEME_KEY = 'chekki_theme_override';

const initialNight = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
  } catch {
    // storage blocked: follow the device
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
};

/** Warm-token pages: drives `html.dark` and returns [isNight, toggle]. */
export function useWarmTheme() {
  const [isNight, setIsNight] = useState(initialNight);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isNight);
    document.documentElement.style.colorScheme = isNight ? 'dark' : 'light';
  }, [isNight]);

  const toggle = () => {
    const next = !isNight;
    setIsNight(next);
    try {
      localStorage.setItem(THEME_KEY, next ? 'dark' : 'light');
    } catch {
      /* storage blocked: session only */
    }
  };

  return [isNight, toggle] as const;
}
