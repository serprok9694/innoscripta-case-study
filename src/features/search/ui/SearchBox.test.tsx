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

  it('waits for a couple of characters before searching as you type', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(<SearchBox value="" onChange={onChange} debounceMs={10} />);

    await userEvent.type(getInput(), 'a');
    await new Promise((resolve) => setTimeout(resolve, 30));
    expect(onChange).not.toHaveBeenCalled();

    await userEvent.type(getInput(), '{Enter}'); // Enter always searches
    expect(onChange).toHaveBeenCalledExactlyOnceWith('a');
  });

  it('drops a pending search when the value changes from outside', async () => {
    const onChange = vi.fn<(value: string) => void>();
    const { rerender } = render(<SearchBox value="" onChange={onChange} debounceMs={50} />);

    await userEvent.type(getInput(), 'bees');
    rerender(<SearchBox value="climate" onChange={onChange} debounceMs={50} />); // e.g. Back
    await new Promise((resolve) => setTimeout(resolve, 80));

    expect(onChange).not.toHaveBeenCalled();
    expect(getInput()).toHaveValue('climate');
  });
});
