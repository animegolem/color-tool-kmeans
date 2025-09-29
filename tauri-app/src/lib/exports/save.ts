interface SaveResult {
  canceled: boolean;
  path?: string;
}

interface ElectronSaveResponse {
  canceled: boolean;
  filePath?: string;
}

export async function saveBlob(blob: Blob, defaultName: string): Promise<SaveResult> {
  if (window.electronAPI?.saveBinaryFile) {
    const uint8 = new Uint8Array(await blob.arrayBuffer());
    const response = (await window.electronAPI.saveBinaryFile(uint8, { defaultPath: defaultName })) as ElectronSaveResponse;
    return { canceled: response.canceled, path: response.filePath };
  }

  const url = URL.createObjectURL(blob);
  try {
    triggerDownload(url, defaultName);
    return { canceled: false };
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export async function saveTextFile(text: string, defaultName: string): Promise<SaveResult> {
  if (window.electronAPI?.saveTextFile) {
    const response = (await window.electronAPI.saveTextFile(text, { defaultPath: defaultName })) as ElectronSaveResponse;
    return { canceled: response.canceled, path: response.filePath };
  }

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  return saveBlob(blob, defaultName);
}

function triggerDownload(href: string, filename: string) {
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = 'noopener';
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}
