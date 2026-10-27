import { useState, useRef, useCallback } from 'react';
import { saveScan, type SavedScan } from '../utils/scanHistory';
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
        saveScan({ id: idempotencyKeyRef.current || String(Date.now()), owner: user?.uid || 'guest', at: Date.now(), image: displayUrl, data: result });
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

        // The class copy (classes/{classId}/studentScans) is written by the
        // server in api/_lib/analyze/scan.ts, not here.

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

          // Distinct failure modes (rate limit / offline / network / server
          // outage) used to all collapse into "take a clearer picture" or a
          // raw internal code like "NETWORK_ERROR: Check connectivity to
          // ..." shown verbatim — misleading when the photo was fine and the
          // real cause was an API outage or dropped connection.
          let errorMsg: string;
          if (e.message === 'OFFLINE_ERROR') {
            errorMsg = language === 'ko'
              ? '오프라인 상태예요. 인터넷 연결을 확인해주세요.'
              : "You're offline. Please check your internet connection.";
          } else if (e.message.startsWith('NETWORK_ERROR')) {
            errorMsg = language === 'ko'
              ? '네트워크 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.'
              : 'Network connection issue. Please try again in a moment.';
          } else if (e.message.includes('Too Many Requests') || e.message.includes('429')) {
            errorMsg = language === 'ko'
              ? '요청이 많아 잠시 지연되고 있어요. 잠시 후 다시 시도해주세요.'
              : "We're getting a lot of requests right now. Please try again shortly.";
          } else if (e.message.includes('AI_TEMPORARILY_UNAVAILABLE') || e.message.includes('503')) {
            errorMsg = language === 'ko'
              ? 'AI 서버가 일시적으로 응답하지 않아요. 잠시 후 다시 시도해주세요.'
              : 'The AI service is temporarily unavailable. Please try again shortly.';
          } else if (!e.message || e.message === 'ANALYSIS_FAILED') {
            errorMsg = language === 'ko'
              ? '분석에 실패했어요. 밝은 곳에서 사진을 다시 찍어주세요!'
              : 'Analysis failed. Please try taking a clearer picture in good lighting!';
          } else {
            errorMsg = e.message;
          }

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

  // Reopen a past scan from this device. No API call, no scan used.
  const openSavedScan = useCallback((scan: SavedScan) => {
    setLastImageData(null);
    setAnalysisState({
      status: 'complete',
      data: scan.data,
      originalImage: scan.image,
      errorMessage: null,
      showReward: false,
      isSummaryLoaded: true,
      isItemsLoaded: true,
    });
  }, []);

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
    openSavedScan,
  };
};
