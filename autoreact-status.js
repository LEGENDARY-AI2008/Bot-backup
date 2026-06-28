// ============================================================
// AUTO-REACT STATUS MODULE
// Automatically reacts to all contact status with random emojis
// ============================================================

const fs = require('fs');
const path = require('path');

const CONFIG_FILE = './nexstore/autoreact_config.json';

function ensureDir(p) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function getConfig() {
    ensureDir('./nexstore');
    if (fs.existsSync(CONFIG_FILE)) {
        return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    }
    return { enabled: false, emojis: [] };
}

function saveConfig(config) {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

const DEFAULT_EMOJIS = ['😂', '🔥', '💯', '👏', '😍', '🤔', '😱', '🎉', '🙏', '💪', '👌', '🤣', '😆', '✨', '🌟', '⭐', '🎊', '🎈', '👍', '❤️', '😎', '🤐', '🤑', '😤', '😈', '🙈', '🙉', '🙊', '👀', '💔', '🪀', '🎱', '🥏', '⚽', '🏀', '🏈', '⚾', '🥎', '🎾', '🏐', '🏉', '🟢'];

module.exports = {
    name: 'autoreact',
    setup: (devtrust, { reply }) => {
        // Listen for status updates
        devtrust.ev.on('messages.upsert', async (m) => {
            const config = getConfig();
            if (!config.enabled) return;

            for (const msg of m.messages) {
                // Check if it's a status message
                if (msg.message?.statusMessageV3 || msg.message?.groupStatusMessageV2) {
                    try {
                        const emojis = config.emojis.length > 0 ? config.emojis : DEFAULT_EMOJIS;
                        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                        await devtrust.sendMessage(msg.key.remoteJid, {
                            react: {
                                text: randomEmoji,
                                key: msg.key
                            }
                        });

                        console.log(`✅ Auto-reacted with ${randomEmoji} to status`);
                    } catch (e) {
                        console.log(`⚠️ Failed to auto-react: ${e.message}`);
                    }
                }
            }
        });

        console.log('✅ Auto-React Status module loaded!');
    },

    commands: {
        autoreact: async (devtrust, m, { reply, args, prefix }) => {
            const config = getConfig();
            const subcommand = args[0]?.toLowerCase();

            if (!subcommand) {
                return reply(`
🔄 AUTO-REACT STATUS

Usage:
${prefix}autoreact on - Enable auto-react
${prefix}autoreact off - Disable auto-react  
${prefix}autoreact emoji <emoji> - Add custom emoji
${prefix}autoreact list - View all reaction emojis
${prefix}autoreact reset - Reset to default emojis
${prefix}autoreact status - Check current status

Status: ${config.enabled ? '✅ ENABLED' : '❌ DISABLED'}
Emojis: ${config.emojis.length || 'Default (30)'}`);
            }

            if (subcommand === 'on') {
                config.enabled = true;
                saveConfig(config);
                return reply('✅ Auto-react STATUS ENABLED!\nWill react to all status updates with random emojis');
            }

            if (subcommand === 'off') {
                config.enabled = false;
                saveConfig(config);
                return reply('❌ Auto-react STATUS DISABLED');
            }

            if (subcommand === 'emoji') {
                const emoji = args[1];
                if (!emoji) return reply(`Usage: ${prefix}autoreact emoji <emoji>`);
                if (!config.emojis.includes(emoji)) {
                    config.emojis.push(emoji);
                    saveConfig(config);
                    return reply(`✅ Added ${emoji} to reaction list!\nTotal emojis: ${config.emojis.length}`);
                }
                return reply(`⚠️ ${emoji} already in list`);
            }

            if (subcommand === 'list') {
                const emojis = config.emojis.length > 0 ? config.emojis : DEFAULT_EMOJIS;
                return reply(`😂 REACTION EMOJIS\n\n${emojis.join(' ')}\n\nTotal: ${emojis.length}`);
            }

            if (subcommand === 'reset') {
                config.emojis = [];
                saveConfig(config);
                return reply('✅ Reset to default emojis (30 emojis)');
            }

            if (subcommand === 'status') {
                const status = config.enabled ? '✅ ENABLED' : '❌ DISABLED';
                const emojiCount = config.emojis.length || '30 (default)';
                return reply(`
🔄 AUTO-REACT STATUS

Status: ${status}
Emojis: ${emojiCount}
Last updated: ${new Date().toLocaleString()}`);
            }

            return reply('❌ Unknown command. Use: on, off, emoji, list, reset, status');
        }
    }
};
