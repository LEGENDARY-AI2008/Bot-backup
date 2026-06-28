require('dotenv').config();
require('./setting/config');
const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const os = require('os');
const { sleep } = require('./nexstore/utils');
const { BOT_TOKEN } = require('./nexstore/token');
const { autoLoadPairs } = require('./autoload');
 
const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const adminFilePath = path.join(__dirname, 'nexstore', 'admin.json');
let adminIDs = [];

// Store for user tracking
const userFilePath = path.join(__dirname, 'nexstore', 'users.json');
let userIDs = new Set();

// Required group and channels (VERIFICATION ENABLED)
const REQUIRED_GROUP = '@legendbotchannel';
const REQUIRED_CHANNELS = [
  '@legendbotch1',
  '@legendbotch2'
];

// Social media links (ALL NEW LINKS)
const SOCIAL_LINKS = {
  telegram_group: 'https://t.me/legendbotchannel',
  channel1: 'https://t.me/legendbotch1',
  channel2: 'https://t.me/legendbotch2',
  sponsor: 'https://t.me/legendarylab001',
  developer: '@legendbotchannel'
};

// Utility functions
const exists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const loadAdminIDs = async () => {
  const ownerID = '8409180755';
  const defaultAdmins = [ownerID];

  if (!(await exists(adminFilePath))) {
    await fs.writeFile(adminFilePath, JSON.stringify(defaultAdmins, null, 2));
    adminIDs = defaultAdmins;
    console.log('✅ Created admin.json with default owner id');
  } else {
    try {
      const raw = await fs.readFile(adminFilePath, 'utf8');
      adminIDs = JSON.parse(raw);
    } catch (err) {
      console.error('❌ Error loading admin.json:', err);
      adminIDs = defaultAdmins;
    }
  }
  console.log('📥 Loaded admin ids:', adminIDs);
};

