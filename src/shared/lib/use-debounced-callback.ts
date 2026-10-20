import { useCallback, useEffect, useRef } from 'react';

/**
 * Debounced version of `callback`. `flush` runs a pending call immediately
 * (e.g. on Enter), `cancel` drops it. Pending calls are cancelled on unmount.
 */
export function useDebouncedCallback<Args extends unknown[]>(
  callback: (...args: Args) => void,
  delayMs: number,
) {
  const callbackRef = useRef(callback);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const pendingRef = useRef<Args | null>(null);

  useEffect(() => {
    callbackRef.current = callback;
  });

  const cancel = useCallback(() => {
    clearTimeout(timerRef.current);
    pendingRef.current = null;
  }, []);

  const flush = useCallback(() => {
    const args = pendingRef.current;
    cancel();
    if (args) callbackRef.current(...args);
  }, [cancel]);

  const run = useCallback(
    (...args: Args) => {
      cancel();
      pendingRef.current = args;
      timerRef.current = setTimeout(flush, delayMs);
    },
    [cancel, flush, delayMs],
  );

  useEffect(() => cancel, [cancel]);

  return { run, flush, cancel };
}
