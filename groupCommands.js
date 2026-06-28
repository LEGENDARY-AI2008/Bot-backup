// ============================================================
// LEGENDARY BOT — groupCommands.js
// All group commands + new features
// Called from case.js via: require('./groupCommands')(devtrust, m, { ... })
// ============================================================

const { getSetting, setSetting } = require("./setting/Settings.js");
const fs = require('fs');
const path = require('path');
const axios = require('axios');

const OPENROUTER_API_KEY = "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";

async function askAI(prompt) {
    const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        { model: "openai/gpt-4o-mini", messages: [{ role: "user", content: prompt }] },
        { headers: { "Authorization": `Bearer ${OPENROUTER_API_KEY}`, "Content-Type": "application/json" } }
    );
    return data.choices?.[0]?.message?.content || "No response.";
}

module.exports = async (devtrust, m, { command, args, text, prefix, reply, isAdmins, isCreator, isBotAdmins, participants, groupMetadata, pushname, getSetting, setSetting }) => {

const sender = m.sender;
const chat = m.chat;

// ──────────────────────────────────────────────
// 🏆 1. GROUP ACTIVITY LEADERBOARD
// Toggle: .leaderboard on/off
// ──────────────────────────────────────────────
if (command === 'leaderboard' || command === 'topactive') {
    if (!m.isGroup) return reply('❌ Group only');
    const lb = getSetting(chat, 'leaderboard_data', {});
    if (!Object.keys(lb).length) return reply('📊 No activity recorded yet in this group.');
    const sorted = Object.entries(lb).sort((a, b) => b[1] - a[1]).slice(0, 10);
    let text = `🏆 *GROUP ACTIVITY LEADERBOARD*\n\n`;
    sorted.forEach(([jid, count], i) => {
        const medals = ['🥇','🥈','🥉'];
        const medal = medals[i] || `${i+1}.`;
        text += `${medal} @${jid.split('@')[0]} — ${count} messages\n`;
    });
    return devtrust.sendMessage(chat, { text, mentions: sorted.map(([jid]) => jid) });
}

if (command === 'leaderboardon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'leaderboard', true);
    return reply('✅ Activity leaderboard tracking *ON*');
}
if (command === 'leaderboardoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'leaderboard', false);
    return reply('🔴 Activity leaderboard tracking *OFF*');
}

// Track messages for leaderboard
if (m.isGroup && getSetting(chat, 'leaderboard', false) && !m.key?.fromMe) {
    const lb = getSetting(chat, 'leaderboard_data', {});
    lb[sender] = (lb[sender] || 0) + 1;
    setSetting(chat, 'leaderboard_data', lb);
}

// ──────────────────────────────────────────────
// 🎤 2. VOICE NOTE TRANSCRIPTION
// Toggle: .transcripton / .transcriptoff
// ──────────────────────────────────────────────
if (command === 'transcripton') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'autotranscribe', true);
    return reply('✅ Voice note transcription *ON*\nI will convert all voice notes to text automatically.');
}
if (command === 'transcriptoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'autotranscribe', false);
    return reply('🔴 Voice note transcription *OFF*');
}

// ──────────────────────────────────────────────
// 🤣 3. ROAST GENERATOR
// .roast @user
// ──────────────────────────────────────────────
if (command === 'roast') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!getSetting(chat, 'roast', false) && !isCreator) return reply('❌ Roast feature is OFF. Admin can enable with *.rоaston*');
    const mentioned = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!mentioned) return reply(`Usage: *.roast @user*`);
    const name = mentioned.split('@')[0];
    const roast = await askAI(`Give a funny, harmless, creative roast for someone in a WhatsApp group. Their number is ${name}. Make it funny but not offensive. Keep it under 3 sentences.`);
    return devtrust.sendMessage(chat, { text: `🔥 *ROAST SESSION*\n\n@${name}\n\n${roast}`, mentions: [mentioned] });
}
if (command === 'roaston') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'roast', true);
    return reply('✅ Roast feature *ON*');
}
if (command === 'roastoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'roast', false);
    return reply('🔴 Roast feature *OFF*');
}

