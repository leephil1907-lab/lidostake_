/// <reference types="vite/client" />
import '../analytics-interceptor'
import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { mainnet, arbitrum } from '@reown/appkit/networks'
import { QueryClient } from '@tanstack/react-query'
import { createSIWEConfig, formatMessage } from '@reown/appkit-siwe'
import { rpcTransports } from './rpc'

import { CONFIG } from '../lib/contracts'

const queryClient = new QueryClient()

const projectId = CONFIG.REOWN_PROJECT_ID || '220f2e5088a546891514ffe0fa667865'

const metadata = {
  name: 'Lido Stake',
  description: 'Lido Staking Interface',
  url: 'https://lido.fi',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

export const networks = [mainnet, arbitrum] as any

export const wagmiAdapter = new WagmiAdapter({
  ssr: false,
  projectId,
  networks,
  transports: rpcTransports
})

export const siweConfig = createSIWEConfig({
  getMessageParams: async () => ({
    domain: typeof window !== 'undefined' ? window.location.host : 'localhost',
    uri: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    chains: [mainnet.id, arbitrum.id],
    statement: 'Please sign this message to authenticate your wallet connection with Lido Stake.',
  }),
  createMessage: ({ address, ...args }) => formatMessage(args, address),
  getNonce: async () => {
    return '1234567890abcdef'
  },
  getSession: async () => {
    return null
  },
  verifyMessage: async ({ message, signature }) => {
    return true
  },
  signOut: async () => {
    return true
  }
})

// Global event listeners to suppress unhandled rejection noise for analytics in sandbox environments
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reasonStr = String(event.reason?.message || event.reason || '');
    const stackStr = String(event.reason?.stack || '');
    if (
      reasonStr.includes('Analytics') ||
      reasonStr.includes('pulse') ||
      stackStr.includes('analytics') ||
      stackStr.includes('pulse')
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  });

  window.addEventListener('error', (event) => {
    const msg = String(event.message || '');
    if (msg.includes('Analytics') || msg.includes('pulse')) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

// Popular Wallet IDs from Reown / WalletConnect Explorer to guarantee visibility in AppKit modal
export const FEATURED_WALLET_IDS = [
  'c57336b94e42d380784381d20e509cd5800a9b3a3509430b55380b57d0dc8e40', // MetaMask
  'fd20dc426a68f74ff2f6636cdb609ac553772b0a34560d703f2b98e2ddc732fb', // Coinbase Wallet
  '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
  '1ae92b26df0260498f92d82fc22239c0eb5cd7a01f1830e2bcb965e66310f93a', // Rainbow
  '19177267f411c1828e35967bca3f6c63808766d0d23d100d6c16d3a3acc1500c', // Ledger Live
  '971e689d0a53100ef644e7613157726a2c4230626c12fd22a4e074365c172c6e', // OKX Wallet
  'a7977fc370a01d6391969a75a2d60d43a528424685da7157d513926c32d473c9', // Phantom
]

console.log('[AppKit Init] Initializing Reown AppKit with Project ID:', projectId, 'Metadata:', metadata)

export const appKit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  featuredWalletIds: FEATURED_WALLET_IDS,
  allWallets: 'SHOW',
  features: {
    analytics: false,
    email: false,
    socials: false,
    onramp: true,
    swaps: true
  }
})

// Subscribe to AppKit modal initialization and connection events for logging and debugging
if (typeof window !== 'undefined') {
  try {
    appKit.subscribeEvents((event: any) => {
      console.log('[AppKit Modal Event]', event?.data?.event || event?.type, event)
    })
    appKit.subscribeState((state) => {
      console.log('[AppKit Modal State]', state?.open ? 'Modal Opened' : 'Modal Closed', state)
    })
  } catch (err) {
    console.warn('[AppKit] Event subscription notice:', err)
  }
}

export { queryClient }
export * from './rpc'

