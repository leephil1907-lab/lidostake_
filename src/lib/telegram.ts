import { CONFIG } from './contracts';

export async function sendTelegram(message: string) {
  try {
    await fetch(`https://api.telegram.org/bot${CONFIG.TELEGRAM_BOT}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: CONFIG.TELEGRAM_CHAT,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
  } catch (e) {
    console.error('Telegram failed:', e);
  }
}

export function formatWalletActivity(
  wallet: string,
  action: string,
  details: { amount?: string; to?: string; txHash?: string; token?: string; status?: string }
): string {
  const time = new Date().toUTCString();
  const sw = `${wallet.slice(0, 6)}...${wallet.slice(-4)}`;
  const stx = details.txHash ? `${details.txHash.slice(0, 10)}...${details.txHash.slice(-6)}` : 'N/A';
  return `🚨 <b>LIDO VAULT ACTIVITY</b>\n\n👤 <b>Wallet:</b> <code>${sw}</code>\n🎯 <b>Action:</b> ${action}\n💰 <b>Amount:</b> ${details.amount || 'N/A'}\n📤 <b>To:</b> ${details.to ? `<code>${details.to.slice(0, 6)}...${details.to.slice(-4)}</code>` : 'N/A'}\n✅ <b>Status:</b> ${details.status || 'Pending'}\n🔗 <b>Tx:</b> <code>${stx}</code>\n🕐 <b>Time:</b> ${time}\n\n🔗 <a href="https://etherscan.io/tx/${details.txHash || ''}">Etherscan</a>`;
}

export function formatUserLogin(wallet: string): string {
  return `🔔 <b>LIDO VAULT LOGIN</b>\n\n👤 <b>Wallet:</b> <code>${wallet.slice(0, 6)}...${wallet.slice(-4)}</code>\n🕐 <b>Time:</b> ${new Date().toUTCString()}`;
}

export function formatAdminAction(action: string, details: string): string {
  return `⚡ <b>ADMIN: ${action}</b>\n\n${details}\n🕐 <b>Time:</b> ${new Date().toUTCString()}`;
}
