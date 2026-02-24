const express = require("express");
const { getUsers, getMe, getUserById, updateAddress } = require("../controllers/user.controller");
const { protect } = require("../middleware/auth.middleware");

const router = express.Router();

router.get("/", protect, getUsers);
router.get("/profile", protect, getMe);
router.put("/address", protect, updateAddress);
router.get("/:id", protect, getUserById);

module.exports = router;
