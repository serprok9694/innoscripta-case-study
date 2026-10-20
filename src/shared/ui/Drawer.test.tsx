import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from './Drawer';

/** Drawer wired like real callers: user closes → parent sets `open` to false. */
function Harness({ onClose }: { onClose: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Open</button>
      <button onClick={() => setOpen(false)}>Parent close</button>
      <Drawer
        open={open}
        onClose={() => {
          onClose();
          setOpen(false);
        }}
        title="Filters"
        footer={<button>Apply</button>}
      >
        <p>Content</p>
      </Drawer>
    </>
  );
}

const setup = () => {
  const onClose = vi.fn<() => void>();
  render(<Harness onClose={onClose} />);
  return { onClose, open: () => userEvent.click(screen.getByRole('button', { name: 'Open' })) };
};

describe('Drawer', () => {
  it('opens as a labelled modal dialog', async () => {
    const { open } = setup();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    await open();
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveTextContent('Content');
  });

  it.each([
    ['the close button', () => userEvent.click(screen.getByRole('button', { name: 'Close' }))],
    ['Esc (native close)', () => (screen.getByRole('dialog') as HTMLDialogElement).close()],
    ['the backdrop', () => fireEvent.click(screen.getByRole('dialog'))],
  ])('reports a user close via %s exactly once', async (_how, close) => {
    const { onClose, open } = setup();
    await open();

    await close();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ignores clicks inside the panel', async () => {
    const { onClose, open } = setup();
    await open();
    fireEvent.click(screen.getByText('Content'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not report a close initiated by the parent', async () => {
    const { onClose, open } = setup();
    await open();

    fireEvent.click(screen.getByRole('button', { name: 'Parent close', hidden: true }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('returns focus to the element that opened it', async () => {
    const { open } = setup();
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('can be labelled by an element inside it', () => {
    render(
      <Drawer open onClose={vi.fn<() => void>()} title="The Guardian" labelledBy="headline">
        <h2 id="headline">Bees in decline</h2>
      </Drawer>,
    );
    expect(screen.getByRole('dialog', { name: 'Bees in decline' })).toBeInTheDocument();
  });
});
