const FtCard = require("../../models/fintech/ft_card.model");

/**
 * @route  GET /api/ft/cards
 * @access Private
 */
exports.getCards = async (req, res) => {
    try {
        const cards = await FtCard.find({ userId: req.ftUser._id, isActive: true }).sort({ isDefault: -1, createdAt: -1 });
        return res.status(200).json({ success: true, cards });
    } catch (err) {
        console.error("[FT Card] GetCards error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/cards
 * @access Private
 * Add a new card (store tokenized, never raw number)
 */
exports.addCard = async (req, res) => {
    try {
        const { cardToken, cardHolderName, lastFourDigits, expiryMonth, expiryYear, cardType, variant, bankName, color } =
            req.body;

        if (!cardToken || !cardHolderName || !lastFourDigits || !expiryMonth || !expiryYear || !cardType || !variant) {
            return res.status(400).json({ success: false, message: "All card fields are required" });
        }

        if (!/^\d{4}$/.test(lastFourDigits)) {
            return res.status(400).json({ success: false, message: "lastFourDigits must be exactly 4 digits" });
        }

        // Check duplicate
        const exists = await FtCard.findOne({ userId: req.ftUser._id, cardToken });
        if (exists) {
            return res.status(409).json({ success: false, message: "This card is already added" });
        }

        // If first card, make it default
        const cardCount = await FtCard.countDocuments({ userId: req.ftUser._id, isActive: true });

        const card = await FtCard.create({
            userId: req.ftUser._id,
            cardToken,
            cardHolderName,
            lastFourDigits,
            expiryMonth,
            expiryYear,
            cardType,
            variant,
            bankName,
            color,
            isDefault: cardCount === 0,
        });

        return res.status(201).json({ success: true, message: "Card added successfully", card });
    } catch (err) {
        console.error("[FT Card] AddCard error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  DELETE /api/ft/cards/:id
 * @access Private
 */
exports.deleteCard = async (req, res) => {
    try {
        const card = await FtCard.findOne({ _id: req.params.id, userId: req.ftUser._id });
        if (!card) return res.status(404).json({ success: false, message: "Card not found" });

        card.isActive = false;
        await card.save();

        // If deleted card was default, make the next available card default
        if (card.isDefault) {
            const nextCard = await FtCard.findOne({ userId: req.ftUser._id, isActive: true });
            if (nextCard) {
                nextCard.isDefault = true;
                await nextCard.save();
            }
        }

        return res.status(200).json({ success: true, message: "Card removed" });
    } catch (err) {
        console.error("[FT Card] DeleteCard error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/cards/:id/set-default
 * @access Private
 */
exports.setDefaultCard = async (req, res) => {
    try {
        const card = await FtCard.findOne({ _id: req.params.id, userId: req.ftUser._id, isActive: true });
        if (!card) return res.status(404).json({ success: false, message: "Card not found" });

        // Remove default from all other cards
        await FtCard.updateMany({ userId: req.ftUser._id }, { isDefault: false });

        card.isDefault = true;
        await card.save();

        return res.status(200).json({ success: true, message: "Default card updated" });
    } catch (err) {
        console.error("[FT Card] SetDefault error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