function runtime(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${d}d ${h}h ${m}m ${s}s`;
}

// Load user IDs
const loadUserIDs = async () => {
  if (await exists(userFilePath)) {
    try {
      const raw = await fs.readFile(userFilePath, 'utf8');
      const users = JSON.parse(raw);
      userIDs = new Set(users);
      console.log(`📥 Loaded ${userIDs.size} users`);
    } catch (err) {
      console.error('❌ Error loading users.json:', err);
      userIDs = new Set();
    }
  }
};

// Save user IDs
const saveUserIDs = async () => {
  try {
    await fs.writeFile(userFilePath, JSON.stringify([...userIDs], null, 2));
  } catch (err) {
    console.error('❌ Error saving users.json:', err);
  }
};

// Track user
const trackUser = async (userId) => {
  const userIdStr = userId.toString();
  if (!userIDs.has(userIdStr)) {
    userIDs.add(userIdStr);
    await saveUserIDs();
    console.log(`➕ New user tracked: ${userIdStr}`);
  }
};

// Check if user has joined required group and channels (NO SPONSOR CHECK)
const checkMembership = async (userId) => {
  try {
    // Check group membership
    const groupMember = await bot.getChatMember(REQUIRED_GROUP, userId).catch(() => null);
    
    // Check all required channels (sponsor NOT included)
    const channelChecks = await Promise.all(
      REQUIRED_CHANNELS.map(channel => 
        bot.getChatMember(channel, userId).catch(() => null)
      )
    );

    const validStatuses = ['member', 'administrator', 'creator'];
    const hasJoinedGroup = groupMember && validStatuses.includes(groupMember.status);
    const hasJoinedAllChannels = channelChecks.every(member => member && validStatuses.includes(member.status));

    return {
      hasJoinedGroup,
      hasJoinedAllChannels,
      hasJoinedAll: hasJoinedGroup && hasJoinedAllChannels
    };
  } catch (error) {
    console.error('Error checking membership:', error);
    return {
      hasJoinedGroup: false,
      hasJoinedAllChannels: false,
      hasJoinedAll: false
    };
  }
};

// Send join requirement message (WITH SPONSOR - NO VERIFICATION)
const sendJoinRequirement = (chatId) => {
  return bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃      ⚜️ ACCESS REQUIRED ⚜️
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ✦ YOU MUST JOIN TO PROCEED ✦
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  📢 LEGEND CHANNEL 1
┃  📢 LEGEND CHANNEL 2  
┃  👥 LEGEND GROUP
┃  🎁 SPONSOR CHANNEL
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ⚡ JOIN ALL THEN VERIFY
┃  (Sponsor is optional but appreciated)
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '📢 LEGEND CH 1', url: SOCIAL_LINKS.channel1 }],
          [{ text: '📢 LEGEND CH 2', url: SOCIAL_LINKS.channel2 }],
          [{ text: '👥 LEGEND GROUP', url: SOCIAL_LINKS.telegram_group }],
          [{ text: '🎁 SPONSOR', url: SOCIAL_LINKS.sponsor }],
          [{ text: '🔓 VERIFY ACCESS', callback_data: 'check_membership' }]
        ]
      }
    }
  );
};

// Middleware to check membership before executing commands
const requireMembership = (handler) => {
  return async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    // Track user
    await trackUser(userId);

    // Admins bypass membership check
    if (adminIDs.includes(userId.toString())) {
      return handler(msg, match);
    }

    // Check membership (ONLY group + required channels)
    const membership = await checkMembership(userId);
    
    if (!membership.hasJoinedAll) {
      return sendJoinRequirement(chatId);
    }

    return handler(msg, match);
  };
};

// State management
let isShuttingDown = false;
let isAutoLoadRunning = false;

// Auto-load functionality
const runAutoLoad = async () => {
  if (isAutoLoadRunning || isShuttingDown) return;
  isAutoLoadRunning = true;

  try {
    console.log('⏱️ Initializing auto-load');
    await autoLoadPairs();
    console.log('✅ Auto-load completed');
  } catch (e) {
    console.error('❌ Auto-load failed:', e);
  } finally {
    isAutoLoadRunning = false;
  }
};

const startAutoLoadLoop = () => {
  runAutoLoad();
  setInterval(runAutoLoad, 60 * 60 * 1000);
};

// Graceful shutdown
const gracefulShutdown = (signal) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  
  console.log(`🛑 Received ${signal}. Shutting down gracefully...`);
  bot.stopPolling();
  console.log('✅ Bot stopped successfully');
  process.exit(0);
};

// ========================
// COMMAND HANDLING
// ========================
bot.onText(/\/runtime/, async (msg) => {
  try {
    const chatId = msg.chat.id;

    const caption = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⏱️ STATUS REPORT
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  🟢 ONLINE: ${runtime(process.uptime())}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚜️ LËGĒNDÃRY BOT
┃  ⚡ BY LËGĒNDÃRY LAB™
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    await bot.sendMessage(chatId, caption, {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "⚜️ MAIN CHANNEL", url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  } catch (err) {
    console.error('RUNTIME CMD ERROR:', err);
    try {
      await bot.sendMessage(msg.chat.id, '⚠️ Failed to get runtime info.');
    } catch (e) { /* ignore */ }
  }
});

// Start command (NO membership check) - NEW DESIGN
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  // Track user
  await trackUser(userId);
  
  const caption = `
╔══════════════════════════════╗
║     ⚜️ LËGĒNDÃRY BOT ⚜️      ║
║    PREMIUM MD CONNECTOR       ║
╚══════════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃       ✨ SYSTEM ACTIVE ✨
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Welcome to the LEGENDARY realm
┃  Your ultimate WhatsApp connector
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃       📋 COMMAND CENTER
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  🔹 /pair <number> - Connect device
┃  🔹 /delpair <number> - Remove device  
┃  🔹 /listpairs - View connections
┃  🔹 /report - Submit an issue
┃  🔹 /autoload - Load sessions
┃  🔹 /runtime - Check uptime
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ⚡ Powered by LËGĒNDÃRY LAB™
┃  💪 Be legendary. Stay connected.
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
        [{ text: '👥 GROUP', url: SOCIAL_LINKS.telegram_group }],
        [{ text: '🎁 SPONSOR', url: SOCIAL_LINKS.sponsor }],
        [{ text: '❓ COMMANDS', callback_data: 'help_msg' }]
      ]
    }
  };
   
  await bot.sendMessage(chatId, caption, keyboard);
});

