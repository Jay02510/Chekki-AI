import { useState, useRef, useCallback } from 'react';
import { AnalysisState, WorksheetAnalysis } from '../../types';
import { analyzeWorksheet } from '../../services/geminiService';
import { db, dbInstance } from '../../services/database';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { generateUUID } from '../../utils/uuid';
import { useMistakes } from '../../contexts/MistakeContext';

const SESSION_KEY = 'hw_last_session';
const GUEST_SCAN_KEY = 'chekki_guest_scan_used';

export const useWorksheetAnalysis = () => {
  const {
    user,
    openLoginModal,
    isAuthenticated,
    incrementScan,
    decrementScan,
    checkScanLimit,
    setShowPaywall,
  } = useAuth();
  const { language } = useLanguage();
  const { autoBookmark } = useMistakes();

  const [analysisState, setAnalysisState] = useState<AnalysisState>({
    status: 'idle',
    data: { worksheet_summary: { title_en: '', title_ko: '', overview_ko: '' }, items: [] },
    originalImage: null,
    errorMessage: null,
    showReward: false,
    isSummaryLoaded: false,
    isItemsLoaded: false,
  });

  const [lastImageData, setLastImageData] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const idempotencyKeyRef = useRef<string | null>(null);

  const executeReset = useCallback(() => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setAnalysisState({
      status: 'idle',
      data: null,
      originalImage: null,
      errorMessage: null,
      showReward: false,
      isSummaryLoaded: false,
      isItemsLoaded: false,
    });
    setLastImageData(null);
    idempotencyKeyRef.current = null;
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const handleImageSelected = useCallback(
    async (base64Data: string) => {
      // Prevent concurrent analysis submissions
      if (analysisState.status === 'analyzing') {
        console.warn(
          '[useWorksheetAnalysis] Analysis already in progress. Ignoring double submission.'
        );
        return;
      }

      // Offline check
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        const displayUrl = `data:image/jpeg;base64,${base64Data}`;
        setAnalysisState({
          status: 'error',
          errorMessage: 'OFFLINE_ERROR',
          data: null,
          originalImage: displayUrl,
          isSummaryLoaded: false,
          isItemsLoaded: false,
        });
        return false;
      }

      // Abort any existing analysis
      if (abortControllerRef.current) abortControllerRef.current.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const guestUsed = localStorage.getItem(GUEST_SCAN_KEY);

      if (!isAuthenticated && guestUsed) {
        openLoginModal();
        return;
      }

      if (isAuthenticated) {
        const canScan = checkScanLimit();
        if (!canScan) return;
      }

      const displayUrl = `data:image/jpeg;base64,${base64Data}`;
      const isRetry = lastImageData === base64Data;
      if (!isRetry || !idempotencyKeyRef.current) {
        idempotencyKeyRef.current = generateUUID();
      }
      setLastImageData(base64Data);

      setAnalysisState({
        status: 'analyzing',
        data: null,
        originalImage: displayUrl,
        errorMessage: null,
        showReward: false,
        isSummaryLoaded: false,
        isItemsLoaded: false,
      });

      try {
        // DEDUCT SCAN: Move this earlier to prevent quota bypass
        // FIX: Do not deduct if this is a retry (the backend idempotency cache will serve the result for free)
        if (!isRetry) {
          if (isAuthenticated && user?.uid) {
            await incrementScan();
          } else {
            localStorage.setItem(GUEST_SCAN_KEY, 'true');
          }
        }

        const result = await analyzeWorksheet(
          base64Data,
          controller.signal,
          user?.plan || 'free',
          user?.childAge,
          user?.childEnglishLevel,
          user?.parentEnglishLevel,
          language,
          idempotencyKeyRef.current
        );

        const hasMessyHandwriting =
          result.worksheet_summary?.has_handwriting &&
          result.worksheet_summary?.is_handwriting_legible === false;

        const newState: AnalysisState = {
          status: 'complete',
          data: result,
          originalImage: displayUrl,
          errorMessage: null,
          showReward: false,
          isSummaryLoaded: true,
          isItemsLoaded: true,
          showHandwritingWarning: hasMessyHandwriting,
        };

        setAnalysisState(newState);
        // Only store critical data in localStorage to keep it light (Omit the massive Base64 image)
        const stateToSave = { ...newState, originalImage: null };
        try {
          localStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ state: stateToSave, timestamp: Date.now() })
          );
        } catch (e) {
          console.warn('Storage warning: Could not save session state', e);
        }

        // Auto-bookmark incorrect items in Odap Note Bank
        if (result.items) {
          const incorrectItems = result.items.filter((item: any) => item.is_correct === false);
          if (incorrectItems.length > 0) {
            autoBookmark(incorrectItems);
          }
        }

        // Auto-sync scan data & red-bordered mistakes to Teacher Class Roster (if user belongs to a class)
        const activeClassId = user?.classId || localStorage.getItem('chekki_user_class_id');
        if (activeClassId && result.items) {
          try {
            const studentUid = user?.uid || `guest_${Date.now()}`;
            const studentName = user?.studentName || user?.name || (language === 'ko' ? '학생' : 'Student');
            const redBorderedItems = result.items.filter((item: any) => item.is_correct === false);
            
            const scanPayload = {
              id: `scan_${Date.now()}_${generateUUID().slice(0, 6)}`,
              classId: activeClassId,
              studentUid,
              studentName,
              scannedAt: new Date().toISOString(),
              titleEn: result.worksheet_summary?.title_en || 'Worksheet Scan',
              titleKo: result.worksheet_summary?.title_ko || '워크시트 분석',
              totalItems: result.items.length,
              correctCount: result.items.length - redBorderedItems.length,
              mistakeCount: redBorderedItems.length,
              totalScore: result.worksheet_summary?.total_score ?? Math.round(((result.items.length - redBorderedItems.length) / Math.max(1, result.items.length)) * 100),
              redBorderedMistakes: redBorderedItems.map((item: any) => ({
                id: item.id,
                type: item.type || 'other',
                question_text: item.question_text || '',
                correct_answer: item.correct_answer || '',
                student_response: item.student_response || '',
                korean_guide: item.korean_guide || '',
                teaching_script_ko: item.teaching_script_ko || '',
              })),
              hasHandwriting: result.worksheet_summary?.has_handwriting || false,
              isLegible: result.worksheet_summary?.is_handwriting_legible !== false,
            };

            // 1. Local Storage Dual-Persistence Sync
            const localClassKey = `class_scans_${activeClassId}`;
            const existingLocal = JSON.parse(localStorage.getItem(localClassKey) || '[]');
            localStorage.setItem(localClassKey, JSON.stringify([scanPayload, ...existingLocal].slice(0, 100)));

            // 2. Firestore Sync (Async background operation)
            if (dbInstance) {
              const scanDocRef = doc(dbInstance, 'classes', activeClassId, 'studentScans', scanPayload.id);
              setDoc(scanDocRef, scanPayload).catch(err => console.warn('Background scan sync warning:', err));
            }
          } catch (syncErr) {
            console.warn('Class scan auto-sync error:', syncErr);
          }
        }

        // Log Analytics
        db.logUserEvent('scan_completed', {
          plan: user?.plan || 'free',
          summary: newState.data?.worksheet_summary?.title_en || 'Start',
        });

        return true; // Success
      } catch (e: unknown) {
        // The scan was deducted before the API call (deliberately, to close
        // a quota-bypass gap — see the DEDUCT SCAN comment above). A failed
        // or aborted request produced no result, so refund it rather than
        // silently costing the user a real scan (their only free one, for
        // guests).
        if (!isRetry) {
          if (isAuthenticated) {
            decrementScan();
          } else {
            localStorage.removeItem(GUEST_SCAN_KEY);
          }
        }

        if (e instanceof Error) {
          if (e.name === 'AbortError') return;
          console.error('[useWorksheetAnalysis] Analysis error:', e.message, e);

          const isGenericFail = !e.message || e.message === 'ANALYSIS_FAILED';
          const errorMsg = isGenericFail
            ? language === 'ko'
              ? '분석에 실패했어요. 밝은 곳에서 사진을 다시 찍어주세요!'
              : 'Analysis failed. Please try taking a clearer picture in good lighting!'
            : e.message;

          setAnalysisState({
            status: 'error',
            errorMessage: errorMsg,
            data: null,
            originalImage: displayUrl,
            isSummaryLoaded: false,
            isItemsLoaded: false,
          });
        } else {
          setAnalysisState({
            status: 'error',
            errorMessage: 'An unknown error occurred.',
            data: null,
            originalImage: displayUrl,
            isSummaryLoaded: false,
            isItemsLoaded: false,
          });
        }
        return false;
      }
    },
    [
      isAuthenticated,
      checkScanLimit,
      openLoginModal,
      incrementScan,
      decrementScan,
      setShowPaywall,
      user?.uid,
      user?.plan,
      user?.childAge,
      user?.childEnglishLevel,
      user?.parentEnglishLevel,
      language,
      analysisState.status,
      lastImageData,
      autoBookmark,
    ]
  );

  const handleScanAgain = useCallback(() => {
    if (lastImageData) handleImageSelected(lastImageData);
    else executeReset();
  }, [lastImageData, handleImageSelected, executeReset]);

  return {
    analysisState,
    setAnalysisState,
    lastImageData,
    handleImageSelected,
    handleScanAgain,
    executeReset,
  };
};