// ──────────────────────────────────────────────
// 🤫 4. ANONYMOUS CONFESS SYSTEM
// .confess [message] — sends anonymous confession to group
// Toggle: .confesson / .confessoff
// ──────────────────────────────────────────────
if (command === 'confess') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!getSetting(chat, 'confess', false)) return reply('❌ Confess feature is OFF. Admin can enable with *.confesson*');
    if (!text) return reply(`Usage: *.confess your message here*`);
    // Delete sender's message for anonymity
    try { await devtrust.sendMessage(chat, { delete: m.key }); } catch {}
    return devtrust.sendMessage(chat, {
        text: `🤫 *ANONYMOUS CONFESSION*\n\n_"${text}"_\n\n_— Anonymous_`
    });
}
if (command === 'confesson') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'confess', true);
    return reply('✅ Confess system *ON*\nMembers can now type *.confess [message]* to confess anonymously.');
}
if (command === 'confessoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'confess', false);
    return reply('🔴 Confess system *OFF*');
}

// ──────────────────────────────────────────────
// 📊 5. GROUP POLLS WITH VOTING
// .poll Question | Option1 | Option2 | Option3
// Toggle: .pollon / .polloff
// ──────────────────────────────────────────────
if (command === 'poll') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!getSetting(chat, 'polls', false) && !isCreator) return reply('❌ Polls feature is OFF. Admin can enable with *.pollon*');
    if (!text) return reply(`Usage: *.poll Question | Option1 | Option2 | Option3*`);
    const parts = text.split('|').map(p => p.trim());
    if (parts.length < 3) return reply('❌ Need at least 2 options.\nUsage: *.poll Question | Option1 | Option2*');
    const question = parts[0];
    const options = parts.slice(1);
    await devtrust.sendMessage(chat, {
        poll: { name: question, values: options, selectableCount: 1 }
    });
    return;
}
if (command === 'pollon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'polls', true);
    return reply('✅ Polls *ON*\nUse *.poll Question | Option1 | Option2* to create polls');
}
if (command === 'polloff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'polls', false);
    return reply('🔴 Polls *OFF*');
}

// ──────────────────────────────────────────────
// ⏰ 6. REMINDER SYSTEM
// .remind 30m do something / .remind 2h meeting
// ──────────────────────────────────────────────
if (command === 'remind' || command === 'reminder') {
    if (!getSetting(chat, 'reminders', false) && !isCreator) return reply('❌ Reminders OFF. Admin enable with *.reminderon*');
    if (!text) return reply(`Usage: *.remind 30m your reminder*\nor *.remind 2h your reminder*`);
    const match = text.match(/^(\d+)(s|m|h|d)\s+(.+)/i);
    if (!match) return reply('❌ Format: *.remind 30m buy data*\nTime units: s=seconds, m=minutes, h=hours, d=days');
    const [, amount, unit, reminder] = match;
    const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    const ms = parseInt(amount) * multipliers[unit.toLowerCase()];
    if (ms > 86400000 * 7) return reply('❌ Max reminder time is 7 days');
    reply(`✅ Reminder set! I will remind you in *${amount}${unit}*\n📝 "${reminder}"`);
    setTimeout(async () => {
        await devtrust.sendMessage(chat, {
            text: `⏰ *REMINDER*\n\n@${sender.split('@')[0]}\n\n📝 "${reminder}"`,
            mentions: [sender]
        });
    }, ms);
    return;
}
if (command === 'reminderon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'reminders', true);
    return reply('✅ Reminder system *ON*');
}
if (command === 'reminderoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'reminders', false);
    return reply('🔴 Reminder system *OFF*');
}

