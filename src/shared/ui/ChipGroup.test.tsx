import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChipGroup } from './ChipGroup';

const options = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: 'c', label: 'Gamma', disabled: true, hint: 'Not available' },
] as const;

describe('ChipGroup', () => {
  it('exposes selection state to assistive tech', () => {
    render(
      <ChipGroup
        label="Letters"
        options={options}
        selected={['b']}
        onChange={vi.fn<(selected: string[]) => void>()}
      />,
    );

    expect(screen.getByRole('group', { name: 'Letters' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Alpha' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Beta' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Gamma' })).toBeDisabled();
  });

  it('toggles options', async () => {
    const onChange = vi.fn<(selected: string[]) => void>();
    render(<ChipGroup label="Letters" options={options} selected={['b']} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Alpha' }));
    expect(onChange).toHaveBeenLastCalledWith(['b', 'a']);

    await userEvent.click(screen.getByRole('button', { name: 'Beta' }));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});
