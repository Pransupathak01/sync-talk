const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { uploadVoice } = require("../utils/upload.util");
const {
    getRooms,
    getMessages,
    createRoom,
    getRoomDetails,
    getChatUsers,
    getReferralContacts,
    uploadVoiceMessage,
    deleteMessageForMe,
    deleteMessageForEveryone,
} = require("../controllers/chat.controller");

// All chat routes are protected
router.use(protect);

// Get referral contacts (default chat list)
router.get("/referral-contacts", getReferralContacts);

// Get all rooms for the logged-in user
router.get("/rooms", getRooms);

// Create a new room
router.post("/rooms", createRoom);

// Get room details
router.get("/rooms/:roomId", getRoomDetails);

// Get messages for a room (paginated)
router.get("/rooms/:roomId/messages", getMessages);

// Get available users to chat with
router.get("/users", getChatUsers);

// ─── Voice Message Upload ──────────────────────────────────────────────────
// POST /api/chat/upload/voice
// multipart/form-data: { audio: <file>, roomId: string, duration?: number }
// Returns the saved Message document. Frontend should then emit "broadcast_voice_message"
// over the socket so all room members receive it in real-time.
router.post(
    "/upload/voice",
    uploadVoice.single("audio"),
    uploadVoiceMessage
);
// ───────────────────────────────────────────────────────────────────────────

// ─── Message Delete Endpoints ──────────────────────────────────────────────
// DELETE /api/chat/messages/:messageId/delete-for-me
// Hides the message only for the requesting user (added to deletedFor[])
router.delete("/messages/:messageId/delete-for-me", deleteMessageForMe);

// DELETE /api/chat/messages/:messageId/delete-for-everyone
// Permanently deletes message content for all participants (sender only, ≤60 min)
// Also broadcasts socket event "message_deleted_for_everyone" to the room
router.delete("/messages/:messageId/delete-for-everyone", deleteMessageForEveryone);
// ───────────────────────────────────────────────────────────────────────────

module.exports = router;