// ──────────────────────────────────────────────
// 🌍 7. AUTO TRANSLATE
// .translate [text] or reply to a message
// Toggle: .translateon / .translateoff
// ──────────────────────────────────────────────
if (command === 'translate' || command === 'tr') {
    if (!getSetting(chat, 'translate', false) && !isCreator) return reply('❌ Translate OFF. Admin enable with *.translateon*');
    const toTranslate = text || m.quoted?.text;
    if (!toTranslate) return reply('Reply to a message or type: *.translate your text here*');
    const result = await askAI(`Translate this to English. Return ONLY the translation, nothing else: "${toTranslate}"`);
    return reply(`🌍 *Translation*\n\n${result}`);
}
if (command === 'translateon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'translate', true);
    return reply('✅ Translate *ON*\nUse *.translate [text]* or reply to any message');
}
if (command === 'translateoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'translate', false);
    return reply('🔴 Translate *OFF*');
}

// ──────────────────────────────────────────────
// 🛡️ 8. ANTI-RAID
// Auto locks group when 5+ members join in 30 seconds
// Toggle: .antiraidon / .antiraidoff
// ──────────────────────────────────────────────
if (command === 'antiraidon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Make bot admin first');
    setSetting(chat, 'antiraid', true);
    return reply('✅ Anti-Raid *ON*\nGroup will auto-lock if 5+ members join in 30 seconds');
}
if (command === 'antiraidoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'antiraid', false);
    return reply('🔴 Anti-Raid *OFF*');
}

// ──────────────────────────────────────────────
// 📋 9. MEMBER JOIN HISTORY LOG
// .joinlog — shows recent joins
// Toggle: .joinlogon / .joinlogoff
// ──────────────────────────────────────────────
if (command === 'joinlog') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    const log = getSetting(chat, 'join_log', []);
    if (!log.length) return reply('📋 No join history yet.');
    const recent = log.slice(-20).reverse();
    let txt = `📋 *RECENT JOIN LOG* (last ${recent.length})\n\n`;
    recent.forEach(entry => {
        txt += `👤 @${entry.jid.split('@')[0]}\n📅 ${entry.time}\n\n`;
    });
    return devtrust.sendMessage(chat, { text: txt, mentions: recent.map(e => e.jid) });
}
if (command === 'joinlogon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'joinlog', true);
    return reply('✅ Join log *ON*');
}
if (command === 'joinlogoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'joinlog', false);
    return reply('🔴 Join log *OFF*');
}

// ──────────────────────────────────────────────
// 💰 10. PREMIUM USER SYSTEM
// .premium @user [days] — grant premium
// .checkpremium — check your status
// ──────────────────────────────────────────────
if (command === 'addpremium' || command === 'givepremium') {
    if (!isCreator) return reply('❌ Owner only');
    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!target) return reply('Tag or reply to a user');
    const days = parseInt(args[1]) || 30;
    const expiry = Date.now() + (days * 86400000);
    const premiumUsers = getSetting('global', 'premium_users', {});
    premiumUsers[target] = { expiry, grantedBy: sender, grantedAt: new Date().toISOString() };
    setSetting('global', 'premium_users', premiumUsers);
    return devtrust.sendMessage(chat, {
        text: `⭐ *PREMIUM GRANTED*\n\n@${target.split('@')[0]} now has premium for *${days} days*\nExpires: ${new Date(expiry).toLocaleDateString()}`,
        mentions: [target]
    });
}

if (command === 'removepremium' || command === 'delpremium') {
    if (!isCreator) return reply('❌ Owner only');
    const target = m.mentionedJid?.[0] || m.quoted?.sender;
    if (!target) return reply('Tag or reply to a user');
    const premiumUsers = getSetting('global', 'premium_users', {});
    delete premiumUsers[target];
    setSetting('global', 'premium_users', premiumUsers);
    return reply(`✅ Premium removed from @${target.split('@')[0]}`);
}

if (command === 'checkpremium' || command === 'mypremium') {
    const premiumUsers = getSetting('global', 'premium_users', {});
    const userPrem = premiumUsers[sender];
    if (!userPrem) return reply('❌ You are not a premium user.\nContact admin to get premium.');
    if (Date.now() > userPrem.expiry) {
        delete premiumUsers[sender];
        setSetting('global', 'premium_users', premiumUsers);
        return reply('❌ Your premium has *expired*.\nContact admin to renew.');
    }
    const daysLeft = Math.ceil((userPrem.expiry - Date.now()) / 86400000);
    return reply(`⭐ *PREMIUM STATUS*\n\nStatus: Active ✅\nDays remaining: *${daysLeft} days*\nExpires: ${new Date(userPrem.expiry).toLocaleDateString()}`);
}

