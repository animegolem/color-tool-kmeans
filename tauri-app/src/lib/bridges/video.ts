import { tauriInvoke } from './tauri';
import {
  parseVideoFrameResponse,
  parseVideoProbeResponse,
  parseVideoStripResponse,
  type VideoFrameResponse,
  type VideoProbeResponse,
  type VideoStripResponse,
} from './ipc-contracts';

export type {
  VideoFrameResponse,
  VideoProbeResponse,
  VideoStripResponse,
} from './ipc-contracts';

export interface VideoFrameRequest {
  path: string;
  frameId: string;
  timestamp: number;
  maxDimension: number;
}

export interface VideoStripRequest {
  path: string;
  stripId: string;
  duration: number;
  thumbCount: number;
  thumbWidth: number;
  thumbHeight: number;
  stripMode?: 'filmstrip' | 'barcode';
}

export async function extractVideoFrame(
  req: VideoFrameRequest
): Promise<VideoFrameResponse> {
  const response = await tauriInvoke('extract_video_frame', { req });
  return parseVideoFrameResponse(response);
}

export async function probeVideo(path: string): Promise<VideoProbeResponse> {
  const response = await tauriInvoke('probe_video', { req: { path } });
  return parseVideoProbeResponse(response);
}

export async function extractVideoStrip(
  req: VideoStripRequest
): Promise<VideoStripResponse> {
  const response = await tauriInvoke('extract_video_strip', { req });
  return parseVideoStripResponse(response);
}
