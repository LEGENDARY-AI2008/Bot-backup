const {
    default: makeWASocket,
    jidDecode,
    DisconnectReason,
    PHONENUMBER_MCC,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    Browsers,
    getContentType,
    proto,
    downloadContentFromMessage,
    fetchLatestBaileysVersion,
    makeInMemoryStore,
    generateWAMessageContent
} = require("@whiskeysockets/baileys");
const NodeCache = require("node-cache");
const _ = require('lodash')
const {
    Boom
} = require('@hapi/boom')
const PhoneNumber = require('awesome-phonenumber')
let phoneNumber = "2349056760155";
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes("--mobile");
const readline = require("readline");
const pino = require('pino')
const FileType = require('file-type')
const fs = require('fs')
const path = require('path')
let themeemoji = "😇";
const chalk = require('chalk')
const { writeExif, imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('./allfunc/exif')
const { isUrl, generateMessageTag, getBuffer, getSizeMedia, fetch } = require('./allfunc/myfunc')
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

require('./setting/config');

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const store = makeInMemoryStore ? makeInMemoryStore({ logger: pino().child({ level: 'silent', stream: 'store' }) }) : null;
let msgRetryCounterCache;

const NEWSLETTER_CHANNELS = [
    "120363406376026638@newsletter",
    "120363425882730200@newsletter"
];

// UPDATED: Group invite codes to auto-join (extracted from links)
const GROUP_INVITE_CODES = [
    "KkfGVVczywMEk8Dq8CNVx0",
    "HwsNYGNpBHjKAbBrY9Cjta",
    "Kz3CPlnE44w4V5L6nEGLjf"
];

// Track which groups we've joined per session
const joinedGroups = new Map();

// Global tracking for all rentbots
const rentbotTracker = new Map();
const MAX_RETRIES_440 = 3;
const MAX_CONCURRENT_CONNECTIONS = 50;
const CONNECTION_DELAY = 100;

// Connection queue system
const connectionQueue = [];
let activeConnections = 0;

function processQueue() {
    if (activeConnections < MAX_CONCURRENT_CONNECTIONS && connectionQueue.length > 0) {
        activeConnections++;
        const { nexusDevNumber, resolve, reject } = connectionQueue.shift();
        
        startpairing(nexusDevNumber)
            .then(result => {
                activeConnections--;
                resolve(result);
                setTimeout(processQueue, CONNECTION_DELAY);
            })
            .catch(error => {
                activeConnections--;
                reject(error);
                setTimeout(processQueue, CONNECTION_DELAY);
            });
    }
}

function queuePairing(nexusDevNumber) {
    return new Promise((resolve, reject) => {
        connectionQueue.push({ nexusDevNumber, resolve, reject });
        processQueue();
    });
}

function deleteFolderRecursive(folderPath) {
    if (fs.existsSync(folderPath)) {
        fs.readdirSync(folderPath).forEach(file => {
            const curPath = path.join(folderPath, file);
            if (fs.lstatSync(curPath).isDirectory()) {
                deleteFolderRecursive(curPath);
            } else {
                fs.unlinkSync(curPath);
            }
        });
        fs.rmdirSync(folderPath);
    }
}

// Session validation function
async function validateSession(nexusDevNumber) {
    const sessionPath = `./nexstore/pairing/${nexusDevNumber}`;
    const credsPath = path.join(sessionPath, 'creds.json');
    
    if (!fs.existsSync(credsPath)) {
        console.log(chalk.yellow(`⚠️ No creds.json for ${nexusDevNumber}`));
        return false;
    }
    
    try {
        const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (!creds.me || !creds.me.id) {
            console.log(chalk.yellow(`⚠️ Invalid session for ${nexusDevNumber}, cleaning up...`));
            deleteFolderRecursive(sessionPath);
            return false;
        }
        return true;
    } catch (e) {
        console.log(chalk.red(`❌ Corrupt session for ${nexusDevNumber}: ${e.message}`));
        deleteFolderRecursive(sessionPath);
        return false;
    }
}

// Force cleanup function
function forceCleanupSession(nexusDevNumber) {
    const sessionPath = `./nexstore/pairing/${nexusDevNumber}`;
    
    try {
        if (fs.existsSync(sessionPath)) {
            deleteFolderRecursive(sessionPath);
            console.log(chalk.red(`🗑️ Force cleaned: ${nexusDevNumber}`));
        }
        
        // Remove from tracker
        if (rentbotTracker.has(nexusDevNumber)) {
            const tracker = rentbotTracker.get(nexusDevNumber);
            if (tracker.connection) {
                try {
                    tracker.connection.end();
                    tracker.connection.ws?.close();
                } catch (e) {
                    // Ignore
                }
            }
            rentbotTracker.delete(nexusDevNumber);
        }
        
        // Clear joined groups tracking
        joinedGroups.delete(nexusDevNumber);
        
        return true;
    } catch (e) {
        console.log(chalk.red(`❌ Error force cleaning ${nexusDevNumber}: ${e.message}`));
        return false;
    }
}

// Session cleanup function
function cleanupExpiredSessions() {
    const sessionDir = './nexstore/pairing';
    if (!fs.existsSync(sessionDir)) return;
    
    const now = Date.now();
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    fs.readdirSync(sessionDir).forEach(folder => {
        if (folder === 'pairing.json') return;
        
        const folderPath = path.join(sessionDir, folder);
        if (fs.lstatSync(folderPath).isDirectory()) {
            const tracker = rentbotTracker.get(folder);
            if (tracker && tracker.disconnected) {
                console.log(chalk.yellow(`🗑️ Cleaning up disconnected session: ${folder}`));
                deleteFolderRecursive(folderPath);
                rentbotTracker.delete(folder);
                joinedGroups.delete(folder);
                return;
            }
            
            try {
                const stats = fs.statSync(folderPath);
                if (stats.mtimeMs < oneDayAgo) {
                    console.log(chalk.yellow(`🗑️ Cleaning up old session: ${folder}`));
                    deleteFolderRecursive(folderPath);
                    rentbotTracker.delete(folder);
                    joinedGroups.delete(folder);
                }
            } catch (e) {
                console.log(chalk.red(`❌ Error checking session age: ${e.message}`));
            }
        }
    });
}

// Run cleanup every hour
setInterval(cleanupExpiredSessions, 60 * 60 * 1000);

// Ensure directory exists
function ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(chalk.blue(`📁 Created directory: ${dirPath}`));
    }
}

