import { onMount, tick } from 'svelte';
import { get } from 'svelte/store';
import type { SelectedImage, ValueAnalysisResult, ValueAnalysisState } from '../../stores/ui';
import {
  selectedFile,
  valueAnalysisLevels,
  valueAnalysisResult,
  valueAnalysisState,
  valueAnalysisError,
  setValueAnalysisPending,
  setValueAnalysisSuccess,
  setValueAnalysisError
} from '../../stores/ui';
import { requestValueAnalysis } from '../../bridges/value-analysis';
import { logEvent } from '../../bridges/log';

export function createValueAnalysisRunner() {
  let file = $state<SelectedImage | null>(null);
  let analysis = $state<ValueAnalysisResult | null>(null);
  let displayAnalysis = $state<ValueAnalysisResult | null>(null);
  let displayImageId = $state<string | null>(null);
  let status = $state<ValueAnalysisState>('idle');
  let error = $state<string | null>(null);
  let levels = $state(3);
  let lastMaskKey = '';
  let currentToken = 0;
  let analysisScrollLock: { top: number; token: number | null } | null = null;

  const renderAnalysis = $derived.by(() => analysis ?? displayAnalysis);
  const hasCurrentAnalysis = $derived.by(() => analysis !== null);
  const effectiveNotanMode = $derived.by(() => levels === 2);

  function captureAnalysisScroll() {
    if (typeof document === 'undefined') return;
    const el = document.querySelector('.view-container');
    if (el instanceof HTMLElement) {
      analysisScrollLock = { top: el.scrollTop, token: null };
    }
  }

  function restoreAnalysisScroll(token: number) {
    if (!analysisScrollLock || analysisScrollLock.token !== token) return;
    if (typeof document === 'undefined') return;
    const targetTop = analysisScrollLock.top;
    analysisScrollLock = null;
    Promise.resolve().then(() => {
      requestAnimationFrame(() => {
        const el = document.querySelector('.view-container');
        if (el instanceof HTMLElement) {
          el.scrollTop = targetTop;
        }
      });
    });
  }

  function cancelPending() {
    currentToken += 1;
    analysisScrollLock = null;
  }

  async function ensureAnalysis(
    currentFile: SelectedImage,
    requestedLevels: number,
    requestedNotanMode: boolean
  ) {
    if (!currentFile.path) {
      setValueAnalysisError(
        currentFile.id,
        requestedLevels,
        requestedNotanMode,
        'Value analysis requires a native file path.'
      );
      return;
    }
    currentToken += 1;
    const token = currentToken;
    if (analysisScrollLock) {
      analysisScrollLock.token = token;
    }
    const startedAt = performance.now();
    void logEvent(`values:analysis:start levels=${requestedLevels} twoTone=${requestedNotanMode}`);
    setValueAnalysisPending(currentFile.id, requestedLevels, requestedNotanMode);
    try {
      const result = await requestValueAnalysis(
        currentFile.path,
        currentFile.id,
        requestedLevels,
        requestedNotanMode
      );
      if (token !== currentToken) return;
      const duration = Math.round(performance.now() - startedAt);
      void logEvent(`values:analysis:success ms=${duration}`);
      setValueAnalysisSuccess(currentFile.id, requestedLevels, requestedNotanMode, result);
      restoreAnalysisScroll(token);
    } catch (err) {
      if (token !== currentToken) return;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const duration = Math.round(performance.now() - startedAt);
      void logEvent(`values:analysis:error ms=${duration} message=${message}`);
      setValueAnalysisError(currentFile.id, requestedLevels, requestedNotanMode, message);
    }
  }

  function updateLevels() {
    captureAnalysisScroll();
    valueAnalysisLevels.set(levels);
    void logEvent(`values:levels ${levels}`);
  }

  function trackMaskKey(currentAnalysis: ValueAnalysisResult | null) {
    if (!currentAnalysis || !currentAnalysis.bucketValues.length) {
      lastMaskKey = '';
      return;
    }
    const mapData = currentAnalysis.bucketMapData ?? [];
    const maskKey = `${mapData.length}:${currentAnalysis.previewWidth}x${currentAnalysis.previewHeight}:${
      currentAnalysis.bucketValues.length
    }`;
    if (maskKey === lastMaskKey) return;
    lastMaskKey = maskKey;
  }

  function mount() {
    // Eagerly seed state from store cache to prevent blank flash on tab switch
    const cachedFile = get(selectedFile);
    const cachedAnalysis = get(valueAnalysisResult);
    const cachedState = get(valueAnalysisState);
    const cachedError = get(valueAnalysisError);
    const cachedLevels = get(valueAnalysisLevels);
    file = cachedFile;
    analysis = cachedAnalysis;
    status = cachedState;
    error = cachedError;
    levels = cachedLevels;
    displayImageId = cachedFile?.id ?? null;
    if (cachedAnalysis && cachedFile) {
      displayAnalysis = cachedAnalysis;
    }

    const unsubs = [
      selectedFile.subscribe((value) => {
        file = value;
        const nextId = value?.id ?? null;
        if (displayImageId && nextId !== displayImageId) {
          displayAnalysis = null;
        }
        displayImageId = nextId;
      }),
      valueAnalysisResult.subscribe((value) => {
        const startedAt = performance.now();
        void logEvent(
          `values:analysis:subscribe:start has=${value ? 'yes' : 'no'} map=${
            value?.bucketMapData?.length ?? 0
          }`
        );
        analysis = value;
        if (value && file) {
          displayAnalysis = value;
          displayImageId = file.id;
        }
        const duration = Math.round(performance.now() - startedAt);
        void logEvent(`values:analysis:subscribe:done ms=${duration}`);
      }),
      valueAnalysisState.subscribe((value) => {
        status = value;
      }),
      valueAnalysisError.subscribe((value) => {
        error = value;
      }),
      valueAnalysisLevels.subscribe((value) => {
        levels = value;
      })
    ];
    void logEvent('values:view:mount');
    queueMicrotask(() => {
      void logEvent('values:view:mount:tick');
    });
    void tick().then(() => {
      void logEvent('values:view:mount:afterDOM');
    });
    const rafHandle = window.requestAnimationFrame(() => {
      void logEvent('values:view:mount:raf');
    });
    const afterTick = window.setTimeout(() => {
      void logEvent('values:view:mount:after100ms');
    }, 100);
    return () => {
      unsubs.forEach((unsub) => unsub());
      cancelPending();
      window.cancelAnimationFrame(rafHandle);
      window.clearTimeout(afterTick);
      void logEvent('values:view:unmount');
    };
  }

  return {
    get file() { return file; },
    get analysis() { return renderAnalysis; },
    get hasCurrentAnalysis() { return hasCurrentAnalysis; },
    get status() { return status; },
    get error() { return error; },
    get levels() { return levels; },
    set levels(v: number) { levels = v; },
    get effectiveNotanMode() { return effectiveNotanMode; },
    updateLevels,
    ensureAnalysis,
    cancelPending,
    trackMaskKey,
    mount
  };
}
