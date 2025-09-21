export function isTauri(): boolean {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return typeof (window as any).__TAURI__ !== 'undefined';
}

export async function openFileDialog(): Promise<string | null> {
  if (isTauri()) {
    const { open } = await import('@tauri-apps/api/dialog');
    const selection = await open({ multiple: false, title: 'Select image' });
    if (typeof selection === 'string') return selection;
    if (Array.isArray(selection) && selection.length > 0) return selection[0];
    return null;
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      resolve(file ? file.name : null);
    };
    input.click();
  });
}