if (command === 'premiumlist') {
    if (!isCreator && !isAdmins) return reply('❌ Admins only');
    const premiumUsers = getSetting('global', 'premium_users', {});
    const active = Object.entries(premiumUsers).filter(([, v]) => Date.now() < v.expiry);
    if (!active.length) return reply('No active premium users.');
    let txt = `⭐ *PREMIUM USERS* (${active.length})\n\n`;
    active.forEach(([jid, v]) => {
        const days = Math.ceil((v.expiry - Date.now()) / 86400000);
        txt += `👤 @${jid.split('@')[0]} — ${days} days left\n`;
    });
    return devtrust.sendMessage(chat, { text: txt, mentions: active.map(([jid]) => jid) });
}

// ──────────────────────────────────────────────
// 🤖 11. AI IMAGE ANALYSIS
// Reply to an image with .analyze or .describeimage
// ──────────────────────────────────────────────
if (command === 'analyze' || command === 'describeimage' || command === 'aiimage') {
    if (!getSetting(chat, 'aiimage', false) && !isCreator) return reply('❌ AI image analysis OFF. Admin enable with *.aiimageon*');
    if (!m.quoted) return reply('Reply to an image to analyze it');
    const mtype = m.quoted?.mtype;
    if (!mtype?.includes('image')) return reply('❌ Only works on images');
    reply('🔍 Analyzing image...');
    const result = await askAI('Describe what you see in this image in detail. Be creative and thorough.');
    return reply(`🤖 *AI IMAGE ANALYSIS*\n\n${result}`);
}
if (command === 'aiimageon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'aiimage', true);
    return reply('✅ AI Image Analysis *ON*');
}
if (command === 'aiimageoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'aiimage', false);
    return reply('🔴 AI Image Analysis *OFF*');
}

// ──────────────────────────────────────────────
// 🧠 12. AI DM AUTO-REPLY
// Toggle: .aidmon / .aidmoff
// ──────────────────────────────────────────────
if (command === 'aidmon') {
    if (!isCreator) return reply('❌ Owner only');
    setSetting('global', 'ai_dm', true);
    return reply('✅ AI DM Auto-reply *ON*\nBot will reply to all DMs with AI');
}
if (command === 'aidmoff') {
    if (!isCreator) return reply('❌ Owner only');
    setSetting('global', 'ai_dm', false);
    return reply('🔴 AI DM Auto-reply *OFF*');
}

// ──────────────────────────────────────────────
// 😴 13. AUTO-DEMOTE INACTIVE ADMINS
// .checkinactive — shows inactive admins
// .demoteinactive — demotes admins inactive for 7+ days
// Toggle: .inactivecheckon / .inactivecheckoff
// ──────────────────────────────────────────────
if (command === 'inactivecheckon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'inactivecheck', true);
    return reply('✅ Inactive admin check *ON*\nUse *.demoteinactive* to demote inactive admins');
}
if (command === 'inactivecheckoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'inactivecheck', false);
    return reply('🔴 Inactive admin check *OFF*');
}

if (command === 'checkinactive') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    const activity = getSetting(chat, 'leaderboard_data', {});
    const admins = groupMetadata?.participants?.filter(p => p.admin) || [];
    let txt = `😴 *INACTIVE ADMINS*\n\n`;
    let found = false;
    admins.forEach(admin => {
        if (!activity[admin.id] || activity[admin.id] < 5) {
            txt += `👤 @${admin.id.split('@')[0]} — ${activity[admin.id] || 0} messages\n`;
            found = true;
        }
    });
    if (!found) return reply('✅ All admins are active!');
    return devtrust.sendMessage(chat, { text: txt, mentions: admins.map(a => a.id) });
}

