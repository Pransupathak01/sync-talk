const express = require("express");
const router = express.Router();
const { register, login, getMe } = require("../../controllers/fintech/ft_auth.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

// POST /api/ft/auth/register
router.post("/register", register);

// POST /api/ft/auth/login
router.post("/login", login);

// GET /api/ft/auth/me
router.get("/me", ftProtect, getMe);

module.exports = router;
