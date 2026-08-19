// navigator.clipboard.writeText rejects with NotAllowedError in Capacitor's
// WKWebView once the call happens outside a tight user-gesture window (e.g.
// after an `await navigator.share()` that the user cancelled) — it was
// firing unhandled, crashing the whole screen with a red debug overlay
// instead of failing quietly. Falls back to a hidden-textarea + execCommand
// copy, which isn't gated the same way.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    throw new Error('clipboard API unavailable');
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textarea);
      return copied;
    } catch {
      return false;
    }
  }
}
