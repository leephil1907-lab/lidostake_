import React, { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useAppKit, useAppKitState } from '@reown/appkit/react';
import { ShieldAlert, CheckCircle2, RefreshCw, Radio } from 'lucide-react';

export function ConnectionStatusIndicator() {
  const { isConnected, isConnecting, isReconnecting, status } = useAccount();
  const chainId = useChainId();
  const { open } = useAppKit();
  const appKitState = useAppKitState();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const reason = String(event.reason?.message || event.reason || '');
      if (reason.includes('Reown') || reason.includes('WalletConnect') || reason.includes('AppKit')) {
        setHasError(true);
      }
    };
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    return () => window.removeEventListener('unhandledrejection', handleUnhandledRejection);
  }, []);

  const getChainName = (id: number) => {
    switch (id) {
      case 1: return 'Ethereum';
      case 42161: return 'Arbitrum';
      default: return 'Mainnet';
    }
  };

  if (hasError) {
    return (
      <div 
        onClick={() => { setHasError(false); open(); }}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 cursor-pointer hover:bg-amber-500/20 transition-colors"
        title="Reown connection notice. Click to reconnect modal."
      >
        <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
        <span>Reown Notice</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span>{getChainName(chainId)}</span>
      </div>
    );
  }

  if (isConnecting || isReconnecting) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-500 border border-sky-500/20">
        <RefreshCw className="w-3 h-3 animate-spin" />
        <span>Connecting...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-400 border border-slate-500/20">
      <Radio className="w-3 h-3 text-emerald-500" />
      <span>Web3 Active</span>
    </div>
  );
}
