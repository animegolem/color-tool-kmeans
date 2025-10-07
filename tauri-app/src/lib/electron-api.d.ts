export {};

declare global {
  interface Window {
    electronAPI?: {
      openFile?(options?: Record<string, unknown>): Promise<string | null>;
      saveFileDialog?(options?: Record<string, unknown>): Promise<string | null>;
      saveBinaryFile?(data: Uint8Array, options?: Record<string, unknown>): Promise<{ canceled: boolean; filePath?: string }>;
      saveTextFile?(text: string, options?: Record<string, unknown>): Promise<{ canceled: boolean; filePath?: string }>;
      openImageFile?(options?: Record<string, unknown>): Promise<{
        canceled: boolean;
        file?: {
          name: string;
          path?: string;
          mimeType?: string;
          size?: number;
          lastModified?: number;
          data?: Uint8Array | number[] | ArrayBuffer;
        };
      }>;
      analyzeImage?(payload: {
        dataset: { width: number; height: number; pixels: Uint8Array };
        params: {
          k: number;
          stride: number;
          minLum: number;
          space: string;
          tol: number;
          maxIter: number;
          seed: number;
          maxSamples: number;
        };
      }): Promise<{
        clusters: Array<{
          count: number;
          share: number;
          centroidSpace: Float32Array | number[];
          rgb: { r: number; g: number; b: number };
          hsv: Float32Array | number[];
        }>;
        iterations: number;
        durationMs: number;
        totalSamples: number;
        variant?: string;
      }>;
    };
  }
}
