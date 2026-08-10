import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, ExternalLink, Check, Lock } from 'lucide-react';
import { LidoLogo } from './LidoLogo';

interface TermsAgreementModalProps {
  onAccept?: () => void;
}

export function TermsAgreementModal({ onAccept }: TermsAgreementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreeJurisdiction, setAgreeJurisdiction] = useState(false);

  useEffect(() => {
    const hasAgreed = localStorage.getItem('lido_terms_agreed');
    if (hasAgreed !== 'true') {
      setIsOpen(true);
    }
  }, []);

  const handleConfirm = () => {
    if (!agreeTerms || !agreeJurisdiction) return;
    localStorage.setItem('lido_terms_agreed', 'true');
    setIsOpen(false);
    if (onAccept) onAccept();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card border border-border-main rounded-[24px] max-w-lg w-full p-6 sm:p-8 shadow-2xl relative overflow-hidden my-auto"
          >
            {/* Ambient background glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#00A3FF]/15 rounded-full blur-[70px] pointer-events-none"></div>

            <div className="flex items-center justify-between pb-4 border-b border-border-main/60 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#00A3FF]/10 flex items-center justify-center border border-[#00A3FF]/20 text-[#00A3FF]">
                  <LidoLogo className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-main leading-snug">Terms of Service</h2>
                  <p className="text-xs text-text-secondary">Welcome to Lido Staking Protocol</p>
                </div>
              </div>
              <div className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protocol Verification</span>
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm text-text-secondary leading-relaxed">
              <p>
                Before interacting with Lido liquid staking, please review and confirm your acceptance of the terms and conditions below.
              </p>

              <div className="bg-input/80 rounded-2xl p-4 border border-border-main/70 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-[#00A3FF] shrink-0 mt-0.5" />
                  <p className="text-xs text-text-main font-medium">
                    Lido is a decentralized liquid staking protocol for Ethereum. Staking rewards accrue continuously to stETH holders.
                  </p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border border-border-main/60 bg-input/40 hover:bg-input transition-colors">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={(e) => setAgreeTerms(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-border-main peer-checked:border-[#00A3FF] peer-checked:bg-[#00A3FF] transition-all flex items-center justify-center">
                      {agreeTerms && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-main leading-normal select-none">
                    I have read, understood, and agree to the{' '}
                    <a
                      href="https://lido.fi/terms-of-use"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A3FF] hover:underline inline-flex items-center gap-0.5 font-bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Lido Terms of Use <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and{' '}
                    <a
                      href="https://lido.fi/privacy-policy"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00A3FF] hover:underline inline-flex items-center gap-0.5 font-bold"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Privacy Notice <ExternalLink className="w-3 h-3" />
                    </a>.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group p-3 rounded-xl border border-border-main/60 bg-input/40 hover:bg-input transition-colors">
                  <div className="relative flex items-center mt-0.5">
                    <input
                      type="checkbox"
                      checked={agreeJurisdiction}
                      onChange={(e) => setAgreeJurisdiction(e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-5 h-5 rounded-md border-2 border-border-main peer-checked:border-[#00A3FF] peer-checked:bg-[#00A3FF] transition-all flex items-center justify-center">
                      {agreeJurisdiction && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-xs font-medium text-text-main leading-normal select-none">
                    I confirm that I am not a resident, citizen, or entity located in a restricted jurisdiction or subject to economic sanctions.
                  </span>
                </label>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={!agreeTerms || !agreeJurisdiction}
              className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                agreeTerms && agreeJurisdiction
                  ? 'bg-[#00A3FF] hover:bg-[#0090E6] text-white shadow-lg shadow-[#00A3FF]/25 cursor-pointer active:scale-[0.99]'
                  : 'bg-[#00A3FF]/30 text-white/50 cursor-not-allowed'
              }`}
            >
              <span>Confirm and Continue</span>
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