// Handle bare /pair command
bot.onText(/^\/pair\s*$/, requireMembership((msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⚠️ FORMAT ERROR
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ✦ COMMAND FORMAT ✦
┃  
┃  /pair 234xxxxxxxxxx
┃  
┃  Example:
┃  /pair 2348012345678
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
     { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    }
  );
}));

// Enhanced /connect command
bot.onText(/\/pair (.+)/, requireMembership(async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1].trim();

  try {
    if (!text || /[a-z]/i.test(text)) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⚠️ INVALID INPUT
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Use: /pair 234xxxxxxxxxx
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    if (!/^\d{7,15}(\|\d{1,10})?$/.test(text)) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ FORMAT ERROR
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Use: /pair 234xxxxxxxxxx
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    if (text.startsWith('0')) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ INVALID START
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Don't start with 0
┃  Use country code: 234
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const countryCode = text.slice(0, 3);
    if (["252", "4567877"].includes(countryCode)) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ NOT SUPPORTED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  This country code is blocked
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const pairingFolder = path.join(__dirname, 'nexstore', 'pairing');
    if (!(await exists(pairingFolder))) {
      await fs.mkdir(pairingFolder, { recursive: true });
    }

    const files = await fs.readdir(pairingFolder);
    const pairedCount = files.filter(file => file.endsWith('@s.whatsapp.net')).length;
    
    if (pairedCount >= 30) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ LIMIT REACHED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Maximum 30 devices allowed
┃  Contact @legendbotchannel
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '👨‍💻 CONTACT', url: SOCIAL_LINKS.developer }],
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }]
          ]
        }
      });
    }

    const startpairing = require('./pair.js');
    const Xreturn = text.split("|")[0].replace(/[^0-9]/g, '') + "@s.whatsapp.net";
    
    await startpairing(Xreturn);
    await sleep(4000);

    const pairingFile = path.join(pairingFolder, 'pairing.json');
    const cu = await fs.readFile(pairingFile, 'utf-8');
    const cuObj = JSON.parse(cu);
    delete require.cache[require.resolve('./pair.js')];

    // Save paired user to owner.json
    const senderNumber = text.split("|")[0].replace(/[^0-9]/g, '');
    const whatsappFormat = senderNumber + "@s.whatsapp.net";
    const lidFormat = senderNumber + "@lid";

    const ownerPath = path.join(__dirname, 'allfunc', 'owner.json');
    let ownerData = [];

    try {
      const ownerFile = await fs.readFile(ownerPath, 'utf-8');
      ownerData = JSON.parse(ownerFile);
    } catch (err) {
      console.log("⚠️ Creating new owner.json file");
      ownerData = [];
    }

    let isNew = false;
    if (!ownerData.includes(whatsappFormat)) {
      ownerData.push(whatsappFormat);
      isNew = true;
    }
    if (!ownerData.includes(lidFormat)) {
      ownerData.push(lidFormat);
      isNew = true;
    }

    if (isNew) {
      await fs.writeFile(ownerPath, JSON.stringify(ownerData, null, 2));
      console.log("✅ Saved new owner:", senderNumber);
      
      bot.sendMessage(chatId, 
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🔐 PAIRING GENERATED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  📱 Target: ${senderNumber}
┃  🔑 Code: ${cuObj.code}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚡ Click to copy the code
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
        { parse_mode: 'Markdown' }
      );
    } else {
      console.log("ℹ️ User already in owner list:", senderNumber);
      
      bot.sendMessage(chatId, 
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     🔐 PAIRING GENERATED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  📱 Target: ${senderNumber}
┃  🔑 Code: ${cuObj.code}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚡ Already in database
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
              [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
            ]
          }
        }
      );
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
    bot.sendMessage(chatId, '❌ Connection failed. Please try again later.');
  }
}));