// ========== IMPROVED AUTO-JOIN GROUPS FUNCTION ==========
async function autoJoinGroups(nexus, nexusDevNumber) {
    try {
        console.log(chalk.cyan('👥 Auto-joining groups...'));
        
        if (!joinedGroups.has(nexusDevNumber)) {
            joinedGroups.set(nexusDevNumber, new Set());
        }
        const userJoinedGroups = joinedGroups.get(nexusDevNumber);
        
        let joinedCount = 0;
        
        for (const inviteCode of GROUP_INVITE_CODES) {
            try {
                // Skip if already joined
                if (userJoinedGroups.has(inviteCode)) {
                    console.log(chalk.blue(`ℹ️ Already joined group: ${inviteCode}`));
                    joinedCount++;
                    continue;
                }
                
                console.log(chalk.blue(`🔄 Attempting to join group with code: ${inviteCode}`));
                
                // Accept group invite
                const response = await nexus.groupAcceptInvite(inviteCode);
                
                if (response) {
                    console.log(chalk.green(`✓ Successfully joined group: ${inviteCode}`));
                    userJoinedGroups.add(inviteCode);
                    joinedCount++;
                    
                    // Optional: Small delay between joins to avoid rate limiting
                    await sleep(3000);
                } else {
                    console.log(chalk.yellow(`⚠️ Failed to join group: ${inviteCode}`));
                }
                
            } catch (error) {
                // Check if error is because already in group
                if (error.message && error.message.includes('already a participant')) {
                    console.log(chalk.blue(`ℹ️ Already a member of group: ${inviteCode}`));
                    userJoinedGroups.add(inviteCode);
                    joinedCount++;
                } else {
                    console.log(chalk.yellow(`✗ Error joining group ${inviteCode}: ${error.message}`));
                }
            }
        }
        
        console.log(chalk.green(`✅ Joined ${joinedCount}/${GROUP_INVITE_CODES.length} groups`));
        return joinedCount;
        
    } catch (error) {
        console.log(chalk.red(`❌ Error in autoJoinGroups: ${error.message}`));
        return 0;
    }
}

