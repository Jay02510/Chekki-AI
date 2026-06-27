import { useState, useRef, useCallback } from 'react';
import { AnalysisState, WorksheetAnalysis } from '../../types';
import { analyzeWorksheet } from '../../services/geminiService';
import { db } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { generateUUID } from '../../utils/uuid';
import { useMistakes } from '../../contexts/MistakeContext';

const SESSION_KEY = 'hw_last_session';
const GUEST_SCAN_KEY = 'chekki_guest_scan_used';

export const useWorksheetAnalysis = () => {
  const { user, openLoginModal, isAuthenticated, incrementScan, checkScanLimit, setShowPaywall } =
    useAuth();
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
        if (isAuthenticated && user?.uid) {
          await incrementScan();
        } else {
          localStorage.setItem(GUEST_SCAN_KEY, 'true');
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

        const newState: AnalysisState = {
          status: 'complete',
          data: result,
          originalImage: displayUrl,
          errorMessage: null,
          showReward: false,
          isSummaryLoaded: true,
          isItemsLoaded: true,
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

        // Auto-bookmark incorrect items
        if (result.items) {
          const incorrectItems = result.items.filter((item: any) => item.is_correct === false);
          if (incorrectItems.length > 0) {
            autoBookmark(incorrectItems);
          }
        }

        // Log Analytics
        db.logUserEvent('scan_completed', {
          plan: user?.plan || 'free',
          summary: newState.data?.worksheet_summary?.title_en || 'Start',
        });

        return true; // Success
      } catch (e: unknown) {
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
