# Lido Stake Interface

A motion-enabled Ethereum mainnet interface for direct Lido staking, live market data, wallet connectivity, and stETH/wstETH account actions.

## Highlights

- Ethereum mainnet wallet connection with Reown AppKit, Wagmi, and Viem
- Direct ETH staking through the official Lido stETH contract
- stETH and wstETH balance reads
- Live ETH/stETH market prices and 24-hour metrics
- Responsive animated interface with dark/light theme support
- Mainnet RPC failover with optional Alchemy support
- No private-key custody, hidden signature capture, Telegram forwarding or artificial transaction paths

## Setup

```bash
cp .env.example .env
npm install
npm run dev
```

Set `VITE_REOWN_PROJECT_ID` and, for production RPC reliability, `VITE_ALCHEMY_API_KEY` in `.env`.

## Validation

```bash
npm run lint
npm run build
```

## Deployment

Build with `npm run build`. The Express server serves the SPA in production with:

```bash
NODE_ENV=production npm start
```

Never commit `.env`, API keys, wallet secrets, or private keys.

## Protocol note

The provided token contract is kept separate from Lido staking. Staking uses the official mainnet Lido stETH contract. Withdrawal-queue support should only be enabled with the verified official ABI and tested request/claim lifecycle.