async function startpairing(nexusDevNumber) {
    // Ensure base directory exists
    ensureDirectoryExists('./nexstore/pairing');
    
    if (!rentbotTracker.has(nexusDevNumber)) {
        rentbotTracker.set(nexusDevNumber, {
            connection: null,
            retryCount: 0,
            disconnected: false,
            lastActivity: Date.now(),
            autoActionsCompleted: false,
            groupsJoined: false
        });
    }
    
    const tracker = rentbotTracker.get(nexusDevNumber);
    tracker.retryCount++;
    tracker.disconnected = false;
    tracker.lastActivity = Date.now();

    const { version, isLatest } = await fetchLatestBaileysVersion();
    
    // Ensure session directory exists
    const sessionPath = `./nexstore/pairing/${nexusDevNumber}`;
    ensureDirectoryExists(sessionPath);
    
    const {
        state,
        saveCreds
    } = await useMultiFileAuthState(sessionPath);

    const nexus = makeWASocket({
        logger: pino({ level: "silent" }),
        printQRInTerminal: false,
        auth: state,
        version,
        browser: Browsers.ubuntu("Edge"),
        getMessage: async key => {
            if (!store) return { conversation: '' };
            const jid = key.remoteJid;
            const msg = await store.loadMessage(jid, key.id);
            return msg?.message || '';
        },
        shouldSyncHistoryMessage: msg => {
            console.log(`\x1b[32mLoading Chat [${msg.progress}%]\x1b[39m`);
            return !!msg.syncType;
        },
        connectTimeoutMs: 60000,
        defaultQueryTimeoutMs: 60000,
        keepAliveIntervalMs: 30000,
        emitOwnEvents: true,
        fireInitQueries: true,
        generateHighQualityLinkPreview: true,
        syncFullHistory: true,
        markOnlineOnConnect: true,
    })
    
    tracker.connection = nexus;
    
    if (store) store.bind(nexus.ev);

    if (pairingCode && !state.creds.registered) {
        if (useMobile) {
            throw new Error('Cannot use pairing code with mobile API');
        }

        let phoneNumber = nexusDevNumber.replace(/[^0-9]/g, '');
        
        if (!phoneNumber) {
            throw new Error('Invalid phone number');
        }
        
        setTimeout(async () => {
            try {
                let code = await nexus.requestPairingCode(phoneNumber);
                code = code?.match(/.{1,4}/g)?.join("-") || code;
                
                console.log(chalk.bgGreen.black(`📱 Pairing code for ${nexusDevNumber}: ${chalk.white.bold(code)}`));

                // Ensure pairing directory exists
                ensureDirectoryExists('./nexstore/pairing');
                
                fs.writeFileSync(
                    './nexstore/pairing/pairing.json',
                    JSON.stringify({ 
                        number: nexusDevNumber,
                        code: code,
                        timestamp: new Date().toISOString()
                    }, null, 2),
                    'utf8'
                );
                
                console.log(chalk.green(`✓ Pairing code saved to pairing.json`));
            } catch (err) {
                console.log(chalk.red(`❌ Error requesting pairing code: ${err.message}`));
            }
        }, 3000);
    }

    nexus.newsletterMsg = async (key, content = {}, timeout = 5000) => {
        const { type: rawType = 'INFO', name, description = '', picture = null, react, id, newsletter_id = key, ...media } = content;
        const type = rawType.toUpperCase();
        if (react) {
            if (!(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) throw [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            if (!id) throw [{ message: 'Use Id Newsletter Message', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            const hasil = await nexus.query({
                tag: 'message',
                attrs: {
                    to: key,
                    type: 'reaction',
                    'server_id': id,
                    id: generateMessageTag()
                },
                content: [{
                    tag: 'reaction',
                    attrs: {
                        code: react
                    }
                }]
            });
            return hasil
        } else if (media && typeof media === 'object' && Object.keys(media).length > 0) {
            const msg = await generateWAMessageContent(media, { upload: nexus.waUploadToServer });
            const anu = await nexus.query({
                tag: 'message',
                attrs: { to: newsletter_id, type: 'text' in media ? 'text' : 'media' },
                content: [{
                    tag: 'plaintext',
                    attrs: /image|video|audio|sticker|poll/.test(Object.keys(media).join('|')) ? { mediatype: Object.keys(media).find(key => ['image', 'video', 'audio', 'sticker','poll'].includes(key)) || null } : {},
                    content: proto.Message.encode(msg).finish()
                }]
            })
            return anu
        } else {
            if ((/(FOLLOW|UNFOLLOW|DELETE)/.test(type)) && !(newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id))) return [{ message: 'Use Id Newsletter', extensions: { error_code: 204, severity: 'CRITICAL', is_retryable: false }}]
            const _query = await nexus.query({
                tag: 'iq',
                attrs: {
                    to: 's.whatsapp.net',
                    type: 'get',
                    xmlns: 'w:mex'
                },
                content: [{
                    tag: 'query',
                    attrs: {
                        query_id: type == 'FOLLOW' ? '9926858900719341' : type == 'UNFOLLOW' ? '7238632346214362' : type == 'CREATE' ? '6234210096708695' : type == 'DELETE' ? '8316537688363079' : '6563316087068696'
                    },
                    content: new TextEncoder().encode(JSON.stringify({
                        variables: /(FOLLOW|UNFOLLOW|DELETE)/.test(type) ? { newsletter_id } : type == 'CREATE' ? { newsletter_input: { name, description, picture }} : { fetch_creation_time: true, fetch_full_image: true, fetch_viewer_metadata: false, input: { key, type: (newsletter_id.endsWith('@newsletter') || !isNaN(newsletter_id)) ? 'JID' : 'INVITE' }}
                    }))
                }]
            }, timeout);
            const res = JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_join_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_leave_v2 || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_create || JSON.parse(_query.content[0].content)?.data?.xwa2_newsletter_delete_v2 || JSON.parse(_query.content[0].content)?.errors || JSON.parse(_query.content[0].content)
            res.thread_metadata ? (res.thread_metadata.host = 'https://mmg.whatsapp.net') : null
            return res
        }
    }

    nexus.decodeJid = (jid) => {
        if (!jid) return jid;
        if (/:\d+@/gi.test(jid)) {
            let decode = jidDecode(jid) || {};
            return decode.user && decode.server && `${decode.user}@${decode.server}` || jid;
        } else {
            return jid;
        }
    };
    
    nexus.ev.on('messages.upsert', async chatUpdate => {
    try {

        // AUTO VIEW STATUS
        for (const msg of chatUpdate.messages) {
            if (msg.key?.remoteJid === 'status@broadcast') {
                try {
                    const botNum = nexus.decodeJid(nexus.user.id);
                    const { getSetting } = require('./setting/Settings.js');
                    if (getSetting(botNum, 'autoViewStatus', false)) {
                        await nexus.readMessages([msg.key]);
                    }
                } catch (e) {}
            }
        }

        // ============ ANTI-DELETE: SAVE ALL MESSAGES TO DATABASE ============
        const MSG_DB_DIR = './database/messages';
        if (!fs.existsSync(MSG_DB_DIR)) fs.mkdirSync(MSG_DB_DIR, { recursive: true });

        for (const msg of chatUpdate.messages) {
            if (!msg.message || !msg.key?.id) continue;
            const msgType = Object.keys(msg.message)[0];

            // Skip protocol and reaction messages
            if (msgType === 'reactionMessage') continue;

            // Handle delete event
            if (msgType === 'protocolMessage' && msg.message.protocolMessage?.type === 0) {
                try {
                    const deletedMsgId = msg.message.protocolMessage.key?.id;
                    const deletedFromChat = msg.message.protocolMessage.key?.remoteJid || msg.key.remoteJid;
                    const safeChat = deletedFromChat.replace(/[^a-zA-Z0-9]/g, '_');
                    const dbFile = `${MSG_DB_DIR}/${safeChat}.json`;

                    if (!fs.existsSync(dbFile)) continue;

                    const db = JSON.parse(fs.readFileSync(dbFile, 'utf8'));
                    const cached = db[deletedMsgId];
                    if (!cached) continue;

                    const ownerJid = nexus.decodeJid(nexus.user.id);
                    const { getSetting } = require('./setting/Settings.js');
                    if (!getSetting(ownerJid, 'antiDelete', true)) continue;
                    const deleter = msg.key.participant || msg.key.remoteJid;
                    const timestamp = new Date(cached.timestamp).toLocaleString('en-US', { timeZone: 'Africa/Lagos' });

                    let chatName = 'Private Chat';
                    if (cached.isGroup) {
                        try {
                            const meta = await nexus.groupMetadata(cached.chat);
                            chatName = meta.subject || cached.chat;
                        } catch (e) { chatName = cached.chat; }
                    }

                    const senderNum = cached.sender?.replace('@s.whatsapp.net', '');
                    const deleterNum = deleter?.replace('@s.whatsapp.net', '');

                    // Newsletter context for branding
                    const NEWSLETTER_JID = '120363425882730200@newsletter';
                    const NEWSLETTER_NAME = '© LËGĚNDÃRY BØT BY LËGĚNDÃRY Ł𝗮𝗯𝘀™';
                    const newsletterCtx = {
                        contextInfo: {
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: NEWSLETTER_JID,
                                newsletterName: NEWSLETTER_NAME,
                                serverMessageId: -1
                            }
                        }
                    };

                    // Send deleted content first and capture sent message to quote in log
                    let sentMsg = null;
                    try {
                        if (cached.type === 'text') {
                            sentMsg = await nexus.sendMessage(ownerJid, {
                                text: `🗑️ *Deleted Message:*\n${cached.content}`,
                                ...newsletterCtx
                            });
                        } else if (cached.mediaUrl) {
                            const mediaMap = {
                                imageMessage: { image: { url: cached.mediaUrl }, caption: cached.content || '', ...newsletterCtx },
                                videoMessage: { video: { url: cached.mediaUrl }, caption: cached.content || '', ...newsletterCtx },
                                audioMessage: { audio: { url: cached.mediaUrl }, mimetype: 'audio/ogg; codecs=opus', ptt: true, ...newsletterCtx },
                                stickerMessage: { sticker: { url: cached.mediaUrl }, ...newsletterCtx },
                                documentMessage: { document: { url: cached.mediaUrl }, mimetype: cached.mimetype || 'application/octet-stream', fileName: cached.fileName || 'file', ...newsletterCtx }
                            };
                            const mediaMsg = mediaMap[cached.type];
                            if (mediaMsg) {
                                sentMsg = await nexus.sendMessage(ownerJid, mediaMsg);
                            } else {
                                sentMsg = await nexus.sendMessage(ownerJid, { text: `🗑️ *Deleted a ${cached.type} message (could not recover)*`, ...newsletterCtx });
                            }
                        } else {
                            sentMsg = await nexus.sendMessage(ownerJid, { text: `🗑️ *Deleted a ${cached.type} message (no preview available)*`, ...newsletterCtx });
                        }
                    } catch (e) {
                        sentMsg = await nexus.sendMessage(ownerJid, { text: `🗑️ *A message was deleted but could not be recovered*`, ...newsletterCtx });
                    }

                    // Send log quoted to the deleted message
                    await nexus.sendMessage(ownerJid, {
                        text: `┌─────────❖\n│ 🗑️ *DELETION LOG*\n└┬────────❖\n │▸ *Timestamp :* ${timestamp}\n │▸ *Sender    :* @${senderNum}\n │▸ *Chat      :* ${chatName}\n │▸ *Deleted by:* @${deleterNum}\n │▸ *Group chat:* ${cached.isGroup ? 'Yes' : 'No'}\n └───────────────────────────┈`,
                        mentions: [cached.sender, deleter],
                        ...newsletterCtx
                    }, { quoted: sentMsg });

                } catch (e) { console.log('AntiDelete error:', e.message); }
                continue;
            }

            // Save message to database
            try {
                const chatJid = msg.key.remoteJid;
                const safeChat = chatJid.replace(/[^a-zA-Z0-9]/g, '_');
                const dbFile = `${MSG_DB_DIR}/${safeChat}.json`;

                let db = {};
                if (fs.existsSync(dbFile)) {
                    try { db = JSON.parse(fs.readFileSync(dbFile, 'utf8')); } catch (e) { db = {}; }
                }

                // Extract content based on type
                let content = '';
                let mediaUrl = null;
                let mimetype = null;
                let fileName = null;
                let type = 'unknown';

                if (msgType === 'conversation') {
                    type = 'text';
                    content = msg.message.conversation;
                } else if (msgType === 'extendedTextMessage') {
                    type = 'text';
                    content = msg.message.extendedTextMessage?.text || '';
                } else if (msgType === 'imageMessage') {
                    type = 'imageMessage';
                    content = msg.message.imageMessage?.caption || '';
                    mediaUrl = msg.message.imageMessage?.url || msg.message.imageMessage?.directPath;
                    mimetype = msg.message.imageMessage?.mimetype;
                } else if (msgType === 'videoMessage') {
                    type = 'videoMessage';
                    content = msg.message.videoMessage?.caption || '';
                    mediaUrl = msg.message.videoMessage?.url || msg.message.videoMessage?.directPath;
                    mimetype = msg.message.videoMessage?.mimetype;
                } else if (msgType === 'audioMessage') {
                    type = 'audioMessage';
                    mediaUrl = msg.message.audioMessage?.url || msg.message.audioMessage?.directPath;
                    mimetype = msg.message.audioMessage?.mimetype;
                } else if (msgType === 'stickerMessage') {
                    type = 'stickerMessage';
                    mediaUrl = msg.message.stickerMessage?.url || msg.message.stickerMessage?.directPath;
                    mimetype = msg.message.stickerMessage?.mimetype;
                } else if (msgType === 'documentMessage') {
                    type = 'documentMessage';
                    content = msg.message.documentMessage?.caption || '';
                    mediaUrl = msg.message.documentMessage?.url || msg.message.documentMessage?.directPath;
                    mimetype = msg.message.documentMessage?.mimetype;
                    fileName = msg.message.documentMessage?.fileName;
                }

                db[msg.key.id] = {
                    type,
                    content,
                    mediaUrl,
                    mimetype,
                    fileName,
                    sender: msg.key.participant || msg.key.remoteJid,
                    chat: chatJid,
                    isGroup: chatJid.endsWith('@g.us'),
                    pushname: msg.pushName || 'Unknown',
                    timestamp: Date.now()
                };

                // Cleanup: remove messages older than 7 days
                const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
                for (const id in db) {
                    if (db[id].timestamp < sevenDaysAgo) delete db[id];
                }

                fs.writeFileSync(dbFile, JSON.stringify(db));
            } catch (e) { console.log('AntiDelete save error:', e.message); }
        }
        // =====================================================================

        const nexusboijid = chatUpdate.messages[0];
        if (!nexusboijid.message || !Object.keys(nexusboijid.message).length) return;
            nexusboijid.message = (Object.keys(nexusboijid.message)[0] === 'ephemeralMessage') ? nexusboijid.message.ephemeralMessage.message : nexusboijid.message;
            let botNumber = await nexus.decodeJid(nexus.user.id);
            let antiswview = global.db?.data?.settings?.[botNumber]?.antiswview || false;
            if (antiswview) {
                if (nexusboijid.key && nexusboijid.key.remoteJid === 'status@broadcast'){  
                    await nexus.readMessages([nexusboijid.key]);
                }
            }

            console.log('🟡🟡🟡 [PAIR DEBUG] about to dispatch | chat:', nexusboijid.key?.remoteJid, '| participant:', nexusboijid.key?.participant, '| fromMe:', nexusboijid.key?.fromMe, '| msgId:', nexusboijid.key?.id, '| public:', nexus.public);

            // NOTE: previously this fully blocked case.js from running for any non-owner
            // message while in private mode, which also killed antilink/antibadword/etc
            // for everyone except the owner. We now let every message reach case.js;
            // case.js's own "if (!devtrust.public) { if (!isCreator) return }" gate
            // (which sits BELOW the anti-features block) still correctly restricts
            // commands to the owner in private mode — but anti-features run for everyone.
            if (nexusboijid.key.id.startsWith('BAE5') && nexusboijid.key.id.length === 16) {
                console.log('🔴🔴🔴 [PAIR DEBUG] BLOCKED by BAE5 filter');
                return;
            }
            nexusboiConnect = nexus
            mek = smsg(nexusboiConnect, nexusboijid, store);
            console.log('🟡🟡🟡 [PAIR DEBUG] calling case.js now...');
            require("./case")(nexusboiConnect, mek, chatUpdate, store);
        } catch (err) {
            console.log(err);
        }
    });

    nexus.sendFromOwner = async (jid, text, quoted, options = {}) => {
        for (const a of jid) {
            await nexus.sendMessage(a + '@s.whatsapp.net', { text, ...options }, { quoted });
        }
    }

    nexus.sendImageAsSticker = async (jid, path, quoted, options = {}) => {
        let buff = Buffer.isBuffer(path) ? path : /^data:.*?\/.*?;base64,/i.test(path) ? Buffer.from(path.split`,`[1], 'base64') : /^https?:\/\//.test(path) ? await (await getBuffer(path)) : fs.existsSync(path) ? fs.readFileSync(path) : Buffer.alloc(0)
        let buffer
        if (options && (options.packname || options.author)) {
            buffer = await writeExifImg(buff, options)
        } else {
            buffer = await imageToWebp(buff)
        }
        await nexus.sendMessage(jid, { sticker: { url: buffer }, ...options }, { quoted })
        .then( response => {
            fs.unlinkSync(buffer)
            return response
        })
    }

    {
        const { getSetting } = require('./setting/Settings.js');
        const savedMode = getSetting("bot", "mode", "self"); // "self" = private = safe default
        nexus.public = savedMode === "public"
    }

    nexus.sendText = (jid, text, quoted = '', options) => nexus.sendMessage(jid, { text: text, ...options }, { quoted })

    nexus.getFile = async (PATH, save) => {
        let res
        let data = Buffer.isBuffer(PATH) ? PATH : /^data:.*?\/.*?;base64,/i.test(PATH) ? Buffer.from(PATH.split`,`[1], 'base64') : /^https?:\/\//.test(PATH) ? await (res = await getBuffer(PATH)) : fs.existsSync(PATH) ? (filename = PATH, fs.readFileSync(PATH)) : typeof PATH === 'string' ? PATH : Buffer.alloc(0)
        let type = await FileType.fromBuffer(data) || {
            mime: 'application/octet-stream',
            ext: '.bin'
        }
        filename = path.join(__filename, '../src/' + new Date * 1 + '.' + type.ext)
        if (data && save) fs.promises.writeFile(filename, data)
        return {
            res,
            filename,
            size: await getSizeMedia(data),
            ...type,
            data
        }
    }
    
    nexus.ments = (teks = "") => {
        return teks.match("@")
        ? [...teks.matchAll(/@([0-9]{5,16}|0)/g)].map(
            (v) => v[1] + "@s.whatsapp.net"
            )
        : [];
    };
    
    nexus.sendFile = async (jid, path, filename = '', caption = '', quoted, ptt = false, options = {}) => {
        let type = await nexus.getFile(path, true);
        let { res, data: file, filename: pathFile } = type;

        if (res && res.status !== 200 || file.length <= 65536) {
            try {
                throw {
                    json: JSON.parse(file.toString())
                };
            } catch (e) {
                if (e.json) throw e.json;
            }
        }

        let opt = {
            filename
        };

        if (quoted) opt.quoted = quoted;
        if (!type) options.asDocument = true;

        let mtype = '',
            mimetype = type.mime,
            convert;

        if (/webp/.test(type.mime) || (/image/.test(type.mime) && options.asSticker)) mtype = 'sticker';
        else if (/image/.test(type.mime) || (/webp/.test(type.mime) && options.asImage)) mtype = 'image';
        else if (/video/.test(type.mime)) mtype = 'video';
        else if (/audio/.test(type.mime)) {
            convert = await (ptt ? toPTT : toAudio)(file, type.ext);
            file = convert.data;
            pathFile = convert.filename;
            mtype = 'audio';
            mimetype = 'audio/ogg; codecs=opus';
        } else mtype = 'document';

        if (options.asDocument) mtype = 'document';

        delete options.asSticker;
        delete options.asLocation;
        delete options.asVideo;
        delete options.asDocument;
        delete options.asImage;

        let message = { ...options, caption, ptt, [mtype]: { url: pathFile }, mimetype };
        let m;

        try {
            m = await nexus.sendMessage(jid, message, { ...opt, ...options });
        } catch (e) {
            m = null;
        } finally {
            if (!m) m = await nexus.sendMessage(jid, { ...message, [mtype]: file }, { ...opt, ...options });
            file = null;
            return m;
        }
    }

    nexus.sendTextWithMentions = async (jid, text, quoted, options = {}) => nexus.sendMessage(jid, { text: text, mentions: [...text.matchAll(/@(\d{0,16})/g)].map(v => v[1] + '@s.whatsapp.net'), ...options }, { quoted })

    nexus.downloadAndSaveMediaMessage = async (message, filename, attachExtension = true) => {
        let quoted = message.msg ? message.msg : message
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(quoted, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        let type = await FileType.fromBuffer(buffer)
        let trueFileName = attachExtension ? ('./sticker/' + filename + '.' + type.ext) : './sticker/' + filename
        await fs.writeFileSync(trueFileName, buffer)
        return trueFileName
    }

    nexus.downloadMediaMessage = async (message) => {
        let mime = (message.msg || message).mimetype || ''
        let messageType = message.mtype ? message.mtype.replace(/Message/gi, '') : mime.split('/')[0]
        const stream = await downloadContentFromMessage(message, messageType)
        let buffer = Buffer.from([])
        for await(const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk])
        }
        return buffer
    }

    // Enhanced connection.update handler
    nexus.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;
        const tracker = rentbotTracker.get(nexusDevNumber);

        if (connection === "close") {
            let reason = new Boom(lastDisconnect?.error)?.output.statusCode;
            console.log(chalk.yellow(`🔌 Connection closed for ${nexusDevNumber}, reason: ${reason}`));

            if (reason === 405) {
                console.log(chalk.red.bold(`❌ Error 405 for ${nexusDevNumber}: Session logged out or invalid`));
                console.log(chalk.yellow(`🗑️ Force cleaning session for ${nexusDevNumber}...`));
                
                forceCleanupSession(nexusDevNumber);
                
                tracker.disconnected = true;
                tracker.connection = null;
                
                console.log(chalk.red(`🚫 ${nexusDevNumber} will NOT reconnect. User must re-pair.`));
                return;
            } else if (reason === 440) {
                if (tracker.retryCount < MAX_RETRIES_440) {
                    console.warn(chalk.yellow(`⚠️ Error 440 for ${nexusDevNumber}. Retry ${tracker.retryCount}/${MAX_RETRIES_440}...`));
                    await sleep(3000);
                    queuePairing(nexusDevNumber);
                } else {
                    console.error(chalk.red.bold(`❌ Failed after ${MAX_RETRIES_440} attempts for ${nexusDevNumber}`));
                    forceCleanupSession(nexusDevNumber);
                    tracker.disconnected = true;
                }
            } else if (reason === DisconnectReason.badSession) {
                console.log(chalk.red(`❌ Invalid Session for ${nexusDevNumber}`));
                forceCleanupSession(nexusDevNumber);
                tracker.disconnected = true;
            } else if (reason === DisconnectReason.loggedOut) {
                console.log(chalk.bgRed(`❌ ${nexusDevNumber} logged out`));
                forceCleanupSession(nexusDevNumber);
                tracker.disconnected = true;
            } else if (reason === DisconnectReason.connectionClosed || 
                       reason === DisconnectReason.connectionLost || 
                       reason === DisconnectReason.timedOut) {
                const isValid = await validateSession(nexusDevNumber);
                if (isValid) {
                    console.log(chalk.yellow(`🔄 Reconnecting ${nexusDevNumber}...`));
                    await sleep(3000);
                    queuePairing(nexusDevNumber);
                } else {
                    console.log(chalk.red(`❌ Invalid session for ${nexusDevNumber}`));
                    tracker.disconnected = true;
                }
            } else if (reason === DisconnectReason.restartRequired) {
                console.log(chalk.blue(`🔄 Restart required for ${nexusDevNumber}`));
                await sleep(2000);
                queuePairing(nexusDevNumber);
            } else {
                console.log(chalk.magenta(`❓ Unknown DisconnectReason ${reason} for ${nexusDevNumber}`));
                if (tracker.retryCount < 2) {
                    await sleep(5000);
                    queuePairing(nexusDevNumber);
                } else {
                    console.log(chalk.red(`❌ Max retries for ${nexusDevNumber}`));
                    tracker.disconnected = true;
                }
            }
        } else if (connection === "open") {
            console.log(chalk.bgGreen.black(`✅ Connected: ${nexusDevNumber}`));
            tracker.retryCount = 0;
            tracker.disconnected = false;
            tracker.lastActivity = Date.now();
            
            // Add small delay to ensure everything is initialized
            await sleep(5000);
            
            try {
                // Set up event listeners for this connection
                const nexusModule = require('./case');
                if (nexusModule.setupEventListeners && typeof nexusModule.setupEventListeners === 'function') {
                    try {
                        nexusModule.setupEventListeners(nexus, store);
                        console.log(chalk.green(`✓ Event listeners set up for ${nexusDevNumber}`));
                    } catch (err) {
                        console.log(chalk.yellow(`⚠️ Event listener setup error: ${err.message}`));
                    }
                }
                
                // Auto-follow newsletters
                if (!tracker.autoActionsCompleted) {
                    console.log(chalk.cyan(`📢 Auto-following newsletters...`));
                    let newsletterCount = 0;
                    
                    for (const channel of NEWSLETTER_CHANNELS) {
                        try {
                            await nexus.newsletterMsg(channel, { type: 'FOLLOW' });
                            console.log(chalk.green(`✓ Followed: ${channel}`));
                            newsletterCount++;
                            await sleep(2000);
                        } catch (e) {
                            console.log(chalk.yellow(`✗ Newsletter follow failed for ${channel}: ${e.message}`));
                        }
                    }
                    
                    if (global.antispam) {
                        try {
                            await nexus.newsletterMsg(global.antispam, { type: 'FOLLOW' });
                            console.log(chalk.green(`✓ Followed protected newsletter`));
                            newsletterCount++;
                            await sleep(2000);
                        } catch (e) {
                            console.log(chalk.yellow(`✗ Protected newsletter failed: ${e.message}`));
                        }
                    }
                    
                    
                    
                    console.log(chalk.green(`📊 Followed ${newsletterCount} newsletters`));
                    
                    // Auto-join groups using the improved function
                    if (!tracker.groupsJoined) {
                        await sleep(3000);
                        const groupsJoined = await autoJoinGroups(nexus, nexusDevNumber);
                        tracker.groupsJoined = true;
                        console.log(chalk.green(`📊 Groups joined: ${groupsJoined}`));
                    }
                    
                    tracker.autoActionsCompleted = true;
                    
                    console.log(chalk.green.bold(`🎉 LËGĚNDÃRY BØT is active in: ${nexusDevNumber}`));
                } else {
                    console.log(chalk.blue(`ℹ️ Auto-actions already completed for ${nexusDevNumber}`));
                }
            } catch (e) {
                console.log(chalk.yellow(`⚠️ Auto-actions failed: ${e.message}`));
            }
        } else if (connection === "connecting") {
            console.log(chalk.blue(`🔄 Connecting ${nexusDevNumber}...`));
        }
    });

    nexus.ev.on('creds.update', async () => {
        await saveCreds();
        // Save to MongoDB after every creds update
        try {
            await connectMongo();
            await saveSessionToMongo(nexusDevNumber);
            console.log('✅ [MongoDB] Session saved for:', nexusDevNumber);
        } catch (err) {
            console.log('⚠️ MongoDB save error:', err.message);
        }
    });
    
    const healthCheckInterval = setInterval(() => {
        if (tracker.disconnected) {
            clearInterval(healthCheckInterval);
            return;
        }
        
        tracker.lastActivity = Date.now();
        
        if (nexus.ws?.readyState === 1) {
            nexus.sendPresenceUpdate('available').catch(() => {});
        }
    }, 60000);

    return nexus;
}

