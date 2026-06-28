const axios = require('axios');
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'database/matchalerts.json');
const API_KEY = 'f94d1088bb6e45c889d60d7c50cd66df';
// ─── DB HELPERS ───────────────────────────────────────────
function loadDB() {
    if (!fs.existsSync(DB_PATH)) {
        fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
        fs.writeFileSync(DB_PATH, JSON.stringify({ registrations: {}, sentAlerts: {} }, null, 2));
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));
}

function saveDB(data) {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ─── FETCH TODAY'S MATCHES (TheSportsDB - free, no key) ───
async function fetchTodayMatches() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    try {
        const res = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/3/eventsday.php?d=${today}&s=Soccer`,
            { timeout: 10000 }
        );
        const events = res.data?.events || [];
        return events.map((e, i) => ({
            index: i + 1,
            id: e.idEvent,
            home: e.strHomeTeam,
            away: e.strAwayTeam,
            league: e.strLeague,
            time: e.strTime ? e.strTime.slice(0, 5) : 'TBD',
            date: e.dateEvent,
            status: e.strStatus || 'NS', // NS=Not Started, 1H, HT, 2H, FT
            homeScore: e.intHomeScore,
            awayScore: e.intAwayScore,
            venue: e.strVenue || '',
            eventThumb: e.strThumb || ''
        }));
    } catch (err) {
        console.error('[FootballAlerts] fetchTodayMatches error:', err.message);
        return [];
    }
}

// ─── FETCH LIVE MATCH BY ID ────────────────────────────────
async function fetchMatchById(matchId) {
    try {
        const res = await axios.get(
            `https://www.thesportsdb.com/api/v1/json/3/lookupevent.php?id=${matchId}`,
            { timeout: 10000 }
        );
        const e = res.data?.events?.[0];
        if (!e) return null;
        return {
            id: e.idEvent,
            home: e.strHomeTeam,
            away: e.strAwayTeam,
            league: e.strLeague,
            time: e.strTime ? e.strTime.slice(0, 5) : 'TBD',
            date: e.dateEvent,
            status: e.strStatus || 'NS',
            homeScore: e.intHomeScore,
            awayScore: e.intAwayScore,
            venue: e.strVenue || '',
            minute: e.intRound || ''
        };
    } catch (err) {
        console.error('[FootballAlerts] fetchMatchById error:', err.message);
        return null;
    }
}

// ─── FORMAT MATCH LIST ─────────────────────────────────────
function formatMatchList(matches) {
    if (!matches.length) return '❌ *No football matches found for today!*';

    let text = `╭─⚽ *TODAY'S FOOTBALL MATCHES*\n`;
    text += `│ 📅 ${new Date().toDateString()}\n│\n`;

    matches.forEach(m => {
        text += `│ *${m.index}.* ${m.home} 🆚 ${m.away}\n`;
        text += `│    🏆 ${m.league}\n`;
        text += `│    🕐 ${m.time} UTC\n`;
        if (m.venue) text += `│    🏟️ ${m.venue}\n`;
        text += `│\n`;
    });

    text += `╰─ Use *.register match <number>* to follow a match!\n`;
    text += `> Example: *.register match 3*`;
    return text;
}

// ─── REGISTER USER FOR MATCH ───────────────────────────────
function registerUser(sender, matchIndex, matches) {
    const match = matches.find(m => m.index === matchIndex);
    if (!match) return { success: false, msg: `❌ Match number *${matchIndex}* not found. Use *.list todaymatch* first.` };

    const db = loadDB();
    if (!db.registrations[match.id]) db.registrations[match.id] = { match, users: [] };

    // Update match info (in case it changed)
    db.registrations[match.id].match = match;

    if (!db.registrations[match.id].users.includes(sender)) {
        db.registrations[match.id].users.push(sender);
    }

    saveDB(db);

    return {
        success: true,
        msg: `✅ *You're now following this match!*\n\n` +
             `⚽ *${match.home}* 🆚 *${match.away}*\n` +
             `🏆 ${match.league}\n` +
             `🕐 Kickoff: ${match.time} UTC\n\n` +
             `I go ping you for DM when:\n` +
             `🟢 Match starts\n` +
             `⚽ Goal scored\n` +
             `🟨 Important card\n` +
             `⏱️ Half time\n` +
             `🏁 Full time\n\n` +
             `> Use *.unregister match ${matchIndex}* to stop alerts`
    };
}

