const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const {
    default: makeWASocket,
    useMultiFileAuthState,
    fetchLatestBaileysVersion,
    Browsers,
    makeCacheableSignalKeyStore,
    DisconnectReason
} = require('@whiskeysockets/baileys');
const pino = require('pino');

const app = express();
const PORT = process.env.PORT || 3059;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const PAIRING_DIR = './nexstore/pairing';
const activeSessions = new Map();

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}
ensureDir(PAIRING_DIR);

// ─── Generate Pairing Code ────────────────────────────────────────────────────
app.post('/pair', async (req, res) => {
    let { number } = req.body;
    if (!number) return res.status(400).json({ error: 'Phone number is required' });

    number = number.replace(/[^0-9]/g, '');
    if (!number || number.length < 7) return res.status(400).json({ error: 'Invalid phone number' });

    if (activeSessions.has(number)) {
        try { activeSessions.get(number)?.ws?.close(); } catch {}
        activeSessions.delete(number);
    }

    const sessionPath = `${PAIRING_DIR}/${number}@s.whatsapp.net`;
    ensureDir(sessionPath);

    try {
        const { version } = await fetchLatestBaileysVersion();
        const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

        const nexus = makeWASocket({
            version,
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: {
                creds: state.creds,
                keys: makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
            },
            browser: Browsers.ubuntu('Edge'),
            connectTimeoutMs: 60000,
            defaultQueryTimeoutMs: 60000,
            markOnlineOnConnect: false,
        });

        activeSessions.set(number, nexus);
        nexus.ev.on('creds.update', saveCreds);

        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Connection timeout')), 30000);

            nexus.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
                if (connection === 'open' || nexus.authState?.creds?.me) {
                    clearTimeout(timeout); resolve();
                }
                if (connection === 'close') {
                    clearTimeout(timeout);
                    const code = lastDisconnect?.error?.output?.statusCode;
                    if (code !== DisconnectReason.loggedOut) resolve();
                    else reject(new Error('Connection closed'));
                }
            });

            setTimeout(async () => {
                try {
                    if (!state.creds.registered) {
                        let code = await nexus.requestPairingCode(number);
                        code = code?.match(/.{1,4}/g)?.join('-') || code;

                        ensureDir(PAIRING_DIR);
                        fs.writeFileSync(
                            `${PAIRING_DIR}/pairing.json`,
                            JSON.stringify({ number, code, timestamp: new Date().toISOString() }, null, 2)
                        );

                        clearTimeout(timeout);
                        res.json({ success: true, code });
                        resolve();
                    } else {
                        clearTimeout(timeout);
                        res.json({ success: false, error: 'Number already registered/connected' });
                        resolve();
                    }
                } catch (err) {
                    clearTimeout(timeout);
                    if (!res.headersSent) res.status(500).json({ error: err.message });
                    reject(err);
                }
            }, 3000);
        });

    } catch (err) {
        console.error('Pairing error:', err.message);
        if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to generate pairing code' });
    }
});

// ─── Check pairing status ─────────────────────────────────────────────────────
app.get('/status/:number', (req, res) => {
    let { number } = req.params;
    number = number.replace(/[^0-9]/g, '');
    const credsPath = path.join(`${PAIRING_DIR}/${number}@s.whatsapp.net`, 'creds.json');
    if (fs.existsSync(credsPath)) {
        try {
            const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
            if (creds?.me?.id) return res.json({ paired: true });
        } catch {}
    }
    res.json({ paired: false });
});

// ─── Start server + localtunnel ───────────────────────────────────────────────
app.listen(PORT, async () => {
    console.log(`✅ LËGĚNDÃRY BØT Pairing Server running on port ${PORT}`);

    try {
        const localtunnel = require('localtunnel');
        const tunnel = await localtunnel({ port: PORT, subdomain: 'legendary-bot-pair' });

        console.log(`\n🌐 ====================================`);
        console.log(`🌐 PUBLIC PAIRING API URL:`);
        console.log(`🌐 ${tunnel.url}`);
        console.log(`🌐 ====================================`);
        console.log(`📋 Copy this URL and set it as BOT_API_URL in your Vercel project!\n`);

        // Save to file for easy access
        ensureDir('./nexstore');
        fs.writeFileSync('./nexstore/tunnel_url.txt', tunnel.url);

        tunnel.on('close', () => {
            console.log('⚠️ Tunnel closed. Restart bot to get new tunnel URL.');
        });

        tunnel.on('error', (err) => {
            console.log(`⚠️ Tunnel error: ${err.message}`);
        });

    } catch (e) {
        console.log(`⚠️ Localtunnel failed: ${e.message}`);
        console.log(`⚠️ Install with: npm install localtunnel`);
    }
});
