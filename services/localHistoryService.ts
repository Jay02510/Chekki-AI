import { WorksheetItem } from '../types';
import { generateUUID } from '../utils/uuid';

const HISTORY_STORAGE_KEY = 'chekki_local_struggle_history';

export interface StruggleRecord {
  id: string;
  date: string;
  question_text: string;
  student_response: string | undefined;
  correct_answer: string;
}

/**
 * Local-First Privacy Storage Service
 *
 * To honor the "Zero Data Stored" promise on the backend while still allowing
 * personalized PDF worksheet generation, we store the student's historical
 * struggle data strictly on the local device.
 */
export const localHistoryService = {
  /**
   * Save a list of items the student got wrong to local storage.
   */
  logStruggles: async (items: WorksheetItem[]): Promise<void> => {
    try {
      const incorrectItems = items.filter((item) => item.is_correct === false);
      if (incorrectItems.length === 0) return;

      const newRecords: StruggleRecord[] = incorrectItems.map((item) => ({
        // Date.now().toString() collided across multiple wrong answers
        // logged in the same millisecond by this .map() on a WebView
        // without crypto.randomUUID — generateUUID() already has a
        // collision-safe fallback elsewhere in the codebase, reused here.
        id: generateUUID(),
        date: new Date().toISOString(),
        question_text: item.question_text,
        student_response: item.student_response,
        correct_answer: item.correct_answer,
      }));

      const existingData = localStorage.getItem(HISTORY_STORAGE_KEY);
      let history: StruggleRecord[] = existingData ? JSON.parse(existingData) : [];

      // Append new records and keep only the last 50 struggles to prevent bloating
      history = [...history, ...newRecords].slice(-50);

      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (error) {
      console.warn('[localHistoryService] Failed to log struggles locally', error);
    }
  },

  /**
   * Retrieve the student's recent struggle history for PDF generation.
   */
  getRecentStruggles: async (): Promise<StruggleRecord[]> => {
    try {
      const existingData = localStorage.getItem(HISTORY_STORAGE_KEY);
      return existingData ? JSON.parse(existingData) : [];
    } catch (error) {
      console.warn('[localHistoryService] Failed to retrieve local history', error);
      return [];
    }
  },

  /**
   * Clear all local history (e.g. on account deletion or manual clear).
   */
  clearHistory: async (): Promise<void> => {
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch (error) {
      console.warn('[localHistoryService] Failed to clear local history', error);
    }
  },
};