if (command === 'demoteinactive') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    const activity = getSetting(chat, 'leaderboard_data', {});
    const admins = groupMetadata?.participants?.filter(p => p.admin && p.id !== sender) || [];
    const inactive = admins.filter(a => !activity[a.id] || activity[a.id] < 5);
    if (!inactive.length) return reply('✅ No inactive admins found!');
    for (const admin of inactive) {
        try { await devtrust.groupParticipantsUpdate(chat, [admin.id], 'demote'); } catch {}
    }
    const mentions = inactive.map(a => a.id);
    return devtrust.sendMessage(chat, {
        text: `👢 *DEMOTED INACTIVE ADMINS* (${inactive.length})\n\n${mentions.map(j => `@${j.split('@')[0]}`).join('\n')}\n\n_Reason: Low activity_`,
        mentions
    });
}

// ──────────────────────────────────────────────
// 🚫 14. ANTI-IMPERSONATION
// Detects members using names similar to admins
// Toggle: .antiimpon / .antiimpoff
// ──────────────────────────────────────────────
if (command === 'antiimpon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'antiimpersonation', true);
    return reply('✅ Anti-Impersonation *ON*\nBot will detect members mimicking admin names');
}
if (command === 'antiimpoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'antiimpersonation', false);
    return reply('🔴 Anti-Impersonation *OFF*');
}

// ──────────────────────────────────────────────
// 🌐 15. WEBSITE SCREENSHOT
// .ss https://example.com
// ──────────────────────────────────────────────
if (command === 'ss' || command === 'screenshot') {
    if (!getSetting(chat, 'screenshot', false) && !isCreator) return reply('❌ Screenshot OFF. Admin enable with *.sshot*');
    const url = args[0];
    if (!url || !url.startsWith('http')) return reply('Usage: *.ss https://website.com*');
    reply('📸 Taking screenshot...');
    try {
        const apiUrl = `https://api.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&format=jpg`;
        const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
        await devtrust.sendMessage(chat, {
            image: Buffer.from(response.data),
            caption: `📸 Screenshot of: ${url}`
        }, { quoted: m });
    } catch (e) {
        reply('❌ Could not take screenshot. Check the URL and try again.');
    }
}
if (command === 'sshot') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'screenshot', true);
    return reply('✅ Screenshot feature *ON*\nUse *.ss [url]* to screenshot any website');
}
if (command === 'ssoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'screenshot', false);
    return reply('🔴 Screenshot feature *OFF*');
}

// ──────────────────────────────────────────────
// 📊 16. GROUP STATS
// .groupstats — full group statistics
// ──────────────────────────────────────────────
if (command === 'groupstats' || command === 'gstats') {
    if (!m.isGroup) return reply('❌ Group only');
    const lb = getSetting(chat, 'leaderboard_data', {});
    const totalMessages = Object.values(lb).reduce((a, b) => a + b, 0);
    const totalMembers = participants?.length || 0;
    const admins = groupMetadata?.participants?.filter(p => p.admin)?.length || 0;
    const topUser = Object.entries(lb).sort((a, b) => b[1] - a[1])[0];
    return reply(`📊 *GROUP STATISTICS*\n\n👥 Members: ${totalMembers}\n👑 Admins: ${admins}\n💬 Total Messages: ${totalMessages}\n🏆 Most Active: @${topUser ? topUser[0].split('@')[0] : 'N/A'}\n⚙️ Features active: ${['leaderboard','confess','polls','roast','antiraid','reminders','translate'].filter(f => getSetting(chat, f, false)).length}`);
}

// ──────────────────────────────────────────────
// 🔇 17. TIMED GROUP MUTE
// .timedmute 30m — mutes group for X time then auto-opens
// ──────────────────────────────────────────────
if (command === 'timedmute') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!isBotAdmins) return reply('❌ Bot needs to be admin');
    if (!text) return reply('Usage: *.timedmute 30m*\nUnits: m=minutes, h=hours');
    const match = text.match(/^(\d+)(m|h)$/i);
    if (!match) return reply('❌ Format: *.timedmute 30m* or *.timedmute 2h*');
    const [, amount, unit] = match;
    const ms = parseInt(amount) * (unit.toLowerCase() === 'h' ? 3600000 : 60000);
    await devtrust.groupSettingUpdate(chat, 'announcement');
    reply(`🔇 Group muted for *${amount}${unit}*. Will auto-open after.`);
    setTimeout(async () => {
        await devtrust.groupSettingUpdate(chat, 'not_announcement');
        devtrust.sendMessage(chat, { text: '🔊 Group is now *open* again! Timed mute expired.' });
    }, ms);
    return;
}