// Handle bare /delpair command
bot.onText(/^\/delpair\s*$/, requireMembership((msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⚠️ SPECIFY NUMBER
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Format: /delpair 234xxxxxxxxxx
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
  { 
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
        [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
      ]
    }
  });
}));

// Enhanced /delpair command
bot.onText(/\/delpair (.+)/, requireMembership(async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1].trim();

  try {
    if (!input || /[a-z]/i.test(input) || !/^\d{7,15}$/.test(input) || input.startsWith('0')) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ INVALID NUMBER
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Use: /delpair 234xxxxxxxxxx
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const jidSuffix = `${input}@s.whatsapp.net`;
    const pairingPath = path.join(__dirname, 'nexstore', 'pairing');

    if (!(await exists(pairingPath))) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ NOT FOUND
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Session not in database
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    const matched = entries.find(entry => entry.isDirectory() && entry.name.endsWith(jidSuffix));

    if (!matched) {
      return bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❌ NOT FOUND
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Number ${input} not in database
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const targetPath = path.join(pairingPath, matched.name);
    await fs.rm(targetPath, { recursive: true, force: true });

    bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ✅ REMOVED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Number ${input} removed
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  } catch (err) {
    console.error('Delpair error:', err);
    bot.sendMessage(chatId, '❌ Failed to delete session. Please try again.',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
}));

// Admin command - /listpair
bot.onText(/\/listpair$/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
  
  bot.sendMessage(chatId, '📋 Usage: `/listpair confirm`',
  { 
    parse_mode: 'Markdown',
    reply_markup: {
      inline_keyboard: [
        [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
        [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
      ]
    }
  });
});

// /listpair command with confirmation
bot.onText(/\/listpair (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const confirmation = match[1].trim().toLowerCase();

  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }

  if (confirmation !== 'confirm') {
    return bot.sendMessage(chatId, '⚠️ Please use: `/listpair confirm`',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }]
        ]
      }
    });
  }

  try {
    const pairingPath = path.join(__dirname, 'nexstore', 'pairing');
    
    if (!(await exists(pairingPath))) {
      return bot.sendMessage(chatId, '📂 No paired devices found',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    const pairedDevices = entries.filter(entry => entry.isDirectory()).map(entry => entry.name);

    if (pairedDevices.length === 0) {
      return bot.sendMessage(chatId, '📂 No paired devices found',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const deviceList = pairedDevices.map((device, index) => {
      const phoneNumber = device.split('@')[0];
      return `${index + 1}. ${phoneNumber}`;
    }).join('\n');

    bot.sendMessage(chatId, `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃     📊 PAIRED DEVICES
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  📱 Total: ${pairedDevices.length}
┃  
┃  ${deviceList}
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  } catch (err) {
    console.error('Listpair error:', err);
    bot.sendMessage(chatId, '❌ Failed to retrieve paired devices',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
});

// /autoload command (admin only)
bot.onText(/\/autoload (.+)/, (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const confirmation = match[1].trim().toLowerCase();
  
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
  
  if (confirmation !== 'confirm') {
    return bot.sendMessage(chatId, '⚠️ Usage: `/autoload confirm`',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
  
  console.log('Manual auto-load triggered');
  autoLoadPairs()
    .then(() => bot.sendMessage(chatId, '✅ Auto-load completed successfully'))
    .catch(e => bot.sendMessage(chatId, `❌ Auto-load failed: ${e.message}`));
});

// /report command - Users can report bugs/issues
bot.onText(/^\/report$/, requireMembership((msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📝 REPORT GUIDE
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Use: /report <your message>
┃  
┃  Example:
┃  /report Bot is not responding
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ✅ Keep it clear and brief
┃  ✅ Only report real issues
┃  
┃  Your feedback helps us improve!
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '🏠 MAIN MENU', callback_data: 'start_bot' }]
        ]
      }
    }
  );
}));

// /report with message
bot.onText(/\/report (.+)/, requireMembership(async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username ? `@${msg.from.username}` : 'No username';
  const firstName = msg.from.first_name || 'User';
  const reportMessage = match[1].trim();

  if (!reportMessage) {
    return bot.sendMessage(chatId, '❌ Please provide a message',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }]
        ]
      }
    });
  }

  try {
    const reportText = `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📮 NEW REPORT
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  👤 From: ${firstName}
┃  🆔 Username: ${username}
┃  🔢 User ID: ${userId}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  💬 Message:
┃  ${reportMessage}
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`;

    let sentCount = 0;
    for (const adminId of adminIDs) {
      try {
        await bot.sendMessage(adminId, reportText, {
          reply_markup: {
            inline_keyboard: [
              [{ text: '💬 REPLY TO USER', callback_data: `reply_${userId}` }]
            ]
          }
        });
        sentCount++;
      } catch (e) {
        console.error(`Failed to send report to admin ${adminId}:`, e.message);
      }
    }

    if (sentCount > 0) {
      bot.sendMessage(
        chatId,
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ✅ REPORT SENT
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Report submitted successfully!
┃  Admins will review and respond.
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
            ]
          }
        }
      );
      console.log(chalk.green(`📨 Report from ${userId} sent to ${sentCount} admins`));
    } else {
      bot.sendMessage(chatId, '❌ Failed to send report. Please try again later.');
    }
  } catch (error) {
    console.error('Report command error:', error);
    bot.sendMessage(chatId, '❌ Failed to send report');
  }
}));

// /clean command (admin only)
bot.onText(/\/clean$/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command',
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    });
  }
  
  try {
    const pairingPath = path.join(__dirname, 'nexstore', 'pairing');
    
    if (!(await exists(pairingPath))) {
      return bot.sendMessage(chatId, '📂 No sessions to clean',
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      });
    }

    const entries = await fs.readdir(pairingPath, { withFileTypes: true });
    let cleaned = 0;
    let kept = 0;

    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name === 'pairing.json') continue;
      
      const sessionPath = path.join(pairingPath, entry.name);
      const credsPath = path.join(sessionPath, 'creds.json');
      
      let isValid = false;
      if (await exists(credsPath)) {
        try {
          const creds = JSON.parse(await fs.readFile(credsPath, 'utf8'));
          isValid = !!(creds.me && creds.me.id && creds.registered);
        } catch (e) {
          isValid = false;
        }
      }
      
      if (!isValid) {
        await fs.rm(sessionPath, { recursive: true, force: true });
        console.log(`🗑️ Cleaned invalid session: ${entry.name}`);
        cleaned++;
      } else {
        kept++;
      }
    }

    bot.sendMessage(
      chatId, 
      `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        🧹 CLEANUP DONE
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ✅ Cleaned: ${cleaned}
┃  💾 Kept: ${kept}
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      { 
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
            [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
          ]
        }
      }
    );
  } catch (err) {
    console.error('Clean error:', err);
    bot.sendMessage(chatId, '❌ Cleanup failed');
  }
});

// /help command
bot.onText(/\/help/, async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  
  await trackUser(userId);
  
  const caption = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📚 COMMANDS
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  🔹 /pair <number> - Connect device
┃  🔹 /delpair <number> - Remove device
┃  🔹 /listpairs - View connections
┃  🔹 /report - Submit an issue
┃  🔹 /autoload - Load sessions (admin)
┃  🔹 /runtime - Check status
┃  🔹 /help - Show this menu
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  💡 Need help? @legendbotchannel
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

  const keyboard = {
    reply_markup: {
      inline_keyboard: [
        [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
        [{ text: '🏠 MAIN MENU', callback_data: 'start_bot' }]
      ]
    }
  };
   
  await bot.sendMessage(chatId, caption, keyboard);
});

// /broadcast command (admin only)
bot.onText(/\/broadcast$/, (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command');
  }
  
  bot.sendMessage(
    chatId,
    `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📢 BROADCAST
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Use: /broadcast <message>
┃  
┃  Total users: ${userIDs.size}
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
    { 
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
        ]
      }
    }
  );
});

// /broadcast with message
bot.onText(/\/broadcast (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  const message = match[1].trim();

  if (!adminIDs.includes(userId)) {
    return bot.sendMessage(chatId, '⛔ Owner-only command');
  }

  if (!message) {
    return bot.sendMessage(chatId, '❌ Please provide a message');
  }

  const totalUsers = userIDs.size;
  
  if (totalUsers === 0) {
    return bot.sendMessage(chatId, '📂 No users to broadcast to');
  }

  const statusMsg = await bot.sendMessage(
    chatId,
    `📢 Broadcasting...\n\nTotal: ${totalUsers}\nSent: 0\nFailed: 0`
  );

  let sent = 0;
  let failed = 0;
  const users = [...userIDs];

  for (let i = 0; i < users.length; i++) {
    try {
      await bot.sendMessage(
        users[i],
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📢 ANNOUNCEMENT
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ${message}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  ⚜️ LËGĒNDÃRY BOT
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
        {
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
              [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
            ]
          }
        }
      );
      sent++;
      
      if (i % 10 === 0 || i === users.length - 1) {
        try {
          await bot.editMessageText(
            `📢 Broadcasting...\n\nTotal: ${totalUsers}\nSent: ${sent}\nFailed: ${failed}\nProgress: ${Math.round((i + 1) / users.length * 100)}%`,
            {
              chat_id: chatId,
              message_id: statusMsg.message_id
            }
          );
        } catch (e) {
          // Ignore edit errors
        }
      }
      
      await sleep(100);
      
    } catch (error) {
      failed++;
      console.log(`Failed to send to ${users[i]}: ${error.message}`);
      
      if (error.response && error.response.body && error.response.body.error_code === 403) {
        userIDs.delete(users[i]);
        await saveUserIDs();
      }
    }
  }

  await bot.editMessageText(
    `✅ Broadcast Complete!\n\nTotal: ${totalUsers}\nSent: ${sent}\nFailed: ${failed}\nSuccess Rate: ${Math.round(sent / totalUsers * 100)}%`,
    {
      chat_id: chatId,
      message_id: statusMsg.message_id
    }
  );

  console.log(chalk.green(`✅ Broadcast completed: ${sent}/${totalUsers} sent, ${failed} failed`));
});

// Handle unrecognized commands
bot.on('message', async (msg) => {
  if (msg.text && msg.text.startsWith('/')) {
    const command = msg.text.split(' ')[0];
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    const validCommands = [
      '/start', '/pair', '/delpair', '/autoload', 
      '/listpair', '/runtime', '/broadcast', '/clean', 
      '/help', '/report'
    ];

    if (!validCommands.includes(command)) {
      await trackUser(userId);
      
      if (!adminIDs.includes(userId.toString())) {
        const membership = await checkMembership(userId);
        if (!membership.hasJoinedAll) {
          return sendJoinRequirement(chatId);
        }
      }

      bot.sendMessage(
        chatId,
        `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ❓ UNKNOWN CMD
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Type /help to see commands
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
        { 
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
              [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
              [{ text: '🏠 MAIN MENU', callback_data: 'start_bot' }]
            ]
          }
        }
      );
    }
  }
});

