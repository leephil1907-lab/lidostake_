import React from 'react';

// Authentic Lido Symbol (The official stake.lido.fi cyan teardrop logo)
export function LidoSymbolIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#00A3FF" />
      <path
        d="M16 6L21 13.8L16 16.7L11 13.8L16 6Z"
        fill="white"
      />
      <path
        d="M16 19.3L10.2 15.9L10 16.2C10 19.5 12.7 22.2 16 22.2C19.3 22.2 22 19.5 22 16.2L21.8 15.9L16 19.3Z"
        fill="white"
        fillOpacity="0.85"
      />
    </svg>
  );
}

// Authentic DEX Icon (Uniswap / 1inch / Curve DEX style)
export function DexSymbolIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="32" height="32" rx="16" fill="url(#dex_grad)" />
      <path
        d="M21 11L11 21M21 11H13M21 11V19"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 21L21 11M11 21H19M11 21V13"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="dex_grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FF007A" />
          <stop offset="1" stopColor="#7B2CBF" />
        </linearGradient>
      </defs>
    </svg>
  );
}

// Official stETH Coin Icon
export function StEthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#00A3FF" />
      <path d="M16 5L22 14.3L16 17.8L10 14.3L16 5Z" fill="white" />
      <path d="M16 20.8L9.1 16.8L8.9 17.1C8.9 21 12.1 24.2 16 24.2C19.9 24.2 23.1 21 23.1 17.1L22.9 16.8L16 20.8Z" fill="white" fillOpacity="0.8" />
    </svg>
  );
}

// Official wstETH Wrapped Coin Icon
export function WstEthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#0E1E38" stroke="#00A3FF" strokeWidth="2" />
      <path d="M16 6L21 13.8L16 16.7L11 13.8L16 6Z" fill="#00A3FF" />
      <circle cx="16" cy="16" r="13" stroke="#00A3FF" strokeWidth="1" strokeDasharray="3 3" fill="none" />
      <path d="M16 19.3L10.2 15.9L10 16.2C10 19.5 12.7 22.2 16 22.2C19.3 22.2 22 19.5 22 16.2L21.8 15.9L16 19.3Z" fill="#00A3FF" fillOpacity="0.85" />
    </svg>
  );
}

// Official Ethereum Mark
export function EthIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="16" r="16" fill="#627EEA" />
      <path d="M16.498 4v8.87l7.497 3.35z" fill="#C0CBF6" />
      <path d="M16.498 4L9 16.22l7.498-3.35z" fill="#FFFFFF" />
      <path d="M16.498 21.968v6.027L24 17.616z" fill="#C0CBF6" />
      <path d="M16.498 27.995v-6.027L9 17.616z" fill="#FFFFFF" />
      <path d="M16.498 20.573l7.497-4.353-7.497-3.348z" fill="#8197E6" />
      <path d="M9 16.22l7.498 4.353v-7.701z" fill="#ADBAF0" />
    </svg>
  );
}
