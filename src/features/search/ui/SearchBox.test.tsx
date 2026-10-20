import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SearchBox } from './SearchBox';

const getInput = () => screen.getByRole('searchbox', { name: 'Search articles' });

describe('SearchBox', () => {
  it('reports the trimmed value once typing pauses', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchBox value="" onChange={onChange} debounceMs={50} />);

    await userEvent.type(getInput(), ' climate ');
    expect(onChange).not.toHaveBeenCalled();
    await vi.waitFor(() => expect(onChange).toHaveBeenCalledExactlyOnceWith('climate'));
  });

  it('searches immediately on Enter', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchBox value="" onChange={onChange} debounceMs={10_000} />);

    await userEvent.type(getInput(), 'ai{Enter}');
    expect(onChange).toHaveBeenCalledExactlyOnceWith('ai');
  });

  it('follows external value changes', () => {
    const { rerender } = render(
      <SearchBox value="old" onChange={vi.fn<(value: string) => void>()} />,
    );
    expect(getInput()).toHaveValue('old');

    rerender(<SearchBox value="new" onChange={vi.fn<(value: string) => void>()} />);
    expect(getInput()).toHaveValue('new');
  });
});
