const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../config/cloudinary");

// ─── Cloudinary Storage for Voice Messages ───────────────────────────────────
// Files are uploaded directly to Cloudinary under the "synctalk/voice" folder.
// Cloudinary returns a secure HTTPS URL which is stored in MongoDB as voiceUrl.
const voiceStorage = new CloudinaryStorage({
    cloudinary,
    params: async (_req, file) => {
        // Use original extension if available, default to m4a
        const ext = file.originalname.split(".").pop() || "m4a";
        return {
            folder: "synctalk/voice",              // folder in your Cloudinary account
            resource_type: "video",                // Cloudinary uses "video" type for audio files
            public_id: `voice_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
            format: ext,                           // preserve original format
        };
    },
});

const audioFileFilter = (_req, file, cb) => {
    const allowedMimeTypes = [
        "audio/mpeg",        // .mp3
        "audio/mp4",         // .m4a
        "audio/m4a",         // .m4a (alternate)
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
