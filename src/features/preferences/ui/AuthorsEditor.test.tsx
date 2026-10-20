import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { MAX_FOLLOWED_AUTHORS } from '../preferences-slice';
import { AuthorsEditor } from './AuthorsEditor';

const input = () => screen.getByRole('textbox', { name: 'Author name' });
const followed = () =>
  within(screen.getByRole('list', { name: 'Followed authors' }))
    .getAllByRole('listitem')
    .map((li) => li.textContent);

describe('AuthorsEditor', () => {
  it('follows an author and clears the input', async () => {
    const { store } = renderWithProviders(<AuthorsEditor />);

    await userEvent.type(input(), 'Fiona Harvey{Enter}');

    expect(followed()).toEqual(['Fiona Harvey']);
    expect(input()).toHaveValue('');
    expect(store.getState().preferences.authors).toEqual(['Fiona Harvey']);
  });

  it('explains duplicates instead of adding them', async () => {
    renderWithProviders(<AuthorsEditor />, { preferences: { authors: ['Fiona Harvey'] } });

    await userEvent.type(input(), 'fiona harvey{Enter}');

    expect(screen.getByRole('alert')).toHaveTextContent('You already follow fiona harvey.');
    expect(followed()).toEqual(['Fiona Harvey']);
  });

  it('unfollows authors', async () => {
    const { store } = renderWithProviders(<AuthorsEditor />, {
      preferences: { authors: ['Mark Cocker'] },
    });

    await userEvent.click(screen.getByRole('button', { name: 'Unfollow Mark Cocker' }));

    expect(screen.queryByRole('list', { name: 'Followed authors' })).not.toBeInTheDocument();
    expect(store.getState().preferences.authors).toEqual([]);
  });

  it('disables input at the limit', () => {
    renderWithProviders(<AuthorsEditor />, {
      preferences: { authors: Array.from({ length: MAX_FOLLOWED_AUTHORS }, (_, i) => `A${i}`) },
    });

    expect(input()).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Follow' })).toBeDisabled();
    expect(screen.getByText(/5 of 5 followed/)).toHaveTextContent(
      'Unfollow someone to add another author.',
    );
  });
});
