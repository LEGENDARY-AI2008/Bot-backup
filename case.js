
require('./setting/config')
const { 
  default: baileys, proto, jidNormalizedUser, generateWAMessage, 
  generateWAMessageFromContent, getContentType, prepareWAMessageMedia 
} = require("@whiskeysockets/baileys");
const { downloadMediaMessage } = require("@whiskeysockets/baileys");

const {
  downloadContentFromMessage, emitGroupParticipantsUpdate, emitGroupUpdate, 
  generateWAMessageContent, makeInMemoryStore, MediaType, areJidsSameUser, 
  WAMessageStatus, downloadAndSaveMediaMessage, AuthenticationState, 
  GroupMetadata, initInMemoryKeyStore, MiscMessageGenerationOptions, 
  useSingleFileAuthState, BufferJSON, WAMessageProto, MessageOptions, 
  WAFlag, WANode, WAMetric, ChatModification, MessageTypeProto, 
  WALocationMessage, WAContextInfo, WAGroupMetadata, ProxyAgent, 
  waChatKey, MimetypeMap, MediaPathMap, WAContactMessage, 
  WAContactsArrayMessage, WAGroupInviteMessage, WATextMessage, 
  WAMessageContent, WAMessage, BaileysError, WA_MESSAGE_STATUS_TYPE, 
  MediariyuInfo, URL_REGEX, WAUrlInfo, WA_DEFAULT_EPHEMERAL, 
  WAMediaUpload, mentionedJid, processTime, Browser, MessageType, 
  Presence, WA_MESSAGE_STUB_TYPES, Mimetype, relayWAMessage, Browsers, 
  GroupSettingChange, DisriyuectReason, WASocket, getStream, WAProto, 
  isBaileys, AnyMessageContent, fetchLatestBaileysVersion, 
  templateMessage, InteractiveMessage, Header 
} = require("@whiskeysockets/baileys");

const fs = require('fs')
const path = require('path')
const util = require('util')
const chalk = require('chalk')
const os = require('os')
const axios = require('axios')
const fsx = require('fs-extra')

const OPENROUTER_API_KEY = "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"; // <-- paste your OpenRouter key here

async function askOpenAI(prompt) {
    const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-4o-mini",
            messages: [{ role: "user", content: prompt }]
        },
        {
            headers: {
                "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );
    return data.choices?.[0]?.message?.content || "No response.";
}
const crypto = require('crypto')
const googleTTS = require('google-tts-api')
const ffmpeg = require('fluent-ffmpeg')
const speed = require('performance-now')
const { spawn: spawn, exec } = require('child_process')
const timestampp = speed();
const jimp = require("jimp")
const latensi = speed() - timestampp
const moment = require('moment-timezone')
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const FormData = require('form-data');
const { Sticker, StickerTypes } = require('wa-sticker-formatter');
const { smsg, tanggal, getTime, isUrl, sleep, clockString, runtime, fetchJson, getBuffer, jsonformat, format, parseMention, getRandom, getGroupAdmins, generateProfilePicture } = require('./allfunc/storage')
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid, addExif } = require('./allfunc/exif.js')
const richpic = fs.readFileSync(`./media/image1.jpg`)
const numberEmojis = ["1️⃣","2️⃣","3️⃣","4️⃣","5️⃣","6️⃣","7️⃣","8️⃣","9️⃣"];

// ============ CREATE REQUIRED DIRECTORIES ============
const requiredDirs = [
    './database',
    './database/pairing',
    './database/sessions',
    './tmp',
    './media'
];

requiredDirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
    }
});
// ====================================================

// ============ PERSISTENT STORAGE FOR MUTED USERS ============
const MUTED_FILE = './database/muted.json';

function loadMutedData() {
  try {
    if (!fs.existsSync(MUTED_FILE)) {
      fs.writeFileSync(MUTED_FILE, JSON.stringify({}));
    }
    return JSON.parse(fs.readFileSync(MUTED_FILE));
  } catch (e) {
    console.log('Error loading muted data:', e);
    return {};
  }
}

function saveMutedData(data) {
  try {
    fs.writeFileSync(MUTED_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.log('Error saving muted data:', e);
    return false;
  }
}

// Load existing muted data
global.muted = loadMutedData();
// ============================================================

// ============ SUDO FUNCTIONS ============
const SUDO_FILE = './database/sudo.json';

function loadSudoList() {
  if (!fs.existsSync(SUDO_FILE)) {
    fs.writeFileSync(SUDO_FILE, JSON.stringify([]));
  }
  return JSON.parse(fs.readFileSync(SUDO_FILE));
}

function saveSudoList(data) {
  fs.writeFileSync(SUDO_FILE, JSON.stringify(data, null, 2));
}
// ========================================

// ============ CHANNEL LOG FUNCTIONS ============
const CHANNELLOG_FILE = './database/channellog.json';

function loadChannelLog() {
    try {
        if (!fs.existsSync(CHANNELLOG_FILE)) fs.writeFileSync(CHANNELLOG_FILE, JSON.stringify({}));
        return JSON.parse(fs.readFileSync(CHANNELLOG_FILE));
    } catch (e) { return {}; }
}

function saveChannelLog(data) {
    try { fs.writeFileSync(CHANNELLOG_FILE, JSON.stringify(data, null, 2)); } catch (e) {}
}
// Structure: { 'userJid': { enabled: false, channels: ['jid@newsletter'] } }
// ===============================================

// ============ PREFIX FUNCTIONS ============
const PREFIX_FILE = './database/prefixes.json';

function loadPrefixes() {
  if (!fs.existsSync(PREFIX_FILE)) {
    fs.writeFileSync(PREFIX_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(PREFIX_FILE));
}

function savePrefixes(data) {
  fs.writeFileSync(PREFIX_FILE, JSON.stringify(data, null, 2));
}

function getUserPrefix(userId) {
  const prefixes = loadPrefixes();
  return prefixes[userId] || '.'; // Default to '.' if no custom prefix
}

function setUserPrefix(userId, prefix) {
  const prefixes = loadPrefixes();
  prefixes[userId] = prefix;
  savePrefixes(prefixes);
}

// ============ SESSION FUNCTIONS ============
const SESSION_FILE = './database/sessions.json';
const PAIRING_DIR = './database/pairing/';

function loadUsers() {
    try {
        if (!fs.existsSync(SESSION_FILE)) {
            fs.writeFileSync(SESSION_FILE, JSON.stringify([]));
        }
        return JSON.parse(fs.readFileSync(SESSION_FILE));
    } catch (e) {
        console.log('Error loading sessions:', e);
        return [];
    }
}

function getSession(userId) {
    try {
        const cleanId = userId.split('@')[0].replace(/[^0-9]/g, '');
        const sessionFiles = fs.readdirSync(PAIRING_DIR).filter(file => 
            file.includes(cleanId) || file.includes(userId)
        );
        
        if (sessionFiles.length > 0) {
            const sessionFile = sessionFiles[0];
            const sessionPath = path.join(PAIRING_DIR, sessionFile);
            const sessionData = JSON.parse(fs.readFileSync(sessionPath));
            
            return {
                user: { id: userId },
                id: userId,
                jid: userId,
                data: sessionData,
                sendMessage: async (jid, message) => {
                    try {
                        // Check if devtrust exists and is ready
                        if (typeof devtrust !== 'undefined' && devtrust && devtrust.sendMessage) {
                            return await devtrust.sendMessage(jid, message);
                        } else {
                            console.log(`⚠️ devtrust not ready yet for ${userId}, message queued`);
                            // Store message to send later (optional - you can implement a queue)
                            return null;
                        }
                    } catch (err) {
                        console.error(`SendMessage error for ${userId}:`, err);
                        return null;
                    }
                }
            };
        }
        return null;
    } catch (e) {
        console.log('Error getting session:', e);
        return null;
    }
}
// ========================================

// ============ GLOBAL VARIABLES ============
global.packname = "LËGĚNDÃRY BØT MD";
global.author = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";
// ============ GLOBAL VARIABLES FOR FEATURES ============
global.antispam = {};      // For anti-spam feature
global.warns = {};         // For warning system
global.muted = {};         // For mute system
global.banned = global.banned || {};  // For banned users
const tictactoeGames = {};
const hangmanGames = {};
const hangmanVisual = [
    "😃🪓______", "😃🪓__|____", "😃🪓__|/___",
    "😃🪓__|/__", "😃🪓__|/\\_", "😃🪓__|/\\_", "💀 Game Over!"
];
const { getSetting, setSetting } = require("./setting/Settings.js");
const groupCache = new Map();

// ============ ANTI-LINK SETTINGS - MOVED UP HERE ============
const ANTILINK_FILE = './database/antilink_settings.json';

function loadAntilinkSettings() {
    try {
        if (!fs.existsSync(ANTILINK_FILE)) {
            fs.writeFileSync(ANTILINK_FILE, JSON.stringify({}));
            console.log('📁 Created antilink_settings.json file');
        }
        const data = fs.readFileSync(ANTILINK_FILE, 'utf-8');
        return JSON.parse(data);
    } catch (e) {
        console.log('⚠️ Error loading antilink settings:', e.message);
        return {};
    }
}

function saveAntilinkSettings(settings) {
    try {
        fs.writeFileSync(ANTILINK_FILE, JSON.stringify(settings, null, 2));
        return true;
    } catch (e) {
        console.log('⚠️ Error saving antilink settings:', e.message);
        return false;
    }
}

// Generate per-session antilink key — prevents collisions between users
function getAntilinkKey(botNum, chatId) {
    return `${botNum}::${chatId}`;
}

// Load antilink settings BEFORE anything else uses them
let antilinkSettings = loadAntilinkSettings();
// =========================================================


module.exports = devtrust = async (devtrust, m, chatUpdate, store) => {
const { from } = m
console.log('🟢🟢🟢 [ENTRY] case.js called | isGroup:', m.isGroup, '| chat:', m.chat, '| sender:', m.sender, '| fromMe:', m.key?.fromMe, '| botPublic:', devtrust.public);
try {
      
// Newsletter configuration
const NEWSLETTER_JID = '120363425882730200@newsletter';
const NEWSLETTER_NAME = "© LËGĚNDÃRY BØT BY LËGĚNDÃRY Ł𝗮𝗯𝘀™";

const addNewsletterContext = (messageContent) => {
  if (messageContent.contextInfo) {
    return {
      ...messageContent,
      contextInfo: {
        ...messageContent.contextInfo,
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: NEWSLETTER_JID,
          newsletterName: NEWSLETTER_NAME,
          serverMessageId: -1
        }
      }
    };
  }
  return {
    ...messageContent,
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
};

const replyWithNewsletter = async (jid, text, quotedMsg, mentions = []) => {
  try {
    await devtrust.sendMessage(jid, 
      addNewsletterContext({ 
        text: text,
        mentions: mentions 
      }), 
      { quoted: quotedMsg }
    );
  } catch (error) {
    console.error('Reply with newsletter error:', error);
    await devtrust.sendMessage(jid, 
      { text: text, mentions: mentions }, 
      { quoted: quotedMsg }
    );
  }
};

const reply = async (text, mentions = []) => {
  try {
    return await replyWithNewsletter(m.chat, text, m, mentions);
  } catch (error) {
    console.error('Reply failed:', error);
    return null;
  }
};

// ======================[ FIXED COMMAND DETECTION ]======================
const body = (
    m.mtype === "conversation" ? m.message?.conversation :
    m.mtype === "extendedTextMessage" ? m.message?.extendedTextMessage?.text :
    m.mtype === "imageMessage" ? m.message?.imageMessage?.caption :
    m.mtype === "videoMessage" ? m.message?.videoMessage?.caption :
    m.mtype === "documentMessage" ? m.message?.documentMessage?.caption || "" :
    m.mtype === "audioMessage" ? m.message?.audioMessage?.caption || "" :
    m.mtype === "stickerMessage" ? m.message?.stickerMessage?.caption || "" :
    m.mtype === "buttonsResponseMessage" ? m.message?.buttonsResponseMessage?.selectedButtonId :
    m.mtype === "listResponseMessage" ? m.message?.listResponseMessage?.singleSelectReply?.selectedRowId :
    m.mtype === "templateButtonReplyMessage" ? m.message?.templateButtonReplyMessage?.selectedId :
    m.mtype === "interactiveResponseMessage" ? JSON.parse(m.msg?.nativeFlowResponseMessage?.paramsJson).id :
    m.mtype === "messageContextInfo" ? m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId || m.text :
    m.mtype === "reactionMessage" ? m.message?.reactionMessage?.text :
    m.mtype === "contactMessage" ? m.message?.contactMessage?.displayName :
    m.mtype === "contactsArrayMessage" ? m.message?.contactsArrayMessage?.contacts?.map(c => c.displayName).join(", ") :
    m.mtype === "locationMessage" ? `${m.message?.locationMessage?.degreesLatitude}, ${m.message?.locationMessage?.degreesLongitude}` :
    m.mtype === "liveLocationMessage" ? `${m.message?.liveLocationMessage?.degreesLatitude}, ${m.message?.liveLocationMessage?.degreesLongitude}` :
    m.mtype === "pollCreationMessage" ? m.message?.pollCreationMessage?.name :
    m.mtype === "pollUpdateMessage" ? m.message?.pollUpdateMessage?.name :
    m.mtype === "groupInviteMessage" ? m.message?.groupInviteMessage?.groupJid :
    m.mtype === "viewOnceMessage" ? (m.message?.viewOnceMessage?.message?.imageMessage?.caption ||
                                     m.message?.viewOnceMessage?.message?.videoMessage?.caption ||
                                     "[Pesan sekali lihat]") :
    m.mtype === "viewOnceMessageV2" ? (m.message?.viewOnceMessageV2?.message?.imageMessage?.caption ||
                                       m.message?.viewOnceMessageV2?.message?.videoMessage?.caption ||
                                       "[Pesan sekali lihat]") :
    m.mtype === "viewOnceMessageV2Extension" ? (m.message?.viewOnceMessageV2Extension?.message?.imageMessage?.caption ||
                                                m.message?.viewOnceMessageV2Extension?.message?.videoMessage?.caption ||
                                                "[Pesan sekali lihat]") :
    m.mtype === "ephemeralMessage" ? (m.message?.ephemeralMessage?.message?.conversation ||
                                      m.message?.ephemeralMessage?.message?.extendedTextMessage?.text ||
                                      "[Pesan sementara]") :
    m.mtype === "interactiveMessage" ? "[Pesan interaktif]" :
    m.mtype === "protocolMessage" ? "[Pesan telah dihapus]" :
    ""
);


// ============ COMMAND DETECTION (PER-USER PREFIX) ============
const owner = JSON.parse(fs.readFileSync('./allfunc/owner.json'))
const Premium = JSON.parse(fs.readFileSync('./allfunc/premium.json'))
const ownerNumber = owner[0] || "254700000000";

// Get user-specific prefix from the new system
let prefix = getUserPrefix(m.sender);

// STRICT command detection - ONLY detect if message STARTS WITH user's prefix
const isCmd = body && typeof body === 'string' && body.startsWith(prefix);

let command = '';
let args = [];
let text = '';

if (isCmd) {
    // Extract command ONLY if it starts with user's prefix
    const afterPrefix = body.slice(prefix.length).trim();
    const parts = afterPrefix.split(/ +/);
    command = parts[0].toLowerCase();
    args = parts.slice(1);
    text = args.join(' ');
    
    console.log('✅ Command detected for user:', command);
}

const qtext = args.join(" ");
const q = args.join(" ");
const tempMailData = {};
const quoted = m.quoted ? m.quoted : m;
const from = m.key.remoteJid;
const sender = m.isGroup ? (m.key.participant ? m.key.participant : m.participant) : m.key.remoteJid;
const userMovieSessions = {};
const groupMetadata = m.isGroup ? await devtrust.groupMetadata(from).catch(() => null) : null;
const participants = m.isGroup ? groupMetadata?.participants || [] : [];
const groupAdmins = m.isGroup ? await getGroupAdmins(participants) : [];
const botNumber = await devtrust.decodeJid(devtrust.user.id);
const isCreator = [botNumber, ...owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isDev = owner.map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net');
const isOwner = [botNumber, ...owner].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isPremium = [botNumber, ...Premium].map(v => v.replace(/[^0-9]/g, '') + '@s.whatsapp.net').includes(m.sender);
const isSudo = loadSudoList().includes(m.sender);
const isBotAdmins = m.isGroup ? groupAdmins.includes(botNumber) : false;
const isAdmins = m.isGroup ? groupAdmins.includes(m.sender) : false;
const groupName = m.isGroup ? groupMetadata?.subject || "" : "";
const pushname = m.pushName || "No Name";
const time = moment(Date.now()).tz('Africa/Lagos').locale('en').format('HH:mm:ss z');
const mime = (quoted.msg || quoted).mimetype || '';
const todayDateWIB = new Date().toLocaleDateString('id-ID', {
  timeZone: 'Africa/Lagos',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

// ============ STICKER HELPER FUNCTIONS ============
async function sendImageAsSticker(chatId, media, quoted, options = {}) {
    try {
        const sticker = new Sticker(media, {
            pack: options.packname || global.packname || "LËGĚNDÃRY BØT",
            author: options.author || global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™",
            type: StickerTypes.FULL,
            quality: 80,
            background: '#00000000'
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(chatId, { sticker: stickerBuffer }, { quoted });
        return true;
    } catch (error) {
        console.error('Image sticker error:', error);
        throw error;
    }
}

async function sendVideoAsSticker(chatId, media, quoted, options = {}) {
    try {
        const sticker = new Sticker(media, {
            pack: options.packname || global.packname || "LËGĚNDÃRY BØT",
            author: options.author || global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™",
            type: StickerTypes.FULL,
            quality: 50,
            background: '#00000000'
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(chatId, { sticker: stickerBuffer }, { quoted });
        return true;
    } catch (error) {
        console.error('Video sticker error:', error);
        throw error;
    }
}

// ============ STYLETEXT FUNCTION ============
async function styletext(text) {
    return [
        { name: 'Normal', result: text },
        { name: 'Bold', result: '**' + text + '**' },
        { name: 'Italic', result: '*' + text + '*' },
        { name: 'Strikethrough', result: '~' + text + '~' },
        { name: 'Monospace', result: '```' + text + '```' }
    ];
}

// ============ RANDOM COLOR FUNCTION ============
function randomColor() {
    const colors = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white', 'greenBright', 'yellowBright'];
    const colorIndex = Math.floor(Math.random() * colors.length);
    const colorName = colors[colorIndex];
    
    // Return chalk color function
    switch(colorName) {
        case 'red': return chalk.red;
        case 'green': return chalk.green;
        case 'yellow': return chalk.yellow;
        case 'blue': return chalk.blue;
        case 'magenta': return chalk.magenta;
        case 'cyan': return chalk.cyan;
        case 'white': return chalk.white;
        case 'greenBright': return chalk.greenBright;
        case 'yellowBright': return chalk.yellowBright;
        default: return chalk.white;
    }
}
// ==================================================
   
// BUG FUNCTIONS REMOVED TO ADD BUG FUNCTIONS / MAINTENANCE OF BOT CONTACT BASE OWNER 2348087253512 DON’T EDIT ANYTHING IN CASE WITH OUT THE OWNER NOTICE MAY CAUSE ERRRORS - BY ×͜× 𝙿𝚛𝚘𝚋𝚊𝚋𝚕𝚢 𝙱𝚞𝚜𝚢 永 𝙲𝙴𝙾 o̶f̶ Λ𝗫𝗜𝗦 Ł𝗮𝗯𝘀™


// ============ ACCOUNT FUNCTIONS ============
const ACCOUNT_FILE = './database/accounts.json';

function loadAccounts() {
  if (!fs.existsSync(ACCOUNT_FILE)) {
    fs.writeFileSync(ACCOUNT_FILE, JSON.stringify({}));
  }
  return JSON.parse(fs.readFileSync(ACCOUNT_FILE));
}

function saveAccounts(data) {
  fs.writeFileSync(ACCOUNT_FILE, JSON.stringify(data, null, 2));
}

// Ensure directories exist (SESSION_FILE and PAIRING_DIR already declared above)
if (!fs.existsSync('./database')) fs.mkdirSync('./database', { recursive: true });
if (!fs.existsSync(PAIRING_DIR)) fs.mkdirSync(PAIRING_DIR, { recursive: true });

// ============ GLOBAL VARIABLES ============
const more = String.fromCharCode(8206);
const readMore = more.repeat(4001);
const Richie = "LËGĚNDÃRY Ł𝗮𝗯𝘀™ 🥶";

global.packname = "LËGĚNDÃRY BØT";
global.author = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";

// ===== AUTO REACT (runs for ALL users, before private mode gate) =====
const _autoReactOn = getSetting(m.chat, "autoReact", false);
if (process.env.DEBUG_AUTOREACT) {
    console.log('[AutoReact Debug]', { chat: m.chat, settingOn: _autoReactOn, fromMe: m.key.fromMe });
}
if (_autoReactOn) {
    const emojis = [
        "😁", "😂", "🤣", "😃", "😄", "😅", "😆", "😉", "😊",
        "😍", "😘", "😎", "🤩", "🤔", "😏", "😣", "😥", "😮", "🤐",
        "😪", "😫", "😴", "😌", "😛", "😜", "😝", "🤤", "😒", "😓",
        "😔", "😕", "🙃", "🤑", "😲", "😖", "😞", "😟", "😤", "😢",
        "😭", "😨", "😩", "🤯", "😬", "😰", "😱", "🥵", "🥶", "😳",
        "🤪", "🀄", "😠", "🀄", "😷", "🤒", "🤕", "🤢", "🤮", "🤧",
        "😇", "🥳", "🤠", "🤡", "🤥", "🤫", "🤭", "🧐", "🤓", "😈",
        "👿", "👹", "👺", "💀", "👻", "🖕", "🙏", "🤖", "🎃", "😺",
        "😸", "😹", "😻", "😼", "😽", "🙀", "😿", "😾", "💋", "💌",
        "💘", "💝", "💖", "💗", "💓", "💞", "💕", "💟", "💔", "❤️"
    ];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    try {
        await devtrust.sendMessage(m.chat, {
            react: { text: randomEmoji, key: m.key },
        });
    } catch (err) {
        console.error('AutoReact error:', err.message);
    }
}
// =====================================================================

// ======================[ 🛡️ ANTI FEATURES — runs BEFORE public mode gate ]======================

// ── Shared helper: delete msg + take action ──────────────────────────────
async function antiAction(action, reason, warningEmoji, targetKey) {
    try { 
        await devtrust.sendMessage(m.chat, { 
            delete: targetKey || {
                remoteJid: m.chat,
                fromMe: false,
                id: m.key.id,
                participant: m.sender
            }
        }); 
    } catch(e) {}
    if (action === 'kick') {
        try {
            await devtrust.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
            await reply(`👢 @${m.sender.split('@')[0]} was kicked for ${reason}`, [m.sender]);
        } catch(e) {
            await reply(`${warningEmoji} @${m.sender.split('@')[0]} ${reason} is not allowed here!\n_(Make me admin to enable kick mode)_`, [m.sender]);
        }
    } else {
        await reply(`${warningEmoji} @${m.sender.split('@')[0]} ${reason} is not allowed here!`, [m.sender]);
    }
}

// ── 1. ANTILINK ──────────────────────────────────────────────────────────
// NOTE: this block must always stay ABOVE the "if (!devtrust.public) { if (!isCreator) return }"
// gate further down in this file. It runs for every group message regardless of
// public/private mode, exactly like ANTIBADWORD below — do not move it under that gate.
if (m.isGroup) {
    console.log('🔗🔗🔗 [ANTILINK DEBUG]', {
        chat: m.chat,
        sender: m.sender,
        isAdmins,
        isCreator,
        botPublic: devtrust.public,
        hasSettings: !!antilinkSettings[getAntilinkKey(botNumber, m.chat)],
        settings: antilinkSettings[getAntilinkKey(botNumber, m.chat)]
    });
}
if (m.isGroup && !isAdmins && !isCreator) {
    const groupSettings = antilinkSettings[getAntilinkKey(botNumber, m.chat)];
    if (groupSettings && groupSettings.enabled) {
        // NOTE: no /g flag — using /g with .test() causes stateful lastIndex bug
        const linkRegex = /https?:\/\/[^\s]+|www\.[^\s]+|chat\.whatsapp\.com\/[^\s]+|wa\.me\/[^\s]+|t\.me\/[^\s]+|[a-zA-Z0-9-]+\.(com|net|org|io|gov|edu|xyz|tk|ml|ga|cf|gq|me|tv|cc|ws|club|online|site|tech|store|blog|live|app|co)[^\s]*/i;

        const checkTexts = [
            body,
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
            m.message?.imageMessage?.caption,
            m.message?.videoMessage?.caption,
            m.message?.documentMessage?.caption,
        ].filter(Boolean).join(' ');

        console.log('🔗🔗🔗 [ANTILINK DEBUG] checkTexts:', JSON.stringify(checkTexts), 'matches:', linkRegex.test(checkTexts));

        if (checkTexts && linkRegex.test(checkTexts)) {
            // Same pattern as ANTIBADWORD: always attempt the delete directly,
            // unconditionally, instead of branching on isBotAdmins first.
            try {
                await devtrust.sendMessage(m.chat, { delete: m.key });
            } catch (e) {}

            if (groupSettings.action === 'kick') {
                try {
                    await devtrust.groupParticipantsUpdate(m.chat, [m.sender], 'remove');
                    await reply(`👢 @${m.sender.split('@')[0]} was kicked for posting links`, [m.sender]);
                } catch (e) {
                    await reply(`⚠️ @${m.sender.split('@')[0]} Links are not allowed here!\n\n_Make me admin to enable kick mode_`, [m.sender]);
                }
            } else {
                await reply(`⚠️ @${m.sender.split('@')[0]} Links are not allowed here!`, [m.sender]);
            }
            return;
        }
    }
}

// ── 2. ANTI-TAG (includes WA @all feature) ───────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const allMentioned = [
            ...(m.mentionedJid || []),
            ...(m.message?.extendedTextMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.imageMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.videoMessage?.contextInfo?.mentionedJid || []),
            ...(m.message?.conversation?.contextInfo?.mentionedJid || []),
        ];
        const uniqueMentioned = [...new Set(allMentioned)];

        const rawText2 = [
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
            m.message?.imageMessage?.caption,
            m.message?.videoMessage?.caption,
        ].filter(Boolean).join(' ');

        const signal1 = uniqueMentioned.includes('0@s.whatsapp.net');
        const signal2 = /@all\b|@everyone\b/i.test(rawText2);
        const signal3 = participants.length > 4 && uniqueMentioned.length >= participants.length;
        const signal4 = uniqueMentioned.some(j =>
            j === 'all@s.whatsapp.net' || j === 'all@broadcast' || j?.includes('@broadcast')
        );

        const isAtAll = signal1 || signal2 || signal3 || signal4;
        const isMassTag = uniqueMentioned.length > 5;

        if (isAtAll || isMassTag) {
            const reason = isAtAll ? 'using @all to tag everyone' : 'mass tagging members';
            await antiAction(config.action, reason, '🏷️');
            return;
        }
    }
}

// ── 3. ANTI-SPAM ────────────────────────────────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
    if (config.enabled) {
        if (!global.antispam) global.antispam = {};
        if (!global.antispam[m.chat]) global.antispam[m.chat] = {};
        const spamUser = global.antispam[m.chat][m.sender];
        const now = Date.now();
        if (!spamUser) {
            global.antispam[m.chat][m.sender] = { count: 1, ts: now };
        } else {
            if (now - spamUser.ts < 5000) {
                spamUser.count++;
                if (spamUser.count >= 6) {
                    await antiAction(config.action, 'spamming', '🚫');
                    global.antispam[m.chat][m.sender] = { count: 0, ts: now };
                    return;
                }
            } else {
                global.antispam[m.chat][m.sender] = { count: 1, ts: now };
            }
        }
    }
}

// ── 4. ANTI-BOT ─────────────────────────────────────────────────────────
if (m.isGroup && body && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antibot", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const botPrefixes = ['.', '!', '/', '#', '$', '%', '&', '*', '^', '~'];
        const looksLikeBot =
            m.sender?.includes(':') ||
            m.sender?.includes('bot') ||
            m.sender?.includes('broadcast') ||
            m.key?.fromMe === false && m.key?.id?.startsWith('BAE5');
        if (botPrefixes.some(p => body.startsWith(p)) && looksLikeBot) {
            await antiAction(config.action, 'using bot commands', '🤖');
            return;
        }
    }
}

// ── 5. ANTI-BEG ─────────────────────────────────────────────────────────
if (m.isGroup && !isAdmins && !isCreator) {
    const config = getSetting(botNumber + m.chat, "antibeg", { enabled: false, action: 'delete' });
    if (config.enabled) {
        const begCheckText = [
            body,
            m.message?.conversation,
            m.message?.extendedTextMessage?.text,
        ].filter(Boolean).join(' ');
        const begPatterns = [
            /bless me/i, /send me money/i, /give me money/i, /help me financially/i,
            /i need money/i, /i dey suffer/i, /no money/i, /hungry dey catch me/i,
            /send me airtime/i, /buy me data/i, /fund me/i, /donate to me/i,
            /my account number/i, /send cash/i, /poor me/i,
            /assist me financially/i, /anything for me/i,
            /broke as hell/i, /i am starving/i, /no food/i
        ];
        if (begCheckText && begPatterns.some(p => p.test(begCheckText))) {
            await antiAction(config.action, 'begging', '💰');
            return;
        }
    }
}

// ── 6. ANTIBADWORD ──────────────────────────────────────────────────────
if (getSetting(botNumber + m.chat, "feature.antibadword", false) && m.isGroup && !isAdmins && !isCreator) {
   const badWords = ["fuck", "bitch", "sex", "nigga","bastard","fool","mumu","idiot","werey","mother","mama","ass","mad","dick","pussy","bast"];
   const badWordCheckText = [
       body,
       m.message?.conversation,
       m.message?.extendedTextMessage?.text,
       m.message?.imageMessage?.caption,
       m.message?.videoMessage?.caption,
       m.message?.documentMessage?.caption,
   ].filter(Boolean).join(' ').toLowerCase();
   if (badWordCheckText && badWords.some(word => badWordCheckText.includes(word))) {
      try { await devtrust.sendMessage(m.chat, { delete: m.key }); } catch(e) {}
      await reply(`❌ @${m.sender.split('@')[0]} watch your language 😟!`, [m.sender]);
   }
}

// =====================================================================

if (!devtrust.public) {
    if (!isCreator) return
}

// SPECIAL CHECK: If user types ONLY the default "." - show THEIR current prefix
// (placed here, below the private-mode gate, so it doesn't leak replies to
// non-owner users/groups while the bot is in private mode)
if (body && body.trim() === '.') {
    reply(`🔧 *Your current prefix:* \`${prefix}\`\n_You can change it using_ \`${prefix}setprefix [new]\``);
    return;
}

const example = (teks) => {
    return `Usage : *${prefix+command}* ${teks}`
}

let antilinkStatus = {};
if (!global.banned) global.banned = {} // stores banned users JIDs

if (getSetting(m.sender, "autobio", true)) {
    devtrust.updateProfileStatus(`LËGĚNDÃRY BØT IS HERE`).catch(_ => _)
}

if (isCmd) {
    console.log(chalk.black(chalk.bgWhite('[ Λ𝗫𝗜𝗦 𝗫𝗠𝗗 ]')), chalk.black(chalk.bgGreen(new Date)), chalk.black(chalk.bgBlue(body || m.mtype)) + '\n' + chalk.magenta('=> From'), chalk.green(pushname), chalk.yellow(m.sender) + '\n' + chalk.blueBright('=>In'), chalk.green(m.isGroup ? pushname : 'Private Chat', m.chat))
}


if (getSetting(m.chat, "autoTyping", false)) {
    devtrust.sendPresenceUpdate('composing', from)
}
if (getSetting(m.chat, "autoRecording", false)) {
    devtrust.sendPresenceUpdate('recording', from)
}
if (getSetting(m.chat, "autoRecordType", false)) {
    let xeonrecordin = ['recording','composing']
    let xeonrecordinfinal = xeonrecordin[Math.floor(Math.random() * xeonrecordin.length)]
    devtrust.sendPresenceUpdate(xeonrecordinfinal, from)
}
     
//----------------------Func End----------------//
if (getSetting(m.sender, "autoViewStatus", false) && m.key.remoteJid === "status@broadcast") {
    try {
        await devtrust.readMessages([m.key]);
        console.log(`👀 Viewed status from: ${m.key.participant}`);
    } catch (err) {
        console.log("❌ Error viewing status:", err);
    }
}

if (getSetting(m.chat, "autoRecording", false)) {
    devtrust.sendPresenceUpdate('recording', from)
}  
    
if (getSetting(m.chat, "autoTyping", false)) {
    devtrust.sendPresenceUpdate('composing', from)
}

if (getSetting(m.chat, "autoRecordType", false)) {
    let xeonrecordin = ['recording','composing']
    let xeonrecordinfinal = xeonrecordin[Math.floor(Math.random() * xeonrecordin.length)]
    devtrust.sendPresenceUpdate(xeonrecordinfinal, from)
}

if (getSetting(m.sender, "autoread", false)) {
   try {
      await devtrust.readMessages([m.key]) 
   } catch (e) {
      console.log("Auto-Read Error:", e)
   }
}

// ======================[ BANNED USERS CHECK ]======================
if (getSetting(m.sender, "banned", false)) {
    await reply(`⛔ You are banned from using this bot, @${m.sender.split('@')[0]}`, [m.sender])
    return
}

// ======================[ 🔇 MUTED USERS CHECK ]======================
if (m.isGroup && global.muted?.[m.chat]?.includes(m.sender) && !isAdmins && !isCreator) {
    await devtrust.sendMessage(m.chat, { delete: m.key });
    return;
}

if (getSetting(botNumber + m.chat, "feature.autoreply", false)) {
   const autoReplyList = { 
       "hi": "Hello 👋", 
       "hello": "Hi there!", 
       "I am LËGĚNDÃRY BØT": "Coolest Whatsapp bot 😌" 
   }
   if (autoReplyList[m.text?.toLowerCase()]) {
      await reply(autoReplyList[m.text.toLowerCase()])
   }
}

let chatbot = false;

//LOADING FUNCTION
async function nexusLoading() {
    const nexusMylove = [`Loading menu...`];
    let msg = await devtrust.sendMessage(from, { text: "Connecting to Λ𝗫𝗜𝗦 𝗫𝗠𝗗 server....." });

    for (let i = 0; i < nexusMylove.length; i++) {
        await devtrust.sendMessage(from, {
            text: nexusMylove[i],
            edit: msg.key
        });
        await new Promise(resolve => setTimeout(resolve, 200));
    }
}

// Newsletter JIDs to auto-react to
const newsletterJids = ["120363406376026638@newsletter"];
const newsletterEmojis = [
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔', '❣️', 
    '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🥺', '😊', '🙏', 
    '😙', '😻', '🔥', '😀', '😍', '🥰', '😘', '🤗', '🤩', '😎', '😇', 
    '🥶','🥳', '😋', '🎉', '🔥'
];

const hansRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ============ REGISTER ONCE GUARD ============
// Prevents duplicate listeners every time a message comes in
if (!global._newsletterListenerRegistered) {
    global._newsletterListenerRegistered = true;

    // We store a reference to devtrust when it's first available
    // The listener will be set up on first call below
    global._newsletterListenerReady = false;
}
// =============================================

// Register the newsletter/channel listener ONCE per bot session
if (!global._newsletterListenerReady) {
    global._newsletterListenerReady = true;

    devtrust.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const msg = chatUpdate.messages?.[0];
            if (!msg) return;
            const sender = msg.key.remoteJid;

            // Auto-react to followed newsletters
            if (!msg.key.fromMe && newsletterJids.includes(sender)) {
                if (getSetting(devtrust.decodeJid(devtrust.user.id), 'autoReactChannel', false)) {
                    const serverId = msg.newsletterServerId;
                    if (serverId) {
                        const emoji = hansRandom(newsletterEmojis);
                        await devtrust.newsletterReactMessage(sender, serverId.toString(), emoji);
                    }
                }
            }

            // ===== CHANNEL LOG ALERT =====
            if (sender && sender.endsWith('@newsletter')) {
                try {
                    const clData = loadChannelLog();
                    const currentBotJid = devtrust.user?.id ? devtrust.decodeJid(devtrust.user.id) : null;
                    if (currentBotJid && clData[currentBotJid]?.enabled) {

                        // Prevent spam — only process each message ID once
                        const msgId = msg.key.id;
                        if (!global.processedChannelMsgs) global.processedChannelMsgs = new Set();
                        if (global.processedChannelMsgs.has(msgId)) return;
                        global.processedChannelMsgs.add(msgId);
                        if (global.processedChannelMsgs.size > 500) {
                            const first = global.processedChannelMsgs.values().next().value;
                            global.processedChannelMsgs.delete(first);
                        }

                        // ── Fetch channel metadata (name + admin list) ──
                        let channelName = sender;
                        let adminsList = [];
                        try {
                            const nlMeta = await devtrust.newsletterMetadata('jid', sender).catch(() => null);
                            if (nlMeta) {
                                if (nlMeta.name) channelName = nlMeta.name;
                                else if (nlMeta.handle) channelName = '@' + nlMeta.handle;
                                const subs = nlMeta.subscribers || nlMeta.members || nlMeta.admins || [];
                                for (const sub of subs) {
                                    const role = (sub.role || sub.type || '').toString().toLowerCase();
                                    if (role.includes('admin') || role.includes('owner')) {
                                        const jid = sub.id || sub.jid || '';
                                        if (jid) adminsList.push({
                                            number: jid.replace(/@[^@]+$/, ''),
                                            name: sub.name || sub.display_name || null
                                        });
                                    }
                                }
                            }
                        } catch (_) {}

                        // ── Who posted ──
                        let adminNumber = null;
                        let adminName   = null;

                        const rawAdminJid =
                            msg.key?.participant ||
                            msg.participant ||
                            msg.message?.extendedTextMessage?.contextInfo?.participant ||
                            msg.message?.imageMessage?.contextInfo?.participant ||
                            msg.message?.videoMessage?.contextInfo?.participant ||
                            msg.message?.audioMessage?.contextInfo?.participant ||
                            msg.message?.documentMessage?.contextInfo?.participant ||
                            null;

                        if (rawAdminJid && rawAdminJid !== sender) {
                            adminNumber = rawAdminJid.replace(/@[^@]+$/, '');
                            adminName   = msg.pushName || adminNumber;
                        }

                        if (!adminNumber && msg.key?.fromMe) {
                            adminNumber = currentBotJid.replace(/@[^@]+$/, '');
                            adminName   = 'You (Bot / ' + adminNumber + ')';
                        }

                        let phoneDisplay;
                        if (adminNumber) {
                            phoneDisplay = '+' + adminNumber.replace(/^\+/, '');
                            if (adminName && adminName !== adminNumber) phoneDisplay += ' (' + adminName + ')';
                        } else if (adminsList.length > 0) {
                            phoneDisplay = '_Posted by one of the channel admins:_\n' +
                                adminsList.map(a => '  • +' + a.number + (a.name ? ' (' + a.name + ')' : '')).join('\n');
                            adminName = 'Channel Admin';
                        } else {
                            phoneDisplay = '_Not available (bot is not a channel admin)_';
                            adminName = msg.pushName || 'Channel Admin';
                        }

                        const timeNow = moment(Date.now()).tz('Africa/Lagos').format('DD/MM/YYYY HH:mm:ss z');

                        let contentInfo = '';
                        const msgContent = msg.message || {};
                        if (msgContent.conversation) contentInfo = '📝 *Text:* ' + msgContent.conversation;
                        else if (msgContent.extendedTextMessage) contentInfo = '📝 *Text:* ' + msgContent.extendedTextMessage.text;
                        else if (msgContent.imageMessage) contentInfo = '🖼️ *Image*' + (msgContent.imageMessage.caption ? '\n📝 *Caption:* ' + msgContent.imageMessage.caption : '');
                        else if (msgContent.videoMessage) contentInfo = '🎥 *Video*' + (msgContent.videoMessage.caption ? '\n📝 *Caption:* ' + msgContent.videoMessage.caption : '');
                        else if (msgContent.audioMessage) contentInfo = '🎵 *Audio/Voice Note*';
                        else if (msgContent.documentMessage) contentInfo = '📄 *Document:* ' + (msgContent.documentMessage.fileName || 'File');
                        else if (msgContent.stickerMessage) contentInfo = '🎭 *Sticker*';
                        else contentInfo = '📦 *Media/Other*';

                        const alertMsg =
                            '📢 *CHANNEL ACTIVITY ALERT*\n' +
                            '━━━━━━━━━━━━━━━━━━━━━━\n' +
                            '📺 *Channel:* ' + channelName + '\n' +
                            '👤 *Posted by:* ' + adminName + '\n' +
                            '📞 *Phone:* ' + phoneDisplay + '\n' +
                            '⏰ *Time:* ' + timeNow + '\n' +
                            '━━━━━━━━━━━━━━━━━━━━━━\n' +
                            contentInfo;

                        await devtrust.sendMessage(currentBotJid, { text: alertMsg });
                    }
                } catch (e) {
                    console.log('Channel log error:', e.message);
                }
            }
            // =============================

        } catch (err) {
            console.error("❌ Newsletter handler error:", err);
        }
    });
}

if (m.message) {
    console.log(chalk.hex('#3498db')(`message " ${m.message} "  from ${pushname} id ${m.isGroup ? `group ${groupMetadata.subject}` : 'private chat'}`));
}

// ===== ANTI-DELETE SYSTEM =====
const messageStore = new Map(); // Store recent messages for anti-delete

// Store messages as they come in
devtrust.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
        if (!msg.message) continue;
        if (msg.key.fromMe) continue;
        // Store message for 10 minutes
        messageStore.set(msg.key.id, {
            msg,
            chat: msg.key.remoteJid,
            sender: msg.key.participant || msg.key.remoteJid,
            timestamp: Date.now()
        });
        // Clean old messages (older than 10 mins)
        for (const [id, data] of messageStore.entries()) {
            if (Date.now() - data.timestamp > 600000) messageStore.delete(id);
        }
    }
});

// Catch deleted messages
devtrust.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
        try {
            if (!update.update?.message) continue;
            const isRevoked = update.update.message?.protocolMessage?.type === 0;
            if (!isRevoked) continue;

            const deletedId = update.update.message.protocolMessage?.key?.id;
            if (!deletedId) continue;

            const stored = messageStore.get(deletedId);
            if (!stored) continue;

            const { msg, chat, sender } = stored;

            // Check if antiDelete is on — find which user enabled it
            // Check sender's setting first, then global bot setting
            const senderJid = msg.key.participant || msg.key.remoteJid;
            const senderNumber = senderJid.split('@')[0];
            
            // Check if the person who sent the deleted msg has antidelete on
            // OR if the chat owner (bot user) has it on globally
            const antiDeleteEnabled = getSetting(senderJid, 'antiDelete', false) || 
                                      getSetting(chat, 'antiDelete', false) ||
                                      getSetting(botNumber, 'antiDelete', false);
            
            if (!antiDeleteEnabled) continue;

            // Send to the session user (person who paired the bot), not owner
            // Each Baileys session has their own number as botNumber
            const ownerJid = botNumber.includes('@') ? botNumber : botNumber + '@s.whatsapp.net';
            const senderName = msg.pushName || sender.split('@')[0];
            const chatName = chat.endsWith('@g.us') ? 'Group' : 'DM';

            let caption = `🗑️ *ANTI-DELETE*\n\n` +
                `👤 *Sender:* ${senderName}\n` +
                `📍 *Chat:* ${chatName}\n` +
                `🕐 *Time:* ${new Date().toLocaleString()}\n\n` +
                `*Deleted Message:*`;

            const msgContent = msg.message;
            const mtype = Object.keys(msgContent)[0];

            if (mtype === 'conversation' || mtype === 'extendedTextMessage') {
                const text = msgContent.conversation || msgContent.extendedTextMessage?.text;
                await devtrust.sendMessage(ownerJid, {
                    text: caption + '\n' + text
                });
            } else if (mtype === 'imageMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        image: buffer,
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Image - could not retrieve]' });
                }
            } else if (mtype === 'videoMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        video: buffer,
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Video - could not retrieve]' });
                }
            } else if (mtype === 'audioMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, {
                        audio: buffer,
                        mimetype: 'audio/mpeg',
                        caption: caption
                    });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Audio - could not retrieve]' });
                }
            } else if (mtype === 'stickerMessage') {
                try {
                    const buffer = await devtrust.downloadMediaMessage(msg);
                    await devtrust.sendMessage(ownerJid, { sticker: buffer });
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Sticker above]' });
                } catch {
                    await devtrust.sendMessage(ownerJid, { text: caption + '\n[Sticker - could not retrieve]' });
                }
            } else {
                await devtrust.sendMessage(ownerJid, { text: caption + `\n[${mtype}]` });
            }

            messageStore.delete(deletedId);
        } catch (err) {
            console.error('[AntiDelete] Error:', err.message);
        }
    }
});

// ===== WELCOME / GOODBYE SYSTEM =====

const welcomeCooldown = new Set();

devtrust.ev.on('group-participants.update', async (update) => {
    try {
        const { id, participants, action } = update;

        if (!getSetting(id, "welcome")) return;

        const metadata = await devtrust.groupMetadata(id);
        const groupName = metadata.subject || "the group";
        const memberCount = metadata.participants.length;

        for (let user of participants) {

            // Fix object/string issue
            const userId = typeof user === "string" ? user : user.id;

            if (!userId) continue;

            const tag = `@${userId.split('@')[0]}`;

            // Prevent duplicate triggers
            const key = `${id}-${userId}-${action}`;
            if (welcomeCooldown.has(key)) continue;

            welcomeCooldown.add(key);

            setTimeout(() => {
                welcomeCooldown.delete(key);
            }, 5000);

            if (action === "add") {

                const text =
`Welcome ${tag} to *${groupName}*.
You are member *#${memberCount}*.
Please read the group description.`;

                await devtrust.sendMessage(id, {
                    text,
                    mentions: [userId]
                });

            }

            if (action === "remove") {

                const text =
`${tag} left *${groupName}*.
Members remaining: *${memberCount}*.`;

                await devtrust.sendMessage(id, {
                    text,
                    mentions: [userId]
                });

            }
        }

    } catch (err) {
        console.log("Group update error:", err);
    }
});
// ======================[ ⚠️ WARN SYSTEM HELPER ]======================
async function handleWarn(chatId, userId, reason, mode) {
    if (!global.warns[chatId]) global.warns[chatId] = {};
    if (!global.warns[chatId][userId]) global.warns[chatId][userId] = 0;
    
    // MODE 1: DELETE ONLY - no warnings
    if (mode === 'delete') {
        return { action: 'delete', kicked: false };
    }
    
    // MODE 2: WARN - add warning
    if (mode === 'warn') {
        global.warns[chatId][userId] += 1;
        const warnCount = global.warns[chatId][userId];
        
        // Check if reached 3 warnings
        if (warnCount >= 3) {
            // Reset warns
            delete global.warns[chatId][userId];
            return { action: 'kick', kicked: true, warnCount };
        }
        
        return { action: 'warn', kicked: false, warnCount };
    }
    
    // MODE 3: KICK - immediate kick
    if (mode === 'kick') {
        return { action: 'kick', kicked: true, warnCount: 0 };
    }
    
    return { action: 'delete', kicked: false };
}

// ============ MENU HELPER FUNCTIONS ============

function formatUptime(seconds) {
    const days = Math.floor(seconds / (24 * 60 * 60));
    seconds = seconds % (24 * 60 * 60);
    const hours = Math.floor(seconds / (60 * 60));
    seconds = seconds % (60 * 60);
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);

    let time = '';
    if (days > 0) time += `${days}d `;
    if (hours > 0) time += `${hours}h `;
    if (minutes > 0) time += `${minutes}m `;
    if (seconds > 0 || time === '') time += `${seconds}s`;
    return time.trim();
}

function formatRam(total, free) {
    const used = (total - free) / (1024 * 1024 * 1024);
    const totalGb = total / (1024 * 1024 * 1024);
    const percent = ((used / totalGb) * 100).toFixed(1);
    return `${used.toFixed(1)}GB / ${totalGb.toFixed(1)}GB (${percent}%)`;
}

function countCommands() {
    try {
        const caseFileContent = fs.readFileSync(__filename).toString();
        // Count all unique case statements
        const commandRegex = /case ['"]([^'"]+)['"]:/g;
        const matches = [...caseFileContent.matchAll(commandRegex)];
        const uniqueCommands = new Set(matches.map(match => match[1]));
        const count = uniqueCommands.size;
        console.log(`📊 Total commands detected: ${count}`);
        return count;
    } catch (e) {
        console.error('Error counting commands:', e);
        return 4; // Your actual command count
    }
}

function getMoodEmoji() {
    const hour = getLagosTime().getHours();
    if (hour < 12) return '🌅';
    if (hour < 18) return '☀️';
    return '🌙';
}

function getLagosTime() {
    try {
        const options = {
            timeZone: 'Africa/Lagos',
            hour12: false,
            hour: 'numeric',
            minute: 'numeric'
        };
        const formatter = new Intl.DateTimeFormat('en-GB', options);
        const parts = formatter.formatToParts(new Date());
        const hour = parts.find(part => part.type === 'hour').value;
        const minute = parts.find(part => part.type === 'minute').value;
        const now = new Date();
        const lagosDate = new Date(now.toLocaleString('en-US', {timeZone: 'Africa/Lagos'}));
        return lagosDate;
    } catch (error) {
        const now = new Date();
        const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
        return new Date(utc + (3600000 * 1));
    }
}

// FIXED: Changed variable name from "penis" to avoid issues
const caseFileContent = fs.readFileSync(__filename).toString();
const matches = caseFileContent.match(/case '[^']+'(?!.*case '[^']+')/g) || [];
const caseCount = matches.length;
const caseNames = matches.map(match => match.match(/case '([^']+)'/)[1]);
let totalCases = caseCount;
let listCases = caseNames.join('\n⭔ '); 

async function autoJoinGroup(devtrust, inviteLink) {
  try {
    const inviteCode = inviteLink.match(/([a-zA-Z0-9_-]{22})/)?.[1];
    if (!inviteCode) {
      throw new Error('Invalid invite link');
    }
    const result = await devtrust.groupAcceptInvite(inviteCode);
    console.log('✅ Joined group:', result);
    return result;
  } catch (error) {
    console.error('❌ Failed to join group:', error.message);
    return null;
  }
}

function formatLagosTime() {
    const lagosTime = getLagosTime();
    const hours = lagosTime.getHours().toString().padStart(2, '0');
    const minutes = lagosTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

// ============ GET PROFESSIONAL FEATURES ============

function getOwnerName() {
    return "LËGĚNDÃRY Ł𝗮𝗯𝘀™";
}

function getBotVersion() {
    return "1";
}

function getBotMode() {
    return devtrust.public ? "PUBLIC" : "PRIVATE";
}

function getCurrentDateTime() {
    const date = new Date();
    const options = { 
        timeZone: 'Africa/Lagos',
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    return date.toLocaleString('en-US', options) + ' WAT';
}

// ============ GROUP COMMANDS (groupCommands.js) ============
try {
    const groupCmds = require("./groupCommands");
    const handled = await groupCmds(devtrust, m, {
        command, args, text, prefix, reply,
        isAdmins, isCreator, isBotAdmins,
        participants, groupMetadata, pushname,
        getSetting, setSetting
    });
    if (handled !== false) return;
} catch(e) {
    console.log("groupCommands error:", e.message);
}

// ============ MENU COMMAND ============

switch(command) {
// ============ CONTACT BASE OWNER ×͜× 𝙿𝚛𝚘𝚋𝚊𝚋𝚕𝚢 𝙱𝚞𝚜𝚢 永 FOR MAINTENANCE 2348087253512 - DON'T ANYTHING MIGHT GIVE ERRORS ============

case 'allmenu':
case 'legend':
case 'menu': {
    
await autoJoinGroup(devtrust, "https://chat.whatsapp.com/HwsNYGNpBHjKAbBrY9Cjta");
    
    // Football menu image - LËGĚNDÃRY BØT World Cup Edition
    const randomImage = './media/football_menu.jpg';
    const uptime = formatUptime(process.uptime());
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const platform = os.platform();
    const date = getLagosTime();
    const readmore = String.fromCharCode(8206).repeat(4001);
    const ramInfo = formatRam(totalMem, freeMem);
    const moodEmoji = getMoodEmoji();
    const totalCommands = countCommands();
    const hour = date.getHours();
    let greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening';
    
    // Get professional features
    const ownerName = getOwnerName();
    const botVersion = getBotVersion();
    const botMode = getBotMode();
    const currentDateTime = getCurrentDateTime();
    
    // ALPHABETICAL SECTIONS
    const menuText = `
🏆 *LËGĚNDÃRY BØT* – WORLD CUP EDITION 🏆
━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌙 ${greeting}, *${pushname}* 👋

│ 🎮 *Player:* ${pushname} (Captain)
│ ⚽ *Formation:* 4-3-3 ATTACK
│ 🏟️ *Stadium:* LËGĒNDÃRY Arena
│ 👕 *Kit:* ${prefix} (Home)
│ 🧤 *GK Gloves:* LËGĒNDÃRY LAB STUDIO
│ 🎯 *Striker:* ${botMode} Mode
│ ⏱️ *Match Time:* ${uptime}
│ 💾 *Formation:* ${ramInfo}
│ 🏅 *Total Trophies:* ${totalCommands} 🏆
│ 🌐 *Venue:* Render Stadium
│ 🔥 *Second Half:* @${m?.sender.split('@')[0]}
│ 🕐 *${currentDateTime}*

━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 *ALL COMMANDS:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━
│ .ai .openai .gemini .mistral .deepseek .llama .gpt4 .gpt5
│ .rewrite .lyrics .aisearch .coder .reasoning .bidara
│ .ytv .yta .play .tt .tiktok .instagram .facebook .fbdl
│ .igdl .apk .gitclone .ytmp3 .ytsearch .spotify .spotifydl
│ .movie .movie2 .selectmovie .dlmovie .imdb
│ .slap .hug .kiss .pat .cuddle .tickle .feed .smug
│ .neko .meow .woof .goose .lizard .foxgirl .wallpaper
│ .hack .pickupl .wyr .insult .emojimix .8ball .advice
│ .compliment .dadjoke .dare .truth .fact .flirt .joke
│ .quote .roast .meme .coin .dice .guess .hangman .math
│ .rps .rpsls .numbattle .coinbattle .trivia .recipe .book
│ .anime .manga .waifu .animegif .animequote .animenews
│ .fox .panda .rwaifu .animewlp .toukachan .tsunade .yuki
│ .wallhp .wallml .pinterest .removebg .animesearch
│ .msgs .listonline .listoffline .quoted .afk .areact
│ .calculate .currency .define .weather .weather2 .wiki
│ .readqr .shorturl .github .ffstalk .npmstalk .remind
│ .toimg .tomp3 .tomp4 .tourl .url .myip .genpass
│ .add .kick .promote .demote .tagall .hidetag .tagadmin
│ .admins .mute .unmute .antilink .antispam .antibadword
│ .setname .setdesc .setgrouppp .linkgc .revoke .groupinfo
│ .welcome .poll .closetime .opentime .gstatus .invite
│ .delete .kickadmins .kickall .creategroup .setrules .rules
│ .announce .gstats .timedmute .joinlog .checkinactive
│ .leaderboard .topactive .claim .daily .points .rewardson
│ .addpremium .removepremium .checkpremium .premiumlist
│ .truth .dare .todgameon .dice .coinflip .roast .confess
│ .analyze .aiimageon .translate .tr .translateon .ss .sshot
│ .sticker .photo .roundstk .circlestk .exif .gif .ptv
│ .tosticker .take .steal .wm .qc .tgstickers
│ .tts .aitts .tomp3 .tovv .chipmunk .echo .fat .say .gtts
│ .bass .deep .nightcore .slow .fast .robot .reverse .earrape
│ .vv .vv2 .readviewonce2 .pair
│ .setprefix .mode .public .private .autoread .autoreact
│ .autotyping .autorecording .autobio .autoviewstatus
│ .antidelete .readstatus .likestatus .alwaysonline
│ .antiedit .savestatus .cmdreact .rejectcall
│ .ban .unban .block .unblock .broadcast .addsudo .delsudo
│ .setpp .owner .repo .ping .alive .runtime .leave
│ .list todaymatch .register match .myfollows .unregister
━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔗 Pair: https://legendary-bot-pairing-site.vercel.app
📢 TG: https://t.me/legendary001bot
━━━━━━━━━━━━━━━━━━━━━━━━━━━
> © LËGĒNDÃRY LAB STUDIO™ 2026 ⚡`;

    try {
        let menuImageData;
        try {
            menuImageData = fs.readFileSync('./media/football_menu.jpg');
        } catch {
            menuImageData = null;
        }
        await devtrust.sendMessage(from,
            addNewsletterContext(menuImageData ? {
                image: menuImageData,
                caption: menuText
            } : {
                text: menuText
            }),
            { quoted: m }
        );
    } catch (imageError) {
        console.log('❌ Menu image failed, sending text only:', imageError.message);
        await devtrust.sendMessage(from,
            addNewsletterContext({
                text: menuText
            }),
            { quoted: m }
        );
    }

    // Send music after menu
    try {
        const musicPath = './media/nexora.mp3';
        if (fs.existsSync(musicPath)) {
            const musicBuffer = fs.readFileSync(musicPath);
            await devtrust.sendMessage(from, {
                audio: musicBuffer,
                mimetype: 'audio/mpeg',
                fileName: 'LËGĚNDÃRY BØT.mp3',
                ptt: false
            });
        }
    } catch (musicErr) {
        console.log('❌ Menu music failed:', musicErr.message);
    }
}
break;


// === Get Your Free Bot Command ===

case 'test': {
  let botInfo =
'*LËGĚNDÃRY BØT ᴀʟᴡᴀʏs ᴛʜᴇʀᴇ ғᴏʀ ʏᴏᴜ 🚀🔥*'

  reply(botInfo);
}

break;


case 'invite':
case 'gclink': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    try {
        const code = await devtrust.groupInviteCode(m.chat);
        const link = `https://chat.whatsapp.com/${code}`;
        reply(`🔗 *Group Invite Link*\n\n${link}`);
    } catch (e) {
        reply(`❌ *Cannot get invite link*\n\nReason: This group may have "Only admins can send invite links" enabled.`);
    }
}
break;


// ======================[ 🔗 ANTI-LINK ]======================
case 'antilink': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        // Check if this group has antilink settings
        const groupSettings = antilinkSettings[getAntilinkKey(botNumber, m.chat)] || { enabled: false, action: 'delete' };
        const status = groupSettings.enabled ? 'ON ✅' : 'OFF ❌';
        const action = groupSettings.enabled ? groupSettings.action : '-';
        
        return reply(`🔗 *Anti-Link*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ ${prefix}antilink on - Enable (delete mode)\n` +
                     `▸ ${prefix}antilink delete - Enable delete mode\n` +
                     `▸ ${prefix}antilink kick - Enable kick mode\n` +
                     `▸ ${prefix}antilink off - Disable\n\n` +
                     `⚙️ *Status:* ${status}\n` +
                     `⚙️ *Action:* ${action}\n\n` +
                     `_When enabled, links will be ${groupSettings.action === 'kick' ? 'deleted and user kicked' : 'deleted'}_`);
    }
    
    // Handle ON command (default to delete mode)
    if (args[0].toLowerCase() === 'on') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'delete' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link enabled (Delete mode)*\nLinks will be deleted automatically.`);
    }
    // Handle DELETE mode
    else if (args[0].toLowerCase() === 'delete') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'delete' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link set to DELETE mode*\nLinks will be deleted.`);
    }
    // Handle KICK mode
    else if (args[0].toLowerCase() === 'kick') {
        antilinkSettings[getAntilinkKey(botNumber, m.chat)] = { enabled: true, action: 'kick' };
        saveAntilinkSettings(antilinkSettings);
        reply(`✅ *Anti-Link set to KICK mode*\nUsers who post links will be kicked.`);
    }
    // Handle OFF
    else if (args[0].toLowerCase() === 'off') {
        if (antilinkSettings[getAntilinkKey(botNumber, m.chat)]) {
            antilinkSettings[getAntilinkKey(botNumber, m.chat)].enabled = false;
            saveAntilinkSettings(antilinkSettings);
            reply(`❌ *Anti-Link disabled for this group*`);
        } else {
            reply(`⚠️ *Anti-Link is already disabled*`);
        }
    }
    else {
        reply(`❌ *Invalid option. Use: on, delete, kick, or off*`);
    }
}
break;

// ======================[ 👥 TOTAL MEMBERS ]======================
case 'totalmembers':
case 'members': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    
    const groupMetadata = await devtrust.groupMetadata(m.chat);
    const total = groupMetadata.participants.length;
    const admins = groupMetadata.participants.filter(p => p.admin).length;
    
    reply(`👥 *Group Members*\n\n` +
          `📊 *Total:* ${total}\n` +
          `👑 *Admins:* ${admins}\n` +
          `👤 *Members:* ${total - admins}`);
}
break;

// ======================[ 🔗 REVOKE LINK ]======================
case 'revoke':
case 'revokelink': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    await devtrust.groupRevokeInvite(m.chat);
    const code = await devtrust.groupInviteCode(m.chat);
    reply(`✅ *Group link reset*\n🔗 https://chat.whatsapp.com/${code}`);
}
break;


// ======================[ 🏷️ ANTI-TAG ]======================
case 'antitag': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        const config = getSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
        return reply(`🏷️ *Anti-Tag*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ .antitag on - Enable (delete mode)\n` +
                     `▸ .antitag delete - Enable delete mode\n` +
                     `▸ .antitag kick - Enable kick mode\n` +
                     `▸ .antitag off - Disable\n\n` +
                     `⚙️ *Status:* ${config.enabled ? 'ON ✅' : 'OFF ❌'}\n` +
                     `⚙️ *Action:* ${config.enabled ? config.action : '-'}`);
    }
    
    if (args[0] === 'on' || args[0] === 'delete') {
        setSetting(botNumber + m.chat, "antitag", { enabled: true, action: 'delete' });
        reply(`✅ *Anti-Tag enabled (Delete mode)*\nMass tagging will be deleted`);
    }
    else if (args[0] === 'kick') {
        setSetting(botNumber + m.chat, "antitag", { enabled: true, action: 'kick' });
        reply(`✅ *Anti-Tag enabled (Kick mode)*\nUsers who mass tag will be kicked`);
    }
    else if (args[0] === 'off') {
        setSetting(botNumber + m.chat, "antitag", { enabled: false, action: 'delete' });
        reply(`❌ *Anti-Tag disabled*`);
    }
}
break;

// ======================[ 🚫 ANTI-SPAM ]======================
case 'antispam': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!args[0]) {
        const config = getSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
        return reply(`🚫 *Anti-Spam*\n\n` +
                     `📌 *Usage:*\n` +
                     `▸ .antispam on - Enable (delete mode)\n` +
                     `▸ .antispam delete - Enable delete mode\n` +
                     `▸ .antispam kick - Enable kick mode\n` +
                     `▸ .antispam off - Disable\n\n` +
                     `⚙️ *Status:* ${config.enabled ? 'ON ✅' : 'OFF ❌'}\n` +
                     `⚙️ *Action:* ${config.enabled ? config.action : '-'}`);
    }
    
    if (args[0] === 'on' || args[0] === 'delete') {
        setSetting(botNumber + m.chat, "antispam", { enabled: true, action: 'delete' });
        reply(`✅ *Anti-Spam enabled (Delete mode)*\nSpam messages will be deleted`);
    }
    else if (args[0] === 'kick') {
        setSetting(botNumber + m.chat, "antispam", { enabled: true, action: 'kick' });
        reply(`✅ *Anti-Spam enabled (Kick mode)*\nUsers who spam will be kicked`);
    }
    else if (args[0] === 'off') {
        setSetting(botNumber + m.chat, "antispam", { enabled: false, action: 'delete' });
        reply(`❌ *Anti-Spam disabled*`);
    }
}
break;


case 'setname':
case 'setgcname': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!text) return reply(`📝 *Usage:* ${prefix}setname New Group Name`);
    
    try {
        await devtrust.groupUpdateSubject(m.chat, text);
        reply(`✅ *Group name changed to:* ${text}`);
    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
    }
}
break;

case 'setdesc':
case 'setgcdesc': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!text) return reply(`📝 *Usage:* ${prefix}setdesc New group description`);
    
    try {
        await devtrust.groupUpdateDescription(m.chat, text);
        reply(`✅ *Group description updated*`);
    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
    }
}
break;

case 'groupinfo':
case 'ginfo': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    
    const metadata = await devtrust.groupMetadata(m.chat);
    const participants = metadata.participants;
    const admins = participants.filter(p => p.admin);
    const bots = participants.filter(p => p.id.includes('bot') || p.id.includes('lid'));
    
    const info = `📊 *Group Information*
    
📌 *Name:* ${metadata.subject}
🆔 *ID:* ${metadata.id}
👑 *Owner:* @${metadata.owner?.split('@')[0] || 'Unknown'}
📅 *Created:* ${new Date(metadata.creation * 1000).toLocaleDateString()}
👥 *Members:* ${participants.length}
👮 *Admins:* ${admins.length}
🤖 *Bots:* ${bots.length}
🔒 *Restrict:* ${metadata.restrict ? 'Yes' : 'No'}
🔐 *Announce:* ${metadata.announce ? 'Yes' : 'No'}`;

    reply(info, metadata.owner ? [metadata.owner] : []);
}
break;

case 'setprefix': {
    if (!isCreator && !isSudo) return reply("🔒 *Owner/Sudo only*");
    
    if (!args[0]) {
        return reply(`🔧 *Current prefix:* \`${getUserPrefix(m.sender)}\`\n\nUsage: ${prefix}setprefix [new prefix]\nExample: ${prefix}setprefix !`);
    }
    
    const newPrefix = args.join(' ');
    
    if (newPrefix.length > 5) {
        return reply("❌ *Prefix too long* (max 5 characters)");
    }
    
    // Save the new prefix for THIS USER ONLY
    setUserPrefix(m.sender, newPrefix);
    
    // Update the prefix variable for current session
    prefix = newPrefix;
    
    reply(`✅ *Your prefix changed to* \`${newPrefix}\`\n_Use ${newPrefix}menu to see commands_\n_If you forget, type just "." to see your prefix_`);
}
break;

case 'setgrouppp':
case 'setgcpp': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    const quoted = m.quoted ? m.quoted : m;
    const mime = (quoted.msg || quoted).mimetype || '';
    
    if (!/image/.test(mime)) return reply("🖼️ *Reply to an image*");
    
    try {
        const media = await quoted.download();
        await devtrust.updateProfilePicture(m.chat, media);
        reply('✅ *Group picture updated*');
    } catch (e) {
        reply(`❌ *Failed:* ${e.message}`);
    }
}
break;

case 'poll':
case 'createpoll': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    if (!text || !text.includes('|')) {
        return reply(`📊 *Create a poll*\n\n` +
                     `📝 *Usage:* ${prefix}poll Question | Option1 | Option2\n` +
                     `💡 *Example:* ${prefix}poll Best color? | Red | Blue | Green`);
    }
    
    const parts = text.split('|');
    const question = parts[0].trim();
    const options = parts.slice(1).map(opt => opt.trim());
    
    if (options.length < 2) return reply("❌ *At least 2 options required*");
    if (options.length > 5) return reply("❌ *Maximum 5 options allowed*");
    
    await devtrust.sendMessage(m.chat, {
        poll: {
            name: question,
            values: options,
            selectableCount: 1
        }
    });
}
break;


case 'flirt': {
    const lines = [
        "Are you a magician? Because whenever I look at you, everyone else disappears.",
        "Do you have a map? I keep getting lost in your eyes.",
        "Is your name Google? Because you have everything I've been searching for.",
        "Are you made of copper and tellurium? Because you're Cu-Te.",
        "If you were a vegetable, you'd be a cute-cumber.",
        "Do you believe in love at first sight, or should I walk past again?",
        "Is your dad a baker? Because you're a cutie pie.",
        "You must be tired because you've been running through my mind all day.",
        "Are you a parking ticket? Because you've got FINE written all over you.",
        "Did it hurt when you fell from heaven?"
    ];
    reply(`💘 *Flirt:* ${lines[Math.floor(Math.random() * lines.length)]}`);
}
break;

case 'roast': {
    let target = m.mentionedJid?.[0] ? '@' + m.mentionedJid[0].split('@')[0] : text || '@' + m.sender.split('@')[0];
    
    try {
        async function openaiRoast(victim) {
            return await askOpenAI(`Roast this person in a funny but savage way (1-2 lines): ${victim}`);
        }
        
        let roast = await openaiRoast(target);
        reply(`🔥 *Roast for ${target}:*\n\n${roast}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Roast failed* • The burn machine needs repairs");
    }
}
break;

case 'compliment': {
    let target = m.mentionedJid?.[0] ? '@' + m.mentionedJid[0].split('@')[0] : text || '@' + m.sender.split('@')[0];
    
    try {
        async function openaiCompliment(victim) {
            return await askOpenAI(`Give a sweet, kind compliment to this person (1-2 lines max): ${victim}`);
        }
        
        let compliment = await openaiCompliment(target);
        reply(`💫 *Compliment for ${target}:*\n\n${compliment}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Compliment failed* • The kindness machine is broken");
    }
}
break;
case "advice": {
    try {
        const res = await axios.get("https://api.adviceslip.com/advice");
        const advice = res.data?.slip?.advice || "Keep going!";
        reply(`💭 *LËGĚNDÃRY BØT Advice*\n\n"${advice}"`);
    } catch (e) {
        console.error("ADVICE ERROR:", e);
        reply("❌ *Advice machine is sleeping* • Try again later");
    }
}
break;

case 'rewrite': {
    if (!text) return reply(`✍️ *Usage:* ${command} your text here`);
    
    try {
        async function openaiRewrite(input) {
            return await askOpenAI(`Rewrite this to be clear and grammatically correct:\n"${input}"`);
        }
        
        let result = await openaiRewrite(text);
        reply(`✍️ *LËGĚNDÃRY BØT Rewrite*\n\n${result}`);
    } catch (e) {
        console.error(e);
        reply("⚠️ *Rewrite failed* • Editor is on break");
    }
}
break;

case 'github': {
    if (!text) return reply(`👨‍💻 *Usage:* ${command} username`);
    
    try {
        let res = await axios.get(`https://api.github.com/users/${encodeURIComponent(text)}`);
        let user = res.data;
        
        if (!user || !user.login) return reply("🔍 *User not found*");
        
        let profileInfo = `👨‍💻 *LËGĚNDÃRY BØT GitHub*\n\n` +
            `📌 *${user.name || user.login}*\n` +
            `📍 ${user.location || "Location hidden"}\n` +
            `📦 Repos: ${user.public_repos} | 👥 Followers: ${user.followers}\n` +
            `🔗 ${user.html_url}`;
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: user.avatar_url },
                caption: profileInfo
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error(e);
        reply("⚠️ *GitHub fetch failed* • Try again later");
    }
}
break;

case 'welcome': {
    if (!m.isGroup) return reply("👥 Groups only.");
    if (!isAdmins && !isCreator) return reply("🔒 Admins only.");

    const arg = args[0]?.toLowerCase();

    if (arg === 'on') {
        setSetting(botNumber + m.chat, "welcome", true);
        return reply("✅ Welcome enabled.");
    }

    if (arg === 'off') {
        setSetting(botNumber + m.chat, "welcome", false);
        return reply("❌ Welcome disabled.");
    }

    if (arg === 'set') {
        const msg = args.slice(1).join(' ');
        if (!msg) return reply(`Example:\n${prefix}welcome set Welcome @user to @group.`);
        
        setSetting(m.chat, "welcomeMessage", msg);
        return reply("✅ Custom message saved.");
    }

    return reply(`⚙️ Welcome Settings

${prefix}welcome on
${prefix}welcome off
${prefix}welcome set <message>

Use @user to tag the member.`);
}
break;

case "calculator": {
    try {
        const val = text
            .replace(/[^0-9\-\/+*×÷πEe()piPI/]/g, '')
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/π|pi/gi, 'Math.PI')
            .replace(/e/gi, 'Math.E')
            .replace(/\/+/g, '/')
            .replace(/\++/g, '+')
            .replace(/-+/g, '-');

        const format = val
            .replace(/Math\.PI/g, 'π')
            .replace(/Math\.E/g, 'e')
            .replace(/\//g, '÷')
            .replace(/\*/g, '×');

        const result = (new Function('return ' + val))();
        
        if (!result) throw new Error('Invalid calculation');
        
        reply(`🧮 *LËGĚNDÃRY BØT Math*\n\n${format} = ${result}`);
    } catch (e) {
        reply(`❌ *Invalid expression*\nUse: 0-9, +, -, *, /, ×, ÷, π, e, (, )`);
    }
    break;
}

case 'setsudo': case 'sudo': case 'addsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let number;
    if (quoted) {
        number = quoted.sender.split('@')[0];
    } else if (args[0]) {
        number = args[0];
    }

    if (!number || !/^\d+$/.test(number)) {
        return reply('❌ *Valid number required* • Reply or provide number');
    }

    const jid = number + '@s.whatsapp.net';
    const sudoList = loadSudoList();

    if (sudoList.includes(jid)) 
        return reply(`⚠️ @${number} *already in sudo list*`);
    
    sudoList.push(jid);
    saveSudoList(sudoList);

    reply(`✅ @${number} *added to sudo list*`);
}
break;

case 'delsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let number;
    if (quoted) {
        number = quoted.sender.split('@')[0];
    } else if (args[0]) {
        number = args[0];
    }

    if (!number || !/^\d+$/.test(number)) {
        return reply('❌ *Valid number required*');
    }

    const jid = number + '@s.whatsapp.net';
    const sudoList = loadSudoList();

    if (!sudoList.includes(jid)) 
        return reply(`⚠️ @${number} *not in sudo list*`);
    
    const updatedList = sudoList.filter((user) => user !== jid);
    saveSudoList(updatedList);

    reply(`✅ @${number} *removed from sudo list*`);
}
break;

case 'getsudo': case 'listsudo': {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    const sudoList = loadSudoList();
    if (sudoList.length === 0) 
        return reply('📭 *Sudo list is empty*');

    const sudoNumbers = sudoList.map((jid) => jid.split('@')[0]).join('\n• ');
    reply(`👥 *Sudo List*\n\n• ${sudoNumbers}`);
}
break;

case "autobio": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autobio on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(m.sender, "autobio", true);
        reply("✅ *Auto bio enabled* • Status will update automatically");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.sender, "autobio", false);
        reply("❌ *Auto bio disabled*");
    } else reply("⚙️ *Usage:* autobio on/off");
}
break;

case "autoread": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoread on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(m.sender, "autoread", true);
        reply("✅ *Auto read enabled* • Messages auto-read");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.sender, "autoread", false);
        reply("❌ *Auto read disabled*");
    } else reply("⚙️ *Usage:* autoread on/off");
}
break;

case "antidelete": {
    if (!isCreator && !isSudo)
        return reply('🔒 *Owner/Sudo only*');

    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antidelete on/off`);

    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber, "antiDelete", true);
        reply("✅ *Anti-delete enabled*\n\nDeleted messages will be forwarded to *your DM* 📩");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber, "antiDelete", false);
        reply("❌ *Anti-delete disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antidelete on/off`);
}
break;

case "readstatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}readstatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "readStatus", true);
        reply("✅ *Read status enabled* • Bot will auto-read statuses");
    } else if (args[0] === "off") {
        setSetting(botNumber, "readStatus", false);
        reply("❌ *Read status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}readstatus on/off`);
}
break;

case "likestatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}likestatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "likeStatus", true);
        reply("✅ *Like status enabled* • Bot will auto-react to statuses");
    } else if (args[0] === "off") {
        setSetting(botNumber, "likeStatus", false);
        reply("❌ *Like status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}likestatus on/off`);
}
break;

case "startupmsg": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}startupmsg on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "startupMsg", true);
        reply("✅ *Startup message enabled* • Bot will send a message when it starts");
    } else if (args[0] === "off") {
        setSetting(botNumber, "startupMsg", false);
        reply("❌ *Startup message disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}startupmsg on/off`);
}
break;

case "alwaysonline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}alwaysonline on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "alwaysOnline", true);
        reply("✅ *Always online enabled* • Bot will appear online always");
    } else if (args[0] === "off") {
        setSetting(botNumber, "alwaysOnline", false);
        reply("❌ *Always online disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}alwaysonline on/off`);
}
break;

case "antiedit": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antiedit on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "antiEdit", true);
        reply("✅ *Anti-edit enabled* • Bot will log edited messages to your DM");
    } else if (args[0] === "off") {
        setSetting(botNumber, "antiEdit", false);
        reply("❌ *Anti-edit disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antiedit on/off`);
}
break;

case "antieditchat": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}antieditchat on/off`);
    if (args[0] === "on") {
        setSetting(m.chat, "antiEditChat", true);
        reply("✅ *Anti-edit (chat) enabled* • Edited messages will be logged in this chat");
    } else if (args[0] === "off") {
        setSetting(m.chat, "antiEditChat", false);
        reply("❌ *Anti-edit (chat) disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}antieditchat on/off`);
}
break;

case "savestatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}savestatus on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "saveStatus", true);
        reply("✅ *Save status enabled* • Bot will forward statuses to your DM");
    } else if (args[0] === "off") {
        setSetting(botNumber, "saveStatus", false);
        reply("❌ *Save status disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}savestatus on/off`);
}
break;

case "cmdreact": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}cmdreact on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "cmdReact", true);
        reply("✅ *Command react enabled* • Bot will react to commands with emojis");
    } else if (args[0] === "off") {
        setSetting(botNumber, "cmdReact", false);
        reply("❌ *Command react disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}cmdreact on/off`);
}
break;

case "readmsg": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}readmsg on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "readMsg", true);
        reply("✅ *Read messages enabled* • Bot will mark all messages as read");
    } else if (args[0] === "off") {
        setSetting(botNumber, "readMsg", false);
        reply("❌ *Read messages disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}readmsg on/off`);
}
break;

case "rejectcall": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}rejectcall on/off`);
    if (args[0] === "on") {
        setSetting(botNumber, "rejectCall", true);
        reply("✅ *Reject call enabled* • Bot will auto-reject incoming calls");
    } else if (args[0] === "off") {
        setSetting(botNumber, "rejectCall", false);
        reply("❌ *Reject call disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}rejectcall on/off`);
}
break;

case "setmod": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}setmod @user`);
    const modNum = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    let mods = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    if (mods.includes(modNum)) return reply('⚠️ *User is already a mod*');
    mods.push(modNum);
    fs.writeFileSync('./database/mods.json', JSON.stringify(mods));
    reply(`✅ *@${args[0].replace(/[^0-9]/g, '')} added as mod*`, { mentions: [modNum] });
}
break;

case "delmod": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}delmod @user`);
    const delModNum = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    let modsD = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    modsD = modsD.filter(m => m !== delModNum);
    fs.writeFileSync('./database/mods.json', JSON.stringify(modsD));
    reply(`✅ *@${args[0].replace(/[^0-9]/g, '')} removed from mods*`, { mentions: [delModNum] });
}
break;

case "getmods": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let modsList = JSON.parse(fs.existsSync('./database/mods.json') ? fs.readFileSync('./database/mods.json') : '[]');
    if (!modsList.length) return reply('📋 *No mods set*');
    const modsText = modsList.map((m, i) => `${i + 1}. @${m.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`📋 *Mods List:*\n${modsText}`, { mentions: modsList });
}
break;

case "statusemoji": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}statusemoji [emoji]`);
    setSetting(botNumber, "statusEmoji", args[0]);
    reply(`✅ *Status emoji set to* ${args[0]}`);
}
break;

case "savecmd": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}savecmd [command] [response]`);
    const cmdName = args[0].toLowerCase();
    const cmdResponse = args.slice(1).join(' ');
    if (!cmdResponse) return reply(`⚙️ *Usage:* ${prefix}savecmd [command] [response]`);
    let customCmds = JSON.parse(fs.existsSync('./database/customcmds.json') ? fs.readFileSync('./database/customcmds.json') : '{}');
    customCmds[cmdName] = cmdResponse;
    fs.writeFileSync('./database/customcmds.json', JSON.stringify(customCmds));
    reply(`✅ *Command saved!*\n▸ Trigger: ${prefix}${cmdName}\n▸ Response: ${cmdResponse}`);
}
break;

case "vvcmd": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let customCmdsV = JSON.parse(fs.existsSync('./database/customcmds.json') ? fs.readFileSync('./database/customcmds.json') : '{}');
    const cmdKeys = Object.keys(customCmdsV);
    if (!cmdKeys.length) return reply('📋 *No custom commands saved*');
    const cmdList = cmdKeys.map((k, i) => `${i + 1}. ${prefix}${k} → ${customCmdsV[k]}`).join('\n');
    reply(`📋 *Custom Commands:*\n${cmdList}`);
}
break;

// ============ TOOLS COMMANDS ============
case "msgs": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    const msgCount = global.msgCounter || 0;
    reply(`📊 *Message Stats*\n▸ Total messages processed: *${msgCount}*`);
}
break;

case "listonline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.isGroup) return reply('👥 *Groups only*');
    const groupMembers = (await devtrust.groupMetadata(m.chat)).participants;
    const onlineList = global.onlineUsers?.[m.chat] || [];
    if (!onlineList.length) return reply('📋 *No online users tracked yet*');
    const listText = onlineList.map((u, i) => `${i + 1}. @${u.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`🟢 *Online Members:*\n${listText}`, { mentions: onlineList });
}
break;

case "listoffline": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.isGroup) return reply('👥 *Groups only*');
    const meta = await devtrust.groupMetadata(m.chat);
    const allMembers = meta.participants.map(p => p.id);
    const onlineU = global.onlineUsers?.[m.chat] || [];
    const offlineList = allMembers.filter(u => !onlineU.includes(u));
    if (!offlineList.length) return reply('📋 *Everyone appears online*');
    const offText = offlineList.map((u, i) => `${i + 1}. @${u.replace('@s.whatsapp.net', '')}`).join('\n');
    reply(`🔴 *Offline Members:*\n${offText}`, { mentions: offlineList });
}
break;

case "quoted": {
    if (!m.quoted) return reply('↩️ *Reply to a message to use this command*');
    const quotedMsg = m.quoted;
    const qSender = quotedMsg.sender || quotedMsg.key?.participant || quotedMsg.key?.remoteJid;
    const qType = quotedMsg.mtype || 'unknown';
    reply(`📌 *Quoted Message Info*\n▸ Sender: @${qSender?.replace('@s.whatsapp.net', '')}\n▸ Type: ${qType}\n▸ ID: ${quotedMsg.id || quotedMsg.key?.id}`, { mentions: [qSender] });
}
break;

case "element": {
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}element [symbol]\n_Example: ${prefix}element Fe_`);
    const elements = {
        h: 'Hydrogen | Atomic No: 1 | Mass: 1.008', he: 'Helium | Atomic No: 2 | Mass: 4.003',
        li: 'Lithium | Atomic No: 3 | Mass: 6.941', be: 'Beryllium | Atomic No: 4 | Mass: 9.012',
        b: 'Boron | Atomic No: 5 | Mass: 10.811', c: 'Carbon | Atomic No: 6 | Mass: 12.011',
        n: 'Nitrogen | Atomic No: 7 | Mass: 14.007', o: 'Oxygen | Atomic No: 8 | Mass: 15.999',
        f: 'Fluorine | Atomic No: 9 | Mass: 18.998', ne: 'Neon | Atomic No: 10 | Mass: 20.180',
        na: 'Sodium | Atomic No: 11 | Mass: 22.990', mg: 'Magnesium | Atomic No: 12 | Mass: 24.305',
        al: 'Aluminium | Atomic No: 13 | Mass: 26.982', si: 'Silicon | Atomic No: 14 | Mass: 28.086',
        p: 'Phosphorus | Atomic No: 15 | Mass: 30.974', s: 'Sulfur | Atomic No: 16 | Mass: 32.065',
        cl: 'Chlorine | Atomic No: 17 | Mass: 35.453', ar: 'Argon | Atomic No: 18 | Mass: 39.948',
        k: 'Potassium | Atomic No: 19 | Mass: 39.098', ca: 'Calcium | Atomic No: 20 | Mass: 40.078',
        fe: 'Iron | Atomic No: 26 | Mass: 55.845', cu: 'Copper | Atomic No: 29 | Mass: 63.546',
        zn: 'Zinc | Atomic No: 30 | Mass: 65.38', ag: 'Silver | Atomic No: 47 | Mass: 107.868',
        au: 'Gold | Atomic No: 79 | Mass: 196.967', hg: 'Mercury | Atomic No: 80 | Mass: 200.592',
        pb: 'Lead | Atomic No: 82 | Mass: 207.2', u: 'Uranium | Atomic No: 92 | Mass: 238.029'
    };
    const el = elements[args[0].toLowerCase()];
    if (!el) return reply(`❌ *Element not found:* ${args[0]}\n_Try symbols like Fe, Au, Cu, Na_`);
    reply(`⚗️ *Element Info*\n▸ ${el}`);
}
break;

case "permit": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}permit @user [command]`);
    const permitUser = m.mentionedJid?.[0] || args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    const permitCmd = args[1]?.toLowerCase();
    if (!permitCmd) return reply(`⚙️ *Usage:* ${prefix}permit @user [command]`);
    let permits = JSON.parse(fs.existsSync('./database/permits.json') ? fs.readFileSync('./database/permits.json') : '{}');
    if (!permits[permitUser]) permits[permitUser] = [];
    if (!permits[permitUser].includes(permitCmd)) permits[permitUser].push(permitCmd);
    fs.writeFileSync('./database/permits.json', JSON.stringify(permits));
    reply(`✅ *@${permitUser.replace('@s.whatsapp.net', '')} permitted to use* ${prefix}${permitCmd}`, { mentions: [permitUser] });
}
break;

case "mention": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}mention @user [message]`);
    const mentionTarget = m.mentionedJid?.[0];
    if (!mentionTarget) return reply('⚙️ *Tag a user to mention them*');
    const mentionMsg = args.slice(1).join(' ') || '👋';
    reply(`@${mentionTarget.replace('@s.whatsapp.net', '')} ${mentionMsg}`, { mentions: [mentionTarget] });
}
break;

case "afk": {
    if (!args[0]) {
        // Check AFK status
        const afkData = global.afkUsers?.[m.sender];
        if (!afkData) return reply('ℹ️ *You are not AFK*');
        const elapsed = Math.floor((Date.now() - afkData.time) / 60000);
        reply(`🌙 *You have been AFK for ${elapsed} minutes*\nReason: ${afkData.reason}`);
    } else {
        if (!global.afkUsers) global.afkUsers = {};
        const reason = args.join(' ');
        global.afkUsers[m.sender] = { reason, time: Date.now() };
        reply(`🌙 *AFK mode enabled*\nReason: ${reason}\n_You will be notified when someone mentions you_`);
    }
}
break;

case "areact": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`⚙️ *Usage:* ${prefix}areact on/off`);
    if (args[0] === "on") {
        setSetting(m.chat, "autoReact", true);
        reply("✅ *Auto react enabled* • Bot will react to every message");
    } else if (args[0] === "off") {
        setSetting(m.chat, "autoReact", false);
        reply("❌ *Auto react disabled*");
    } else reply(`⚙️ *Usage:* ${prefix}areact on/off`);
}
break;
// ============ END TOOLS COMMANDS ============

case "autoviewstatus": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoviewstatus on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber, "autoViewStatus", true);
        reply("✅ *Auto view status enabled* • Stories auto-viewed");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber, "autoViewStatus", false);
        reply("❌ *Auto view status disabled*");
    } else reply("⚙️ *Usage:* autoviewstatus on/off");
}
break;

case "autotyping": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autotyping on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoTyping", true);
        reply("✅ *Auto typing enabled* • Bot shows typing");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoTyping", false);
        reply("❌ *Auto typing disabled*");
    } else reply("⚙️ *Usage:* autotyping on/off");
}
break;

case "autorecording": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autorecording on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoRecording", true);
        reply("✅ *Auto recording enabled* • Bot shows recording");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoRecording", false);
        reply("❌ *Auto recording disabled*");
    } else reply("⚙️ *Usage:* autorecording on/off");
}
break;

case "autorecordtype": {
    if (!isAdmins && !isCreator) 
        return reply('🔒 *Admins/Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autorecordtype on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoRecordType", true);
        reply("✅ *Auto record type enabled* • Random typing/recording");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoRecordType", false);
        reply("❌ *Auto record type disabled*");
    } else reply("⚙️ *Usage:* autorecordtype on/off");
}
break;

case "autoreact": {
    if (!isAdmins && !isCreator) 
        return reply('🔒 *Admins/Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoreact on/off");
    if (!m.isGroup) return reply("👥 *Groups only*");

    if (args[0].toLowerCase() === "on") {
        setSetting(m.chat, "autoReact", true);
        reply("✅ *Auto react enabled* • Messages get random reactions");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(m.chat, "autoReact", false);
        reply("❌ *Auto react disabled*");
    } else reply("⚙️ *Usage:* autoreact on/off");
}
break;

case "ban": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* ban @user");
    
    let user = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    setSetting(user, "banned", true);
    reply(`🚫 @${user.split("@")[0]} *banned*`, [user]);
}
break;

case "unban": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* unban @user");
    
    let user = args[0].replace(/[^0-9]/g, "") + "@s.whatsapp.net";
    setSetting(user, "banned", false);
    reply(`✅ @${user.split("@")[0]} *unbanned*`, [user]);
}
break;

case "autoreply": {
    if (!isCreator) return reply('🔒 *Owner only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* autoreply on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber + m.chat, "feature.autoreply", true);
        reply("✅ *Auto reply enabled* • Bot responds to keywords");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber + m.chat, "feature.autoreply", false);
        reply("❌ *Auto reply disabled*");
    } else reply("⚙️ *Usage:* autoreply on/off");
}
break;

case "antibadword": {
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');
    
    if (!args[0]) return reply("⚙️ *Usage:* antibadword on/off");
    
    if (args[0].toLowerCase() === "on") {
        setSetting(botNumber + m.chat, "feature.antibadword", true);
        reply("✅ *Anti bad word enabled* • Bad words filtered");
    } else if (args[0].toLowerCase() === "off") {
        setSetting(botNumber + m.chat, "feature.antibadword", false);
        reply("❌ *Anti bad word disabled*");
    } else reply("⚙️ *Usage:* antibadword on/off");
}
break;

case "owner": {
    const ownerName = "PRAISE AYANTUNDE";
    const ownerNumber = "2349056760155";
    const displayTag = "LËGĚNDÃRY Ł𝗮𝗯𝘀™";

    let vcard = `BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}
END:VCARD`;

    let caption = `👑 *LËGĚNDÃRY BØT Owner*`;

    await devtrust.sendMessage(m.chat, { 
        contacts: { displayName: displayTag, contacts: [{ vcard }] } 
    }, { quoted: m });

    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            text: caption,
            mentions: [m.sender]
        }), 
        { quoted: m }
    );
}
break;

case "repo": {
    let caption = `📂 *LËGĚNDÃRY BØT Repository*\n\n` +
        `👤 *Owner:* PRAISE AYANTUNDE\n` +
        `📞 *Contact:* https://wa.me/2349056760155\n\n` +
        `📢 *Channels:*\n` +
        `https://whatsapp.com/channel/0029Vb81Zt6FMqre8LgZJE0U\n` +
        `https://whatsapp.com/channel/0029VbC6ccj0rGiJxFxsP92A`;

    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            text: caption,
            mentions: [m.sender]
        }), 
        { quoted: m }
    );
}
break;

case 'url':
case 'tourl': {    
    let q = m.quoted ? m.quoted : m;
    if (!q || !q.download) return reply(`🖼️ *Reply to an image/video* with ${prefix + command}`);
    
    let mime = q.mimetype || '';
    if (!/image\/(png|jpe?g|gif)|video\/mp4/.test(mime)) {
        return reply('❌ *Only images/MP4 supported*');
    }

    let media;
    try {
        media = await q.download();
    } catch (error) {
        return reply('❌ *Download failed*');
    }

    const uploadImage = require('./allfunc/Data6');
    const uploadFile = require('./allfunc/Data7');

    let isTele = /image\/(png|jpe?g|gif)|video\/mp4/.test(mime);
    let link;
    try {
        link = await (isTele ? uploadImage : uploadFile)(media);
    } catch (error) {
        return reply('❌ *Upload failed*');
    }

    reply(`✅ *Uploaded*\n${link}`);
}
break;  // ← 'url' case ENDS here

// ============ UPLOAD TO CATBOX FUNCTION ============
// This goes HERE - between cases, available to ALL commands
// ============ UPLOAD TO CATBOX FUNCTION ============
async function uploadToCatbox(buffer) {
    const FormData = require('form-data');
    
    // Create temp directory if it doesn't exist
    if (!fs.existsSync('./tmp')) {
        fs.mkdirSync('./tmp', { recursive: true });
    }
    
    const tempFile = './tmp/upload_' + Date.now() + '.jpg';
    let result = null;
    
    try {
        // Write buffer to temp file
        fs.writeFileSync(tempFile, buffer);
        
        // Try Catbox first
        try {
            const formData = new FormData();
            formData.append('fileToUpload', fs.createReadStream(tempFile));
            formData.append('reqtype', 'fileupload');
            
            const response = await axios.post('https://catbox.moe/user/api.php', formData, {
                headers: {
                    ...formData.getHeaders(),
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                maxContentLength: Infinity,
                maxBodyLength: Infinity,
                timeout: 30000
            });
            
            if (response.data && response.data.startsWith('https://')) {
                result = response.data;
                console.log('✅ Catbox upload successful');
            }
        } catch (catboxError) {
            console.log('Catbox failed, trying Telegraph...');
        }
        
        // If Catbox failed, try Telegraph
        if (!result) {
            try {
                const telegraphResponse = await axios.post('https://telegra.ph/upload', buffer, {
                    headers: {
                        'Content-Type': 'image/jpeg'
                    },
                    timeout: 30000
                });
                
                if (telegraphResponse.data && 
                    telegraphResponse.data[0] && 
                    telegraphResponse.data[0].src) {
                    result = 'https://telegra.ph' + telegraphResponse.data[0].src;
                    console.log('✅ Telegraph upload successful');
                }
            } catch (telegraphError) {
                console.log('Telegraph failed too');
            }
        }
        
        // If both failed, try one more service
        if (!result) {
            try {
                // Convert buffer to base64
                const base64 = buffer.toString('base64');
                const imgbbResponse = await axios.post('https://api.imgbb.com/1/upload', {
                    key: 'f2cc2bc5b9d7e9e8b7a5d4a3c2b1e0f9', // Public demo key - rate limited
                    image: base64
                }, { timeout: 30000 });
                
                if (imgbbResponse.data && 
                    imgbbResponse.data.data && 
                    imgbbResponse.data.data.url) {
                    result = imgbbResponse.data.data.url;
                    console.log('✅ ImgBB upload successful');
                }
            } catch (imgbbError) {
                console.log('All upload services failed');
            }
        }
        
        // Clean up temp file
        try { fs.unlinkSync(tempFile); } catch (e) {}
        
        if (!result) {
            throw new Error('All upload services failed');
        }
        
        return result;
        
    } catch (error) {
        console.error('Upload error:', error);
        // Clean up temp file if it exists
        try { 
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile); 
            }
        } catch (e) {}
        throw error;
    }
}
// ====================================================
// ====================================================

// Now 'removebg' can use the function above
// ============ CONVERTER COMMANDS ============
// sticker command handled in the 'tosticker'/'sticker'/'s' case above

// toimg handled in the 'toimg' case above

case "ptv": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`📹 *Video to PTV*\nReply to a video: ${prefix}ptv`);
    try {
        reply('⏳ *Converting to PTV...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            ptv: true,
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mp4":
case "togif": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage && !m.quoted?.message?.stickerMessage)
        return reply(`🎬 *Convert to MP4*\nReply to a video/gif sticker: ${prefix}mp4`);
    try {
        reply('⏳ *Converting...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            mimetype: 'video/mp4',
            caption: '🎬 *Converted to MP4!*'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gif": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`🎭 *Video to GIF Sticker*\nReply to a video: ${prefix}gif`);
    try {
        reply('⏳ *Converting to GIF sticker...*');
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: global.packname || 'LËGĚNDÃRY BØT',
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.FULL,
            quality: 50
        });
        const stickerBuffer = await sticker.toBuffer();
        await devtrust.sendMessage(m.chat, { sticker: stickerBuffer }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tomp3":
case "mp3": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage && !m.quoted?.message?.audioMessage)
        return reply(`🎵 *Convert to MP3*\nReply to a video or audio: ${prefix}tomp3`);
    try {
        reply('⏳ *Converting to MP3...*');
        const ffmpeg = require('fluent-ffmpeg');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const tmpIn = `./tmp/input_${Date.now()}.mp4`;
        const tmpOut = `./tmp/output_${Date.now()}.mp3`;
        fs.writeFileSync(tmpIn, media);
        await new Promise((resolve, reject) => {
            ffmpeg(tmpIn).toFormat('mp3').save(tmpOut).on('end', resolve).on('error', reject);
        });
        const mp3Buffer = fs.readFileSync(tmpOut);
        fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut);
        await devtrust.sendMessage(m.chat, {
            audio: mp3Buffer,
            mimetype: 'audio/mpeg',
            fileName: 'audio.mp3',
            ptt: false
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "aitts":
case "tts": {
    if (!text) return reply(`🔊 *Text to Speech*\nUsage: ${prefix}tts [text]\n_Max: 20,000 characters_`);
    if (text.length > 20000) return reply(`❌ *Text too long!* Max is 20,000 characters.\nYours: ${text.length} characters`);
    try {
        reply('⏳ *Generating speech...*');
        const gTTS = require('google-tts-api');
        // Split into chunks of 200 chars (Google TTS limit per request)
        const getAllAudioUrls = gTTS.getAllAudioUrls(text, {
            lang: 'en',
            slow: false,
            host: 'https://translate.google.com',
            splitPunct: ',.!?;:'
        });
        if (getAllAudioUrls.length === 1) {
            // Single chunk - send directly
            await devtrust.sendMessage(m.chat, {
                audio: { url: getAllAudioUrls[0].url },
                mimetype: 'audio/mpeg',
                ptt: false
            }, { quoted: m });
        } else {
            // Multiple chunks - notify user
            reply(`🔊 *Text split into ${getAllAudioUrls.length} parts. Sending all...*`);
            for (let i = 0; i < getAllAudioUrls.length; i++) {
                await devtrust.sendMessage(m.chat, {
                    audio: { url: getAllAudioUrls[i].url },
                    mimetype: 'audio/mpeg',
                    ptt: false,
                    fileName: `part_${i+1}.mp3`
                }, { quoted: m });
                await new Promise(r => setTimeout(r, 500));
            }
        }
    } catch (e) { reply(`❌ *TTS Error:* ${e.message}`); }
}
break;

case "black":
case "blackbg": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`🖤 *Black Background*\nReply to an image: ${prefix}black`);
    try {
        reply('⏳ *Adding black background...*');
        const sharp = require('sharp');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const result = await sharp(media)
            .flatten({ background: { r: 0, g: 0, b: 0 } })
            .png().toBuffer();
        await devtrust.sendMessage(m.chat, { image: result, caption: '🖤 *Black background added!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "roundstk": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`⭕ *Round Sticker*\nReply to an image: ${prefix}roundstk`);
    try {
        reply('⏳ *Making round sticker...*');
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: global.packname || 'LËGĚNDÃRY BØT',
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.CIRCLE,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "circlestk": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage)
        return reply(`🔵 *Circle Sticker*\nReply to an image: ${prefix}circlestk`);
    try {
        reply('⏳ *Making circle sticker...*');
        const sharp = require('sharp');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const { width, height } = await sharp(media).metadata();
        const size = Math.min(width, height);
        const circle = Buffer.from(`<svg><circle cx="${size/2}" cy="${size/2}" r="${size/2}"/></svg>`);
        const result = await sharp(media)
            .resize(size, size, { fit: 'cover' })
            .composite([{ input: circle, blend: 'dest-in' }])
            .png().toBuffer();
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const sticker = new Sticker(result, {
            pack: global.packname || 'LËGĚNDÃRY BØT',
            author: global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™',
            type: StickerTypes.FULL,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "take": {
    if (!m.quoted?.message?.stickerMessage && !m.message?.stickerMessage)
        return reply(`📥 *Take Sticker*\nReply to a sticker to save it: ${prefix}take`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            document: media,
            mimetype: 'image/webp',
            fileName: 'sticker.webp'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "exif": {
    if (!m.quoted?.message?.stickerMessage && !m.message?.stickerMessage)
        return reply(`🏷️ *Edit Sticker Info*\nUsage: Reply to sticker + ${prefix}exif [pack name] | [author]\nExample: ${prefix}exif My Pack | Made by Legend`);
    try {
        reply('⏳ *Editing sticker info...*');
        const parts = text?.split('|') || [];
        const packName = parts[0]?.trim() || global.packname || 'LËGĚNDÃRY BØT';
        const authorName = parts[1]?.trim() || global.author || 'LËGĚNDÃRY Ł𝗮𝗯𝘀™';
        const { Sticker, StickerTypes } = require('wa-sticker-formatter');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sticker = new Sticker(media, {
            pack: packName,
            author: authorName,
            type: StickerTypes.FULL,
            quality: 50
        });
        await devtrust.sendMessage(m.chat, { sticker: await sticker.toBuffer() }, { quoted: m });
        reply(`✅ *Sticker info updated!*\n▸ Pack: ${packName}\n▸ Author: ${authorName}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "doc": {
    if (!m.quoted) return reply(`📄 *Convert to Document*\nReply to any media: ${prefix}doc`);
    try {
        const quoted = m.quoted;
        const media = await quoted.download();
        const msgType = Object.keys(quoted.message || {})[0];
        const mimeMap = {
            imageMessage: { mime: 'image/jpeg', ext: 'jpg' },
            videoMessage: { mime: 'video/mp4', ext: 'mp4' },
            audioMessage: { mime: 'audio/mpeg', ext: 'mp3' },
            stickerMessage: { mime: 'image/webp', ext: 'webp' }
        };
        const info = mimeMap[msgType] || { mime: 'application/octet-stream', ext: 'file' };
        await devtrust.sendMessage(m.chat, {
            document: media,
            mimetype: info.mime,
            fileName: `file_${Date.now()}.${info.ext}`
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tovv": {
    if (!m.quoted?.message?.videoMessage && !m.message?.videoMessage)
        return reply(`👁️ *Convert to View Once Video*\nReply to a video: ${prefix}tovv`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        await devtrust.sendMessage(m.chat, {
            video: media,
            mimetype: 'video/mp4',
            viewOnce: true
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// Audio effects using ffmpeg
case "bass": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🎵 *Bass Boost*\nReply to audio: ${prefix}bass`); try { reply('⏳ *Applying bass boost...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('bass=g=10').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "reverse": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage && !m.quoted?.message?.videoMessage) return reply(`🔄 *Reverse Audio*\nReply to audio/video: ${prefix}reverse`); try { reply('⏳ *Reversing...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('areverse').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "nightcore": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🌙 *Nightcore Effect*\nReply to audio: ${prefix}nightcore`); try { reply('⏳ *Applying nightcore...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.25,atempo=1.06').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "slow": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐢 *Slow Audio*\nReply to audio: ${prefix}slow`); try { reply('⏳ *Slowing down...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('atempo=0.7').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "fast": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`⚡ *Fast Audio*\nReply to audio: ${prefix}fast`); try { reply('⏳ *Speeding up...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('atempo=1.5').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "robot": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🤖 *Robot Voice*\nReply to audio: ${prefix}robot`); try { reply('⏳ *Applying robot effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('afftfilt=real=hypot(re,im)*sin(0):imag=hypot(re,im)*cos(0):win_size=512:overlap=0.75').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "chipmunk": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐿️ *Chipmunk Voice*\nReply to audio: ${prefix}chipmunk`); try { reply('⏳ *Applying chipmunk effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.5,atempo=0.67').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "deep":
case "fat": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🔈 *Deep Voice*\nReply to audio: ${prefix}deep`); try { reply('⏳ *Applying deep voice...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*0.7,atempo=1.43').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "echo": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🔊 *Echo Effect*\nReply to audio: ${prefix}echo`); try { reply('⏳ *Applying echo...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('aecho=0.8:0.88:60:0.4').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "blown":
case "earrape": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`💥 *Earrape Effect*\nReply to audio: ${prefix}earrape`); try { reply('⏳ *Applying earrape...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('volume=15').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;

case "squirrel": { if (!m.quoted?.message?.audioMessage && !m.message?.audioMessage) return reply(`🐿️ *Squirrel Voice*\nReply to audio: ${prefix}squirrel`); try { reply('⏳ *Applying squirrel effect...*'); const ffmpeg = require('fluent-ffmpeg'); const quoted = m.quoted || m; const media = await quoted.download(); const tmpIn = `./tmp/in_${Date.now()}.mp3`; const tmpOut = `./tmp/out_${Date.now()}.mp3`; fs.writeFileSync(tmpIn, media); await new Promise((res, rej) => ffmpeg(tmpIn).audioFilters('asetrate=44100*1.8,atempo=0.56').save(tmpOut).on('end', res).on('error', rej)); const buf = fs.readFileSync(tmpOut); fs.unlinkSync(tmpIn); fs.unlinkSync(tmpOut); await devtrust.sendMessage(m.chat, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: m }); } catch(e) { reply(`❌ *Error:* ${e.message}`); } } break;
// ============ END CONVERTER COMMANDS ============

case "removebg": {
    // Check if there's a quoted message
    if (!m.quoted) {
        return await reply("🖼️ *Reply to an image with .removebg*\nExample: Reply to any image and type .removebg");
    }
    
    // Get the quoted message
    const quotedMsg = m.quoted;
    
    // Check if it's an image
    const mime = (quotedMsg.msg || quotedMsg).mimetype || '';
    const isImage = /image\/(png|jpe?g|gif|webp)/.test(mime);
    
    if (!isImage) {
        return await reply("❌ *That's not an image.* Reply to a JPG/PNG image.");
    }

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        
        await reply(`🔍 *Removing background...*`);
        
        // Download the image
        let media = await quotedMsg.download();
        
        // Upload to temporary hosting
        let uploadedUrl = await uploadToCatbox(media);
        
        if (!uploadedUrl) {
            throw new Error('Upload failed');
        }
        
        // Call removebg API
        let response = await fetch(`https://apis.prexzyvilla.site/imagecreator/removebg?url=${encodeURIComponent(uploadedUrl)}`);
        let data = await response.json();

        if (data.status && data.data) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: { url: data.data },
                    caption: "✨ *Background Removed*"
                }),
                { quoted: m }
            );
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        } else {
            throw new Error('API returned error');
        }
    } catch (e) {
        console.error('RemoveBG error:', e);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        await reply("⚠️ *Failed to remove background.* The service might be down. Try again later.");
    }
}
break;

case 'tiktok':
case 'tt': {
    if (!text) {
        return reply(`🎵 *Usage:* ${prefix + command} link`);
    }
    if (!text.includes('tiktok.com')) {
        return reply(`❌ *Invalid TikTok link*`);
    }
    
    m.reply("*⏳ Fetching video...*");

    const tiktokApiUrl = `https://api.bk9.dev/download/tiktok?url=${encodeURIComponent(text)}`;

    fetch(tiktokApiUrl)
        .then(response => response.json())
        .then(data => {
            if (!data.status || !data.BK9 || !data.BK9.BK9) {
                return reply('❌ *Failed to get download link*');
            }
            
            const videoUrl = data.BK9.BK9;
            
            devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    video: { url: videoUrl },
                    caption: "🎵 *LËGĚNDÃRY BØT TikTok*"
                }), 
                { quoted: m }
            );
        })
        .catch(err => {
            console.error(err);
            reply("❌ *Download failed* • Network error");
        });
}
break;

case 'apk':
case 'apkdl': {
    if (!text) {
        return reply(`📱 *Usage:* ${prefix + command} com.whatsapp`);
    }
    
    try {
        const packageId = text.trim();
        const res = await fetch(`https://api.bk9.dev/download/apk?id=${encodeURIComponent(packageId)}`);
        const data = await res.json();

        if (!data.status || !data.BK9 || !data.BK9.dllink) {
            return reply('❌ *APK not found* • Check package ID');
        }

        const { name, emperor, dllink, package: packageName } = data.BK9;

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: emperor},
                caption: `📦 *${name}*\nPackage: ${packageName}\n📥 Downloading...`
            }), 
            { quoted: m }
        );

        await devtrust.sendMessage(m.chat, {
            document: { url: dllink },
            fileName: `${name}.apk`,
            mimetype: 'application/vnd.android.package-archive'
        }, { quoted: m });

    } catch (e) {
        console.error(e);
        reply('❌ *APK fetch failed* • Try again later');
    }
}
break;

case 'tomp4': {
    if (!m.quoted) return reply("🖼️ *Reply to a sticker/gif* with tomp4");
    let mime = m.quoted.mimetype || '';
    if (!/webp|gif/.test(mime)) return reply("⚠️ *Reply must be a sticker or gif*");

    try {
        let media = await m.quoted.download();
        let inputPath = `./tmp/${Date.now()}.${mime.includes('gif') ? 'gif' : 'webp'}`;
        let outputPath = `./tmp/${Date.now()}.mp4`;
        
        if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp', { recursive: true });
        
        fs.writeFileSync(inputPath, media);
        
        // Simple conversion command
        exec(`ffmpeg -i ${inputPath} -c:v libx264 -pix_fmt yuv420p ${outputPath}`, async (err) => {
            if (err) {
                console.log(err);
                return reply("❌ *Conversion failed*");
            }
            
            let converted = fs.readFileSync(outputPath);
            await devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    video: converted,
                    mimetype: 'video/mp4',
                    caption: "🎬 *Converted to MP4*"
                }), 
                { quoted: m }
            );
            
            try { 
                fs.unlinkSync(inputPath); 
                fs.unlinkSync(outputPath); 
            } catch (e) {}
        });
        
    } catch (e) {
        console.log(e);
        reply("❌ *Conversion failed*");
    }
}
break;
// [REMOVED DUPLICATE: tomp3]

case 'kickadmins': {
    if (!m.isGroup) return reply(m.group);
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let metadata = await devtrust.groupMetadata(m.chat);
    let participants = metadata.participants;
    let kicked = 0;

    for (let member of participants) {
        if (member.id === botNumber) continue;
        if (member.id === m.sender) continue;

        if (member.admin === "superadmin" || member.admin === "admin") {
            await devtrust.groupParticipantsUpdate(m.chat, [member.id], 'remove');
            kicked++;
            await sleep(1500);
        }
    }

    reply(`✅ *${kicked} admins removed*`);
}
break;

case 'kickall': {
    if (!m.isGroup) return reply(m.group);
    if (!isCreator && !isSudo) 
        return reply('🔒 *Owner/Sudo only*');

    let metadata = await devtrust.groupMetadata(m.chat);
    let participants = metadata.participants;
    let kicked = 0;

    for (let member of participants) {
        if (member.id === botNumber) continue;
        if (member.admin === "superadmin" || member.admin === "admin") continue;

        await devtrust.groupParticipantsUpdate(m.chat, [member.id], 'remove');
        kicked++;
        await sleep(1500);
    }

    reply(`✅ *${kicked} members removed*`);
}
break;

case 'myip': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    try {
        var http = require('http');
        http.get({
            'host': 'api.ipify.org',
            'port': 80,
            'path': '/'
        }, function(resp) {
            let ipData = '';
            resp.on('data', function(chunk) {
                ipData += chunk;
            });
            resp.on('end', function() {
                reply(`🌐 *Your IP Address:*\n\`${ipData}\``);
            });
        }).on('error', function(e) {
            reply(`❌ *Error fetching IP:* ${e.message}`);
        });
    } catch (e) {
        reply(`❌ *Error:* ${e.message}`);
    }
    break;
}

case "movie": {
    if (!text) return reply("🎬 *Example:* movie Inception");

    await devtrust.sendPresenceUpdate("composing", m.chat);

    try {
        const res = await axios.get(`http://www.omdbapi.com/?t=${encodeURIComponent(text)}&apikey=6372bb60`);
        if (res.data.Response === "False") return reply("❌ *Movie not found*");

        const data = res.data;

        let caption = `🎬 *${data.Title}*\n\n` +
            `📅 ${data.Year} • ⭐ ${data.imdbRating}\n` +
            `🎭 ${data.Genre}\n\n` +
            `📝 ${data.Plot.substring(0, 200)}...\n\n` +
            `👤 ${data.Director}`;

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: data.Poster !== "N/A" ? data.Poster : "https://i.ibb.co/4f4tTnG/no-poster.png" },
                caption: caption
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error(e);
        reply("⚠️ *Movie info unavailable* • Try again later");
    }
}
break;

case "sciencefact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        reply(`🔬 *Science Fact*\n\n${res.data.text}`);
    } catch {
        reply("❌ *Fact machine broke* • Try again later");
    }
}
break;

case "book": {
    if (!text) return reply("📚 *Example:* book Harry Potter");
    
    try {
        const res = await axios.get(`https://openlibrary.org/search.json?q=${encodeURIComponent(text)}&limit=3`);
        if (!res.data.docs.length) return reply("❌ *No books found*");
        
        const books = res.data.docs.map((b,i) => 
            `${i+1}. *${b.title}*\n👤 ${b.author_name?.[0] || "Unknown"}`
        ).join("\n\n");
        
        reply(`📚 *Book Search*\n\n${books}`);
    } catch {
        reply("❌ *Search failed* • Library is closed");
    }
}
break;

case "recipe": {
    if (!text) return reply("🍳 *Example:* recipe pancakes");
    
    try {
        const res = await axios.get(`https://www.themealdb.com/api/json/v1/1/search.php?s=${encodeURIComponent(text)}`);
        if (!res.data.meals) return reply("❌ *No recipes found*");
        
        const meal = res.data.meals[0];
        const ingredients = Array.from({length:20})
            .map((_,i) => meal[`strIngredient${i+1}`] ? `• ${meal[`strIngredient${i+1}`]} - ${meal[`strMeasure${i+1}`]}` : '')
            .filter(Boolean)
            .join("\n");
        
        const msg = `🍽 *${meal.strMeal}*\n\n${ingredients}`;
        reply(msg);
    } catch {
        reply("❌ *Recipe fetch failed* • Kitchen's closed");
    }
}
break;

case "remind": {
    if (!text) return reply("⏰ *Usage:* remind 60 Take a break");
    
    const [sec, ...msgArr] = text.split(" ");
    const msgText = msgArr.join(" ");
    const delay = parseInt(sec) * 1000;
    
    if (isNaN(delay) || !msgText) return reply("❌ *Invalid format*");
    
    reply(`⏰ *Reminder set* for ${sec} seconds`);
    
    setTimeout(() => {
        devtrust.sendMessage(m.chat, { text: `⏰ *Reminder:* ${msgText}` });
    }, delay);
}
break;

case "define":
case "dictionary": {
    if (!text) return reply("📖 *Example:* define computer");
    
    try {
        const res = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${text}`);
        const meanings = res.data[0].meanings[0].definitions[0].definition;
        reply(`📖 *${text}*\n\n${meanings}`);
    } catch {
        reply("❌ *Word not found*");
    }
}
break;

case "currencies":
case "currency": {
    if (!text) {
        return reply(`💱 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Currency*\n\nUsage: ${prefix}currency [amount] [from] [to]\nExample: ${prefix}currency 100 USD EUR\n\nOr use: ${prefix}currencies to see all available codes`);
    }
    
    const [amount, from, to] = text.split(" ");
    
    // If all three arguments provided, do conversion
    if (amount && from && to) {
        try {
            await devtrust.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
            
            const response = await axios.get(`https://api.exchangerate.host/convert?from=${from.toUpperCase()}&to=${to.toUpperCase()}&amount=${amount}`, {
                timeout: 10000
            });
            
            if (!response.data || !response.data.result) {
                throw new Error('Invalid response');
            }
            
            reply(`💱 *LËGĚNDÃRY BØT Currency*\n\n${amount} ${from.toUpperCase()} = ${response.data.result} ${to.toUpperCase()}`);
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
        } catch (error) {
            console.error('Currency error:', error.message);
            await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
            reply(`⚠️ *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currency*\n\nExchange rates are sleeping. Try again later.`);
        }
        return;
    }
    
    // If no arguments or just "currencies", show available currencies
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '💱', key: m.key } });
        
        const response = await axios.get('https://apis.davidcyril.name.ng/tools/currencies', {
            timeout: 10000
        });
        
        if (!response.data.success || !response.data.result) {
            throw new Error('API Error');
        }

        let currencyList = `💱 *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currencies*\n\n`;
        
        response.data.result.slice(0, 30).forEach((curr, i) => {
            currencyList += `${i + 1}. *${curr.code}* - ${curr.name}\n`;
        });
        
        currencyList += `\n_Use ${prefix}currency [amount] [from] [to] to convert_`;
        
        reply(currencyList);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (err) {
        console.error('Currencies error:', err.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *Λ𝗫𝗜𝗦 𝗫𝗠𝗗 Currencies*\n\nCurrency list is on vacation. Try again later.`);
    }
}
break;

case "genpass": {
    const length = parseInt(text) || 12;
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let pass = "";
    for (let i=0; i<length; i++) 
        pass += chars.charAt(Math.floor(Math.random()*chars.length));
    
    reply(`🔑 *Generated Password*\n\n${pass}`);
}
break;

case "readqr": {
    if (!m.quoted || !m.quoted.image) 
        return reply("📱 *Reply to a QR code image*");
    
    const buffer = await m.quoted.download();
    
    try {
        const res = await axios.post("https://api.qrserver.com/v1/read-qr-code/", buffer, {
            headers: { "Content-Type": "multipart/form-data" }
        });
        const qrText = res.data[0].symbol[0].data;
        reply(`📱 *QR Code Content*\n\n${qrText}`);
    } catch (e) {
        reply("❌ *Failed to read QR code*");
    }
}
break;

case 'weather':
case 'weather2':
case 'weatherinfo': {
    if (!text) return reply(`🌤 *LËGĚNDÃRY BØT Weather*\n\nUsage: ${prefix}${command} [city]\nExample: ${prefix}${command} London`);
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🌤️', key: m.key } });
        
        reply(`🔍 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Weather*\n\nChecking forecast for ${text}...`);
        
        const response = await axios.get(
            `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=d97e458517de3eac6d3c50abcdcbe0e7`,
            { timeout: 10000 }
        );
        
        const data = response.data;
        
        const weatherInfo = `📍 *${data.name}, ${data.sys.country}*\n` +
                           `🌡️ ${data.main.temp}°C (feels like ${data.main.feels_like}°C)\n` +
                           `☁️ ${data.weather[0].description}\n` +
                           `💧 ${data.main.humidity}% humidity\n` +
                           `🌬️ ${data.wind.speed} m/s wind`;
        
        reply(`🌤 *LËGĚNDÃRY Ł𝗮𝗯𝘀™ Weather*\n\n${weatherInfo}`);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Weather Error:', error.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *LËGĚNDÃRY BØT Weather*\n\nWeather service is offline. Try again later.`);
    }
}
break;

case "calculate": {
    if (!text) return reply("🧮 *Example:* calculate 12+25*3");
    
    try {
        const result = eval(text);
        reply(`🧮 *Result*\n\n${text} = ${result}`);
    } catch {
        reply("❌ *Invalid expression*");
    }
}
break;

// ============ HANGMAN GAME ============
case "hangman": {
    const chatId = m.chat;
    const args = text?.split(" ") || [];
    let game = hangmanGames[chatId];

    // Start new game
    if (!game) {
        if (!args[0]) return reply("🎮 *Start:* hangman banana");
        
        const word = args[0].toLowerCase();
        const display = "_".repeat(word.length).split("");
        hangmanGames[chatId] = { 
            word, 
            display, 
            attempts: 6, 
            guessed: [],
            wrongGuesses: 0
        };
        
        const visual = hangmanVisual[0]; // First visual (6 attempts left)
        
        reply(`🎮 *Hangman Started*\n\n` +
              `${visual}\n\n` +
              `Word: ${display.join(" ")}\n` +
              `Attempts: 6\n` +
              `Guess: hangman [letter]`);
        return;
    }

    // Make a guess
    if (!args[0]) return reply("🔤 *Guess a letter* • Example: hangman a");
    
    const letter = args[0].toLowerCase();
    if (letter.length !== 1) return reply("❌ *One letter at a time*");
    if (!/[a-z]/.test(letter)) return reply("❌ *Letters only*");
    if (game.guessed.includes(letter)) return reply("⚠️ *Already guessed*");

    game.guessed.push(letter);
    
    if (game.word.includes(letter)) {
        // Correct guess
        game.display = game.display.map((c, i) => (game.word[i] === letter ? letter : c));
    } else {
        // Wrong guess
        game.wrongGuesses += 1;
        game.attempts -= 1;
    }

    // Get current hangman visual
    const visualIndex = Math.min(game.wrongGuesses, hangmanVisual.length - 1);
    const visual = hangmanVisual[visualIndex];

    // Check win condition
    if (!game.display.includes("_")) {
        reply(`🎉 *You won!*\n\nWord: ${game.word}\n\n${visual}`);
        delete hangmanGames[chatId];
        return;
    }

    // Check lose condition
    if (game.attempts <= 0) {
        reply(`💀 *Game over!*\n\nWord: ${game.word}\n\n${visual}`);
        delete hangmanGames[chatId];
        return;
    }

    // Game continues
    reply(`🎮 *Hangman*\n\n` +
          `${visual}\n\n` +
          `Word: ${game.display.join(" ")}\n` +
          `Attempts: ${game.attempts}\n` +
          `Guessed: ${game.guessed.join(", ")}`);
}
break;
// ======================================

case "numbattle": {
    const userRoll = Math.floor(Math.random() * 100) + 1;
    const botRoll = Math.floor(Math.random() * 100) + 1;
    
    let result = userRoll > botRoll ? "🎉 *You win!*" : 
                 userRoll < botRoll ? "😢 *You lose!*" : "🤝 *It's a tie!*";
    
    reply(`🎲 *Number Battle*\n\nYou: ${userRoll}\nBot: ${botRoll}\n\n${result}`);
}
break;

case "coinbattle": {
    const userFlip = Math.random() < 0.5 ? "Heads" : "Tails";
    const botFlip = Math.random() < 0.5 ? "Heads" : "Tails";
    
    let result = userFlip === botFlip ? "🎉 *You win!*" : "😢 *You lose!*";
    
    reply(`🪙 *Coin Battle*\n\nYou: ${userFlip}\nBot: ${botFlip}\n\n${result}`);
}
break;

case "numberbattle": {
    if (!text) return reply("🎯 *Usage:* numberbattle 25");
    
    const number = Math.floor(Math.random() * 50) + 1;
    const guess = parseInt(text);
    
    let result = guess === number ? "🎉 *Perfect guess!*" : 
                 guess > number ? "⬇️ *Too high!*" : "⬆️ *Too low!*";
    
    reply(`🎯 *Number Battle*\n\nYour guess: ${guess}\nTarget: ${number}\n\n${result}`);
}
break;

case "math": {
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 50) + 1;
    
    reply(`➕ *Math Quiz*\n\n${a} + ${b} = ?\nReply: mathanswer number`);
}
break;

case "emojiquiz": {
    const quizzes = [
        { emoji: "🐍", answer: "snake" },
        { emoji: "🍎", answer: "apple" },
        { emoji: "🏎️", answer: "car" },
        { emoji: "🎸", answer: "guitar" },
        { emoji: "☕", answer: "coffee" }
    ];
    
    const quiz = quizzes[Math.floor(Math.random() * quizzes.length)];
    reply(`🧩 *Emoji Quiz*\n\n${quiz.emoji}\nReply: emojianswer your guess`);
}
break;

case "dice": {
    const roll = Math.floor(Math.random() * 6) + 1;
    reply(`🎲 *You rolled a ${roll}!*`);
}
break;

case "rpsls": {
    if (!text) return reply("🪨 *Choose:* rock, paper, scissors, lizard, spock");
    
    const choices = ["rock", "paper", "scissors", "lizard", "spock"];
    const userChoice = text.toLowerCase();
    
    if (!choices.includes(userChoice)) 
        return reply("❌ *Invalid choice* • Use rock, paper, scissors, lizard, spock");

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    const winMap = {
        rock: ["scissors", "lizard"],
        paper: ["rock", "spock"],
        scissors: ["paper", "lizard"],
        lizard: ["spock", "paper"],
        spock: ["scissors", "rock"]
    };

    let result = userChoice === botChoice ? "🤝 *It's a tie!*" :
                 winMap[userChoice].includes(botChoice) ? "🎉 *You win!*" : "😢 *You lose!*";

    reply(`🪨 *RPSLS*\n\nYou: ${userChoice}\nBot: ${botChoice}\n\n${result}`);
}
break;
case "coin": {
    const result = Math.random() < 0.5 ? "🪙 Heads" : "🪙 Tails";
    await devtrust.sendMessage(m.chat, { text: `🎲 Coin Flip Result: ${result}` }, { quoted: m });
}
break;
case "gamefact": {
    try {
        const res = await axios.get("https://www.freetogame.com/api/games");
        const games = res.data;
        const game = games[Math.floor(Math.random() * games.length)];
        
        reply(`🎮 *${game.title}*\n🎭 ${game.genre}\n📱 ${game.platform}\n🔗 ${game.game_url}`);
    } catch (e) {
        console.error("GAMEFACT ERROR:", e);
        reply("❌ *Game fact unavailable* • Server offline");
    }
}
break;

case "fox": {
    try {
        const res = await axios.get("https://randomfox.ca/floof/");
        const img = res.data?.image;
        if (!img) return reply("❌ *Fox ran away* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🦊 *Random Fox*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("FOX ERROR:", e);
        reply("❌ *Fox hunt failed* • API is sleeping");
    }
}
break;

case "bchcn": {
    try {
        const res = await axios.get("https://some-random-api.com/img/koala");
        const img = res.data?.link;
        if (!img) return reply("❌ *Koala hiding* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐨 *Random Koala*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("KOALA ERROR:", e);
        reply("❌ *Koala fetch failed* • API offline");
    }
}
break;

case "hxjxjjkm": {
    try {
        const res = await axios.get("https://some-random-api.com/img/birb");
        const img = res.data?.link;
        if (!img) return reply("❌ *Bird flew away* • Try again");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐦 *Random Bird*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("BIRD ERROR:", e);
        reply("❌ *Bird migration failed* • Try later");
    }
}
break;

case "panda": {
    try {
        const res = await axios.get("https://some-random-api.com/img/panda");
        const img = res.data?.link;  
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: img },
                caption: "🐼 *Random Panda*"
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("PANDA ERROR:", e);
        reply("❌ *Panda on vacation* • Try again");
    }
}
break;

case "funfact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        const fact = res.data?.text || "Bots are awesome!";
        reply(`💡 *Fun Fact*\n\n${fact}`);
    } catch (e) {
        console.error("FUNFACT ERROR:", e);
        reply("❌ *Fact machine broke* • Try again later");
    }
}
break;

case "vkfkk": {
    try {
        const res = await axios.get("https://api.quotable.io/random");
        const quote = res.data?.content || "Keep pushing forward!";
        const author = res.data?.author || "Unknown";
        reply(`🖋 *"${quote}"*\n— ${author}`);
    } catch (e) {
        console.error("QUOTEMEME ERROR:", e);
        reply("❌ *Quote generator is silent* • Try later");
    }
}
break;

case "prog": {
    try {
        const res = await axios.get("https://v2.jokeapi.dev/joke/Programming?type=single");
        const joke = res.data?.joke || "Why do programmers prefer dark mode? Light attracts bugs!";
        reply(`💻 *Programming Joke*\n\n${joke}`);
    } catch (e) {
        console.error("PROG JOKE ERROR:", e);
        reply("❌ *Joke compiler error* • Try again");
    }
}
break;

case "dadjoke": {
    try {
        const res = await axios.get("https://icanhazdadjoke.com/", { headers: { Accept: "application/json" } });
        const joke = res.data?.joke || "I'm still working on it!";
        reply(`👴 *Dad Joke*\n\n${joke}`);
    } catch (e) {
        console.error("DAD JOKE ERROR:", e);
        reply("❌ *Dad left for milk* • Try later");
    }
}
break;

case "progquote": {
    try {
        const res = await axios.get("https://hdramming-quotes-api.herokuapp.com/quotes/random");
        const quote = res.data?.en || "Talk is cheap. Show me the code.";
        const author = res.data?.author || "Linus Torvalds";
        reply(`💻 *"${quote}"*\n— ${author}`);
    } catch (e) {
        console.error("PROGQUOTE ERROR:", e);
        reply("❌ *Quote not found* • 404 error");
    }
}
break;

case "guess": {
    const number = Math.floor(Math.random() * 10) + 1;
    if (!text) return reply("🎲 *Usage:* guess 7");
    
    const guess = parseInt(text);
    if (isNaN(guess) || guess < 1 || guess > 10) 
        return reply("❌ *Choose 1-10*");
    
    const result = guess === number ? "🎉 *Correct!*" : "😢 *Wrong guess*";
    reply(`🎯 *Guess Game*\n\nYou: ${guess}\nBot: ${number}\n${result}`);
}
break;

case "moviequote": {
    try {
        const res = await axios.get("https://movie-quote-api.herokuapp.com/v1/quote/");
        const quote = res.data?.quote || "May the Force be with you.";
        const movie = res.data?.show || "Unknown";
        reply(`🎬 *"${quote}"*\n— ${movie}`);
    } catch (e) {
        console.error("MOVIE QUOTE ERROR:", e);
        reply("❌ *Movie quote unavailable* • Cinema closed");
    }
}
break;

case "triviafact": {
    try {
        const res = await axios.get("https://uselessfacts.jsph.pl/random.json?language=en");
        const fact = res.data?.text || "You're awesome!";
        reply(`🧠 *Trivia Fact*\n\n${fact}`);
    } catch (e) {
        console.error("TRIVIA FACT ERROR:", e);
        reply("❌ *Trivia machine broke*");
    }
}
break;

case "cbhcchhcx": {
    try {
        const res = await axios.get("https://type.fit/api/quotes");
        const quotes = res.data;
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        reply(`🌟 *"${q.text}"*\n— ${q.author || "Unknown"}`);
    } catch (e) {
        console.error("INSPIRE ERROR:", e);
        reply("❌ *Inspiration unavailable*");
    }
}
break;
// [REMOVED DUPLICATE: compliment]

case "rps": {
    if (!text) return reply("🪨 *Choose:* rock, paper, scissors");
    
    const choices = ["rock", "paper", "scissors"];
    const userChoice = text.toLowerCase();
    if (!choices.includes(userChoice)) 
        return reply("❌ *Invalid choice* • Use rock, paper, scissors");

    const botChoice = choices[Math.floor(Math.random() * choices.length)];

    let result = userChoice === botChoice ? "🤝 *Tie!*" :
        (userChoice === "rock" && botChoice === "scissors") ||
        (userChoice === "paper" && botChoice === "rock") ||
        (userChoice === "scissors" && botChoice === "paper") 
        ? "🎉 *You win!*" : "😢 *You lose!*";

    reply(`🪨 *RPS*\n\nYou: ${userChoice}\nBot: ${botChoice}\n${result}`);
}
break;

case "8ball": {
    const answers = [
        "It is certain ✅", "Without a doubt ✅", "Ask again later 🤔",
        "Cannot predict now 🤷", "Don't count on it ❌", "Very doubtful ❌"
    ];
    if (!text) return reply("🎱 *Ask me a question*");
    
    const answer = answers[Math.floor(Math.random() * answers.length)];
    reply(`🎱 *Question:* ${text}\n\n${answer}`);
}
break;

case "trivia": {
    try {
        const res = await axios.get("https://opentdb.com/api.php?amount=1&type=multiple");
        const trivia = res.data.results[0];
        const options = [...trivia.incorrect_answers, trivia.correct_answer]
            .sort(() => Math.random() - 0.5);
        
        reply(`❓ *${trivia.question}*\n\n${options.map((o,i)=>`${i+1}. ${o}`).join("\n")}`);
    } catch (e) {
        console.error("TRIVIA ERROR:", e);
        reply("❌ *Trivia unavailable*");
    }
}
break;

// ============ FUN COMMANDS ============
case "slap":
case "hug":
case "kiss":
case "pat":
case "cuddle":
case "tickle":
case "feed":
case "smug": {
    const action = command;
    const actionEmojis = { slap: '👋', hug: '🤗', kiss: '💋', pat: '👏', cuddle: '🥰', tickle: '😂', feed: '🍽️', smug: '😏' };
    const actionGifs = {
        slap: 'https://media.tenor.com/oVTPj5_7TbkAAAAC/anime-slap.gif',
        hug: 'https://media.tenor.com/vu6b9ChiResAAAAC/hug-anime.gif',
        kiss: 'https://media.tenor.com/JaL4PFZXMRYAAAAC/kiss-anime.gif',
        pat: 'https://media.tenor.com/PPMzLa6G97UAAAAC/head-pat-anime.gif',
        cuddle: 'https://media.tenor.com/4rIXM7QJ4NEAAAAC/cuddle-anime.gif',
        tickle: 'https://media.tenor.com/N-qDNBiL064AAAAC/tickle-anime.gif',
        feed: 'https://media.tenor.com/bFvKJnMC1TUAAAAC/anime-feed.gif',
        smug: 'https://media.tenor.com/Mte9JV56i0IAAAAC/smug-anime.gif'
    };
    const target = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'someone');
    const sender = m.pushName || 'Someone';
    await devtrust.sendMessage(m.chat, {
        image: { url: actionGifs[action] },
        caption: `${actionEmojis[action]} *${sender}* ${action}s ${target}!`,
        mentions: m.mentionedJid || []
    }, { quoted: m });
}
break;

case "neko":
case "meow": {
    const nekoGifs = [
        'https://media.tenor.com/OjBbDMlPWzkAAAAC/neko-anime.gif',
        'https://media.tenor.com/hn3q0QmMXp0AAAAC/neko-cat-girl.gif',
        'https://media.tenor.com/wqF46GXXXTIAAAAC/anime-cat-girl.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: nekoGifs[Math.floor(Math.random() * nekoGifs.length)] },
        caption: '🐱 *Nyan~*'
    }, { quoted: m });
}
break;

case "woof": {
    const woofGifs = [
        'https://media.tenor.com/TuCmv3OoMlEAAAAC/cute-dog.gif',
        'https://media.tenor.com/Nfv-kSgXMaEAAAAC/dog-woof.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: woofGifs[Math.floor(Math.random() * woofGifs.length)] },
        caption: '🐶 *Woof woof!*'
    }, { quoted: m });
}
break;

case "goose": {
    await devtrust.sendMessage(m.chat, {
        image: { url: 'https://media.tenor.com/WhWrYmMO1AQAAAAC/goose.gif' },
        caption: '🪿 *HONK HONK!*'
    }, { quoted: m });
}
break;

case "lizard": {
    await devtrust.sendMessage(m.chat, {
        image: { url: 'https://media.tenor.com/ELlSQjAFbJYAAAAC/lizard.gif' },
        caption: '🦎 *Lizard vibes~*'
    }, { quoted: m });
}
break;

case "foxgirl": {
    const foxGifs = [
        'https://media.tenor.com/W2MTuEz4iBEAAAAC/fox-girl-anime.gif',
        'https://media.tenor.com/0RUyMO8BN0IAAAAC/anime-fox.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: foxGifs[Math.floor(Math.random() * foxGifs.length)] },
        caption: '🦊 *Fox girl~*'
    }, { quoted: m });
}
break;

case "wallpaper": {
    const wallpapers = [
        'https://w.wallhaven.cc/full/zy/wallhaven-zy3wqx.jpg',
        'https://w.wallhaven.cc/full/4g/wallhaven-4gdlq3.jpg',
        'https://w.wallhaven.cc/full/ex/wallhaven-exvkvo.jpg'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: wallpapers[Math.floor(Math.random() * wallpapers.length)] },
        caption: '🖼️ *Random Wallpaper*'
    }, { quoted: m });
}
break;

case "ngif": {
    const gifs = [
        'https://media.tenor.com/random-funny-anime.gif',
        'https://media.tenor.com/9yEyEIHJY0EAAAAC/anime-funny.gif',
        'https://media.tenor.com/IFcyBjWpPl0AAAAC/anime.gif'
    ];
    await devtrust.sendMessage(m.chat, {
        image: { url: gifs[Math.floor(Math.random() * gifs.length)] },
        caption: '🎭 *Random GIF*'
    }, { quoted: m });
}
break;

case "hack": {
    const target2 = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'the system');
    const steps = [
        `💻 *Initiating hack on ${target2}...*`,
        `🔍 *Scanning ports...*`,
        `🔓 *Bypassing firewall...*`,
        `📂 *Accessing database...*`,
        `✅ *Hack complete! ${target2} has been hacked!* 😈`
    ];
    let i = 0;
    const sent = await devtrust.sendMessage(m.chat, { text: steps[0], mentions: m.mentionedJid || [] }, { quoted: m });
    const interval = setInterval(async () => {
        i++;
        if (i >= steps.length) { clearInterval(interval); return; }
        await devtrust.sendMessage(m.chat, { text: steps[i], edit: sent.key });
    }, 1500);
}
break;

case "pickupl":
case "pickup": {
    const pickupLines = [
        "Are you a WiFi signal? Because I'm feeling a connection 📶",
        "Do you have a map? I keep getting lost in your eyes 🗺️",
        "Are you a keyboard? Because you're just my type ⌨️",
        "Is your name Google? Because you have everything I've been searching for 🔍",
        "Are you a camera? Every time I look at you, I smile 📸",
        "Do you believe in love at first sight, or should I walk by again? 👀",
        "Are you a magician? Because whenever I look at you, everyone else disappears ✨",
        "Is your name Wi-Fi? Because I'm really feeling a connection 💕"
    ];
    const line = pickupLines[Math.floor(Math.random() * pickupLines.length)];
    reply(`💘 *Pickup Line:*\n\n_${line}_`);
}
break;

case "wyr": {
    const wyrQuestions = [
        "Would you rather be able to fly ✈️ or be invisible 👻?",
        "Would you rather have unlimited money 💰 or unlimited time ⏰?",
        "Would you rather be always cold 🥶 or always hot 🥵?",
        "Would you rather lose your phone 📱 or your wallet 👛?",
        "Would you rather speak all languages 🌍 or play all instruments 🎸?",
        "Would you rather have no internet 🚫🌐 or no TV 🚫📺?",
        "Would you rather be famous 🌟 or be the best friend of someone famous 🤝?"
    ];
    const q = wyrQuestions[Math.floor(Math.random() * wyrQuestions.length)];
    reply(`🤔 *Would You Rather?*\n\n${q}`);
}
break;

case "insult": {
    const insults = [
        "You're like a cloud ☁️ — when you disappear, it's a beautiful day!",
        "I'd agree with you but then we'd both be wrong 🤦",
        "You're proof that even evolution can go backwards 🐒",
        "I've met some dumb people but you are an all-time champion 🏆",
        "You're not stupid, you just have bad luck thinking 🧠",
        "Your secrets are safe with me — I don't listen when you talk 🙉",
        "You're like a software update 💻 — every time I see you, I think 'not now'"
    ];
    const target3 = m.mentionedJid?.[0] ? `@${m.mentionedJid[0].replace('@s.whatsapp.net', '')}` : (text || 'you');
    const insult = insults[Math.floor(Math.random() * insults.length)];
    reply(`😈 *Hey ${target3}...*\n\n_${insult}_`, { mentions: m.mentionedJid || [] });
}
break;

case "emojimix": {
    if (!text || text.split(' ').length < 2) return reply(`⚙️ *Usage:* ${prefix}emojimix [emoji1] [emoji2]\n_Example: ${prefix}emojimix 😀 🔥_`);
    const [e1, e2] = text.split(' ');
    const e1Code = [...e1][0].codePointAt(0).toString(16);
    const e2Code = [...e2][0].codePointAt(0).toString(16);
    const mixUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/u${e1Code}/u${e1Code}_u${e2Code}.png`;
    try {
        await devtrust.sendMessage(m.chat, {
            image: { url: mixUrl },
            caption: `✨ *Emoji Mix: ${e1} + ${e2}*`
        }, { quoted: m });
    } catch (e) {
        reply(`❌ *Could not mix those emojis. Try different ones!*`);
    }
}
break;
// ============ END FUN COMMANDS ============

case "meme": {
    try {
        const res = await axios.get("https://meme-api.com/gimme");
        const meme = res.data;
        if (!meme?.url) return reply("❌ *Meme ran away*");
        
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: meme.url },
                caption: `😂 *${meme.title}*`
            }), 
            { quoted: m }
        );
    } catch (e) {
        console.error("MEME ERROR:", e);
        reply("❌ *Meme factory closed*");
    }
}
break;

case 'yts': 
case 'ytsearch': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!text) return reply(`🔍 *Example:* ${prefix + command} anime music`);
    
    let yts = require("yt-search");
    let search = await yts(text);
    
    let teks = `📺 *YouTube Search*\n\n"${text}"\n\n`;
    let no = 1;
    
    for (let i of search.all.slice(0,5)) {
        teks += `${no++}. *${i.title}*\n⏱️ ${i.timestamp} | 👀 ${i.views}\n🔗 ${i.url}\n\n`;
    }
    
    await devtrust.sendMessage(m.chat, 
        addNewsletterContext({
            image: { url: search.all[0].thumbnail },
            caption: teks
        }), 
        { quoted: m }
    );
}
break;

case 'animewlp': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    
    try {
        const waifudd = await axios.get(`https://nekos.life/api/v2/img/wallpaper`);
        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                image: { url: waifudd.data.url },
                caption: "🖼️ *Anime Wallpaper*"
            }), 
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Error fetching wallpaper*');
    }
}
break;

case 'resetlink': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    if (!m.isGroup) return reply("👥 *Groups only*");
    
    await devtrust.groupRevokeInvite(m.chat);
    reply("✅ *Group link reset*");
}
break;

case 'animedl': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!q.includes("|")) {
        return reply("📌 *Format:* animedl Anime Name | Episode");
    }

    try {
        const [animeName, episode] = q.split("|").map(x => x.trim());
        const apiUrl = `https://draculazxy-xyzdrac.hf.space/api/Animedl?q=${encodeURIComponent(animeName)}&ep=${encodeURIComponent(episode)}`;

        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        
        const { data } = await axios.get(apiUrl, {
            httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false })
        });

        if (data.STATUS !== 200 || !data.download_link) {
            return reply("❌ *Episode not found*");
        }

        const { anime, episode: epNumber, download_link } = data;

        reply(`🎥 *${anime}* Ep ${epNumber}\n⏳ Downloading...`);

        await devtrust.sendMessage(m.chat, {
            document: { url: download_link },
            mimetype: "video/mp4",
            fileName: `${anime} - Episode ${epNumber}.mp4`
        }, { quoted: m });

    } catch (error) {
        console.error("❌ Anime Downloader Error:", error.message);
        reply("⚠️ *Server Error* • Try again later");
    }
}
break;

case 'animesearch': {
    if (!isCreator) return reply(`🔒 *Owner only*`);
    if (!text) return reply(`🔍 *Which anime?*`);
    
    const malScraper = require('mal-scraper');
    const anime = await malScraper.getInfoFromName(text).catch(() => null);
    
    if (!anime) return reply(`❌ *Anime not found*`);
    
    let animetxt = `🎀 *${anime.title}*\n` +
        `🎋 Type: ${anime.type}\n` +
        `📈 Status: ${anime.status}\n` +
        `💮 Genres: ${anime.genres}\n` +
        `🌟 Score: ${anime.score}\n` +
        `💫 Popularity: ${anime.popularity}\n\n` +
        `📝 ${anime.synopsis.substring(0, 300)}...`;
    
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: { url: anime.picture },
            caption: animetxt
        }),
        { quoted: m }
    );
}
break;

case 'ai': {
    if (!text) return reply('🤖 *Example:* ai Who is Mark Zuckerberg?');

    await devtrust.sendPresenceUpdate('composing', m.chat);

    try {
        const answer = await askOpenAI(text);
        reply(`🤖 *AI*\n\n${answer}`);

    } catch (e) {
        reply(`❌ *AI error* • ${e.response?.data?.error?.message || e.message}`);
    }
}
break;

case 'idch': {
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!text) return reply("🔗 *Example:* link channel");
    if (!text.includes("https://whatsapp.com/channel/")) 
        return reply("❌ *Invalid channel link*");
    
    let result = text.split('https://whatsapp.com/channel/')[1];
    let res = await devtrust.newsletterMetadata("invite", result);
    
    let teks = `📢 *Channel Info*\n\n` +
        `🆔 ID: ${res.id}\n` +
        `👤 Name: ${res.name}\n` +
        `👥 Followers: ${res.subscribers}\n` +
        `✔️ Verified: ${res.verification == "VERIFIED" ? "Yes" : "No"}`;
    
    return reply(teks);
}
break;

case 'closetime': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    let unit = args[1];
    let value = Number(args[0]);
    if (!value) return reply("*Usage:* closetime 10 minute");

    let timer = unit === 'second' ? value * 1000 :
                unit === 'minute' ? value * 60000 :
                unit === 'hour' ? value * 3600000 :
                unit === 'day' ? value * 86400000 : null;
    
    if (!timer) return reply('*Choose:* second, minute, hour, day');

    reply(`⏳ *Closing in ${value} ${unit}*`);

    setTimeout(async () => {
        try {
            await devtrust.groupSettingUpdate(m.chat, 'announcement');
            reply(`🔒 *Group closed* • Only admins can message`);
        } catch (e) {
            reply('❌ Failed: ' + e.message);
        }
    }, timer);
}
break;

case 'opentime': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    let unit = args[1];
    let value = Number(args[0]);
    if (!value) return reply('*Usage:* opentime 5 second');

    let timer = unit === 'second' ? value * 1000 :
                unit === 'minute' ? value * 60000 :
                unit === 'hour' ? value * 3600000 :
                unit === 'day' ? value * 86400000 : null;
    
    if (!timer) return reply('*Choose:* second, minute, hour, day');

    reply(`⏳ *Opening in ${value} ${unit}*`);

    setTimeout(async () => {
        try {
            await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
            reply(`🔓 *Group opened* • Everyone can message`);
        } catch (e) {
            reply('❌ Failed: ' + e.message);
        }
    }, timer);
}
break;

case 'fact': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    try {
        const nyash = await axios.get("https://apis.davidcyriltech.my.id/fact");
        const ilovedavid = nyash.data.fact;
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: ilovedavid
            }),
            { quoted: m }
        );
    } catch (error) {
        reply("❌ *Fact unavailable*");
    }
    break;
}
// [REMOVED DUPLICATE: listonline]

case 'quote': {
    try {
        const res = await fetch('https://zenquotes.io/api/random');
        const json = await res.json();
        const quote = json[0].q;
        const author = json[0].a;
        
        const quoteImg = `https://dummyimage.com/600x400/000/fff.png&text=${encodeURIComponent(`"${quote}"\n\n- ${author}`)}`;
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: quoteImg },
                caption: `_"${quote}"_\n— *${author}*`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Quote failed*');
    }
}
break;

case 'joke': {
    try {
        let res = await fetch('https://v2.jokeapi.dev/joke/Any?type=single'); 
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😂 *Joke*\n\n${data.joke}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Joke failed*');
    }
}
break;

case 'truth': {
    try {
        let res = await fetch('https://api.truthordarebot.xyz/v1/truth');
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😳 *Truth*\n\n❖ ${data.question}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Truth failed*');
    }
}
break;

case 'dare': {
    try {
        let res = await fetch('https://api.truthordarebot.xyz/v1/dare');
        let data = await res.json();
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: 'https://files.catbox.moe/1ntiwc.jpg' },
                caption: `😈 *Dare*\n\n❖ ${data.question}`
            }),
            { quoted: m }
        );
    } catch (err) {
        reply('❌ *Dare failed*');
    }
}
break;

case 'jid': {
    reply(from);
}
break;
// [REMOVED DUPLICATE: bass]
// [REMOVED DUPLICATE: tts]

// ============ ANIME COMMANDS ============
// [REMOVED DUPLICATE: animesearch]

case "manga": {
    if (!text) return reply(`📚 *Manga Search*\nUsage: ${prefix}manga [title]`);
    try {
        reply('⏳ *Searching manga...*');
        const mal = require('mal-scraper');
        const results = await mal.getInfoFromName(text, false, 'manga');
        if (!results) return reply('❌ *Manga not found*');
        const info = `📚 *${results.title}*\n\n` +
            `▸ *Type:* ${results.type || 'N/A'}\n` +
            `▸ *Chapters:* ${results.episodes || 'N/A'}\n` +
            `▸ *Status:* ${results.status || 'N/A'}\n` +
            `▸ *Score:* ⭐ ${results.score || 'N/A'}\n` +
            `▸ *Genres:* ${results.genres?.join(', ') || 'N/A'}\n` +
            `▸ *Synopsis:* ${results.synopsis?.slice(0, 200) || 'N/A'}...`;
        await devtrust.sendMessage(m.chat, {
            image: { url: results.picture },
            caption: info
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "character": {
    if (!text) return reply(`👤 *Anime Character Search*\nUsage: ${prefix}character [name]`);
    try {
        reply('⏳ *Searching character...*');
        const axios = require('axios');
        const res = await axios.get(`https://api.jikan.moe/v4/characters?q=${encodeURIComponent(text)}&limit=1`);
        const char = res.data?.data?.[0];
        if (!char) return reply('❌ *Character not found*');
        const info = `👤 *${char.name}*\n\n` +
            `▸ *Name Kanji:* ${char.name_kanji || 'N/A'}\n` +
            `▸ *Favorites:* ❤️ ${char.favorites || 0}\n` +
            `▸ *About:* ${char.about?.slice(0, 200) || 'N/A'}...`;
        await devtrust.sendMessage(m.chat, {
            image: { url: char.images?.jpg?.image_url },
            caption: info
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "waifu": {
    try {
        const axios = require('axios');
        const res = await axios.get('https://api.waifu.pics/sfw/waifu');
        await devtrust.sendMessage(m.chat, {
            image: { url: res.data.url },
            caption: '🌸 *Random Waifu~*'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "animegif": {
    const categories = ['hug', 'slap', 'kiss', 'pat', 'cry', 'blush', 'smile', 'wave', 'dance', 'poke'];
    const cat = text || categories[Math.floor(Math.random() * categories.length)];
    try {
        const axios = require('axios');
        const res = await axios.get(`https://api.waifu.pics/sfw/${cat}`);
        await devtrust.sendMessage(m.chat, {
            image: { url: res.data.url },
            caption: `🎌 *Anime GIF: ${cat}*`
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}\n_Try: hug, slap, kiss, pat, cry, blush, smile_`); }
}
break;

case "animequote": {
    try {
        const axios = require('axios');
        const res = await axios.get('https://animechan.xyz/api/random');
        const { quote, character, anime } = res.data;
        reply(`🎌 *Anime Quote*\n\n_"${quote}"_\n\n▸ *Character:* ${character}\n▸ *Anime:* ${anime}`);
    } catch (e) {
        const quotes = [
            { quote: "People's lives don't end when they die. It ends when they lose faith.", character: "Itachi Uchiha", anime: "Naruto" },
            { quote: "The world is not beautiful, therefore it is.", character: "Kino", anime: "Kino's Journey" },
            { quote: "If you don't take risks, you can't create a future.", character: "Monkey D. Luffy", anime: "One Piece" }
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        reply(`🎌 *Anime Quote*\n\n_"${q.quote}"_\n\n▸ *Character:* ${q.character}\n▸ *Anime:* ${q.anime}`);
    }
}
break;

case "animenews": {
    try {
        reply('⏳ *Fetching anime news...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/news/anime?limit=5');
        const news = res.data?.data;
        if (!news?.length) return reply('❌ *No news found*');
        let newsText = '📰 *Latest Anime News*\n\n';
        news.forEach((n, i) => {
            newsText += `${i + 1}. *${n.title}*\n_${n.date?.slice(0, 10)}_\n${n.url}\n\n`;
        });
        reply(newsText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "season": {
    try {
        reply('⏳ *Fetching current season anime...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/seasons/now?limit=10');
        const animes = res.data?.data;
        if (!animes?.length) return reply('❌ *No seasonal anime found*');
        let seasonText = '🎌 *Current Season Anime*\n\n';
        animes.forEach((a, i) => {
            seasonText += `${i + 1}. *${a.title}* ⭐ ${a.score || 'N/A'}\n`;
        });
        reply(seasonText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "airing": {
    try {
        reply('⏳ *Fetching airing anime...*');
        const axios = require('axios');
        const res = await axios.get('https://api.jikan.moe/v4/top/anime?filter=airing&limit=10');
        const animes = res.data?.data;
        if (!animes?.length) return reply('❌ *No airing anime found*');
        let airingText = '📺 *Currently Airing Anime*\n\n';
        animes.forEach((a, i) => {
            airingText += `${i + 1}. *${a.title}* ⭐ ${a.score || 'N/A'}\n`;
        });
        reply(airingText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "animerec": {
    const genres = ['Action', 'Romance', 'Comedy', 'Horror', 'Fantasy', 'Sci-Fi', 'Slice of Life'];
    const recs = {
        Action: ['Attack on Titan', 'Demon Slayer', 'Jujutsu Kaisen'],
        Romance: ['Toradora', 'Your Lie in April', 'Fruits Basket'],
        Comedy: ['Konosuba', 'Gintama', 'Nichijou'],
        Horror: ['Another', 'Paranoia Agent', 'Higurashi'],
        Fantasy: ['Re:Zero', 'Sword Art Online', 'Made in Abyss'],
        'Sci-Fi': ['Steins;Gate', 'Psycho-Pass', 'Neon Genesis Evangelion'],
        'Slice of Life': ['Barakamon', 'Yotsuba', 'Aria']
    };
    const genre = text ? genres.find(g => g.toLowerCase() === text.toLowerCase()) : genres[Math.floor(Math.random() * genres.length)];
    const list = recs[genre] || recs[genres[0]];
    reply(`🎌 *Anime Recommendations (${genre})*\n\n${list.map((a, i) => `${i + 1}. ${a}`).join('\n')}`);
}
break;

case "animewatch": {
    if (!text) return reply(`📺 *Anime Watch Guide*\nUsage: ${prefix}animewatch [anime title]`);
    reply(`📺 *Where to Watch: ${text}*\n\n▸ Crunchyroll: https://crunchyroll.com\n▸ Funimation: https://funimation.com\n▸ Netflix: https://netflix.com\n▸ 9anime: https://9anime.to\n▸ Gogoanime: https://gogoanime.tv\n\n_Search "${text}" on any of these platforms_`);
}
break;
// ============ END ANIME COMMANDS ============

case "rwaifu": {
    const imageUrl = `https://apis.davidcyriltech.my.id/random/waifu`;
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: { url: imageUrl },
            caption: "✨ *Random Waifu*"
        }),
        { quoted: m }
    );
}
break;
// [REMOVED DUPLICATE: waifu]

case 'vv':
case 'vvgh': {
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!m.quoted) return reply('📸 *Reply to a view-once media*');

    try {
        const mediaBuffer = await devtrust.downloadMediaMessage(m.quoted);
        if (!mediaBuffer) return reply('❌ *Download failed*');

        const mediaType = m.quoted.mtype;

        if (mediaType === 'imageMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: mediaBuffer,
                    caption: "🖼️ *View-Once Image*"
                }),
                { quoted: m }
            );
        } else if (mediaType === 'videoMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: mediaBuffer,
                    caption: "🎥 *View-Once Video*"
                }),
                { quoted: m }
            );
        } else if (mediaType === 'audioMessage') {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    audio: mediaBuffer,
                    mimetype: 'audio/ogg',
                    ptt: true,
                    caption: "🔊 *View-Once Voice*"
                }),
                { quoted: m }
            );
        }
    } catch (error) {
        console.error('Error:', error);
        reply('❌ *Something went wrong*');
    }
}
break;

case 'vv2':
case 'readviewonce2': {
    if (!m.quoted) {
        return reply(`👁️ *LËGĚNDÃRY BØT View Once*\n\nReply to a view-once media with ${prefix}${command}`);
    }
    
    let mime = (m.quoted.msg || m.quoted).mimetype || '';
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '👁️', key: m.key } });
        
        let media = await m.quoted.download();
        
        // Get bot's number - FIXED
        let botNumber = devtrust.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (/image/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                image: media,
                caption: `🔓 *View-Once Image*\nFrom: ${m.sender.split('@')[0]}`
            });
            reply(`✅ *LËGĚNDÃRY BØT View Once*\n\nImage saved to bot's DM.`);
            
        } else if (/video/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                video: media,
                caption: `🔓 *View-Once Video*\nFrom: ${m.sender.split('@')[0]}`
            });
            reply(`✅ *LËGĚNDÃRY BØT View Once*\n\nVideo saved to bot's DM.`);
            
        } else if (/audio/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                audio: media,
                mimetype: 'audio/mpeg',
                ptt: true
            });
            reply(`✅ *LËGĚNDÃRY BØT View Once*\n\nAudio saved to bot's DM.`);
            
        } else {
            reply(`❌ *LËGĚNDÃRY BØT View Once*\n\nUnsupported media type.`);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (err) {
        console.error('View once error:', err);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *LËGĚNDÃRY BØT View Once*\n\nFailed to process media.`);
    }
}
break;

case '😭': {
    if (!m.quoted) return reply('😐');
    
    let mime = (m.quoted.msg || m.quoted).mimetype || '';
    
    try {
        let media = await m.quoted.download();
        let botNumber = devtrust.user.id.split(':')[0] + '@s.whatsapp.net';
        
        if (/image/.test(mime)) {
            await devtrust.sendMessage(botNumber, { image: media });
            reply('🥲');
        } else if (/video/.test(mime)) {
            await devtrust.sendMessage(botNumber, { video: media });
            reply('🥲');
        } else if (/audio/.test(mime)) {
            await devtrust.sendMessage(botNumber, {
                audio: media,
                mimetype: 'audio/mpeg',
                ptt: true
            });
            reply('🥲');
        } else {
            reply('😶');
        }
    } catch (err) {
        console.error('Ghost error:', err);
        reply('🫠');
    }
}
break;


case 'shorturl': {
    if (!text) return reply('🔗 *Provide a URL*');
    
    try {
        let shortUrl1 = await (await fetch(`https://tinyurl.com/api-create.php?url=${args[0]}`)).text();
        if (!shortUrl1) return reply(`❌ *Failed to shorten URL*`);
        
        reply(`🔗 *Shortened*\n${shortUrl1}`);
    } catch (e) {
        reply('❌ *Error*');
    }
}
break;

case 'unblock': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : 
                m.quoted ? m.quoted.sender : 
                text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await devtrust.updateBlockStatus(users, 'unblock');
    reply(`✅ *User unblocked*`);
}
break;

case 'block': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    let users = m.mentionedJid[0] ? m.mentionedJid[0] : 
                m.quoted ? m.quoted.sender : 
                text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    
    await devtrust.updateBlockStatus(users, 'block');
    reply(`🚫 *User blocked*`);
}
break;

case 'creategc':
case 'creategroup': {
    if (!isCreator) return reply("🔒 *Owner only*");

    const groupName = args.join(" ");
    if (!groupName) return reply(`📝 *Usage:* ${prefix + command} Group Name`);

    try {
        const cret = await devtrust.groupCreate(groupName, []);
        const code = await devtrust.groupInviteCode(cret.id);
        const link = `https://chat.whatsapp.com/${code}`;

        const teks = `✅ *Group Created*\n\n` +
            `💳 Name: ${cret.subject}\n` +
            `👤 Owner: @${cret.owner.split("@")[0]}\n` +
            `🔗 ${link}`;

        devtrust.sendMessage(m.chat, {
            text: teks,
            mentions: [cret.owner]
        }, { quoted: m });

    } catch (e) {
        reply("❌ *Failed to create group*");
    }
}
break;



case "savecontact": 
case "vcf": 
case "scontact": 
case "savecontacts": {
    if (!m.isGroup) {
        return reply("👥 *Groups only*");
    }

    try {
        let metadata = await devtrust.groupMetadata(m.chat);
        let participants = metadata.participants;
        let vcard = "";
        let noPort = 1;

        for (let a of participants) {
            let num = a.id.split("@")[0];
            vcard += `BEGIN:VCARD\nVERSION:3.0\nFN:[${noPort++}] +${num}\nTEL;type=CELL;type=VOICE;waid=${num}:+${num}\nEND:VCARD\n`;
        }

        let filePath = "./contacts.vcf";
        fs.writeFileSync(filePath, vcard.trim());

        await devtrust.sendMessage(m.chat, 
            addNewsletterContext({
                document: fs.readFileSync(filePath),
                mimetype: "text/vcard",
                fileName: `${metadata.subject}.vcf`,
                caption: `📇 *${participants.length} contacts saved*`
            }), 
            { quoted: m }
        );

        fs.unlinkSync(filePath);
    } catch (err) {
        reply("⚠️ Error: " + err.toString());
    }
}
break;

case 'toimg': {
    const quoted = m.quoted ? m.quoted : null;
    const mime = (quoted?.msg || quoted)?.mimetype || '';
    
    if (!quoted) return reply('🖼️ *Reply to a sticker*');
    if (!/webp/.test(mime)) return reply(`❌ *Reply to a sticker with ${prefix}toimg*`);
    
    if (!fs.existsSync('./tmp')) fs.mkdirSync('./tmp');
    
    const media = await devtrust.downloadMediaMessage(quoted);
    const filePath = `./tmp/${Date.now()}.jpg`;
    
    fs.writeFileSync(filePath, media);
    
    await devtrust.sendMessage(m.chat,
        addNewsletterContext({
            image: fs.readFileSync(filePath)
        }),
        { quoted: m }
    );
    
    fs.unlinkSync(filePath);
}
break;

case 'tosticker':
case 'sticker':
case 's': {
    if (!m.quoted) {
        return reply(`🎨 *LËGĚNDÃRY BØT Sticker Maker*\n\nReply to an image or video with:\n${prefix}${command}\n\nVideo limit: Max 10 seconds`);
    }
    
    const mime = (m.quoted.msg || m.quoted).mimetype || '';
    const mediaType = (m.quoted.msg || m.quoted).seconds || 0;
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🎨', key: m.key } });
        
        // Image to sticker
        if (/image/.test(mime)) {
            let media = await m.quoted.download();
            await devtrust.sendImageAsSticker(m.chat, media, m, { 
                packname: global.packname || "LËGĚNDÃRY BØT", 
                author: global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™" 
            });
        }
        
        // Video to animated sticker
        else if (/video/.test(mime)) {
            if (mediaType > 10) return reply('❌ *Video too long!* Max 10 seconds for stickers.');
            let media = await m.quoted.download();
            await devtrust.sendVideoAsSticker(m.chat, media, m, {
                packname: global.packname || "LËGĚNDÃRY BØT",
                author: global.author || "LËGĚNDÃRY Ł𝗮𝗯𝘀™"
            });
        }
        
        else {
            return reply(`❌ *LËGĚNDÃRY BØT Sticker Maker*\n\nInvalid media. Reply to an image or video.\n\nSupported:\n• Images (jpg, png, webp)\n• Videos (mp4, webm, gif) max 10s`);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Sticker error:', error);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        reply(`⚠️ *LËGĚNDÃRY BØT Sticker Maker*\n\nSticker machine is jammed. Try again later.`);
    }
}
break;

case 'ytmp3old': {
    // disabled - duplicate broken handler removed, see 'yta'/'play' below
}
break;

// kick command handled below (see case 'kick'/'remove')

case 'listadmin':
case 'tagadmin':
case 'admin': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");

    const _admins = participants.filter(p => p.admin);
    const listAdmin = _admins.map((v, i) => `${i + 1}. @${v.id.split('@')[0]}`).join('\n');
    const _groupOwner = groupMetadata.owner || 
                 _admins.find(p => p.admin === 'superadmin')?.id || 
                 m.chat.split`-`[0] + '@s.whatsapp.net';

    const adminListMsg = `👑 *Admins*\n\n${listAdmin}`;
    
    devtrust.sendMessage(m.chat, {
        text: adminListMsg,
        mentions: [..._admins.map(v => v.id), _groupOwner]
    }, { quoted: m });
}
break;

// delete/del handled below

// grouplink handled below (see case 'invite'/'grouplink')

case 'tag':
case 'totag': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins/Owner only*");
    if (!m.quoted) return reply(`💬 *Reply to a message with ${prefix + command}*`);

    devtrust.sendMessage(m.chat, {
        forward: m.quoted.fakeObj,
        mentions: participants.map(a => a.id)
    });
}
break;

case 'broadcast': { 
    if (!isCreator) return reply("🔒 *Owner only*");
    if (!q) return reply(`📢 *No broadcast message provided*`);
    
    let getGroups = await devtrust.groupFetchAllParticipating();
    let groups = Object.entries(getGroups).slice(0).map(entry => entry[1]);
    let res = groups.map(v => v.id);
    
    reply(`📨 *Broadcasting to ${res.length} groups*`);
    
    for (let i of res) {
        await devtrust.sendMessage(i, 
            addNewsletterContext({
                image: { url: "https://files.catbox.moe/1ntiwc.jpg" },
                caption: `📢 *Broadcast*\n\n${qtext}`
            })
        );
    }
    
    reply(`✅ *Broadcast sent to ${res.length} groups*`);
} 
break;

// ============ DOWNLOADER COMMANDS ============
case "ytv":
case "video": {
    if (!text) return reply(`🎬 *YouTube Video Downloader*\nUsage: ${prefix}ytv [title or URL]`);
    try {
        reply('⏳ *Searching YouTube...*');
        const yts = require('yt-search');
        let videoUrl = text;
        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const results = await yts(text);
            if (!results.videos.length) return reply('❌ *No results found*');
            videoUrl = results.videos[0].url;
        }
        const ytdl = require('@distube/ytdl-core');
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const duration = info.videoDetails.lengthSeconds;
        if (duration > 1800) return reply('❌ *Video too long (max 30 minutes)*');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
        await devtrust.sendMessage(m.chat, {
            video: { url: format.url },
            caption: `🎬 *${title}*`,
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "yta":
case "play": {
    if (!text) return reply(`🎵 *Music Player*\nUsage: ${prefix}play [song name]`);
    try {
        reply('⏳ *Searching for music...*');

        // Search YouTube for the song
        const yts = require('yt-search');
        const ytResults = await yts(text);
        if (!ytResults.videos.length) return reply('❌ *No results found*');

        const vid = ytResults.videos[0];
        const trackName = vid.title;
        const artistName = vid.author.name;
        const videoUrl = vid.url;
        const duration = vid.seconds;

        if (duration > 1800) return reply('❌ *Audio too long (max 30 minutes)*');

        reply(`🎵 *Found:* ${trackName}\n👤 *${artistName}*\n⏳ *Downloading...*`);

        const videoId = vid.videoId;
        const ytUrl = `https://www.youtube.com/watch?v=${videoId}`;
        const errors = [];

        // Method 1: @distube/ytdl-core (most reliable)
        try {
            const ytdl = require('@distube/ytdl-core');
            const stream = ytdl(ytUrl, { filter: 'audioonly', quality: 'highestaudio' });
            const chunks = [];
            await new Promise((resolve, reject) => {
                stream.on('data', chunk => chunks.push(chunk));
                stream.on('end', resolve);
                stream.on('error', reject);
                setTimeout(() => reject(new Error('ytdl timeout')), 60000);
            });
            const buffer = Buffer.concat(chunks);
            return await devtrust.sendMessage(m.chat, {
                audio: buffer,
                mimetype: 'audio/mpeg',
                fileName: `${trackName}.mp3`,
                ptt: false
            }, { quoted: m });
        } catch (e) { errors.push(`ytdl: ${e.message}`); }

        // Method 2: cobalt.tools
        try {
            const cobaltRes = await axios.post(
                'https://api.cobalt.tools/',
                { url: ytUrl, isAudioOnly: true, aFormat: 'mp3', filenamePattern: 'basic' },
                { headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 20000 }
            );
            const dlUrl = cobaltRes.data?.url;
            if (dlUrl) {
                return await devtrust.sendMessage(m.chat, {
                    audio: { url: dlUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${trackName}.mp3`,
                    ptt: false
                }, { quoted: m });
            }
            errors.push(`cobalt: no url`);
        } catch (e) { errors.push(`cobalt: ${e.message}`); }

        // Method 3: yt-dlp via API
        try {
            const ytApiRes = await axios.get(
                `https://yt-download.org/api/button/mp3/${videoId}`,
                { timeout: 20000 }
            );
            const dlMatch = ytApiRes.data?.match(/href="(https:\/\/[^"]+\.mp3[^"]*)"/);
            if (dlMatch?.[1]) {
                return await devtrust.sendMessage(m.chat, {
                    audio: { url: dlMatch[1] },
                    mimetype: 'audio/mpeg',
                    fileName: `${trackName}.mp3`,
                    ptt: false
                }, { quoted: m });
            }
            errors.push(`yt-download: no link found`);
        } catch (e) { errors.push(`yt-download: ${e.message}`); }

        return reply(`❌ *All download sources failed:*\n${errors.map((e,i) => `${i+1}. ${e}`).join('\n')}\n\n_Try again later or use .yta [youtube link] directly_`);

    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: tt]

case "fb":
case "facebook": {
    if (!text) return reply(`📘 *Facebook Downloader*\nUsage: ${prefix}fb [facebook video URL]`);
    try {
        reply('⏳ *Downloading Facebook video...*');
        const axios = require('axios');
        const res = await axios.get(`https://facebook-reel-and-video-downloader.p.rapidapi.com/app/main.php?url=${encodeURIComponent(text)}`, {
            headers: { 'x-rapidapi-host': 'facebook-reel-and-video-downloader.p.rapidapi.com' }
        });
        const links = res.data?.links;
        if (!links || !links['Download High Quality']) return reply('❌ *Could not fetch Facebook video. Make sure the video is public.*');
        await devtrust.sendMessage(m.chat, {
            video: { url: links['Download High Quality'] },
            caption: '📘 *Facebook Video*',
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "insta":
case "instagram": {
    if (!text) return reply(`📸 *Instagram Downloader*\nUsage: ${prefix}insta [instagram URL]`);
    try {
        reply('⏳ *Downloading Instagram media...*');
        const axios = require('axios');
        const res = await axios.get(`https://saved.vc/api/download?url=${encodeURIComponent(text)}`);
        const medias = res.data?.medias;
        if (!medias?.length) return reply('❌ *Could not fetch Instagram media. Make sure the post is public.*');
        const media = medias[0];
        const isVideo = media.type === 'video';
        await devtrust.sendMessage(m.chat, {
            [isVideo ? 'video' : 'image']: { url: media.url },
            caption: '📸 *Instagram Media*',
            mimetype: isVideo ? 'video/mp4' : 'image/jpeg'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "twitter":
case "twit": {
    if (!text) return reply(`🐦 *Twitter/X Downloader*\nUsage: ${prefix}twitter [tweet URL]`);
    try {
        reply('⏳ *Downloading Twitter video...*');
        const axios = require('axios');
        const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(text)}`);
        const data = res.data;
        if (!data?.video) return reply('❌ *No video found in this tweet*');
        await devtrust.sendMessage(m.chat, {
            video: { url: data.video },
            caption: '🐦 *Twitter Video*',
            mimetype: 'video/mp4'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gdrive": {
    if (!text) return reply(`💾 *Google Drive Downloader*\nUsage: ${prefix}gdrive [drive URL]`);
    try {
        reply('⏳ *Fetching Google Drive file...*');
        const axios = require('axios');
        const fileId = text.match(/[-\w]{25,}/)?.[0];
        if (!fileId) return reply('❌ *Invalid Google Drive URL*');
        const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
        await devtrust.sendMessage(m.chat, {
            document: { url: downloadUrl },
            mimetype: 'application/octet-stream',
            fileName: 'gdrive_file'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "pint":
case "pinterest": {
    if (!text) return reply(`📌 *Pinterest Downloader*\nUsage: ${prefix}pint [pinterest URL or search term]`);
    try {
        reply('⏳ *Fetching Pinterest media...*');
        const axios = require('axios');
        const res = await axios.get(`https://api.ryzendesu.vip/api/downloader/pinterest?url=${encodeURIComponent(text)}`);
        const url = res.data?.url || res.data?.data?.url;
        if (!url) return reply('❌ *Could not fetch Pinterest media*');
        const isVideo = url.includes('.mp4') || url.includes('video');
        await devtrust.sendMessage(m.chat, {
            [isVideo ? 'video' : 'image']: { url },
            caption: '📌 *Pinterest Media*',
            mimetype: isVideo ? 'video/mp4' : 'image/jpeg'
        }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "autodl": {
    if (!text) return reply(`⬇️ *Auto Downloader*\nUsage: ${prefix}autodl [URL]\n_Supports: YouTube, TikTok, Instagram, Twitter, Facebook, Pinterest_`);
    try {
        reply('⏳ *Detecting URL and downloading...*');
        if (text.includes('youtube.com') || text.includes('youtu.be')) {
            const ytdl = require('@distube/ytdl-core');
            const info = await ytdl.getInfo(text);
            const format = ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' });
            await devtrust.sendMessage(m.chat, {
                audio: { url: format.url },
                mimetype: 'audio/mpeg',
                fileName: `${info.videoDetails.title}.mp3`
            }, { quoted: m });
        } else if (text.includes('tiktok.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(text)}`);
            const videoUrl = res.data?.video?.noWatermark;
            if (!videoUrl) return reply('❌ *Could not download TikTok*');
            await devtrust.sendMessage(m.chat, { video: { url: videoUrl }, mimetype: 'video/mp4', caption: '🎵 TikTok' }, { quoted: m });
        } else if (text.includes('instagram.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://saved.vc/api/download?url=${encodeURIComponent(text)}`);
            const media = res.data?.medias?.[0];
            if (!media) return reply('❌ *Could not download Instagram media*');
            const isVid = media.type === 'video';
            await devtrust.sendMessage(m.chat, { [isVid ? 'video' : 'image']: { url: media.url }, caption: '📸 Instagram' }, { quoted: m });
        } else if (text.includes('twitter.com') || text.includes('x.com')) {
            const axios = require('axios');
            const res = await axios.get(`https://twitsave.com/info?url=${encodeURIComponent(text)}`);
            if (!res.data?.video) return reply('❌ *No video found*');
            await devtrust.sendMessage(m.chat, { video: { url: res.data.video }, mimetype: 'video/mp4', caption: '🐦 Twitter' }, { quoted: m });
        } else {
            reply('❌ *Unsupported URL*\n_Supported: YouTube, TikTok, Instagram, Twitter/X_');
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// ============ END DOWNLOADER COMMANDS ============

case "spotify":
case "spotifydl":
case "sp": {
    if (!text) {
        return reply(`🎧 *Spotify*\n\nUsage: ${prefix}spotify [spotify_track_link]\nExample: ${prefix}spotify https://open.spotify.com/track/xxxxx`);
    }
    
    // Validate Spotify URL
    if (!text.includes('open.spotify.com/track/')) {
        return reply(`❌ *Spotify*\n\nInvalid Spotify track link. Please provide a valid track URL.`);
    }
    
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🎧', key: m.key } });
        
        reply(`🔍 *LËGĚNDÃRY BØT Spotify*\n\nFetching track: ${text.split('/track/')[1]?.substring(0, 10)}...`);
        
        const response = await axios.get(`https://api.dreaded.site/api/spotifydl`, {
            params: {
                url: text
            },
            timeout: 30000
        });
        
        if (response.data.success && response.data.result) {
            const result = response.data.result;
            
            // Send audio with rich preview
            await devtrust.sendMessage(m.chat, 
                addNewsletterContext({
                    audio: { url: result.download_url || result.downloadMP3 },
                    mimetype: 'audio/mpeg',
                    fileName: `${result.title}.mp3`,
                    contextInfo: {
                        externalAdReply: {
                            title: result.title,
                            body: `🎧 ${result.type || 'Track'}`,
                            thumbnailUrl: result.image,
                            mediaType: 1,
                            renderLargerThumbnail: true,
                            sourceUrl: text
                        }
                    }
                }), 
                { quoted: m }
            );
            
            await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
            
        } else {
            throw new Error('No download link found');
        }
        
    } catch (error) {
        console.error('Spotify error:', error.message);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
        
        if (error.response?.status === 404) {
            return reply(`❌ *Spotify*\n\nTrack not found. Check the link and try again.`);
        }
        
        reply(`⚠️ *Spotify*\n\nSpotify service is on break. Try again later.`);
    }
}
break;

case 'tagall': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    if (!m.isGroup) return reply("👥 *Groups only*");

    const textMessage = args.join(" ") || "No message";
    let teks = `🏷️ *Tag All*\n\n📝 ${textMessage}\n\n`;

    const groupMetadata = await devtrust.groupMetadata(m.chat);
    const participants = groupMetadata.participants;

    for (let mem of participants) {
        teks += `@${mem.id.split("@")[0]}\n`;
    }

    devtrust.sendMessage(m.chat, {
        text: teks,
        mentions: participants.map((a) => a.id)
    }, { quoted: m });
}
break;

case 'hidetag': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    const groupMetadata = await devtrust.groupMetadata(m.chat);
    const participants = groupMetadata.participants;
    
    devtrust.sendMessage(m.chat, {
        text: q || ' ',
        mentions: participants.map(a => a.id)
    }, { quoted: m });
}
break;

case 'promote': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    let users = m.mentionedJid[0] || m.quoted?.sender || text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await devtrust.groupParticipantsUpdate(m.chat, [users], 'promote');
    reply("👑 *User promoted to admin*");
}
break;

case 'demote': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    let users = m.mentionedJid[0] || m.quoted?.sender || text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await devtrust.groupParticipantsUpdate(m.chat, [users], 'demote');
    reply("⬇️ *User demoted from admin*");
}
break;

case 'mute': {
    if (!m.isGroup) return reply("👥 *Groups only*");
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    
    await devtrust.groupSettingUpdate(m.chat, 'announcement');
    reply("🔇 *Group muted* • Only admins can message");
}
break;

case 'unmute': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    if (!m.isGroup) return reply("👥 *Groups only*");
    
    await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
    reply("🔊 *Group unmuted* • Everyone can message");
}
break;

case 'left':
case 'leave': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    // Send message first
    await reply("👋 *Left group* • Goodbye!");
    
    // Then leave the group
    await devtrust.groupLeave(m.chat);
}
break;

case 'add': {
    if (!isAdmins && !isCreator) return reply("🔒 *Admins only*");
    if (!m.isGroup) return reply("👥 *Groups only*");

    let users = m.quoted?.sender || text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
    await devtrust.groupParticipantsUpdate(m.chat, [users], 'add');
    reply("✅ *User added to group*");
}
break;

case 'setpp': {
    if (!isCreator) return reply('🔒 *Owner only*');
    if (!quoted || !/image/.test(mime)) return reply(`🖼️ *Reply to an image with ${prefix}setpp*`);
    
    let media = await quoted.download();
    await devtrust.updateProfilePicture(botNumber, media);
    reply('✅ *Profile picture updated*');
}
break;

// ============ AI COMMANDS ============
case "openai":
case "gpt": {
    if (!text) return reply(`🤖 *OpenAI GPT*\nUsage: ${prefix}openai [question]`);
    try {
        reply('🤖 *Thinking...*');
        const res = await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from OpenAI*');
        reply(`🤖 *OpenAI GPT*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gemini": {
    if (!text) return reply(`✨ *Gemini AI*\nUsage: ${prefix}gemini [question]`);
    try {
        reply('✨ *Gemini is thinking...*');
        const res = await fetch(`https://apis.prexzyvilla.site/ai/gemini?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from Gemini*');
        reply(`✨ *Gemini AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mistral": {
    if (!text) return reply(`🌪️ *Mistral AI*\nUsage: ${prefix}mistral [question]`);
    try {
        reply('🌪️ *Mistral is thinking...*');
        const res = await fetch(`https://apis.prexzyvilla.site/ai/mistral?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from Mistral*');
        reply(`🌪️ *Mistral AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "deepseek": {
    if (!text) return reply(`🔍 *DeepSeek AI*\nUsage: ${prefix}deepseek [question]`);
    try {
        reply('🔍 *DeepSeek is thinking...*');
        const res = await fetch(`https://apis.prexzyvilla.site/ai/deepseek?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from DeepSeek*');
        reply(`🔍 *DeepSeek AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "llama": {
    if (!text) return reply(`🦙 *LLaMA AI*\nUsage: ${prefix}llama [question]`);
    try {
        reply('🦙 *LLaMA is thinking...*');
        const res = await fetch(`https://apis.prexzyvilla.site/ai/llama?text=${encodeURIComponent(text)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from LLaMA*');
        reply(`🦙 *LLaMA AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "reasoning": {
    if (!text) return reply(`🧠 *AI Reasoning*\nUsage: ${prefix}reasoning [problem]`);
    try {
        reply('🧠 *Analyzing your problem...*');
        const axios = require('axios');
        const res = await axios.post('https://api.openai.com/v1/chat/completions', {
            model: 'gpt-4o-mini',
            messages: [
                { role: 'system', content: 'You are a step-by-step reasoning assistant. Break down problems logically.' },
                { role: 'user', content: text }
            ]
        }, { headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY || ''}`, 'Content-Type': 'application/json' } })
        .catch(async () => {
            // Fallback to free API
            return await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=Reason step by step: ${encodeURIComponent(text)}`).then(r => r.json());
        });
        const answer = res?.data?.choices?.[0]?.message?.content || res?.data || res?.result;
        if (!answer) return reply('❌ *Could not process reasoning*');
        reply(`🧠 *AI Reasoning*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "coder": {
    if (!text) return reply(`💻 *AI Coder*\nUsage: ${prefix}coder [coding question or task]`);
    try {
        reply('💻 *Writing code...*');
        const prompt = `You are an expert programmer. Write clean, commented code for: ${text}`;
        const res = await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=${encodeURIComponent(prompt)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *Could not generate code*');
        reply(`💻 *AI Coder*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "aisearch": {
    if (!text) return reply(`🔎 *AI Search*\nUsage: ${prefix}aisearch [query]`);
    try {
        reply('🔎 *Searching with AI...*');
        const axios = require('axios');
        const res = await axios.get(`https://google-it.vercel.app/api?q=${encodeURIComponent(text)}`).catch(() => null);
        if (!res?.data?.length) {
            const fallback = await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=Search and summarize: ${encodeURIComponent(text)}`).then(r => r.json());
            return reply(`🔎 *AI Search: ${text}*\n\n${fallback?.data || 'No results found'}`);
        }
        const results = res.data.slice(0, 3);
        let searchText = `🔎 *Search Results: ${text}*\n\n`;
        results.forEach((r, i) => {
            searchText += `${i + 1}. *${r.title}*\n${r.snippet}\n${r.link}\n\n`;
        });
        reply(searchText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "bidara": {
    if (!text) return reply(`🕌 *Bidara Islamic AI*\nUsage: ${prefix}bidara [Islamic question]`);
    try {
        reply('🕌 *Bidara is thinking...*');
        const prompt = `You are Bidara, an Islamic AI assistant. Answer this Islamic question with Quran/Hadith references where possible: ${text}`;
        const res = await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=${encodeURIComponent(prompt)}`);
        const json = await res.json();
        const answer = json?.data || json?.result || json?.response;
        if (!answer) return reply('❌ *No response from Bidara*');
        reply(`🕌 *Bidara Islamic AI*\n\n${answer}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// ============ END AI COMMANDS ============

case "gpt4": {
    const chatId = m.key.remoteJid;
    let query = args.join(" ").trim();
    
    try {
        if (!query && m.message && m.message.extendedTextMessage && 
            m.message.extendedTextMessage.contextInfo && 
            m.message.extendedTextMessage.contextInfo.quotedMessage) {
            
            const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.conversation) query = quoted.conversation;
            else if (quoted.extendedTextMessage && quoted.extendedTextMessage.text) 
                query = quoted.extendedTextMessage.text;
        }

        if (!query) {
            return reply("🤖 *Usage:* gpt4 your question");
        }

        const res = await fetch(`https://apis.prexzyvilla.site/ai/gpt4?text=${encodeURIComponent(query)}`);
        if (!res.ok) return reply(`⚠️ *API error* • ${res.status}`);

        const json = await res.json();
        const answer = json?.data || "";

        if (!answer) return reply("⚠️ *No response from GPT-4*");

        const chunks = answer.match(/[\s\S]{1,3000}/g) || [answer];
        
        for (let i = 0; i < chunks.length; i++) {
            const header = i === 0 ? "🤖 *GPT-4*\n\n" : "";
            await devtrust.sendMessage(chatId, { text: header + chunks[i] });
        }
    } catch (err) {
        console.error("gpt4 command error:", err);
        reply("⚠️ *GPT-4 unavailable* • Try later");
    }
}
break;

case 'mode': {
    reply(`🔹 *Mode:* ${devtrust.public ? 'Public' : 'Private'}`);
}
break;

case 'ping':
case 'speed': {
    const speed = require('performance-now');
    const timestampp = speed();
    const latensi = speed() - timestampp;
    
    reply(`*LËGĚNDÃRY BØT Ping*\n\n📡 ${latensi.toFixed(4)} ms *By LËGĚNDÃRY Ł𝗮𝗯𝘀™*`);
}
break;

case 'runtime':
case 'alive': {
    reply(`*LËGĚNDÃRY BØT Uptime*\n\n ${runtime(process.uptime())}`);
}
break;

case 'public': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    setSetting("bot", "mode", "public");
    devtrust.public = true;
    reply("🌍 *Public mode activated*\nEveryone can use the bot");
}
break;

case 'private':
case 'self': {
    if (!isCreator) return reply("🔒 *Owner only*");
    
    setSetting("bot", "mode", "self");
    devtrust.public = false;
    reply("🔐 *Private mode activated*\nOnly owner can use the bot");
}
break;
  
case 'imbd': {
    if (!text) return reply(`🎬 *Enter a movie or series name*`);
    
    try {
        let fids = await axios.get(`http://www.omdbapi.com/?apikey=742b2d09&t=${text}&plot=full`);
        
        let imdbt = `🎬 *${fids.data.Title}* (${fids.data.Year})\n\n` +
            `⭐ Rating: ${fids.data.imdbRating}/10\n` +
            `⏳ Runtime: ${fids.data.Runtime}\n` +
            `🎭 Genre: ${fids.data.Genre}\n` +
            `📅 Released: ${fids.data.Released}\n` +
            `👤 Director: ${fids.data.Director}\n` +
            `👥 Cast: ${fids.data.Actors}\n\n` +
            `📝 ${fids.data.Plot.substring(0, 300)}...`;
        
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                image: { url: fids.data.Poster },
                caption: imdbt
            }),
            { quoted: m }
        );
    } catch (e) {
        reply("❌ *Movie not found*");
    }
    break;
}

case 'tiktoksearch': {
    if (!text) return reply("🎵 *Enter a search term*");

    try {
        let query = text;
        let url = `https://apis.prexzyvilla.site/search/tiktoksearch?q=${encodeURIComponent(query)}`;
        let response = await fetch(url);
        let json = await response.json();

        if (!json.status || !json.data || json.data.length === 0) {
            return reply("❌ *No results found*");
        }

        let videos = json.data.slice(0, 3);

        for (let i = 0; i < videos.length; i++) {
            let vid = videos[i];
            let date = new Date(vid.create_time * 1000);
            let info = `🎵 *TikTok #${i+1}*\n\n` +
                `👍 ${vid.digg_count} likes\n` +
                `👀 ${vid.play_count} views\n` +
                `📝 ${vid.title}\n` +
                `📅 ${date.toDateString()}`;

            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: { url: vid.play },
                    caption: info
                }),
                { quoted: m }
            );
        }
    } catch (err) {
        console.log(err);
        reply("❌ *Error fetching TikTok data*");
    }
}
break;
// [REMOVED DUPLICATE: pinterest]


case 'nsbxmdmfw': {
    try {
        const apiUrl = 'https://draculazyx-xyzdrac.hf.space/api/hentai';
        const response = await fetch(apiUrl);

        if (!response.ok) throw new Error(`HTTP ${response.status}`);

        const data = await response.json();

        if (data && data.videoUrl) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    video: { url: data.videoUrl },
                    caption: `🎥 *${data.title || 'Video'}*\n⚠️ 18+ Content`
                }),
                { quoted: m }
            );
        } else {
            reply("❌ *Content unavailable*");
        }
    } catch (error) {
        console.error(error);
        reply("⚠️ *Error fetching content*");
    }
}
break;


// ==================== PAIRING COMMANDS FOR WHATSAPP BOT ====================

case 'pair': {
    await devtrust.sendMessage(m.chat, { react: { text: '🔗', key: m.key } });
    
    if (!q) return reply(`📌 *Usage:* pair 234xxxxxxx`);

    let target = text.split("|")[0];
    let cleanNumber = target.replace(/[^0-9]/g, '');
    
    // Validate number
    if (!/^\d{7,15}$/.test(cleanNumber)) {
        return reply("❌ *Invalid phone number format*");
    }

    // Check if number exists on WhatsApp
    try {
        const contactInfo = await devtrust.onWhatsApp(cleanNumber + '@s.whatsapp.net');
        if (!contactInfo || contactInfo.length === 0) {
            return reply("❌ *Number not registered on WhatsApp*");
        }
    } catch (e) {
        console.log('WhatsApp check error:', e);
    }

    // Create pairing directory if it doesn't exist
    const WHATSAPP_PAIRING_DIR = './database/pairing/';
    if (!fs.existsSync(WHATSAPP_PAIRING_DIR)) {
        fs.mkdirSync(WHATSAPP_PAIRING_DIR, { recursive: true });
    }

    // Send processing message
    const processingMsg = await devtrust.sendMessage(m.chat, {
        text: `🔗 *Generating pairing code for +${cleanNumber}*\n⏳ Please wait...`
    }, { quoted: m });

    try {
        // Load the pair module (same as Telegram bot)
        const startPairing = require('./pair');
        const jid = cleanNumber + '@s.whatsapp.net';
        
        // Start pairing (this will generate code and save to file)
        await startPairing(jid);
        
        // Wait 4 seconds (same as Telegram bot)
        await sleep(4000);

        // Read the pairing file (same as Telegram bot)
        const pairingFile = path.join(__dirname, 'nexstore', 'pairing', 'pairing.json');
        
        if (!fs.existsSync(pairingFile)) {
            throw new Error('Pairing file not found');
        }
        
        const cu = fs.readFileSync(pairingFile, 'utf-8');
        const cuObj = JSON.parse(cu);
        const pairingCode = cuObj.code;

        if (!pairingCode) {
            throw new Error('No code found in pairing file');
        }

        // Format the code nicely
        let formattedCode = pairingCode;
        if (!pairingCode.includes('-') && pairingCode.length > 4) {
            formattedCode = pairingCode.match(/.{1,4}/g).join('-');
        }

        // Save pairing data to WhatsApp directory
        const pairingData = {
            jid: jid,
            number: cleanNumber,
            code: pairingCode,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            status: 'pending',
            pairedBy: m.sender
        };
        
        fs.writeFileSync(
            path.join(WHATSAPP_PAIRING_DIR, `${cleanNumber}@s.whatsapp.net.json`), 
            JSON.stringify(pairingData, null, 2)
        );

        // Delete processing message
        await devtrust.sendMessage(m.chat, { delete: processingMsg.key });

        // Send code (FIRST MESSAGE)
        await devtrust.sendMessage(m.chat, { 
            text: `🔑 *YOUR PAIRING CODE*\n\n\`${formattedCode}\`` 
        }, { quoted: m });

        // Send instructions (SECOND MESSAGE)
        const instructions = `📱 *Pairing Steps*\n\n` +
            `1️⃣ Open WhatsApp on your phone\n` +
            `2️⃣ Tap *⋮* (Menu) → Linked Devices\n` +
            `3️⃣ Tap *Link a Device*\n` +
            `4️⃣ Enter this code: \`${formattedCode}\`\n\n` +
            `_⏱️ Code expires in 5 minutes_`;

        await devtrust.sendMessage(m.chat, { text: instructions }, { quoted: m });

        // Send code again (THIRD MESSAGE)
        await devtrust.sendMessage(m.chat, { 
            text: `${formattedCode}`
        }, { quoted: m });

    } catch (error) {
        console.error('Pairing error:', error);
        
        // Delete processing message
        await devtrust.sendMessage(m.chat, { delete: processingMsg.key });
        
        // Send error message
        await reply(`❌ *Pairing Failed*\n\n${error.message || 'Could not generate code. Try again later.'}`);
    }
}
break;

case "gpt5": {
    const chatId = m.key.remoteJid;
    let query = args.join(" ").trim();

    try {
        if (!query && m.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const quoted = m.message.extendedTextMessage.contextInfo.quotedMessage;
            if (quoted.conversation) query = quoted.conversation;
            else if (quoted.extendedTextMessage?.text) query = quoted.extendedTextMessage.text;
        }

        if (!query) return reply("🤖 *Usage:* gpt5 your question");

        const res = await fetch(`https://apis.prexzyvilla.site/ai/gpt5?text=${encodeURIComponent(query)}`);
        if (!res.ok) return reply(`⚠️ *API error ${res.status}*`);

        const json = await res.json();
        const answer = json?.result || "";

        if (!answer) return reply("⚠️ *No response from GPT-5*");

        const chunks = answer.match(/[\s\S]{1,3000}/g) || [answer];
        
        for (let i = 0; i < chunks.length; i++) {
            const header = i === 0 ? "🤖 *GPT-5*\n\n" : "";
            await devtrust.sendMessage(chatId, { text: header + chunks[i] });
        }
    } catch (err) {
        console.error(err);
        reply("⚠️ *GPT-5 unavailable*");
    }
}
break;

case "lyrics": {
    const chatId = m.key.remoteJid;
    const query = args.join(" ");
    
    if (!query) return reply("🎵 *Usage:* lyrics song title");

    try {
        const res = await fetch(`https://apis.prexzyvilla.site/search/lyrics?title=${encodeURIComponent(query)}`);
        const json = await res.json();

        if (!json.status || !json.data || !json.data.lyrics) {
            return reply(`❌ *Lyrics not found for "${query}"*`);
        }

        const { title, artist, album, lyrics } = json.data;
        const chunks = lyrics.match(/[\s\S]{1,3500}/g) || [lyrics];

        for (let i = 0; i < chunks.length; i++) {
            const header = i === 0 ? `🎵 *${title}* – *${artist}*\n📀 ${album || 'Unknown'}\n\n` : "";
            await devtrust.sendMessage(chatId, { text: header + chunks[i] });
        }
    } catch (err) {
        console.error(err);
        reply("⚠️ *Lyrics fetch failed*");
    }
}
break;
// [REMOVED DUPLICATE: take]

// ============ MOVIE COMMANDS ============
case 'movie2': {
    if (!text) return reply(`🎬 *Usage:* ${prefix + command} movie name`);

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        await reply(`🔍 *Searching for "${text}"...*`);
        
        const apiUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/search?text=${encodeURIComponent(text)}`;
        const response = await axios.get(apiUrl);
        const { status, result } = response.data;

        if (!status || !result || result.movies.length === 0) {
            return reply(`❌ *No movies found for "${text}"*`);
        }

        // Store results for THIS USER only
        userMovieSessions[m.sender] = {
            movies: result.movies,
            timestamp: Date.now()
        };

        let movieList = `🎥 *Results for "${text}"*\n\n`;
        result.movies.slice(0, 5).forEach((movie, index) => {
            movieList += `${index + 1}. *${movie.title}*\n`;
            movieList += `   ⭐ ${movie.imdb || 'N/A'} | 📅 ${movie.year || 'N/A'}\n\n`;
        });
        
        if (result.movies.length > 5) {
            movieList += `_...and ${result.movies.length - 5} more_\n\n`;
        }
        
        movieList += `📌 *Select:* .selectmovie [number]`;

        await reply(movieList);
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie search error:', error);
        reply(`❌ *Search failed* • Try again later`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;

case 'selectmovie': {
    if (!text) return reply(`🎬 *Usage:* selectmovie [number]`);
    
    const userSession = userMovieSessions[m.sender];
    if (!userSession || !userSession.movies || userSession.movies.length === 0) {
        return reply(`❌ *No movies found. Use .movie command first*`);
    }

    const selectedIndex = parseInt(text.trim()) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userSession.movies.length) {
        return reply(`❌ *Invalid number* • Choose 1-${userSession.movies.length}`);
    }

    const selectedMovie = userSession.movies[selectedIndex];
    const movieDetailsUrl = `https://www.dark-yasiya-api.site/movie/sinhalasub/movie?url=${encodeURIComponent(selectedMovie.link)}`;

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '🔍', key: m.key } });
        await reply(`🔍 *Fetching details for "${selectedMovie.title}"...*`);
        
        const response = await axios.get(movieDetailsUrl);
        const { status, result } = response.data;

        if (!status || !result) return reply(`❌ *Failed to fetch details*`);

        const movie = result.data;
        
        // Store download links for THIS USER
        userSession.selectedMovie = {
            title: movie.title,
            links: movie.dl_links || []
        };

        let movieInfo = `🎬 *${movie.title}*\n\n` +
            `📅 ${movie.date || 'N/A'}\n` +
            `🌍 ${movie.country || 'N/A'}\n` +
            `⏳ ${movie.runtime || 'N/A'}\n` +
            `⭐ ${movie.imdbRate || 'N/A'}/10\n\n` +
            `📥 *Available Qualities*\n`;

        if (movie.dl_links && movie.dl_links.length > 0) {
            movie.dl_links.forEach((link, index) => {
                movieInfo += `${index + 1}. ${link.quality || 'Unknown'} - ${link.size || 'N/A'}\n`;
            });
            movieInfo += `\n📌 *Download:* .dlmovie [number]`;
        } else {
            movieInfo += `No download links available`;
        }

        // Send poster if available
        if (movie.image) {
            await devtrust.sendMessage(m.chat,
                addNewsletterContext({
                    image: { url: movie.image },
                    caption: movieInfo
                }),
                { quoted: m }
            );
        } else {
            await reply(movieInfo);
        }
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie details error:', error);
        reply(`❌ *Failed to fetch movie details*`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;

case 'dlmovie': {
    if (!text) return reply(`📥 *Usage:* dlmovie [number]`);
    
    const userSession = userMovieSessions[m.sender];
    if (!userSession || !userSession.selectedMovie || !userSession.selectedMovie.links) {
        return reply(`❌ *No movie selected. Use .selectmovie first*`);
    }

    const selectedIndex = parseInt(text.trim()) - 1;
    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= userSession.selectedMovie.links.length) {
        return reply(`❌ *Invalid number* • Choose 1-${userSession.selectedMovie.links.length}`);
    }

    const selectedLink = userSession.selectedMovie.links[selectedIndex]?.link;
    if (!selectedLink) return reply(`❌ *Download link not found*`);

    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏳', key: m.key } });
        await reply(`⏳ *Downloading "${userSession.selectedMovie.title}"...*\nQuality: ${selectedLink.quality || 'Unknown'}\nSize: ${selectedLink.size || 'Unknown'}`);

        // Send as document
        await devtrust.sendMessage(m.chat,
            addNewsletterContext({
                document: { url: selectedLink },
                mimetype: 'video/mp4',
                fileName: `${userSession.selectedMovie.title}.mp4`,
                caption: `🎬 *${userSession.selectedMovie.title}*`
            }),
            { quoted: m }
        );
        
        await devtrust.sendMessage(m.chat, { react: { text: '✅', key: m.key } });
        
    } catch (error) {
        console.error('Movie download error:', error);
        reply(`❌ *Download failed* • Try again later`);
        await devtrust.sendMessage(m.chat, { react: { text: '❌', key: m.key } });
    }
}
break;
// [REMOVED DUPLICATE: fb]
// [REMOVED DUPLICATE: instagram]

// ============================================================
// =================== NEW COMMANDS BLOCK ====================
// ============================================================

// ============ PROFILE PIC COMMANDS ============
case "pp":
case "getpp": {
    const target = m.mentionedJid?.[0] || m.quoted?.sender || m.sender;
    try {
        const ppUrl = await devtrust.profilePictureUrl(target, 'image');
        await devtrust.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: `🖼️ *Profile Picture*\n▸ @${target.replace('@s.whatsapp.net', '')}`,
            mentions: [target]
        }, { quoted: m });
    } catch (e) {
        reply(`❌ *No profile picture found*\n_They may have hidden it_`);
    }
}
break;

case "gpp": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    try {
        const ppUrl = await devtrust.profilePictureUrl(m.chat, 'image');
        const meta = await devtrust.groupMetadata(m.chat);
        await devtrust.sendMessage(m.chat, {
            image: { url: ppUrl },
            caption: `🖼️ *Group Profile Picture*\n▸ ${meta.subject}`
        }, { quoted: m });
    } catch (e) {
        reply('❌ *No group profile picture found*');
    }
}
break;

// ============ SCREENSHOT COMMANDS ============
case "ss": {
    if (!text) return reply(`📸 *Screenshot*\nUsage: ${prefix}ss [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=desktop`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🖥️ *Desktop Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "sstab": {
    if (!text) return reply(`📸 *Screenshot (Tablet)*\nUsage: ${prefix}sstab [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=tablet`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📱 *Tablet Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "ssphone": {
    if (!text) return reply(`📸 *Screenshot (Phone)*\nUsage: ${prefix}ssphone [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=phone`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📱 *Mobile Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "ssfull": {
    if (!text) return reply(`📸 *Screenshot (Full Page)*\nUsage: ${prefix}ssfull [url]`);
    try {
        await devtrust.sendMessage(m.chat, { react: { text: '⏰', key: m.key } });
        const url = text.startsWith('http') ? text : `https://${text}`;
        const res = await fetch(`https://api-rebix.zone.id/api/ssweb?url=${encodeURIComponent(url)}&device=full`);
        const buffer = Buffer.from(await res.arrayBuffer());
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '📄 *Full Page Screenshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ AI COMMANDS (OpenRouter) ============
// [REMOVED DUPLICATE: openai]
// [REMOVED DUPLICATE: gemini]
// [REMOVED DUPLICATE: mistral]
// [REMOVED DUPLICATE: deepseek]
// [REMOVED DUPLICATE: llama]
// [REMOVED DUPLICATE: reasoning]
// [REMOVED DUPLICATE: coder]
// [REMOVED DUPLICATE: aisearch]
// [REMOVED DUPLICATE: bidara]

// ============ WEATHER ============
case "weatherdetail": {
    if (!text) return reply(`🌤️ *Weather Detail*\nUsage: ${prefix}weatherdetail [city/country]`);
    try {
        reply('⏳ *Fetching weather...*');
        const res = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(text)}&units=metric&appid=060a6bcfa19809c2cd4d97a212b19273`);
        const w = res.data;
        const sunrise = new Date(w.sys.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        const sunset = new Date(w.sys.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        reply(`\`\`\`
✤ Weather Report ✤
➥ Location    : ${w.name} (${w.sys.country})
➥ Condition   : ${w.weather[0].main} - ${w.weather[0].description}
✽ Temperature : ${w.main.temp}°C (Feels like ${w.main.feels_like}°C)
✱ Min/Max     : ${w.main.temp_min}°C / ${w.main.temp_max}°C
✚ Humidity    : ${w.main.humidity}%
➙ Wind        : ${w.wind.speed} m/s
✽ Cloud Cover : ${w.clouds.all}%
♜ Sunrise     : ${sunrise}
♜ Sunset      : ${sunset}
\`\`\``);
    } catch (e) { reply(`❌ *City not found:* ${text}`); }
}
break;

// ============ READMORE ============
case "readmore": {
    const txt = text || m.quoted?.text;
    if (!txt) return reply(`Usage: ${prefix}readmore text |readmore| hidden text`);
    const readmoreChar = String.fromCharCode(8206).repeat(4001);
    const rtext = txt.replace(/(\|readmore\|)/i, readmoreChar);
    await devtrust.sendMessage(m.chat, { text: rtext }, { quoted: m });
}
break;

// ============ WALINK ============
case "walink":
case "wlink": {
    let num;
    if (m.mentionedJid?.[0]) num = m.mentionedJid[0].replace(/[^0-9]/g, '');
    else if (m.quoted?.sender) num = m.quoted.sender.replace(/[^0-9]/g, '');
    else if (text) num = text.replace(/[^0-9]/g, '');
    else num = m.sender.replace(/[^0-9]/g, '');
    reply(`🔗 *WhatsApp Link:*\nhttps://wa.me/${num}`);
}
break;

// ============ IP LOOKUP ============
case "ip": {
    if (!text) return reply(`🌐 *IP Lookup*\nUsage: ${prefix}ip [ip address]`);
    try {
        const res = await axios.get(`https://ipapi.co/${text}/json/`);
        const d = res.data;
        if (d.error) return reply(`❌ *Invalid IP:* ${text}`);
        reply(`🌐 *IP Lookup: ${text}*\n\n▸ *Country:* ${d.country_name} ${d.country_code}\n▸ *City:* ${d.city}\n▸ *Region:* ${d.region}\n▸ *ISP:* ${d.org}\n▸ *Timezone:* ${d.timezone}\n▸ *Currency:* ${d.currency}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ WIKIPEDIA ============
case "wiki":
case "wikipedia": {
    if (!text) return reply(`📖 *Wikipedia*\nUsage: ${prefix}wiki [topic]`);
    try {
        reply('⏳ *Searching Wikipedia...*');
        const res = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(text)}`);
        const d = res.data;
        if (d.type === 'disambiguation') return reply(`❌ *Ambiguous term. Try being more specific.*`);
        reply(`📖 *${d.title}*\n\n${d.extract}\n\n🔗 ${d.content_urls?.desktop?.page}`);
    } catch (e) { reply(`❌ *Not found:* ${text}`); }
}
break;

// ============ TINYURL ============
case "tinyurl":
case "shorten": {
    if (!text) return reply(`🔗 *URL Shortener*\nUsage: ${prefix}tinyurl [url]`);
    try {
        const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`);
        reply(`🔗 *Shortened URL:*\n${res.data}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ TRANSLATE ============
case "trt":
case "translate": {
    if (!text) return reply(`🌍 *Translate*\nUsage: ${prefix}translate [lang] [text]\nExample: ${prefix}translate es Hello World`);
    try {
        const parts = text.split(' ');
        const lang = parts[0];
        const toTranslate = parts.slice(1).join(' ');
        if (!toTranslate) return reply(`Usage: ${prefix}translate [lang code] [text]\nCodes: es=Spanish, fr=French, ar=Arabic, yo=Yoruba, ha=Hausa`);
        const res = await axios.get(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${encodeURIComponent(toTranslate)}`);
        const translated = res.data[0].map(i => i[0]).join('');
        reply(`🌍 *Translation*\n▸ *Original:* ${toTranslate}\n▸ *Translated (${lang}):* ${translated}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ CALCULATOR ============
case "calc": {
    if (!text) return reply(`🧮 *Calculator*\nUsage: ${prefix}calc [expression]\nExample: ${prefix}calc 5 * 8 + 2`);
    try {
        const result = eval(text.replace(/[^0-9+\-*/.() %]/g, ''));
        reply(`🧮 *Calculator*\n▸ *Expression:* ${text}\n▸ *Result:* ${result}`);
    } catch (e) { reply(`❌ *Invalid expression*`); }
}
break;

// ============ NGL ============
case "ngl": {
    if (!text) return reply(`💬 *NGL Link*\nUsage: ${prefix}ngl [username]`);
    reply(`💬 *NGL Anonymous Message Link*\n▸ Username: ${text}\n▸ Link: https://ngl.link/${text}\n\n_Share this link to receive anonymous messages!_`);
}
break;

// ============ FONT ============
case "font": {
    if (!text) return reply(`✍️ *Font Generator*\nUsage: ${prefix}font [text]`);
    const fonts = {
        bold: t => t.replace(/[a-z]/gi, c => String.fromCodePoint(c.toLowerCase().charCodeAt(0) - 97 + 0x1D41A).replace(/[A-Z]/gi, c => String.fromCodePoint(c.charCodeAt(0) - 65 + 0x1D400))),
    };
    const styles = [
        ['𝗕𝗼𝗹𝗱', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D400) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D41A) : c; }).join('')],
        ['𝘐𝘵𝘢𝘭𝘪𝘤', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D434) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D44E) : c; }).join('')],
        ['𝙼𝚘𝚗𝚘', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x1D670) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x1D68A) : c; }).join('')],
        ['Ⓒⓘⓡⓒⓛⓔ', text.split('').map(c => { const n = c.charCodeAt(0); return n >= 65 && n <= 90 ? String.fromCodePoint(n - 65 + 0x24B6) : n >= 97 && n <= 122 ? String.fromCodePoint(n - 97 + 0x24D0) : c; }).join('')],
    ];
    let fontText = `✍️ *Font Styles for:* _${text}_\n\n`;
    styles.forEach(([name, styled]) => { fontText += `*${name}:*\n${styled}\n\n`; });
    reply(fontText);
}
break;

// ============ BIBLE ============
case "bible": {
    if (!text) return reply(`📖 *Bible*\nUsage: ${prefix}bible [book chapter:verse]\nExample: ${prefix}bible John 3:16`);
    try {
        const parts = text.split(' ');
        const book = parts[0];
        const cv = parts[1] || '1:1';
        const res = await axios.get(`https://bible-api.com/${book}+${cv}`);
        const d = res.data;
        if (d.error) return reply(`❌ *Verse not found*`);
        reply(`📖 *${d.reference}*\n\n_"${d.text.trim()}"_`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ JID ============
// [REMOVED DUPLICATE: jid]

// ============ ARCHIVE ============
case "archive": {
    if (!text && !m.quoted) return reply(`📦 *Archive Chat*\nUsage: ${prefix}archive [jid]\nOr reply to a message from the chat`);
    try {
        const jid = m.mentionedJid?.[0] || m.quoted?.sender || text || m.chat;
        await devtrust.chatModify({ archive: true }, jid);
        reply(`📦 *Chat archived successfully!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "unarchive": {
    try {
        const jid = m.mentionedJid?.[0] || m.quoted?.sender || text || m.chat;
        await devtrust.chatModify({ archive: false }, jid);
        reply(`📤 *Chat unarchived successfully!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ PIN CHAT ============
case "pinchat": {
    try {
        const jid = m.mentionedJid?.[0] || text || m.chat;
        await devtrust.chatModify({ pin: true }, jid);
        reply(`📌 *Chat pinned!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "unpinchat": {
    try {
        const jid = m.mentionedJid?.[0] || text || m.chat;
        await devtrust.chatModify({ pin: false }, jid);
        reply(`📌 *Chat unpinned!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ BLOCK/UNBLOCK ============
// [REMOVED DUPLICATE: block]
// [REMOVED DUPLICATE: unblock]

case "blocklist": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    try {
        const list = await devtrust.fetchBlocklist();
        if (!list.length) return reply('📋 *No blocked contacts*');
        const listText = list.map((j, i) => `${i + 1}. @${j.replace('@s.whatsapp.net', '')}`).join('\n');
        reply(`🚫 *Blocked Contacts (${list.length})*\n\n${listText}`, { mentions: list });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ BIO ============
case "bio":
case "setbio": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!text) return reply(`Usage: ${prefix}bio [new bio]`);
    try {
        await devtrust.updateProfileStatus(text);
        reply(`✅ *Bio updated!*\n▸ ${text}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ SETNAME ============
// [REMOVED DUPLICATE: setname]

// ============ FORWARD ============
case "forward": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!m.quoted) return reply(`Usage: Reply to a message + ${prefix}forward [number]`);
    if (!text) return reply(`Usage: ${prefix}forward [number]`);
    try {
        const forwardJid = text.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        await devtrust.sendMessage(forwardJid, { forward: m.quoted, force: true });
        reply(`✅ *Message forwarded!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ PRIVACY COMMANDS ============
case "lastseen": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}lastseen [all/contacts/none]`);
    try {
        const val = args[0] === 'all' ? 'all' : args[0] === 'contacts' ? 'contacts' : 'none';
        await devtrust.updateLastSeenPrivacy(val);
        reply(`✅ *Last seen set to:* ${val}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "online": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}online [all/match-last-seen]`);
    try {
        await devtrust.updateOnlinePrivacy(args[0]);
        reply(`✅ *Online visibility set to:* ${args[0]}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mypp":
case "pprivacy": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}mypp [all/contacts/none]`);
    try {
        const val = args[0] === 'all' ? 'all' : args[0] === 'contacts' ? 'contacts' : 'none';
        await devtrust.updateProfilePicturePrivacy(val);
        reply(`✅ *Profile picture privacy set to:* ${val}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mystatus": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}mystatus [all/contacts/none]`);
    try {
        await devtrust.updateStatusPrivacy(args[0]);
        reply(`✅ *Status privacy set to:* ${args[0]}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ AUTO REPLY FILTER ============
case "pfilter": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}pfilter [keyword] [response]`);
    const keyword = args[0].toLowerCase();
    const response = args.slice(1).join(' ');
    let filters = JSON.parse(fs.existsSync('./database/pfilter.json') ? fs.readFileSync('./database/pfilter.json') : '{}');
    filters[keyword] = response;
    fs.writeFileSync('./database/pfilter.json', JSON.stringify(filters));
    reply(`✅ *Private filter added!*\n▸ Keyword: ${keyword}\n▸ Response: ${response}`);
}
break;

case "pstop": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) {
        fs.writeFileSync('./database/pfilter.json', '{}');
        return reply('✅ *All private filters cleared!*');
    }
    let filters = JSON.parse(fs.existsSync('./database/pfilter.json') ? fs.readFileSync('./database/pfilter.json') : '{}');
    delete filters[args[0].toLowerCase()];
    fs.writeFileSync('./database/pfilter.json', JSON.stringify(filters));
    reply(`✅ *Private filter removed:* ${args[0]}`);
}
break;

case "gfilter": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}gfilter [keyword] [response]`);
    const gkeyword = args[0].toLowerCase();
    const gresponse = args.slice(1).join(' ');
    const gfFile = `./database/gfilter_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let gfilters = JSON.parse(fs.existsSync(gfFile) ? fs.readFileSync(gfFile) : '{}');
    gfilters[gkeyword] = gresponse;
    fs.writeFileSync(gfFile, JSON.stringify(gfilters));
    reply(`✅ *Group filter added!*\n▸ Keyword: ${gkeyword}\n▸ Response: ${gresponse}`);
}
break;

case "gstop": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const gsfFile = `./database/gfilter_${m.chat.replace(/[^0-9]/g, '')}.json`;
    if (!args[0]) {
        fs.writeFileSync(gsfFile, '{}');
        return reply('✅ *All group filters cleared!*');
    }
    let gsfilters = JSON.parse(fs.existsSync(gsfFile) ? fs.readFileSync(gsfFile) : '{}');
    delete gsfilters[args[0].toLowerCase()];
    fs.writeFileSync(gsfFile, JSON.stringify(gsfilters));
    reply(`✅ *Group filter removed:* ${args[0]}`);
}
break;

// ============ SETSUDO / DELSUDO / GETSUDO ============
// [REMOVED DUPLICATE: setsudo]
// [REMOVED DUPLICATE: delsudo]
// [REMOVED DUPLICATE: getsudo]

// ============ SETVAR / GETVAR / DELVAR / ALLVAR ============
case "setvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}setvar [key] [value]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    vars[args[0]] = args.slice(1).join(' ');
    fs.writeFileSync('./database/vars.json', JSON.stringify(vars));
    reply(`✅ *Variable set!*\n▸ ${args[0]} = ${args.slice(1).join(' ')}`);
}
break;

case "getvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}getvar [key]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    if (!vars[args[0]]) return reply(`❌ *Variable not found:* ${args[0]}`);
    reply(`📌 *${args[0]}:* ${vars[args[0]]}`);
}
break;

case "delvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    if (!args[0]) return reply(`Usage: ${prefix}delvar [key]`);
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    delete vars[args[0]];
    fs.writeFileSync('./database/vars.json', JSON.stringify(vars));
    reply(`✅ *Variable deleted:* ${args[0]}`);
}
break;

case "allvar": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    let vars = JSON.parse(fs.existsSync('./database/vars.json') ? fs.readFileSync('./database/vars.json') : '{}');
    const keys = Object.keys(vars);
    if (!keys.length) return reply('📋 *No variables set*');
    const varText = keys.map((k, i) => `${i + 1}. *${k}:* ${vars[k]}`).join('\n');
    reply(`📋 *All Variables:*\n\n${varText}`);
}
break;

// ============ NOTES ============
case "addnote": {
    if (!args[0] || !args[1]) return reply(`Usage: ${prefix}addnote [name] [content]`);
    const noteName = args[0].toLowerCase();
    const noteContent = args.slice(1).join(' ');
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    notes[noteName] = noteContent;
    fs.writeFileSync(noteFile, JSON.stringify(notes));
    reply(`✅ *Note saved:* ${noteName}`);
}
break;

case "getnote": {
    if (!args[0]) return reply(`Usage: ${prefix}getnote [name]`);
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    if (!notes[args[0].toLowerCase()]) return reply(`❌ *Note not found:* ${args[0]}`);
    reply(`📝 *${args[0]}:*\n\n${notes[args[0].toLowerCase()]}`);
}
break;

case "delnote": {
    if (!args[0]) return reply(`Usage: ${prefix}delnote [name]`);
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    delete notes[args[0].toLowerCase()];
    fs.writeFileSync(noteFile, JSON.stringify(notes));
    reply(`✅ *Note deleted:* ${args[0]}`);
}
break;

case "allnotes": {
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    let notes = JSON.parse(fs.existsSync(noteFile) ? fs.readFileSync(noteFile) : '{}');
    const noteKeys = Object.keys(notes);
    if (!noteKeys.length) return reply('📋 *No notes saved*');
    reply(`📋 *Saved Notes:*\n\n${noteKeys.map((k, i) => `${i + 1}. ${k}`).join('\n')}`);
}
break;

case "delallnote":
case "clearnotes": {
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const noteFile = `./database/notes_${m.chat.replace(/[^0-9]/g, '')}.json`;
    fs.writeFileSync(noteFile, '{}');
    reply('✅ *All notes cleared!*');
}
break;

// ============ ECONOMY SYSTEM ============
case "economy": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const isActive = econ.isEconActive(m.chat);
    if (!isAdmins && !isCreator) return reply(`💰 *Economy System*\n▸ Status: ${isActive ? '✅ Active' : '❌ Inactive'}\n\n_Ask an admin to activate economy in this chat_`);
    if (!args[0]) return reply(`💰 *Economy Control*\nUsage: ${prefix}economy on/off`);
    if (args[0] === 'on') {
        econ.setEconActive(m.chat, true);
        reply('✅ *Economy system activated!*\n\nUsers can now use:\n`.bal` `.daily` `.work` `.rob` `.slots` `.shop` and more!');
    } else {
        econ.setEconActive(m.chat, false);
        reply('❌ *Economy system deactivated!*');
    }
}
break;

case "bal":
case "balance":
case "wallet": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const bal = await econ.balance(target, m.chat);
    reply(`💰 *Balance - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 *Wallet:* ${econ.fmt(bal.wallet)}\n▸ 🏦 *Bank:* ${econ.fmt(bal.bank)} / ${econ.fmt(bal.bankCapacity)}`, { mentions: [target] });
}
break;

case "daily": {
    const econ = require('./legendaryEconomy');
    const result = await econ.daily(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Daily already claimed!*\nCome back in: *${result.cdL}*`);
    reply(`✅ *Daily Reward Claimed!*\n\n▸ 💵 *Earned:* ${econ.fmt(result.amount)}\n▸ 🔥 *Streak:* ${result.streak} days\n${result.streak > 1 ? `▸ 🎁 *Streak Bonus:* +${econ.fmt(result.amount - 200)}` : ''}`);
}
break;

case "dep":
case "deposit": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}dep [amount/all]`);
    const result = await econ.deposit(m.sender, m.chat, args[0]);
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.noten) return reply('❌ *Not enough in wallet*');
    if (result.full) return reply('❌ *Bank is full! Upgrade your bank capacity*');
    reply(`✅ *Deposited ${econ.fmt(result.amount)} to bank!*`);
}
break;

case "with":
case "withdraw": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}with [amount/all]`);
    const result = await econ.withdraw(m.sender, m.chat, args[0]);
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.noten) return reply('❌ *Not enough in bank*');
    reply(`✅ *Withdrew ${econ.fmt(result.amount)} to wallet!*`);
}
break;

case "give":
case "pay": {
    const econ = require('./legendaryEconomy');
    const giveTarget = m.mentionedJid?.[0];
    if (!giveTarget) return reply(`Usage: ${prefix}give @user [amount]`);
    const giveAmount = parseInt(args[1] || args[0]);
    if (isNaN(giveAmount) || giveAmount <= 0) return reply('❌ *Invalid amount*');
    const result = await econ.transfer(m.sender, giveTarget, m.chat, giveAmount);
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    reply(`✅ *Transferred ${econ.fmt(giveAmount)} to @${giveTarget.replace('@s.whatsapp.net', '')}!*`, { mentions: [giveTarget] });
}
break;

case "work": {
    const econ = require('./legendaryEconomy');
    const jobs = ['👨‍💻 Programmer', '🚕 Uber Driver', '🍕 Pizza Delivery', '👨‍🍳 Chef', '📸 Photographer', '🎸 Musician', '🏋️ Trainer', '📚 Teacher'];
    const job = jobs[Math.floor(Math.random() * jobs.length)];
    const result = await econ.work(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Already worked! Rest first.*\nCome back in: *${result.cdL}*`);
    reply(`💼 *Work Complete!*\n\n▸ Job: ${job}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Hard work pays off!_`);
}
break;

case "rob": {
    const econ = require('./legendaryEconomy');
    const robTarget = m.mentionedJid?.[0];
    if (!robTarget) return reply(`Usage: ${prefix}rob @user`);
    if (robTarget === m.sender) return reply('❌ *You cannot rob yourself!*');
    const result = await econ.rob(m.sender, m.chat, robTarget);
    if (result.cd) return reply(`⏰ *Cooldown active!*\nWait: *${result.cdL}*`);
    if (result.lowbal) return reply(`❌ *@${robTarget.replace('@s.whatsapp.net', '')} doesn't have enough to rob!*`, { mentions: [robTarget] });
    if (result.success) {
        reply(`🥷 *Rob Successful!*\n\n▸ Victim: @${robTarget.replace('@s.whatsapp.net', '')}\n▸ 💵 Stolen: ${econ.fmt(result.amount)}\n\n_Get away!_ 🏃`, { mentions: [robTarget] });
    } else {
        reply(`🚔 *Rob Failed!*\n\n▸ You got caught!\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n\n_Better luck next time!_`);
    }
}
break;

case "lb":
case "leaderboard": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat);
    if (!users.length) return reply('📊 *No economy data yet!*');
    let lbText = '🏆 *Economy Leaderboard*\n\n';
    const medals = ['🥇', '🥈', '🥉'];
    users.forEach((u, i) => {
        const medal = medals[i] || `${i + 1}.`;
        lbText += `${medal} @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(lbText, { mentions: users.map(u => u.userID) });
}
break;

case "rich": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat, 5);
    if (!users.length) return reply('📊 *No data yet!*');
    let richText = '💎 *Richest Users*\n\n';
    users.forEach((u, i) => {
        richText += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(richText, { mentions: users.map(u => u.userID) });
}
break;

case "poor": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const mongoose = require('mongoose');
    const users = await mongoose.model('EconUser').find({ chatID: m.chat }).sort({ wallet: 1 }).limit(5);
    if (!users.length) return reply('📊 *No data yet!*');
    let poorText = '💀 *Poorest Users*\n\n';
    users.forEach((u, i) => {
        poorText += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(poorText, { mentions: users.map(u => u.userID) });
}
break;

case "shop": {
    const econ = require('./legendaryEconomy');
    const items = econ.getShop();
    let shopText = '🛒 *LEGENDARY SHOP*\n\n';
    items.forEach((item, i) => {
        shopText += `${i + 1}. *${item.name}*\n   💵 Price: ${econ.fmt(item.price)}\n   📝 ${item.description}\n\n`;
    });
    shopText += `_Use ${prefix}buy [number] to purchase_`;
    reply(shopText);
}
break;

case "buy": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}buy [item number]\nSee ${prefix}shop for items`);
    const result = await econ.buyItem(m.sender, m.chat, args[0]);
    if (result.notfound) return reply(`❌ *Item not found!*\nSee ${prefix}shop for available items`);
    if (result.insufficient) return reply(`❌ *Not enough money!*\n▸ Item costs: ${econ.fmt(result.item?.price)}`);
    reply(`✅ *Purchase Successful!*\n\n▸ Item: ${result.item.name}\n▸ 💵 Cost: ${econ.fmt(result.item.price)}\n▸ 👛 Remaining: ${econ.fmt(result.newBalance)}`);
}
break;

case "inv":
case "inventory": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const inv = await econ.getInventory(target, m.chat);
    if (!inv.length) return reply(`🎒 *Inventory is empty!*\nBuy items with ${prefix}shop`);
    let invText = `🎒 *Inventory - @${target.replace('@s.whatsapp.net', '')}*\n\n`;
    inv.forEach((item, i) => {
        invText += `${i + 1}. ${item.name} x${item.quantity}\n`;
    });
    reply(invText, { mentions: [target] });
}
break;

case "beg": {
    const econ = require('./legendaryEconomy');
    const beggars = ['Elon Musk', 'Bill Gates', 'Jeff Bezos', 'Mark Zuckerberg', 'a random stranger'];
    const beggar = beggars[Math.floor(Math.random() * beggars.length)];
    const result = await econ.beg(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    if (result.success) {
        reply(`🙏 *${beggar} gave you ${econ.fmt(result.amount)}!*\n\n_Begging is not dignified but it worked!_`);
    } else {
        reply(`😢 *${beggar} ignored you!*\n\n_Better luck next time!_`);
    }
}
break;

case "crime": {
    const econ = require('./legendaryEconomy');
    const result = await econ.crime(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    if (result.success) {
        reply(`🦹 *Crime Successful!*\n\n▸ Crime: ${result.crimeName}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_You got away with it!_ 😈`);
    } else {
        reply(`🚔 *Crime Failed!*\n\n▸ Crime: ${result.crimeName}\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n\n_You got caught!_ 😅`);
    }
}
break;

case "loan": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`💳 *Loan System*\nUsage: ${prefix}loan [amount]\nMin: $1,000 | Max: $50,000\nInterest: 15%`);
    const amount = parseInt(args[0]);
    const result = await econ.loan(m.sender, m.chat, amount);
    if (result.tooLow) return reply('❌ *Minimum loan is $1,000*');
    if (result.tooHigh) return reply('❌ *Maximum loan is $50,000*');
    if (result.hasLoan) return reply(`❌ *You already have a loan of ${econ.fmt(result.loanAmount)}!*\nPay it first with ${prefix}payloan`);
    reply(`✅ *Loan Approved!*\n\n▸ 💵 Amount: ${econ.fmt(result.amount)}\n▸ 📈 Interest: ${result.interest}%\n▸ 💸 Total Owed: ${econ.fmt(result.totalOwed)}\n▸ ⏰ Due: 7 days\n\n_Use ${prefix}payloan to repay_`);
}
break;

case "payloan": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}payloan [amount/all]`);
    const result = await econ.payLoan(m.sender, m.chat, args[0]);
    if (result.noLoan) return reply('❌ *You have no active loan!*');
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.fullPaid) {
        reply(`✅ *Loan fully paid!*\n▸ 💵 Paid: ${econ.fmt(result.amount)}\n▸ 🎉 You are debt free!`);
    } else {
        reply(`✅ *Partial payment made!*\n▸ 💵 Paid: ${econ.fmt(result.amount)}\n▸ 💸 Remaining: ${econ.fmt(result.remaining)}`);
    }
}
break;

case "slots": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎰 *Slots*\nUsage: ${prefix}slots [bet]\nMin bet: $100`);
    const bet = parseInt(args[0]);
    const result = await econ.slots(m.sender, m.chat, bet);
    if (result.invalid) return reply('❌ *Minimum bet is $100*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    const [a, b, c] = result.result;
    const won = result.winnings > 0;
    reply(`🎰 *SLOTS*\n\n┌─────────────┐\n│ ${a}  ${b}  ${c} │\n└─────────────┘\n\n${won ? `🎉 *YOU WIN ${econ.fmt(result.winnings)}!*` : `😢 *You lost ${econ.fmt(Math.abs(result.winnings))}*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "sell": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}sell [item name] [quantity?]`);
    const qty = parseInt(args[args.length - 1]) || 1;
    const itemN = args.join(' ').replace(/ \d+$/, '');
    const result = await econ.sell(m.sender, m.chat, itemN, qty);
    if (result.noItems) return reply('❌ *Your inventory is empty!*');
    if (result.notfound) return reply(`❌ *Item not found:* ${itemN}`);
    if (result.insufficient) return reply(`❌ *You only have ${result.has}x of that item*`);
    reply(`✅ *Sold!*\n▸ Item: ${result.itemName} x${result.quantity}\n▸ 💵 Earned: ${econ.fmt(result.sellPrice)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "hunt": {
    const econ = require('./legendaryEconomy');
    const animals = ['🦌 Deer', '🐗 Wild Boar', '🦊 Fox', '🐇 Rabbit', '🦜 Parrot', '🐍 Snake'];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const result = await econ.hunt(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🏹 *Hunt Successful!*\n\n▸ Caught: ${animal}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Great aim!_ 🎯`);
}
break;

case "mine": {
    const econ = require('./legendaryEconomy');
    const minerals = ['💎 Diamond', '🔴 Ruby', '🟡 Gold', '⬜ Silver', '🔵 Sapphire', '🪨 Coal'];
    const mineral = minerals[Math.floor(Math.random() * minerals.length)];
    const result = await econ.mine(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`⛏️ *Mining Complete!*\n\n▸ Found: ${mineral}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Keep digging!_ 💪`);
}
break;

case "fish": {
    const econ = require('./legendaryEconomy');
    const fishes = ['🐟 Fish', '🐠 Clownfish', '🐡 Blowfish', '🦈 Shark', '🦞 Lobster', '🦑 Squid'];
    const caught = fishes[Math.floor(Math.random() * fishes.length)];
    const result = await econ.fish(m.sender, m.chat);
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🎣 *Fishing Complete!*\n\n▸ Caught: ${caught}\n▸ 💵 Earned: ${econ.fmt(result.amount)}\n\n_Nice catch!_ 🎉`);
}
break;

case "use": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`Usage: ${prefix}use [item name]`);
    const result = await econ.use(m.sender, m.chat, args.join(' '));
    if (result.notfound) return reply(`❌ *Item not found in inventory!*`);
    reply(`✅ *Item Used!*\n▸ ${result.item.name}\n▸ ${result.effect}\n▸ Remaining: ${result.remaining}x`);
}
break;

case "gift": {
    const econ = require('./legendaryEconomy');
    const giftTarget = m.mentionedJid?.[0];
    if (!giftTarget) return reply(`Usage: ${prefix}gift @user [item name] [quantity?]`);
    const giftQty = parseInt(args[args.length - 1]) || 1;
    const giftItem = args.slice(1).join(' ').replace(/ \d+$/, '');
    const result = await econ.gift(m.sender, m.chat, giftTarget, giftItem, giftQty);
    if (result.notfound) return reply('❌ *Item not found in your inventory!*');
    if (result.insufficient) return reply('❌ *Not enough quantity to gift!*');
    reply(`🎁 *Gift Sent!*\n▸ To: @${giftTarget.replace('@s.whatsapp.net', '')}\n▸ Item: ${result.item.name} x${giftQty}`, { mentions: [giftTarget] });
}
break;

case "streak": {
    const econ = require('./legendaryEconomy');
    const result = await econ.streak(m.sender, m.chat);
    reply(`🔥 *Daily Streak*\n\n▸ Current Streak: ${result.count} days\n▸ Bonus: +${econ.fmt(result.bonus)} per daily\n\n_Keep claiming daily to maintain streak!_`);
}
break;

case "gamble": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Gamble*\nUsage: ${prefix}gamble [amount]`);
    const result = await econ.gamble(m.sender, m.chat, parseInt(args[0]));
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🎲 *Gamble Result*\n\n${result.win ? `🎉 *YOU WON ${econ.fmt(result.amount)}!*` : `😢 *You lost ${econ.fmt(result.amount)}!*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "coinflip":
case "flip": {
    const econ = require('./legendaryEconomy');
    if (!args[0] || !args[1]) return reply(`🪙 *Coinflip*\nUsage: ${prefix}coinflip [heads/tails] [amount]`);
    const result = await econ.coinflip(m.sender, m.chat, args[0].toLowerCase(), parseInt(args[1]));
    if (result.invalidChoice) return reply('❌ *Choose heads or tails*');
    if (result.invalid) return reply('❌ *Invalid amount*');
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    if (result.cd) return reply(`⏰ *Cooldown!* Wait: *${result.cdL}*`);
    reply(`🪙 *Coinflip!*\n\n▸ Result: *${result.result}* ${result.result === 'heads' ? '👑' : '🔵'}\n▸ Your choice: ${args[0]}\n\n${result.win ? `🎉 *YOU WIN ${econ.fmt(result.amount)}!*` : `😢 *You lost ${econ.fmt(result.amount)}*`}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}`);
}
break;

case "networth": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.networth(target, m.chat);
    reply(`💎 *Net Worth - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)}\n▸ 🎒 Inventory: ${econ.fmt(result.invValue)}\n▸ 📊 Total: ${econ.fmt(result.total)}`, { mentions: [target] });
}
break;

case "heist": {
    const econ = require('./legendaryEconomy');
    const crew = m.mentionedJid || [];
    if (!crew.length) return reply(`🦹 *Heist*\nUsage: ${prefix}heist @member1 @member2...\n_Mention your heist crew!_`);
    crew.push(m.sender);
    const result = await econ.heist(crew, m.chat);
    let heistText = `🦹 *HEIST ${result.success ? 'SUCCESSFUL' : 'FAILED'}!*\n\n▸ Target: ${result.target}\n\n`;
    result.results.forEach(r => {
        heistText += `▸ @${r.member.replace('@s.whatsapp.net', '')}: ${r.success ? `+${econ.fmt(r.amount)}` : `-${econ.fmt(r.amount)} (fine)`}\n`;
    });
    reply(heistText, { mentions: crew });
}
break;

case "blackjack":
case "bj": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🃏 *Blackjack*\nUsage: ${prefix}blackjack [bet]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet < 50) return reply('❌ *Minimum bet is $50*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const deck = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'];
    const getCard = () => deck[Math.floor(Math.random() * deck.length)];
    const getVal = (cards) => {
        let total = 0, aces = 0;
        cards.forEach(c => {
            if (c === 'A') { aces++; total += 11; }
            else if (['J','Q','K'].includes(c)) total += 10;
            else total += parseInt(c);
        });
        while (total > 21 && aces > 0) { total -= 10; aces--; }
        return total;
    };
    const playerCards = [getCard(), getCard()];
    const dealerCards = [getCard(), getCard()];
    const pVal = getVal(playerCards);
    const dVal = getVal(dealerCards);
    const playerWin = pVal === 21 || (dVal > 21) || (pVal <= 21 && pVal > dVal);
    if (playerWin) { await econ.give(m.sender, m.chat, bet); }
    else { await econ.deduct(m.sender, m.chat, bet); }
    reply(`🃏 *BLACKJACK*\n\n▸ Your hand: ${playerCards.join(' ')} = ${pVal}\n▸ Dealer: ${dealerCards.join(' ')} = ${dVal}\n\n${playerWin ? `🎉 *YOU WIN ${econ.fmt(bet)}!*` : `😢 *Dealer wins! Lost ${econ.fmt(bet)}*`}`);
}
break;

case "dicegamble": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Dice Gamble*\nUsage: ${prefix}dicegamble [bet]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet <= 0) return reply('❌ *Invalid bet*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const p = Math.ceil(Math.random() * 6);
    const d = Math.ceil(Math.random() * 6);
    const win = p > d;
    if (win) await econ.give(m.sender, m.chat, bet);
    else if (p < d) await econ.deduct(m.sender, m.chat, bet);
    reply(`🎲 *DICE GAMBLE*\n\n▸ Your roll: ${p}\n▸ Bot roll: ${d}\n\n${p > d ? `🎉 *YOU WIN ${econ.fmt(bet)}!*` : p < d ? `😢 *You lost ${econ.fmt(bet)}!*` : `🤝 *It's a tie!*`}`);
}
break;

case "tax": {
    const econ = require('./legendaryEconomy');
    const result = await econ.tax(m.sender, m.chat);
    if (result.tooBroke) return reply('❌ *You need at least $500 to be taxed!*');
    reply(`🏛️ *Tax Collected!*\n\n▸ 💸 Taxed: ${econ.fmt(result.taxed)} (10%)\n▸ Redistributed to top earner\n\n_Taxes fund the community!_`);
}
break;

case "bankrob": {
    const econ = require('./legendaryEconomy');
    const result = await econ.bankrob(m.sender, m.chat);
    if (result.success) {
        reply(`🏦 *Bank Robbery ${result.success ? 'Successful' : 'Failed'}!*\n\n▸ Target: ${result.bank}\n▸ 💵 Loot: ${econ.fmt(result.loot)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}\n\n_You pulled it off!_ 🎉`);
    } else {
        reply(`🚔 *Bank Robbery Failed!*\n\n▸ Target: ${result.bank}\n▸ 💸 Fine: ${econ.fmt(result.fine)}\n▸ 👛 Balance: ${econ.fmt(result.newBalance)}\n\n_Security was too tight!_`);
    }
}
break;

case "profile": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.profile(target, m.chat);
    reply(`👤 *Profile - @${target.replace('@s.whatsapp.net', '')}*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)} / ${econ.fmt(result.bankCapacity)}\n▸ 🎒 Items: ${result.invCount}\n▸ 📊 Net Worth: ${econ.fmt(result.net)}\n▸ 🏅 Rank: ${result.tier}\n▸ 🔥 Streak: ${result.streak} days`, { mentions: [target] });
}
break;
// [REMOVED DUPLICATE: rps]

// ============================================================
// =================== END NEW COMMANDS =======================
// ============================================================

// ============ REMAINING LEGENDARY-AI COMMANDS ============

// GROUP COMMANDS
case "join": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    const joinUrl = text || m.quoted?.text;
    if (!joinUrl) return reply(`Usage: ${prefix}join [group link]`);
    try {
        const code = joinUrl.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)?.[1];
        if (!code) return reply('❌ *Invalid group link*');
        await devtrust.groupAcceptInvite(code);
        reply('✅ *Joined group successfully!*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: leave]
// [REMOVED DUPLICATE: setgcname]
// [REMOVED DUPLICATE: setgcdesc]

case "kick": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const kickTarget = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!kickTarget) return reply(`Usage: ${prefix}kick @user`);
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [kickTarget], 'remove');
        reply(`✅ *@${kickTarget.replace('@s.whatsapp.net', '')} has been removed*`, { mentions: [kickTarget] });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "tkick": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    const tkickTarget = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!tkickTarget) return reply(`Usage: ${prefix}tkick @user`);
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [tkickTarget], 'remove');
        setTimeout(async () => {
            try { await devtrust.groupParticipantsUpdate(m.chat, [tkickTarget], 'add'); } catch(e) {}
        }, 5000);
        reply(`✅ *@${tkickTarget.replace('@s.whatsapp.net', '')} temporarily kicked and re-added*`, { mentions: [tkickTarget] });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: promote]
// [REMOVED DUPLICATE: demote]
// [REMOVED DUPLICATE: mute]
// [REMOVED DUPLICATE: unmute]

case "lock": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'locked');
        reply('🔒 *Group locked! Only admins can edit group info*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "unlock": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'unlocked');
        reply('🔓 *Group unlocked! Everyone can edit group info*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: invite]
// [REMOVED DUPLICATE: revoke]
// [REMOVED DUPLICATE: ginfo]
// [REMOVED DUPLICATE: tagall]
// [REMOVED DUPLICATE: tag]
// [REMOVED DUPLICATE: creategc]

case "kickr":
case "reset": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    if (!isAdmins && !isCreator) return reply('👮 *Admins only*');
    try {
        const meta = await devtrust.groupMetadata(m.chat);
        const nonAdmins = meta.participants.filter(p => !p.admin).map(p => p.id);
        if (!nonAdmins.length) return reply('✅ *No non-admin members to remove*');
        await devtrust.groupParticipantsUpdate(m.chat, nonAdmins, 'remove');
        reply(`✅ *Removed ${nonAdmins.length} non-admin members!*`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "pick": {
    if (!m.isGroup) return reply('👥 *Groups only*');
    try {
        const meta = await devtrust.groupMetadata(m.chat);
        const members = meta.participants;
        const picked = members[Math.floor(Math.random() * members.length)];
        reply(`🎲 *Random Pick!*\n\n▸ @${picked.id.replace('@s.whatsapp.net', '')}`, { mentions: [picked.id] });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// SEARCH COMMANDS
case "websearch":
case "search": {
    if (!text) return reply(`🔎 *Web Search*\nUsage: ${prefix}websearch [query]`);
    try {
        reply('🔎 *Searching the web...*');
        const res = await axios.get(`https://ddg-api.herokuapp.com/search?query=${encodeURIComponent(text)}&limit=5`).catch(() => null);
        if (!res?.data?.length) {
            const aiAnswer = await askOpenAI(`Search and summarize: ${text}`);
            return reply(`🔎 *Search: ${text}*\n\n${aiAnswer}`);
        }
        let searchText = `🔎 *Web Search: ${text}*\n\n`;
        res.data.slice(0, 3).forEach((r, i) => {
            searchText += `*${i + 1}. ${r.title}*\n${r.snippet}\n${r.link}\n\n`;
        });
        reply(searchText);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "img":
case "image": {
    if (!text) return reply(`🖼️ *Image Search*\nUsage: ${prefix}img [query]`);
    try {
        reply('🔎 *Searching images...*');
        const count = parseInt(text.split(' ')[0]) || 1;
        const query = count > 1 ? text.split(' ').slice(1).join(' ') : text;
        const res = await axios.get(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${Math.min(count, 5)}&client_id=wGEDxANzF8vV-4g8pMR6eTLnkGMtbFh3AMRlCQ0y4bk`).catch(() => null);
        if (!res?.data?.results?.length) return reply(`❌ *No images found for:* ${query}`);
        for (const img of res.data.results.slice(0, Math.min(count, 3))) {
            await devtrust.sendMessage(m.chat, { image: { url: img.urls.regular }, caption: `🖼️ ${img.description || query}` }, { quoted: m });
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "npm": {
    if (!text) return reply(`📦 *NPM Search*\nUsage: ${prefix}npm [package name]`);
    try {
        const res = await axios.get(`https://registry.npmjs.org/${text}`);
        const d = res.data;
        const latest = d['dist-tags']?.latest;
        const pkg = d.versions?.[latest];
        reply(`📦 *NPM Package: ${d.name}*\n\n▸ *Latest Version:* ${latest}\n▸ *Description:* ${d.description}\n▸ *Author:* ${d.author?.name || 'N/A'}\n▸ *License:* ${pkg?.license || 'N/A'}\n▸ *Dependencies:* ${Object.keys(pkg?.dependencies || {}).length}\n▸ *Link:* https://npmjs.com/package/${d.name}`);
    } catch (e) { reply(`❌ *Package not found:* ${text}`); }
}
break;

case "shazam":
case "findaudio":
case "identifyaudio": {
    if (!m.quoted?.message?.audioMessage && !m.quoted?.message?.videoMessage)
        return reply(`🎵 *Audio Identify*\nReply to an audio/video: ${prefix}shazam`);
    try {
        reply('🎵 *Identifying audio...*');
        const answer = await askOpenAI('Identify this audio track. Since I cannot process audio directly, suggest how users can identify music using apps like Shazam, SoundHound, or Google Assistant.');
        reply(`🎵 *Audio Identification*\n\n${answer}\n\n_Tip: Use the Shazam app for real-time music identification!_`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: apk]

case "subtitle":
case "subtitles":
case "subtitlesearch": {
    if (!text) return reply(`📝 *Subtitle Search*\nUsage: ${prefix}subtitle [movie name]`);
    reply(`📝 *Subtitle Search: ${text}*\n\n▸ OpenSubtitles: https://www.opensubtitles.org/en/search2/moviename-${encodeURIComponent(text)}\n▸ Subscene: https://subscene.com/subtitles/searchbytitle?query=${encodeURIComponent(text)}\n▸ YTS Subtitles: https://yts.mx/movies/${text.toLowerCase().replace(/\s+/g, '-')}`);
}
break;

// IMAGE EFFECT COMMANDS
case "gfx":
case "gfx1": {
    if (!text) return reply(`🎨 *GFX Image*\nUsage: ${prefix}gfx [text1];[text2]`);
    const txt = text.split(';');
    if (!txt[1]) return reply(`Usage: ${prefix}gfx text1;text2`);
    try {
        await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[1])}&text2=${encodeURIComponent(txt[0])}` }, caption: '🎨 *GFX 1*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx2": {
    if (!text) return reply(`🎨 *GFX2*\nUsage: ${prefix}gfx2 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx2?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 2*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx3": {
    if (!text) return reply(`🎨 *GFX3*\nUsage: ${prefix}gfx3 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx3?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 3*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx4": {
    if (!text) return reply(`🎨 *GFX4*\nUsage: ${prefix}gfx4 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx4?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 4*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx5": {
    if (!text) return reply(`🎨 *GFX5*\nUsage: ${prefix}gfx5 [text1];[text2];[text3]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx5?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || '')}&text3=${encodeURIComponent(txt[2] || '')}` }, caption: '🎨 *GFX 5*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx6": {
    if (!text) return reply(`🎨 *GFX6*\nUsage: ${prefix}gfx6 [text1];[text2];[text3]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx6?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || '')}&text3=${encodeURIComponent(txt[2] || '')}` }, caption: '🎨 *GFX 6*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx7": {
    if (!text) return reply(`🎨 *GFX7*\nUsage: ${prefix}gfx7 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx7?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 7*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx8": {
    if (!text) return reply(`🎨 *GFX8*\nUsage: ${prefix}gfx8 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx8?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 8*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx9": {
    if (!text) return reply(`🎨 *GFX9*\nUsage: ${prefix}gfx9 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx9?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 9*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx10": {
    if (!text) return reply(`🎨 *GFX10*\nUsage: ${prefix}gfx10 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx10?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 10*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx11": {
    if (!text) return reply(`🎨 *GFX11*\nUsage: ${prefix}gfx11 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx11?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 11*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "gfx12": {
    if (!text) return reply(`🎨 *GFX12*\nUsage: ${prefix}gfx12 [text1];[text2]`);
    const txt = text.split(';');
    try { await devtrust.sendMessage(m.chat, { image: { url: `https://api.nexoracle.com/image-creating/gfx12?apikey=free_key@maher_apis&text1=${encodeURIComponent(txt[0])}&text2=${encodeURIComponent(txt[1] || txt[0])}` }, caption: '🎨 *GFX 12*' }, { quoted: m }); } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "invert": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🎨 *Invert Image*\nReply to an image: ${prefix}invert`);
    try {
        reply('⏳ *Inverting image...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const Jimp = require('jimp');
        const img = await Jimp.read(media);
        img.invert();
        const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🎨 *Inverted!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "carbon": {
    if (!text && !m.quoted?.text) return reply(`💻 *Carbon Code Image*\nUsage: ${prefix}carbon [code]`);
    const code = text || m.quoted?.text;
    try {
        const url = `https://carbonnowsh.vercel.app/?bg=rgba(74,144,226,1)&t=monokai&wt=none&l=auto&ds=true&dsyoff=20px&dsblur=68px&wc=true&wa=true&pv=56px&ph=56px&ln=false&fl=1&fm=Hack&fs=14px&lh=133%25&si=false&es=2x&wm=false&code=${encodeURIComponent(code)}`;
        await devtrust.sendMessage(m.chat, { image: { url }, caption: '💻 *Code Snapshot*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "wanted": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🤠 *Wanted Poster*\nReply to an image: ${prefix}wanted`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const b64 = media.toString('base64');
        const res = await axios.get(`https://api.popcat.xyz/wanted?image=data:image/jpeg;base64,${b64}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🤠 *WANTED!*' }, { quoted: m });
    } catch (e) {
        try {
            const quoted = m.quoted || m;
            const ppUrl = await devtrust.profilePictureUrl(m.sender, 'image');
            const res = await axios.get(`https://api.popcat.xyz/wanted?image=${encodeURIComponent(ppUrl)}`, { responseType: 'arraybuffer' });
            await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🤠 *WANTED!*' }, { quoted: m });
        } catch (e2) { reply(`❌ *Error:* ${e2.message}`); }
    }
}
break;

case "wasted": {
    try {
        const imgUrl = m.quoted?.message?.imageMessage ? null : await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image');
        const targetUrl = imgUrl || 'https://i.imgur.com/placeholder.jpg';
        const res = await axios.get(`https://api.popcat.xyz/wasted?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '💀 *WASTED!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "jail": {
    try {
        const targetUrl = m.quoted?.message?.imageMessage ? null : await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image').catch(() => null);
        if (!targetUrl) return reply(`🔒 *Jail*\nUsage: ${prefix}jail @user`);
        const res = await axios.get(`https://api.popcat.xyz/jail?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: '🔒 *JAILED!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "rainbow": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🌈 *Rainbow Filter*\nReply to an image: ${prefix}rainbow`);
    try {
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const Jimp = require('jimp');
        const img = await Jimp.read(media);
        const colors = [0xFF0000FF, 0xFF7F00FF, 0xFFFF00FF, 0x00FF00FF, 0x0000FFFF, 0x8B00FFFF];
        img.color([{ apply: 'hue', params: [90] }]);
        const buffer = await img.getBufferAsync(Jimp.MIME_PNG);
        await devtrust.sendMessage(m.chat, { image: buffer, caption: '🌈 *Rainbow Filter!*' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "mnm":
case "rip-meme":
case "trigger-meme": {
    const memeType = command === 'mnm' ? 'mnm' : command === 'rip-meme' ? 'rip' : 'trigger';
    try {
        const targetUrl = await devtrust.profilePictureUrl(m.mentionedJid?.[0] || m.sender, 'image').catch(() => null);
        if (!targetUrl) return reply(`Usage: ${prefix}${command} @user`);
        const res = await axios.get(`https://api.popcat.xyz/${memeType}?image=${encodeURIComponent(targetUrl)}`, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(m.chat, { image: Buffer.from(res.data), caption: `🎭 *${command.toUpperCase()}!*` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "naturewlp": {
    const natureUrls = [
        'https://source.unsplash.com/1920x1080/?nature,forest',
        'https://source.unsplash.com/1920x1080/?mountain,landscape',
        'https://source.unsplash.com/1920x1080/?ocean,beach',
        'https://source.unsplash.com/1920x1080/?sunset,sky'
    ];
    await devtrust.sendMessage(m.chat, { image: { url: natureUrls[Math.floor(Math.random() * natureUrls.length)] }, caption: '🌿 *Nature Wallpaper*' }, { quoted: m });
}
break;

// MISC COMMANDS
// [REMOVED DUPLICATE: quote]
// [REMOVED DUPLICATE: fact]

case "ebinary":
case "ebin": {
    if (!text) return reply(`Usage: ${prefix}ebinary [text]`);
    const binary = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
    reply(`💻 *Text to Binary*\n\n*Input:* ${text}\n*Binary:* ${binary}`);
}
break;

case "dbinary":
case "dbin": {
    if (!text) return reply(`Usage: ${prefix}dbinary [binary]`);
    try {
        const decoded = text.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
        reply(`💻 *Binary to Text*\n\n*Binary:* ${text}\n*Text:* ${decoded}`);
    } catch (e) { reply('❌ *Invalid binary input*'); }
}
break;
// [REMOVED DUPLICATE: roast]
// [REMOVED DUPLICATE: pickup]

// TOOLS COMMANDS
case "delete":
case "del":
case "dlt": {
    if (!m.quoted) return reply(`Usage: Reply to a message + ${prefix}delete`);
    try {
        if (m.isGroup && isBotAdmins) {
            await devtrust.sendMessage(m.chat, { 
                delete: { 
                    remoteJid: m.chat, 
                    fromMe: false, 
                    id: m.quoted.id || m.quoted.key?.id,
                    participant: m.quoted.sender || m.quoted.key?.participant
                } 
            });
        } else {
            await devtrust.sendMessage(m.chat, { delete: m.quoted.key || m.quoted.fakeObj?.key });
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}\n_Make sure bot is admin to delete others' messages_`); }
}
break;

case "clear": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    try {
        await devtrust.clearMessage(m.chat, false);
        reply('✅ *Chat cleared!*');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: vv]

case "compress": {
    if (!m.quoted?.message?.imageMessage && !m.message?.imageMessage) return reply(`🗜️ *Compress Image*\nReply to an image: ${prefix}compress`);
    try {
        reply('⏳ *Compressing...*');
        const quoted = m.quoted || m;
        const media = await quoted.download();
        const sharp = require('sharp');
        const compressed = await sharp(media).jpeg({ quality: 40 }).toBuffer();
        await devtrust.sendMessage(m.chat, { image: compressed, caption: `🗜️ *Compressed!*\nOriginal: ${(media.length / 1024).toFixed(1)}KB → Compressed: ${(compressed.length / 1024).toFixed(1)}KB` }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "pdf": {
    if (!text && !m.quoted?.text) return reply(`📄 *Text to PDF*\nUsage: ${prefix}pdf [text]`);
    try {
        reply('⏳ *Creating PDF...*');
        const content = text || m.quoted?.text;
        const PDFDocument = require('pdfkit');
        const doc = new PDFDocument();
        const tmpPath = `./tmp/doc_${Date.now()}.pdf`;
        const stream = fs.createWriteStream(tmpPath);
        doc.pipe(stream);
        doc.fontSize(12).text(content, 50, 50);
        doc.end();
        await new Promise(resolve => stream.on('finish', resolve));
        const pdfBuffer = fs.readFileSync(tmpPath);
        fs.unlinkSync(tmpPath);
        await devtrust.sendMessage(m.chat, { document: pdfBuffer, mimetype: 'application/pdf', fileName: 'document.pdf' }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

case "audio2text":
case "text": {
    if (!m.quoted?.message?.audioMessage && !m.quoted?.message?.videoMessage) return reply(`🎤 *Audio to Text*\nReply to an audio: ${prefix}audio2text`);
    try {
        reply('⏳ *Transcribing audio...*');
        reply('_Audio transcription requires an external API. Use Google Voice, Otter.ai, or similar services for best results._');
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: url]

case "gitclone":
case "gitdl": {
    if (!text) return reply(`📦 *Git Clone*\nUsage: ${prefix}gitclone [repo url]`);
    reply(`📦 *Git Clone*\n\nTo clone this repository:\n\`\`\`git clone ${text}\`\`\`\n\nOr download ZIP: ${text.replace('github.com', 'github.com').replace(/\/?$/, '')}/archive/refs/heads/main.zip`);
}
break;

case "mediafire": {
    if (!text) return reply(`📁 *MediaFire*\nUsage: ${prefix}mediafire [link]`);
    try {
        reply('⏳ *Fetching MediaFire link...*');
        const res = await axios.get(`https://www.mediafire.com/api/1.5/file/get_links.php?quick_key=${text.split('/').pop()}&response_format=json`).catch(() => null);
        if (!res?.data?.response?.links?.[0]?.normal_download) return reply('❌ *Could not fetch download link. Try downloading directly from the URL.*');
        reply(`📁 *MediaFire Download*\n${res.data.response.links[0].normal_download}`);
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: mode]


case "react-channel":
case "reactchannel": {
    if (!isCreator && !isSudo) return reply('🔒 *Owner/Sudo only*');
    const rcBotJid = devtrust.decodeJid(devtrust.user.id);
    if (!args[0]) {
        const currentReact = getSetting(rcBotJid, 'autoReactChannel', false);
        return reply(`❤️ *React Channel*\n\n▸ Status: ${currentReact ? '✅ ON' : '❌ OFF'}\n\nUsage: ${prefix}react-channel on/off\n_When ON, bot will auto-react to posts on channels you follow_`);
    }
    if (args[0] === 'on') {
        setSetting(rcBotJid, 'autoReactChannel', true);
        reply('✅ *Auto React to Channels ENABLED*\n_Bot will react with emojis to channel posts_');
    } else if (args[0] === 'off') {
        setSetting(rcBotJid, 'autoReactChannel', false);
        reply('❌ *Auto React to Channels DISABLED*');
    } else {
        reply(`Usage: ${prefix}react-channel on/off`);
    }
}
break;

case "channellog": {
    const clData = loadChannelLog();
    const botUserJid = devtrust.decodeJid(devtrust.user.id);
    const userEntry = clData[botUserJid] || { enabled: false };

    if (!args[0]) {
        return reply(
            '📢 *Channel Log*\n\n' +
            '▸ Status: ' + (userEntry.enabled ? '✅ ON' : '❌ OFF') + '\n\n' +
            'Usage:\n' +
            prefix + 'channellog on — enable alerts\n' +
            prefix + 'channellog off — disable alerts\n\n' +
            '_When ON, any post on channels you admin will be sent to your DM_'
        );
    }

    if (args[0] === 'on') {
        userEntry.enabled = true;
        clData[botUserJid] = userEntry;
        saveChannelLog(clData);
        return reply('✅ *Channel Log ENABLED*\n_You will get a DM alert whenever someone posts on any channel you admin._');
    }

    if (args[0] === 'off') {
        userEntry.enabled = false;
        clData[botUserJid] = userEntry;
        saveChannelLog(clData);
        return reply('❌ *Channel Log DISABLED*');
    }
}
break;

case "stats": {
    const mem = process.memoryUsage();
    const memMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (mem.heapTotal / 1024 / 1024).toFixed(2);
    reply(`📊 *Bot Stats*\n\n▸ 💾 Memory: ${memMB}MB / ${totalMem}MB\n▸ ⏰ Uptime: ${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m\n▸ 🔄 Node: ${process.version}\n▸ 💻 Platform: ${process.platform}`);
}
break;
// [REMOVED DUPLICATE: runtime]

case "shutdown": {
    if (!isCreator) return reply('🔒 *Owner only*');
    reply('⚠️ *Shutting down...*');
    setTimeout(() => process.exit(0), 2000);
}
break;

case "restart":
case "reboot": {
    if (!isCreator) return reply('🔒 *Owner only*');
    reply('🔄 *Restarting...*');
    setTimeout(() => process.exit(1), 2000);
}
break;

case "doubleornothing":
case "don": {
    const econ = require('./legendaryEconomy');
    if (!args[0]) return reply(`🎲 *Double or Nothing*\nUsage: ${prefix}don [amount]`);
    const bet = parseInt(args[0]);
    const bal = await econ.balance(m.sender, m.chat);
    if (isNaN(bet) || bet <= 0) return reply('❌ *Invalid amount*');
    if (bal.wallet < bet) return reply('❌ *Not enough in wallet*');
    const win = Math.random() < 0.5;
    if (win) await econ.give(m.sender, m.chat, bet);
    else await econ.deduct(m.sender, m.chat, bet);
    reply(`🎲 *Double or Nothing!*\n\n${win ? `🎉 *DOUBLED! You won ${econ.fmt(bet)}!*` : `💀 *NOTHING! You lost ${econ.fmt(bet)}!*`}`);
}
break;

case "richest":
case "top": {
    const econ = require('./legendaryEconomy');
    const users = await econ.lb(m.chat, 10);
    if (!users.length) return reply('📊 *No economy data yet!*');
    let text2 = '🏆 *Top 10 Richest*\n\n';
    const medals = ['🥇', '🥈', '🥉'];
    users.forEach((u, i) => {
        text2 += `${medals[i] || `${i + 1}.`} @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`;
    });
    reply(text2, { mentions: users.map(u => u.userID) });
}
break;

case "poorest":
case "broke": {
    const econ = require('./legendaryEconomy');
    await econ.connectDB();
    const mongoose = require('mongoose');
    const users2 = await mongoose.model('EconUser').find({ chatID: m.chat }).sort({ wallet: 1, bank: 1 }).limit(5);
    if (!users2.length) return reply('📊 *No data yet!*');
    let poorText2 = '💀 *Top 5 Poorest*\n\n';
    users2.forEach((u, i) => { poorText2 += `${i + 1}. @${u.userID.replace('@s.whatsapp.net', '')} — ${econ.fmt(u.wallet + u.bank)}\n`; });
    reply(poorText2, { mentions: users2.map(u => u.userID) });
}
break;

case "econ":
case "econprofile": {
    const econ = require('./legendaryEconomy');
    const target = m.mentionedJid?.[0] || m.sender;
    const result = await econ.profile(target, m.chat);
    reply(`💰 *Economy Profile*\n\n▸ 👛 Wallet: ${econ.fmt(result.wallet)}\n▸ 🏦 Bank: ${econ.fmt(result.bank)}\n▸ 📊 Net Worth: ${econ.fmt(result.net)}\n▸ 🏅 Tier: ${result.tier}\n▸ 🔥 Streak: ${result.streak} days`, { mentions: [target] });
}
break;

case "transfer": {
    const econ = require('./legendaryEconomy');
    const transferTarget = m.mentionedJid?.[0];
    if (!transferTarget || !args[1]) return reply(`Usage: ${prefix}transfer @user [amount]`);
    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount <= 0) return reply('❌ *Invalid amount*');
    const result = await econ.transfer(m.sender, transferTarget, m.chat, amount);
    if (result.insufficient) return reply('❌ *Not enough in wallet*');
    reply(`✅ *Transferred ${econ.fmt(amount)} to @${transferTarget.replace('@s.whatsapp.net', '')}!*`, { mentions: [transferTarget] });
}
break;

// ============ YOUTUBE FIXED ============
case "ytmp3":
case "ytvideo":
case "ytv2":
case "play2": {
    if (!text) return reply(`🎵 *YouTube Downloader*\nUsage: ${prefix}ytmp3 [title or URL]`);
    try {
        reply('⏳ *Searching YouTube...*');
        const yts = require('yt-search');
        let videoUrl = text;
        if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
            const results = await yts(text);
            if (!results.videos.length) return reply('❌ *No results found*');
            videoUrl = results.videos[0].url;
        }
        const ytdl = require('@distube/ytdl-core');
        const info = await ytdl.getInfo(videoUrl);
        const title = info.videoDetails.title;
        const duration = info.videoDetails.lengthSeconds;
        if (duration > 1800) return reply('❌ *Too long (max 30 minutes)*');
        const isAudio = ['ytmp3', 'play2'].includes(command);
        const format = isAudio ? ytdl.chooseFormat(info.formats, { quality: 'lowestaudio', filter: 'audioonly' }) : ytdl.chooseFormat(info.formats, { quality: 'highestvideo', filter: 'videoandaudio' });
        if (isAudio) {
            await devtrust.sendMessage(m.chat, { audio: { url: format.url }, mimetype: 'audio/mpeg', fileName: `${title}.mp3`, ptt: false }, { quoted: m });
        } else {
            await devtrust.sendMessage(m.chat, { video: { url: format.url }, caption: `🎬 *${title}*`, mimetype: 'video/mp4' }, { quoted: m });
        }
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============ SPOTIFY FIXED ============
case "spotify2":
case "spotifydl2": {
    if (!text) return reply(`🎵 *Spotify Downloader*\nUsage: ${prefix}spotify2 [spotify URL]`);
    try {
        reply('⏳ *Fetching Spotify track...*');
        const res = await axios.get(`https://api.fabdl.com/spotify/get?url=${encodeURIComponent(text)}`);
        if (!res.data?.result) return reply('❌ *Could not fetch Spotify track*');
        const track = res.data.result;
        const dlRes = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${track.gid}/${track.id}`);
        const taskId = dlRes.data?.result?.task_id;
        if (!taskId) return reply('❌ *Conversion failed*');
        await new Promise(r => setTimeout(r, 5000));
        const mp3Res = await axios.get(`https://api.fabdl.com/spotify/mp3-convert-task/${track.gid}/${track.id}/${taskId}`);
        const mp3Url = mp3Res.data?.result?.download_url;
        if (!mp3Url) return reply('❌ *Download link not ready, try again*');
        await devtrust.sendMessage(m.chat, { audio: { url: `https://api.fabdl.com${mp3Url}` }, mimetype: 'audio/mpeg', fileName: `${track.name}.mp3`, ptt: false }, { quoted: m });
    } catch (e) { reply(`❌ *Error:* ${e.message}`); }
}
break;

// ============================================================
// =================== END LEGENDARY-AI COMMANDS ==============
// ============================================================

// ============================================================
// ============= LEGENDARY! ACTIVE AND LISTENING ==============
// ============================================================

case "legendary":
case "legendary!": {
    reply(`⚡ *LEGENDARY!*\n\n✅ *Active and Listening* 🎧\n\n_LËGĚNDÃRY BØT is online and ready!_`);
}
break;

// ============================================================
// =================== PLUGIN COMMANDS ========================
// ============================================================

// --- AZA (Account Details) - Per-User Storage ---
case "aza": {
    // Each user gets their own entry in the shared aza database (keyed by sender JID)
    const azaFile = './database/aza_users.json';

    // Load entire aza database
    let azaDB = {};
    try {
        if (!fs.existsSync(azaFile)) fs.writeFileSync(azaFile, JSON.stringify({}));
        azaDB = JSON.parse(fs.readFileSync(azaFile));
    } catch(e) { azaDB = {}; }

    // Helper: save back
    const saveAzaDB = (db) => fs.writeFileSync(azaFile, JSON.stringify(db, null, 2));

    // Use sender's JID as the unique key
    const azaKey = m.sender;

    if (!text) return reply(
        `💳 *AZA - Account Details*\n\n` +
        `▸ ${prefix}aza — view your saved account\n` +
        `▸ ${prefix}aza fancy — stylish display\n` +
        `▸ ${prefix}aza set bank: BankName no: 1234567890 acc: YourName\n` +
        `▸ ${prefix}aza clear — clear your saved details`
    );

    const lower = text.trim().toLowerCase();

    if (lower.startsWith('clear') || lower.startsWith('reset')) {
        delete azaDB[azaKey];
        saveAzaDB(azaDB);
        return reply('✅ Your account details have been cleared');
    }

    if (lower.startsWith('set')) {
        if (m.isGroup) return reply('⚠️ Please use this command in your DM for privacy');
        let raw = text.trim().replace(/^set/i, '').trim();
        let bank = raw.match(/bank:\s*([^\n]+?)(?=\s+no:|\s+acc:|$)/i)?.[1]?.trim();
        let no   = raw.match(/no:\s*([^\n]+?)(?=\s+acc:|$)/i)?.[1]?.trim();
        let acc  = raw.match(/acc:\s*([^\n]+)/i)?.[1]?.trim();
        if (!bank || !no || !acc) return reply(
            `❌ Invalid format.\n\nUse:\n${prefix}aza set bank: BankName no: 1234567890 acc: YourAccName`
        );
        azaDB[azaKey] = { bank, no, acc };
        saveAzaDB(azaDB);
        return reply(`✅ *Account details saved!*\n\n▸ Bank: ${bank}\n▸ No: ${no}\n▸ Name: ${acc}`);
    }

    // View account
    const azaData = azaDB[azaKey];
    if (!azaData) return reply(`❌ No account saved yet.\nUse: ${prefix}aza set bank: BankName no: 1234567890 acc: YourName`);

    if (lower === 'fancy') {
        return reply(
            `┌───────────────\n` +
            `│  *Account Details*\n` +
            `├───────────────\n` +
            `│ 🏦 Bank: ${azaData.bank}\n` +
            `│ 💳 Number: ${azaData.no}\n` +
            `│ 👤 Name: ${azaData.acc}\n` +
            `└───────────────`
        );
    }

    reply(`💳 *Your Account Details:*\n\n▸ 🏦 Bank: ${azaData.bank}\n▸ 💳 Account No: ${azaData.no}\n▸ 👤 Account Name: ${azaData.acc}`);
}
break;

// --- QR CODE ---
case "qr": {
    if (!text) return reply(`Usage: ${prefix}qr <text or URL>`);
    try {
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(text)}`;
        await devtrust.sendMessage(m.chat, { image: { url: qrUrl }, caption: `🔲 *QR Code for:* ${text}` }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- QR READ ---
// [REMOVED DUPLICATE: readqr]

// --- MSG PIN ---
case "msgpin":
case "pinmsg": {
    if (!m.quoted) return reply(`Reply to a message with:\n${prefix}msgpin 24hr\n${prefix}msgpin 7d\n${prefix}msgpin 30d`);
    if (!text) return reply(`Format: ${prefix}msgpin <time>\nTimes: 24hr, 7d, 30d`);
    const timeInput = text.trim().toLowerCase();
    const timesMap = { '24hr': { secs: 86400, label: '24 hours' }, '7d': { secs: 604800, label: '7 days' }, '30d': { secs: 2592000, label: '30 days' } };
    if (!timesMap[timeInput]) return reply(`Invalid time. Use: 24hr, 7d, or 30d`);
    try {
        const { secs, label } = timesMap[timeInput];
        const msgKey = m.quoted.fakeObj?.key || m.quoted.key;
        await devtrust.sendMessage(m.chat, { pin: msgKey, type: 1, time: secs });
        reply(`📌 Pinned for ${label}`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- REMOVE BG ---
// [REMOVED DUPLICATE: removebg]

// --- LIST JOIN REQUESTS ---
case "listrequest":
case "joinrequests": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    try {
        const list2 = await devtrust.groupRequestParticipantsList(m.chat);
        if (!list2.length) return reply('📋 No pending join requests');
        let reqText = '*Pending Join Requests:*\n\n';
        list2.forEach((r, i) => { reqText += `${i+1}. +${r.phone_number?.replace('@s.whatsapp.net', '')}\n`; });
        reply(reqText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- APPROVE JOIN REQUESTS ---
case "approve":
case "approveall": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    if (!text) return reply(`Usage: ${prefix}approve all\n${prefix}approve 234xxxxxxxx`);
    try {
        const pending2 = await devtrust.groupRequestParticipantsList(m.chat);
        if (!pending2.length) return reply('No pending requests');
        if (text.toLowerCase() === 'all') {
            const jids2 = pending2.map(p => p.phone_number);
            await devtrust.groupRequestParticipantsUpdate(m.chat, jids2, 'approve');
            return reply(`✅ Approved ${jids2.length} request(s)`);
        }
        const nums = text.split(',').map(n => n.trim().replace(/[^0-9]/g,'') + '@s.whatsapp.net');
        await devtrust.groupRequestParticipantsUpdate(m.chat, nums, 'approve');
        reply(`✅ Approved ${nums.length} request(s)`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- REJECT JOIN REQUESTS ---
case "reject":
case "rejectall": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    if (!text) return reply(`Usage: ${prefix}reject all\n${prefix}reject 234xxxxxxxx`);
    try {
        const pendingR = await devtrust.groupRequestParticipantsList(m.chat);
        if (!pendingR.length) return reply('No pending requests');
        if (text.toLowerCase() === 'all') {
            const jidsR = pendingR.map(p => p.phone_number);
            await devtrust.groupRequestParticipantsUpdate(m.chat, jidsR, 'reject');
            return reply(`✅ Rejected ${jidsR.length} request(s)`);
        }
        const numsR = text.split(',').map(n => n.trim().replace(/[^0-9]/g,'') + '@s.whatsapp.net');
        await devtrust.groupRequestParticipantsUpdate(m.chat, numsR, 'reject');
        reply(`✅ Rejected ${numsR.length} request(s)`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- OCR / TEXT FROM IMAGE ---
case "ocr":
case "readtext":
case "imagetext": {
    const ocrQuoted = m.quoted && (m.quoted.mimetype?.includes('image') || m.quoted.mtype === 'imageMessage');
    const ocrDirect = m.mtype === 'imageMessage';
    if (!ocrQuoted && !ocrDirect) return reply('Reply to an image to extract text');
    try {
        reply('⏳ Extracting text...');
        const ocrMedia = await devtrust.downloadMediaMessage(ocrQuoted ? m.quoted : m);
        const FormDataOCR = require('form-data');
        const formOCR = new FormDataOCR();
        formOCR.append('file', ocrMedia, { filename: 'img.png', contentType: 'image/png' });
        const ocrRes = await axios.post('https://api.ocr.space/parse/image', formOCR, { headers: { ...formOCR.getHeaders(), 'apikey': 'helloworld' } });
        const ocrText = ocrRes.data?.ParsedResults?.[0]?.ParsedText;
        if (!ocrText?.trim()) return reply('❌ No text found in image');
        reply(`📝 *Extracted Text:*\n\n${ocrText}`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- LIVE MATCH ---
case "match":
case "livematch":
case "score": {
    if (!text) return reply(`Usage: ${prefix}match <team>\nExample: ${prefix}match Nigeria\nOr: ${prefix}match Nigeria vs Ghana`);
    try {
        reply('⚽ Searching for matches...');
        const matchRes = await axios.get(`https://live-kord.vercel.app/api/live-matches?team=${encodeURIComponent(text)}`, { timeout: 10000 });
        const matchData = matchRes.data;
        if (!matchData.success || !matchData.data?.matches?.length) return reply(`❌ No matches found for *${text}*`);
        const matches2 = matchData.data.matches.slice(0, 5);
        let matchText = `⚽ *Match Results for "${text}"*\n\n`;
        matches2.forEach((match, i) => {
            matchText += `${i+1}. *${match.team1} vs ${match.team2}*\n`;
            matchText += `   📊 Score: ${match.score} | ${match.status} ${match.time}\n`;
            matchText += `   🏆 League: ${match.league}\n`;
            if (match.country) matchText += `   🌍 Country: ${match.country}\n`;
            matchText += '\n';
        });
        reply(matchText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- FETCH URL ---
case "fetch":
case "fetchurl": {
    if (!text) return reply(`Usage: ${prefix}fetch <url>`);
    try {
        const fetchRes = await axios.get(text, { responseType: 'arraybuffer', timeout: 15000 });
        const ct = fetchRes.headers['content-type'] || '';
        if (ct.includes('image')) {
            await devtrust.sendMessage(m.chat, { image: Buffer.from(fetchRes.data), caption: `📥 Fetched from: ${text}` }, { quoted: m });
        } else if (ct.includes('video')) {
            await devtrust.sendMessage(m.chat, { video: Buffer.from(fetchRes.data), caption: `📥 Fetched from: ${text}` }, { quoted: m });
        } else if (ct.includes('audio')) {
            await devtrust.sendMessage(m.chat, { audio: Buffer.from(fetchRes.data), mimetype: 'audio/mpeg' }, { quoted: m });
        } else {
            reply(`📥 Content from URL:\n${Buffer.from(fetchRes.data).toString('utf8').slice(0, 1000)}`);
        }
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- CURRENCY RATES ---
// [REMOVED DUPLICATE: currency]

// --- BTC PRICE ---
case "btc":
case "bitcoin": {
    try {
        const btcRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT');
        const d = btcRes.data?.data;
        reply(`₿ *Bitcoin (BTC-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(2)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(2)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(2)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} BTC`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- ETH PRICE ---
case "eth":
case "ethereum": {
    try {
        const ethRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT');
        const d = ethRes.data?.data;
        reply(`Ξ *Ethereum (ETH-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(2)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(2)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(2)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} ETH`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- DOGE PRICE ---
case "doge":
case "dogecoin": {
    try {
        const dogeRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT');
        const d = dogeRes.data?.data;
        reply(`🐕 *Dogecoin (DOGE-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(6)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(6)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(6)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} DOGE`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- XRP PRICE ---
case "xrp":
case "ripple": {
    try {
        const xrpRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT');
        const d = xrpRes.data?.data;
        reply(`💧 *XRP (XRP-USDT)*\n\n▸ Price: $${parseFloat(d.last).toFixed(4)}\n▸ 24h Change: ${parseFloat(d.changeRate).toFixed(2)}%\n▸ 24h High: $${parseFloat(d.high).toFixed(4)}\n▸ 24h Low: $${parseFloat(d.low).toFixed(4)}\n▸ Volume: ${parseFloat(d.vol).toFixed(2)} XRP`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- NGN RATES ---
case "ngnrates":
case "ngn-rates":
case "naira": {
    try {
        const ngnRes = await axios.get('https://open.er-api.com/v6/latest/NGN');
        const top = ['USD','EUR','GBP','KES','GHS','ZAR','AUD','CAD'];
        let ngnMsg = '🇳🇬 *NGN Exchange Rates:*\n\n';
        top.forEach(c => { if (ngnRes.data.rates[c]) ngnMsg += `▸ NGN → ${c}: ${ngnRes.data.rates[c].toFixed(6)}\n`; });
        reply(ngnMsg);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ============================================================
// =================== 300 NEW COMMANDS =======================
// ============================================================

// --- FUN & SOCIAL ---
// [REMOVED DUPLICATE: joke]

case "riddle": {
    const riddles = [
        { q: "I have cities, but no houses live there. I have mountains, but no trees grow there. I have water, but no fish swim there. What am I?", a: "A Map!" },
        { q: "The more you take, the more you leave behind. What am I?", a: "Footsteps!" },
        { q: "I speak without a mouth and hear without ears. I have no body, but I come alive with wind. What am I?", a: "An Echo!" },
        { q: "What has hands but can't clap?", a: "A Clock!" },
        { q: "What gets wetter as it dries?", a: "A Towel!" }
    ];
    const r = riddles[Math.floor(Math.random() * riddles.length)];
    reply(`🧠 *Riddle Time!*\n\n❓ ${r.q}\n\n_Reply_ \`.answer\` _to get the answer_\n||${r.a}||`);
}
break;
// [REMOVED DUPLICATE: fact]
// [REMOVED DUPLICATE: quote]
// [REMOVED DUPLICATE: roast]
// [REMOVED DUPLICATE: compliment]

case "ship":
case "love": {
    const targets = m.mentionedJid;
    if (!targets || targets.length < 2) return reply(`Tag 2 people!\nExample: ${prefix}ship @person1 @person2`);
    const percent = Math.floor(Math.random() * 101);
    const bars = '❤️'.repeat(Math.floor(percent/10)) + '🖤'.repeat(10-Math.floor(percent/10));
    reply(`💘 *Love Calculator*\n\n@${targets[0].split('@')[0]} + @${targets[1].split('@')[0]}\n\n${bars}\n\n❤️ *${percent}% Match!*\n\n${percent >= 80 ? '💑 Perfect couple!' : percent >= 50 ? '😊 Good match!' : '😬 Needs work!'}`, targets);
}
break;
// [REMOVED DUPLICATE: truth]
// [REMOVED DUPLICATE: dare]

case "tod":
case "truthordare": {
    const coin3 = Math.random() > 0.5;
    const tod_truths = ["What's your most embarrassing moment?", "Have you ever lied to your parents?", "What's your biggest secret?"];
    const tod_dares = ["Send a voice note right now!", "Change your status for 1 hour!", "Tag your crush!"];
    if (coin3) {
        reply(`🎲 *Truth!*\n\n${tod_truths[Math.floor(Math.random() * tod_truths.length)]}`);
    } else {
        reply(`😈 *Dare!*\n\n${tod_dares[Math.floor(Math.random() * tod_dares.length)]}`);
    }
}
break;

// calc/calculate handled above

// tinyurl/shorten/shorturl handled above

case "wttr": {
    if (!text) return reply(`Usage: ${prefix}wttr Lagos`);
    try {
        const wRes = await axios.get(`https://wttr.in/${encodeURIComponent(text)}?format=3`);
        reply(`🌤️ *Weather*\n\n${wRes.data}`);
    } catch(e) { reply(`❌ Error fetching weather`); }
}
break;
// [REMOVED DUPLICATE: translate]

case "time":
case "clock": {
    const zones = { 'Nigeria': 'Africa/Lagos', 'Kenya': 'Africa/Nairobi', 'London': 'Europe/London', 'New York': 'America/New_York', 'Dubai': 'Asia/Dubai', 'India': 'Asia/Kolkata' };
    let timeText2 = `🕐 *World Times*\n\n`;
    Object.entries(zones).forEach(([city, tz]) => {
        timeText2 += `🌍 ${city}: *${moment().tz(tz).format('HH:mm:ss z')}*\n`;
    });
    reply(timeText2);
}
break;

case "date":
case "today": {
    reply(`📅 *Today's Date*\n\n🗓️ ${moment().tz('Africa/Lagos').format('dddd, MMMM Do YYYY')}\n🕐 Time (Lagos): ${moment().tz('Africa/Lagos').format('HH:mm:ss')}\n🌍 UTC: ${moment().utc().format('HH:mm:ss')}`);
}
break;

case "countdown": {
    if (!text) return reply(`Usage: ${prefix}countdown YYYY-MM-DD\nExample: ${prefix}countdown 2025-12-25`);
    try {
        const target3 = moment(text.trim());
        if (!target3.isValid()) return reply('❌ Invalid date format. Use YYYY-MM-DD');
        const now3 = moment();
        const diff = target3.diff(now3);
        if (diff < 0) return reply('❌ That date has already passed!');
        const dur = moment.duration(diff);
        reply(`⏳ *Countdown to ${text}*\n\n📅 ${Math.floor(dur.asDays())} days\n⏰ ${dur.hours()} hours\n⏱️ ${dur.minutes()} minutes\n⌚ ${dur.seconds()} seconds`);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "base64encode":
case "b64enc": {
    if (!text) return reply(`Usage: ${prefix}b64enc <text>`);
    reply(`🔒 *Base64 Encoded:*\n\n\`\`\`${Buffer.from(text).toString('base64')}\`\`\``);
}
break;

case "base64decode":
case "b64dec": {
    if (!text) return reply(`Usage: ${prefix}b64dec <base64text>`);
    try {
        reply(`🔓 *Base64 Decoded:*\n\n\`\`\`${Buffer.from(text, 'base64').toString('utf8')}\`\`\``);
    } catch(e) { reply('❌ Invalid base64 string'); }
}
break;

case "password":
case "generatepassword": {
    const len = parseInt(text) || 16;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let pass = '';
    for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
    reply(`🔑 *Generated Password (${len} chars):*\n\n\`\`\`${pass}\`\`\`\n\n⚠️ _Save this somewhere safe!_`);
}
break;

case "uuid":
case "generateid": {
    const uid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0, v = c=='x'?r:(r&0x3|0x8);
        return v.toString(16);
    });
    reply(`🆔 *Generated UUID:*\n\n\`\`\`${uid}\`\`\``);
}
break;

case "color":
case "randomcolor":
case "colourpick": {
    const hex = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6,'0').toUpperCase();
    const r4 = parseInt(hex.slice(1,3),16), g4 = parseInt(hex.slice(3,5),16), b4 = parseInt(hex.slice(5,7),16);
    reply(`🎨 *Random Color*\n\n▸ HEX: \`${hex}\`\n▸ RGB: rgb(${r4}, ${g4}, ${b4})\n▸ Preview: https://singlecolorimage.com/get/${hex.slice(1)}/200x200`);
}
break;

case "encode":
case "urlencode": {
    if (!text) return reply(`Usage: ${prefix}encode <text>`);
    reply(`🔗 *URL Encoded:*\n\n\`${encodeURIComponent(text)}\``);
}
break;

case "decode":
case "urldecode": {
    if (!text) return reply(`Usage: ${prefix}decode <url encoded text>`);
    try { reply(`🔓 *URL Decoded:*\n\n\`${decodeURIComponent(text)}\``); }
    catch(e) { reply('❌ Invalid URL encoded string'); }
}
break;

case "hash":
case "md5": {
    if (!text) return reply(`Usage: ${prefix}hash <text>`);
    const md5hash = crypto.createHash('md5').update(text).digest('hex');
    const sha1hash = crypto.createHash('sha1').update(text).digest('hex');
    const sha256hash = crypto.createHash('sha256').update(text).digest('hex');
    reply(`#️⃣ *Hash Results for:* \`${text}\`\n\n▸ MD5: \`${md5hash}\`\n▸ SHA1: \`${sha1hash}\`\n▸ SHA256: \`${sha256hash}\``);
}
break;
// [REMOVED DUPLICATE: flip]

case "roll": {
    const sides = parseInt(text) || 6;
    const rolled = Math.floor(Math.random() * sides) + 1;
    reply(`🎲 *Dice Roll (${sides}-sided)*\n\nYou rolled: *${rolled}*`);
}
break;
// [REMOVED DUPLICATE: 8ball]
// [REMOVED DUPLICATE: pick]

case "number":
case "randnum":
case "randomnumber": {
    const parts2 = text.split(/\s+/);
    const min2 = parseInt(parts2[0]) || 1;
    const max2 = parseInt(parts2[1]) || 100;
    const rn = Math.floor(Math.random() * (max2 - min2 + 1)) + min2;
    reply(`🔢 *Random Number (${min2} - ${max2})*\n\nResult: *${rn}*`);
}
break;

// --- INFO COMMANDS ---
// [REMOVED DUPLICATE: ip]

case "country":
case "countryinfo": {
    if (!text) return reply(`Usage: ${prefix}country Nigeria`);
    try {
        const cRes = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(text)}`);
        const c2 = cRes.data[0];
        reply(`🌍 *${c2.name.common}*\n\n▸ Official: ${c2.name.official}\n▸ Capital: ${c2.capital?.[0]}\n▸ Population: ${c2.population?.toLocaleString()}\n▸ Region: ${c2.region}\n▸ Subregion: ${c2.subregion}\n▸ Languages: ${Object.values(c2.languages||{}).join(', ')}\n▸ Currency: ${Object.values(c2.currencies||{}).map(c3=>c3.name).join(', ')}\n▸ Calling Code: +${Object.keys(c2.idd?.suffixes||{})[0]}`);
    } catch(e) { reply(`❌ Country not found`); }
}
break;
// [REMOVED DUPLICATE: wiki]
// [REMOVED DUPLICATE: define]

case "news": {
    try {
        const newsRes = await axios.get('https://newsapi.org/v2/top-headlines?country=ng&apiKey=pub_demo&pageSize=5').catch(() => null);
        if (!newsRes?.data?.articles) return reply('📰 *News feature requires a NewsAPI key*\nVisit: newsapi.org');
        let newsText = '📰 *Latest News:*\n\n';
        newsRes.data.articles.forEach((a, i) => { newsText += `${i+1}. *${a.title}*\n${a.source?.name}\n\n`; });
        reply(newsText);
    } catch(e) { reply('❌ Could not fetch news'); }
}
break;

// --- TEXT EFFECTS ---
case "bold": {
    if (!text) return reply(`Usage: ${prefix}bold <text>`);
    reply(`*${text}*`);
}
break;

case "italic": {
    if (!text) return reply(`Usage: ${prefix}italic <text>`);
    reply(`_${text}_`);
}
break;

case "strike":
case "strikethrough": {
    if (!text) return reply(`Usage: ${prefix}strike <text>`);
    reply(`~${text}~`);
}
break;

case "mono":
case "monospace": {
    if (!text) return reply(`Usage: ${prefix}mono <text>`);
    reply(`\`\`\`${text}\`\`\``);
}
break;

case "reversetext": {
    if (!text) return reply(`Usage: ${prefix}reversetext <text>`);
    reply(`🔄 *Reversed:* ${text.split('').reverse().join('')}`);
}
break;

case "upper":
case "uppercase": {
    if (!text) return reply(`Usage: ${prefix}upper <text>`);
    reply(text.toUpperCase());
}
break;

case "lower":
case "lowercase": {
    if (!text) return reply(`Usage: ${prefix}lower <text>`);
    reply(text.toLowerCase());
}
break;

case "count":
case "wordcount": {
    if (!text) return reply(`Usage: ${prefix}count <text>`);
    const words3 = text.trim().split(/\s+/).filter(Boolean);
    reply(`📊 *Text Stats*\n\n▸ Characters: ${text.length}\n▸ Words: ${words3.length}\n▸ Lines: ${text.split('\n').length}`);
}
break;

case "repeat": {
    const repParts = text.split(' ');
    const repTimes = parseInt(repParts[0]) || 3;
    const repText = repParts.slice(1).join(' ');
    if (!repText) return reply(`Usage: ${prefix}repeat 3 Hello`);
    if (repTimes > 20) return reply('Max repeat is 20');
    reply(Array(repTimes).fill(repText).join('\n'));
}
break;

case "emojify": {
    if (!text) return reply(`Usage: ${prefix}emojify <text>`);
    const emojiMap2 = { a:'🅰️',b:'🅱️',c:'©️',e:'📧',i:'ℹ️',m:'Ⓜ️',o:'⭕',p:'🅿️',r:'®️',s:'💲',x:'❌' };
    const emojified = text.toLowerCase().split('').map(c => emojiMap2[c] || c).join('');
    reply(emojified);
}
break;

// --- GROUP TOOLS ---
// [REMOVED DUPLICATE: groupinfo]

case "adminlist":
case "admins": {
    if (!m.isGroup) return reply('❌ Group only');
    const adminJids = participants.filter(p => p.admin).map(p => p.id);
    let adminText = `👑 *Group Admins (${adminJids.length}):*\n\n`;
    adminJids.forEach((a, i) => { adminText += `${i+1}. @${a.split('@')[0]}\n`; });
    reply(adminText, adminJids);
}
break;
// [REMOVED DUPLICATE: members]
// [REMOVED DUPLICATE: tagall]

case "tagadmins":
case "pingadmins": {
    if (!m.isGroup) return reply('❌ Group only');
    const adminJids2 = participants.filter(p => p.admin).map(p => p.id);
    let admTag = `📢 *Calling all admins!*\n\n`;
    adminJids2.forEach(j => { admTag += `@${j.split('@')[0]} `; });
    reply(admTag, adminJids2);
}
break;

case "setwelcome": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply(`Usage: ${prefix}setwelcome Welcome {user} to {group}!`);
    setSetting(m.chat, 'welcomeMsg', text);
    reply(`✅ Welcome message set!\n\nPreview: ${text.replace('{user}','@NewMember').replace('{group}', groupMetadata?.subject)}`);
}
break;

case "clearwelcome": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(m.chat, 'welcomeMsg', null);
    reply('✅ Welcome message cleared');
}
break;
// [REMOVED DUPLICATE: lock]
// [REMOVED DUPLICATE: unlock]
// [REMOVED DUPLICATE: setname]
// [REMOVED DUPLICATE: setdesc]
// [REMOVED DUPLICATE: promote]
// [REMOVED DUPLICATE: demote]
// [REMOVED DUPLICATE: kick]
// [REMOVED DUPLICATE: add]
// [REMOVED DUPLICATE: invite]
// [REMOVED DUPLICATE: revoke]

// --- MEDIA TOOLS ---
// sticker/s — handled above (case 'tosticker'/'sticker'/'s')
// toimage/stickertoimg/toimg — handled above (case 'toimg')
// [REMOVED DUPLICATE: forward]

case "save":
case "dm": {
    if (!m.quoted) return reply('Reply to a message to save it to your DM');
    try {
        await devtrust.copyNForward(m.sender, m.quoted);
        reply('✅ Saved to your DM!');
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

// --- BOT SETTINGS ---
// [REMOVED DUPLICATE: public]
// [REMOVED DUPLICATE: setprefix]

case "prefix": {
    reply(`🔧 *Your current prefix:* \`${prefix}\`\n_Change it with_ \`${prefix}setprefix [new]\``);
}
break;

case "creator": {
    reply(`👑 *Bot Owner*\n\nName: LËGĚNDÃRY Ł𝗮𝗯𝘀™\nNumber: wa.me/2348087253512\nBot: LËGĚNDÃRY BØT MD`);
}
break;

// ping/speed handled above

case "uptime": {
    const up = process.uptime();
    reply(`⏰ *Bot Uptime*\n\n▸ ${Math.floor(up/3600)}h ${Math.floor((up%3600)/60)}m ${Math.floor(up%60)}s\n▸ PID: ${process.pid}\n▸ Node: ${process.version}`);
}
break;

case "usage":
case "sysinfo": {
    const mem2 = process.memoryUsage();
    const cpu = os.cpus()[0];
    reply(`💻 *System Info*\n\n▸ RAM: ${(mem2.heapUsed/1024/1024).toFixed(1)}MB / ${(mem2.heapTotal/1024/1024).toFixed(1)}MB\n▸ CPU: ${cpu.model?.slice(0,30)}\n▸ OS: ${os.platform()} ${os.arch()}\n▸ Node: ${process.version}\n▸ Uptime: ${formatUptime(process.uptime())}`);
}
break;

case "setautoread": {
    const arStatus = getSetting(m.sender, 'autoread', false);
    setSetting(m.sender, 'autoread', !arStatus);
    reply(`👁️ Auto-Read: *${!arStatus ? 'ON' : 'OFF'}*`);
}
break;

case "setautotyping": {
    const atStatus = getSetting(m.chat, 'autoTyping', false);
    setSetting(m.chat, 'autoTyping', !atStatus);
    reply(`⌨️ Auto-Typing: *${!atStatus ? 'ON' : 'OFF'}*`);
}
break;
// [REMOVED DUPLICATE: autobio]

case "viewstatus": {
    const vsStatus = getSetting(m.sender, 'autoViewStatus', false);
    setSetting(m.sender, 'autoViewStatus', !vsStatus);
    reply(`👀 Auto-View Status: *${!vsStatus ? 'ON' : 'OFF'}*`);
}
break;

// bio/setbio handled above
// [REMOVED DUPLICATE: pp]
// [REMOVED DUPLICATE: setpp]
// [REMOVED DUPLICATE: block]
// [REMOVED DUPLICATE: unblock]

// --- EXTRA FEATURES ---
// [REMOVED DUPLICATE: tts]

case "ttsptt":
case "voicenote": {
    if (!text) return reply(`Usage: ${prefix}ttsptt [text]`);
    try {
        const ttsPttUrl = googleTTS.getAudioUrl(text.slice(0, 200), { lang: 'en', slow: false });
        await devtrust.sendMessage(m.chat, { audio: { url: ttsPttUrl }, mimetype: 'audio/ogg; codecs=opus', ptt: true }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "reaction":
case "react": {
    if (!m.quoted) return reply('Reply to a message to react');
    const emList = ['❤️','🔥','😂','😍','👍','🎉','💯','😭','🙏','⚡'];
    const em2 = text || emList[Math.floor(Math.random() * emList.length)];
    await devtrust.sendMessage(m.chat, { react: { text: em2, key: m.quoted.key } });
    reply(`✅ Reacted with ${em2}`);
}
break;

case "delete2":
case "unsend": {
    if (!m.quoted) return reply('Reply to a message to delete it');
    if (!isAdmins && !isCreator && m.quoted.sender !== m.sender) return reply('❌ You can only delete your own messages');
    try {
        const delKey2 = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id || m.quoted.key?.id || m.quoted.fakeObj?.key?.id,
            participant: m.quoted.sender || m.quoted.key?.participant || m.quoted.fakeObj?.key?.participant
        };
        await devtrust.sendMessage(m.chat, { delete: delKey2 });
        reply('✅ Message deleted');
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "copy":
case "copytext": {
    if (!m.quoted) return reply('Reply to a message to copy its text');
    const copiedText = m.quoted.text || m.quoted.caption || m.quoted.body || '';
    if (!copiedText) return reply('❌ No text to copy');
    reply(`📋 *Copied:*\n\n${copiedText}`);
}
break;

// lyrics handled above
// [REMOVED DUPLICATE: anime]

case "nasa":
case "apod":
case "spaceimage": {
    try {
        const nasaRes = await axios.get('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
        const nData = nasaRes.data;
        if (nData.media_type === 'image') {
            await devtrust.sendMessage(m.chat, { image: { url: nData.url }, caption: `🌌 *NASA: ${nData.title}*\n\n${nData.explanation?.slice(0,400)}...` }, { quoted: m });
        } else {
            reply(`🌌 *NASA APOD: ${nData.title}*\n\n${nData.explanation?.slice(0,500)}...\n\n🔗 ${nData.url}`);
        }
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "crypto":
case "cryptoprices": {
    try {
        const crypRes = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,dogecoin,solana,cardano&vs_currencies=usd&include_24hr_change=true');
        const cp = crypRes.data;
        let crypText = '💰 *Crypto Prices (USD):*\n\n';
        Object.entries(cp).forEach(([coin, data4]) => {
            const change4 = data4.usd_24h_change?.toFixed(2);
            const arrow = change4 > 0 ? '📈' : '📉';
            crypText += `${arrow} *${coin.toUpperCase()}:* $${data4.usd?.toLocaleString()} (${change4}%)\n`;
        });
        reply(crypText);
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: meme]

case "cat":
case "catpic": {
    try {
        const catRes = await axios.get('https://api.thecatapi.com/v1/images/search');
        await devtrust.sendMessage(m.chat, { image: { url: catRes.data[0].url }, caption: '🐱 *Here\'s a random cat!*' }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;

case "dog":
case "dogpic": {
    try {
        const dogRes = await axios.get('https://dog.ceo/api/breeds/image/random');
        await devtrust.sendMessage(m.chat, { image: { url: dogRes.data.message }, caption: '🐶 *Here\'s a random dog!*' }, { quoted: m });
    } catch(e) { reply(`❌ Error: ${e.message}`); }
}
break;
// [REMOVED DUPLICATE: fox]

case "pokemon":
case "poke": {
    if (!text) return reply(`Usage: ${prefix}pokemon pikachu`);
    try {
        const pokeRes = await axios.get(`https://pokeapi.co/api/v2/pokemon/${text.toLowerCase().trim()}`);
        const poke2 = pokeRes.data;
        const imgUrl = poke2.sprites.other['official-artwork'].front_default || poke2.sprites.front_default;
        const types2 = poke2.types.map(t => t.type.name).join(', ');
        const stats2 = poke2.stats.map(s => `${s.stat.name}: ${s.base_stat}`).join(' | ');
        await devtrust.sendMessage(m.chat, { image: { url: imgUrl }, caption: `🎮 *#${poke2.id} ${poke2.name.toUpperCase()}*\n\n▸ Type: ${types2}\n▸ Height: ${poke2.height/10}m\n▸ Weight: ${poke2.weight/10}kg\n▸ Stats: ${stats2}` }, { quoted: m });
    } catch(e) { reply(`❌ Pokémon not found`); }
}
break;
// [REMOVED DUPLICATE: github]
// [REMOVED DUPLICATE: ytsearch]
// [REMOVED DUPLICATE: tiktok]
// [REMOVED DUPLICATE: instagram]
// [REMOVED DUPLICATE: font]

case "ascii":
case "asciify": {
    const asciiChars = ['@','#','S','%','?','*','+',';',':',',','.'];
    if (!text) return reply(`Usage: ${prefix}ascii [text]`);
    const asciiArt = text.slice(0,20).split('').map(c => c === ' ' ? '   ' : asciiChars[c.charCodeAt(0) % asciiChars.length].repeat(3)).join(' ');
    reply(`\`\`\`${asciiArt}\`\`\``);
}
break;

case "numberinfo":
case "phoneinfo": {
    if (!text) return reply(`Usage: ${prefix}phoneinfo 2348012345678`);
    const num2 = text.replace(/[^0-9]/g,'');
    const cc = num2.startsWith('234') ? 'Nigeria 🇳🇬' : num2.startsWith('254') ? 'Kenya 🇰🇪' : num2.startsWith('233') ? 'Ghana 🇬🇭' : num2.startsWith('27') ? 'South Africa 🇿🇦' : num2.startsWith('44') ? 'UK 🇬🇧' : num2.startsWith('1') ? 'USA/Canada 🇺🇸' : 'Unknown';
    reply(`📱 *Phone Info*\n\n▸ Number: +${num2}\n▸ Country: ${cc}\n▸ Length: ${num2.length} digits\n▸ WhatsApp: https://wa.me/${num2}`);
}
break;

case "warlist":
case "warns": {
    if (!m.isGroup) return reply('❌ Group only');
    const warnData = global.warns[m.chat] || {};
    if (!Object.keys(warnData).length) return reply('✅ No warned users in this group');
    let warnText = '⚠️ *Warned Users:*\n\n';
    Object.entries(warnData).forEach(([jid, count2]) => { warnText += `▸ @${jid.split('@')[0]}: ${count2} warn(s)\n`; });
    reply(warnText, Object.keys(warnData));
}
break;

case "clearwarns":
case "resetwarns": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    const cwTarget = m.mentionedJid?.[0];
    if (cwTarget) {
        if (global.warns[m.chat]) delete global.warns[m.chat][cwTarget];
        reply(`✅ Cleared warns for @${cwTarget.split('@')[0]}`, [cwTarget]);
    } else {
        global.warns[m.chat] = {};
        reply('✅ All warns cleared for this group');
    }
}
break;

case "report": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!m.quoted) return reply('Reply to a message to report it');
    const adminJids3 = participants.filter(p => p.admin).map(p => p.id);
    let repText = `🚨 *Report from @${m.sender.split('@')[0]}*\n\nMessage from: @${m.quoted.sender?.split('@')[0]}\nReason: ${text || 'No reason given'}`;
    adminJids3.forEach(async a => { try { await devtrust.sendMessage(a, { text: repText }); } catch(e) {} });
    reply('✅ Reported to admins!', adminJids3);
}
break;

case "announce":
case "broadcast2": {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply(`Usage: ${prefix}announce [message]`);
    const allMentions = participants.map(p => p.id);
    reply(`📢 *ANNOUNCEMENT*\n\n${text}`, allMentions);
}
break;
// [REMOVED DUPLICATE: poll]

case "timer2":
case "settimer": {
    if (!text) return reply(`Usage: ${prefix}timer2 5m Meeting starts`);
    const timerMatch = text.match(/^(\d+)(s|m|h)\s*(.*)/i);
    if (!timerMatch) return reply('Format: .timer2 5m Message');
    const [, amt, unit, timerMsg] = timerMatch;
    const ms2 = parseInt(amt) * (unit === 's' ? 1000 : unit === 'm' ? 60000 : 3600000);
    if (ms2 > 3600000) return reply('Max timer is 1 hour');
    reply(`⏰ Timer set for ${amt}${unit}. I\'ll remind you: "${timerMsg || 'Time is up!'}" `);
    setTimeout(() => reply(`⏰ *TIMER ALERT!*\n\n${timerMsg || 'Your timer is up!'}\n\n_Set by @${m.sender.split('@')[0]}_`, [m.sender]), ms2);
}
break;

case "note":
case "savenote": {
    const noteFile = `./database/notes_${m.sender.split('@')[0]}.json`;
    if (!text) {
        try {
            const notes2 = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : [];
            if (!notes2.length) return reply('📝 No saved notes. Use .note [text] to save');
            reply(`📝 *Your Notes:*\n\n${notes2.map((n,i) => `${i+1}. ${n}`).join('\n')}`);
        } catch(e) { reply('📝 No notes saved'); }
    } else {
        let notes3 = [];
        try { notes3 = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : []; } catch(e) {}
        notes3.push(text);
        fs.writeFileSync(noteFile, JSON.stringify(notes3));
        reply(`✅ Note saved! You have ${notes3.length} note(s)\n\nUse ${prefix}note to view all`);
    }
}
break;
// [REMOVED DUPLICATE: clearnotes]

case "reminder": {
    reply(`⏰ *Reminder System*\n\nUse ${prefix}timer2 [time] [message]\nExamples:\n${prefix}timer2 5m Check the food\n${prefix}timer2 1h Meeting reminder\n${prefix}timer2 30s Take medicine`);
}
break;

case "help":
case "commands": {
    reply(`📋 *LËGĚNDÃRY BØT Commands*\n\nUse ${prefix}menu for the full menu\n\n🎮 *Fun:* joke, riddle, fact, quote, roast, compliment, ship, truth, dare, 8ball, pick\n\n🔧 *Tools:* calc, qr, weather, translate, tts, lyrics, wiki, define\n\n📱 *Media:* sticker, removebg, ytmp3, tiktok, meme, cat, dog\n\n👥 *Group:* kick, add, promote, demote, tagall, lock, unlock, poll\n\n💰 *Crypto:* btc, eth, doge, xrp, currency\n\n⚙️ *Settings:* prefix, setprefix, autoread, autobio`);
}
break;

case "listall":
case "allcommands": {
    reply(`📋 *All Available Commands:*\n\n*FUN:* joke riddle fact quote roast compliment ship love truth dare tod 8ball pick\n\n*TOOLS:* calc qr qrread weather translate time date countdown b64enc b64dec password uuid color hash flip dice pick number tts\n\n*INFO:* ip country wiki define news phoneinfo github pokemon anime nasa\n\n*MEDIA:* sticker toimage forward save meme cat dog fox lyrics tiktok igdl\n\n*TEXT:* bold italic strike mono reverse upper lower count repeat emojify font ascii\n\n*GROUP:* tagall tagadmins admins groupinfo lock unlock kick add promote demote setname setdesc invite revoke poll announce report\n\n*CRYPTO:* btc eth doge xrp crypto currency ngn-rates btc-usdt\n\n*PLUGINS:* aza removebg qr match fetch ocr currrates listrequest approve reject msgpin\n\n*BOT:* ping uptime stats runtime menu help prefix setprefix legendary`);
}
break;


// ============================================================
// ============ LEGENDARY BOT - NEW COMMANDS BLOCK ============
// ============================================================

// ===== LEGENDARY PING =====
// [REMOVED DUPLICATE: legendary]

// ===== QR CODE GENERATOR =====
// [REMOVED DUPLICATE: qr]

// ===== REMOVE BACKGROUND =====
// [REMOVED DUPLICATE: rmbg]

// ===== PIN MESSAGE =====
// [REMOVED DUPLICATE: msgpin]

// ===== BANK ACCOUNT SAVER =====
// [REMOVED DUPLICATE: aza]

// ===== LIST JOIN REQUESTS =====
// [REMOVED DUPLICATE: listrequest]

// ===== APPROVE JOIN REQUESTS =====
// [REMOVED DUPLICATE: approve]

// ===== REJECT JOIN REQUESTS =====
// [REMOVED DUPLICATE: reject]

// ===== AUTO-REPLY SET =====
// [REMOVED DUPLICATE: autoreply]

// ===== AUTO-REPLY STOP =====
case 'sreply':
case 'stopreply': {
    if (!m.isGroup) return reply('❌ Group only command');
    if (!text) return reply(`Give the trigger word to remove.\n${prefix}sreply trigger-word`);
    const srFile = './database/autoreply.json';
    const srStore = fs.existsSync(srFile) ? JSON.parse(fs.readFileSync(srFile)) : {};
    if (!srStore[m.chat]?.[text.toLowerCase()]) return reply(`❌ No auto-reply found for *${text}*`);
    delete srStore[m.chat][text.toLowerCase()];
    fs.writeFileSync(srFile, JSON.stringify(srStore, null, 2));
    reply(`✅ *Removed auto-reply for:* ${text}`);
}
break;

// ===== LIST AUTO-REPLIES =====
case 'listreply':
case 'listautoreply': {
    if (!m.isGroup) return reply('❌ Group only command');
    const larFile = './database/autoreply.json';
    const larStore = fs.existsSync(larFile) ? JSON.parse(fs.readFileSync(larFile)) : {};
    const larMap = larStore[m.chat];
    if (!larMap || !Object.keys(larMap).length) return reply('❌ No auto-replies set in this group.');
    let larText = '*📋 Auto-Replies:*\n';
    Object.entries(larMap).forEach(([k, v]) => { larText += `\n• *${k}* → ${v}`; });
    reply(larText);
}
break;

// ===== FOOTBALL MATCH SCORES =====
// [REMOVED DUPLICATE: match]

// ===== CURRENCY RATES =====
// [REMOVED DUPLICATE: curr-rates]

// ===== NGN RATES =====
// [REMOVED DUPLICATE: ngnrates]

// ===== USD RATES =====
case 'usdrates':
case 'usd-rates': {
    try {
        const usdRes = await axios.get('https://open.er-api.com/v6/latest/USD');
        const usdR = usdRes.data.rates;
        reply(`🇺🇸 *USD Exchange Rates*\n\n• EUR: ${usdR.EUR?.toFixed(4)}\n• GBP: ${usdR.GBP?.toFixed(4)}\n• NGN: ${usdR.NGN?.toFixed(2)}\n• JPY: ${usdR.JPY?.toFixed(2)}\n• CNY: ${usdR.CNY?.toFixed(4)}\n• INR: ${usdR.INR?.toFixed(4)}\n• CAD: ${usdR.CAD?.toFixed(4)}\n• AUD: ${usdR.AUD?.toFixed(4)}\n• ZAR: ${usdR.ZAR?.toFixed(4)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== BTC USDT =====
case 'btcusdt':
case 'btc-usdt': {
    try {
        const btcRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=BTC-USDT');
        const btcD = btcRes.data?.data;
        reply(`₿ *BTC-USDT*\n\n💰 Price: $${parseFloat(btcD.last).toFixed(2)}\n📈 24h Change: ${(parseFloat(btcD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(btcD.high).toFixed(2)}\n🔻 Low: $${parseFloat(btcD.low).toFixed(2)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== ETH USDT =====
case 'ethusdt':
case 'eth-usdt': {
    try {
        const ethRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=ETH-USDT');
        const ethD = ethRes.data?.data;
        reply(`Ξ *ETH-USDT*\n\n💰 Price: $${parseFloat(ethD.last).toFixed(2)}\n📈 24h Change: ${(parseFloat(ethD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(ethD.high).toFixed(2)}\n🔻 Low: $${parseFloat(ethD.low).toFixed(2)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== XRP USDT =====
case 'xrpusdt':
case 'xrp-usdt': {
    try {
        const xrpRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=XRP-USDT');
        const xrpD = xrpRes.data?.data;
        reply(`🔷 *XRP-USDT*\n\n💰 Price: $${parseFloat(xrpD.last).toFixed(4)}\n📈 24h Change: ${(parseFloat(xrpD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(xrpD.high).toFixed(4)}\n🔻 Low: $${parseFloat(xrpD.low).toFixed(4)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== DOGE USDT =====
case 'dogeusdt':
case 'doge-usdt': {
    try {
        const dogeRes = await axios.get('https://api.kucoin.com/api/v1/market/stats?symbol=DOGE-USDT');
        const dogeD = dogeRes.data?.data;
        reply(`🐶 *DOGE-USDT*\n\n💰 Price: $${parseFloat(dogeD.last).toFixed(5)}\n📈 24h Change: ${(parseFloat(dogeD.changeRate) * 100).toFixed(2)}%\n🔺 High: $${parseFloat(dogeD.high).toFixed(5)}\n🔻 Low: $${parseFloat(dogeD.low).toFixed(5)}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== FETCH FILE FROM URL =====
// [REMOVED DUPLICATE: fetch]

// ===== CURRENCY CONVERT =====
case 'convert':
case 'currency2': {
    if (!text) return reply(`💱 Usage: ${prefix}convert 100 USD NGN`);
    const convParts = text.trim().split(/\s+/);
    if (convParts.length < 3) return reply('❌ Format: 100 USD NGN');
    const convAmt = parseFloat(convParts[0]);
    const convFrom = convParts[1].toUpperCase();
    const convTo = convParts[2].toUpperCase();
    if (isNaN(convAmt)) return reply('❌ Enter a valid amount');
    try {
        const convRes = await axios.get(`https://open.er-api.com/v6/latest/${convFrom}`, { timeout: 10000 });
        const convRate = convRes.data?.rates?.[convTo];
        if (!convRate) return reply(`❌ Invalid currency: ${convTo}`);
        const convResult = (convAmt * convRate).toFixed(2);
        reply(`💱 *${convAmt} ${convFrom} = ${convResult} ${convTo}*\n\nRate: 1 ${convFrom} = ${convRate.toFixed(4)} ${convTo}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== TRANSLATE =====
// [REMOVED DUPLICATE: translate]

// ===== DICTIONARY =====
// [REMOVED DUPLICATE: define]

// ===== SYNONYM =====
case 'synonym': {
    if (!text) return reply(`📚 Usage: ${prefix}synonym happy`);
    try {
        const synRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim())}`, { timeout: 10000 });
        const synData = synRes.data?.[0];
        const synList = synData?.meanings?.flatMap(mn => mn.definitions?.flatMap(d => d.synonyms || []) || []) || [];
        const synMeaning = synData?.meanings?.flatMap(mn => mn.synonyms || []) || [];
        const allSyn = [...new Set([...synList, ...synMeaning])].slice(0, 15);
        if (!allSyn.length) return reply(`❌ No synonyms found for "${text}"`);
        reply(`📚 *Synonyms for "${text}":*\n\n${allSyn.join(', ')}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== ANTONYM =====
case 'antonym': {
    if (!text) return reply(`📚 Usage: ${prefix}antonym happy`);
    try {
        const antRes = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(text.trim())}`, { timeout: 10000 });
        const antData = antRes.data?.[0];
        const antList = antData?.meanings?.flatMap(mn => mn.definitions?.flatMap(d => d.antonyms || []) || []) || [];
        const antMeaning = antData?.meanings?.flatMap(mn => mn.antonyms || []) || [];
        const allAnt = [...new Set([...antList, ...antMeaning])].slice(0, 15);
        if (!allAnt.length) return reply(`❌ No antonyms found for "${text}"`);
        reply(`📚 *Antonyms for "${text}":*\n\n${allAnt.join(', ')}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// weather handled above (use .weather, .weather2, .weatherinfo, .weatherdetail, .wttr)

// ===== COUNTRY INFO =====
// [REMOVED DUPLICATE: country]

// ===== IP LOOKUP =====
// [REMOVED DUPLICATE: ip]

// ===== GITHUB PROFILE =====
// [REMOVED DUPLICATE: github]

// ===== URL SHORTENER =====
// [REMOVED DUPLICATE: shorturl]

// ===== NASA PICTURE OF THE DAY =====
// [REMOVED DUPLICATE: nasa]

// ===== NOTES SYSTEM =====
case 'notes': {
    if (!text) return reply(`📝 *Notes Commands:*\n${prefix}notes save title :: content\n${prefix}notes get title\n${prefix}notes list\n${prefix}notes delete title`);
    const noteFile = './database/notes.json';
    const noteStore = fs.existsSync(noteFile) ? JSON.parse(fs.readFileSync(noteFile)) : {};
    const noteKey = m.chat;
    if (!noteStore[noteKey]) noteStore[noteKey] = {};
    const noteParts = text.split(' ');
    const noteCmd = noteParts[0].toLowerCase();
    if (noteCmd === 'save') {
        const noteContent = noteParts.slice(1).join(' ');
        const noteSplit = noteContent.split('::');
        if (noteSplit.length < 2) return reply('❌ Format: notes save title :: content');
        const noteTitle = noteSplit[0].trim();
        const noteBody = noteSplit[1].trim();
        noteStore[noteKey][noteTitle] = noteBody;
        fs.writeFileSync(noteFile, JSON.stringify(noteStore, null, 2));
        reply(`📌 *Note saved:* ${noteTitle}`);
    } else if (noteCmd === 'get') {
        const noteTitle = noteParts.slice(1).join(' ').trim();
        const noteBody = noteStore[noteKey]?.[noteTitle];
        if (!noteBody) return reply(`❌ No note found: "${noteTitle}"`);
        reply(`📝 *${noteTitle}*\n\n${noteBody}`);
    } else if (noteCmd === 'list') {
        const noteTitles = Object.keys(noteStore[noteKey] || {});
        if (!noteTitles.length) return reply('❌ No notes saved.');
        reply(`📋 *Saved Notes:*\n\n${noteTitles.map((t, i) => `${i+1}. ${t}`).join('\n')}`);
    } else if (noteCmd === 'delete') {
        const noteTitle = noteParts.slice(1).join(' ').trim();
        if (!noteStore[noteKey]?.[noteTitle]) return reply(`❌ No note found: "${noteTitle}"`);
        delete noteStore[noteKey][noteTitle];
        fs.writeFileSync(noteFile, JSON.stringify(noteStore, null, 2));
        reply(`🗑️ *Deleted note:* ${noteTitle}`);
    } else {
        reply(`📝 Usage:\n${prefix}notes save title :: content\n${prefix}notes get title\n${prefix}notes list\n${prefix}notes delete title`);
    }
}
break;

// ===== REMINDER =====
// [REMOVED DUPLICATE: remind]

// ===== POLL =====
case 'poll2':
case 'vote': {
    if (!text) return reply(`📊 Usage: ${prefix}poll2 Question | Option1 | Option2 | Option3`);
    const pollParts = text.split('|').map(s => s.trim()).filter(Boolean);
    if (pollParts.length < 3) return reply('❌ Need question + at least 2 options separated by |');
    const pollQ = pollParts[0];
    const pollOpts = pollParts.slice(1);
    try {
        await devtrust.sendMessage(m.chat, { poll: { name: pollQ, values: pollOpts, selectableCount: 1 } }, { quoted: m });
    } catch (e) { reply(`❌ Error creating poll: ${e.message}`); }
}
break;

// ===== WARNINGS SYSTEM =====
case 'warn2': {
    if (!m.isGroup) return reply('❌ Group only');
    const warnFile = './database/warnings.json';
    const warnStore = fs.existsSync(warnFile) ? JSON.parse(fs.readFileSync(warnFile)) : {};
    const warnTarget = m.quoted?.sender || m.mentionedJid?.[0];
    if (!warnTarget) return reply('❌ Tag or reply to a member');
    if (!warnStore[m.chat]) warnStore[m.chat] = {};
    if (!warnStore[m.chat][warnTarget]) warnStore[m.chat][warnTarget] = 0;
    warnStore[m.chat][warnTarget]++;
    fs.writeFileSync(warnFile, JSON.stringify(warnStore, null, 2));
    const warnCount = warnStore[m.chat][warnTarget];
    await devtrust.sendMessage(m.chat, { text: `⚠️ *WARNING ${warnCount}/3*\n\n@${warnTarget.split('@')[0]} has been warned!\n*Reason:* ${text || 'No reason given'}\n\n${warnCount >= 3 ? '🚨 *3 warnings! Consider removing this member.*' : `_${3 - warnCount} warning(s) remaining._`}`, mentions: [warnTarget] }, { quoted: m });
}
break;

case 'warncount':
case 'warnings2': {
    if (!m.isGroup) return reply('❌ Group only');
    const wcFile = './database/warnings.json';
    const wcStore = fs.existsSync(wcFile) ? JSON.parse(fs.readFileSync(wcFile)) : {};
    const wcGroup = wcStore[m.chat];
    if (!wcGroup || !Object.keys(wcGroup).length) return reply('✅ No warnings in this group.');
    let wcText = '⚠️ *Warning List:*\n\n';
    Object.entries(wcGroup).forEach(([jid, count]) => { wcText += `• @${jid.split('@')[0]}: ${count} warning(s)\n`; });
    await devtrust.sendMessage(m.chat, { text: wcText, mentions: Object.keys(wcGroup) }, { quoted: m });
}
break;
// [REMOVED DUPLICATE: clearwarns]

// ===== TAGALL 2 =====
case 'tagall2': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const tagMeta = await devtrust.groupMetadata(m.chat);
        const tagMembers = tagMeta.participants;
        let tagText = text ? `📢 *${text}*\n\n` : '📢 *Attention everyone:*\n\n';
        const tagMentions = tagMembers.map(p => p.id);
        tagMentions.forEach(jid => { tagText += `@${jid.split('@')[0]} `; });
        await devtrust.sendMessage(m.chat, { text: tagText, mentions: tagMentions }, { quoted: m });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== GROUP LINK 2 =====
case 'gclink2': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const glCode = await devtrust.groupInviteCode(m.chat);
        reply(`🔗 *Group Link:*\nhttps://chat.whatsapp.com/${glCode}`);
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== MEMBER COUNT =====
// [REMOVED DUPLICATE: membercount]

// ===== LIST ADMINS =====
case 'listadmins': {
    if (!m.isGroup) return reply('❌ Group only');
    try {
        const adMeta = await devtrust.groupMetadata(m.chat);
        const adList = adMeta.participants.filter(p => p.admin);
        let adText = `👑 *Group Admins (${adList.length}):*\n\n`;
        const adMentions = adList.map(p => p.id);
        adList.forEach(p => { adText += `• @${p.id.split('@')[0]}\n`; });
        await devtrust.sendMessage(m.chat, { text: adText, mentions: adMentions }, { quoted: m });
    } catch (e) { reply(`❌ Error: ${e.message}`); }
}
break;

// ===== BOT INFO =====
case 'botinfo': {
    reply(`🤖 *LËGĚNDÃRY BØT Info*\n\n*Name:* LËGĚNDÃRY BØT\n*Version:* 3.0.0\n*Brand:* LËGĚNDÃRY Ł𝗮𝗯𝘀™\n*Framework:* Baileys\n*Language:* Node.js\n*Status:* ✅ Active & Listening\n*Commands:* 800+\n\n_© LËGĚNDÃRY BØT BY LËGĚNDÃRY Ł𝗮𝗯𝘀™_`);
}
break;

// ===== UPTIME =====
case 'uptime2': {
    const upMs = process.uptime() * 1000;
    const upHrs = Math.floor(upMs / 3600000);
    const upMins = Math.floor((upMs % 3600000) / 60000);
    const upSecs = Math.floor((upMs % 60000) / 1000);
    reply(`⚡ *LËGĚNDÃRY BØT Uptime*\n\n🕐 *${upHrs}h ${upMins}m ${upSecs}s*\n✅ Running perfectly!`);
}
break;

// ===== SPEED TEST =====
// [REMOVED DUPLICATE: speed]

// ===== RAM/MEMORY =====
case 'ram': {
    const memUsed = process.memoryUsage();
    const mbUsed = (memUsed.heapUsed / 1024 / 1024).toFixed(2);
    const mbTotal = (memUsed.heapTotal / 1024 / 1024).toFixed(2);
    reply(`💾 *Bot Memory*\n\n*Heap Used:* ${mbUsed} MB\n*Heap Total:* ${mbTotal} MB\n*Status:* ${mbUsed < 200 ? '✅ Good' : '⚠️ Heavy'}`);
}
break;

// ===== TIMESTAMP =====
case 'timestamp': {
    const tsNow = Date.now();
    reply(`🕐 *Timestamp*\n\n*Unix (ms):* ${tsNow}\n*Unix (s):* ${Math.floor(tsNow / 1000)}\n*UTC:* ${new Date(tsNow).toUTCString()}`);
}
break;

// ===== FUN: 8BALL =====
// [REMOVED DUPLICATE: 8ball]

// dice handled above (use .dice, .roll, .dicegamble)

// ===== COIN FLIP =====
// [REMOVED DUPLICATE: coinflip]

// ===== CHOOSE =====
case 'choose': {
    if (!text) return reply(`Usage: ${prefix}choose option1 / option2 / option3`);
    const chooseOpts = text.split('/').map(s => s.trim()).filter(Boolean);
    if (chooseOpts.length < 2) return reply('Give me at least 2 options separated by /');
    reply(`🎲 *I choose:*\n\n*${chooseOpts[Math.floor(Math.random() * chooseOpts.length)]}* ✅`);
}
break;

// ===== SHIP =====
// [REMOVED DUPLICATE: ship]

// ===== RATE =====
case 'rate': {
    const rateTarget = text || m.pushName;
    const rateNum = Math.floor(Math.random() * 10) + 1;
    const rateEmoji = rateNum >= 8 ? '🔥' : rateNum >= 5 ? '😊' : '😅';
    reply(`⭐ *Rating for ${rateTarget}:*\n\n${'⭐'.repeat(rateNum)}${'☆'.repeat(10-rateNum)}\n\n*${rateNum}/10* ${rateEmoji}`);
}
break;

// ===== TRUTH =====
// [REMOVED DUPLICATE: truth]

// ===== DARE =====
// [REMOVED DUPLICATE: dare]

// ===== WOULD YOU RATHER =====
// [REMOVED DUPLICATE: wyr]

// ===== FORTUNE COOKIE =====
case 'fortune': {
    const fortunes = ['🥠 A beautiful surprise is coming your way.','🥠 Your hard work will pay off greatly.','🥠 Someone is thinking of you right now.','🥠 An unexpected friendship will change your life.','🥠 The answer to your problem is simpler than you think.','🥠 You will soon receive very good news.','🥠 Believe in yourself — others already do.','🥠 A great opportunity is just around the corner.'];
    reply(fortunes[Math.floor(Math.random() * fortunes.length)]);
}
break;

// ===== RIDDLE =====
// [REMOVED DUPLICATE: riddle]

// ===== TRIVIA =====
// [REMOVED DUPLICATE: trivia]

// ===== FUN FACT =====
// funfact handled above

// ===== ANIME QUOTE =====
// [REMOVED DUPLICATE: animequote]

// ===== MOTIVATION =====
case 'motivation': {
    const motivations = ['🔥 *Wake up. Grind. Win. Repeat.*\n\nEvery morning is a new opportunity!','💪 *Your setback is setting you up for a comeback.*','🏆 *Champions are made in moments they don\'t feel like it.*\n\nPush through!','⚡ *Stop waiting for the perfect moment. Start NOW.*','💎 *Diamonds are made under pressure. So are champions.*','🔑 *The secret to getting ahead is getting started.*'];
    reply(motivations[Math.floor(Math.random() * motivations.length)]);
}
break;

// ===== INSPIRE =====
case 'inspire':
case 'quote2': {
    const inspireQuotes = ['"The secret of getting ahead is getting started." – Mark Twain','"It always seems impossible until it\'s done." – Nelson Mandela','"The future belongs to those who believe in the beauty of their dreams." – Eleanor Roosevelt','"Hardships often prepare ordinary people for an extraordinary destiny." – C.S. Lewis','"Believe you can and you\'re halfway there." – Theodore Roosevelt','"The only way to do great work is to love what you do." – Steve Jobs','"In the middle of every difficulty lies opportunity." – Einstein'];
    reply(`💡 *Daily Inspiration*\n\n_${inspireQuotes[Math.floor(Math.random() * inspireQuotes.length)]}_`);
}
break;

// ===== JOKE =====
case 'joke2': {
    const jokeList = ['Why don\'t scientists trust atoms? Because they make up everything! 😂','Why did the scarecrow win an award? He was outstanding in his field! 🌾','I told my wife she was drawing her eyebrows too high. She looked surprised! 😳','I\'m reading a book about anti-gravity. It\'s impossible to put down! 📚','What do you call fake spaghetti? An impasta! 🍝','Why did the bicycle fall over? It was two-tired! 🚲'];
    reply(`😂 *Joke:*\n\n${jokeList[Math.floor(Math.random() * jokeList.length)]}`);
}
break;

// ===== PUN =====
case 'pun': {
    const punList = ['Time flies like an arrow. Fruit flies like a banana. 🍌','I used to hate facial hair, but then it grew on me. 🧔','I\'m on a seafood diet. I see food and I eat it. 🍕','I used to be a banker but I lost interest. 💰','I\'m afraid of elevators but I\'m taking steps to avoid them! 🪜'];
    reply(`🤣 *Pun Alert:*\n\n_${punList[Math.floor(Math.random() * punList.length)]}_`);
}
break;

// ===== HISTORY FACT =====
case 'history': {
    const historyFacts = ['📜 Cleopatra lived closer in time to the Moon landing than to the Great Pyramid.','⚔️ The shortest war lasted 38 minutes — Britain vs Zanzibar, 1896.','🏛️ Oxford University is older than the Aztec Empire.','🎭 Shakespeare invented over 1,700 words we still use today.','🇳🇬 Nigeria has the largest economy in Africa.','📖 The world\'s oldest university (Al-Qarawiyyin) is in Morocco, founded 859 AD.'];
    reply(`📜 *History Fact:*\n\n${historyFacts[Math.floor(Math.random() * historyFacts.length)]}`);
}
break;

// ===== SCIENCE FACT =====
case 'science': {
    const scienceFacts = ['⚛️ There are more chess positions than atoms in the observable universe.','💡 The human eye can distinguish about 10 million different colors.','⚡ A bolt of lightning is 5 times hotter than the surface of the sun.','🌌 The Milky Way has 100-400 billion stars.','🌊 The ocean produces over 50% of the world\'s oxygen.','💻 The human brain has about 86 billion neurons.'];
    reply(`🔬 *Science Fact:*\n\n${scienceFacts[Math.floor(Math.random() * scienceFacts.length)]}`);
}
break;

// ===== TECH FACT =====
case 'tech': {
    const techFacts = ['💻 The first computer mouse was made of wood in 1964.','📱 More people have mobile phones than toothbrushes worldwide.','🌐 The first website went live August 6, 1991.','📧 The first email was sent in 1971 by Ray Tomlinson (to himself).','🔐 The most common password is still "password".','🤯 90% of the world\'s data was created in the last 2 years.'];
    reply(`💻 *Tech Fact:*\n\n${techFacts[Math.floor(Math.random() * techFacts.length)]}`);
}
break;

// ===== AFRICAN FACT =====
case 'africanfact': {
    const africaFacts = ['🌍 Africa is home to the world\'s longest river (Nile) and largest hot desert (Sahara).','🇳🇬 Nigeria alone has over 500 spoken languages.','💎 Africa holds about 30% of the world\'s mineral reserves.','📚 The world\'s oldest university is in Morocco, founded in 859 AD.','🦁 Only Africa has lions, elephants, rhinos, leopards and buffalos together (Big Five).','🌟 By 2050, 1 in 4 humans will be African.'];
    reply(`🌍 *African Fact:*\n\n${africaFacts[Math.floor(Math.random() * africaFacts.length)]}`);
}
break;

// ===== NIGERIAN FACT =====
case 'nigerianfact': {
    const nigeriaFacts = ['🇳🇬 Nigeria has the largest economy in Africa (~$440B GDP).','🎬 Nollywood is the 2nd largest film industry in the world by volume.','👥 Nigeria is the most populous African country — 220M+ people.','🌿 Nigeria is the world\'s largest producer of cassava and yam.','🎵 Afrobeats from Nigeria has taken over the world!','🏙️ Lagos is the largest city in Africa by population.','🎓 Nigeria\'s Wole Soyinka won the Nobel Prize for Literature in 1986.'];
    reply(`🇳🇬 *Nigerian Fact:*\n\n${nigeriaFacts[Math.floor(Math.random() * nigeriaFacts.length)]}`);
}
break;

// ===== NAIJA SLANG =====
case 'slangs':
case 'naijaslangs': {
    const slangs = ['🔥 *Wahala* — Trouble/Problem','⚡ *Shakara* — Showing off','😏 *Sabi* — To know/be skilled','💀 *Scatter* — To mess something up','🏆 *Oga* — Boss/Master','😎 *Badoo* — A super skilled person','🤝 *Omo* — Exclamation of surprise','💰 *Settle* — Bribe or tip','🤣 *Yarn* — To talk/chat','👀 *Pepper dem* — Show success, make people jealous'];
    reply(`🇳🇬 *Naija Slang:*\n\n${slangs[Math.floor(Math.random() * slangs.length)]}`);
}
break;

// ===== NAIJA FOOD =====
case 'naijafood': {
    const naijFoods = ['🍲 Jollof Rice — the GOAT of all rice dishes!','🫕 Egusi Soup — thick, rich and full of protein!','🍖 Suya — spicy grilled meat perfection!','🥘 Banga Soup — palm fruit goodness!','🍛 Eba and Okra — the classic combo!','🥩 Pepper Soup — cure for everything!','🫘 Akara — bean cakes for breakfast!','🍠 Pounded Yam and Egusi — the heavyweight champ!'];
    reply(`🇳🇬 *Naija Food:*\n\n${naijFoods[Math.floor(Math.random() * naijFoods.length)]}`);
}
break;

// ===== ZODIAC =====
case 'zodiac': {
    if (!text) return reply(`♈ Usage: ${prefix}zodiac aries\nSigns: aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces`);
    const zodiacInfo = {aries:{symbol:'♈',dates:'Mar 21–Apr 19',element:'🔥 Fire',compatible:'Leo, Sagittarius'},taurus:{symbol:'♉',dates:'Apr 20–May 20',element:'🌍 Earth',compatible:'Virgo, Capricorn'},gemini:{symbol:'♊',dates:'May 21–Jun 20',element:'💨 Air',compatible:'Libra, Aquarius'},cancer:{symbol:'♋',dates:'Jun 21–Jul 22',element:'💧 Water',compatible:'Scorpio, Pisces'},leo:{symbol:'♌',dates:'Jul 23–Aug 22',element:'🔥 Fire',compatible:'Aries, Sagittarius'},virgo:{symbol:'♍',dates:'Aug 23–Sep 22',element:'🌍 Earth',compatible:'Taurus, Capricorn'},libra:{symbol:'♎',dates:'Sep 23–Oct 22',element:'💨 Air',compatible:'Gemini, Aquarius'},scorpio:{symbol:'♏',dates:'Oct 23–Nov 21',element:'💧 Water',compatible:'Cancer, Pisces'},sagittarius:{symbol:'♐',dates:'Nov 22–Dec 21',element:'🔥 Fire',compatible:'Aries, Leo'},capricorn:{symbol:'♑',dates:'Dec 22–Jan 19',element:'🌍 Earth',compatible:'Taurus, Virgo'},aquarius:{symbol:'♒',dates:'Jan 20–Feb 18',element:'💨 Air',compatible:'Gemini, Libra'},pisces:{symbol:'♓',dates:'Feb 19–Mar 20',element:'💧 Water',compatible:'Cancer, Scorpio'}};
    const zodSign = zodiacInfo[text.toLowerCase()];
    if (!zodSign) return reply('❌ Invalid sign. Use: aries, taurus, gemini, cancer, leo, virgo, libra, scorpio, sagittarius, capricorn, aquarius, pisces');
    reply(`${zodSign.symbol} *${text.toUpperCase()}*\n\n📅 Dates: ${zodSign.dates}\n${zodSign.element}\n💕 Compatible: ${zodSign.compatible}`);
}
break;

// ===== TAROT =====
case 'tarot': {
    const tarotCards = [{name:'The Fool',meaning:'New beginnings, adventure'},{name:'The Magician',meaning:'Power, skill, willpower'},{name:'The High Priestess',meaning:'Intuition, wisdom'},{name:'The Empress',meaning:'Abundance, creativity'},{name:'The Emperor',meaning:'Authority, stability'},{name:'The Lovers',meaning:'Love, harmony, choices'},{name:'The Chariot',meaning:'Control, success, determination'},{name:'Strength',meaning:'Courage, patience'},{name:'The Hermit',meaning:'Introspection, guidance'},{name:'Wheel of Fortune',meaning:'Change, fate, luck'},{name:'The Star',meaning:'Hope, serenity'},{name:'The Sun',meaning:'Success, positivity'},{name:'The World',meaning:'Completion, achievement'}];
    const tarot = tarotCards[Math.floor(Math.random() * tarotCards.length)];
    reply(`🃏 *Tarot Card for You:*\n\n*${tarot.name}*\n\n✨ *Meaning:* ${tarot.meaning}\n\n_The universe speaks to you through this card._ 🌟`);
}
break;

// ===== LUCKY NUMBERS =====
case 'lucky': {
    const luckyNums = [];
    while (luckyNums.length < 6) { const n = Math.floor(Math.random() * 49) + 1; if (!luckyNums.includes(n)) luckyNums.push(n); }
    luckyNums.sort((a, b) => a - b);
    reply(`🍀 *Your Lucky Numbers Today:*\n\n${luckyNums.join(' - ')}\n\n_Good luck, legend!_ ✨`);
}
break;

// ===== IQ TEST =====
case 'iqtest': {
    const iqTarget = text || m.pushName;
    const iqScore = Math.floor(Math.random() * 60) + 70;
    const iqCat = iqScore >= 130 ? '🧠 Genius' : iqScore >= 120 ? '✨ Very Superior' : iqScore >= 110 ? '😊 High Average' : iqScore >= 90 ? '👍 Average' : '🤔 Below Average';
    reply(`🧠 *IQ Test Result*\n\n*Person:* ${iqTarget}\n*IQ Score:* ${iqScore}\n*Category:* ${iqCat}\n\n_Just for fun! 😄_`);
}
break;

// ===== BMI =====
case 'bmi': {
    if (!text) return reply(`Usage: ${prefix}bmi 70 175\n(weight kg, height cm)`);
    const bmiParts = text.trim().split(/\s+/);
    if (bmiParts.length < 2) return reply('❌ Need weight and height');
    const bmiW = parseFloat(bmiParts[0]);
    const bmiH = parseFloat(bmiParts[1]) / 100;
    if (isNaN(bmiW) || isNaN(bmiH)) return reply('❌ Invalid values');
    const bmiVal = (bmiW / (bmiH * bmiH)).toFixed(1);
    const bmiCat = bmiVal < 18.5 ? '🔵 Underweight' : bmiVal < 25 ? '✅ Normal' : bmiVal < 30 ? '🟡 Overweight' : '🔴 Obese';
    reply(`⚖️ *BMI*\n\n*Weight:* ${bmiW} kg\n*Height:* ${bmiParts[1]} cm\n*BMI:* ${bmiVal}\n*Status:* ${bmiCat}`);
}
break;

// ===== AGE CALC =====
case 'age': {
    if (!text) return reply(`Usage: ${prefix}age DD/MM/YYYY`);
    try {
        const [ageDd, ageMm, ageYyyy] = text.split('/').map(Number);
        const ageBirth = new Date(ageYyyy, ageMm - 1, ageDd);
        const ageNow = new Date();
        let ageYears = ageNow.getFullYear() - ageBirth.getFullYear();
        let ageMonths = ageNow.getMonth() - ageBirth.getMonth();
        if (ageMonths < 0) { ageYears--; ageMonths += 12; }
        reply(`🎂 *Age*\n\n*Birthday:* ${text}\n*Age:* ${ageYears} years, ${ageMonths} months\n*Days lived:* ~${(ageYears * 365.25).toFixed(0)}`);
    } catch (e) { reply('❌ Use DD/MM/YYYY format'); }
}
break;

// ===== TEMP CONVERTER =====
case 'temp': {
    if (!text) return reply(`Usage: ${prefix}temp 100c or ${prefix}temp 212f`);
    const tempMatch = text.match(/^([\d.]+)(c|f|k)$/i);
    if (!tempMatch) return reply('❌ Format: 100c, 212f, or 373k');
    const tempVal = parseFloat(tempMatch[1]);
    const tempUnit = tempMatch[2].toLowerCase();
    let tempResult = '';
    if (tempUnit === 'c') tempResult = `${tempVal}°C = *${(tempVal * 9/5 + 32).toFixed(2)}°F* = *${(tempVal + 273.15).toFixed(2)}K*`;
    else if (tempUnit === 'f') tempResult = `${tempVal}°F = *${((tempVal - 32) * 5/9).toFixed(2)}°C*`;
    else tempResult = `${tempVal}K = *${(tempVal - 273.15).toFixed(2)}°C*`;
    reply(`🌡️ *Temperature*\n\n${tempResult}`);
}
break;

// ===== MATH =====
// [REMOVED DUPLICATE: math]

// ===== ROMAN NUMERALS =====
case 'roman': {
    if (!text) return reply(`Usage: ${prefix}roman 2024`);
    const romanNum = parseInt(text);
    if (isNaN(romanNum) || romanNum < 1 || romanNum > 3999) return reply('❌ Enter a number 1–3999');
    const romanVals = [[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
    let romanResult = '';
    let romanN = romanNum;
    for (const [val, sym] of romanVals) { while (romanN >= val) { romanResult += sym; romanN -= val; } }
    reply(`🏛️ *${romanNum} = ${romanResult}*`);
}
break;

// ===== BINARY =====
case 'tobin': {
    if (!text) return reply(`Usage: ${prefix}tobin 42`);
    const binNum = parseInt(text);
    if (isNaN(binNum)) return reply('❌ Enter a valid number');
    reply(`💻 *${binNum} in Binary:* \`${binNum.toString(2)}\``);
}
break;

// ===== HEX CONV =====
case 'tohex': {
    if (!text) return reply(`Usage: ${prefix}tohex 255`);
    const hexNum = parseInt(text);
    if (isNaN(hexNum)) return reply('❌ Enter a valid number');
    reply(`💻 *${hexNum} in Hex:* \`0x${hexNum.toString(16).toUpperCase()}\``);
}
break;

// ===== ENCODE/DECODE =====
// [REMOVED DUPLICATE: encode]
// [REMOVED DUPLICATE: decode]

// genpass/password handled above

// ===== RANDOM NUMBER =====
case 'random': {
    const randParts = (text || '1 100').trim().split(/\s+/);
    const randMin = parseInt(randParts[0]) || 1;
    const randMax = parseInt(randParts[1]) || 100;
    if (randMin >= randMax) return reply('❌ Min must be less than max');
    reply(`🎲 *Random (${randMin}–${randMax}):* *${Math.floor(Math.random() * (randMax - randMin + 1)) + randMin}*`);
}
break;

// uuid handled above

// ===== TEXT TOOLS =====
// upper/lower/reversetext/wordcount handled above
case 'mock': { if (!text) return reply(`Usage: ${prefix}mock text`); reply(text.split('').map((c, i) => i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()).join('')); } break;

// ===== FANCY TEXT =====
case 'aesthetic': {
    if (!text) return reply(`Usage: ${prefix}aesthetic text`);
    const aeMap = {a:'𝓪',b:'𝓫',c:'𝓬',d:'𝓭',e:'𝓮',f:'𝓯',g:'𝓰',h:'𝓱',i:'𝓲',j:'𝓳',k:'𝓴',l:'𝓵',m:'𝓶',n:'𝓷',o:'𝓸',p:'𝓹',q:'𝓺',r:'𝓻',s:'𝓼',t:'𝓽',u:'𝓾',v:'𝓿',w:'𝔀',x:'𝔁',y:'𝔂',z:'𝔃',A:'𝓐',B:'𝓑',C:'𝓒',D:'𝓓',E:'𝓔',F:'𝓕',G:'𝓖',H:'𝓗',I:'𝓘',J:'𝓙',K:'𝓚',L:'𝓛',M:'𝓜',N:'𝓝',O:'𝓞',P:'𝓟',Q:'𝓠',R:'𝓡',S:'𝓢',T:'𝓣',U:'𝓤',V:'𝓥',W:'𝓦',X:'𝓧',Y:'𝓨',Z:'𝓩'};
    reply(text.split('').map(c => aeMap[c] || c).join(''));
}
break;

case 'fancy': {
    if (!text) return reply(`Usage: ${prefix}fancy text`);
    const fnMap = {a:'𝕒',b:'𝕓',c:'𝕔',d:'𝕕',e:'𝕖',f:'𝕗',g:'𝕘',h:'𝕙',i:'𝕚',j:'𝕛',k:'𝕜',l:'𝕝',m:'𝕞',n:'𝕟',o:'𝕠',p:'𝕡',q:'𝕢',r:'𝕣',s:'𝕤',t:'𝕥',u:'𝕦',v:'𝕧',w:'𝕨',x:'𝕩',y:'𝕪',z:'𝕫',A:'𝔸',B:'𝔹',C:'ℂ',D:'𝔻',E:'𝔼',F:'𝔽',G:'𝔾',H:'ℍ',I:'𝕀',J:'𝕁',K:'𝕂',L:'𝕃',M:'𝕄',N:'ℕ',O:'𝕆',P:'ℙ',Q:'ℚ',R:'ℝ',S:'𝕊',T:'𝕋',U:'𝕌',V:'𝕍',W:'𝕎',X:'𝕏',Y:'𝕐',Z:'ℤ'};
    reply(text.split('').map(c => fnMap[c] || c).join(''));
}
break;

case 'bubble': {
    if (!text) return reply(`Usage: ${prefix}bubble text`);
    const bubMap = {a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ','0':'⓪','1':'①','2':'②','3':'③','4':'④','5':'⑤','6':'⑥','7':'⑦','8':'⑧','9':'⑨'};
    reply(text.split('').map(c => bubMap[c] || c).join(''));
}
break;

// ===== SOCIAL CAPTIONS =====
case 'caption': {
    const captions = ['✨ "Living my best life, one day at a time." 🌟','🔥 "They told me I couldn\'t. That\'s why I did." 💪','💎 "Stay low key. Not everyone deserves a front row seat to your life." 🤫','🌟 "Grateful, blessed, and highly favored." 🙏','⚡ "I came. I saw. I conquered." 🔥','💕 "Love yourself first." ❤️','🏆 "Success is the best revenge." 👑','🌈 "Chasing dreams, not people." 🦋'];
    reply(`📸 *Caption Idea:*\n\n${captions[Math.floor(Math.random() * captions.length)]}`);
}
break;

case 'bioidea': {
    const bios = ['✨ Just a soul trying to leave a mark on this earth. 🌍','🔥 Too blessed to be stressed. Grinding in silence. 💪','💫 Dream big. Hustle harder. Stay humble. 🏆','⚡ Not for everybody. And that\'s okay. 👑','💎 Premium quality, limited availability. 😏','🚀 On a mission. 🔥','🌈 Making memories, not excuses. ✨'];
    reply(`📝 *Bio Idea:*\n\n${bios[Math.floor(Math.random() * bios.length)]}`);
}
break;

// ===== GREETINGS =====
case 'gm':
case 'goodmorning': {
    reply(`🌅 *Good Morning!*\n\nMay today bring you:\n✅ Fresh opportunities\n✅ Great achievements\n✅ Blessings upon blessings\n\n_Start your day with gratitude!_ 🙏\n\n_© LËGĚNDÃRY BØT_ ⚡`);
}
break;

case 'gn':
case 'goodnight': {
    reply(`🌙 *Good Night!*\n\n🌟 Let go of today's worries\n💫 Dream big beautiful dreams\n⚡ Wake up ready to conquer tomorrow\n\n_Rest well, legend!_ 😴\n\n_© LËGĚNDÃRY BØT_ ⚡`);
}
break;

case 'ga':
case 'goodafternoon': {
    reply(`☀️ *Good Afternoon!*\n\n💪 Keep pushing through\n🎯 Stay focused on your goals\n💧 Remember to drink water!\n\n_You got this, legend!_ 🔥`);
}
break;

// ===== BIRTHDAY =====
case 'hbd':
case 'birthday': {
    const bTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'you');
    const bMentions = m.mentionedJid || [];
    await devtrust.sendMessage(m.chat, { text: `🎂 *HAPPY BIRTHDAY!* 🎉\n\n🎈 ${bTarget} 🎈\n\nMay this special day bring you:\n🎁 All the love in the world\n✨ Blessings beyond measure\n💎 Health, wealth and happiness\n\n_Happy Birthday from LËGĚNDÃRY BØT!_ 🎂🎊🥳`, mentions: bMentions }, { quoted: m });
}
break;

// ===== LOVE MESSAGE =====
// [REMOVED DUPLICATE: love]

// ===== HUG =====
// [REMOVED DUPLICATE: hug]

// ===== SLAP =====
// [REMOVED DUPLICATE: slap]

// ===== PUNCH =====
case 'punch': {
    const punchTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`👊 *${m.pushName}* throws a punch at ${punchTarget}! KAPOW! 💥`);
}
break;

// ===== SHOOT =====
case 'shoot': {
    const shootTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`🔫 *${m.pushName}* shoots ${shootTarget}! PEW PEW! 😂`);
}
break;

// ===== MARRY =====
case 'marry': {
    const marryTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'someone');
    reply(`💍 *${m.pushName}* proposes to ${marryTarget}!\n\n_Will you marry me? 💕_`);
}
break;

// ===== ROAST =====
case 'roast2': {
    const roasts = ['Your Wi-Fi password is probably "password123". 😂','You\'re like a software update. Whenever I see you, I think "not now". 😂','If ignorance is bliss, you must be the happiest person alive. 😂','You\'re the reason phones have a mute button. 😂','I\'d insult you but my mama said I had to be kind to the special ones. 😂'];
    const roastTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || 'you');
    const roastMentions = m.mentionedJid || [];
    await devtrust.sendMessage(m.chat, { text: `🔥 *ROAST for ${roastTarget}:*\n\n${roasts[Math.floor(Math.random() * roasts.length)]}\n\n_Just jokes fam! 😂_`, mentions: roastMentions }, { quoted: m });
}
break;

// ===== COMPLIMENT =====
case 'comp': {
    const compliments = ['✨ You are absolutely amazing!','🌟 You light up every room you walk into!','💪 Your strength is remarkable.','🌸 You make the world a better place.','🦋 Your creativity knows no bounds!','🏆 You are a true champion.','💎 You are rarer and more precious than any diamond.'];
    const compTarget = m.mentionedJid?.length ? `@${m.mentionedJid[0].split('@')[0]}` : (text || m.pushName);
    reply(`💌 *For ${compTarget}:*\n\n${compliments[Math.floor(Math.random() * compliments.length)]}`);
}
break;

// ===== INSULT (JOKE) =====
// [REMOVED DUPLICATE: insult]

// ===== PIGIN =====
case 'pidgin': {
    const pidginPhrases = ['E don do! 🔥','Abeg no vex me today o!','Na so e be','I go show you pepper! 🌶️','Shine your eyes!','No be small thing o!','E don set! ✅','We move!','Sharp sharp! ⚡','You sabi this thing gan gan!','We outside! 🎉'];
    reply(`🇳🇬 *Naija Talk:*\n\n_${pidginPhrases[Math.floor(Math.random() * pidginPhrases.length)]}_`);
}
break;

// ===== YORUBA =====
case 'yoruba': {
    const yoruba = ['E kaaro — Good morning 🌅','E kaasan — Good afternoon ☀️','E kaale — Good evening 🌆','E dabo — Goodbye 👋','Ese — Thank you 🙏','Pele — Sorry / Take care 💕','Mo fe e — I love you ❤️','Bawo ni — How are you? 😊','O daro — Good night 🌙'];
    reply(`🌍 *Yoruba:*\n\n_${yoruba[Math.floor(Math.random() * yoruba.length)]}_`);
}
break;

// ===== IGBO =====
case 'igbo': {
    const igbo = ['Ututu oma — Good morning 🌅','Ehihie oma — Good afternoon ☀️','Daalu — Thank you 🙏','Obi dị mma — I am fine 😊','Nke a dị mma — This is good 🔥','Anọ m jikere — I am ready ✅'];
    reply(`🌍 *Igbo:*\n\n_${igbo[Math.floor(Math.random() * igbo.length)]}_`);
}
break;

// ===== HAUSA =====
case 'hausa': {
    const hausa = ['Ina kwana — Good morning 🌅','Ina wuni — Good afternoon ☀️','Na gode — Thank you 🙏','Sannu — Hello 😊','Lafiya lau — I\'m fine','Allah ya kiyaye — God protect you 🙏'];
    reply(`🌍 *Hausa:*\n\n_${hausa[Math.floor(Math.random() * hausa.length)]}_`);
}
break;

// ===== NAIRA CONVERT =====
// [REMOVED DUPLICATE: naira]

// lyrics handled above

// ===== PERCENTAGE =====
case 'percent': {
    if (!text) return reply(`Usage: ${prefix}percent 45 200\n(What is 45% of 200?)`);
    const percentParts = text.trim().split(/\s+/);
    if (percentParts.length < 2) return reply('❌ Need 2 numbers. Example: 45 200');
    const pct = parseFloat(percentParts[0]);
    const total = parseFloat(percentParts[1]);
    if (isNaN(pct) || isNaN(total)) return reply('❌ Invalid numbers');
    reply(`📊 *${pct}% of ${total} = ${(pct / 100 * total).toFixed(2)}*`);
}
break;

// ===== FIBONACCI =====
case 'fib': {
    const fibN = Math.min(parseInt(text) || 10, 20);
    if (isNaN(fibN) || fibN < 1) return reply('❌ Enter a number (1–20)');
    const fibSeq = [0, 1];
    for (let i = 2; i < fibN; i++) fibSeq.push(fibSeq[i-1] + fibSeq[i-2]);
    reply(`🔢 *Fibonacci (${fibN} terms):*\n\n${fibSeq.slice(0, fibN).join(', ')}`);
}
break;

// ===== WORKOUT =====
case 'workout': {
    const workouts = ['💪 *Today:*\n• 20 Push-ups x3\n• 30 Squats x3\n• 1 min Plank x3\n\n🔥 _No gym needed!_','🏃 *Cardio Day:*\n• 20 min jog\n• 50 jumping jacks\n• 20 burpees\n\n💦 _Sweat it out!_','🦵 *Leg Day:*\n• 40 Squats x3\n• 20 Lunges each leg\n• 30 Calf raises x3\n\n🔥 _Leg day is respect!_'];
    reply(workouts[Math.floor(Math.random() * workouts.length)]);
}
break;

// ===== WATER REMINDER =====
case 'water': {
    reply(`💧 *Water Reminder*\n\nDrink at least *8 glasses (2L)* daily!\n\n• 1 glass when you wake up 🌅\n• 1 glass before each meal 🍽️\n• 1 glass before bed 🌙\n\n_Hydration = better mood, focus & energy!_ ✨`);
}
break;

// ===== MENTAL HEALTH =====
case 'mental': {
    const mentalTips = ['🧠 *Tip:* Take 5 deep breaths now. In (4 counts), hold (4), out (4). Repeat.','💙 *Reminder:* It\'s okay to say NO. Protecting your peace is not selfish.','🌟 *Affirmation:* You are enough. You are worthy. Keep going. 💪','😴 *Sleep:* Adults need 7–9 hours. Put the phone down and rest! 🌙','🤝 *Connection:* Call someone you care about today. 📞'];
    reply(mentalTips[Math.floor(Math.random() * mentalTips.length)]);
}
break;

// ===== COUNTDOWN =====
// [REMOVED DUPLICATE: countdown]

// repeat handled above

// ===== PRIME CHECK =====
case 'isprime': {
    if (!text) return reply(`Usage: ${prefix}isprime 17`);
    const primeN = parseInt(text);
    if (isNaN(primeN) || primeN < 1) return reply('❌ Enter a positive integer');
    if (primeN < 2) return reply(`*${primeN}* is ❌ NOT prime`);
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(primeN); i++) { if (primeN % i === 0) { isPrime = false; break; } }
    reply(`*${primeN}* is ${isPrime ? '✅ a PRIME number! 🔢' : '❌ NOT a prime number'}`);
}
break;

// ===== FACTORIAL =====
case 'factorial': {
    if (!text) return reply(`Usage: ${prefix}factorial 5`);
    const factN = parseInt(text);
    if (isNaN(factN) || factN < 0 || factN > 20) return reply('❌ Enter 0–20');
    let factResult = 1;
    for (let i = 2; i <= factN; i++) factResult *= i;
    reply(`🔢 *${factN}! = ${factResult}*`);
}
break;

// ===== NPM =====
// [REMOVED DUPLICATE: npm]

// ============================================================
// =================== GROUP COMMANDS (FIXED) =================
// ============================================================

// ===== JOIN GROUP =====
case 'join': {
    if (!isCreator) return reply('❌ Owner only');
    const joinLinks = (text || '').match(/https?:\/\/[^\s]+/gi) || [];
    if (!joinLinks.length) return reply('✘ Provide a WhatsApp group link');
    const joinCode = joinLinks[0]?.match(/chat\.whatsapp\.com\/([0-9A-Za-z]{20,24})/i)?.[1];
    if (!joinCode) return reply('✘ Invalid invite link');
    try {
        await devtrust.groupAcceptInvite(joinCode);
        reply('✓ Joined successfully!');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== LEAVE GROUP =====
case 'leave':
case 'left': {
    if (!isCreator) return reply('❌ Owner only');
    if (!m.isGroup) return reply('✘ Groups only');
    await devtrust.groupLeave(m.chat);
}
break;

// ===== GROUP PROFILE PIC =====
case 'gpp':
case 'setgcpp': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    if (text === 'remove') {
        await devtrust.removeProfilePicture(m.chat);
        return reply('✓ Group profile picture removed');
    }
    if (!m.quoted) return reply('✘ Reply to an image');
    try {
        const gppMedia = await m.quoted.download();
        await devtrust.updateProfilePicture(m.chat, gppMedia);
        reply('✓ Group profile picture updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP NAME =====
case 'gname':
case 'setgcname': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`✘ Provide a name\nExample: ${prefix}gname New Name`);
    try {
        await devtrust.groupUpdateSubject(m.chat, text);
        reply('✓ Group name updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP DESCRIPTION =====
case 'gdesc':
case 'setgcdesc': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!text) return reply(`✘ Provide a description\nExample: ${prefix}gdesc Group rules...`);
    try {
        await devtrust.groupUpdateDescription(m.chat, text);
        reply('✓ Group description updated');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== ADD MEMBER =====
case 'add': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const addMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const addUser = addMentioned[0] || m.quoted?.sender || text;
    if (!addUser) return reply(`✘ Reply to user or provide number\nExample: ${prefix}add 2341234567890`);
    const addJid = (addUser.includes('@') ? addUser.split('@')[0] : addUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        const addResult = await devtrust.groupParticipantsUpdate(m.chat, [addJid], 'add');
        const addStatus = addResult[0]?.status;
        if (addStatus === '200') return reply(`✓ @${addJid.split('@')[0]} Added`, [addJid]);
        if (addStatus === '403') {
            await reply('✘ Cannot add directly, sending invite...');
            const addCode = await devtrust.groupInviteCode(m.chat);
            return await devtrust.sendMessage(addJid, { text: `https://chat.whatsapp.com/${addCode}` });
        }
        if (addStatus === '409') return reply('✘ User already in group');
        if (addStatus === '401') return reply('✘ Bot is blocked by this user');
        reply('✘ Could not add: status ' + addStatus);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== KICK MEMBER =====
case 'kick': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const kickMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const kickUser = kickMentioned[0] || m.quoted?.sender || text;
    if (!kickUser) return reply('✘ Reply to or mention a member');
    const kickJid = (kickUser.includes('@') ? kickUser.split('@')[0] : kickUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [kickJid], 'remove');
        reply(`✓ @${kickJid.split('@')[0]} kicked`, [kickJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== PROMOTE =====
case 'promote': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const proMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const proUser = proMentioned[0] || m.quoted?.sender || text;
    if (!proUser) return reply('✘ Reply to or mention a member');
    const proJid = (proUser.includes('@') ? proUser.split('@')[0] : proUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [proJid], 'promote');
        reply(`✓ @${proJid.split('@')[0]} promoted to admin`, [proJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== DEMOTE =====
case 'demote': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const demMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const demUser = demMentioned[0] || m.quoted?.sender || text;
    if (!demUser) return reply('✘ Reply to or mention an admin');
    const demJid = (demUser.includes('@') ? demUser.split('@')[0] : demUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [demJid], 'demote');
        reply(`✓ @${demJid.split('@')[0]} demoted`, [demJid]);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== MUTE GROUP =====
case 'mute': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const muteTimeMatch = text?.match(/^(\d+)(s|m|h|hr|d|w)$/i);
    const muteUnitMap = { s:1000, m:60000, h:3600000, hr:3600000, d:86400000, w:604800000 };
    try {
        const muteMeta = await devtrust.groupMetadata(m.chat);
        if (muteMeta.announce) return reply('✘ Group is already muted');
        await devtrust.groupSettingUpdate(m.chat, 'announcement');
        if (!muteTimeMatch) return reply('✓ Group muted');
        const muteMs = parseInt(muteTimeMatch[1]) * (muteUnitMap[muteTimeMatch[2].toLowerCase()] || 60000);
        if (muteMs > 604800000) return reply('✘ Max mute time is 7 days');
        reply(`✓ Group muted for ${muteTimeMatch[1]}${muteTimeMatch[2]}`);
        if (global.activeTimers?.has(m.chat)) clearTimeout(global.activeTimers.get(m.chat));
        if (!global.activeTimers) global.activeTimers = new Map();
        const muteTid = setTimeout(async () => {
            try {
                await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
                await devtrust.sendMessage(m.chat, { text: '✓ Group auto-unmuted' });
                global.activeTimers.delete(m.chat);
            } catch (e) {}
        }, muteMs);
        global.activeTimers.set(m.chat, muteTid);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== UNMUTE GROUP =====
case 'unmute': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const unmuteMeta = await devtrust.groupMetadata(m.chat);
        if (!unmuteMeta.announce) return reply('✘ Group is not muted');
        if (global.activeTimers?.has(m.chat)) {
            clearTimeout(global.activeTimers.get(m.chat));
            global.activeTimers.delete(m.chat);
        }
        await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
        reply('✓ Group unmuted');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP INVITE LINK =====
case 'invite':
case 'glink': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const glinkCode = await devtrust.groupInviteCode(m.chat);
        reply(`🔗 https://chat.whatsapp.com/${glinkCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== REVOKE LINK =====
case 'revoke': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupRevokeInvite(m.chat);
        const revokeNewCode = await devtrust.groupInviteCode(m.chat);
        reply(`✓ Link revoked\nNew: https://chat.whatsapp.com/${revokeNewCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== TAG ALL =====
case 'tagall':
case 'tag': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const tagAllJids = participants.map(p => p.jid || p.id);
    const tagAdminJids = participants.filter(p => p.admin != null).map(p => p.jid || p.id);
    if (text === 'admins') {
        const tagAdminMsg = tagAdminJids.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
        return reply(`*🛡️ Admins*\n\n${tagAdminMsg}`, tagAdminJids);
    }
    const tagMsg = (text ? `📢 ${text}\n\n` : '📢 Attention everyone!\n\n') + tagAllJids.map((j, i) => `${i+1}. @${j.split('@')[0]}`).join('\n');
    reply(tagMsg, tagAllJids);
}
break;

// ===== LOCK / UNLOCK SETTINGS =====
case 'lock': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'locked');
        reply('🔒 Group settings locked — admins only');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

case 'unlock': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'unlocked');
        reply('🔓 Group settings unlocked — all members can edit');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== OPEN / CLOSE GROUP =====
case 'open':
case 'groupopen': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'not_announcement');
        reply('🔓 Group opened! Everyone can now send messages.');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

case 'close':
case 'groupclose': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        await devtrust.groupSettingUpdate(m.chat, 'announcement');
        reply('🔒 Group closed! Only admins can send messages.');
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== DELETE MESSAGE (FIXED) =====
case 'del':
case 'delete': {
    if (!m.quoted) return reply('✘ Reply to a message to delete it');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    try {
        const delKey = {
            remoteJid: m.chat,
            fromMe: false,
            id: m.quoted.id || m.quoted.key?.id || m.quoted.fakeObj?.key?.id,
            participant: m.quoted.sender || m.quoted.key?.participant || m.quoted.fakeObj?.key?.participant
        };
        await devtrust.sendMessage(m.chat, { delete: delKey });
        reply('✅ Message deleted');
    } catch (e) { reply('✘ Could not delete: ' + e.message); }
}
break;

// ===== GROUP INFO =====
case 'ginfo': {
    if (!m.isGroup) return reply('✘ Groups only');
    try {
        const ginfoMeta = groupMetadata || await devtrust.groupMetadata(m.chat);
        const ginfoTotal = ginfoMeta.participants.length;
        const ginfoAdmins = ginfoMeta.participants.filter(p => p.admin != null).length;
        const ginfoCreated = ginfoMeta.creation ? new Date(ginfoMeta.creation * 1000).toLocaleString() : 'Unknown';
        reply(
`*╭─ GROUP INFO ─╮*
│ 📌 *Name:* ${ginfoMeta.subject}
│ 👥 *Members:* ${ginfoTotal}
│ 🛡️ *Admins:* ${ginfoAdmins}
│ 📅 *Created:* ${ginfoCreated}
│ 🔒 *Restricted:* ${ginfoMeta.restrict ? 'Yes' : 'No'}
│ 🔇 *Announced:* ${ginfoMeta.announce ? 'Yes' : 'No'}
│ 🆔 *ID:* ${m.chat}
${ginfoMeta.desc ? `│ 📝 *Desc:* ${ginfoMeta.desc}` : ''}
*╰──────────────╯*`
        );
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== WARN SYSTEM =====
case 'warn': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const warnMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const warnUser = warnMentioned[0] || m.quoted?.sender;
    if (!warnUser) return reply('✘ Reply to or mention a user');
    const WARN_FILE = './database/group_warns.json';
    let warnData = {};
    try { warnData = JSON.parse(fs.readFileSync(WARN_FILE)); } catch(e) {}
    if (!warnData[m.chat]) warnData[m.chat] = {};
    if (!warnData[m.chat][warnUser]) warnData[m.chat][warnUser] = 0;
    warnData[m.chat][warnUser]++;
    const warnCount = warnData[m.chat][warnUser];
    const warnMax = 3;
    fs.writeFileSync(WARN_FILE, JSON.stringify(warnData, null, 2));
    if (warnCount >= warnMax) {
        reply(`⚠️ @${warnUser.split('@')[0]} exceeded ${warnMax} warnings! Kicking...`, [warnUser]);
        warnData[m.chat][warnUser] = 0;
        fs.writeFileSync(WARN_FILE, JSON.stringify(warnData, null, 2));
        try { await devtrust.groupParticipantsUpdate(m.chat, [warnUser], 'remove'); } catch (e) {}
    } else {
        reply(
`⚠️ *WARNING*
👤 User: @${warnUser.split('@')[0]}
📋 Reason: ${text || 'Not specified'}
🔢 Count: ${warnCount}/${warnMax}`, [warnUser]);
    }
}
break;

case 'resetwarn':
case 'clearwarn': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const rwMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const rwUser = rwMentioned[0] || m.quoted?.sender;
    if (!rwUser) return reply('✘ Reply to or mention a user');
    const WARN_FILE2 = './database/group_warns.json';
    let rwData = {};
    try { rwData = JSON.parse(fs.readFileSync(WARN_FILE2)); } catch(e) {}
    if (rwData[m.chat]) delete rwData[m.chat][rwUser];
    fs.writeFileSync(WARN_FILE2, JSON.stringify(rwData, null, 2));
    reply(`✓ Warnings cleared for @${rwUser.split('@')[0]}`, [rwUser]);
}
break;

case 'warnlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const WARN_FILE3 = './database/group_warns.json';
    let wlData = {};
    try { wlData = JSON.parse(fs.readFileSync(WARN_FILE3)); } catch(e) {}
    const wlEntries = Object.entries(wlData[m.chat] || {}).filter(([,v]) => v > 0);
    if (!wlEntries.length) return reply('✓ No active warnings in this group');
    const wlList = wlEntries.map(([j, c]) => `• @${j.split('@')[0]}: ${c} warn(s)`).join('\n');
    reply(`*⚠️ Warning List*\n\n${wlList}`, wlEntries.map(([j]) => j));
}
break;

// ===== KICK ALL =====
case 'kickall': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isCreator) return reply('✘ Owner only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const kaBotId = devtrust.decodeJid(devtrust.user.id);
    const kaToKick = participants.filter(p => {
        const j = p.jid || p.id;
        return j !== kaBotId && j !== sender && p.admin == null;
    });
    if (!kaToKick.length) return reply('✘ No non-admin members to kick');
    reply(`⏳ Kicking ${kaToKick.length} members...`);
    for (const p of kaToKick) {
        try {
            await devtrust.groupParticipantsUpdate(m.chat, [p.jid || p.id], 'remove');
            await sleep(500);
        } catch (e) {}
    }
    reply('✓ Done kicking all non-admin members');
}
break;

// ===== TEMP KICK =====
case 'tkick': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    const tkTimeRegex = /(\d+)\s*(s|sec|m|min|h|hr|d)/gi;
    const tkMatches = [...(text || '').matchAll(tkTimeRegex)];
    if (!tkMatches.length) return reply(`✘ Provide duration\nExample: ${prefix}tkick @user 10m`);
    const tkUnitMap = { s:1000, sec:1000, m:60000, min:60000, h:3600000, hr:3600000, d:86400000 };
    let tkMs = 0;
    for (const match of tkMatches) tkMs += parseInt(match[1]) * (tkUnitMap[match[2].toLowerCase()] || 60000);
    const tkMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const tkUser = tkMentioned[0] || m.quoted?.sender;
    if (!tkUser) return reply('✘ Reply to or mention a member');
    const tkJid = (tkUser.includes('@') ? tkUser.split('@')[0] : tkUser).replace(/\D/g, '') + '@s.whatsapp.net';
    try {
        await devtrust.groupParticipantsUpdate(m.chat, [tkJid], 'remove');
        reply(`✓ @${tkJid.split('@')[0]} temp kicked. Re-adding in ${Math.round(tkMs/60000)} min`, [tkJid]);
        setTimeout(async () => {
            try {
                await devtrust.groupParticipantsUpdate(m.chat, [tkJid], 'add');
                await devtrust.sendMessage(m.chat, { text: `✓ @${tkJid.split('@')[0]} re-added`, mentions: [tkJid] });
            } catch (e) {
                const tkCode = await devtrust.groupInviteCode(m.chat).catch(() => null);
                if (tkCode) await devtrust.sendMessage(tkJid, { text: `https://chat.whatsapp.com/${tkCode}` });
            }
        }, tkMs);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== MEMBER LIST =====
case 'members':
case 'memberlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const memList = participants.map((p, i) => `${i+1}. @${(p.jid||p.id).split('@')[0]}${p.admin ? ' 👑' : ''}`).join('\n');
    reply(`*👥 Members (${participants.length})*\n\n${memList}`, participants.map(p => p.jid||p.id));
}
break;

// ===== ADMIN LIST =====
case 'adminlist': {
    if (!m.isGroup) return reply('✘ Groups only');
    const alAdmins = participants.filter(p => p.admin != null);
    if (!alAdmins.length) return reply('✘ No admins found');
    const alList = alAdmins.map((p, i) => `${i+1}. @${(p.jid||p.id).split('@')[0]} ${p.admin === 'superadmin' ? '👑' : '🛡️'}`).join('\n');
    reply(`*🛡️ Admins (${alAdmins.length})*\n\n${alList}`, alAdmins.map(p => p.jid||p.id));
}
break;

// ===== MUTE/UNMUTE USER =====
case 'muteuser': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const muMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const muUser = muMentioned[0] || m.quoted?.sender;
    if (!muUser) return reply('✘ Reply to or mention a user');
    if (!global.muted) global.muted = {};
    if (!global.muted[m.chat]) global.muted[m.chat] = [];
    if (global.muted[m.chat].includes(muUser)) return reply(`✘ @${muUser.split('@')[0]} is already muted`, [muUser]);
    global.muted[m.chat].push(muUser);
    reply(`🔇 @${muUser.split('@')[0]} muted — their messages will be deleted`, [muUser]);
}
break;

case 'unmuteuser': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const umMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const umUser = umMentioned[0] || m.quoted?.sender;
    if (!umUser) return reply('✘ Reply to or mention a user');
    if (!global.muted?.[m.chat]?.includes(umUser)) return reply(`✘ @${umUser.split('@')[0]} is not muted`, [umUser]);
    global.muted[m.chat] = global.muted[m.chat].filter(j => j !== umUser);
    reply(`🔊 @${umUser.split('@')[0]} unmuted`, [umUser]);
}
break;

// ===== POLL =====
case 'poll': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!text) return reply(`Usage: ${prefix}poll Question | Option1 | Option2 | Option3`);
    const pollParts = text.split('|').map(p => p.trim());
    if (pollParts.length < 3) return reply(`✘ Need a question and at least 2 options\nExample: ${prefix}poll Who is best? | Bot A | Bot B`);
    try {
        await devtrust.sendMessage(m.chat, {
            poll: { name: pollParts[0], values: pollParts.slice(1), selectableCount: 1 }
        });
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== KICKR =====
case 'kickr': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    if (!isBotAdmins) return reply('✘ Bot needs to be admin');
    if (!m.quoted) return reply('✘ Reply to a message with mentions');
    const krMentions = m.quoted?.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (!krMentions.length) return reply('✘ No mentioned users in replied message');
    const krToKick = krMentions.filter(j => j !== m.quoted?.sender);
    if (!krToKick.length) return reply('✘ No users to kick (sender excluded)');
    reply(`⏳ Kicking ${krToKick.length} users...`);
    for (const j of krToKick) {
        try { await devtrust.groupParticipantsUpdate(m.chat, [j], 'remove'); await sleep(800); } catch (e) {}
    }
    reply('✓ Done');
}
break;

// ===== CREATE GROUP =====
case 'creategc': {
    if (!isCreator) return reply('✘ Owner only');
    const cgName = text || 'LËGĒNDÃRY Group';
    const cgMentioned = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const cgUser = cgMentioned[0] || m.quoted?.sender;
    if (!cgUser) return reply('✘ Mention a user to add');
    try {
        const cgGroup = await devtrust.groupCreate(cgName, [cgUser, sender]);
        const cgCode = await devtrust.groupInviteCode(cgGroup.id);
        reply(`✓ Group created: ${cgName}\nLink: https://chat.whatsapp.com/${cgCode}`);
    } catch (e) { reply('✘ ' + e.message); }
}
break;

// ===== GROUP EVENTS =====
case 'events':
case 'gcevent': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const EVENTS_FILE = './database/group_events.json';
    let evData = {};
    try { evData = JSON.parse(fs.readFileSync(EVENTS_FILE)); } catch(e) {}
    evData[m.chat] = evData[m.chat] || { events: false, welcome: true, goodbye: true };
    const evParts = (text || '').split(' ');
    const evCmd = evParts[0]?.toLowerCase();
    if (!evCmd || evCmd === 'status') {
        return reply(`*Group Events*\nEnabled: ${evData[m.chat].events}\nWelcome: ${evData[m.chat].welcome}\nGoodbye: ${evData[m.chat].goodbye}\n\nUsage:\n${prefix}events on/off\n${prefix}events welcome on/off\n${prefix}events goodbye on/off`);
    }
    if (evCmd === 'on') { evData[m.chat].events = true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply('✓ Group events enabled'); }
    if (evCmd === 'off') { evData[m.chat].events = false; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply('✓ Group events disabled'); }
    if (evCmd === 'welcome') { evData[m.chat].welcome = evParts[1]==='on'; evData[m.chat].events=true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply(`✓ Welcome messages ${evParts[1]==='on'?'enabled':'disabled'}`); }
    if (evCmd === 'goodbye') { evData[m.chat].goodbye = evParts[1]==='on'; evData[m.chat].events=true; fs.writeFileSync(EVENTS_FILE, JSON.stringify(evData,null,2)); return reply(`✓ Goodbye messages ${evParts[1]==='on'?'enabled':'disabled'}`); }
    reply(`Usage:\n${prefix}events on/off\n${prefix}events welcome on/off\n${prefix}events goodbye on/off\n${prefix}events status`);
}
break;

// ===== ANTI STATUS (show all anti features) =====
case 'antistatus': {
    if (!m.isGroup) return reply('✘ Groups only');
    const alCfg = getSetting(m.chat, 'antilink', { enabled: false, action: 'delete' });
    const asCfg = getSetting(m.chat, 'antispam', { enabled: false, action: 'delete' });
    const atCfg = getSetting(m.chat, 'antitag', { enabled: false, action: 'delete' });
    const abCfg = getSetting(m.chat, 'antibot', { enabled: false, action: 'delete' });
    const abgCfg = getSetting(m.chat, 'antibeg', { enabled: false, action: 'delete' });
    reply(
`*🛡️ Group Anti-Features*

🔗 AntiLink: ${alCfg.enabled ? '✅ ON' : '❌ OFF'} | ${alCfg.action}
🚫 AntiSpam: ${asCfg.enabled ? '✅ ON' : '❌ OFF'} | ${asCfg.action}
🏷️ AntiTag:  ${atCfg.enabled ? '✅ ON' : '❌ OFF'} | ${atCfg.action}
🤖 AntiBot:  ${abCfg.enabled ? '✅ ON' : '❌ OFF'} | ${abCfg.action}
💰 AntiBeg:  ${abgCfg.enabled ? '✅ ON' : '❌ OFF'} | ${abgCfg.action}`
    );
}
break;

// ===== GROUP STATUS (post to WA group status) =====
case 'groupstatus':
case 'gstatus': {
    if (!m.isGroup) return reply('✘ Groups only');
    if (!isAdmins && !isCreator) return reply('✘ Admins only');
    const quotedMsg = m.quoted;
    const statusMime = (quotedMsg?.msg || quotedMsg)?.mimetype || '';
    try {
        let messagePayload;
        if (quotedMsg && /image/.test(statusMime)) {
            const statusMedia = await quotedMsg.download();
            const prepared = await prepareWAMessageMedia({ image: statusMedia, caption: text || '' }, { upload: devtrust.waUploadToServer });
            messagePayload = { groupStatusMessageV2: { message: { imageMessage: prepared.imageMessage } } };
        } else if (quotedMsg && /video/.test(statusMime)) {
            const statusMedia = await quotedMsg.download();
            const prepared = await prepareWAMessageMedia({ video: statusMedia, caption: text || '' }, { upload: devtrust.waUploadToServer });
            messagePayload = { groupStatusMessageV2: { message: { videoMessage: prepared.videoMessage } } };
        } else if (text) {
            messagePayload = { groupStatusMessageV2: { message: { extendedTextMessage: { text: text, font: 2 } } } };
        } else {
            return reply(`📢 *Group Status*\nUsage:\n• ${prefix}gstatus [text]\n• Reply image + ${prefix}gstatus [caption]\n• Reply video + ${prefix}gstatus [caption]`);
        }
        const statusMsg = generateWAMessageFromContent(m.chat, proto.Message.fromObject(messagePayload), { userJid: devtrust.user.id });
        await devtrust.relayMessage(m.chat, statusMsg.message, { messageId: statusMsg.key.id });
        reply('✅ Posted to group status!');
    } catch (e) {
        console.error('Group status error:', e);
        reply('❌ Failed: ' + e.message);
    }
}
break;

// ===== CREATEPANEL =====
case 'createpanel':
case 'panel': {
    const panelCmd = require('./commands/createpanel');
    await panelCmd(m, { text, prefix, devtrust });
}
break;

// ============================================================
// =================== END LEGENDARY COMMANDS =================
// ============================================================

// DEFAULT: eval for owner, silent ignore for others
default:
    // Check if body exists before trying to use it
    if (body && body.startsWith) {
        // Safe eval - ONLY for owner and with logging
        if (body.startsWith('<')) {
            if (!isCreator) {
                console.log(`⚠️ Non-owner tried to use eval: ${m.sender}`);
                return;
            }
            try {
                const result = await eval(`(async () => { return ${body.slice(3)} })()`);
                const output = util.inspect(result, { depth: 1 });
                console.log(chalk.yellow(`📝 Eval executed by owner: ${body.slice(3)}`));
                if (output.length > 4000) {
                    await m.reply('✅ *Executed* (output too long)');
                } else {
                    await m.reply(output);
                }
            } catch (e) {
                await m.reply(`❌ Error: ${e.message}`);
            }
            break;
        }
        // Safe async eval - ONLY for owner
        if (body.startsWith('>')) {
            if (!isCreator) {
                console.log(`⚠️ Non-owner tried to use async eval: ${m.sender}`);
                return;
            }
            try {
                let evaled = await eval(body.slice(2));
                if (typeof evaled !== 'string') evaled = util.inspect(evaled, { depth: 1 });
                console.log(chalk.yellow(`📝 Async eval executed by owner`));
                if (evaled.length > 4000) {
                    await m.reply('✅ *Executed* (output too long)');
                } else {
                    await m.reply(evaled);
                }
            } catch (err) {
                await m.reply(`❌ Error: ${err.message}`);
            }
            break;
        }
    }
    // If no command matched, just ignore
    break;

} // end switch

} catch (err) {
    // Log error for debugging (you'll still see it in console)
    console.log(chalk.red('❌ Command Error:'));
    console.log(err);
    
    // Silent fail - no message to user
    // Bot continues running normally
}
}

let file = require.resolve(__filename);
require('fs').watchFile(file, () => {
    require('fs').unwatchFile(file);
    console.log('\x1b[0;32m' + __filename + ' \x1b[1;32mupdated!\x1b[0m');
    delete require.cache[file];
    require(file);
});