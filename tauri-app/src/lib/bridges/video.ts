import { tauriInvoke } from './tauri';

export interface VideoFrameRequest {
  path: string;
  frameId: string;
  timestamp: number;
  maxDimension: number;
}

export interface VideoFrameResponse {
  path: string;
}

export interface VideoProbeResponse {
  duration: number;
  fps?: number;
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

export interface VideoStripResponse {
  path: string;
}

export async function extractVideoFrame(req: VideoFrameRequest): Promise<VideoFrameResponse> {
  const response = await tauriInvoke('extract_video_frame', { req });
  return response as VideoFrameResponse;
}

export async function probeVideo(path: string): Promise<VideoProbeResponse> {
  const response = await tauriInvoke('probe_video', { req: { path } });
  return response as VideoProbeResponse;
}

export async function extractVideoStrip(req: VideoStripRequest): Promise<VideoStripResponse> {
  const response = await tauriInvoke('extract_video_strip', { req });
  return response as VideoStripResponse;
}
