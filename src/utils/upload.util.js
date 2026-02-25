const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure uploads/voice directory exists
const voiceUploadDir = path.join(__dirname, "../../uploads/voice");
if (!fs.existsSync(voiceUploadDir)) {
    fs.mkdirSync(voiceUploadDir, { recursive: true });
}

// ─── Voice Message Storage ───────────────────────────────────────────────────
const voiceStorage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, voiceUploadDir);
    },
    filename: (_req, file, cb) => {
        // e.g.  voice_1708867200000_482.m4a
        const ext = path.extname(file.originalname) || ".m4a";
        cb(null, `voice_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`);
    },
});

const audioFileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        "audio/mpeg",        // .mp3
        "audio/mp4",         // .m4a
        "audio/x-m4a",      // .m4a (alternate)
        "audio/aac",         // .aac
        "audio/wav",         // .wav
        "audio/webm",        // .webm
        "audio/ogg",         // .ogg
        "audio/3gpp",        // .3gp
        "audio/amr",         // .amr
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported audio format: ${file.mimetype}. Allowed: mp3, m4a, aac, wav, webm, ogg`), false);
    }
};

const uploadVoice = multer({
    storage: voiceStorage,
    fileFilter: audioFileFilter,
    limits: {
        fileSize: 25 * 1024 * 1024, // 25 MB max
    },
});

module.exports = { uploadVoice };
