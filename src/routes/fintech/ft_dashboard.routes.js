const express = require("express");
const router  = express.Router();

const { getSummary, getRecentActivity } = require("../../controllers/fintech/ft_dashboard.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

// All routes require a valid FinTech JWT
router.use(ftProtect);

/**
 * GET /api/ft/dashboard/summary
 */
router.get("/summary", getSummary);

/**
 * GET /api/ft/dashboard/recent
 */
router.get("/recent", getRecentActivity);

module.exports = router;