// Handle text messages for admin replies
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id.toString();
  
  if (adminIDs.includes(userId) && msg.reply_to_message) {
    const replyToText = msg.reply_to_message.text;
    
    if (replyToText && replyToText.includes('NEW REPORT')) {
      const userIdMatch = replyToText.match(/User ID: (\d+)/);
      
      if (userIdMatch && userIdMatch[1]) {
        const targetUserId = userIdMatch[1];
        const adminReply = msg.text;
        
        try {
          await bot.sendMessage(
            targetUserId,
            `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📬 ADMIN RESPONSE
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ${adminReply}
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  👨‍💻 Contact: @legendbotchannel
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
            {
              parse_mode: 'Markdown',
              reply_markup: {
                inline_keyboard: [
                  [{ text: '👨‍💻 CONTACT', url: SOCIAL_LINKS.developer }]
                ]
              }
            }
          );
          
          bot.sendMessage(chatId, '✅ Reply sent to user');
          console.log(chalk.green(`📬 Admin ${userId} replied to user ${targetUserId}`));
        } catch (error) {
          console.error('Error sending admin reply:', error);
          bot.sendMessage(chatId, '❌ Failed to send reply');
        }
      }
    }
  }
});

// Enhanced Callback handler
bot.on('callback_query', async (callbackQuery) => {
  const msg = callbackQuery.message;
  const data = callbackQuery.data;
  const userId = callbackQuery.from.id;
  const chatId = msg.chat.id;
  
  await trackUser(userId);

  if (data === 'check_membership') {
    try {
      await bot.answerCallbackQuery(callbackQuery.id, { text: 'Checking membership...' });

      const membership = await checkMembership(userId);

      if (membership.hasJoinedAll) {
        await bot.editMessageText(
          `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ✅ ACCESS GRANTED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ✓ Group joined
┃  ✓ Channels joined
┃  
┃  Click start to begin!
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '🚀 START BOT', callback_data: 'start_bot' }],
                [{ text: '❓ COMMANDS', callback_data: 'help_msg' }],
                [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }]
              ]
            }
          }
        );
      } else {
        let missingText = '';
        if (!membership.hasJoinedGroup && !membership.hasJoinedAllChannels) {
          missingText = '❌ Missing: Group & Channels';
        } else if (!membership.hasJoinedGroup) {
          missingText = '❌ Missing: Group\n✅ Channels joined';
        } else {
          missingText = '✅ Group joined\n❌ Missing: Channels';
        }

        await bot.editMessageText(
          `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        ⚠️ ACCESS DENIED
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ${missingText}
┃  
┃  Please join ALL required:
┃  • Legend Group
┃  • Legend CH 1
┃  • Legend CH 2
┃  
┃  Then verify again.
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
          {
            chat_id: chatId,
            message_id: msg.message_id,
            parse_mode: 'Markdown',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📢 LEGEND CH 1', url: SOCIAL_LINKS.channel1 }],
                [{ text: '📢 LEGEND CH 2', url: SOCIAL_LINKS.channel2 }],
                [{ text: '👥 LEGEND GROUP', url: SOCIAL_LINKS.telegram_group }],
                [{ text: '🎁 SPONSOR', url: SOCIAL_LINKS.sponsor }],
                [{ text: '🔓 VERIFY AGAIN', callback_data: 'check_membership' }]
              ]
            }
          }
        );
      }
    } catch (error) {
      console.error('Error in membership check callback:', error);
      await bot.answerCallbackQuery(
        callbackQuery.id, 
        { text: '⚠️ Error checking membership', show_alert: true }
      );
    }
  } else if (data === 'start_bot') {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    const caption = `
╔══════════════════════════════╗
║     ⚜️ LËGĒNDÃRY BOT ⚜️      ║
║    PREMIUM MD CONNECTOR       ║
╚══════════════════════════════╝

┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃       ✨ SYSTEM ACTIVE ✨
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Welcome to the LEGENDARY realm
┃  Your ultimate WhatsApp connector
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃       📋 COMMAND CENTER
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  🔹 /pair <number> - Connect device
┃  🔹 /delpair <number> - Remove device  
┃  🔹 /listpairs - View connections
┃  🔹 /report - Submit an issue
┃  🔹 /autoload - Load sessions
┃  🔹 /runtime - Check uptime
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  ⚡ Powered by LËGĒNDÃRY LAB™
┃  💪 Be legendary. Stay connected.
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
          [{ text: '👥 GROUP', url: SOCIAL_LINKS.telegram_group }],
          [{ text: '🎁 SPONSOR', url: SOCIAL_LINKS.sponsor }],
          [{ text: '❓ COMMANDS', callback_data: 'help_msg' }]
        ]
      }
    };
    
    await bot.sendMessage(chatId, caption, keyboard);
    
  } else if (data.startsWith('reply_')) {
    const targetUserId = data.replace('reply_', '');
    
    await bot.answerCallbackQuery(callbackQuery.id, { 
      text: 'Reply to the report message above', 
      show_alert: true 
    });
    
    await bot.sendMessage(
      chatId,
      `┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        💬 REPLY MODE
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  Reply to this message to send
┃  your response to the user.
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛`,
      {
        parse_mode: 'Markdown',
        reply_to_message_id: msg.message_id
      }
    );
    
  } else if (data === 'help_msg') {
    await bot.answerCallbackQuery(callbackQuery.id);
    
    const caption = `
┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃        📚 COMMANDS
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  
┃  🔹 /pair <number> - Connect device
┃  🔹 /delpair <number> - Remove device
┃  🔹 /listpairs - View connections
┃  🔹 /report - Submit an issue
┃  🔹 /autoload - Load sessions (admin)
┃  🔹 /runtime - Check status
┃  🔹 /help - Show this menu
┃  
┃  ━━━━━━━━━━━━━━━━━━━━━━━━━━
┃  💡 Need help? @legendbotchannel
┃  
┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛
`;

    const keyboard = {
      reply_markup: {
        inline_keyboard: [
          [{ text: '⚜️ CHANNEL', url: SOCIAL_LINKS.channel1 }],
          [{ text: '🏠 MAIN MENU', callback_data: 'start_bot' }]
        ]
      }
    };
    
    await bot.sendMessage(chatId, caption, keyboard);
  }
});

