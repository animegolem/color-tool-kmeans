export type AsyncListenerErrorHandler = (error: unknown) => void;

/**
 * Own an asynchronously registered listener for a synchronous view lifecycle.
 * Late registrations are immediately released after disposal, and setup
 * failures are consumed by the caller-provided reporter.
 */
export function mountAsyncListener(
  register: () => Promise<(() => void) | null>,
  onError: AsyncListenerErrorHandler
): () => void {
  let disposed = false;
  let unlisten: (() => void) | null = null;

  function attach(registered: (() => void) | null): void {
    if (disposed) {
      registered?.();
      return;
    }
    unlisten = registered;
  }

  function dispose(): void {
    disposed = true;
    unlisten?.();
    unlisten = null;
  }

  try {
    void register().then(attach, onError);
  } catch (error) {
    onError(error);
  }

  return dispose;
}
