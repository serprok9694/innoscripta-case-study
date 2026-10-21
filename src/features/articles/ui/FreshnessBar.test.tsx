import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FreshnessBar } from './FreshnessBar';

describe('FreshnessBar', () => {
  it('says how old the feed is and refreshes it on request', async () => {
    const onRefresh = vi.fn<() => void>();
    render(<FreshnessBar updatedAt={Date.now() - 6 * 60_000} onRefresh={onRefresh} />);

    expect(screen.getByText('Updated 6 minutes ago')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Refresh' }));
    expect(onRefresh).toHaveBeenCalledOnce();
  });

  it('stays hidden before the first load', () => {
    const { container } = render(<FreshnessBar updatedAt={0} onRefresh={vi.fn<() => void>()} />);
    expect(container).toBeEmptyDOMElement();
  });
});
