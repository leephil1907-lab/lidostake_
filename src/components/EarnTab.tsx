import React, { useState } from 'react';
import { motion } from 'motion/react';
import { EarnVaultSkeleton } from './LoadingSkeleton';
import { RefreshCw } from 'lucide-react';
import { LidoSymbolIcon, DexSymbolIcon } from './TokenIcons';

export function EarnTab() {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefreshVaults = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 500);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <h1 className="text-3xl font-extrabold text-text-main">Lido Earn</h1>
          <button 
            onClick={handleRefreshVaults}
            title="Refresh Vault Data" 
            className="p-1.5 rounded-full hover:bg-input transition-colors text-text-secondary hover:text-text-main"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#00A3FF]' : ''}`} />
          </button>
        </div>
        <p className="text-base text-text-secondary mb-4">Deploy ETH and USD stablecoins into DeFi vaults for on-chain rewards through the world's leading protocols.</p>
        <a href="https://docs.lido.fi/" target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#00A3FF] hover:text-[#0090E6] transition-colors">How Lido Earn Works</a>
      </motion.div>

      {isLoading ? (
        <>
          <EarnVaultSkeleton />
          <EarnVaultSkeleton />
        </>
      ) : (
        <>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="bg-card rounded-[24px] border border-border-main shadow-sm mb-6 overflow-hidden"
      >
        <div className="h-24 bg-gradient-to-b from-gray-400 to-transparent opacity-20 relative"></div>
        <div className="-mt-12 flex justify-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-xl border border-border-main p-2">
            <LidoSymbolIcon className="w-10 h-10" />
          </div>
        </div>
        
        <div className="px-6 pb-6 text-center pt-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold mb-3 border border-green-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            PROTECTED
          </div>
          <h2 className="text-2xl font-extrabold text-text-main mb-2">EarnETH</h2>
          <p className="text-sm text-text-secondary mb-6 px-4">EarnETH is an ETH growth vault allocating ETH and stETH across leading blue-chip DeFi protocols meant to optimize for capital efficiency</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium flex items-center gap-1">APY* (14d avg.) <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
              <span className="font-bold text-[#00A3FF]">4%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium">TVL</span>
              <span className="font-bold text-text-main">$133.8M</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium">Protocol</span>
              <span className="font-bold text-text-main">Lido + Curve</span>
            </div>
          </div>
          
          <button className="w-full py-4 text-lg rounded-xl mb-4 text-[#00A3FF] font-bold bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 transition-colors">
            Deposit
          </button>
          <button className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors flex items-center justify-center gap-1 w-full">
            More details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="bg-card rounded-[24px] border border-border-main shadow-sm overflow-hidden mb-8"
      >
        <div className="h-24 bg-gradient-to-b from-blue-400 to-transparent opacity-20 relative"></div>
        <div className="-mt-12 flex justify-center relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center shadow-xl border border-border-main p-2">
            <DexSymbolIcon className="w-10 h-10" />
          </div>
        </div>
        
        <div className="px-6 pb-6 text-center pt-4">
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs font-bold mb-3 border border-green-500/20">
            <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 stroke-current stroke-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            PROTECTED
          </div>
          <h2 className="text-2xl font-extrabold text-text-main mb-2">EarnUSD</h2>
          <p className="text-sm text-text-secondary mb-6 px-4">EarnUSD delivers access to USD-denominated reward strategies built around transparent asset selection, risk controls and reporting</p>
          
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium flex items-center gap-1">APY* (14d avg.) <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
              <span className="font-bold text-[#00A3FF]">7%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium">TVL</span>
              <span className="font-bold text-text-main">$35.4M</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-text-secondary font-medium">Protocol</span>
              <span className="font-bold text-text-main">Lido + Curve</span>
            </div>
          </div>
          
          <button className="w-full py-4 text-lg rounded-xl mb-4 text-[#00A3FF] font-bold bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20 transition-colors">
            Deposit
          </button>
          <button className="text-sm font-medium text-text-secondary hover:text-text-main transition-colors flex items-center justify-center gap-1 w-full">
            More details <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
          </button>
        </div>
      </motion.div>

      <div className="text-xs text-text-secondary space-y-4">
        <p>* APR/APY figures are estimates based on historical performance, not guaranteed, and are subject to change based on market conditions and protocol utilization.</p>
        <p>Rewards may fluctuate and are influenced by factors outside the platform's control, including changes to underlying DeFi protocols and market demand. Past performance does not guarantee future results. Always DYOR.</p>
      </div>
        </>
      )}
    </div>
  );
}
