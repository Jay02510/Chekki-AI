import { useCallback, useState } from 'react';

const DEFAULT_EXIT_MS = 180;

/**
 * Every hand-rolled modal in this app enters with CSS (`.modal-enter`,
 * @starting-style) but unmounts the instant its parent's `isOpen` state goes
 * false — there's no window for an exit transition to play. Rather than
 * rewire every `{x && <Modal/>}` call site to stay mounted during close,
 * the modal delays its own real `onClose` by `durationMs` and exposes
 * `isClosing` so it can swap `.modal-enter` for `.modal-exit` in the
 * meantime — the close reads as animated with zero parent changes.
 */
export function useModalExit(onClose: () => void, durationMs: number = DEFAULT_EXIT_MS) {
  const [isClosing, setIsClosing] = useState(false);

  const close = useCallback(() => {
    setIsClosing(true);
    setTimeout(onClose, durationMs);
  }, [onClose, durationMs]);

  return { isClosing, close };
}
