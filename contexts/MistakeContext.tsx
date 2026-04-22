
import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/database';

interface MistakeItem extends WorksheetItem {
  uniqueId: string;
  dateAdded?: string;
}

interface MistakeContextType {
  mistakes: MistakeItem[];
  toggleMistake: (item: WorksheetItem) => void;
  isMistake: (questionText: string, correctAnswer: string) => boolean;
  removeMistake: (uniqueId: string) => void;
  showMistakeModal: boolean;
  setShowMistakeModal: (show: boolean) => void;
  isLoading: boolean;
}

const MistakeContext = createContext<MistakeContextType | undefined>(undefined);

export const MistakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initial load effect removed - no persistence
  
  const toggleMistake = (item: WorksheetItem) => {
    // Use Question + Answer for better identity tracking
    const exists = mistakes.find(m => 
      m.question_text === item.question_text && 
      m.correct_answer === item.correct_answer
    );

    if (exists) {
      setMistakes(prev => prev.filter(m => m.uniqueId !== exists.uniqueId));
    } else {
      const newItem: MistakeItem = {
        ...item,
        uniqueId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        dateAdded: new Date().toISOString()
      };
      setMistakes(prev => [newItem, ...prev]);
    }
  };

  const removeMistake = (uniqueId: string) => {
    setMistakes(prev => prev.filter(m => m.uniqueId !== uniqueId));
  };

  const isMistake = (questionText: string, correctAnswer: string) => {
    return mistakes.some(m => 
      m.question_text === questionText && 
      m.correct_answer === correctAnswer
    );
  };

  return (
    <MistakeContext.Provider value={{ 
      mistakes, 
      toggleMistake, 
      isMistake, 
      removeMistake,
      showMistakeModal,
      setShowMistakeModal,
      isLoading
    }}>
      {children}
    </MistakeContext.Provider>
  );
};

export const useMistakes = () => {
  const context = useContext(MistakeContext);
  if (context === undefined) {
    throw new Error('useMistakes must be used within a MistakeProvider');
  }
  return context;
};
