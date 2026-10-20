import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LoadMore } from './LoadMore';

type Callback = (entries: Array<{ isIntersecting: boolean }>) => void;

/** Minimal IntersectionObserver that fires on observe(), like the real one. */
class FakeObserver {
  static instances: FakeObserver[] = [];
  static visible = true;
  disconnected = false;
  private readonly callback: Callback;
  constructor(callback: Callback) {
    this.callback = callback;
    FakeObserver.instances.push(this);
  }
  observe() {
    this.callback([{ isIntersecting: FakeObserver.visible }]);
  }
  disconnect() {
    this.disconnected = true;
  }
}

describe('LoadMore', () => {
  beforeEach(() => {
    FakeObserver.instances = [];
    FakeObserver.visible = true;
    vi.stubGlobal('IntersectionObserver', FakeObserver);
  });
  afterEach(() => vi.unstubAllGlobals());

  const props = { hasNextPage: true, isFetchingNextPage: false, itemCount: 10 };

  it('loads more when the sentinel comes into view', () => {
    const onLoadMore = vi.fn<() => void>();
    render(<LoadMore {...props} onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('does not auto-load again until the list grows', () => {
    const onLoadMore = vi.fn<() => void>();
    const { rerender } = render(<LoadMore {...props} onLoadMore={onLoadMore} />);

    rerender(<LoadMore {...props} isFetchingNextPage onLoadMore={onLoadMore} />);
    rerender(<LoadMore {...props} onLoadMore={onLoadMore} />); // page added nothing
    expect(onLoadMore).toHaveBeenCalledOnce();

    rerender(<LoadMore {...props} itemCount={20} onLoadMore={onLoadMore} />);
    expect(onLoadMore).toHaveBeenCalledTimes(2);
  });

  it('does not auto-load while out of view or already fetching', () => {
    FakeObserver.visible = false;
    const onLoadMore = vi.fn<() => void>();
    const { rerender } = render(<LoadMore {...props} onLoadMore={onLoadMore} />);

    FakeObserver.visible = true;
    rerender(<LoadMore {...props} itemCount={11} isFetchingNextPage onLoadMore={onLoadMore} />);
    expect(onLoadMore).not.toHaveBeenCalled();
  });

  it('offers a button and hides when there is nothing more', async () => {
    FakeObserver.visible = false;
    const onLoadMore = vi.fn<() => void>();
    const { rerender } = render(<LoadMore {...props} onLoadMore={onLoadMore} />);

    await userEvent.click(screen.getByRole('button', { name: 'Load more' }));
    expect(onLoadMore).toHaveBeenCalledOnce();

    rerender(<LoadMore {...props} isFetchingNextPage onLoadMore={onLoadMore} />);
    expect(screen.getByRole('button', { name: 'Loading more…' })).toBeDisabled();

    rerender(<LoadMore {...props} hasNextPage={false} onLoadMore={onLoadMore} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(FakeObserver.instances.every((o) => o.disconnected)).toBe(true);
  });
});
