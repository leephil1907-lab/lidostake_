import { useEffect } from 'react';

const TAWK_SRC = 'https://embed.tawk.to/6a9ee8bd108ee9344fa786e5/default';

export function TawkWidget() {
  useEffect(() => {
    if (document.getElementById('tawk-widget-script')) return;
    const script = document.createElement('script');
    script.id = 'tawk-widget-script';
    script.async = true;
    script.src = TAWK_SRC;
    script.charset = 'UTF-8';
    script.setAttribute('crossorigin', '*');
    document.body.appendChild(script);
    return () => {
      // Leave the widget mounted during SPA navigation; Tawk owns its iframe lifecycle.
    };
  }, []);

  return null;
}