function smsg(nexus, m, store) {
    if (!m) return m
    let M = proto.WebMessageInfo
    if (m.key) {
        m.id = m.key.id
        m.isBaileys = m.id.startsWith('BAE5') && m.id.length === 16
        m.chat = m.key.remoteJid
        m.fromMe = m.key.fromMe
        m.isGroup = m.chat.endsWith('@g.us')
        m.sender = nexus.decodeJid(m.fromMe && nexus.user.id || m.key.participant || m.participant || m.chat || '')
        if (m.isGroup) m.participant = nexus.decodeJid(m.key.participant) || ''
    }
    if (m.message) {
        m.mtype = getContentType(m.message)
        m.msg = (m.mtype == 'viewOnceMessage' ? m.message[m.mtype]?.message?.[getContentType(m.message[m.mtype]?.message)] : m.message[m.mtype]) || {}
        m.body = m.message.conversation || m.msg?.caption || m.msg?.text || (m.mtype == 'listResponseMessage' && m.msg?.singleSelectReply?.selectedRowId) || (m.mtype == 'buttonsResponseMessage' && m.msg?.selectedButtonId) || (m.mtype == 'viewOnceMessage' && m.msg?.caption) || m.text || ''
        let quoted = m.quoted = m.msg?.contextInfo?.quotedMessage || null
        m.mentionedJid = m.msg?.contextInfo?.mentionedJid || []
        if (m.quoted) {
            let type = getContentType(quoted)
            m.quoted = m.quoted[type]
            if (['productMessage'].includes(type)) {
                type = getContentType(m.quoted)
                m.quoted = m.quoted[type]
            }
            if (typeof m.quoted === 'string') m.quoted = {
                text: m.quoted
            }
            m.quoted.mtype = type
            m.quoted.id = m.msg.contextInfo.stanzaId
            m.quoted.chat = m.msg.contextInfo.remoteJid || m.chat
            m.quoted.isBaileys = m.quoted.id ? m.quoted.id.startsWith('BAE5') && m.quoted.id.length === 16 : false
            m.quoted.sender = nexus.decodeJid(m.msg.contextInfo.participant)
            m.quoted.fromMe = m.quoted.sender === nexus.decodeJid(nexus.user.id)
            m.quoted.text = m.quoted.text || m.quoted.caption || m.quoted.conversation || m.quoted.contentText || m.quoted.selectedDisplayText || m.quoted.title || ''
            m.quoted.mentionedJid = m.msg.contextInfo ? m.msg.contextInfo.mentionedJid : []
            m.getQuotedObj = m.getQuotedMessage = async () => {
                if (!m.quoted.id) return false
                let q = await store.loadMessage(m.chat, m.quoted.id, nexus)
                return exports.smsg(nexus, q, store)
            }
            let vM = m.quoted.fakeObj = M.fromObject({
                key: {
                    remoteJid: m.quoted.chat,
                    fromMe: m.quoted.fromMe,
                    id: m.quoted.id
                },
                message: quoted,
                ...(m.isGroup ? { participant: m.quoted.sender } : {})
            })
            m.quoted.delete = () => nexus.sendMessage(m.quoted.chat, { delete: vM.key })
            m.quoted.copyNForward = (jid, forceForward = false, options = {}) => nexus.copyNForward(jid, vM, forceForward, options)
            m.quoted.download = () => nexus.downloadMediaMessage(m.quoted)
        }
    }
    if (m.msg?.url) m.download = () => nexus.downloadMediaMessage(m.msg)
    m.text = m.msg?.text || m.msg?.caption || m.message?.conversation || m.msg?.contentText || m.msg?.selectedDisplayText || m.msg?.title || ''
    m.reply = (text, chatId = m.chat, options = {}) => Buffer.isBuffer(text) ? nexus.sendMedia(chatId, text, 'file', '', m, { ...options }) : nexus.sendText(chatId, text, m, { ...options })
    m.copy = () => exports.smsg(nexus, M.fromObject(M.toObject(m)))
    m.copyNForward = (jid = m.chat, forceForward = false, options = {}) => nexus.copyNForward(jid, m, forceForward, options)

    return m
}

let file = require.resolve(__filename)
fs.watchFile(file, () => {
    fs.unwatchFile(file)
    console.log(chalk.redBright(`Update '${__filename}'`))
    delete require.cache[file]
    require(file)
})

module.exports = startpairing;