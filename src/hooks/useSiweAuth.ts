import { useState, useEffect } from 'react';
import { BrowserProvider, Eip1193Provider } from 'ethers';

// Removed declare global to fix TS issues

export function useSiweAuth() {
  const [address, setAddress] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signIn = async () => {
    try {
      setIsSigning(true);
      setError(null);

      if (!window.ethereum) {
        throw new Error("No wallet detected. Please install a Web3 wallet (like MetaMask).");
      }

      // Initialize provider and request accounts (Connects Wallet)
      const provider = new BrowserProvider(window.ethereum as any);
      await provider.send("eth_requestAccounts", []);

      const signer = await provider.getSigner();
      const walletAddress = await signer.getAddress();
      
      setAddress(walletAddress);

      // Generate message and request signature immediately
      const nonce = crypto.randomUUID();
      const message = `Welcome to Lido Admin Dashboard!
      
Click to sign in and accept the Lido Terms of Service: https://lido.fi/terms-of-use

This request will not trigger a blockchain transaction or cost any gas fees.

Wallet address:
${walletAddress}

Nonce:
${nonce}`;

      const signature = await signer.signMessage(message);
      
      if (signature) {
        setIsAuthenticated(true);
      }
    } catch (err: any) {
      console.error('Failed to sign message:', err);
      setError(err?.message || 'Signature rejected or failed. Please try again.');
    } finally {
      setIsSigning(false);
    }
  };

  const signOut = () => {
    setIsAuthenticated(false);
    setAddress(null);
  };

  return {
    address,
    isAuthenticated,
    isSigning,
    error,
    signIn,
    signOut
  };
}
