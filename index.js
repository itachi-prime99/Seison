const { default: makeWASocket, useMultiFileAuthState, makeCacheableSignalKeyStore, fetchLatestBaileysVersion } = require("@whiskeysockets/baileys");
const { Boom } = require("@hapi/boom");
const P = require("pino");
const fs = require("fs");
const path = require("path");
const readline = require("readline");

const config = require("./config.json");

const sessionFolder = `./sessions/${config.botNumber}`;
if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    printQRInTerminal: false,
    logger: P({ level: "silent" }),
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, P({ level: "silent" })),
    },
    generateHighQualityLinkPreview: true,
    browser: ["Chrome (Linux)", "", ""]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, pairingCode } = update;
    
    if (connection === "close") {
      const reason = new Boom(lastDisconnect?.error)?.output.statusCode;
      if (reason !== 401) {
        console.log("Disconnected. Reconnecting...");
        startBot();
      } else {
        console.log("Session expired. Please delete the session folder and restart.");
      }
    }

    if (connection === "open") {
      console.log("✅ Bot connected successfully!");
    }

    if (!pairingCode && update.isNewLogin) {
      let code = await sock.requestPairingCode(config.botNumber + "@s.whatsapp.net");
      console.log(`\n🔑 Pair Code for ${config.botNumber}: ${code}`);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const messageType = Object.keys(msg.message)[0];
    const text = msg.message?.conversation || msg.message?.[messageType]?.text || "";

    if (text.toLowerCase() === "ping") {
      await sock.sendMessage(from, { text: "Pong!" });
    }
  });
}

startBot();
