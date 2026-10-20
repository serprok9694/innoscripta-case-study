import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './Drawer';

describe('Drawer', () => {
  const renderDrawer = (open: boolean, onClose = vi.fn<() => void>()) => {
    const view = render(
      <Drawer open={open} onClose={onClose} title="Filters" footer={<button>Apply</button>}>
        <p>Content</p>
      </Drawer>,
    );
    return { ...view, onClose };
  };

  it('opens as a labelled modal dialog', () => {
    const { rerender, onClose } = renderDrawer(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    rerender(
      <Drawer open onClose={onClose} title="Filters">
        <p>Content</p>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveTextContent('Content');
  });

  it('closes via the close button, Esc (native close event) and the backdrop', async () => {
    const { onClose } = renderDrawer(true);
    const dialog = screen.getByRole('dialog');

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    fireEvent(dialog, new Event('close'));
    fireEvent.click(dialog); // the dialog element itself = its backdrop
    fireEvent.click(screen.getByText('Content')); // inside: ignored

    expect(onClose).toHaveBeenCalledTimes(3);
  });
});
