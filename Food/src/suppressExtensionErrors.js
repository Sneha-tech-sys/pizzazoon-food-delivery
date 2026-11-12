// Suppress third-party Chrome extension errors (like MetaMask) from hijacking React dev error overlay
if (typeof window !== 'undefined') {
  const originalErrorHandler = window.onerror;
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    if (
      (typeof msg === 'string' && msg.includes('MetaMask')) ||
      (typeof url === 'string' && url.includes('chrome-extension')) ||
      (error && error.stack && error.stack.includes('chrome-extension'))
    ) {
      return true;
    }
    if (originalErrorHandler) {
      return originalErrorHandler(msg, url, lineNo, columnNo, error);
    }
    return false;
  };

  window.addEventListener(
    'error',
    (event) => {
      if (
        (event.message && event.message.includes('MetaMask')) ||
        (event.filename && event.filename.includes('chrome-extension')) ||
        (event.error && event.error.stack && event.error.stack.includes('chrome-extension'))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );

  window.addEventListener(
    'unhandledrejection',
    (event) => {
      const reason = event.reason;
      if (
        reason &&
        ((reason.message && reason.message.includes('MetaMask')) ||
          (reason.stack && reason.stack.includes('chrome-extension')))
      ) {
        event.stopImmediatePropagation();
        event.preventDefault();
      }
    },
    true
  );
}

const extensionErrorSuppressed = true;
export default extensionErrorSuppressed;