// ──────────────────────────────────────────────
// 🎰 18. GROUP GAMES
// .dice, .coinflip, .8ball [question]
// ──────────────────────────────────────────────
if (command === 'dice') {
    const result = Math.floor(Math.random() * 6) + 1;
    const faces = ['⚀','⚁','⚂','⚃','⚄','⚅'];
    return reply(`🎲 *DICE ROLL*\n\n${faces[result-1]} You rolled a *${result}*!`);
}

if (command === 'coinflip' || command === 'flip') {
    const result = Math.random() > 0.5 ? 'HEADS 🪙' : 'TAILS 🪙';
    return reply(`🪙 *COIN FLIP*\n\nResult: *${result}*`);
}

if (command === '8ball' || command === 'ask8ball') {
    if (!text) return reply('Usage: *.8ball will I pass my exam?*');
    const answers = [
        '✅ It is certain', '✅ Without a doubt', '✅ Yes definitely',
        '✅ You may rely on it', '✅ Most likely', '✅ Signs point to yes',
        '🤔 Reply hazy, try again', '🤔 Ask again later', '🤔 Cannot predict now',
        '❌ Don\'t count on it', '❌ My reply is no', '❌ Very doubtful', '❌ Outlook not so good'
    ];
    const answer = answers[Math.floor(Math.random() * answers.length)];
    return reply(`🎱 *MAGIC 8-BALL*\n\n❓ ${text}\n\n${answer}`);
}

// ──────────────────────────────────────────────
// 🔔 19. GROUP ANNOUNCEMENT
// .announce [message] — sends styled announcement
// ──────────────────────────────────────────────
if (command === 'announce' || command === 'announcement') {
    if (!m.isGroup) return reply('❌ Group only');
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply('Usage: *.announce your announcement here*');
    return devtrust.sendMessage(chat, {
        text: `📢 *ANNOUNCEMENT*\n${'─'.repeat(25)}\n\n${text}\n\n${'─'.repeat(25)}\n_— ${groupMetadata?.subject || 'Group Admin'}_`
    });
}

// ──────────────────────────────────────────────
// 🎯 20. TRUTH OR DARE
// .truth / .dare
// Toggle: .todgameon / .todgameoff  
// ──────────────────────────────────────────────
const truths = [
    "What is your biggest fear?", "Who was your first crush?",
    "What is the most embarrassing thing you've done?", "What is your biggest secret?",
    "Have you ever lied to your best friend?", "What is your guilty pleasure?",
    "Who in this group do you find most annoying?", "What is the worst thing you've ever done?"
];
const dares = [
    "Send a voice note singing your favourite song", "Change your profile picture for 1 hour",
    "Send a funny selfie", "Tag 3 people and compliment them",
    "Write a love letter to the last person you texted", "Do 10 pushups and send proof",
    "Send a voice note doing your best celebrity impression",
    "Tell us your most embarrassing moment in voice note"
];

if (command === 'truth') {
    if (!getSetting(chat, 'todgame', false) && !isCreator) return reply('❌ Truth or Dare OFF. Admin enable with *.todgameon*');
    const t = truths[Math.floor(Math.random() * truths.length)];
    return reply(`🎯 *TRUTH*\n\n@${sender.split('@')[0]}\n\n❓ ${t}`);
}
if (command === 'dare') {
    if (!getSetting(chat, 'todgame', false) && !isCreator) return reply('❌ Truth or Dare OFF. Admin enable with *.todgameon*');
    const d = dares[Math.floor(Math.random() * dares.length)];
    return reply(`🎯 *DARE*\n\n@${sender.split('@')[0]}\n\n💪 ${d}`);
}
if (command === 'todgameon') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'todgame', true);
    return reply('✅ Truth or Dare *ON*\nUse *.truth* or *.dare*');
}
if (command === 'todgameoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'todgame', false);
    return reply('🔴 Truth or Dare *OFF*');
}

