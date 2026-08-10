import { Buffer } from 'buffer';
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
  (window as any).global = window;
}
if (typeof globalThis !== 'undefined') {
  (globalThis as any).Buffer = Buffer;
}

import './analytics-interceptor';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter, queryClient } from './config/web3';
import { ErrorBoundary } from './components/ErrorBoundary';
import App from './App.tsx';
import './index.css';

// Health check log to confirm the application bundle is loaded and running on host
if (typeof window !== 'undefined') {
  console.log('[Lido App Health Check] Application bundle successfully mounted at', new Date().toISOString(), 'Host:', window.location.host);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <WagmiProvider config={wagmiAdapter.wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  </StrictMode>,
);


