const express = require("express");
const router = express.Router();
const {
    getCards,
    addCard,
    deleteCard,
    setDefaultCard,
} = require("../../controllers/fintech/ft_card.controller");
const { ftProtect } = require("../../middleware/fintech/ft_auth.middleware");

router.use(ftProtect);

// GET  /api/ft/cards
router.get("/", getCards);

// POST /api/ft/cards
router.post("/", addCard);

// DELETE /api/ft/cards/:id
router.delete("/:id", deleteCard);

// PATCH /api/ft/cards/:id/set-default
router.patch("/:id/set-default", setDefaultCard);

module.exports = router;