// Initialize and start
(async () => {
  await loadAdminIDs();
  await loadUserIDs();
  //startAutoLoadLoop(); // Uncomment if you want auto-load
  
  const restartCount = parseInt(process.env.RESTART_COUNT || '0', 10);
  console.log(`♻️ Restart #${restartCount + 1}`);
  process.env.RESTART_COUNT = String(restartCount + 1);

  console.log(chalk.magenta('⚜️ LËGĒNDÃRY BOT is running...'));
  console.log(chalk.blue(`📢 Required group: ${REQUIRED_GROUP}`));
  console.log(chalk.red(`📢 Required channels: ${REQUIRED_CHANNELS.join(', ')}`));
  console.log(chalk.gray(`🎁 Sponsor channel: ${SOCIAL_LINKS.sponsor} (no verification)`));
  console.log('🔗 Social links updated:');
  console.log(`📢 Channel 1: ${SOCIAL_LINKS.channel1}`);
  console.log(`📢 Channel 2: ${SOCIAL_LINKS.channel2}`);
  console.log(chalk.cyan(`👥 Group: ${SOCIAL_LINKS.telegram_group}`));
  console.log(chalk.yellow(`👨‍💻 Developer: ${SOCIAL_LINKS.developer}`));
  console.log('');
  console.log(chalk.green('✅ Membership checking: ENABLED (Group + CH1 + CH2 only)'));
  console.log(chalk.gray('🎁 Sponsor channel: DISPLAY ONLY - No verification required'));
  console.log(chalk.green('✅ Report system: ENABLED'));
  console.log(chalk.yellow('⚠️ Make sure bot is admin in group and channels!'));
})();

// Shutdown handlers
process.once('SIGINT', () => gracefulShutdown('SIGINT'));
process.once('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('message', (msg) => {
  if (msg === 'shutdown') gracefulShutdown('PM2_SHUTDOWN');
});