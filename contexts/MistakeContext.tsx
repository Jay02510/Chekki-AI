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
  isMistake: (questionText: string) => boolean;
  removeMistake: (uniqueId: string) => void;
  showMistakeModal: boolean;
  setShowMistakeModal: (show: boolean) => void;
  isLoading: boolean;
}

const MistakeContext = createContext<MistakeContextType | undefined>(undefined);

export const MistakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load mistakes when user changes
  useEffect(() => {
    const loadMistakes = async () => {
        if (!user) {
            setMistakes([]);
            return;
        }
        setIsLoading(true);
        try {
            const data = await db.getMistakes(user.email);
            setMistakes(data);
        } catch (e) {
            console.error("Failed to load mistakes", e);
        } finally {
            setIsLoading(false);
        }
    };
    loadMistakes();
  }, [user]);

  const toggleMistake = async (item: WorksheetItem) => {
    if (!user) return; // Should prompt login in real app

    const exists = mistakes.find(m => m.question_text === item.question_text && m.correct_answer === item.correct_answer);

    if (exists) {
      // Optimistic Remove
      setMistakes(prev => prev.filter(m => m.uniqueId !== exists.uniqueId));
      await db.removeMistake(exists.uniqueId);
    } else {
      // Optimistic Add
      const newItem: MistakeItem = {
        ...item,
        uniqueId: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        dateAdded: new Date().toISOString()
      };
      setMistakes(prev => [newItem, ...prev]);
      await db.addMistake(user.email, newItem);
    }
  };

  const removeMistake = async (uniqueId: string) => {
    setMistakes(prev => prev.filter(m => m.uniqueId !== uniqueId));
    await db.removeMistake(uniqueId);
  };

  const isMistake = (questionText: string) => {
    return mistakes.some(m => m.question_text === questionText);
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