import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { DateField } from '@/features/search/ui/DateField';
import { ChipGroup } from './ChipGroup';

/** Guards against accessible names being replaced by hints or lost on native inputs. */
describe('accessible names', () => {
  it('keeps a disabled chip’s own name and exposes the hint as its description', () => {
    render(
      <ChipGroup
        label="Sources"
        options={[{ value: 'newsapi', label: 'NewsAPI', disabled: true, hint: 'Not configured' }]}
        selected={[]}
        onChange={vi.fn<(selected: string[]) => void>()}
      />,
    );
    const chip = screen.getByRole('button', { name: 'NewsAPI' });
    expect(chip).toHaveAccessibleDescription('Not configured');
    expect(chip).toHaveAttribute('aria-pressed', 'false');
  });

  it('names date inputs by their label', () => {
    render(
      <DateField
        label="From"
        value={undefined}
        onCommit={vi.fn<(value: string | undefined) => void>()}
      />,
    );
    expect(screen.getByLabelText('From')).toHaveAttribute('type', 'date');
  });
});
