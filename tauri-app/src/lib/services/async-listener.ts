export type AsyncListenerErrorHandler = (error: unknown) => void;

/**
 * Own an asynchronously registered listener for a synchronous view lifecycle.
 * Late registrations are immediately released after disposal, and setup or
 * cleanup failures are consumed by the caller-provided reporter.
 */
export function mountAsyncListener(
  register: () => Promise<(() => void) | null>,
  onError: AsyncListenerErrorHandler
): () => void {
  let disposed = false;
  let unlisten: (() => void) | null = null;

  function release(listener: (() => void) | null): void {
    try {
      listener?.();
    } catch (error) {
      onError(error);
    }
  }

  function attach(registered: (() => void) | null): void {
    if (disposed) {
      release(registered);
      return;
    }
    unlisten = registered;
  }

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    const registered = unlisten;
    unlisten = null;
    release(registered);
  }

  try {
    void register().then(attach, onError);
  } catch (error) {
    onError(error);
  }

  return dispose;
}
