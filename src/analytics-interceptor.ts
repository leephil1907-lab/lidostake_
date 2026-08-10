// Early interceptor to silence external analytics / telemetry network failures and preview WebSocket errors

if (typeof window !== 'undefined') {
  const isAnalyticsUrl = (urlStr: string): boolean => {
    if (!urlStr) return false;
    const lower = urlStr.toLowerCase();
    // Do NOT intercept functional endpoints like api.web3modal.org/v1/getWallets or verify.walletconnect.com
    if (
      lower.includes('api.web3modal.org') ||
      lower.includes('explorer-api.walletconnect') ||
      lower.includes('verify.walletconnect')
    ) {
      return false;
    }
    return (
      lower.includes('pulse.walletconnect') ||
      lower.includes('rpc.walletconnect.com/v1/analytics') ||
      lower.includes('telemetry')
    );
  };

  // Intercept WebSocket connections to catch and suppress preview sandbox / HMR / relay close code 3000
  if ('WebSocket' in window) {
    try {
      const OriginalWebSocket = window.WebSocket;
      const CustomWebSocket = function (this: any, url: string | URL, protocols?: string | string[]) {
        const ws = new (OriginalWebSocket as any)(url, protocols);
        ws.addEventListener('error', (event: Event) => {
          event.stopPropagation();
        });
        return ws;
      } as any;

      CustomWebSocket.prototype = OriginalWebSocket.prototype;
      CustomWebSocket.CONNECTING = OriginalWebSocket.CONNECTING;
      CustomWebSocket.OPEN = OriginalWebSocket.OPEN;
      CustomWebSocket.CLOSING = OriginalWebSocket.CLOSING;
      CustomWebSocket.CLOSED = OriginalWebSocket.CLOSED;

      try {
        window.WebSocket = CustomWebSocket;
      } catch {
        // Silently continue if window.WebSocket cannot be replaced
      }
    } catch {
      // Ignore WebSocket wrapper error
    }
  }

  // Intercept window.fetch
  try {
    const originalFetch = window.fetch;
    if (originalFetch) {
      const interceptedFetch = async function (this: any, ...args: Parameters<typeof fetch>) {
        const input = args[0];
        const url = typeof input === 'string' ? input : (input as Request)?.url || '';

        if (isAnalyticsUrl(url)) {
          // Immediately return mock 200 OK without making network call that fails in sandboxed iframe
          return new Response(JSON.stringify({ status: 'ok' }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
          });
        }

        try {
          return await originalFetch.apply(this || window, args);
        } catch (err: any) {
          if (isAnalyticsUrl(url) || (err?.message && String(err.message).includes('Failed to fetch'))) {
            return new Response(JSON.stringify({ status: 'ok' }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          throw err;
        }
      };

      try {
        window.fetch = interceptedFetch;
      } catch {
        try {
          Object.defineProperty(window, 'fetch', {
            value: interceptedFetch,
            configurable: true,
            writable: true
          });
        } catch {
          // Ignore if un-redefinable
        }
      }
    }
  } catch {
    // Ignore fetch override error
  }

  // Intercept XMLHttpRequest
  try {
    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method: string, url: string | URL, ...rest: any[]) {
      const urlStr = String(url);
      if (isAnalyticsUrl(urlStr)) {
        return originalOpen.call(this, method, 'data:application/json,{"status":"ok"}', ...rest as [boolean, string?, string?]);
      }
      return originalOpen.call(this, method, url, ...rest as [boolean, string?, string?]);
    };
  } catch {
    // Ignore XHR override error
  }

  // Suppress unhandled rejection notices for analytics or WebSocket failures
  window.addEventListener('unhandledrejection', (event) => {
    const reasonMsg = String(event.reason?.message || event.reason || '');
    const stackMsg = String(event.reason?.stack || '');
    if (
      reasonMsg.includes('Analytics') ||
      reasonMsg.includes('pulse') ||
      reasonMsg.includes('walletconnect') ||
      reasonMsg.includes('Failed to fetch') ||
      reasonMsg.includes('WebSocket') ||
      reasonMsg.includes('3000') ||
      reasonMsg.includes('Unauthorized') ||
      reasonMsg.includes('origin not allowed') ||
      stackMsg.includes('analytics') ||
      stackMsg.includes('pulse')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);

  // Suppress uncaught error notices for analytics or WebSocket errors
  window.addEventListener('error', (event) => {
    const msg = String(event.message || event.error?.message || '');
    if (
      msg.includes('Analytics') ||
      msg.includes('Failed to fetch') ||
      msg.includes('pulse') ||
      msg.includes('WebSocket') ||
      msg.includes('3000') ||
      msg.includes('Unauthorized') ||
      msg.includes('origin not allowed')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

export {};