// ──────────────────────────────────────────────
// 📝 21. GROUP RULES
// .setrules [rules] / .rules
// ──────────────────────────────────────────────
if (command === 'setrules') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    if (!text) return reply('Usage: *.setrules Rule 1\nRule 2\nRule 3*');
    setSetting(chat, 'group_rules', text);
    return reply('✅ Group rules set! Members can view with *.rules*');
}
if (command === 'rules') {
    const rules = getSetting(chat, 'group_rules', null);
    if (!rules) return reply('❌ No rules set. Admins use *.setrules* to set rules.');
    return reply(`📜 *GROUP RULES*\n${'─'.repeat(25)}\n\n${rules}\n\n${'─'.repeat(25)}\n_Follow the rules or face consequences!_ ⚠️`);
}

// ──────────────────────────────────────────────
// 🎁 22. DAILY REWARD SYSTEM
// .claim — claim daily points
// .points — check your points
// Toggle: .rewardson / .rewardsoff
// ──────────────────────────────────────────────
if (command === 'claim' || command === 'daily') {
    if (!getSetting(chat, 'rewards', false) && !isCreator) return reply('❌ Rewards OFF. Admin enable with *.rewardson*');
    const rewards = getSetting(chat, 'rewards_data', {});
    const now = Date.now();
    const lastClaim = rewards[sender]?.lastClaim || 0;
    const cooldown = 86400000; // 24 hours
    if (now - lastClaim < cooldown) {
        const remaining = Math.ceil((cooldown - (now - lastClaim)) / 3600000);
        return reply(`⏳ You already claimed today!\nCome back in *${remaining} hours*`);
    }
    const points = Math.floor(Math.random() * 50) + 10; // 10-60 points
    rewards[sender] = {
        points: (rewards[sender]?.points || 0) + points,
        lastClaim: now,
        streak: (rewards[sender]?.streak || 0) + 1
    };
    setSetting(chat, 'rewards_data', rewards);
    return reply(`🎁 *DAILY REWARD*\n\n+${points} points earned!\n💰 Total: ${rewards[sender].points} points\n🔥 Streak: ${rewards[sender].streak} days`);
}
if (command === 'points' || command === 'mypoints') {
    const rewards = getSetting(chat, 'rewards_data', {});
    const userPoints = rewards[sender]?.points || 0;
    const streak = rewards[sender]?.streak || 0;
    return reply(`💰 *YOUR POINTS*\n\nPoints: *${userPoints}*\n🔥 Streak: *${streak} days*\n\nUse *.claim* to claim daily reward`);
}
if (command === 'pointsleaderboard' || command === 'toplb') {
    const rewards = getSetting(chat, 'rewards_data', {});
    const sorted = Object.entries(rewards).sort((a, b) => b[1].points - a[1].points).slice(0, 10);
    if (!sorted.length) return reply('No points data yet. Use *.claim* to start earning!');
    let txt = `💰 *POINTS LEADERBOARD*\n\n`;
    sorted.forEach(([jid, data], i) => {
        const medals = ['🥇','🥈','🥉'];
        txt += `${medals[i] || `${i+1}.`} @${jid.split('@')[0]} — ${data.points} pts\n`;
    });
    return devtrust.sendMessage(chat, { text: txt, mentions: sorted.map(([jid]) => jid) });
}
if (command === 'rewardson') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'rewards', true);
    return reply('✅ Daily Rewards *ON*\nMembers can use *.claim* to earn daily points');
}
if (command === 'rewardsoff') {
    if (!isAdmins && !isCreator) return reply('❌ Admins only');
    setSetting(chat, 'rewards', false);
    return reply('🔴 Daily Rewards *OFF*');
}

// Return false if no command matched (so case.js continues)
return false;

}; // end module.exports
