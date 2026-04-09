const FtReconciliation = require("../../models/fintech/ft_reconciliation.model");

/**
 * @route  GET /api/ft/reconciliation
 * @access Private
 * Fetch list of reconciliation items by status
 */
exports.getReconciliations = async (req, res) => {
    try {
        const { status = "unmatched", page = 1, limit = 20 } = req.query;
        const pageNum = Number(page);
        const limitNum = Number(limit);
        const skip = (pageNum - 1) * limitNum;

        const filter = {
            userId: req.ftUser._id,
        };
        if (status) filter.status = status;

        const [items, totalRecords] = await Promise.all([
            FtReconciliation.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            FtReconciliation.countDocuments(filter),
        ]);

        // Format dates correctly for the UI
        const formattedItems = items.map((item) => ({
            ...item,
            txDate: item.txDate.toISOString().split("T")[0],
            bankDate: item.bankDate.toISOString().split("T")[0],
        }));

        return res.status(200).json({
            success: true,
            data: formattedItems,
            meta: {
                totalRecords,
                totalPages: Math.ceil(totalRecords / limitNum),
                currentPage: pageNum,
            },
        });
    } catch (err) {
        console.error("[FT Recon] getReconciliations error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  POST /api/ft/reconciliation/match-batch
 * @access Private
 * Marks multiple reconciliation records as matched
 */
exports.batchMatch = async (req, res) => {
    try {
        const { ids } = req.body;

        if (!ids || !Array.isArray(ids)) {
            return res.status(400).json({ success: false, message: "A list of IDs is required" });
        }

        const result = await FtReconciliation.updateMany(
            { _id: { $in: ids }, userId: req.ftUser._id },
            { 
              status: "matched", 
              resolvedAt: new Date(),
              notes: "Batch resolved by user" 
            }
        );

        return res.status(200).json({
            success: true,
            message: `Successfully matched ${result.modifiedCount} records`,
            modifiedCount: result.modifiedCount,
        });
    } catch (err) {
        console.error("[FT Recon] batchMatch error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * @route  PUT /api/ft/reconciliation/:id/resolve
 * @access Private
 * Manually force a single item to matched status with audit notes
 */
exports.resolveSingle = async (req, res) => {
    try {
        const { notes = "Manually verified" } = req.body;
        const { id } = req.params;

        const reconciliation = await FtReconciliation.findOne({ _id: id, userId: req.ftUser._id });

        if (!reconciliation) {
            return res.status(404).json({ success: false, message: "Reconciliation record not found" });
        }

        reconciliation.status = "matched";
        reconciliation.notes = notes;
        reconciliation.resolvedAt = new Date();
        await reconciliation.save();

        return res.status(200).json({
            success: true,
            message: "Record resolved successfully",
            data: reconciliation,
        });
    } catch (err) {
        console.error("[FT Recon] resolveSingle error:", err);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};
