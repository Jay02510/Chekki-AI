import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared dialog behavior for every hand-rolled modal in the app: traps Tab
 * focus inside the dialog, closes on Escape, and returns focus to whatever
 * triggered the dialog when it closes. None of the app's modals had this —
 * even the two with correct role="dialog"/aria-modal markup — so keyboard
 * and screen-reader users could tab out of an open modal into the page
 * behind it, or had no way to dismiss one without a mouse (Audit: no modal
 * has dialog semantics, focus trap, or Escape-to-close, on every surface).
 *
 * Usage: attach the returned ref to the dialog's outer element (the one
 * carrying role="dialog") and give that element tabIndex={-1}.
 */
export function useDialogA11y<T extends HTMLElement>({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose?: () => void;
}) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const node = ref.current;

    const focusables = () =>
      node ? Array.from(node.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)) : [];

    // Move focus into the dialog. Prefer its first focusable control so a
    // form's first field is ready to type into; fall back to the dialog
    // shell itself so screen readers still announce it opened.
    const initial = focusables()[0] ?? node;
    initial?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
        return;
      }
      if (e.key !== 'Tab') return;

      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      const active = document.activeElement;

      if (e.shiftKey && (active === first || !node?.contains(active))) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  return ref;
}
