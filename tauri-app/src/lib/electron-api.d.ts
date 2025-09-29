export {};

declare global {
  interface Window {
    electronAPI?: {
      openFile?(options?: Record<string, unknown>): Promise<string | null>;
      saveFileDialog?(options?: Record<string, unknown>): Promise<string | null>;
      saveBinaryFile?(data: Uint8Array, options?: Record<string, unknown>): Promise<{ canceled: boolean; filePath?: string }>;
      saveTextFile?(text: string, options?: Record<string, unknown>): Promise<{ canceled: boolean; filePath?: string }>;
    };
  }
}
