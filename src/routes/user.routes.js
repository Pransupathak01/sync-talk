const express = require("express");
const { getUsers, getMe, getUserById } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/profile", protect, getMe);
router.get("/:id", protect, getUserById);

module.exports = router;
