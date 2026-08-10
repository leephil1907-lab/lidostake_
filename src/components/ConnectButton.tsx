import React, { useState } from 'react';
import { useAccount, useBalance, useReadContracts, useDisconnect, useConnect } from 'wagmi';
import { useAppKit } from '@reown/appkit/react';
import { appKit } from '../config/web3';
import { formatEther } from 'viem';
import { ChevronDown, ExternalLink, Copy, Check, Wallet, ShieldCheck, RefreshCw } from 'lucide-react';
import { CONFIG, ERC20_ABI } from '../lib/contracts';
import { StEthIcon, WstEthIcon, EthIcon } from './TokenIcons';

interface ConnectButtonProps {
  className?: string;
}

export function ConnectButton({ className }: ConnectButtonProps) {
  const { open } = useAppKit();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { connectors, connect } = useConnect();

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showFallbackModal, setShowFallbackModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleOpenWallet = async () => {
    try {
      if (open) {
        await open();
      } else if (appKit?.open) {
        await appKit.open();
      } else {
        setShowFallbackModal(true);
      }
    } catch (err) {
      console.warn('[ConnectButton] Reown AppKit open error, showing connector fallback:', err);
      setShowFallbackModal(true);
    }
  };

  // 1. Precise ETH Balance
  const { data: ethBalanceData, isLoading: isEthLoading, refetch: refetchEth } = useBalance({
    address,
    query: { enabled: Boolean(address && isConnected) },
  });

  // 2. Multicall Batch Read for stETH and wstETH Balances
  const { data: tokenBalancesData, isLoading: isTokensLoading, refetch: refetchTokens } = useReadContracts({
    contracts: [
      {
        address: CONFIG.STETH_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
      {
        address: CONFIG.WSTETH_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
      },
    ],
    query: { enabled: Boolean(address && isConnected) },
  });

  const stEthRaw = tokenBalancesData?.[0]?.result as bigint | undefined;
  const wstEthRaw = tokenBalancesData?.[1]?.result as bigint | undefined;

  const formattedEth = ethBalanceData ? parseFloat(formatEther(ethBalanceData.value)).toFixed(4) : '0.0000';
  const formattedStEth = stEthRaw !== undefined ? parseFloat(formatEther(stEthRaw)).toFixed(4) : '0.0000';
  const formattedWstEth = wstEthRaw !== undefined ? parseFloat(formatEther(wstEthRaw)).toFixed(4) : '0.0000';

  const handleCopyAddress = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefreshAll = () => {
    refetchEth();
    refetchTokens();
  };


  if (!isConnected || !address) {
    return (
      <>
        <button
          onClick={handleOpenWallet}
          className={`px-5 py-2.5 rounded-xl text-white font-bold text-sm bg-[#00A3FF] hover:bg-[#0090E6] transition-all shadow-md shadow-[#00A3FF]/20 flex items-center justify-center gap-2 cursor-pointer ${className || ''}`}
        >
          <Wallet className="w-4 h-4" />
          <span>Connect wallet</span>
        </button>

        {showFallbackModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4">
            <div className="bg-card border border-border-main rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-main pb-3">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#00A3FF]" />
                  <h3 className="font-bold text-base text-text-main">Connect a Wallet</h3>
                </div>
                <button
                  onClick={() => setShowFallbackModal(false)}
                  className="text-text-secondary hover:text-text-main text-xs font-bold px-2 py-1 rounded-lg hover:bg-input"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-text-secondary">Select your preferred Web3 provider to connect to Lido Staking:</p>

              <div className="space-y-2">
                {connectors && connectors.length > 0 ? (
                  connectors.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        connect({ connector: c });
                        setShowFallbackModal(false);
                      }}
                      className="w-full flex items-center justify-between p-3 rounded-xl bg-input hover:bg-border-main border border-border-main text-text-main font-semibold text-sm transition-colors"
                    >
                      <span>{c.name}</span>
                      <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-[#00A3FF]/10 text-[#00A3FF]">Connect</span>
                    </button>
                  ))
                ) : (
                  <div className="text-center py-4 text-xs text-text-secondary">
                    No injected wallet extensions detected. Please open in MetaMask or a Web3 browser.
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-border-main flex justify-end">
                <button
                  onClick={() => setShowFallbackModal(false)}
                  className="px-4 py-2 bg-input hover:bg-border-main rounded-xl text-xs font-semibold text-text-secondary"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Connected Button */}
      <div className="relative inline-block">
        <button
          onClick={() => setShowDetailsModal(true)}
          className={`px-3.5 py-1.5 rounded-xl bg-card hover:bg-input border border-border-main transition-all shadow-sm flex items-center gap-2 text-text-main cursor-pointer ${className || ''}`}
        >
          {/* Quick Balance Preview */}
          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-1 rounded-lg">
            <EthIcon className="w-3.5 h-3.5" />
            <span>{formattedEth} ETH</span>
          </div>

          <span className="font-mono text-xs font-bold text-text-main">
            {address.slice(0, 6)}...{address.slice(-4)}
          </span>

          <ChevronDown className="w-3.5 h-3.5 text-text-secondary" />
        </button>
      </div>

      {/* Precise Wallet & Balances Inspection Modal */}
      {showDetailsModal && (
        <div className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border-main rounded-[24px] max-w-sm w-full p-6 shadow-2xl relative text-text-main space-y-5">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-border-main">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-[#00A3FF]" />
                <h3 className="font-extrabold text-base">Check Wallet Address</h3>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-text-secondary hover:text-text-main text-xs font-bold px-2 py-1 rounded-lg hover:bg-input"
              >
                ✕
              </button>
            </div>

            {/* Address Box */}
            <div className="bg-input border border-border-main rounded-2xl p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Connected Account</div>
              <div className="flex items-center justify-between font-mono text-xs font-bold text-text-main">
                <span>{address.slice(0, 10)}...{address.slice(-8)}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopyAddress}
                    title="Copy Address"
                    className="p-1 rounded-md hover:bg-card text-text-secondary hover:text-[#00A3FF] transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <a
                    href={`https://etherscan.io/address/${address}`}
                    target="_blank"
                    rel="noreferrer"
                    title="View on Etherscan"
                    className="p-1 rounded-md hover:bg-card text-text-secondary hover:text-[#00A3FF] transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Precise Real-Time Wallet Balances */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-[11px] font-bold text-text-secondary uppercase tracking-wider">Precise Provider Balances</span>
                <button
                  onClick={handleRefreshAll}
                  className="text-[11px] text-[#00A3FF] hover:underline flex items-center gap-1 font-semibold"
                >
                  <RefreshCw className="w-3 h-3" /> Refresh
                </button>
              </div>

              <div className="bg-input border border-border-main rounded-2xl p-3 space-y-3 text-xs">
                {/* ETH Balance */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EthIcon className="w-5 h-5" />
                    <div>
                      <div className="font-bold text-text-main">Ethereum</div>
                      <div className="text-[10px] text-text-secondary font-mono">ETH</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-text-main">
                    {isEthLoading ? '...' : `${formattedEth} ETH`}
                  </div>
                </div>

                {/* stETH Balance */}
                <div className="flex items-center justify-between pt-2 border-t border-border-main">
                  <div className="flex items-center gap-2">
                    <StEthIcon className="w-5 h-5" />
                    <div>
                      <div className="font-bold text-text-main">Lido Staked ETH</div>
                      <div className="text-[10px] text-[#00A3FF] font-mono">stETH</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-text-main">
                    {isTokensLoading ? '...' : `${formattedStEth} stETH`}
                  </div>
                </div>

                {/* wstETH Balance */}
                <div className="flex items-center justify-between pt-2 border-t border-border-main">
                  <div className="flex items-center gap-2">
                    <WstEthIcon className="w-5 h-5" />
                    <div>
                      <div className="font-bold text-text-main">Wrapped stETH</div>
                      <div className="text-[10px] text-text-secondary font-mono">wstETH</div>
                    </div>
                  </div>
                  <div className="font-mono font-bold text-text-main">
                    {isTokensLoading ? '...' : `${formattedWstEth} wstETH`}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  open();
                }}
                className="w-full py-2.5 bg-input hover:bg-border-main text-text-main font-bold text-xs rounded-xl transition-colors border border-border-main"
              >
                Change Wallet / Provider
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false);
                  disconnect();
                }}
                className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs rounded-xl transition-colors border border-red-500/20"
              >
                Disconnect Wallet
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
