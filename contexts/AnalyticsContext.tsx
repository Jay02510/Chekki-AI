
import React, { createContext, useContext, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';

interface AnalyticsContextType {
  track: (event: string, properties?: Record<string, any>) => void;
}

const AnalyticsContext = createContext<AnalyticsContextType | undefined>(undefined);

export const AnalyticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, firebaseUser } = useAuth();
  const anonymousId = useRef(`anon_${Math.random().toString(36).substr(2, 9)}`);

  const track = (event: string, properties: Record<string, any> = {}) => {
    const payload = {
      event,
      properties,
      userId: firebaseUser?.uid,
      anonymousId: anonymousId.current,
      plan: user?.plan || 'guest'
    };

    // Fire and forget, don't block UI
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {}); // Silent fail for analytics
    
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[Analytics] ${event}`, properties);
    }
  };

  return (
    <AnalyticsContext.Provider value={{ track }}>
      {children}
    </AnalyticsContext.Provider>
  );
};

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) throw new Error('useAnalytics must be used within AnalyticsProvider');
  return context;
};
