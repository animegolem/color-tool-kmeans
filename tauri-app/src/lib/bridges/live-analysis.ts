import { listen } from '@tauri-apps/api/event';
import type { AnalysisResult } from '../stores/analysis';
import { tauriInvoke } from './tauri';

export interface LiveAnalysisStartRequest {
  path: string;
  startTimestamp: number;
  k: number;
  ignoreTopN: number;
  mergeThreshold: number;
  snapToReal: boolean;
}

export interface LiveAnalysisFrame {
  sessionId: number;
  timestamp: number;
  droppedFrames: number;
  effectiveFps: number;
  analysis: AnalysisResult;
}

export interface LiveAnalysisError {
  sessionId: number;
  message: string;
}

export async function startLiveAnalysis(
  req: LiveAnalysisStartRequest
): Promise<{ sessionId: number }> {
  return (await tauriInvoke('start_live_analysis', { req })) as {
    sessionId: number;
  };
}

export async function stopLiveAnalysis(): Promise<void> {
  await tauriInvoke('stop_live_analysis');
}

export async function listenToLiveAnalysis(
  onFrame: (frame: LiveAnalysisFrame) => void,
  onError: (error: LiveAnalysisError) => void
): Promise<() => void> {
  const unlistenFrame = await listen<LiveAnalysisFrame>(
    'live-analysis-frame',
    (event) => onFrame(event.payload)
  );
  try {
    const unlistenError = await listen<LiveAnalysisError>(
      'live-analysis-error',
      (event) => onError(event.payload)
    );
    return () => {
      unlistenFrame();
      unlistenError();
    };
  } catch (error) {
    unlistenFrame();
    throw error;
  }
}
