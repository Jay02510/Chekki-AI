import React, { createContext, useContext, useState, useEffect } from 'react';
import { WorksheetItem } from '../types';
import { useAuth } from './AuthContext';
import { db } from '../services/database';
import { localHistoryService, StruggleRecord } from '../services/localHistoryService';

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
  autoBookmark: (items: WorksheetItem[]) => void;
}

const MistakeContext = createContext<MistakeContextType | undefined>(undefined);

export const MistakeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [mistakes, setMistakes] = useState<MistakeItem[]>([]);
  const [showMistakeModal, setShowMistakeModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Sync with Firestore or Local Storage
  useEffect(() => {
    const loadMistakes = async () => {
      setIsLoading(true);
      try {
        let loadedMistakes: MistakeItem[] = [];

        // 1. Fetch Local Mistakes (Always)
        const localHistory = await localHistoryService.getRecentStruggles() || [];
        const mappedLocalMistakes: MistakeItem[] = localHistory.map(h => ({
          id: parseInt(h.id, 10) || 0,
          type: 'text',
          question_text: h.question_text,
          correct_answer: h.correct_answer,
          student_response: h.student_response,
          korean_guide: '',
          english_guide: '',
          teaching_script_ko: '',
          teaching_script_en: '',
          bounding_box: { ymin: 0, xmin: 0, ymax: 0, xmax: 0 },
          is_correct: false,
          uniqueId: h.id,
          dateAdded: h.date,
        }));

        if (user?.uid) {
          // 2. User is logged in -> Fetch Cloud Mistakes
          const cloudMistakes = await db.getUserMistakes(user.uid);
          
          if (mappedLocalMistakes.length > 0) {
            // 3. Migration: Merge Local Mistakes into Cloud and clear local
            const merged = [...cloudMistakes, ...mappedLocalMistakes];
            // Deduplicate by uniqueId
            const unique = Array.from(new Map(merged.map(item => [item.uniqueId, item])).values());
            await db.saveUserMistakes(user.uid, unique);
            await localHistoryService.clearHistory();
            loadedMistakes = unique;
          } else {
            loadedMistakes = cloudMistakes;
          }
        } else {
          // 4. User is Guest -> Use Local Mistakes
          loadedMistakes = mappedLocalMistakes;
        }

        setMistakes(loadedMistakes);
      } finally {
        setIsLoading(false);
      }
    };

    loadMistakes();
  }, [user?.uid]);

  const saveState = async (updatedMistakes: MistakeItem[]) => {
    try {
      if (user?.uid) {
        // Save to Cloud
        await db.saveUserMistakes(user.uid, updatedMistakes);
      } else {
        // Save to Local
        const records: StruggleRecord[] = updatedMistakes.map(m => ({
          id: m.uniqueId,
          date: m.dateAdded || new Date().toISOString(),
          question_text: m.question_text,
          student_response: m.student_response,
          correct_answer: m.correct_answer,
        }));
        localStorage.setItem('chekki_local_struggle_history', JSON.stringify(records));
      }
    } catch (error) {
      console.warn('Failed to save mistakes state', error);
    }
  };

  const toggleMistake = (item: WorksheetItem) => {
    // Use Question + Answer for better identity tracking
    const exists = mistakes.find(
      (m) => m.question_text === item.question_text && m.correct_answer === item.correct_answer
    );

    let newMistakes = [...mistakes];
    if (exists) {
      newMistakes = newMistakes.filter((m) => m.uniqueId !== exists.uniqueId);
    } else {
      const newItem: MistakeItem = {
        ...item,
        uniqueId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        dateAdded: new Date().toISOString(),
      };
      newMistakes = [newItem, ...newMistakes];
    }
    
    setMistakes(newMistakes);
    saveState(newMistakes);
  };

  const removeMistake = (uniqueId: string) => {
    const newMistakes = mistakes.filter((m) => m.uniqueId !== uniqueId);
    setMistakes(newMistakes);
    saveState(newMistakes);
  };

  const isMistake = (questionText: string, correctAnswer: string) => {
    return mistakes.some(
      (m) => m.question_text === questionText && m.correct_answer === correctAnswer
    );
  };

  const autoBookmark = (items: WorksheetItem[]) => {
    let newMistakes = [...mistakes];
    let addedAny = false;

    items.forEach((item) => {
      const exists = newMistakes.find(
        (m) => m.question_text === item.question_text && m.correct_answer === item.correct_answer
      );
      if (!exists) {
        newMistakes.unshift({
          ...item,
          uniqueId: Date.now().toString() + Math.random().toString(36).substring(2, 9),
          dateAdded: new Date().toISOString(),
        });
        addedAny = true;
      }
    });

    if (addedAny) {
      setMistakes(newMistakes);
      saveState(newMistakes);
    }
  };

  return (
    <MistakeContext.Provider
      value={{
        mistakes,
        toggleMistake,
        isMistake,
        removeMistake,
        showMistakeModal,
        setShowMistakeModal,
        isLoading,
        autoBookmark,
      }}
    >
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