// ─── UNREGISTER USER ──────────────────────────────────────
function unregisterUser(sender, matchIndex, matches) {
    const match = matches ? matches.find(m => m.index === matchIndex) : null;
    const db = loadDB();

    let removed = false;
    for (const matchId in db.registrations) {
        const reg = db.registrations[matchId];
        const idx = reg.users.indexOf(sender);
        if (idx !== -1 && (!match || matchId === match.id)) {
            reg.users.splice(idx, 1);
            removed = true;
            if (reg.users.length === 0) delete db.registrations[matchId];
            break;
        }
    }

    saveDB(db);
    return removed
        ? `✅ *You've been unregistered from the match alerts!*`
        : `❌ You're not registered for that match.`;
}

// ─── CHECK WHICH ALERTS TO SEND ───────────────────────────
function getAlertMessage(match, sentAlerts) {
    const alerts = [];
    const sid = match.id;
    if (!sentAlerts[sid]) sentAlerts[sid] = {};

    const s = match.status;
    const home = match.home;
    const away = match.away;
    const hs = match.homeScore ?? '-';
    const as = match.awayScore ?? '-';

    // Match started
    if ((s === '1H' || s === 'LIVE') && !sentAlerts[sid].started) {
        sentAlerts[sid].started = true;
        alerts.push(`🟢 *MATCH STARTED!*\n\n⚽ *${home}* 🆚 *${away}*\n🏆 ${match.league}\n\n> The game is on! 🔥`);
    }

    // Half time
    if (s === 'HT' && !sentAlerts[sid].ht) {
        sentAlerts[sid].ht = true;
        alerts.push(`⏱️ *HALF TIME!*\n\n⚽ *${home}* ${hs} - ${as} *${away}*\n🏆 ${match.league}\n\n> Players dey go rest...`);
    }

    // Score change (goal)
    const scoreKey = `${hs}-${as}`;
    if (hs !== '-' && as !== '-' && (s === '1H' || s === '2H' || s === 'LIVE')) {
        if (sentAlerts[sid].lastScore && sentAlerts[sid].lastScore !== scoreKey) {
            alerts.push(`⚽ *GOOOAAL!*\n\n*${home}* ${hs} - ${as} *${away}*\n🏆 ${match.league}\n\n> The net dey shake! 🔥`);
        }
        sentAlerts[sid].lastScore = scoreKey;
    }

    // Full time
    if (s === 'FT' && !sentAlerts[sid].ft) {
        sentAlerts[sid].ft = true;
        alerts.push(`🏁 *FULL TIME!*\n\n⚽ *${home}* ${hs} - ${as} *${away}*\n🏆 ${match.league}\n\n> Game don end! Final score above ⬆️`);
    }

    return { alerts, sentAlerts };
}

// ─── MAIN POLLING LOOP ────────────────────────────────────
async function startAlertLoop(devtrust) {
    console.log('[FootballAlerts] ✅ Alert loop started');

    setInterval(async () => {
        try {
            const db = loadDB();
            if (!Object.keys(db.registrations).length) return;

            for (const matchId in db.registrations) {
                const reg = db.registrations[matchId];
                if (!reg.users.length) continue;

                const match = await fetchMatchById(matchId);
                if (!match) continue;

                // Update stored match info
                db.registrations[matchId].match = match;

                const { alerts, sentAlerts } = getAlertMessage(match, db.sentAlerts);
                db.sentAlerts = sentAlerts;

                if (alerts.length) {
                    for (const user of reg.users) {
                        for (const alertMsg of alerts) {
                            try {
                                await devtrust.sendMessage(user, { text: alertMsg });
                                await new Promise(r => setTimeout(r, 500)); // small delay
                            } catch (e) {
                                console.error('[FootballAlerts] Send error:', e.message);
                            }
                        }
                    }
                }

                // Clean up finished matches after 1 hour
                if (match.status === 'FT') {
                    const finishedAt = db.sentAlerts[matchId]?.finishedAt;
                    if (!finishedAt) {
                        db.sentAlerts[matchId].finishedAt = Date.now();
                    } else if (Date.now() - finishedAt > 3600000) {
                        delete db.registrations[matchId];
                        delete db.sentAlerts[matchId];
                    }
                }
            }

            saveDB(db);
        } catch (err) {
            console.error('[FootballAlerts] Loop error:', err.message);
        }
    }, 60000); // Check every 60 seconds
}

module.exports = {
    fetchTodayMatches,
    fetchMatchById,
    formatMatchList,
    registerUser,
    unregisterUser,
    startAlertLoop
};
