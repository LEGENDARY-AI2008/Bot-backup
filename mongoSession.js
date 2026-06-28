const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

const MONGODB_URI = process.env.MONGODB_URI;
const PAIRING_DIR = path.join(__dirname, 'nexstore', 'pairing');

// ─── MONGOOSE SCHEMA ──────────────────────────────────────
const sessionSchema = new mongoose.Schema({
    jid: { type: String, required: true, unique: true },
    files: { type: Map, of: String }, // filename → JSON string
    updatedAt: { type: Date, default: Date.now }
});

const Session = mongoose.models.Session || mongoose.model('Session', sessionSchema);

// ─── CONNECT TO MONGODB ───────────────────────────────────
let isConnected = false;
async function connectMongo() {
    if (isConnected) return;
    if (!MONGODB_URI) {
        console.log('⚠️ [MongoDB] No MONGODB_URI found, using local storage only');
        return;
    }
    try {
        await mongoose.connect(MONGODB_URI);
        isConnected = true;
        console.log('✅ [MongoDB] Connected successfully!');
    } catch (err) {
        console.error('❌ [MongoDB] Connection failed:', err.message);
    }
}

// ─── SAVE SESSION TO MONGODB ──────────────────────────────
async function saveSessionToMongo(jid) {
    if (!isConnected) return;
    try {
        const sessionPath = path.join(PAIRING_DIR, jid);
        const files = await fs.readdir(sessionPath);
        const fileMap = {};

        for (const file of files) {
            const filePath = path.join(sessionPath, file);
            const content = await fs.readFile(filePath, 'utf-8');
            fileMap[file] = content;
        }

        await Session.findOneAndUpdate(
            { jid },
            { jid, files: fileMap, updatedAt: new Date() },
            { upsert: true, new: true }
        );

        console.log(`✅ [MongoDB] Session saved for ${jid}`);
    } catch (err) {
        console.error(`❌ [MongoDB] Save session error for ${jid}:`, err.message);
    }
}

// ─── RESTORE ALL SESSIONS FROM MONGODB ───────────────────
async function restoreSessionsFromMongo() {
    if (!isConnected) return 0;
    try {
        const sessions = await Session.find({});
        if (!sessions.length) {
            console.log('ℹ️ [MongoDB] No sessions found in database');
            return 0;
        }

        // Ensure pairing directory exists
        await fs.mkdir(PAIRING_DIR, { recursive: true });

        let restored = 0;
        for (const session of sessions) {
            try {
                const sessionPath = path.join(PAIRING_DIR, session.jid);
                await fs.mkdir(sessionPath, { recursive: true });

                for (const [filename, content] of session.files) {
                    await fs.writeFile(path.join(sessionPath, filename), content, 'utf-8');
                }

                restored++;
                console.log(`✅ [MongoDB] Restored session: ${session.jid}`);
            } catch (err) {
                console.error(`❌ [MongoDB] Restore error for ${session.jid}:`, err.message);
            }
        }

        console.log(`🎉 [MongoDB] Restored ${restored}/${sessions.length} sessions!`);
        return restored;
    } catch (err) {
        console.error('❌ [MongoDB] Restore sessions error:', err.message);
        return 0;
    }
}

// ─── DELETE SESSION FROM MONGODB ──────────────────────────
async function deleteSessionFromMongo(jid) {
    if (!isConnected) return;
    try {
        await Session.deleteOne({ jid });
        console.log(`🗑️ [MongoDB] Deleted session: ${jid}`);
    } catch (err) {
        console.error(`❌ [MongoDB] Delete error for ${jid}:`, err.message);
    }
}

// ─── GET ALL SESSIONS FROM MONGODB ───────────────────────
async function getAllSessionJids() {
    if (!isConnected) return [];
    try {
        const sessions = await Session.find({}, 'jid');
        return sessions.map(s => s.jid);
    } catch (err) {
        console.error('❌ [MongoDB] Get all sessions error:', err.message);
        return [];
    }
}

module.exports = {
    connectMongo,
    saveSessionToMongo,
    restoreSessionsFromMongo,
    deleteSessionFromMongo,
    getAllSessionJids,
    isConnected: () => isConnected
};
