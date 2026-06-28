// ============================================================
// FOOTBALL ANNOUNCEMENT COMMAND
// .announce or .football or .giveaway
// ============================================================

module.exports = async (devtrust, m, { command, reply, isAdmins, isCreator, text, prefix }) => {

const footballMessage = `
╭─❏ ⚽ 𝘓𝘌𝘎𝘌𝘕𝘋𝘈𝘙𝘈𝘠 𝘐𝘚 𝘉𝘈𝘊𝘒 𝘖𝘕 𝘛𝘏𝘌 𝘗𝘐𝘛𝘊𝘏 ⚽ ❏
│
│ 🏟️ *𝗟𝗘𝗚𝗘𝗡𝗗𝗔𝗥𝗬 𝗕𝗢𝗧* – STARTING XI 
│ 👕 1500+ Commands in the Squad
│ 🔧 Auto-React Status Feature
│ ⚡ Faster • Smarter • More Stable
│ 🎮 Games • Economy • Leveling System
│
│ 📱 *PAIRING AVAILABLE*
│ 🔗 https://legendary-bot-pairing.vercel.app
│
│ 🧠 *LEGENDARY BOT FEATURES* 
│ ✅ 1000+ Commands
│ ✅ Auto-React Status (Random Emojis)
│ ✅ Economy System (Balance, Shop, Trade)
│ ✅ Leveling & Ranks
│ ✅ Games (Dice, RPS, Slots, Trivia)
│ ✅ Social Commands (Marry, Kiss, Hug)
│ ✅ Adventure Mode (Dungeon, Battle)
│ ✅ Pet System (Adopt, Train, Fight)
│ ✅ Fashion & Style
│ ✅ Food & Restaurants
│ ✅ Sports Tracking
│ ✅ Education & Learning
│ ✅ Creative Tools
│
│ 🌐 *LEGENDARY LAB™*
│ 🔗 https://legendary-ai-chi.vercel.app
│
│ 📢 Join Our Community
│ 🔗 Telegram: https://t.me/legendarylab
│
│ 🎯 *SPECIAL EVENT* 🎯
│ ⏰ LIVE: June 23 - July 10, 2026
│ 🏆 World Cup Special Edition
│ 🔥 Limited Time Features & Bonuses
│
│ 🔥 SPREAD THE WORD – Share Your Bot 
│ 
│ 👤 Get Paired: ${prefix}pair
│ 📋 View Commands: ${prefix}menu
│ ⚙️ Help: ${prefix}help
│
╰─〔 Powered by LËGĒNDÃRY ƁØT™ ⚡ 〕

> LËGĒNDÃRY CARES ♡ (Even After Extra Time) 🌚
`;

if (['announce', 'football', 'giveaway', 'promo', 'broadcast', 'news', 'legendary'].includes(command)) {
    return reply(footballMessage);
}

};
