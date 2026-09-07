import { useState } from 'react';
import { MessageCircle, X, Send, LifeBuoy, ExternalLink } from 'lucide-react';
import { LidoLogo } from './LidoLogo';

const answers: Record<string, string> = {
  staking: 'To stake, connect your Ethereum mainnet wallet, enter an ETH amount, review the network fee, and confirm the Lido transaction in your wallet.',
  wallet: 'Use the Connect Wallet button in the header. The app supports Ethereum mainnet wallets through Reown AppKit.',
  withdrawal: 'Lido withdrawals use the official withdrawal queue and may require a request and claim step. Never share your seed phrase or private key.',
  fee: 'Any service fee must be displayed before signing. Ethereum network gas is separate and is paid to the network.',
};

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([{ from: 'bot', text: 'Hi! I can help with staking, wallets, withdrawals, and fees.' }]);
  const [input, setInput] = useState('');
  const [ticketOpen, setTicketOpen] = useState(false);
  const [ticket, setTicket] = useState({ email: '', subject: '', message: '' });
  const [status, setStatus] = useState('');

  const ask = (text: string) => {
    const lower = text.toLowerCase();
    const key = Object.keys(answers).find((item) => lower.includes(item));
    setMessages((items) => [...items, { from: 'user', text }, { from: 'bot', text: key ? answers[key] : 'I can help with staking, wallet connection, withdrawals, or fees. For anything else, open a support ticket and our team can follow up.' }]);
  };

  const send = () => { if (!input.trim()) return; ask(input.trim()); setInput(''); };
  const submitTicket = async (event: React.FormEvent) => {
    event.preventDefault(); setStatus('Sending...');
    try {
      const response = await fetch('/api/support/tickets', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(ticket) });
      if (!response.ok) throw new Error('Ticket could not be sent');
      setStatus('Ticket received. We will follow up by email.'); setTicket({ email: '', subject: '', message: '' });
    } catch { setStatus('Unable to send right now. Please try again shortly.'); }
  };

  return <>
    <button aria-label="Open support chat" onClick={() => setOpen(true)} className="fixed right-4 bottom-20 sm:bottom-6 z-40 w-14 h-14 rounded-full bg-[#00A3FF] text-white shadow-xl shadow-[#00A3FF]/30 flex items-center justify-center hover:scale-105 transition-transform"><MessageCircle /></button>
    {open && <div className="fixed right-4 bottom-20 sm:bottom-24 z-50 w-[calc(100vw-2rem)] max-w-sm bg-card border border-border-main rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-4 bg-gradient-to-r from-[#00A3FF] to-[#00D09E] text-white flex items-center justify-between"><div className="flex items-center gap-3"><div className="bg-white rounded-full p-2"><LidoLogo className="w-6 h-6" /></div><div><p className="font-extrabold">Lido Support</p><p className="text-xs opacity-80">Guidance and tickets</p></div></div><button onClick={() => setOpen(false)}><X /></button></div>
      {!ticketOpen ? <><div className="p-4 h-64 overflow-y-auto space-y-3">{messages.map((message, i) => <div key={i} className={`max-w-[88%] rounded-2xl px-3 py-2 text-sm ${message.from === 'user' ? 'ml-auto bg-[#00A3FF] text-white' : 'bg-input text-text-main'}`}>{message.text}</div>)}</div><div className="px-4 pb-3 flex flex-wrap gap-2">{['Staking help', 'Wallet help', 'Withdrawal help', 'Fee help'].map((label) => <button key={label} onClick={() => ask(label)} className="text-xs border border-border-main rounded-full px-3 py-1.5 hover:border-[#00A3FF]">{label}</button>)}</div><div className="p-3 border-t border-border-main flex gap-2"><input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Ask a question" className="min-w-0 flex-1 bg-input rounded-xl px-3 py-2 text-sm outline-none" /><button onClick={send} className="p-2 rounded-xl bg-[#00A3FF] text-white"><Send className="w-4 h-4" /></button></div><button onClick={() => setTicketOpen(true)} className="w-full border-t border-border-main p-3 text-sm font-bold text-[#00A3FF] flex items-center justify-center gap-2"><LifeBuoy className="w-4 h-4" /> Open a support ticket</button></> : <form onSubmit={submitTicket} className="p-4 space-y-3"><button type="button" onClick={() => setTicketOpen(false)} className="text-xs text-text-secondary">← Back to chat</button><input required type="email" placeholder="Your email" value={ticket.email} onChange={(e) => setTicket({ ...ticket, email: e.target.value })} className="w-full bg-input rounded-xl px-3 py-2 text-sm" /><input required placeholder="Subject" value={ticket.subject} onChange={(e) => setTicket({ ...ticket, subject: e.target.value })} className="w-full bg-input rounded-xl px-3 py-2 text-sm" /><textarea required rows={5} placeholder="How can we help? Never include private keys." value={ticket.message} onChange={(e) => setTicket({ ...ticket, message: e.target.value })} className="w-full bg-input rounded-xl px-3 py-2 text-sm resize-none" /><button className="w-full bg-[#00A3FF] text-white rounded-xl py-2.5 font-bold">Send ticket</button>{status && <p className="text-xs text-text-secondary">{status}</p>}<p className="text-[11px] text-text-secondary flex gap-1"><ExternalLink className="w-3 h-3" /> Support will never ask for your seed phrase.</p></form>}
    </div>}
  </>;
}
