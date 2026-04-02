const FtKyc = require("../../models/fintech/ft_kyc.model");
const FtUser = require("../../models/fintech/ft_user.model");

/**
 * @route  GET /api/ft/kyc
 * @access Private
 */
exports.getKycStatus = async (req, res) => {
    try {
        const kyc = await FtKyc.findOne({ userId: req.ftUser._id });
        if (!kyc) {
            return res.status(200).json({ success: true, kyc: null, status: "not_submitted" });
        }
        return res.status(200).json({ success: true, kyc });
    } catch (err) {
        console.error("[FT KYC] GetStatus error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/kyc/submit
 * @access Private
 * Submit or update KYC documents
 */
exports.submitKyc = async (req, res) => {
    try {
        const { panNumber, aadhaarNumber, panDocUrl, aadhaarFrontUrl, aadhaarBackUrl, selfieUrl } = req.body;

        if (!panNumber || !aadhaarNumber || !panDocUrl || !aadhaarFrontUrl || !aadhaarBackUrl || !selfieUrl) {
            return res.status(400).json({ success: false, message: "All KYC documents are required" });
        }

        // Check if already approved
        const existingKyc = await FtKyc.findOne({ userId: req.ftUser._id });
        if (existingKyc && existingKyc.status === "approved") {
            return res.status(400).json({ success: false, message: "KYC is already approved" });
        }

        const kyc = await FtKyc.findOneAndUpdate(
            { userId: req.ftUser._id },
            {
                panNumber,
                aadhaarNumber,
                panDocUrl,
                aadhaarFrontUrl,
                aadhaarBackUrl,
                selfieUrl,
                status: "pending",
                rejectionReason: "",
            },
            { upsert: true, new: true }
        );

        // Sync status on user document
        await FtUser.findByIdAndUpdate(req.ftUser._id, { kycStatus: "pending" });

        return res.status(200).json({ success: true, message: "KYC submitted successfully. Under review.", kyc });
    } catch (err) {
        console.error("[FT KYC] Submit error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  GET /api/ft/kyc/admin/all (Admin only)
 * @access Admin
 */
exports.getAllKycRequests = async (req, res) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (status) filter.status = status;

        const [kycList, total] = await Promise.all([
            FtKyc.find(filter)
                .populate("userId", "fullName email phone")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit)),
            FtKyc.countDocuments(filter),
        ]);

        return res.status(200).json({ success: true, total, page: Number(page), kycList });
    } catch (err) {
        console.error("[FT KYC] Admin GetAll error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/kyc/admin/:userId/approve (Admin only)
 * @access Admin
 */
exports.approveKyc = async (req, res) => {
    try {
        const kyc = await FtKyc.findOne({ userId: req.params.userId });
        if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });

        kyc.status = "approved";
        kyc.rejectionReason = "";
        kyc.verifiedAt = new Date();
        kyc.verifiedBy = req.ftUser._id;
        await kyc.save();

        await FtUser.findByIdAndUpdate(req.params.userId, { kycStatus: "approved" });

        return res.status(200).json({ success: true, message: "KYC approved successfully" });
    } catch (err) {
        console.error("[FT KYC] Approve error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PATCH /api/ft/kyc/admin/:userId/reject (Admin only)
 * @access Admin
 */
exports.rejectKyc = async (req, res) => {
    try {
        const { reason } = req.body;
        if (!reason) return res.status(400).json({ success: false, message: "Rejection reason is required" });

        const kyc = await FtKyc.findOne({ userId: req.params.userId });
        if (!kyc) return res.status(404).json({ success: false, message: "KYC not found" });

        kyc.status = "rejected";
        kyc.rejectionReason = reason;
        kyc.verifiedAt = new Date();
        kyc.verifiedBy = req.ftUser._id;
        await kyc.save();

        await FtUser.findByIdAndUpdate(req.params.userId, { kycStatus: "rejected" });

        return res.status(200).json({ success: true, message: "KYC rejected" });
    } catch (err) {
        console.error("[FT KYC] Reject error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
