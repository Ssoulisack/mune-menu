import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { Button } from "./ui";

interface Props {
  onConfirm: () => void;
  /** Label of the button that opens the popup. */
  children: string;
  disabled?: boolean;
  /** Popup heading, e.g. "Delete “Café Latte”?" */
  title?: string;
  /** What will happen, shown under the heading. */
  message?: ReactNode;
  /** Label of the confirming button in the popup. */
  confirmLabel?: string;
}

// Delete button that asks first in a popup. Uses the native <dialog>: Escape and Cancel close it,
// focus starts on Cancel so a stray Enter doesn't delete, and clicking outside closes it too.
export function ConfirmButton({ onConfirm, children, disabled, title = "Delete this?", message = "This can't be undone.", confirmLabel = "Delete" }: Props) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const messageId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <>
      <Button type="button" variant="danger" disabled={disabled} onClick={() => setOpen(true)}>
        {children}
      </Button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={messageId}
        onClose={() => setOpen(false)}
        // A click on the dialog element itself (not its content) is a click on the backdrop.
        onClick={(e) => e.target === e.currentTarget && setOpen(false)}
        className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl bg-white p-0 text-stone-900 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-[2px]"
      >
        {open && (
          <div className="p-6">
            <div className="flex items-start gap-4">
              <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-red-100 text-red-600">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="size-5">
                  <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
                </svg>
              </span>
              <div className="min-w-0">
                <h2 id={titleId} className="text-lg font-semibold">
                  {title}
                </h2>
                <div id={messageId} className="mt-1 text-sm text-stone-600">
                  {message}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <Button type="button" variant="secondary" autoFocus onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onConfirm();
                }}
                className="inline-flex items-center justify-center rounded-lg bg-red-600 px-3.5 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
