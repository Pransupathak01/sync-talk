const FtBeneficiary = require("../../models/fintech/ft_beneficiary.model");

/**
 * @route  GET /api/ft/beneficiaries
 * @access Private
 */
exports.getBeneficiaries = async (req, res) => {
    try {
        const { type, favorite } = req.query;
        const filter = { userId: req.ftUser._id };

        if (type) filter.type = type;
        if (favorite === "true") filter.isFavorite = true;

        const beneficiaries = await FtBeneficiary.find(filter).sort({ isFavorite: -1, createdAt: -1 });
        return res.status(200).json({ success: true, beneficiaries });
    } catch (err) {
        console.error("[FT Beneficiary] GetAll error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/beneficiaries
 * @access Private
 */
exports.addBeneficiary = async (req, res) => {
    try {
        const { name, type, accountNumber, ifscCode, bankName, upiId, phone } = req.body;

        if (!name || !type) {
            return res.status(400).json({ success: false, message: "Name and type are required" });
        }

        if (type === "bank" && (!accountNumber || !ifscCode)) {
            return res.status(400).json({ success: false, message: "Account number and IFSC are required for bank type" });
        }

        if (type === "upi" && !upiId) {
            return res.status(400).json({ success: false, message: "UPI ID is required for UPI type" });
        }

        if (type === "wallet" && !phone) {
            return res.status(400).json({ success: false, message: "Phone is required for wallet type" });
        }

        const beneficiary = await FtBeneficiary.create({
            userId: req.ftUser._id,
            name,
            type,
            accountNumber,
            ifscCode,
            bankName,
            upiId,
            phone,
        });

        return res.status(201).json({ success: true, message: "Beneficiary added", beneficiary });
    } catch (err) {
        console.error("[FT Beneficiary] Add error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/beneficiaries/:id
 * @access Private
 */
exports.updateBeneficiary = async (req, res) => {
    try {
        const beneficiary = await FtBeneficiary.findOne({ _id: req.params.id, userId: req.ftUser._id });
        if (!beneficiary) return res.status(404).json({ success: false, message: "Beneficiary not found" });

        const allowedFields = ["name", "accountNumber", "ifscCode", "bankName", "upiId", "phone", "avatar"];
        allowedFields.forEach((field) => {
            if (req.body[field] !== undefined) beneficiary[field] = req.body[field];
        });

        await beneficiary.save();
        return res.status(200).json({ success: true, message: "Beneficiary updated", beneficiary });
    } catch (err) {
        console.error("[FT Beneficiary] Update error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  DELETE /api/ft/beneficiaries/:id
 * @access Private
 */
exports.deleteBeneficiary = async (req, res) => {
    try {
        const beneficiary = await FtBeneficiary.findOneAndDelete({ _id: req.params.id, userId: req.ftUser._id });
        if (!beneficiary) return res.status(404).json({ success: false, message: "Beneficiary not found" });

        return res.status(200).json({ success: true, message: "Beneficiary deleted" });
    } catch (err) {
        console.error("[FT Beneficiary] Delete error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/beneficiaries/:id/favorite
 * @access Private
 */
exports.toggleFavorite = async (req, res) => {
    try {
        const beneficiary = await FtBeneficiary.findOne({ _id: req.params.id, userId: req.ftUser._id });
        if (!beneficiary) return res.status(404).json({ success: false, message: "Beneficiary not found" });

        beneficiary.isFavorite = !beneficiary.isFavorite;
        await beneficiary.save();

        return res.status(200).json({
            success: true,
            message: `${beneficiary.isFavorite ? "Added to" : "Removed from"} favorites`,
            isFavorite: beneficiary.isFavorite,
        });
    } catch (err) {
        console.error("[FT Beneficiary] ToggleFavorite error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
