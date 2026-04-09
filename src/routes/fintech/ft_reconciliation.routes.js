const express = require("express");
const router  = express.Router();

const {
    getReconciliations,
    batchMatch,
    resolveSingle,
} = require("../../controllers/fintech/ft_reconciliation.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

// All routes require authentication
router.use(ftProtect);

/**
 * GET /api/ft/reconciliation?status=unmatched
 */
router.get("/", getReconciliations);

/**
 * POST /api/ft/reconciliation/match-batch
 */
router.post("/match-batch", batchMatch);

/**
 * PUT /api/ft/reconciliation/:id/resolve
 */
router.put("/:id/resolve", resolveSingle);

module.exports = router;
