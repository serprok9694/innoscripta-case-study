import { type ReactNode, useEffect, useId, useRef } from 'react';
import { cx } from '@/shared/lib/cx';
import { CloseIcon } from './icons';

type Placement = 'bottom' | 'adaptive';

const PLACEMENT: Record<Placement, { dialog: string; panel: string }> = {
  bottom: {
    dialog: 'mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none',
    panel: 'max-h-[85dvh]',
  },
  // Bottom sheet on phones, full-height side panel from the right on larger screens.
  adaptive: {
    dialog:
      'mx-0 mt-auto mb-0 max-h-[85dvh] w-full max-w-none sm:my-0 sm:mr-0 sm:ml-auto sm:h-dvh sm:max-h-none sm:w-[30rem]',
    panel: 'max-h-[85dvh] sm:h-full sm:max-h-none',
  },
};

interface DrawerProps {
  open: boolean;
  /** Called when the user closes the drawer (close button, Esc, backdrop). */
  onClose: () => void;
  /** Shown in the drawer's header bar. */
  title: string;
  /** Id of the element that names the dialog, if not the header title. */
  labelledBy?: string;
  placement?: Placement;
  children: ReactNode;
  footer?: ReactNode;
}

/**
 * Drawer on a native modal <dialog>: focus trapping, Esc to close, inert
 * background and dialog semantics come from the browser. Focus returns to
 * whatever opened it.
 */
export function Drawer({
  open,
  onClose,
  title,
  labelledBy,
  placement = 'bottom',
  children,
  footer,
}: DrawerProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  /** Set while the parent closes us, so that `close` event isn't reported back as a user close. */
  const closingFromProp = useRef(false);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    }
    if (!open && dialog.open) {
      closingFromProp.current = true;
      dialog.close();
    }
  }, [open]);

  const handleClose = () => {
    if (opener.current?.isConnected) opener.current.focus();
    opener.current = null;
    if (closingFromProp.current) {
      closingFromProp.current = false;
      return;
    }
    onClose();
  };

  const styles = PLACEMENT[placement];

  return (
    // Backdrop clicks are a mouse convenience; keyboard users close with Esc (native).
    // oxlint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      aria-labelledby={labelledBy ?? titleId}
      onClose={handleClose}
      // A click on the dialog element itself is a click on the backdrop.
      onClick={(event) => event.target === ref.current && ref.current.close()}
      className={cx(
        'bg-white p-0 text-zinc-900 shadow-xl backdrop:bg-black/50 dark:bg-zinc-900 dark:text-zinc-100',
        styles.dialog,
      )}
    >
      <div className={cx('flex flex-col', styles.panel)}>
        <div className="flex items-center justify-between gap-4 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <h2 id={titleId} className="truncate font-semibold">
            {title}
          </h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label="Close"
            className="shrink-0 rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            <CloseIcon className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-5">{children}</div>
        {footer && (
          <div className="border-t border-zinc-200 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] dark:border-zinc-800">
            {footer}
          </div>
        )}
      </div>
    </dialog>
  );
}
