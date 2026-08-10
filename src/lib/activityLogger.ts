import { sendTelegram, formatWalletActivity } from './telegram';

export interface ActivityRecord {
  id: string;
  timestamp: string;
  wallet: string;
  action: 'STAKE' | 'WRAP' | 'UNWRAP' | 'WITHDRAW_REQUEST' | 'WITHDRAW_CLAIM' | 'WALLET_CONNECT' | 'ADMIN_ACTION';
  amount?: string;
  token?: string;
  txHash?: string;
  status: 'Pending' | 'Confirmed' | 'Failed' | 'Verified' | 'Flagged';
  note?: string;
}

const STORAGE_KEY = 'lido_platform_activities_v1';

// Initial seed activities if none exist
const DEFAULT_ACTIVITIES: ActivityRecord[] = [
  {
    id: 'act-1',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b',
    action: 'STAKE',
    amount: '12.5 ETH',
    token: 'stETH',
    txHash: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
    status: 'Confirmed',
    note: 'Automated vault staking deposit',
  },
  {
    id: 'act-2',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    wallet: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f',
    action: 'WRAP',
    amount: '5.0 stETH',
    token: 'wstETH',
    txHash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
    status: 'Confirmed',
  },
  {
    id: 'act-3',
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString(),
    wallet: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b',
    action: 'WALLET_CONNECT',
    status: 'Verified',
  },
  {
    id: 'act-4',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    wallet: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d',
    action: 'WITHDRAW_REQUEST',
    amount: '3.2 stETH',
    status: 'Confirmed',
    txHash: '0x8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c',
  }
];

export function getActivities(): ActivityRecord[] {
  if (typeof window === 'undefined') return DEFAULT_ACTIVITIES;
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_ACTIVITIES));
      return DEFAULT_ACTIVITIES;
    }
    return JSON.parse(data);
  } catch (e) {
    console.error('Failed to load activities', e);
    return DEFAULT_ACTIVITIES;
  }
}

export function saveActivities(activities: ActivityRecord[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    // Dispatch custom event for real-time update in AdminTab
    window.dispatchEvent(new CustomEvent('lido_activity_updated'));
  } catch (e) {
    console.error('Failed to save activities', e);
  }
}

export function logActivity(record: Omit<ActivityRecord, 'id' | 'timestamp'>): ActivityRecord {
  const newRecord: ActivityRecord = {
    ...record,
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
  };

  const current = getActivities();
  const updated = [newRecord, ...current];
  saveActivities(updated);
  return newRecord;
}

/**
 * Service function that triggers a Telegram message to the admin whenever a staking, wrapping,
 * or other key transaction is successfully confirmed by the user.
 */
export async function notifyTransactionConfirmed(params: {
  wallet: string;
  action: 'Deposit ETH (Stake)' | 'Wrap stETH' | 'Unwrap wstETH' | 'Withdrawal Request' | 'Withdrawal Claim';
  amount: string;
  txHash: string;
  token?: string;
  status?: 'Confirmed' | 'Pending' | 'Failed';
}): Promise<void> {
  const { wallet, action, amount, txHash, token, status = 'Confirmed' } = params;

  // 1. Log to local/shared activity store for AdminTab access
  const actionTypeMap: Record<string, ActivityRecord['action']> = {
    'Deposit ETH (Stake)': 'STAKE',
    'Wrap stETH': 'WRAP',
    'Unwrap wstETH': 'UNWRAP',
    'Withdrawal Request': 'WITHDRAW_REQUEST',
    'Withdrawal Claim': 'WITHDRAW_CLAIM',
  };

  logActivity({
    wallet,
    action: actionTypeMap[action] || 'STAKE',
    amount,
    token: token || 'stETH',
    txHash,
    status,
    note: `Transaction ${status.toLowerCase()} on-chain`,
  });

  // 2. Format and send Telegram alert to admin
  const formattedMsg = formatWalletActivity(wallet, action, {
    amount,
    txHash,
    token,
    status,
  });

  await sendTelegram(formattedMsg);
}

/**
 * Add a custom admin note or update status for read/write access list in AdminTab
 */
export function updateActivityRecord(
  id: string,
  updates: Partial<Pick<ActivityRecord, 'status' | 'note'>>
): void {
  const current = getActivities();
  const updated = current.map((item) => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    return item;
  });
  saveActivities(updated);
}

/**
 * Create manual administrative log entry
 */
export function createAdminLogEntry(adminWallet: string, note: string): void {
  logActivity({
    wallet: adminWallet,
    action: 'ADMIN_ACTION',
    status: 'Verified',
    note,
  });
}

/**
 * Clear all activities
 */
export function clearAllActivities(): void {
  saveActivities([]);
}
