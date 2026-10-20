import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from './SegmentedControl';

describe('SegmentedControl', () => {
  it('is a labelled radio group', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(
      <SegmentedControl
        label="Theme"
        options={[
          { value: 'light', label: 'Light' },
          { value: 'dark', label: 'Dark' },
        ]}
        value="light"
        onChange={onChange}
      />,
    );

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeChecked();

    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));
    expect(onChange).toHaveBeenCalledWith('dark');
  });

  it('can be disabled and show its label', () => {
    render(
      <SegmentedControl
        label="Sort"
        showLabel
        disabled
        options={[{ value: 'newest', label: 'Newest' }]}
        value="newest"
        onChange={vi.fn<(value: string) => void>()}
      />,
    );
    expect(screen.getByRole('group', { name: 'Sort' })).toBeDisabled();
    expect(screen.getByRole('radio', { name: 'Newest' })).toBeDisabled();
    // Visible label for sighted users; the legend names the group for screen readers.
    expect(screen.getByText('Sort', { selector: 'span' })).toBeVisible();
  });
});
