import { useEffect, useRef } from 'react';

/**
 * useDialog — Modern Web Guidance native <dialog> hook
 *
 * Drives showModal() / close() from a boolean `isOpen` prop so that:
 *  - The native top-layer is used (proper z-index, focus trap, Escape key)
 *  - `@starting-style` entry animations fire correctly
 *  - `transition-behavior: allow-discrete` exit animations run before display: none
 *
 * Usage:
 *   const dialogRef = useDialog(isOpen, onClose);
 *   <dialog ref={dialogRef} className="pf-native-dialog" onClose={onClose}>...</dialog>
 */
export function useDialog(
  isOpen: boolean,
  onClose?: () => void
) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;

    if (isOpen) {
      if (!dialog.open) {
        dialog.showModal();
      }
    } else {
      if (dialog.open) {
        dialog.close();
      }
    }
  }, [isOpen]);

  // Wire native Escape key → onClose callback
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog || !onClose) return;

    const handleCancel = (e: Event) => {
      e.preventDefault(); // let CSS transition finish before hiding
      onClose();
    };

    dialog.addEventListener('cancel', handleCancel);
    return () => dialog.removeEventListener('cancel', handleCancel);
  }, [onClose]);

  return ref;
}
