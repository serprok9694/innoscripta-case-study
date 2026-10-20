import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDebouncedCallback } from './use-debounced-callback';

describe('useDebouncedCallback', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('calls only once with the latest arguments after the delay', () => {
    const callback = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current.run('a');
      vi.advanceTimersByTime(200);
      result.current.run('ab');
      vi.advanceTimersByTime(299);
    });
    expect(callback).not.toHaveBeenCalled();

    act(() => vi.advanceTimersByTime(1));
    expect(callback).toHaveBeenCalledExactlyOnceWith('ab');
  });

  it('flushes a pending call immediately', () => {
    const callback = vi.fn<(value: string) => void>();
    const { result } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => {
      result.current.run('now');
      result.current.flush();
      vi.advanceTimersByTime(300);
    });
    expect(callback).toHaveBeenCalledExactlyOnceWith('now');
  });

  it('does nothing on flush without a pending call, and cancels on unmount', () => {
    const callback = vi.fn<(value: string) => void>();
    const { result, unmount } = renderHook(() => useDebouncedCallback(callback, 300));

    act(() => result.current.flush());
    act(() => result.current.run('late'));
    unmount();
    vi.advanceTimersByTime(300);
    expect(callback).not.toHaveBeenCalled();
  });
});
