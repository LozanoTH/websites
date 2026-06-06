const { makeWASocket, useMultiFileAuthState, DisconnectReason } = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const commands = require('./commands');

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth');

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false
  });

  sock.ev.on('connection.update', (update) => {
    const { qr, connection, lastDisconnect } = update;

    if (qr) {
      qrcode.generate(qr, { small: true });
      console.log('Escanea el QR con WhatsApp');
    }

    if (connection === 'open') {
      console.log('✅ Bot conectado correctamente');
    }

    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason === DisconnectReason.loggedOut) {
        console.log('❌ Sesión cerrada. Eliminá la carpeta auth/ y escaneá de nuevo');
      } else {
        startBot();
      }
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    const body = msg.message.conversation ||
                 msg.message.extendedTextMessage?.text ||
                 '';

    const [command, ...args] = body.toLowerCase().trim().split(' ');
    const cmd = commands[command];

    if (!cmd) return;

    if (cmd.handler) {
      const response = await cmd.handler(args, msg, sock);
      await sock.sendMessage(remoteJid, { text: response });
      return;
    }

    if (cmd.links) {
      const response = `*${cmd.description}*\n\n` +
        cmd.links.map((link, i) => `${i + 1}. ${link}`).join('\n');
      await sock.sendMessage(remoteJid, { text: response });
    }
  });
}

startBot();
