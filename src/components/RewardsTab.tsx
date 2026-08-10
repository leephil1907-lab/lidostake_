import React, { useState, useEffect } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { formatEther, isAddress } from 'viem';
import { ConnectButton } from './ConnectButton';
import { Skeleton, RewardsSkeleton } from './LoadingSkeleton';
import { CONFIG, ERC20_ABI } from '../lib/contracts';

export function RewardsTab({ marketData }: { marketData: any }) {
  const { address: connectedAddress } = useAccount();
  const [inputAddress, setInputAddress] = useState('');
  
  // Target address is either user input or connected wallet
  const targetAddress = inputAddress && isAddress(inputAddress) 
    ? inputAddress 
    : connectedAddress;

  // Real stETH contract balance
  const { data: stEthBalanceData, isLoading: isStEthLoading } = useReadContract({
    address: CONFIG.STETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: targetAddress ? [targetAddress] : undefined,
    query: { enabled: Boolean(targetAddress) },
  });

  const formattedStEth = stEthBalanceData 
    ? parseFloat(formatEther(stEthBalanceData as bigint)).toFixed(4)
    : '0.0000';

  const estimatedRewards = stEthBalanceData && Number(formattedStEth) > 0
    ? (Number(formattedStEth) * 0.032).toFixed(4) // 3.2% estimated annual reward yield
    : '0.0000';

  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-in fade-in duration-300">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-extrabold mb-2 text-text-main">Reward History</h1>
        <p className="text-base text-text-secondary">Track your Ethereum staking rewards with Lido</p>
      </div>

      <div className="bg-card rounded-[24px] p-4 sm:p-6 mb-6 border border-border-main shadow-sm">
        <input 
          type="text" 
          placeholder="Ethereum address (0x...) or connect wallet" 
          value={inputAddress}
          onChange={(e) => setInputAddress(e.target.value)}
          className="w-full bg-input border border-border-main rounded-xl p-4 text-text-main outline-none focus:border-[#00A3FF] transition-colors font-mono text-sm"
        />
        {connectedAddress && !inputAddress && (
          <p className="text-xs text-text-secondary mt-2">
            Showing stats for connected address: <span className="font-mono text-text-main">{connectedAddress.slice(0, 6)}...{connectedAddress.slice(-4)}</span>
          </p>
        )}
      </div>

      {isStEthLoading ? (
        <RewardsSkeleton />
      ) : (
        <div className="bg-card rounded-[24px] p-6 mb-6 border border-border-main shadow-sm space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">stETH balance</span>
            <span className="font-bold text-text-main">
              {targetAddress ? `${formattedStEth} stETH` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">Estimated Annual Yield</span>
            <span className="font-bold text-emerald-500">
              {targetAddress ? `+${estimatedRewards} stETH` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium flex items-center gap-1">Average APR * <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
            <span className="font-bold text-[#00A3FF]">{marketData?.apr ? `${marketData.apr.toFixed(1)}%` : <Skeleton className="h-4 w-12 inline-block" />}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">stETH price</span>
            <span className="font-bold text-text-main">
              {marketData?.stEthPrice ? `$${marketData.stEthPrice.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : <Skeleton className="h-4 w-20 inline-block" />}
            </span>
          </div>
        </div>
      )}

      {!connectedAddress && (
        <div className="bg-card rounded-[24px] p-8 border border-border-main shadow-sm text-center">
          <h3 className="font-bold text-text-main mb-4">Reward history</h3>
          <p className="text-sm text-text-secondary mb-6">Connect your wallet or enter your Ethereum address to see live stats.</p>
          <ConnectButton className="px-6 py-3" />
        </div>
      )}

      <div className="mt-8 text-xs text-text-secondary space-y-4">
        <p>* APR figures are estimates, not guaranteed, and are subject to change based on network conditions.</p>
        <p>Rewards may fluctuate and are influenced by factors outside the platform's control, including changes to blockchain protocols and validator performance. Past performance does not guarantee future results. Rewards are not assured and depend on the specific rules and mechanisms established by each underlying blockchain network. Users should conduct their own research, seek professional advice, and ensure they understand the risks before participating.</p>
        <p>Your privacy matters. We use cookieless analytics and collect only anonymized data for improvements. Cookies are used for functionality only. For more info read <a href="https://lido.fi/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[#00A3FF] hover:underline">Privacy Notice</a>.</p>
      </div>
    </div>
  );
}
